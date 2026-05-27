import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q');
  const tipo = request.nextUrl.searchParams.get('tipo') ?? 'produto';

  if (!q?.trim()) {
    return NextResponse.json({ erro: 'Parâmetro q é obrigatório' }, { status: 400 });
  }

  const baseUrl = tipo === 'medicamento'
    ? 'https://consultas.anvisa.gov.br/api/consulta/medicamentos/'
    : 'https://consultas.anvisa.gov.br/api/consulta/produtosHospitalares/';

  const isNumero = /^\d{7,}$/.test(q.replace(/\D/g, '')) && q.replace(/\D/g, '').length > 6;
  const filterKey = isNumero ? 'filter[numeroRegistro]' : 'filter[nomeProduto]';
  const params = new URLSearchParams({ count: '20', [filterKey]: q.trim() });

  try {
    const res = await fetch(`${baseUrl}?${params}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        'Referer': 'https://consultas.anvisa.gov.br/',
        'Origin': 'https://consultas.anvisa.gov.br',
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      return NextResponse.json(
        { erro: `ANVISA retornou HTTP ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ erro: `Erro ao consultar ANVISA: ${msg}` }, { status: 502 });
  }
}
