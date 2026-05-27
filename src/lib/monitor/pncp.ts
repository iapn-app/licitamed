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
  return d.toISOString().slice(0, 10).replace(/-/g, '');
}

export async function buscarLicitacoesPNCP(options: {
  diasPassados?: number;
  uf?: string;
  paginas?: number;
  filtrarKeywords?: boolean;
}): Promise<LicitacaoMonitor[]> {
  // diasFuturos removed — PNCP /publicacoes uses publication date (never future)
  const { diasPassados = 60, uf = 'RJ', paginas = 5, filtrarKeywords = false } = options;
  const now = new Date();
  const inicio = new Date(now); inicio.setDate(now.getDate() - diasPassados);

  const dataInicial = toDateStr(inicio);
  const dataFinal = toDateStr(now);
  const resultado: LicitacaoMonitor[] = [];
  const seen = new Set<string>();

  for (let pagina = 1; pagina <= paginas; pagina++) {
    try {
      const params = new URLSearchParams({
        dataInicial, dataFinal,
        pagina: String(pagina),
        tamanhoPagina: '50',
      });
      if (uf) params.set('uf', uf);

      const url = `https://pncp.gov.br/api/pncp/v1/contratacoes/publicacoes?${params}`;
      console.log(`PNCP: buscando página ${pagina}...`, url);

      const res = await fetch(url, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) {
        console.log(`PNCP: HTTP ${res.status} na página ${pagina}`);
        break;
      }

      const json = await res.json() as { data?: PNCPItem[]; totalPaginas?: number };
      const items = json.data ?? [];
      console.log(`PNCP: página ${pagina} → ${items.length} itens`);
      if (items.length === 0) break;

      for (const item of items) {
        const objeto = item.objetoCompra ?? '';
        if (filtrarKeywords && !temPalavraChave(objeto)) continue;
        const id = item.numeroControlePNCP ?? `pncp-${Date.now()}-${Math.random()}`;
        if (seen.has(id)) continue;
        seen.add(id);

        resultado.push({
          id,
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
        });
      }

      if (pagina >= (json.totalPaginas ?? paginas)) break;
    } catch (e) {
      console.log('PNCP: erro na paginação', String(e));
      break;
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
