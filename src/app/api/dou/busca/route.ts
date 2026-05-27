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

async function getInlabsSession(): Promise<string | null> {
  const email = process.env.INLABS_EMAIL;
  const password = process.env.INLABS_PASSWORD;
  if (!email || !password) return null;

  const res = await fetch('https://inlabs.in.gov.br/logar.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ email, password }).toString(),
    redirect: 'manual',
    signal: AbortSignal.timeout(10000),
  });

  const setCookie = res.headers.get('set-cookie') ?? '';
  const match = setCookie.match(/PHPSESSID=([^;]+)/);
  return match?.[1] ?? null;
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
    maximoResultados: '20',
  });
  if (secao !== 'todas') params.set('s', secao);

  // INLABS requires authentication — try session auth if credentials are configured
  const sessionId = await getInlabsSession().catch(() => null);
  if (!sessionId) {
    const hasCredentials = !!(process.env.INLABS_EMAIL && process.env.INLABS_PASSWORD);
    console.log('DOU: INLABS sem sessão ativa', hasCredentials ? '(credenciais inválidas)' : '(credenciais não configuradas — adicionar INLABS_EMAIL e INLABS_PASSWORD na Vercel)');
    return NextResponse.json({
      publicacoes: [],
      total: 0,
      erro: hasCredentials
        ? 'Falha ao autenticar no INLABS — verifique INLABS_EMAIL e INLABS_PASSWORD'
        : 'API do DOU requer cadastro gratuito em inlabs.in.gov.br. Configure INLABS_EMAIL e INLABS_PASSWORD na Vercel.',
      inlabsConfigured: hasCredentials,
    });
  }

  const url = `https://inlabs.in.gov.br/acesso-a-informacao/dados-abertos/api/v3/busca?${params}`;
  console.log('DOU (INLABS): buscando...', url);

  try {
    const res = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'Mozilla/5.0',
        Cookie: `PHPSESSID=${sessionId}`,
      },
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
