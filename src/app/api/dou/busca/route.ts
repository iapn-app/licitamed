import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

interface DOUPublicacao {
  id: string;
  titulo: string;
  conteudo: string;
  pubDate: string;
  urlTitle: string;
  secao: string;
  edicao: string;
  destacado: boolean;
}

const POWER_MED_TERMOS = ['power med', '42.241.234', '42241234'];
const TERMOS_DESTAQUE = ['licitação', 'pregão', 'contrato', 'OPME', 'hospitalar', 'material médico'];

function toDDMMYYYY(d: Date): string {
  return [
    d.getDate().toString().padStart(2, '0'),
    (d.getMonth() + 1).toString().padStart(2, '0'),
    d.getFullYear(),
  ].join('-');
}

function isDestacado(titulo: string, conteudo: string): boolean {
  const texto = (titulo + ' ' + conteudo).toLowerCase();
  return TERMOS_DESTAQUE.some(t => texto.includes(t.toLowerCase()));
}

function isPowerMed(titulo: string, conteudo: string): boolean {
  const texto = (titulo + ' ' + conteudo).toLowerCase();
  return POWER_MED_TERMOS.some(t => texto.includes(t.toLowerCase()));
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get('q') ?? 'hospitalar').trim();
  const secao = searchParams.get('secao') ?? 'DO3';
  const dias = Math.max(1, Math.min(90, parseInt(searchParams.get('dias') ?? '7')));

  const dtFim = new Date();
  const dtInicio = new Date();
  dtInicio.setDate(dtInicio.getDate() - dias);

  const params = new URLSearchParams({
    q,
    dtInicio: toDDMMYYYY(dtInicio),
    dtFim: toDDMMYYYY(dtFim),
  });
  if (secao !== 'todas') params.set('s', secao);

  const url = `https://www.in.gov.br/acesso-a-informacao/dados-abertos/api/v3/busca?${params}`;
  console.log('DOU: buscando...', url);

  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/json', 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      console.log(`DOU: HTTP ${res.status}`);
      return NextResponse.json({ publicacoes: [], total: 0, erro: `HTTP ${res.status}` });
    }

    const data = await res.json() as {
      total?: { value?: number };
      hits?: Array<Record<string, unknown>>;
      _hits?: Array<Record<string, unknown>>;
    };

    const hits = data.hits ?? data._hits ?? [];
    const publicacoes: DOUPublicacao[] = hits.map((hit, idx) => {
      const s = (hit._source ?? hit) as Record<string, unknown>;
      const titulo = String(s.titulo ?? s.title ?? '');
      const conteudo = String(s.conteudo ?? s.texto ?? s.content ?? '').slice(0, 600);
      return {
        id: String(s.urlTitle ?? s.id ?? `dou-${idx}`),
        titulo,
        conteudo,
        pubDate: String(s.pubDate ?? s.dataPublicacao ?? ''),
        urlTitle: String(s.urlTitle ?? ''),
        secao: String(s.secao ?? s.secaoTitle ?? secao),
        edicao: String(s.edicao ?? s.edicaoExtra ?? ''),
        destacado: isDestacado(titulo, conteudo),
        powerMed: isPowerMed(titulo, conteudo),
      } as DOUPublicacao & { powerMed: boolean };
    });

    const powerMedAlerts = publicacoes.filter(p => (p as DOUPublicacao & { powerMed: boolean }).powerMed);

    console.log(`DOU: ${publicacoes.length} publicações, ${powerMedAlerts.length} alertas Power Med`);
    return NextResponse.json({
      publicacoes,
      total: data.total?.value ?? publicacoes.length,
      powerMedAlerts: powerMedAlerts.length,
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    console.log('DOU: erro', String(e));
    return NextResponse.json({ publicacoes: [], total: 0, erro: String(e) });
  }
}
