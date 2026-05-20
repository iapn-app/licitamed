export type EstrategiaPreco = "agressivo" | "equilibrado" | "conservador" | "nao_recomendado";
export type RiscoPreco = "alto" | "medio" | "baixo";

export interface ItemPreco {
  id: string;
  nome: string;
  categoria: string;
  quantidade: number;
  unidade: string;
  menor_cotacao: number;
  preco_historico: number;
  preco_sugerido: number;
  margem: number;
  risco: RiscoPreco;
  estrategia: EstrategiaPreco;
  fornecedor: string;
}

export interface CenarioPreco {
  tipo: EstrategiaPreco;
  label: string;
  chance_ganhar: number;
  margem: number;
  valor_total: number;
  lucro_estimado: number;
}

export interface AlertaPreco {
  tipo: string;
  mensagem: string;
  severidade: "alta" | "media" | "baixa";
  item?: string;
}

export interface SimulacaoPreco {
  licitacao_id: string;
  licitacao_orgao: string;
  total_itens: number;
  margem_media: number;
  valor_total_compra: number;
  valor_total_sugerido: number;
  lucro_bruto: number;
  itens_com_risco: number;
  itens: ItemPreco[];
  cenarios: CenarioPreco[];
  alertas: AlertaPreco[];
}
