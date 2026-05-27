import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 15;

export async function GET() {
  const today = new Date();
  const fmt = (d: Date) => d.toISOString().slice(0, 10).replace(/-/g, '');
  const dataFinal = fmt(today);
  const dataInicial = fmt(new Date(Date.now() - 7 * 86400000));

  const params = new URLSearchParams({
    dataInicial,
    dataFinal,
    pagina: '1',
    tamanhoPagina: '10',
    codigoModalidadeContratacao: '6',
    uf: 'RJ',
  });

  const proxyUrl = process.env.PNCP_PROXY_URL;
  const url = proxyUrl
    ? `${proxyUrl}/?${params}`
    : `https://pncp.gov.br/api/consulta/v1/contratacoes/publicacao?${params}`;

  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(10000),
    });

    const status = res.status;
    const contentType = res.headers.get('content-type') ?? '';
    const body = await res.text();

    let parsed: unknown = null;
    try { parsed = JSON.parse(body); } catch { /* não é JSON */ }

    const firstItem = (parsed && typeof parsed === 'object' && 'data' in (parsed as object))
      ? (parsed as { data: unknown[] }).data?.[0]
      : null;

    return NextResponse.json({
      url,
      httpStatus: status,
      contentType,
      bodySlice: body.slice(0, 500),
      parsed: !!parsed,
      topLevelKeys: parsed && typeof parsed === 'object' ? Object.keys(parsed as object) : null,
      firstItemKeys: firstItem && typeof firstItem === 'object' ? Object.keys(firstItem as object) : null,
      firstItem,
    });
  } catch (e) {
    return NextResponse.json({ erro: String(e), url });
  }
}
