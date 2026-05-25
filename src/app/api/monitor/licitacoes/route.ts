import { NextRequest, NextResponse } from 'next/server';
import { buscarLicitacoesPNCP } from '@/lib/monitor/pncp';
import { scrapeComprasRio, scrapeSeplagRJ, scrapeBLL } from '@/lib/monitor/scrapers';
import type { LicitacaoMonitor, StatusFonte } from '@/lib/monitor/types';

export const runtime = 'nodejs';
export const maxDuration = 45;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const uf = searchParams.get('uf') ?? 'RJ';
  const keyword = searchParams.get('keyword') ?? '';
  const fonte = searchParams.get('fonte') ?? '';
  const dataInicial = searchParams.get('dataInicial') ?? '';
  const dataFinal = searchParams.get('dataFinal') ?? '';

  const [pncpResult, comprasrioResult, seplagResult, bllResult] = await Promise.allSettled([
    buscarLicitacoesPNCP({ uf, paginas: 5 }),
    scrapeComprasRio(),
    scrapeSeplagRJ(),
    scrapeBLL(),
  ]);

  const fontes: StatusFonte[] = [];
  let dados: LicitacaoMonitor[] = [];

  if (pncpResult.status === 'fulfilled') {
    dados = dados.concat(pncpResult.value);
    fontes.push({ fonte: 'PNCP', ativa: true, totalEncontrado: pncpResult.value.length, ultimaVerificacao: new Date().toISOString() });
  } else {
    fontes.push({ fonte: 'PNCP', ativa: false, erro: String(pncpResult.reason), ultimaVerificacao: new Date().toISOString() });
  }

  for (const [result, fonteId] of [
    [comprasrioResult, 'ComprasRio'],
    [seplagResult, 'SEPLAG-RJ'],
    [bllResult, 'BLL'],
  ] as const) {
    if (result.status === 'fulfilled') {
      dados = dados.concat(result.value.dados);
      fontes.push(result.value.status);
    } else {
      fontes.push({ fonte: fonteId as StatusFonte['fonte'], ativa: false, erro: String(result.reason), ultimaVerificacao: new Date().toISOString() });
    }
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

  // Stats
  const hoje = new Date().toISOString().slice(0, 10);
  const trintaDiasAtras = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const encontradasHoje = dados.filter(d => d.dataPublicacao === hoje).length;
  const ultimos30dias = dados.filter(d => d.dataPublicacao >= trintaDiasAtras).length;

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
