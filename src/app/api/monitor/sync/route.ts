import { NextResponse } from 'next/server';
import { buscarLicitacoesPNCP } from '@/lib/monitor/pncp';
import { scrapeComprasRio, scrapeSeplagRJ, scrapeBLL } from '@/lib/monitor/scrapers';

export const runtime = 'nodejs';
export const maxDuration = 55;

export async function GET() {
  const [pncp, comprasrio, seplag, bll] = await Promise.allSettled([
    buscarLicitacoesPNCP({ uf: 'RJ', paginas: 5 }),
    scrapeComprasRio(),
    scrapeSeplagRJ(),
    scrapeBLL(),
  ]);

  return NextResponse.json({
    ok: true,
    timestamp: new Date().toISOString(),
    pncp: pncp.status === 'fulfilled' ? { total: pncp.value.length } : { erro: String(pncp.reason) },
    comprasrio: comprasrio.status === 'fulfilled' ? comprasrio.value.status : { erro: String(comprasrio.reason) },
    seplag: seplag.status === 'fulfilled' ? seplag.value.status : { erro: String(seplag.reason) },
    bll: bll.status === 'fulfilled' ? bll.value.status : { erro: String(bll.reason) },
  });
}
