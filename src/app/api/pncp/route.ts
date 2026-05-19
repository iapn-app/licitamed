import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const pagina = searchParams.get("pagina") ?? "1";
  const tamanhoPagina = searchParams.get("tamanhoPagina") ?? "20";

  const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");

  try {
    const url =
      `https://pncp.gov.br/api/consulta/v1/contratacoes/publicacao` +
      `?dataInicial=${today}&dataFinal=${today}` +
      `&codigoModalidadeContratacao=6` +
      `&pagina=${pagina}&tamanhoPagina=${tamanhoPagina}`;

    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(12000),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `API PNCP retornou ${response.status}`, useMock: true },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (err) {
    const isTimeout = err instanceof Error && err.name === "TimeoutError";
    return NextResponse.json(
      {
        error: isTimeout ? "Timeout ao conectar com o PNCP" : "PNCP indisponível",
        useMock: true,
      },
      { status: 503 }
    );
  }
}
