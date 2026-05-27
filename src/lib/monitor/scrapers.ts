import { temPalavraChave, encontrarPalavras } from './keywords';
import type { LicitacaoMonitor, StatusFonte } from './types';

function today(): string { return new Date().toISOString().slice(0, 10); }
function toDateStr(d: Date): string { return d.toISOString().slice(0, 10).replace(/-/g, ''); }

async function safeFetch(url: string, opts?: RequestInit): Promise<Response | null> {
  try {
    return await fetch(url, { signal: AbortSignal.timeout(12000), ...opts });
  } catch { return null; }
}

// ─── ComprasRio → BLL API (saúde, RJ) ────────────────────────────────────────

export async function scrapeComprasRio(): Promise<{ dados: LicitacaoMonitor[]; status: StatusFonte }> {
  const statusBase: StatusFonte = { fonte: 'ComprasRio', ativa: false, ultimaVerificacao: new Date().toISOString() };
  try {
    const url = `https://bll.org.br/api/v2/licitacoes?uf=RJ&categoria=saude&status=aberta&pagina=1&itensPorPagina=50`;
    console.log('ComprasRio (via BLL): buscando...', url);
    const res = await safeFetch(url, { headers: { Accept: 'application/json' } });
    if (!res?.ok) {
      console.log(`ComprasRio: HTTP ${res?.status ?? 'timeout'}`);
      return { dados: [], status: { ...statusBase, erro: `HTTP ${res?.status ?? 'timeout'}` } };
    }

    const json = await res.json() as { items?: unknown[]; data?: unknown[]; licitacoes?: unknown[] };
    const items = (json.items ?? json.data ?? json.licitacoes ?? []) as Record<string, unknown>[];
    console.log(`ComprasRio: ${items.length} itens brutos`);

    const dados: LicitacaoMonitor[] = [];
    for (const item of items) {
      const objeto = String(item.objeto ?? item.descricao ?? item.description ?? '');
      if (!temPalavraChave(objeto)) continue;
      dados.push({
        id: `comprasrio-${item.id ?? item.idLicitacao ?? Math.random().toString(36).slice(2)}`,
        fonte: 'ComprasRio',
        orgao: String(item.orgao ?? item.nomeOrgao ?? item.municipio ?? 'Município RJ'),
        objeto,
        modalidade: String(item.modalidade ?? item.tipoLicitacao ?? 'Não informada'),
        valorEstimado: Number(item.valorEstimado ?? item.valor ?? 0) || null,
        dataPublicacao: String(item.dataPublicacao ?? item.dtPublicacao ?? today()).slice(0, 10),
        dataAbertura: item.dataAbertura ? String(item.dataAbertura).slice(0, 10) : null,
        status: 'ativa',
        urlEdital: item.urlEdital ?? item.url ? String(item.urlEdital ?? item.url) : null,
        municipio: String(item.municipio ?? 'Rio de Janeiro'),
        uf: 'RJ',
        palavrasEncontradas: encontrarPalavras(objeto),
      });
    }

    console.log(`ComprasRio: ${dados.length} itens após filtro`);
    return { dados, status: { ...statusBase, ativa: true, totalEncontrado: dados.length } };
  } catch (e) {
    console.log('ComprasRio: erro', String(e));
    return { dados: [], status: { ...statusBase, erro: String(e) } };
  }
}

// ─── SEPLAG-RJ → PNCP filtrado por CNPJ da SES-RJ ───────────────────────────

const SES_RJ_CNPJ = '44267353000163';

export async function scrapeSeplagRJ(): Promise<{ dados: LicitacaoMonitor[]; status: StatusFonte }> {
  const statusBase: StatusFonte = { fonte: 'SEPLAG-RJ', ativa: false, ultimaVerificacao: new Date().toISOString() };
  try {
    const inicio = new Date(); inicio.setDate(inicio.getDate() - 60);
    const dataInicial = toDateStr(inicio);
    const dataFinal = toDateStr(new Date());

    const params = new URLSearchParams({
      dataInicial, dataFinal,
      cnpjOrgao: SES_RJ_CNPJ,
      pagina: '1',
      tamanhoPagina: '50',
    });

    const url = `https://pncp.gov.br/api/pncp/v1/contratacoes/publicacoes?${params}`;
    console.log('SEPLAG-RJ (via PNCP SES-RJ): buscando...', url);

    const res = await safeFetch(url, { headers: { Accept: 'application/json' } });
    if (!res?.ok) {
      console.log(`SEPLAG-RJ: HTTP ${res?.status ?? 'timeout'}`);
      return { dados: [], status: { ...statusBase, erro: `HTTP ${res?.status ?? 'timeout'}` } };
    }

    const json = await res.json() as { data?: Record<string, unknown>[]; totalPaginas?: number };
    const items = json.data ?? [];
    console.log(`SEPLAG-RJ: ${items.length} itens brutos`);

    const dados: LicitacaoMonitor[] = [];
    for (const item of items) {
      const objeto = String(item.objetoCompra ?? item.objeto ?? '');
      if (!temPalavraChave(objeto)) continue;
      dados.push({
        id: `seplag-${item.numeroControlePNCP ?? Math.random().toString(36).slice(2)}`,
        fonte: 'SEPLAG-RJ',
        orgao: String(
          (item.unidadeOrgao as Record<string, unknown>)?.nomeUnidade ??
          (item.orgaoEntidade as Record<string, unknown>)?.razaoSocial ??
          'Secretaria de Saúde RJ'
        ),
        cnpjOrgao: String((item.orgaoEntidade as Record<string, unknown>)?.cnpj ?? SES_RJ_CNPJ),
        objeto,
        modalidade: String(item.modalidadeNome ?? 'Não informada'),
        valorEstimado: Number(item.valorTotalEstimado ?? 0) || null,
        dataPublicacao: String(item.dataPublicacaoPncp ?? today()).slice(0, 10),
        dataAbertura: item.dataAberturaProposta ? String(item.dataAberturaProposta).slice(0, 10) : null,
        status: 'ativa',
        urlEdital: item.linkSistemaOrigem ? String(item.linkSistemaOrigem) : null,
        municipio: String((item.unidadeOrgao as Record<string, unknown>)?.municipioNome ?? 'Rio de Janeiro'),
        uf: 'RJ',
        palavrasEncontradas: encontrarPalavras(objeto),
      });
    }

    console.log(`SEPLAG-RJ: ${dados.length} itens após filtro`);
    return { dados, status: { ...statusBase, ativa: true, totalEncontrado: dados.length } };
  } catch (e) {
    console.log('SEPLAG-RJ: erro', String(e));
    return { dados: [], status: { ...statusBase, erro: String(e) } };
  }
}

// ─── BLL → BLL API (saúde hospitalar, RJ) ────────────────────────────────────

export async function scrapeBLL(): Promise<{ dados: LicitacaoMonitor[]; status: StatusFonte }> {
  const statusBase: StatusFonte = { fonte: 'BLL', ativa: false, ultimaVerificacao: new Date().toISOString() };
  try {
    const url = `https://bll.org.br/api/v2/licitacoes?uf=RJ&status=aberta&pagina=1&itensPorPagina=50`;
    console.log('BLL: buscando...', url);
    const res = await safeFetch(url, { headers: { Accept: 'application/json' } });
    if (!res?.ok) {
      console.log(`BLL: HTTP ${res?.status ?? 'timeout'}`);
      return { dados: [], status: { ...statusBase, erro: `HTTP ${res?.status ?? 'timeout'}` } };
    }

    const json = await res.json() as { items?: unknown[]; data?: unknown[]; licitacoes?: unknown[] };
    const items = (json.items ?? json.data ?? json.licitacoes ?? []) as Record<string, unknown>[];
    console.log(`BLL: ${items.length} itens brutos`);

    const dados: LicitacaoMonitor[] = [];
    for (const item of items) {
      const objeto = String(item.objeto ?? item.descricao ?? '');
      if (!temPalavraChave(objeto)) continue;
      dados.push({
        id: `bll-${item.id ?? Math.random().toString(36).slice(2)}`,
        fonte: 'BLL',
        orgao: String(item.orgao ?? item.nomeOrgao ?? item.municipio ?? 'Município RJ'),
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

    console.log(`BLL: ${dados.length} itens após filtro`);
    return { dados, status: { ...statusBase, ativa: true, totalEncontrado: dados.length } };
  } catch (e) {
    console.log('BLL: erro', String(e));
    return { dados: [], status: { ...statusBase, erro: String(e) } };
  }
}

// ─── Licitações-e (Banco do Brasil) ──────────────────────────────────────────

export async function scrapeLicitacoesE(): Promise<{ dados: LicitacaoMonitor[]; status: StatusFonte }> {
  const statusBase: StatusFonte = { fonte: 'BLL', ativa: false, ultimaVerificacao: new Date().toISOString() };
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
      return { dados: [], status: { ...statusBase, fonte: 'BLL', erro: `HTTP ${res?.status ?? 'timeout'}` } };
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
        fonte: 'BLL',
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
