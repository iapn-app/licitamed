import { NextRequest, NextResponse } from 'next/server';
import { buscarContratosPNCP } from '@/lib/monitor/pncp';
import { TODOS_SEGMENTOS } from '@/lib/monitor/segmentos';

export const runtime = 'nodejs';
export const maxDuration = 55;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const segmento = searchParams.get('segmento') ?? '';
  const uf = searchParams.get('uf') ?? 'RJ';
  const busca = searchParams.get('busca') ?? '';
  const minContratos = parseInt(searchParams.get('minContratos') ?? '0');
  const minValor = parseFloat(searchParams.get('minValor') ?? '0');

  const { vencedores } = await buscarContratosPNCP({ uf, paginas: 10 });

  let dados = vencedores;

  if (segmento) dados = dados.filter(v => v.segmento === segmento);
  if (busca) {
    const q = busca.toLowerCase();
    dados = dados.filter(v =>
      v.razaoSocial.toLowerCase().includes(q) ||
      v.cnpj.includes(q) ||
      (v.nomeFantasia ?? '').toLowerCase().includes(q)
    );
  }
  if (minContratos > 0) dados = dados.filter(v => v.totalContratosRj >= minContratos);
  if (minValor > 0) dados = dados.filter(v => v.valorTotalContratosRj >= minValor);

  const valorTotal = dados.reduce((s, v) => s + v.valorTotalContratosRj, 0);

  // Stats por segmento
  const porSegmento: Record<string, { total: number; valor: number }> = {};
  for (const seg of TODOS_SEGMENTOS) porSegmento[seg] = { total: 0, valor: 0 };
  for (const v of dados) {
    const s = porSegmento[v.segmento] ?? (porSegmento[v.segmento] = { total: 0, valor: 0 });
    s.total++;
    s.valor += v.valorTotalContratosRj;
  }

  const segmentoLider = Object.entries(porSegmento)
    .sort((a, b) => b[1].total - a[1].total)[0]?.[0] ?? '-';

  const semanaAtras = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
  const novosSemana = dados.filter(v => (v.ultimoContrato ?? '') >= semanaAtras).length;

  return NextResponse.json({
    dados,
    total: dados.length,
    valorTotal,
    segmentoLider,
    novosSemana,
    porSegmento,
    timestamp: new Date().toISOString(),
  });
}
