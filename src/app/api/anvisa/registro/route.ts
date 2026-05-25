import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 30;

interface RegistroResult { registro: unknown; encontrado: boolean; timestamp: string }
const cache = new Map<string, { data: RegistroResult; ts: number }>();
const TTL = 3600_000;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const numero = (searchParams.get('numero') ?? '').trim();
  const tipo = searchParams.get('tipo') === 'medicamento' ? 'medicamento' : 'produto';

  if (!numero) {
    return NextResponse.json({ error: 'Parâmetro numero obrigatório' }, { status: 400 });
  }

  const cacheKey = `reg::${tipo}::${numero}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.ts < TTL) {
    return NextResponse.json({ ...cached.data, cached: true });
  }

  const endpoint = tipo === 'medicamento'
    ? 'https://consultas.anvisa.gov.br/api/consulta/medicamentos/'
    : 'https://consultas.anvisa.gov.br/api/consulta/produtosHospitalares/';

  const params = new URLSearchParams({ count: '5', 'filter[numeroRegistro]': numero });
  const url = `${endpoint}?${params}`;

  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/json', Authorization: 'Guest' },
      signal: AbortSignal.timeout(12000),
    });

    if (!res.ok) {
      return NextResponse.json({ erro: `HTTP ${res.status}`, registro: null });
    }

    const data = await res.json() as { content?: unknown[] };
    const items = data.content ?? [];
    const registro = items[0] ?? null;

    const result: RegistroResult = { registro, encontrado: !!registro, timestamp: new Date().toISOString() };
    cache.set(cacheKey, { data: result, ts: Date.now() });

    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ erro: String(e), registro: null });
  }
}
