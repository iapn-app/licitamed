import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface DadosGovRecord {
  NOME_PRODUTO?: string;
  nome_produto?: string;
  NUMERO_REGISTRO?: string;
  numero_registro?: string;
  RAZAO_SOCIAL?: string;
  razao_social?: string;
  CNPJ?: string;
  cnpj?: string;
  SITUACAO?: string;
  situacao?: string;
  DATA_VENCIMENTO?: string;
  data_vencimento?: string;
  CATEGORIA?: string;
  categoria?: string;
  CLASSE_RISCO?: string;
  classe_risco?: string;
  [key: string]: unknown;
}

interface NormalizedItem {
  nomeProduto: string;
  numeroRegistro: string;
  razaoSocial: string;
  cnpj: string;
  situacao: string;
  dataVencimento: string;
  categoria: string;
  classeRisco: string;
}

function normalizeDadosGov(r: DadosGovRecord): NormalizedItem {
  return {
    nomeProduto: String(r.NOME_PRODUTO ?? r.nome_produto ?? ''),
    numeroRegistro: String(r.NUMERO_REGISTRO ?? r.numero_registro ?? ''),
    razaoSocial: String(r.RAZAO_SOCIAL ?? r.razao_social ?? ''),
    cnpj: String(r.CNPJ ?? r.cnpj ?? ''),
    situacao: String(r.SITUACAO ?? r.situacao ?? ''),
    dataVencimento: String(r.DATA_VENCIMENTO ?? r.data_vencimento ?? ''),
    categoria: String(r.CATEGORIA ?? r.categoria ?? ''),
    classeRisco: String(r.CLASSE_RISCO ?? r.classe_risco ?? ''),
  };
}

function normalizeAnvisa(r: Record<string, unknown>): NormalizedItem {
  const emp = (r.empresa ?? {}) as Record<string, unknown>;
  return {
    nomeProduto: String(r.nomeProduto ?? r.nome ?? ''),
    numeroRegistro: String(r.numeroRegistro ?? r.numero ?? ''),
    razaoSocial: String(emp.razaoSocial ?? r.razaoSocial ?? ''),
    cnpj: String(emp.cnpj ?? r.cnpj ?? ''),
    situacao: String(r.situacao ?? r.situacaoRegistro ?? ''),
    dataVencimento: String(r.dataVencimento ?? r.vencimento ?? ''),
    categoria: String(r.categoria ?? r.categoriaRegulatoria ?? ''),
    classeRisco: String(r.classeRisco ?? r.classe ?? ''),
  };
}

async function searchDadosGov(termo: string): Promise<NormalizedItem[]> {
  const params = new URLSearchParams({
    resource_id: 'be8a27db-c87c-4d89-88c2-a5e4d6a9c0d9',
    q: termo,
    limit: '20',
  });
  const res = await fetch(`https://dados.gov.br/api/3/action/datastore_search?${params}`, {
    headers: { Accept: 'application/json', 'User-Agent': 'LicitaMed/1.0' },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) return [];
  const data = await res.json() as { success?: boolean; result?: { records?: DadosGovRecord[] } };
  if (!data.success || !Array.isArray(data.result?.records)) return [];
  return data.result.records.map(normalizeDadosGov);
}

async function searchAnvisaDirect(termo: string, tipo: string): Promise<NormalizedItem[]> {
  const baseUrl = tipo === 'medicamento'
    ? 'https://consultas.anvisa.gov.br/api/consulta/medicamentos/'
    : 'https://consultas.anvisa.gov.br/api/consulta/produtosHospitalares/';
  const isNumero = /^\d{7,}$/.test(termo.replace(/\D/g, '')) && termo.replace(/\D/g, '').length > 6;
  const filterKey = isNumero ? 'filter[numeroRegistro]' : 'filter[nomeProduto]';
  const params = new URLSearchParams({ count: '20', [filterKey]: termo });
  const res = await fetch(`${baseUrl}?${params}`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'pt-BR,pt;q=0.9',
      'Referer': 'https://consultas.anvisa.gov.br/',
      'Origin': 'https://consultas.anvisa.gov.br',
    },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) return [];
  const data = await res.json() as { content?: unknown[]; data?: unknown[]; result?: unknown[] };
  const items = (data.content ?? data.data ?? data.result ?? []) as Record<string, unknown>[];
  return items.map(normalizeAnvisa);
}

function dedup(items: NormalizedItem[]): NormalizedItem[] {
  const seen = new Set<string>();
  return items.filter(item => {
    const key = item.numeroRegistro || `${item.nomeProduto}|${item.cnpj}`;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q');
  const tipo = request.nextUrl.searchParams.get('tipo') ?? 'produto';

  if (!q?.trim()) {
    return NextResponse.json({ erro: 'Parâmetro q é obrigatório' }, { status: 400 });
  }

  // Split comma-separated terms, deduplicate, filter empty
  const termos = Array.from(new Set(
    q.split(',').map(t => t.trim()).filter(t => t.length > 0)
  ));

  // officialUrl uses first term (or full query if single)
  const primeiroTermo = termos[0] ?? q.trim();
  const officialUrl = tipo === 'medicamento'
    ? `https://consultas.anvisa.gov.br/#/medicamentos/?nomeProduto=${encodeURIComponent(primeiroTermo)}`
    : `https://consultas.anvisa.gov.br/#/produtosHospitalares/?nomeProduto=${encodeURIComponent(primeiroTermo)}`;

  // Try dados.gov.br in parallel for all terms
  try {
    const resultSets = await Promise.all(termos.map(t => searchDadosGov(t)));
    const combined = dedup(resultSets.flat());
    if (combined.length > 0) {
      return NextResponse.json({ content: combined, fonte: 'dados.gov.br', officialUrl });
    }
  } catch {
    // fall through
  }

  // Fallback: try ANVISA direct with browser headers (may get 403 on cloud, but worth trying)
  try {
    const resultSets = await Promise.all(termos.map(t => searchAnvisaDirect(t, tipo)));
    const combined = dedup(resultSets.flat());
    if (combined.length > 0) {
      return NextResponse.json({ content: combined, fonte: 'anvisa', officialUrl });
    }
  } catch {
    // fall through
  }

  // Last resort: open official site
  return NextResponse.json({ fallback: true, officialUrl });
}
