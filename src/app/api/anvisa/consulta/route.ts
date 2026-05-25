import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 30;

interface ANVISAItem {
  numeroRegistro: string;
  nomeProduto: string;
  razaoSocial: string;
  cnpj: string;
  situacao: string;
  dataVencimento: string;
  categoria: string;
  classeRisco: string;
}

// In-memory cache: 1 hour TTL
const cache = new Map<string, { data: ANVISAItem[]; ts: number }>();
const TTL = 3600_000;

function getCached(key: string) {
  const e = cache.get(key);
  if (e && Date.now() - e.ts < TTL) return e.data;
  return null;
}

function normalize(item: Record<string, unknown>): ANVISAItem {
  const emp = (item.empresa ?? {}) as Record<string, unknown>;
  return {
    numeroRegistro: String(item.numeroRegistro ?? item.numero ?? ''),
    nomeProduto: String(item.nomeProduto ?? item.nome ?? item.produto ?? ''),
    razaoSocial: String(emp.razaoSocial ?? item.razaoSocial ?? item.empresa ?? ''),
    cnpj: String(emp.cnpj ?? item.cnpj ?? ''),
    situacao: String(item.situacao ?? item.situacaoRegistro ?? ''),
    dataVencimento: String(item.dataVencimento ?? item.vencimento ?? ''),
    categoria: String(item.categoria ?? item.categoriaRegulatoria ?? ''),
    classeRisco: String(item.classeRisco ?? item.classe ?? ''),
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get('q') ?? '').trim();
  const tipo = searchParams.get('tipo') === 'medicamento' ? 'medicamento' : 'produto';

  if (!q) {
    return NextResponse.json({ error: 'Parâmetro q obrigatório' }, { status: 400 });
  }

  const cacheKey = `${tipo}::${q.toLowerCase()}`;
  const cached = getCached(cacheKey);
  if (cached) {
    return NextResponse.json({ resultados: cached, total: cached.length, cached: true });
  }

  const endpoint = tipo === 'medicamento'
    ? 'https://consultas.anvisa.gov.br/api/consulta/medicamentos/'
    : 'https://consultas.anvisa.gov.br/api/consulta/produtosHospitalares/';

  const isNumero = /^\d{7,15}$/.test(q.replace(/\D/g, '')) && q.replace(/\D/g, '').length > 6;
  const filterKey = isNumero ? 'filter[numeroRegistro]' : 'filter[nomeProduto]';

  const params = new URLSearchParams({ count: '20', [filterKey]: q });
  const url = `${endpoint}?${params}`;

  console.log('ANVISA: buscando...', url);

  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/json', Authorization: 'Guest' },
      signal: AbortSignal.timeout(12000),
    });

    if (!res.ok) {
      console.log(`ANVISA: HTTP ${res.status}`);
      return NextResponse.json({ resultados: [], total: 0, erro: `HTTP ${res.status}` });
    }

    const data = await res.json() as { content?: unknown[]; data?: unknown[]; result?: unknown[] };
    const items = (data.content ?? data.data ?? data.result ?? []) as Record<string, unknown>[];
    const resultados = items.map(normalize);

    console.log(`ANVISA: ${resultados.length} resultados`);
    cache.set(cacheKey, { data: resultados, ts: Date.now() });

    return NextResponse.json({ resultados, total: resultados.length, timestamp: new Date().toISOString() });
  } catch (e) {
    console.log('ANVISA: erro', String(e));
    return NextResponse.json({ resultados: [], total: 0, erro: String(e) });
  }
}
