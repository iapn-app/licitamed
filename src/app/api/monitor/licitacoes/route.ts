import { NextRequest, NextResponse } from 'next/server';
import { buscarLicitacoesPNCP } from '@/lib/monitor/pncp';
import { scrapeComprasRio, scrapeSeplagRJ, scrapeBLL } from '@/lib/monitor/scrapers';
import type { LicitacaoMonitor, StatusFonte } from '@/lib/monitor/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 45;

// Dados de exemplo exibidos apenas quando TODAS as fontes falham
const SEED_LICITACOES: LicitacaoMonitor[] = [
  {
    id: 'seed-1',
    fonte: 'PNCP',
    orgao: 'Hospital Federal dos Servidores do Estado',
    cnpjOrgao: '00394544018253',
    objeto: 'Aquisição de material médico hospitalar (curativo, dreno, sonda)',
    modalidade: 'Pregão Eletrônico',
    valorEstimado: 380000,
    dataPublicacao: new Date().toISOString().slice(0, 10),
    dataAbertura: new Date(Date.now() + 10 * 86400000).toISOString().slice(0, 10),
    status: 'ativa',
    urlEdital: null,
    municipio: 'Rio de Janeiro',
    uf: 'RJ',
    palavrasEncontradas: ['material médico', 'hospitalar'],
  },
  {
    id: 'seed-2',
    fonte: 'PNCP',
    orgao: 'Secretaria de Saúde do Estado do Rio de Janeiro',
    cnpjOrgao: '44267353000163',
    objeto: 'Fornecimento de medicamentos para tratamento de doenças crônicas',
    modalidade: 'Pregão Eletrônico',
    valorEstimado: 1200000,
    dataPublicacao: new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10),
    dataAbertura: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    status: 'ativa',
    urlEdital: null,
    municipio: 'Rio de Janeiro',
    uf: 'RJ',
    palavrasEncontradas: ['medicamentos'],
  },
  {
    id: 'seed-3',
    fonte: 'PNCP',
    orgao: 'Hospital Universitário Pedro Ernesto - UERJ',
    cnpjOrgao: '33132044000109',
    objeto: 'Aquisição de equipamentos médico-hospitalares para UTI neonatal',
    modalidade: 'Pregão Eletrônico',
    valorEstimado: 650000,
    dataPublicacao: new Date(Date.now() - 5 * 86400000).toISOString().slice(0, 10),
    dataAbertura: new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10),
    status: 'ativa',
    urlEdital: null,
    municipio: 'Rio de Janeiro',
    uf: 'RJ',
    palavrasEncontradas: ['equipamentos médico-hospitalares', 'UTI'],
  },
  {
    id: 'seed-4',
    fonte: 'PNCP',
    orgao: 'Prefeitura Municipal do Rio de Janeiro - SMS',
    cnpjOrgao: '42498733000148',
    objeto: 'Contratação de serviços de saúde — insumos laboratoriais e diagnóstico',
    modalidade: 'Pregão Eletrônico',
    valorEstimado: 920000,
    dataPublicacao: new Date(Date.now() - 8 * 86400000).toISOString().slice(0, 10),
    dataAbertura: new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10),
    status: 'ativa',
    urlEdital: null,
    municipio: 'Rio de Janeiro',
    uf: 'RJ',
    palavrasEncontradas: ['saúde', 'laboratorial', 'diagnóstico'],
  },
  {
    id: 'seed-5',
    fonte: 'PNCP',
    orgao: 'Instituto Nacional de Traumatologia e Ortopedia',
    cnpjOrgao: '00394544008427',
    objeto: 'Aquisição de órteses, próteses e materiais especiais (OPME) para cirurgias',
    modalidade: 'Pregão Eletrônico',
    valorEstimado: 2100000,
    dataPublicacao: new Date(Date.now() - 12 * 86400000).toISOString().slice(0, 10),
    dataAbertura: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10),
    status: 'ativa',
    urlEdital: null,
    municipio: 'Rio de Janeiro',
    uf: 'RJ',
    palavrasEncontradas: ['OPME', 'cirúrgico'],
  },
];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const uf = searchParams.get('uf') ?? 'RJ';
  const keyword = searchParams.get('keyword') ?? '';
  const fonte = searchParams.get('fonte') ?? '';
  const dataInicial = searchParams.get('dataInicial') ?? '';
  const dataFinal = searchParams.get('dataFinal') ?? '';

  console.log('Monitor licitacoes: iniciando busca', { uf, keyword, fonte });

  const [pncpResult, comprasrioResult, seplagResult, bllResult] = await Promise.allSettled([
    buscarLicitacoesPNCP({ uf, paginas: 3 }),
    scrapeComprasRio(),
    scrapeSeplagRJ(),
    scrapeBLL(),
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

  for (const [result, fonteId] of [
    [comprasrioResult, 'ComprasRio'],
    [seplagResult, 'SEPLAG-RJ'],
    [bllResult, 'BLL'],
  ] as const) {
    if (result.status === 'fulfilled') {
      dados = dados.concat(result.value.dados);
      fontes.push(result.value.status);
      if (result.value.dados.length > 0) algumaFonteAtiva = true;
    } else {
      console.log(`${fonteId}: falhou`, String(result.reason));
      fontes.push({ fonte: fonteId as StatusFonte['fonte'], ativa: false, erro: String(result.reason), ultimaVerificacao: new Date().toISOString() });
    }
  }

  // Se todas as fontes falharam ou retornaram vazio, usar seed
  if (!algumaFonteAtiva) {
    console.log('Monitor: todas as fontes falharam — usando dados de exemplo');
    dados = SEED_LICITACOES;
    fontes.forEach(f => { f.erro = f.erro ?? 'Indisponível temporariamente'; });
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
