import { temPalavraChave, encontrarPalavras } from './keywords';
import type { LicitacaoMonitor, StatusFonte } from './types';

function today(): string { return new Date().toISOString().slice(0, 10); }
function toDateStr(d: Date): string { return d.toISOString().slice(0, 10).replace(/-/g, ''); }

async function safeFetch(url: string, opts?: RequestInit): Promise<Response | null> {
  try {
    return await fetch(url, { signal: AbortSignal.timeout(12000), ...opts });
  } catch { return null; }
}

// ─── Licitações-e (Banco do Brasil) ──────────────────────────────────────────

export async function scrapeLicitacoesE(): Promise<{ dados: LicitacaoMonitor[]; status: StatusFonte }> {
  const statusBase: StatusFonte = { fonte: 'LicitacoesE', ativa: false, ultimaVerificacao: new Date().toISOString() };
  try {
    const url = `https://licitacoes-e.com.br/aop/api/licitacoes?uf=RJ&modalidade=pregao&situacao=aberta`;
    console.log('Licitações-e (BB): buscando...', url);
    const res = await safeFetch(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });
    if (!res?.ok) {
      console.log(`Licitações-e: HTTP ${res?.status ?? 'timeout'}`);
      return { dados: [], status: { ...statusBase, erro: `HTTP ${res?.status ?? 'timeout'}` } };
    }

    const json = await res.json() as { items?: unknown[]; data?: unknown[]; licitacoes?: unknown[]; resultado?: unknown[] };
    const items = (json.items ?? json.data ?? json.licitacoes ?? json.resultado ?? []) as Record<string, unknown>[];
    console.log(`Licitações-e: ${items.length} itens brutos`);

    const dados: LicitacaoMonitor[] = [];
    for (const item of items) {
      const objeto = String(item.objeto ?? item.descricaoObjeto ?? item.descricao ?? '');
      if (!temPalavraChave(objeto)) continue;
      dados.push({
        id: `licitacoese-${item.numeroLicitacao ?? item.id ?? Math.random().toString(36).slice(2)}`,
        fonte: 'LicitacoesE',
        orgao: String(item.orgao ?? item.nomeOrgao ?? item.nomeUnidadeGestora ?? 'Órgão federal RJ'),
        objeto,
        modalidade: String(item.modalidade ?? item.nomeModalidade ?? 'Pregão Eletrônico'),
        valorEstimado: Number(item.valorEstimado ?? item.valor ?? 0) || null,
        dataPublicacao: String(item.dataPublicacao ?? item.dtPublicacao ?? today()).slice(0, 10),
        dataAbertura: item.dataAbertura ? String(item.dataAbertura).slice(0, 10) : null,
        status: 'ativa',
        urlEdital: item.url ?? item.linkEdital ? String(item.url ?? item.linkEdital) : null,
        municipio: String(item.municipio ?? 'Rio de Janeiro'),
        uf: 'RJ',
        palavrasEncontradas: encontrarPalavras(objeto),
      });
    }

    console.log(`Licitações-e: ${dados.length} itens após filtro`);
    return { dados, status: { ...statusBase, ativa: true, totalEncontrado: dados.length } };
  } catch (e) {
    console.log('Licitações-e: erro', String(e));
    return { dados: [], status: { ...statusBase, erro: String(e) } };
  }
}
