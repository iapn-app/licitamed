import { temPalavraChave, encontrarPalavras } from './keywords';
import type { LicitacaoMonitor, VencedorMonitor, ContratoMonitor } from './types';
import { classificarSegmento } from './segmentos';

interface PNCPItem {
  numeroControlePNCP?: string;
  unidadeOrgao?: { nomeUnidade?: string; municipioNome?: string; ufSigla?: string };
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

// Modalidades: 4=Concorrência Eletrônica, 6=Pregão Eletrônico, 7=Pregão Presencial,
// 8=Dispensa, 9=Inexigibilidade, 13=Credenciamento
const MODALIDADES_PNCP = [4, 6, 7, 8, 9, 13];

function mapPNCPItem(item: PNCPItem, uf: string): LicitacaoMonitor {
  const objeto = item.objetoCompra ?? '';
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
    municipio: item.unidadeOrgao?.municipioNome ?? null,
    uf: item.unidadeOrgao?.ufSigla ?? uf,
    palavrasEncontradas: encontrarPalavras(objeto),
  };
}

const PNCP_BASE_URL = process.env.PNCP_PROXY_URL?.trim() || 'https://pncp.gov.br';
console.log('PNCP_BASE_URL:', PNCP_BASE_URL);

async function buscarModalidade(modalidade: number, dataInicial: string, dataFinal: string, uf: string): Promise<LicitacaoMonitor[]> {
  const params = new URLSearchParams({
    dataInicial, dataFinal,
    pagina: '1',
    tamanhoPagina: '20',
    codigoModalidadeContratacao: String(modalidade),
  });
  if (uf) params.set('uf', uf);

  const viaProxy = !!process.env.PNCP_PROXY_URL;
  const url = viaProxy
    ? `${PNCP_BASE_URL}/?${params}`
    : `${PNCP_BASE_URL}/api/consulta/v1/contratacoes/publicacao?${params}`;

  console.log(`PNCP: modalidade=${modalidade} via ${viaProxy ? 'proxy' : 'direto'}...`);

  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(viaProxy ? 25000 : 8000),
  });

  if (!res.ok) {
    console.log(`PNCP: HTTP ${res.status} modalidade=${modalidade}`);
    return [];
  }

  const json = await res.json() as { data?: PNCPItem[] };
  const items = json.data ?? [];
  console.log(`PNCP: modalidade=${modalidade} → ${items.length} itens`);
  return items.map(item => mapPNCPItem(item, uf));
}

export async function buscarLicitacoesPNCP(options: {
  diasPassados?: number;
  uf?: string;
  paginas?: number;
  filtrarKeywords?: boolean;
}): Promise<LicitacaoMonitor[]> {
  const { diasPassados = 90, uf = 'RJ', filtrarKeywords = false } = options;
  const now = new Date();
  const inicio = new Date(now); inicio.setDate(now.getDate() - diasPassados);

  const dataInicial = toDateStr(inicio);
  const dataFinal = toDateStr(now);
  console.log('PNCP período de busca:', dataInicial, 'até', dataFinal);

  const resultados = await Promise.allSettled(
    MODALIDADES_PNCP.map(m => buscarModalidade(m, dataInicial, dataFinal, uf))
  );

  const seen = new Set<string>();
  const resultado: LicitacaoMonitor[] = [];

  for (const r of resultados) {
    if (r.status !== 'fulfilled') {
      console.log('PNCP: modalidade falhou', (r as PromiseRejectedResult).reason);
      continue;
    }
    for (const item of r.value) {
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      if (filtrarKeywords && !temPalavraChave(item.objeto)) continue;
      resultado.push(item);
    }
  }

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
