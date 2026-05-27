import { NextRequest, NextResponse } from "next/server";

interface RawFornecedor {
  cnpj?: string;
  nomeRazaoSocialFornecedor?: string;
  nomeMunicipio?: string;
  ufSigla?: string;
  ativo?: boolean;
  habilitadoLicitar?: boolean;
}

interface FornecedorNorm {
  cnpj: string;
  nome: string;
  municipio_descricao: string;
  uf: string;
  ativo: boolean;
  habilitado_licitar: boolean;
}

function normalize(f: RawFornecedor): FornecedorNorm {
  return {
    cnpj: f.cnpj ?? "",
    nome: f.nomeRazaoSocialFornecedor ?? "Nome não informado",
    municipio_descricao: f.nomeMunicipio ?? "",
    uf: f.ufSigla ?? "",
    ativo: f.ativo ?? false,
    habilitado_licitar: f.habilitadoLicitar ?? false,
  };
}

// Realistic mock data shown when the government API is unavailable
const MOCK_FALLBACK: FornecedorNorm[] = [
  {
    cnpj: "12345678000190",
    nome: "MedSupply Distribuidora Hospitalar Ltda",
    municipio_descricao: "São Paulo",
    uf: "SP",
    ativo: true,
    habilitado_licitar: true,
  },
  {
    cnpj: "23456789000181",
    nome: "Farma Rio Distribuidora de Materiais Hospitalares",
    municipio_descricao: "Rio de Janeiro",
    uf: "RJ",
    ativo: true,
    habilitado_licitar: true,
  },
  {
    cnpj: "34567890000172",
    nome: "BH Med Comércio Atacadista de Materiais Hospitalares Ltda",
    municipio_descricao: "Belo Horizonte",
    uf: "MG",
    ativo: true,
    habilitado_licitar: true,
  },
  {
    cnpj: "45678901000163",
    nome: "Sul Médicos Equipamentos e Insumos Hospitalares Ltda",
    municipio_descricao: "Porto Alegre",
    uf: "RS",
    ativo: true,
    habilitado_licitar: false,
  },
  {
    cnpj: "56789012000154",
    nome: "NordMed Distribuidora de Insumos e Correlatos Hospitalares",
    municipio_descricao: "Salvador",
    uf: "BA",
    ativo: true,
    habilitado_licitar: true,
  },
  {
    cnpj: "67890123000145",
    nome: "Capital Saúde Comércio de Produtos Médico-Hospitalares SA",
    municipio_descricao: "Brasília",
    uf: "DF",
    ativo: true,
    habilitado_licitar: true,
  },
];

const ALL_CNAES = ["4645101", "4664800", "4644301", "4645102", "4684201"];

async function fetchByCnae(cnae: string, uf: string): Promise<FornecedorNorm[]> {
  const apiUrl = new URL(
    "https://dadosabertos.compras.gov.br/modulo-fornecedor/1_consultarFornecedor"
  );
  apiUrl.searchParams.set("codigoCnae", cnae);
  apiUrl.searchParams.set("ativo", "true");
  apiUrl.searchParams.set("pagina", "1");
  apiUrl.searchParams.set("tamanhoPagina", "500");

  const response = await fetch(apiUrl.toString(), {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) return [];

  const raw = await response.json() as { resultado?: RawFornecedor[] };
  return (raw?.resultado ?? []).map(normalize).filter((f) => f.ativo && f.uf === uf);
}

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const cnae = searchParams.get("cnae");
  const uf = searchParams.get("uf");

  if (!uf) {
    return NextResponse.json(
      { error: "Parâmetro obrigatório: uf" },
      { status: 400 }
    );
  }

  try {
    // "Todas as categorias": fetch all unique CNAEs in parallel and deduplicate
    if (!cnae || cnae === "all") {
      const results = await Promise.allSettled(
        ALL_CNAES.map((c) => fetchByCnae(c, uf))
      );
      const allFailed = results.every((r) => r.status === "rejected");
      if (allFailed) {
        return NextResponse.json({ fornecedores: MOCK_FALLBACK, useMock: true });
      }
      const seen = new Set<string>();
      const filtered: FornecedorNorm[] = [];
      for (const r of results) {
        if (r.status === "fulfilled") {
          for (const f of r.value) {
            if (!seen.has(f.cnpj)) {
              seen.add(f.cnpj);
              filtered.push(f);
            }
          }
        }
      }
      return NextResponse.json({ fornecedores: filtered });
    }

    // Categoria específica: comportamento original
    const apiUrl = new URL(
      "https://dadosabertos.compras.gov.br/modulo-fornecedor/1_consultarFornecedor"
    );
    apiUrl.searchParams.set("codigoCnae", cnae);
    apiUrl.searchParams.set("ativo", "true");
    apiUrl.searchParams.set("pagina", "1");
    apiUrl.searchParams.set("tamanhoPagina", "500");

    const response = await fetch(apiUrl.toString(), {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      return NextResponse.json({ fornecedores: MOCK_FALLBACK, useMock: true });
    }

    const raw = await response.json() as { resultado?: RawFornecedor[] };
    const all: FornecedorNorm[] = (raw?.resultado ?? []).map(normalize);
    const filtered = all.filter((f) => f.ativo && f.uf === uf);

    return NextResponse.json({ fornecedores: filtered });
  } catch (err) {
    if (err instanceof Error && err.name === "TimeoutError") {
      return NextResponse.json({ fornecedores: MOCK_FALLBACK, useMock: true });
    }
    return NextResponse.json({ fornecedores: MOCK_FALLBACK, useMock: true });
  }
}
