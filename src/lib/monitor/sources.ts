import { buscarLicitacoesPNCP } from './pncp';
import { scrapeLicitacoesE } from './scrapers';
import { temPalavraChave } from './keywords';
import type { FonteMonitor, LicitacaoMonitor } from './types';

// ─── Contratos ────────────────────────────────────────────────────────────────

export interface MonitorFetchOptions {
  uf?: string;          // sigla do estado (ex: 'RJ') — vazio ou undefined = Brasil todo
  diasPassados?: number; // janela histórica de busca (padrão: 30)
  filtrarKeywords?: boolean; // filtrar por palavras-chave antes de retornar (padrão: true)
}

export interface MonitorSourceResult {
  dados: LicitacaoMonitor[];
  log: {
    fonte: FonteMonitor;
    totalBuscado: number;
    totalDescartado: number;
    motivos: Record<string, number>; // ex: { sem_keyword: 42, timeout: 1 }
    duracaoMs: number;
  };
}

export interface MonitorSource {
  /** Identificador único da fonte, deve corresponder a FonteMonitor */
  getName(): FonteMonitor;
  /** Busca licitações e devolve dados normalizados + log interno */
  fetch(opts: MonitorFetchOptions): Promise<MonitorSourceResult>;
  /** Indica se a fonte está habilitada (false = ignorada pelo sync) */
  isEnabled(): boolean;
}

// ─── Adaptador PNCP ───────────────────────────────────────────────────────────

export class PNCPSource implements MonitorSource {
  getName(): FonteMonitor { return 'PNCP'; }
  isEnabled(): boolean { return true; }

  async fetch(opts: MonitorFetchOptions): Promise<MonitorSourceResult> {
    const { uf = '', diasPassados = 30, filtrarKeywords = true } = opts;
    const inicio = Date.now();
    const motivos: Record<string, number> = {};

    let brutos: LicitacaoMonitor[] = [];
    try {
      brutos = await buscarLicitacoesPNCP({
        uf: uf || undefined,
        diasPassados,
        filtrarKeywords: false, // filtramos aqui para poder logar os descartes
      });
    } catch (err) {
      motivos.erro_busca = 1;
      console.error('PNCPSource.fetch: erro na busca', err);
    }

    const totalBuscado = brutos.length;
    let dados = brutos;

    if (filtrarKeywords) {
      const descartados = brutos.filter(d => !temPalavraChave(d.objeto));
      descartados.forEach(() => {
        motivos.sem_keyword = (motivos.sem_keyword ?? 0) + 1;
      });
      dados = brutos.filter(d => temPalavraChave(d.objeto));
    }

    return {
      dados,
      log: {
        fonte: 'PNCP',
        totalBuscado,
        totalDescartado: totalBuscado - dados.length,
        motivos,
        duracaoMs: Date.now() - inicio,
      },
    };
  }
}

// ─── Adaptador Licitações-e (Banco do Brasil) ─────────────────────────────────

export class LicitacoesESource implements MonitorSource {
  getName(): FonteMonitor { return 'LicitacoesE'; }
  isEnabled(): boolean { return true; }

  async fetch(opts: MonitorFetchOptions): Promise<MonitorSourceResult> {
    const { filtrarKeywords = true } = opts;
    const inicio = Date.now();
    const motivos: Record<string, number> = {};

    let brutos: LicitacaoMonitor[] = [];
    try {
      const result = await scrapeLicitacoesE();
      brutos = result.dados;
      if (!result.status.ativa) {
        motivos.fonte_indisponivel = 1;
      }
    } catch (err) {
      motivos.erro_busca = 1;
      console.error('LicitacoesESource.fetch: erro na busca', err);
    }

    const totalBuscado = brutos.length;
    let dados = brutos;

    if (filtrarKeywords) {
      const descartados = brutos.filter(d => !temPalavraChave(d.objeto));
      descartados.forEach(() => {
        motivos.sem_keyword = (motivos.sem_keyword ?? 0) + 1;
      });
      dados = brutos.filter(d => temPalavraChave(d.objeto));
    }

    return {
      dados,
      log: {
        fonte: 'LicitacoesE',
        totalBuscado,
        totalDescartado: totalBuscado - dados.length,
        motivos,
        duracaoMs: Date.now() - inicio,
      },
    };
  }
}

// ─── Stubs de fontes futuras ──────────────────────────────────────────────────
// Para ativar: implemente fetch() e altere isEnabled() para true,
// depois registre a instância em SOURCES_REGISTRY abaixo.

/*
export class ComprasGovSource implements MonitorSource {
  getName(): FonteMonitor { return 'ComprasGov'; }
  isEnabled(): boolean { return false; }

  async fetch(opts: MonitorFetchOptions): Promise<MonitorSourceResult> {
    // API ComprasGov (SIASG): https://compras.dados.gov.br/docs/
    // Endpoint de licitações: GET /licitacoes/v1/licitacoes.json
    // Autenticação: não requer token (API pública)
    // Normalizar para LicitacaoMonitor com fonte: 'ComprasGov'
    throw new Error('ComprasGovSource não implementado');
  }
}

export class BLLSource implements MonitorSource {
  getName(): FonteMonitor { return 'BLL'; }
  isEnabled(): boolean { return false; }

  async fetch(opts: MonitorFetchOptions): Promise<MonitorSourceResult> {
    // BLL Compras: https://bllcompras.com
    // Requer cadastro/token para API
    // Scraping alternativo via endpoint público de pregões
    throw new Error('BLLSource não implementado');
  }
}

export class LicitanetSource implements MonitorSource {
  getName(): FonteMonitor { return 'Licitanet'; }
  isEnabled(): boolean { return false; }

  async fetch(opts: MonitorFetchOptions): Promise<MonitorSourceResult> {
    // Licitanet: https://www.licitanet.com.br
    // Requer autenticação via token de parceiro
    throw new Error('LicitanetSource não implementado');
  }
}

export class PortalComprasSource implements MonitorSource {
  getName(): FonteMonitor { return 'PortalCompras'; }
  isEnabled(): boolean { return false; }

  async fetch(opts: MonitorFetchOptions): Promise<MonitorSourceResult> {
    // Portal de Compras Públicas: https://www.portaldecompraspublicas.com.br
    // API disponível para usuários credenciados
    throw new Error('PortalComprasSource não implementado');
  }
}

export class ComprasBRSource implements MonitorSource {
  getName(): FonteMonitor { return 'ComprasBR'; }
  isEnabled(): boolean { return false; }

  async fetch(opts: MonitorFetchOptions): Promise<MonitorSourceResult> {
    // ComprasBR: https://www.comprasbr.com.br
    // Marketplace de compras governamentais — verificar disponibilidade de API
    throw new Error('ComprasBRSource não implementado');
  }
}

export class DOUSource implements MonitorSource {
  getName(): FonteMonitor { return 'DOU'; }
  isEnabled(): boolean { return false; }

  async fetch(opts: MonitorFetchOptions): Promise<MonitorSourceResult> {
    // Diário Oficial da União: https://www.in.gov.br/consulta
    // API Inlabs (requer credencial gov.br): https://inlabs.in.gov.br/
    // Seção 3 do DOU costuma trazer avisos de licitação
    throw new Error('DOUSource não implementado');
  }
}
*/

// ─── Registro central de fontes ───────────────────────────────────────────────
// Adicione instâncias aqui para que o sync as inclua automaticamente.

export const SOURCES_REGISTRY: MonitorSource[] = [
  new PNCPSource(),
  new LicitacoesESource(),
  // new ComprasGovSource(),
  // new BLLSource(),
  // new LicitanetSource(),
  // new PortalComprasSource(),
  // new ComprasBRSource(),
  // new DOUSource(),
];

/** Retorna apenas as fontes com isEnabled() === true */
export function getActiveSources(): MonitorSource[] {
  return SOURCES_REGISTRY.filter(s => s.isEnabled());
}
