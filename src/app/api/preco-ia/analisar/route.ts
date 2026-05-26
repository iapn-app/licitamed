import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

interface PNCPItem {
  descricao?: string;
  valorUnitarioEstimado?: number;
  valorTotal?: number;
  quantidade?: number;
  unidadeMedida?: string;
  orgaoEntidade?: { razaoSocial?: string };
  dataInclusao?: string;
}

function removeOutliers(values: number[]): number[] {
  if (values.length < 4) return values;
  const sorted = [...values].sort((a, b) => a - b);
  const q1 = sorted[Math.floor(sorted.length * 0.25)];
  const q3 = sorted[Math.floor(sorted.length * 0.75)];
  const iqr = q3 - q1;
  return sorted.filter(v => v >= q1 - 1.5 * iqr && v <= q3 + 1.5 * iqr);
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function confidence(n: number): 'alta' | 'media' | 'baixa' {
  if (n >= 10) return 'alta';
  if (n >= 4) return 'media';
  return 'baixa';
}

export async function POST(request: NextRequest) {
  const body = await request.json() as { produto?: string; quantidade?: number; unidade?: string };
  const { produto, quantidade = 1 } = body;

  if (!produto?.trim()) {
    return NextResponse.json({ erro: 'Produto obrigatório' }, { status: 400 });
  }

  const palavras = produto.trim().split(/\s+/).slice(0, 4).join(' OR ');

  try {
    const hoje = new Date();
    const dataFim = hoje.toISOString().slice(0, 10).replace(/-/g, '');
    const dataIni = new Date(hoje.setMonth(hoje.getMonth() - 6)).toISOString().slice(0, 10).replace(/-/g, '');

    const params = new URLSearchParams({
      dataInicial: dataIni,
      dataFinal: dataFim,
      pagina: '1',
      tamanhoPagina: '100',
    });

    const url = `https://pncp.gov.br/api/pncp/v1/contratacoes/publicacoes/itens/busca?${params}&q=${encodeURIComponent(palavras)}`;

    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(15000),
    });

    let itens: PNCPItem[] = [];
    if (res.ok) {
      const data = await res.json() as { data?: PNCPItem[]; itens?: PNCPItem[] };
      itens = data.data ?? data.itens ?? [];
    }

    // Fallback: use items endpoint from contratações publicadas
    if (itens.length === 0) {
      const params2 = new URLSearchParams({
        dataInicial: dataIni,
        dataFinal: dataFim,
        pagina: '1',
        tamanhoPagina: '50',
        uf: 'RJ',
      });
      const url2 = `https://pncp.gov.br/api/pncp/v1/contratacoes/publicacoes?${params2}`;
      const res2 = await fetch(url2, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(10000),
      });
      if (res2.ok) {
        const data2 = await res2.json() as { data?: PNCPItem[] };
        const all: PNCPItem[] = data2.data ?? [];
        const termo = produto.toLowerCase();
        itens = all.filter(i =>
          i.descricao?.toLowerCase().includes(termo.split(' ')[0])
        );
      }
    }

    const precos = itens
      .map(i => i.valorUnitarioEstimado ?? (i.valorTotal && i.quantidade ? i.valorTotal / i.quantidade : 0))
      .filter(v => v > 0);

    const semOutliers = removeOutliers(precos);
    const precoMediano = median(semOutliers);
    const precoMin = semOutliers.length > 0 ? Math.min(...semOutliers) : 0;
    const precoMax = semOutliers.length > 0 ? Math.max(...semOutliers) : 0;
    const confianca = confidence(semOutliers.length);

    // Suggested bid price: median with small competitive reduction
    const precoSugerido = precoMediano > 0 ? precoMediano * 0.97 : 0;
    const totalSugerido = precoSugerido * quantidade;

    const referencias = itens.slice(0, 5).map(i => ({
      descricao: i.descricao ?? produto,
      orgao: i.orgaoEntidade?.razaoSocial ?? 'Órgão não informado',
      valorUnitario: i.valorUnitarioEstimado ?? 0,
      data: i.dataInclusao ?? '',
    }));

    return NextResponse.json({
      produto: produto.trim(),
      quantidade,
      precoMediano,
      precoMin,
      precoMax,
      precoSugerido,
      totalSugerido,
      confianca,
      amostras: semOutliers.length,
      referencias,
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    return NextResponse.json({ erro: String(e) }, { status: 500 });
  }
}
