import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 15;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const semFiltro = searchParams.get('semFiltro') === 'true';

  const fmtBrasilia = (d: Date) =>
    new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Sao_Paulo' })
      .format(d)
      .replace(/-/g, '');

  const today = new Date();
  const dataFinal = fmtBrasilia(today);
  const dataInicial = fmtBrasilia(new Date(Date.now() - 90 * 86400000));

  const params = new URLSearchParams({
    dataInicial,
    dataFinal,
    pagina: '1',
    tamanhoPagina: '10',
    codigoModalidadeContratacao: '6',
    uf: 'RJ',
  });

  const baseUrl = process.env.PNCP_PROXY_URL?.trim() || 'https://pncp.gov.br/api/consulta/v1/contratacoes/publicacao';
  const urlObj = new URL(baseUrl);
  params.forEach((value, key) => urlObj.searchParams.set(key, value));
  const url = urlObj.toString();

  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(12000),
    });

    const status = res.status;
    const body = await res.text();

    let parsed: { data?: Record<string, unknown>[]; totalRegistros?: number; totalPaginas?: number } | null = null;
    try { parsed = JSON.parse(body); } catch { /* não é JSON */ }

    const items = parsed?.data ?? [];

    if (semFiltro) {
      return NextResponse.json({
        url,
        httpStatus: status,
        periodo: { dataInicial, dataFinal },
        totalRegistros: parsed?.totalRegistros ?? 0,
        totalPaginas: parsed?.totalPaginas ?? 0,
        itensBrutos: items.slice(0, 5).map(item => ({
          numeroControlePNCP: item.numeroControlePNCP,
          objetoCompra: item.objetoCompra,
          modalidadeNome: item.modalidadeNome,
          dataPublicacaoPncp: item.dataPublicacaoPncp,
          orgao: (item.unidadeOrgao as Record<string, unknown>)?.nomeUnidade ?? (item.orgaoEntidade as Record<string, unknown>)?.razaoSocial,
          municipio: (item.unidadeOrgao as Record<string, unknown>)?.municipioNome,
        })),
      });
    }

    const firstItem = items[0] ?? null;

    return NextResponse.json({
      url,
      httpStatus: status,
      periodo: { dataInicial, dataFinal },
      totalRegistros: parsed?.totalRegistros ?? 0,
      topLevelKeys: parsed ? Object.keys(parsed) : null,
      firstItemKeys: firstItem ? Object.keys(firstItem) : null,
      firstItem,
    });
  } catch (e) {
    return NextResponse.json({ erro: String(e), url });
  }
}
