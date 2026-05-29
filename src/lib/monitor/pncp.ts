import { temPalavraChave, encontrarPalavras } from './keywords';
import type { LicitacaoMonitor, VencedorMonitor, ContratoMonitor } from './types';
import { classificarSegmento } from './segmentos';

// ─── Interfaces internas da API PNCP ─────────────────────────────────────────

interface PNCPItem {
  numeroControlePNCP?: string;
  numeroCompra?: number | string;
  anoCompra?: number | string;
  unidadeOrgao?: { nomeUnidade?: string; municipioNome?: string; ufSigla?: string; codigoUnidade?: string };
  orgaoEntidade?: { razaoSocial?: string; cnpj?: string };
  objetoCompra?: string;
  modalidadeNome?: string;
  valorTotalEstimado?: number;
  dataPublicacaoPncp?: string;
  dataAberturaProposta?: string;
  linkSistemaOrigem?: string;
}

interface PNCPContrato {
  numeroControlePNCP?: string;
  orgaoEntidade?: { razaoSocial?: string; cnpj?: string };
  unidadeOrgao?: { nomeUnidade?: string; municipioNome?: string; ufSigla?: string };
  niFornecedor?: string;
  nomeFornecedor?: string;
  objeto?: string;
  valorInicial?: number;
  dataAssinatura?: string;
  numeroContratoEmpenho?: string;
  modalidadeNome?: string;
  linkSistemaOrigem?: string;
}

// ─── Log de execução exportado ────────────────────────────────────────────────

export interface PNCPBuscaLog {
  totalBuscado: number;       // itens retornados pela API antes de qualquer filtro
  totalDuplicatas: number;    // removidos por serem duplicatas (mesmo id)
  totalDescartado: number;    // removidos por não bater keyword (quando filtrarKeywords=true)
  totalAproveitado: number;   // itens no resultado final
  porModalidade: Record<number, number>; // código da modalidade → qtd de itens brutos
  duracaoMs: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toDateStr(d: Date): string {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Sao_Paulo' })
    .format(d)
    .replace(/-/g, '');
}

// Modalidades: 1=Leilão, 2=Diálogo Competitivo, 3=Concurso, 4=Concorrência,
// 5=Pregão, 6=Pregão Eletrônico, 7=Dispensa Eletrônica, 8=Dispensa,
// 9=Inexigibilidade, 12=Manifestação de Interesse
const MODALIDADES_PNCP = [1, 2, 3, 4, 5, 6, 7, 8, 9, 12];

function mapPNCPItem(item: PNCPItem, ufFallback: string): LicitacaoMonitor {
  const objeto = item.objetoCompra ?? '';
  const numeroEdital = (item.numeroCompra && item.anoCompra)
    ? `${item.numeroCompra}/${item.anoCompra}`
    : null;
  return {
    id: item.numeroControlePNCP ?? `pncp-${Date.now()}-${Math.random()}`,
    fonte: 'PNCP',
    orgao: item.unidadeOrgao?.nomeUnidade ?? item.orgaoEntidade?.razaoSocial ?? 'Órgão não informado',
    cnpjOrgao: item.orgaoEntidade?.cnpj,
    objeto,
    modalidade: item.modalidadeNome ?? 'Não informada',
    valorEstimado: item.valorTotalEstimado ?? null,
    dataPublicacao: item.dataPublicacaoPncp?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
    dataAbertura: item.dataAberturaProposta?.slice(0, 10) ?? null,
    status: 'ativa',
    urlEdital: item.linkSistemaOrigem ?? null,
    numeroEdital,
    municipio: item.unidadeOrgao?.municipioNome ?? null,
    uf: item.unidadeOrgao?.ufSigla ?? ufFallback,
    palavrasEncontradas: encontrarPalavras(objeto),
  };
}

const PNCP_BASE_URL =
  process.env.PNCP_PROXY_URL?.trim() ||
  'https://pncp.gov.br/api/consulta/v1/contratacoes/publicacao';
console.log('PNCP_BASE_URL:', PNCP_BASE_URL);

// ─── Fetch com retry ──────────────────────────────────────────────────────────
// Retenta em: timeout, erro de rede, 429 (rate limit), 5xx (servidor)
// Não retenta em: 4xx (exceto 429), pois indicam requisição inválida

async function fetchComRetry(
  url: string,
  opts: RequestInit,
  maxTentativas = 3,
): Promise<Response> {
  let ultimoErro: unknown;

  for (let tentativa = 1; tentativa <= maxTentativas; tentativa++) {
    try {
      const res = await fetch(url, opts);

      if ((res.status === 429 || res.status >= 500) && tentativa < maxTentativas) {
        const delay = 500 * tentativa; // 500ms, 1000ms
        console.log(`PNCP: HTTP ${res.status} — retry ${tentativa}/${maxTentativas} em ${delay}ms`);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }

      return res;
    } catch (err) {
      ultimoErro = err;
      const isRetryable =
        err instanceof Error &&
        (err.name === 'AbortError' ||
          err.name === 'TimeoutError' ||
          err.message.includes('fetch failed') ||
          err.message.includes('ECONNRESET'));

      if (!isRetryable || tentativa >= maxTentativas) throw err;

      const delay = 500 * tentativa;
      console.log(
        `PNCP: erro de rede (${err instanceof Error ? err.name : String(err)}) — retry ${tentativa}/${maxTentativas} em ${delay}ms`,
      );
      await new Promise(r => setTimeout(r, delay));
    }
  }

  throw ultimoErro;
}

// ─── Busca por modalidade ─────────────────────────────────────────────────────

async function buscarModalidade(
  modalidade: number,
  dataInicial: string,
  dataFinal: string,
  uf: string, // '' = Brasil todo
  porModalidade: Record<number, number>,
): Promise<LicitacaoMonitor[]> {
  // Proxy tem mais latência → timeout maior, mas reduzido para caber em retries
  const timeout = process.env.PNCP_PROXY_URL ? 15000 : 8000;
  const TAMANHO = 50;
  const MAX_PAGINAS = 20; // era 10

  const buildUrl = (pagina: number) => {
    const params = new URLSearchParams({
      dataInicial,
      dataFinal,
      pagina: String(pagina),
      tamanhoPagina: String(TAMANHO),
      codigoModalidadeContratacao: String(modalidade),
    });
    if (uf) params.set('uf', uf); // omitir parâmetro = Brasil todo
    const urlObj = new URL(PNCP_BASE_URL);
    params.forEach((value, key) => urlObj.searchParams.set(key, value));
    return urlObj.toString();
  };

  let res1: Response;
  try {
    res1 = await fetchComRetry(
      buildUrl(1),
      { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(timeout) },
    );
  } catch (err) {
    console.log(`PNCP: modalidade=${modalidade} — falhou após retries: ${String(err)}`);
    return [];
  }

  if (!res1.ok) {
    console.log(`PNCP: HTTP ${res1.status} modalidade=${modalidade}`);
    return [];
  }

  const json1 = await res1.json() as { data?: PNCPItem[]; totalPaginas?: number };
  if (!json1.data?.length) return [];

  const totalPaginas = Math.min(json1.totalPaginas ?? 1, MAX_PAGINAS);
  let todos: PNCPItem[] = Array.from(json1.data ?? []);

  if (totalPaginas > 1) {
    const restantes = await Promise.allSettled(
      Array.from({ length: totalPaginas - 1 }, (_, i) =>
        fetch(buildUrl(i + 2), {
          headers: { Accept: 'application/json' },
          signal: AbortSignal.timeout(timeout),
        })
          .then(r => r.ok ? r.json() as Promise<{ data?: PNCPItem[] }> : Promise.resolve({ data: [] as PNCPItem[] }))
          .then(d => d.data ?? [])
          .catch(() => [] as PNCPItem[]),
      ),
    );
    restantes.forEach(r => {
      if (r.status === 'fulfilled') todos = todos.concat(r.value);
    });
  }

  const itensNestaPagina = todos.length;
  porModalidade[modalidade] = (porModalidade[modalidade] ?? 0) + itensNestaPagina;

  console.log(`PNCP: modalidade=${modalidade} → ${itensNestaPagina} itens (${totalPaginas} págs)`);
  return todos.map(item => mapPNCPItem(item, uf));
}

// ─── Gerador de janelas temporais ─────────────────────────────────────────────
// Divide o período em janelas de N dias para evitar page numbers altos no proxy

function gerarJanelas(
  totalDias: number,
  tamanhoDias: number,
): Array<{ dataInicial: string; dataFinal: string }> {
  const janelas: Array<{ dataInicial: string; dataFinal: string }> = [];
  const now = new Date();
  const cursor = new Date(now);
  const limite = new Date(now.getTime() - totalDias * 86400000);

  while (cursor > limite) {
    const fim = new Date(cursor);
    const ini = new Date(cursor);
    ini.setDate(ini.getDate() - tamanhoDias);
    if (ini < limite) ini.setTime(limite.getTime());
    janelas.push({ dataInicial: toDateStr(ini), dataFinal: toDateStr(fim) });
    cursor.setDate(cursor.getDate() - tamanhoDias);
  }

  return janelas;
}

// ─── buscarLicitacoesPNCPComLog ───────────────────────────────────────────────
// Versão principal que retorna dados + log detalhado (usada pelo sync)

export async function buscarLicitacoesPNCPComLog(options: {
  diasPassados?: number;
  uf?: string;               // '' ou undefined = Brasil todo
  filtrarKeywords?: boolean;
  janelasDias?: number;
  dataAberturaApos?: string; // filtro client-side: yyyy-mm-dd — só itens com abertura após esta data
  dataAberturaAte?: string;  // filtro client-side: yyyy-mm-dd
}): Promise<{ dados: LicitacaoMonitor[]; log: PNCPBuscaLog }> {
  const {
    diasPassados = 30,
    uf = '',
    filtrarKeywords = false,
    janelasDias,
    dataAberturaApos,
    dataAberturaAte,
  } = options;

  const inicio = Date.now();
  const porModalidade: Record<number, number> = {};

  const janelas = janelasDias
    ? gerarJanelas(diasPassados, janelasDias)
    : (() => {
        const now = new Date();
        const ini = new Date(now);
        ini.setDate(now.getDate() - diasPassados);
        return [{ dataInicial: toDateStr(ini), dataFinal: toDateStr(now) }];
      })();

  console.log(`PNCP: ${janelas.length} janela(s) | uf=${uf || 'Brasil todo'} | dias=${diasPassados}`);
  janelas.forEach((j, i) => console.log(`  janela ${i + 1}: ${j.dataInicial} → ${j.dataFinal}`));

  // Janelas sequenciais, modalidades em paralelo dentro de cada janela.
  // Evita sobrecarregar o proxy Cloudflare com muitas conexões simultâneas.
  const resultados: PromiseSettledResult<LicitacaoMonitor[]>[] = [];
  for (const j of janelas) {
    const tarefasJanela = MODALIDADES_PNCP.map(
      m => buscarModalidade(m, j.dataInicial, j.dataFinal, uf, porModalidade),
    );
    const resJanela = await Promise.allSettled(tarefasJanela);
    resultados.push(...resJanela);
  }

  // Deduplica por id e contabiliza
  const seen = new Set<string>();
  let totalBuscado = 0;
  let totalDuplicatas = 0;
  let totalDescartado = 0;
  const resultado: LicitacaoMonitor[] = [];

  for (const r of resultados) {
    if (r.status !== 'fulfilled') {
      console.log('PNCP: tarefa falhou', (r as PromiseRejectedResult).reason);
      continue;
    }
    for (const item of r.value) {
      totalBuscado++;

      if (seen.has(item.id)) {
        totalDuplicatas++;
        continue;
      }
      seen.add(item.id);

      if (filtrarKeywords && !temPalavraChave(item.objeto)) {
        totalDescartado++;
        continue;
      }

      // Filtro client-side por data de abertura de proposta
      if (dataAberturaApos && item.dataAbertura && item.dataAbertura < dataAberturaApos) continue;
      if (dataAberturaAte && item.dataAbertura && item.dataAbertura > dataAberturaAte) continue;

      resultado.push(item);
    }
  }

  resultado.sort((a, b) => b.dataPublicacao.localeCompare(a.dataPublicacao));

  const log: PNCPBuscaLog = {
    totalBuscado,
    totalDuplicatas,
    totalDescartado,
    totalAproveitado: resultado.length,
    porModalidade,
    duracaoMs: Date.now() - inicio,
  };

  console.log(
    `PNCP: buscado=${log.totalBuscado} | dupl=${log.totalDuplicatas} | descartado=${log.totalDescartado} | aproveitado=${log.totalAproveitado} | ${log.duracaoMs}ms`,
  );

  return { dados: resultado, log };
}

// ─── buscarLicitacoesPNCP ─────────────────────────────────────────────────────
// Mantém a assinatura original para compatibilidade com callers existentes.
// Internamente delega para buscarLicitacoesPNCPComLog.

export async function buscarLicitacoesPNCP(options: {
  diasPassados?: number;
  uf?: string;
  paginas?: number;         // parâmetro legado — ignorado internamente
  filtrarKeywords?: boolean;
  janelasDias?: number;
}): Promise<LicitacaoMonitor[]> {
  const { dados } = await buscarLicitacoesPNCPComLog({
    diasPassados: options.diasPassados,
    uf: options.uf,
    filtrarKeywords: options.filtrarKeywords,
    janelasDias: options.janelasDias,
  });
  return dados;
}

// ─── buscarContratosPNCP ──────────────────────────────────────────────────────
// Inalterado — usado pelo módulo de vencedores (fora do escopo desta etapa)

export async function buscarContratosPNCP(options: {
  diasPassados?: number;
  uf?: string;
  paginas?: number;
}): Promise<{ vencedores: VencedorMonitor[]; contratos: ContratoMonitor[]; contratosPorCnpj: Record<string, ContratoMonitor[]> }> {
  const { diasPassados = 90, uf = 'RJ', paginas = 10 } = options;
  const now = new Date();
  const inicio = new Date(now);
  inicio.setDate(now.getDate() - diasPassados);

  const dataInicial = toDateStr(inicio);
  const dataFinal = toDateStr(now);

  const contratosMap = new Map<string, {
    info: VencedorMonitor;
    contratos: ContratoMonitor[];
  }>();

  for (let pagina = 1; pagina <= paginas; pagina++) {
    try {
      const params = new URLSearchParams({
        dataInicial, dataFinal,
        pagina: String(pagina),
        tamanhoPagina: '20',
      });
      if (uf) params.set('ufSigla', uf);

      const res = await fetch(
        `https://pncp.gov.br/api/consulta/v1/contratos/publicacao?${params}`,
        { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(15000) },
      );
      if (!res.ok) break;

      const json = await res.json() as { data?: PNCPContrato[]; totalPaginas?: number };
      const items = json.data ?? [];
      if (items.length === 0) break;

      for (const contrato of items) {
        const cnpj = (contrato.niFornecedor ?? '').replace(/\D/g, '');
        if (!cnpj || cnpj.length !== 14) continue;
        const objeto = contrato.objeto ?? '';
        if (!temPalavraChave(objeto)) continue;

        const valor = contrato.valorInicial ?? 0;
        const existing = contratosMap.get(cnpj);

        if (existing) {
          existing.info.totalContratosRj += 1;
          existing.info.valorTotalContratosRj += valor;
          if (
            contrato.dataAssinatura &&
            (!existing.info.ultimoContrato || contrato.dataAssinatura > existing.info.ultimoContrato)
          ) {
            existing.info.ultimoContrato = contrato.dataAssinatura?.slice(0, 10);
          }
        } else {
          contratosMap.set(cnpj, {
            info: {
              cnpj,
              razaoSocial: contrato.nomeFornecedor ?? 'Empresa não identificada',
              segmento: classificarSegmento(objeto),
              totalContratosRj: 1,
              valorTotalContratosRj: valor,
              ultimoContrato: contrato.dataAssinatura?.slice(0, 10),
              municipio: contrato.unidadeOrgao?.municipioNome,
              uf: contrato.unidadeOrgao?.ufSigla ?? uf,
            },
            contratos: [],
          });
        }

        contratosMap.get(cnpj)!.contratos.push({
          orgao: contrato.unidadeOrgao?.nomeUnidade ?? contrato.orgaoEntidade?.razaoSocial ?? 'Órgão não informado',
          cnpjOrgao: contrato.orgaoEntidade?.cnpj,
          objeto,
          valorContrato: valor,
          dataAssinatura: contrato.dataAssinatura?.slice(0, 10),
          numeroContrato: contrato.numeroContratoEmpenho,
          modalidade: contrato.modalidadeNome,
          fonte: 'PNCP',
          linkContrato: contrato.linkSistemaOrigem,
        });
      }

      if (pagina >= (json.totalPaginas ?? paginas)) break;
    } catch { break; }
  }

  const vencedores = Array.from(contratosMap.values())
    .map(e => e.info)
    .sort((a, b) => b.valorTotalContratosRj - a.valorTotalContratosRj);

  const contratos = Array.from(contratosMap.values()).flatMap(e => e.contratos);
  const contratosPorCnpj = Object.fromEntries(
    Array.from(contratosMap.entries()).map(([cnpj, e]) => [cnpj, e.contratos]),
  );

  return { vencedores, contratos, contratosPorCnpj };
}
