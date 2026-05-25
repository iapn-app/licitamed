import { temPalavraChave, encontrarPalavras } from './keywords';
import type { LicitacaoMonitor, StatusFonte } from './types';

function today(): string { return new Date().toISOString().slice(0, 10); }
function daysAgo(n: number): string {
  const d = new Date(); d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

async function safeFetch(url: string, opts?: RequestInit): Promise<Response | null> {
  try {
    return await fetch(url, { signal: AbortSignal.timeout(12000), ...opts });
  } catch { return null; }
}

// ─── ComprasRio ───────────────────────────────────────────────────────────────

export async function scrapeComprasRio(): Promise<{ dados: LicitacaoMonitor[]; status: StatusFonte }> {
  const statusBase: StatusFonte = { fonte: 'ComprasRio', ativa: false, ultimaVerificacao: new Date().toISOString() };
  try {
    const url = `https://compras.rio.rj.gov.br/api/licitacoes?dtPublicacaoInicial=${daysAgo(30)}&dtPublicacaoFinal=${today()}&page=1&size=50`;
    const res = await safeFetch(url, { headers: { Accept: 'application/json' } });
    if (!res?.ok) return { dados: [], status: { ...statusBase, erro: `HTTP ${res?.status ?? 'timeout'}` } };

    const json = await res.json() as { content?: unknown[]; data?: unknown[] };
    const items = (json.content ?? json.data ?? []) as Record<string, unknown>[];

    const dados: LicitacaoMonitor[] = [];
    for (const item of items) {
      const objeto = String(item.objeto ?? item.descricao ?? item.description ?? '');
      if (!temPalavraChave(objeto)) continue;
      dados.push({
        id: `comprasrio-${item.id ?? item.idLicitacao ?? Math.random().toString(36).slice(2)}`,
        fonte: 'ComprasRio',
        orgao: String(item.orgao ?? item.nomeOrgao ?? item.unidade ?? 'Prefeitura do Rio'),
        objeto,
        modalidade: String(item.modalidade ?? item.tipoLicitacao ?? 'Não informada'),
        valorEstimado: Number(item.valorEstimado ?? item.valor ?? 0) || null,
        dataPublicacao: String(item.dataPublicacao ?? item.dtPublicacao ?? today()).slice(0, 10),
        dataAbertura: item.dataAbertura ? String(item.dataAbertura).slice(0, 10) : null,
        status: 'ativa',
        urlEdital: item.urlEdital ? String(item.urlEdital) : null,
        municipio: 'Rio de Janeiro',
        uf: 'RJ',
        palavrasEncontradas: encontrarPalavras(objeto),
      });
    }

    return { dados, status: { ...statusBase, ativa: true, totalEncontrado: dados.length } };
  } catch (e) {
    return { dados: [], status: { ...statusBase, erro: String(e) } };
  }
}

// ─── SEPLAG-RJ ────────────────────────────────────────────────────────────────

export async function scrapeSeplagRJ(): Promise<{ dados: LicitacaoMonitor[]; status: StatusFonte }> {
  const statusBase: StatusFonte = { fonte: 'SEPLAG-RJ', ativa: false, ultimaVerificacao: new Date().toISOString() };
  try {
    const url = `https://www.licitacoes.rj.gov.br/servlet/hwrpb027?P_TIPO=ALL&P_STATUS=ABE&P_DATAINICIO=${daysAgo(30)}&P_DATAFIM=${today()}`;
    const res = await safeFetch(url, { headers: { Accept: 'application/json' } });
    if (!res?.ok) return { dados: [], status: { ...statusBase, erro: `HTTP ${res?.status ?? 'timeout'}` } };

    const json = await res.json() as { licitacoes?: unknown[] };
    const items = (json.licitacoes ?? []) as Record<string, unknown>[];
    const dados: LicitacaoMonitor[] = [];

    for (const item of items) {
      const objeto = String(item.objeto ?? item.OBJETO ?? '');
      if (!temPalavraChave(objeto)) continue;
      dados.push({
        id: `seplag-${item.numeroLicitacao ?? item.NUMERO ?? Math.random().toString(36).slice(2)}`,
        fonte: 'SEPLAG-RJ',
        orgao: String(item.orgao ?? item.ORGAO ?? 'Governo do Estado RJ'),
        objeto,
        modalidade: String(item.modalidade ?? item.MODALIDADE ?? 'Não informada'),
        valorEstimado: Number(item.valorEstimado ?? item.VALOR ?? 0) || null,
        dataPublicacao: String(item.dataPublicacao ?? item.DATA_PUBLICACAO ?? today()).slice(0, 10),
        dataAbertura: item.dataAbertura ? String(item.dataAbertura).slice(0, 10) : null,
        status: 'ativa',
        urlEdital: item.url ? String(item.url) : null,
        municipio: 'Rio de Janeiro',
        uf: 'RJ',
        palavrasEncontradas: encontrarPalavras(objeto),
      });
    }

    return { dados, status: { ...statusBase, ativa: true, totalEncontrado: dados.length } };
  } catch (e) {
    return { dados: [], status: { ...statusBase, erro: String(e) } };
  }
}

// ─── BLL ──────────────────────────────────────────────────────────────────────

export async function scrapeBLL(): Promise<{ dados: LicitacaoMonitor[]; status: StatusFonte }> {
  const statusBase: StatusFonte = { fonte: 'BLL', ativa: false, ultimaVerificacao: new Date().toISOString() };
  try {
    const url = `https://bllcompras.com/api/v1/licitacoes?uf=RJ&dataInicio=${daysAgo(30)}&dataFim=${today()}&pagina=1&itensPorPagina=50`;
    const res = await safeFetch(url, { headers: { Accept: 'application/json' } });
    if (!res?.ok) return { dados: [], status: { ...statusBase, erro: `HTTP ${res?.status ?? 'timeout'}` } };

    const json = await res.json() as { items?: unknown[]; data?: unknown[] };
    const items = (json.items ?? json.data ?? []) as Record<string, unknown>[];
    const dados: LicitacaoMonitor[] = [];

    for (const item of items) {
      const objeto = String(item.objeto ?? item.descricao ?? '');
      if (!temPalavraChave(objeto)) continue;
      dados.push({
        id: `bll-${item.id ?? Math.random().toString(36).slice(2)}`,
        fonte: 'BLL',
        orgao: String(item.orgao ?? item.municipio ?? 'Município RJ'),
        objeto,
        modalidade: String(item.modalidade ?? 'Não informada'),
        valorEstimado: Number(item.valor ?? item.valorEstimado ?? 0) || null,
        dataPublicacao: String(item.dataPublicacao ?? today()).slice(0, 10),
        dataAbertura: item.dataAbertura ? String(item.dataAbertura).slice(0, 10) : null,
        status: 'ativa',
        urlEdital: item.url ? String(item.url) : null,
        municipio: String(item.municipio ?? ''),
        uf: 'RJ',
        palavrasEncontradas: encontrarPalavras(objeto),
      });
    }

    return { dados, status: { ...statusBase, ativa: true, totalEncontrado: dados.length } };
  } catch (e) {
    return { dados: [], status: { ...statusBase, erro: String(e) } };
  }
}
