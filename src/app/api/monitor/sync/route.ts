import { NextRequest, NextResponse } from 'next/server';
import { adminSupabase } from '@/lib/supabase';
import { getActiveSources } from '@/lib/monitor/sources';
import type { LicitacaoMonitor } from '@/lib/monitor/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 55;

// ─── Mapeamento camelCase → snake_case para a tabela licitacoes_monitor ───────

function toDbRow(item: LicitacaoMonitor) {
  return {
    id:                   item.id,
    fonte:                item.fonte,
    orgao:                item.orgao,
    cnpj_orgao:           item.cnpjOrgao            ?? null,
    objeto:               item.objeto,
    modalidade:           item.modalidade            ?? null,
    valor_estimado:       item.valorEstimado         ?? null,
    data_publicacao:      item.dataPublicacao,
    data_abertura:        item.dataAbertura          ?? null,
    status:               item.status,
    url_edital:           item.urlEdital             ?? null,
    numero_edital:        item.numeroEdital          ?? null,
    municipio:            item.municipio             ?? null,
    uf:                   item.uf                    ?? null,
    palavras_encontradas: item.palavrasEncontradas   ?? [],
  };
}

// ─── Upsert em lotes (Supabase recomenda ≤ 250 linhas por chamada) ────────────

async function upsertLote(
  db: NonNullable<ReturnType<typeof adminSupabase>>,
  rows: ReturnType<typeof toDbRow>[],
): Promise<{ salvos: number; erro?: string }> {
  const CHUNK = 250;
  let salvos = 0;

  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);
    const { error } = await db
      .from('licitacoes_monitor')
      .upsert(chunk, { onConflict: 'id' });

    if (error) {
      console.error('Sync: erro no upsert lote', i / CHUNK + 1, error.message);
      return { salvos, erro: error.message };
    }
    salvos += chunk.length;
  }

  return { salvos };
}

// ─── POST /api/monitor/sync — dispara a sincronização ─────────────────────────
// Query params opcionais:
//   uf           → sigla do estado (vazio = Brasil todo)
//   diasPassados → janela histórica em dias (padrão: 7)

export async function POST(req: NextRequest) {
  const inicioGeral = Date.now();
  const db = adminSupabase();

  if (!db) {
    return NextResponse.json(
      { erro: 'SUPABASE_SERVICE_ROLE_KEY não configurada — sync indisponível' },
      { status: 500 },
    );
  }

  const { searchParams } = new URL(req.url);
  const uf = searchParams.get('uf') ?? '';
  const diasPassados = Math.min(Number(searchParams.get('diasPassados') ?? '7'), 30);

  console.log(`Sync: iniciando | uf=${uf || 'Brasil todo'} | dias=${diasPassados}`);

  const sources = getActiveSources();
  const resultadosPorFonte: Array<{
    fonte: string;
    totalBuscado: number;
    totalSalvo: number;
    totalDescartado: number;
    motivosDescarte: Record<string, number>;
    duracaoMs: number;
    status: 'sucesso' | 'parcial' | 'erro';
    erro?: string;
  }> = [];

  let totalSalvoGlobal = 0;
  let statusGeral: 'sucesso' | 'parcial' | 'erro' = 'sucesso';

  for (const source of sources) {
    const inicioFonte = Date.now();
    const nomeFonte = source.getName();

    try {
      console.log(`Sync: buscando fonte=${nomeFonte}...`);

      const { dados, log } = await source.fetch({
        uf,
        diasPassados,
        filtrarKeywords: true,
      });

      console.log(
        `Sync: fonte=${nomeFonte} | buscado=${log.totalBuscado} | aproveitado=${dados.length} | descartado=${log.totalDescartado}`,
      );

      // Upsert no banco
      const rows = dados.map(toDbRow);
      const { salvos, erro: erroUpsert } = rows.length > 0
        ? await upsertLote(db, rows)
        : { salvos: 0 };

      const duracaoFonte = Date.now() - inicioFonte;
      const statusFonte: 'sucesso' | 'parcial' | 'erro' = erroUpsert ? 'parcial' : 'sucesso';

      // Registra log desta fonte
      await db.from('monitor_logs').insert({
        fonte:             nomeFonte,
        total_buscado:     log.totalBuscado,
        total_salvo:       salvos,
        total_descartado:  log.totalDescartado,
        motivos_descarte:  log.motivos,
        duracao_ms:        duracaoFonte,
        status:            statusFonte,
        erro:              erroUpsert ?? null,
      });

      resultadosPorFonte.push({
        fonte:            nomeFonte,
        totalBuscado:     log.totalBuscado,
        totalSalvo:       salvos,
        totalDescartado:  log.totalDescartado,
        motivosDescarte:  log.motivos,
        duracaoMs:        duracaoFonte,
        status:           statusFonte,
        ...(erroUpsert ? { erro: erroUpsert } : {}),
      });

      totalSalvoGlobal += salvos;
      if (erroUpsert) statusGeral = 'parcial';

    } catch (err) {
      const erroMsg = err instanceof Error ? err.message : String(err);
      const duracaoFonte = Date.now() - inicioFonte;

      console.error(`Sync: falha na fonte ${nomeFonte}:`, erroMsg);

      await db.from('monitor_logs').insert({
        fonte:            nomeFonte,
        total_buscado:    0,
        total_salvo:      0,
        total_descartado: 0,
        motivos_descarte: { erro_execucao: 1 },
        duracao_ms:       duracaoFonte,
        status:           'erro',
        erro:             erroMsg,
      });

      resultadosPorFonte.push({
        fonte:           nomeFonte,
        totalBuscado:    0,
        totalSalvo:      0,
        totalDescartado: 0,
        motivosDescarte: { erro_execucao: 1 },
        duracaoMs:       duracaoFonte,
        status:          'erro',
        erro:            erroMsg,
      });

      // Se pelo menos uma fonte funciona, é 'parcial'; se todas falharam, 'erro'
      if (statusGeral === 'sucesso') statusGeral = 'parcial';
    }
  }

  // Se todas as fontes falharam, promove para 'erro'
  if (resultadosPorFonte.every(r => r.status === 'erro')) {
    statusGeral = 'erro';
  }

  const duracaoTotal = Date.now() - inicioGeral;
  console.log(`Sync: concluído | status=${statusGeral} | totalSalvo=${totalSalvoGlobal} | ${duracaoTotal}ms`);

  return NextResponse.json({
    ok: statusGeral !== 'erro',
    status: statusGeral,
    timestamp: new Date().toISOString(),
    duracaoMs: duracaoTotal,
    totalSalvo: totalSalvoGlobal,
    uf: uf || 'Brasil todo',
    diasPassados,
    fontes: resultadosPorFonte,
  });
}

// ─── GET /api/monitor/sync — histórico dos últimos 20 logs ────────────────────

export async function GET() {
  const db = adminSupabase();

  if (!db) {
    return NextResponse.json(
      { erro: 'SUPABASE_SERVICE_ROLE_KEY não configurada' },
      { status: 500 },
    );
  }

  const { data, error } = await db
    .from('monitor_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    return NextResponse.json({ erro: error.message }, { status: 500 });
  }

  // Última sincronização bem-sucedida
  const ultimaSucesso = (data ?? []).find(l => l.status === 'sucesso' || l.status === 'parcial');

  return NextResponse.json({
    logs: data ?? [],
    total: data?.length ?? 0,
    ultimaSincronizacao: ultimaSucesso?.created_at ?? null,
    timestamp: new Date().toISOString(),
  });
}
