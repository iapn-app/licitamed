export type FonteMonitor =
  | 'PNCP'
  | 'LicitacoesE'
  | 'ComprasGov'
  | 'BLL'
  | 'Licitanet'
  | 'PortalCompras'
  | 'ComprasBR'
  | 'DOU';

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
  ultimaSincronizacao?: string | null;
  totalNoBanco?: number;
}

// Item individual de um edital (produto, quantidade, valor unitário)
export interface LicitacaoItem {
  licitacaoId: string;
  numeroItem: number;
  descricao: string;
  unidade?: string | null;
  quantidade?: number | null;
  valorUnitarioEstimado?: number | null;
  valorTotal?: number | null;
}

// Log de execução de uma sincronização
export interface MonitorLog {
  id?: string;
  fonte: FonteMonitor | 'todas';
  totalBuscado: number;
  totalSalvo: number;
  totalDescartado: number;
  motivosDescarte?: Record<string, number>; // ex: { sem_keyword: 120, duplicata: 5 }
  duracaoMs: number;
  status: 'sucesso' | 'erro' | 'parcial';
  erro?: string | null;
  criadoEm?: string;
}

// Palavra-chave gerenciável com peso e categoria
export interface PalavraChaveMonitor {
  palavra: string;
  peso: number; // 1 (genérico) a 10 (altamente específico)
  categoria: 'equipamentos' | 'descartaveis' | 'insumos' | 'correlatos' | 'cirurgico' | 'diagnostico' | 'generico_saude';
  ativa: boolean;
  variacoes?: string[]; // formas alternativas / sem acento / plural
}

// Pontuação de relevância de uma licitação para o perfil da empresa
export interface OportunidadeScore {
  licitacaoId: string;
  score: number; // 0 a 100
  classificacao: 'alta' | 'media' | 'baixa';
  fatores: {
    keywordsEncontradas: string[];
    pesoTotal: number;
    temValor: boolean;
    isPregao: boolean;
    dentroPrazo: boolean;
  };
}
