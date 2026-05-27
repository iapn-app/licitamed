import { NextRequest, NextResponse } from "next/server";

const HOSPITAL_KW = [
  "luva", "gaze", "seringa", "curativo", "máscara", "mascara",
  "soro", "equipo", "avental", "hospitalar", "cirúrgico", "cirurgico",
  "descartável", "descartavel", "epi", "enfermagem", "esteril", "estéril",
  "algodão", "algodao", "atadura", "esparadrapo", "agulha", "cateter",
  "medicamento", "insumo", "material médico", "material medico",
];

interface PNCPItem {
  numeroControlePNCP?: string;
  unidadeOrgao?: { nomeUnidade?: string; municipioNome?: string; ufSigla?: string };
  orgaoEntidade?: { razaoSocial?: string };
  objetoCompra?: string;
  valorTotalEstimado?: number;
  dataPublicacaoPncp?: string;
  dataAberturaProposta?: string;
  linkSistemaOrigem?: string;
}

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const dias = Math.min(90, Math.max(1, parseInt(searchParams.get("dias") ?? "30")));
  const uf   = (searchParams.get("uf") ?? "").toUpperCase();

  const today = new Date();
  const start = new Date(today);
  start.setDate(start.getDate() - dias);
  const fmt = (d: Date) => d.toISOString().slice(0, 10).replace(/-/g, "");

  try {
    const params = new URLSearchParams({
      dataInicial: fmt(start),
      dataFinal: fmt(today),
      pagina: '1',
      tamanhoPagina: '50',
      ...(uf ? { uf } : {}),
    });
    const url = `https://pncp.gov.br/api/pncp/v1/contratacoes/publicacoes?${params}`;

    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(12000),
    });

    if (!res.ok) {
      return NextResponse.json({ useMock: true, error: `PNCP ${res.status}` });
    }

    const raw = await res.json() as { data?: PNCPItem[] };
    let items: PNCPItem[] = raw.data ?? [];

    // Filter by hospital keywords
    items = items.filter((item) => {
      const obj = (item.objetoCompra ?? "").toLowerCase();
      return HOSPITAL_KW.some((kw) => obj.includes(kw));
    });

    const data = items.map((item) => ({
      id: item.numeroControlePNCP ?? Math.random().toString(36).slice(2),
      orgao:
        item.unidadeOrgao?.nomeUnidade ??
        item.orgaoEntidade?.razaoSocial ??
        "Órgão não informado",
      municipio: item.unidadeOrgao?.municipioNome ?? "",
      uf: item.unidadeOrgao?.ufSigla ?? "",
      objeto: item.objetoCompra ?? "",
      valor: item.valorTotalEstimado ?? null,
      data: item.dataPublicacaoPncp ?? "",
      link: item.linkSistemaOrigem ?? "#",
    }));

    return NextResponse.json({ data, useMock: data.length === 0 });
  } catch (err) {
    return NextResponse.json({
      useMock: true,
      error: err instanceof Error ? err.message : "PNCP indisponível",
    });
  }
}
