import { temPalavraChave, encontrarPalavras } from './keywords';
import type { LicitacaoMonitor, VencedorMonitor, ContratoMonitor } from './types';
import { classificarSegmento } from './segmentos';

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

function toDateStr(d: Date): string {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Sao_Paulo' })
    .format(d)
    .replace(/-/g, '');
}

// Modalidades: 1=Leilão, 2=Diálogo Competitivo, 3=Concurso, 4=Concorrência,
// 5=Pregão, 6=Pregão Eletrônico, 7=Dispensa Eletrônica, 8=Dispensa,
// 9=Inexigibilidade, 12=Manifestação de Interesse
const MODALIDADES_PNCP = [1, 2, 3, 4, 5, 6, 7, 8, 9, 12];

function mapPNCPItem(item: PNCPItem, uf: string): LicitacaoMonitor {
  const objeto = item.objetoCompra ?? '';
  // Monta número legível: "90029/2026" para facilitar busca textual
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
    uf: item.unidadeOrgao?.ufSigla ?? uf,
    palavrasEncontradas: encontrarPalavras(objeto),
  };
}

const PNCP_BASE_URL = process.env.PNCP_PROXY_URL?.trim() || 'https://pncp.gov.br/api/consulta/v1/contratacoes/publicacao';
console.log('PNCP_BASE_URL:', PNCP_BASE_URL);

async function buscarModalidade(modalidade: number, dataInicial: string, dataFinal: string, uf: string): Promise<LicitacaoMonitor[]> {
  const timeout = process.env.PNCP_PROXY_URL ? 25000 : 8000;
  const TAMANHO = 50;
  const MAX_PAGINAS = 10;

  const buildUrl = (pagina: number) => {
    const params = new URLSearchParams({
      dataInicial, dataFinal,
      pagina: String(pagina),
      tamanhoPagina: String(TAMANHO),
      codigoModalidadeContratacao: String(modalidade),
    });
    if (uf) params.set('uf', uf);
    const urlObj = new URL(PNCP_BASE_URL);
    params.forEach((value, key) => urlObj.searchParams.set(key, value));
    return urlObj.toString();
  };

  console.log(`PNCP: modalidade=${modalidade}...`);

  const res1 = await fetch(buildUrl(1), {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(timeout),
  });

  if (!res1.ok) {
    console.log(`PNCP: HTTP ${res1.status} modalidade=${modalidade}`);
    return [];
  }

  const json1 = await res1.json() as { data?: PNCPItem[]; totalPaginas?: number };
  if (!json1.data?.length) return [];

  const totalPaginas = Math.min(json1.totalPaginas ?? 1, MAX_PAGINAS);
  let todos: PNCPItem[] = [...(json1.data ?? [])];

  if (totalPaginas > 1) {
    const restantes = await Promise.allSettled(
      Array.from({ length: totalPaginas - 1 }, (_, i) =>
        fetch(buildUrl(i + 2), { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(timeout) })
          .then(r => r.ok ? r.json() as Promise<{ data?: PNCPItem[] }> : Promise.resolve({ data: [] as PNCPItem[] }))
          .then(d => d.data ?? [])
          .catch(() => [] as PNCPItem[])
      )
    );
    restantes.forEach(r => { if (r.status === 'fulfilled') todos = [...todos, ...r.value]; });
  }

  console.log(`PNCP: modalidade=${modalidade} → ${todos.length} itens (${totalPaginas} págs)`);
  return todos.map(item => mapPNCPItem(item, uf));
}

// Gera janelas de [tamanho] dias cobrindo os últimos [total] dias
// Cada janela busca páginas 1-10, evitando page numbers altos que travam o proxy
function gerarJanelas(totalDias: number, tamanhoDias: number): Array<{ dataInicial: string; dataFinal: string }> {
  const janelas: Array<{ dataInicial: string; dataFinal: string }> = [];
  const now = new Date();
  let cursor = new Date(now);

  while (cursor > new Date(now.getTime() - totalDias * 86400000)) {
    const fim = new Date(cursor);
    const ini = new Date(cursor);
    ini.setDate(ini.getDate() - tamanhoDias);
    if (ini < new Date(now.getTime() - totalDias * 86400000)) {
      ini.setTime(new Date(now.getTime() - totalDias * 86400000).getTime());
    }
    janelas.push({ dataInicial: toDateStr(ini), dataFinal: toDateStr(fim) });
    cursor.setDate(cursor.getDate() - tamanhoDias);
  }

  return janelas;
}

export async function buscarLicitacoesPNCP(options: {
  diasPassados?: number;
  uf?: string;
  paginas?: number;
  filtrarKeywords?: boolean;
  janelasDias?: number; // divide o período em janelas menores para cobrir datas recentes
}): Promise<LicitacaoMonitor[]> {
  const { diasPassados = 3, uf = 'RJ', filtrarKeywords = false, janelasDias } = options;

  // Quando janelasDias está definido, divide o período em janelas de N dias
  // Cada janela busca páginas 1-10 → cobre no máximo 500 itens por janela
  // Evita page numbers altos que o proxy Cloudflare não consegue processar
  const janelas = janelasDias
    ? gerarJanelas(diasPassados, janelasDias)
    : (() => {
        const now = new Date();
        const inicio = new Date(now); inicio.setDate(now.getDate() - diasPassados);
        return [{ dataInicial: toDateStr(inicio), dataFinal: toDateStr(now) }];
      })();

  console.log(`PNCP: ${janelas.length} janela(s) de busca`);
  janelas.forEach((j, i) => console.log(`  janela ${i + 1}: ${j.dataInicial} → ${j.dataFinal}`));

  const seen = new Set<string>();
  const resultado: LicitacaoMonitor[] = [];

  // Busca todas as janelas × modalidades em paralelo
  const tarefas = janelas.flatMap(j =>
    MODALIDADES_PNCP.map(m => buscarModalidade(m, j.dataInicial, j.dataFinal, uf))
  );

  const resultados = await Promise.allSettled(tarefas);

  for (const r of resultados) {
    if (r.status !== 'fulfilled') {
      console.log('PNCP: tarefa falhou', (r as PromiseRejectedResult).reason);
      continue;
    }
    for (const item of r.value) {
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      if (filtrarKeywords && !temPalavraChave(item.objeto)) continue;
      resultado.push(item);
    }
  }

  resultado.sort((a, b) => b.dataPublicacao.localeCompare(a.dataPublicacao));
  console.log(`PNCP: total encontrado = ${resultado.length}`);
  return resultado;
}

export async function buscarContratosPNCP(options: {
  diasPassados?: number;
  uf?: string;
  paginas?: number;
}): Promise<{ vencedores: VencedorMonitor[]; contratos: ContratoMonitor[]; contratosPorCnpj: Record<string, ContratoMonitor[]> }> {
  const { diasPassados = 90, uf = 'RJ', paginas = 10 } = options;
  const now = new Date();
  const inicio = new Date(now); inicio.setDate(now.getDate() - diasPassados);

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
        { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(15000) }
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
          if (contrato.dataAssinatura && (!existing.info.ultimoContrato || contrato.dataAssinatura > existing.info.ultimoContrato)) {
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
    Array.from(contratosMap.entries()).map(([cnpj, e]) => [cnpj, e.contratos])
  );

  return { vencedores, contratos, contratosPorCnpj };
}
