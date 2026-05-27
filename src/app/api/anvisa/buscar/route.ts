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

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q');
  const tipo = request.nextUrl.searchParams.get('tipo') ?? 'produto';

  if (!q?.trim()) {
    return NextResponse.json({ erro: 'Parâmetro q é obrigatório' }, { status: 400 });
  }

  const officialUrl = tipo === 'medicamento'
    ? `https://consultas.anvisa.gov.br/#/medicamentos/?nomeProduto=${encodeURIComponent(q.trim())}`
    : `https://consultas.anvisa.gov.br/#/produtosHospitalares/?nomeProduto=${encodeURIComponent(q.trim())}`;

  // Try dados.gov.br open data API
  try {
    const params = new URLSearchParams({
      resource_id: 'be8a27db-c87c-4d89-88c2-a5e4d6a9c0d9',
      q: q.trim(),
      limit: '20',
    });

    const res = await fetch(`https://dados.gov.br/api/3/action/datastore_search?${params}`, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'LicitaMed/1.0',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (res.ok) {
      const data = await res.json() as {
        success?: boolean;
        result?: { records?: DadosGovRecord[]; total?: number };
      };

      if (data.success && Array.isArray(data.result?.records) && data.result.records.length > 0) {
        const content = data.result.records.map(r => ({
          nomeProduto: String(r.NOME_PRODUTO ?? r.nome_produto ?? ''),
          numeroRegistro: String(r.NUMERO_REGISTRO ?? r.numero_registro ?? ''),
          razaoSocial: String(r.RAZAO_SOCIAL ?? r.razao_social ?? ''),
          cnpj: String(r.CNPJ ?? r.cnpj ?? ''),
          situacao: String(r.SITUACAO ?? r.situacao ?? ''),
          dataVencimento: String(r.DATA_VENCIMENTO ?? r.data_vencimento ?? ''),
          categoria: String(r.CATEGORIA ?? r.categoria ?? ''),
          classeRisco: String(r.CLASSE_RISCO ?? r.classe_risco ?? ''),
        }));
        return NextResponse.json({ content, fonte: 'dados.gov.br', officialUrl });
      }
    }
  } catch {
    // fall through to fallback
  }

  // Fallback: instructs client to open official ANVISA site
  return NextResponse.json({ fallback: true, officialUrl });
}
