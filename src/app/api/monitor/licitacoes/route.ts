import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { buscarLicitacoesPNCP } from '@/lib/monitor/pncp';
import { scrapeLicitacoesE } from '@/lib/monitor/scrapers';
import { temPalavraChave } from '@/lib/monitor/keywords';
import type { LicitacaoMonitor, StatusFonte, FonteMonitor } from '@/lib/monitor/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtBrasilia = (d: Date) =>
  new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Sao_Paulo' }).format(d);

function calcStats(dados: LicitacaoMonitor[]) {
  const hoje = fmtBrasilia(new Date());
  const trintaDiasAtras = fmtBrasilia(new Date(Date.now() - 30 * 86400000));
  return {
    encontradasHoje: dados.filter(d => d.dataPublicacao === hoje).length,
    ultimos30dias:   dados.filter(d => d.dataPublicacao >= trintaDiasAtras).length,
  };
}

// Constrói o array StatusFonte a partir dos dados (usado quando resposta vem do banco)
function fontesFromDados(dados: LicitacaoMonitor[], ultimaVerificacao: string): StatusFonte[] {
  const counts: Partial<Record<FonteMonitor, number>> = {};
  for (const d of dados) {
    counts[d.fonte] = (counts[d.fonte] ?? 0) + 1;
  }
  return Object.entries(counts).map(([fonte, total]) => ({
    fonte: fonte as FonteMonitor,
    ativa: true,
    totalEncontrado: total,
    ultimaVerificacao,
  }));
}

// ─── Tipo das linhas retornadas pelo Supabase ─────────────────────────────────

type DbRow = {
  id: string;
  fonte: string;
  orgao: string;
  cnpj_orgao: string | null;
  objeto: string;
  modalidade: string | null;
  valor_estimado: number | null;
  data_publicacao: string;
  data_abertura: string | null;
  status: string;
  url_edital: string | null;
  numero_edital: string | null;
  municipio: string | null;
  uf: string | null;
  palavras_encontradas: string[] | null;
};

function fromDbRow(row: DbRow): LicitacaoMonitor {
  return {
    id:                 row.id,
    fonte:              row.fonte as FonteMonitor,
    orgao:              row.orgao,
    cnpjOrgao:          row.cnpj_orgao ?? undefined,
    objeto:             row.objeto,
    modalidade:         row.modalidade ?? 'Não informada',
    valorEstimado:      row.valor_estimado ?? null,
    dataPublicacao:     String(row.data_publicacao).slice(0, 10),
    dataAbertura:       row.data_abertura ? String(row.data_abertura).slice(0, 10) : null,
    status:             row.status,
    urlEdital:          row.url_edital   ?? null,
    numeroEdital:       row.numero_edital ?? null,
    municipio:          row.municipio    ?? null,
    uf:                 row.uf           ?? null,
    palavrasEncontradas: row.palavras_encontradas ?? [],
  };
}

// ─── Params parse ─────────────────────────────────────────────────────────────

interface QueryParams {
  uf:          string;
  keyword:     string;
  fonte:       string;
  status:      string;
  dataInicial: string;
  dataFinal:   string;
}

function parseParams(searchParams: URLSearchParams): QueryParams {
  return {
    uf:          searchParams.get('uf')          ?? '',
    keyword:     searchParams.get('keyword')     ?? '',
    fonte:       searchParams.get('fonte')        ?? '',
    status:      searchParams.get('status')      ?? '',
    // aceita tanto 'dataInicial' (UI atual) quanto 'data_inicio' (nova convenção)
    dataInicial: searchParams.get('dataInicial') || searchParams.get('data_inicio') || '',
    dataFinal:   searchParams.get('dataFinal')   || searchParams.get('data_fim')    || '',
  };
}

// ─── Busca no banco (DB-first) ────────────────────────────────────────────────

interface BancResult {
  dados: LicitacaoMonitor[];
  totalNoBanco: number;
  ultimaSincronizacao: string | null;
}

async function buscarNoBanco(p: QueryParams): Promise<BancResult | null> {
  try {
    // Busca última sincronização bem-sucedida em paralelo com os dados
    const [dataQuery, syncQuery] = await Promise.all([
      (() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let q = (supabase as any)
          .from('licitacoes_monitor')
          .select('*', { count: 'exact' })
          .order('data_publicacao', { ascending: false })
          .limit(1000);

        if (p.uf)          q = q.eq('uf', p.uf);
        if (p.fonte)       q = q.eq('fonte', p.fonte);
        if (p.status)      q = q.eq('status', p.status);
        if (p.dataInicial) q = q.gte('data_publicacao', p.dataInicial);
        if (p.dataFinal)   q = q.lte('data_publicacao', p.dataFinal);
        if (p.keyword) {
          const kw = p.keyword.replace(/'/g, "''"); // escapa aspas simples
          q = q.or(
            `objeto.ilike.%${kw}%,orgao.ilike.%${kw}%,municipio.ilike.%${kw}%,numero_edital.ilike.%${kw}%`,
          );
        }

        return q;
      })(),

      supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from('monitor_logs' as any)
        .select('created_at')
        .in('status', ['sucesso', 'parcial'])
        .order('created_at', { ascending: false })
        .limit(1),
    ]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error, count } = dataQuery as any;

    if (error) {
      console.log('Monitor: erro ao consultar banco —', error.message, '— usando busca ao vivo');
      return null;
    }

    // Se DB está vazio para este filtro, aciona fallback
    if (!data || data.length === 0) {
      console.log('Monitor: banco vazio para os filtros — usando busca ao vivo');
      return null;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const syncData = (syncQuery as any).data;
    const ultimaSincronizacao: string | null = syncData?.[0]?.created_at ?? null;

    const dados = (data as DbRow[]).map(fromDbRow);
    console.log(`Monitor: ${dados.length} registros retornados do banco (total com filtros: ${count ?? dados.length})`);

    return { dados, totalNoBanco: count ?? dados.length, ultimaSincronizacao };
  } catch (err) {
    console.log('Monitor: exceção ao consultar banco —', String(err), '— usando busca ao vivo');
    return null;
  }
}

// ─── Busca ao vivo (fallback — lógica original preservada) ───────────────────

async function buscarAoVivo(p: QueryParams): Promise<NextResponse> {
  const { uf, keyword, fonte, dataInicial, dataFinal } = p;

  // Janela histórica: 30 dias quando há palavra-chave, 3 dias na navegação padrão
  let diasPassados = keyword ? 30 : 3;
  if (dataInicial) {
    const inicio = new Date(dataInicial + 'T12:00:00');
    const fim    = dataFinal ? new Date(dataFinal + 'T12:00:00') : new Date();
    const diff   = Math.round((fim.getTime() - inicio.getTime()) / 86400000);
    if (diff > 0) diasPassados = diff;
  }

  console.log('Monitor ao vivo:', { uf: uf || 'Brasil todo', keyword, diasPassados });

  const janelasDias = keyword ? 10 : undefined;

  const [pncpResult, licitacoesEResult] = await Promise.allSettled([
    buscarLicitacoesPNCP({ uf: uf || undefined, diasPassados, filtrarKeywords: false, janelasDias }),
    scrapeLicitacoesE(),
  ]);

  const fontes: StatusFonte[] = [];
  let dados: LicitacaoMonitor[] = [];
  let algumaFonteAtiva = false;

  if (pncpResult.status === 'fulfilled') {
    dados = dados.concat(pncpResult.value);
    fontes.push({ fonte: 'PNCP', ativa: true, totalEncontrado: pncpResult.value.length, ultimaVerificacao: new Date().toISOString() });
    if (pncpResult.value.length > 0) algumaFonteAtiva = true;
  } else {
    console.log('PNCP: falhou', String(pncpResult.reason));
    fontes.push({ fonte: 'PNCP', ativa: false, erro: String(pncpResult.reason), ultimaVerificacao: new Date().toISOString() });
  }

  if (licitacoesEResult.status === 'fulfilled') {
    dados = dados.concat(licitacoesEResult.value.dados);
    fontes.push({ ...licitacoesEResult.value.status, fonte: 'LicitacoesE' });
    if (licitacoesEResult.value.dados.length > 0) algumaFonteAtiva = true;
  } else {
    console.log('LicitacoesE: falhou', String(licitacoesEResult.reason));
    fontes.push({ fonte: 'LicitacoesE', ativa: false, erro: String(licitacoesEResult.reason), ultimaVerificacao: new Date().toISOString() });
  }

  if (!algumaFonteAtiva) {
    fontes.forEach(f => { f.erro = f.erro ?? 'Indisponível temporariamente'; });
  }

  if (algumaFonteAtiva) {
    dados = dados.filter(d => temPalavraChave(d.objeto));
  }

  // Deduplica por id
  const seen = new Set<string>();
  dados = dados.filter(d => { if (seen.has(d.id)) return false; seen.add(d.id); return true; });

  // Filtros adicionais
  if (keyword) {
    const kw = keyword.toLowerCase().replace(/\s+/g, ' ').trim();
    dados = dados.filter(d =>
      d.objeto.toLowerCase().includes(kw) ||
      d.orgao.toLowerCase().includes(kw) ||
      d.modalidade.toLowerCase().includes(kw) ||
      (d.numeroEdital ?? '').toLowerCase().includes(kw) ||
      (d.municipio ?? '').toLowerCase().includes(kw) ||
      d.id.toLowerCase().includes(kw.replace(/\//g, '')),
    );
  }
  if (fonte)       dados = dados.filter(d => d.fonte === fonte);
  if (dataInicial) dados = dados.filter(d => d.dataPublicacao >= dataInicial);
  if (dataFinal)   dados = dados.filter(d => d.dataPublicacao <= dataFinal);

  dados.sort((a, b) => b.dataPublicacao.localeCompare(a.dataPublicacao));

  const { encontradasHoje, ultimos30dias } = calcStats(dados);
  console.log(`Monitor ao vivo: total=${dados.length}, hoje=${encontradasHoje}`);

  return NextResponse.json({
    dados,
    total:           dados.length,
    encontradasHoje,
    ultimos30dias,
    fontesAtivas:    fontes.filter(f => f.ativa).length,
    fontes,
    timestamp:          new Date().toISOString(),
    ultimaSincronizacao: null,
    totalNoBanco:        0,
    origem:              'live' as const,
  });
}

// ─── Handler principal ────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const p = parseParams(new URL(req.url).searchParams);

  // 1. Tenta banco
  const bancResult = await buscarNoBanco(p);

  if (bancResult) {
    const { dados, totalNoBanco, ultimaSincronizacao } = bancResult;
    const { encontradasHoje, ultimos30dias } = calcStats(dados);
    const agora = new Date().toISOString();
    const fontes = fontesFromDados(dados, ultimaSincronizacao ?? agora);

    return NextResponse.json({
      dados,
      total:              dados.length,
      encontradasHoje,
      ultimos30dias,
      fontesAtivas:       fontes.filter(f => f.ativa).length,
      fontes,
      timestamp:          agora,
      ultimaSincronizacao,
      totalNoBanco,
      origem:             'banco' as const,
    });
  }

  // 2. Fallback: busca ao vivo
  return buscarAoVivo(p);
}
