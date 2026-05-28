import { NextRequest, NextResponse } from "next/server";

interface ComprasGovItem {
  cnpj?: string;
  nomeRazaoSocialFornecedor?: string;
  nomeMunicipio?: string;
  ufSigla?: string;
  ativo?: boolean;
  habilitadoLicitar?: boolean;
  codigoCnae?: number;
  nomeCnae?: string;
  naturezaJuridicaNome?: string;
  porteEmpresaNome?: string;
}

interface CnpjWsData {
  razao_social?: string;
  estabelecimento?: {
    situacao_cadastral?: string;
    cidade?: { nome?: string };
    estado?: { sigla?: string };
  };
}

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const cnpjRaw = new URL(request.url).searchParams.get("cnpj") ?? "";
  const cnpj = cnpjRaw.replace(/\D/g, "");

  if (cnpj.length !== 14) {
    return NextResponse.json({ error: "CNPJ inválido — informe 14 dígitos" }, { status: 400 });
  }

  // 1. Buscar no ComprasGov (SIASG)
  try {
    const res = await fetch(
      `https://dadosabertos.compras.gov.br/modulo-fornecedor/1_consultarFornecedor?cnpj=${cnpj}&ativo=true&pagina=1&tamanhoPagina=10`,
      { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(10000) }
    );
    if (res.ok) {
      const data = await res.json() as { resultado?: ComprasGovItem[] };
      const emp = data.resultado?.[0];
      if (emp?.cnpj) {
        return NextResponse.json({
          cnpj: emp.cnpj,
          nome: emp.nomeRazaoSocialFornecedor ?? "Não informado",
          municipio: emp.nomeMunicipio ?? "",
          uf: emp.ufSigla ?? "",
          ativo: emp.ativo ?? false,
          habilitadoLicitar: emp.habilitadoLicitar ?? false,
          cnae: emp.codigoCnae ? String(emp.codigoCnae) : null,
          nomeCnae: emp.nomeCnae ?? null,
          naturezaJuridica: emp.naturezaJuridicaNome ?? null,
          porte: emp.porteEmpresaNome ?? null,
          cadastradoSiasg: true,
        });
      }
    }
  } catch { /* fallback */ }

  // 2. Fallback: publica.cnpj.ws
  try {
    const res = await fetch(
      `https://publica.cnpj.ws/cnpj/${cnpj}`,
      { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(10000) }
    );
    if (res.ok) {
      const data = await res.json() as CnpjWsData;
      const est = data.estabelecimento;
      return NextResponse.json({
        cnpj,
        nome: data.razao_social ?? "Não informado",
        municipio: est?.cidade?.nome ?? "",
        uf: est?.estado?.sigla ?? "",
        ativo: est?.situacao_cadastral === "Ativa",
        habilitadoLicitar: false,
        cnae: null,
        nomeCnae: null,
        naturezaJuridica: null,
        porte: null,
        cadastradoSiasg: false,
      });
    }
  } catch { /* não encontrado */ }

  return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });
}
