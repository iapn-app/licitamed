import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 30;
export const dynamic = 'force-dynamic';

const cache = new Map<string, { data: ScoreResult; ts: number }>();
const TTL = 86_400_000; // 24h

interface ContratoPNCP {
  numeroContratoEmpenho?: string;
  objetoContrato?: string;
  valorGlobal?: number;
  dataAssinatura?: string;
  situacaoContrato?: { nome?: string };
  unidadeOrgao?: { nomeUnidade?: string; razaoSocial?: string };
}

export interface ScoreResult {
  cnpj: string;
  nomeOrgao: string;
  score: number;
  classificacao: 'excelente' | 'bom' | 'regular' | 'risco';
  criterios: {
    tempoPagamento: { score: number; diasMedios: number | null; peso: number };
    regularidade: { score: number; percentual: number; peso: number };
    volume: { score: number; total: number; peso: number };
    historico: { score: number; recentes: number; peso: number };
  };
  totalContratos: number;
  contratosAtivos: number;
  contratosRecentes: number;
  irregularidades: boolean;
  ultimosContratos: { numero: string; objeto: string; valor: number; data: string; situacao: string }[];
  recomendacao: string;
  timestamp: string;
  cached?: boolean;
  fontesDados: string[];
}

function cleanCNPJ(cnpj: string) {
  return cnpj.replace(/\D/g, '');
}

function dateFmt(d: Date) {
  return d.toISOString().slice(0, 10).replace(/-/g, '');
}

async function fetchContratosPNCP(cnpj: string): Promise<ContratoPNCP[]> {
  const hoje = new Date();
  const umAno = new Date(hoje);
  umAno.setFullYear(hoje.getFullYear() - 1);

  const url = `https://pncp.gov.br/api/pncp/v1/orgaos/${cnpj}/contratos?dataInicial=${dateFmt(umAno)}&dataFinal=${dateFmt(hoje)}&pagina=1&tamanhoPagina=50`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(12000) });
    if (!res.ok) return [];
    const data = await res.json() as { data?: ContratoPNCP[]; content?: ContratoPNCP[] };
    return data.data ?? data.content ?? [];
  } catch {
    return [];
  }
}

async function fetchDespesasTransparencia(cnpj: string): Promise<{ diasMedios: number | null }> {
  const key = process.env.TRANSPARENCIA_API_KEY;
  if (!key) return { diasMedios: null };

  const hoje = new Date();
  const seisMeses = new Date(hoje);
  seisMeses.setMonth(hoje.getMonth() - 6);
  const fmt = (d: Date) => `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;

  const url = `https://api.portaldatransparencia.gov.br/api-de-dados/despesas/por-orgao?cnpj=${cnpj}&dataInicio=${fmt(seisMeses)}&dataFim=${fmt(hoje)}&pagina=1&tamanhoPagina=50`;
  try {
    const res = await fetch(url, {
      headers: { 'chave-api-dados': key },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return { diasMedios: null };
    const data = await res.json() as Array<{ dataEmpenho?: string; dataPagamento?: string }>;
    if (!Array.isArray(data) || data.length === 0) return { diasMedios: null };
    const pares = data.filter(d => d.dataEmpenho && d.dataPagamento);
    if (pares.length === 0) return { diasMedios: null };
    const totalDias = pares.reduce((acc, d) => {
      const empenho = new Date(d.dataEmpenho!);
      const pag = new Date(d.dataPagamento!);
      return acc + Math.max(0, (pag.getTime() - empenho.getTime()) / 86400000);
    }, 0);
    return { diasMedios: Math.round(totalDias / pares.length) };
  } catch {
    return { diasMedios: null };
  }
}

async function fetchCEIS(cnpj: string): Promise<boolean> {
  const key = process.env.TRANSPARENCIA_API_KEY;
  if (!key) return false;
  try {
    const res = await fetch(
      `https://api.portaldatransparencia.gov.br/api-de-dados/ceis?cnpjSancionado=${cnpj}&pagina=1&tamanhoPagina=1`,
      { headers: { 'chave-api-dados': key }, signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return false;
    const data = await res.json() as unknown[];
    return Array.isArray(data) && data.length > 0;
  } catch {
    return false;
  }
}

function calcular(contratos: ContratoPNCP[], diasMedios: number | null, irregularidades: boolean) {
  const total = contratos.length;
  const agora = Date.now();
  const umAnoMs = 365 * 86400000;

  const recentes = contratos.filter(c =>
    c.dataAssinatura && agora - new Date(c.dataAssinatura).getTime() < umAnoMs
  ).length;

  const comSituacao = contratos.filter(c => c.situacaoContrato?.nome).length;
  const percentual = total > 0 ? Math.round((comSituacao / total) * 100) : 0;

  // Tempo de pagamento (35%)
  let scoreTempo = 50;
  if (diasMedios !== null) {
    if (diasMedios < 30) scoreTempo = 100;
    else if (diasMedios < 60) scoreTempo = 70;
    else if (diasMedios < 90) scoreTempo = 40;
    else scoreTempo = 10;
  }

  // Regularidade (25%)
  let scoreReg = percentual;
  if (irregularidades) scoreReg = Math.max(0, scoreReg - 40);

  // Volume (20%)
  const scoreVol = total >= 50 ? 100 : total >= 20 ? 80 : total >= 10 ? 60 : total >= 5 ? 40 : total >= 1 ? 20 : 0;

  // Histórico recente (20%)
  const scoreHist = recentes >= 20 ? 100 : recentes >= 10 ? 80 : recentes >= 5 ? 60 : recentes >= 2 ? 40 : recentes >= 1 ? 20 : 0;

  const score = Math.min(100, Math.max(0, Math.round(
    scoreTempo * 0.35 + scoreReg * 0.25 + scoreVol * 0.20 + scoreHist * 0.20
  )));

  return {
    score,
    recentes,
    percentual,
    criterios: {
      tempoPagamento: { score: scoreTempo, diasMedios, peso: 35 },
      regularidade: { score: scoreReg, percentual, peso: 25 },
      volume: { score: scoreVol, total, peso: 20 },
      historico: { score: scoreHist, recentes, peso: 20 },
    },
  };
}

export async function GET(request: NextRequest) {
  const cnpj = cleanCNPJ(request.nextUrl.searchParams.get('cnpj') ?? '');

  if (cnpj.length !== 14) {
    return NextResponse.json({ erro: 'CNPJ inválido (14 dígitos sem formatação)' }, { status: 400 });
  }

  const hit = cache.get(cnpj);
  if (hit && Date.now() - hit.ts < TTL) {
    return NextResponse.json({ ...hit.data, cached: true });
  }

  const [contratos, transparencia, irregularidades] = await Promise.all([
    fetchContratosPNCP(cnpj),
    fetchDespesasTransparencia(cnpj),
    fetchCEIS(cnpj),
  ]);

  const { score, recentes, criterios } = calcular(contratos, transparencia.diasMedios, irregularidades);

  const classificacao =
    score >= 80 ? 'excelente' : score >= 60 ? 'bom' : score >= 40 ? 'regular' : 'risco';

  const recomendacao = irregularidades
    ? '⚠️ Avaliar com cautela — irregularidades registradas no CEIS/CNEP'
    : score >= 80 ? '✅ Recomendamos participar — excelente histórico de pagamentos'
    : score >= 60 ? '✅ Recomendamos participar — bom histórico, baixo risco'
    : score >= 40 ? '⚠️ Avaliar com cautela — histórico de pagamentos irregular'
    : '🚫 Alto risco — histórico insuficiente ou problemas de pagamento';

  const nomeOrgao = contratos[0]?.unidadeOrgao?.nomeUnidade
    ?? contratos[0]?.unidadeOrgao?.razaoSocial
    ?? cnpj;

  const ativos = contratos.filter(c => {
    const s = c.situacaoContrato?.nome?.toLowerCase() ?? '';
    return s.includes('vig') || s.includes('exec') || s.includes('ativ');
  }).length;

  const fontesDados = ['PNCP'];
  if (process.env.TRANSPARENCIA_API_KEY) fontesDados.push('Portal da Transparência', 'CEIS/CNEP');

  const result: ScoreResult = {
    cnpj,
    nomeOrgao,
    score,
    classificacao,
    criterios,
    totalContratos: contratos.length,
    contratosAtivos: ativos,
    contratosRecentes: recentes,
    irregularidades,
    ultimosContratos: contratos.slice(0, 5).map(c => ({
      numero: c.numeroContratoEmpenho ?? '—',
      objeto: (c.objetoContrato ?? '').slice(0, 120),
      valor: c.valorGlobal ?? 0,
      data: c.dataAssinatura ?? '',
      situacao: c.situacaoContrato?.nome ?? '—',
    })),
    recomendacao,
    timestamp: new Date().toISOString(),
    fontesDados,
  };

  cache.set(cnpj, { data: result, ts: Date.now() });
  return NextResponse.json(result);
}
