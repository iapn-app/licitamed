export type FonteMonitor = 'PNCP' | 'ComprasRio' | 'SEPLAG-RJ' | 'BLL' | 'LicitacoesE';

export interface LicitacaoMonitor {
  id: string;
  fonte: FonteMonitor;
  orgao: string;
  cnpjOrgao?: string;
  objeto: string;
  modalidade: string;
  valorEstimado?: number | null;
  dataPublicacao: string;
  dataAbertura?: string | null;
  status: string;
  urlEdital?: string | null;
  numeroEdital?: string | null;
  municipio?: string | null;
  uf?: string | null;
  palavrasEncontradas?: string[];
}

export interface VencedorMonitor {
  cnpj: string;
  razaoSocial: string;
  nomeFantasia?: string;
  segmento: string;
  porte?: string;
  totalContratosRj: number;
  valorTotalContratosRj: number;
  ultimoContrato?: string;
  municipio?: string;
  uf?: string;
  telefone?: string;
  email?: string;
  situacaoCadastral?: string;
}

export interface ContratoMonitor {
  orgao: string;
  cnpjOrgao?: string;
  objeto: string;
  valorContrato: number;
  dataAssinatura?: string;
  numeroContrato?: string;
  modalidade?: string;
  fonte: string;
  linkContrato?: string;
}

export interface StatusFonte {
  fonte: FonteMonitor;
  ativa: boolean;
  totalEncontrado?: number;
  erro?: string;
  ultimaVerificacao: string;
}

export interface LicitacoesResponse {
  dados: LicitacaoMonitor[];
  total: number;
  fontes: StatusFonte[];
  timestamp: string;
}
