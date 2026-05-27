import { NextResponse } from 'next/server';
import { buscarLicitacoesPNCP } from '@/lib/monitor/pncp';
import { scrapeLicitacoesE } from '@/lib/monitor/scrapers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 55;

export async function GET() {
  const [pncp, licitacoesE] = await Promise.allSettled([
    buscarLicitacoesPNCP({ uf: 'RJ', paginas: 5 }),
    scrapeLicitacoesE(),
  ]);

  return NextResponse.json({
    ok: true,
    timestamp: new Date().toISOString(),
    pncp: pncp.status === 'fulfilled' ? { total: pncp.value.length } : { erro: String(pncp.reason) },
    licitacoesE: licitacoesE.status === 'fulfilled' ? licitacoesE.value.status : { erro: String(licitacoesE.reason) },
  });
}
