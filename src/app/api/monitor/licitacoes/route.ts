import { NextRequest, NextResponse } from 'next/server';
import { buscarLicitacoesPNCP } from '@/lib/monitor/pncp';
import { scrapeLicitacoesE } from '@/lib/monitor/scrapers';
import { temPalavraChave } from '@/lib/monitor/keywords';
import type { LicitacaoMonitor, StatusFonte } from '@/lib/monitor/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 45;


export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const uf = searchParams.get('uf') ?? 'RJ';
  const keyword = searchParams.get('keyword') ?? '';
  const fonte = searchParams.get('fonte') ?? '';
  const dataInicial = searchParams.get('dataInicial') ?? '';
  const dataFinal = searchParams.get('dataFinal') ?? '';

  console.log('Monitor licitacoes: iniciando busca', { uf, keyword, fonte });

  const [pncpResult, licitacoesEResult] = await Promise.allSettled([
    buscarLicitacoesPNCP({ uf, paginas: 5, diasPassados: 90, filtrarKeywords: false }),
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
    console.log('Monitor: todas as fontes falharam — retornando lista vazia');
    fontes.forEach(f => { f.erro = f.erro ?? 'Indisponível temporariamente'; });
  }

  // Filter by health keywords (PNCP brings all RJ — filter here)
  if (algumaFonteAtiva) {
    dados = dados.filter(d => temPalavraChave(d.objeto));
  }

  // Deduplicate by id
  const seen = new Set<string>();
  dados = dados.filter(d => { if (seen.has(d.id)) return false; seen.add(d.id); return true; });

  // Apply filters
  if (keyword) {
    const kw = keyword.toLowerCase();
    dados = dados.filter(d =>
      d.objeto.toLowerCase().includes(kw) ||
      d.orgao.toLowerCase().includes(kw)
    );
  }
  if (fonte) dados = dados.filter(d => d.fonte === fonte);
  if (dataInicial) dados = dados.filter(d => d.dataPublicacao >= dataInicial);
  if (dataFinal) dados = dados.filter(d => d.dataPublicacao <= dataFinal);

  // Sort by dataPublicacao desc
  dados.sort((a, b) => b.dataPublicacao.localeCompare(a.dataPublicacao));

  // Stats — usar horário de Brasília para evitar mismatch com datas do PNCP
  const fmtBrasilia = (d: Date) => new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Sao_Paulo' }).format(d);
  const hoje = fmtBrasilia(new Date());
  const trintaDiasAtras = fmtBrasilia(new Date(Date.now() - 30 * 86400000));
  const encontradasHoje = dados.filter(d => d.dataPublicacao === hoje).length;
  const ultimos30dias = dados.filter(d => d.dataPublicacao >= trintaDiasAtras).length;

  console.log(`Monitor licitacoes: total=${dados.length}, hoje=${encontradasHoje}`);

  return NextResponse.json({
    dados,
    total: dados.length,
    encontradasHoje,
    ultimos30dias,
    fontesAtivas: fontes.filter(f => f.ativa).length,
    fontes,
    timestamp: new Date().toISOString(),
  });
}
