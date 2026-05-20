export type LicitacaoStatus =
  | "em_analise"
  | "em_cotacao"
  | "proposta_pronta"
  | "em_disputa"
  | "vencida"
  | "perdida";

export type ItemCategoria =
  | "Descartáveis"
  | "Medicamentos"
  | "Equipamentos"
  | "Curativos"
  | "EPIs"
  | "Saneantes"
  | "Laboratório"
  | "Ortopedia";

export type ItemStatus = "cotado" | "aguardando" | "sem_cotacao";

export interface Fornecedor {
  id: string;
  nome: string;
  cnpj: string;
  email: string;
  whatsapp: string;
  categorias: ItemCategoria[];
  score: number;
  documentosOk: boolean;
  ultimaCotacao: string;
  observacoes: string;
  token: string;
}

export interface Item {
  id: string;
  numero: number;
  descricao: string;
  quantidade: number;
  unidade: string;
  categoria: ItemCategoria;
  fornecedorSugeridoId: string;
  status: ItemStatus;
  valorReferencia: number;
}

export interface Cotacao {
  id: string;
  licitacaoId: string;
  itemId: string;
  fornecedorId: string;
  precoUnitario: number;
  marca: string;
  prazoEntrega: number;
  observacao: string;
  respondidoEm: string;
}

export interface Licitacao {
  id: string;
  nome: string;
  orgao: string;
  numeroProcesso: string;
  valorEstimado: number;
  dataPregao: string;
  status: LicitacaoStatus;
  itens: Item[];
  fornecedoresIds: string[];
  observacoes: string;
  responsavel: string;
  modalidade: string;
  uf: string;
  municipio: string;
}

// Arrays vazios — dados vêm do Supabase
export const fornecedores: Fornecedor[] = [];
export const cotacoes: Cotacao[] = [];
export const licitacoes: Licitacao[] = [];

// ─── COMPUTED HELPERS ─────────────────────────────────────────────────────────

export function getLicitacaoProgress(licitacao: Licitacao): number {
  if (licitacao.itens.length === 0) return 0;
  const cotados = licitacao.itens.filter((i) => i.status === "cotado").length;
  return Math.round((cotados / licitacao.itens.length) * 100);
}

export function getFornecedorById(id: string): Fornecedor | undefined {
  return fornecedores.find((f) => f.id === id);
}

export function getLicitacaoById(id: string): Licitacao | undefined {
  return licitacoes.find((l) => l.id === id);
}

export function getCotacoesByLicitacao(licitacaoId: string): Cotacao[] {
  return cotacoes.filter((c) => c.licitacaoId === licitacaoId);
}

export function getCotacoesByItem(licitacaoId: string, itemId: string): Cotacao[] {
  return cotacoes.filter((c) => c.licitacaoId === licitacaoId && c.itemId === itemId);
}

export function getStatusLabel(status: LicitacaoStatus): string {
  const labels: Record<LicitacaoStatus, string> = {
    em_analise: "Em análise",
    em_cotacao: "Em cotação",
    proposta_pronta: "Proposta pronta",
    em_disputa: "Em disputa",
    vencida: "Vencida",
    perdida: "Perdida",
  };
  return labels[status] ?? status;
}

export function getStatusColor(status: LicitacaoStatus): string {
  const colors: Record<LicitacaoStatus, string> = {
    em_analise: "bg-blue-50 text-blue-700 border-blue-200",
    em_cotacao: "bg-cyan-50 text-cyan-700 border-cyan-200",
    proposta_pronta: "bg-purple-50 text-purple-700 border-purple-200",
    em_disputa: "bg-yellow-50 text-yellow-700 border-yellow-200",
    vencida: "bg-green-50 text-green-700 border-green-200",
    perdida: "bg-red-50 text-red-700 border-red-200",
  };
  return colors[status] ?? "bg-neutral-50 text-neutral-700 border-neutral-200";
}

export function getCategoriaColor(categoria: ItemCategoria): string {
  const colors: Record<ItemCategoria, string> = {
    "Descartáveis": "bg-cyan-50 text-cyan-700 border-cyan-200",
    "Medicamentos": "bg-purple-50 text-purple-700 border-purple-200",
    "Equipamentos": "bg-indigo-50 text-indigo-700 border-indigo-200",
    "Curativos": "bg-pink-50 text-pink-700 border-pink-200",
    "EPIs": "bg-orange-50 text-orange-700 border-orange-200",
    "Saneantes": "bg-teal-50 text-teal-700 border-teal-200",
    "Laboratório": "bg-cyan-50 text-cyan-700 border-cyan-200",
    "Ortopedia": "bg-amber-50 text-amber-700 border-amber-200",
  };
  return colors[categoria] || "bg-gray-50 text-gray-700 border-gray-200";
}

export function getItemStatusLabel(status: ItemStatus): string {
  const labels: Record<ItemStatus, string> = {
    cotado: "Cotado",
    aguardando: "Aguardando",
    sem_cotacao: "Sem cotação",
  };
  return labels[status];
}

export function getItemStatusColor(status: ItemStatus): string {
  const colors: Record<ItemStatus, string> = {
    cotado: "bg-green-50 text-green-700 border-green-200",
    aguardando: "bg-yellow-50 text-yellow-700 border-yellow-200",
    sem_cotacao: "bg-red-50 text-red-700 border-red-200",
  };
  return colors[status];
}

export const DASHBOARD_METRICS = {
  licitacoesAtivas: 0,
  valorTotalAberto: 0,
  fornecedoresAguardando: 0,
  itensSemCotacao: 0,
  propostasParaEnvio: 0,
};
