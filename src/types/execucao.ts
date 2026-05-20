export type EtapaPipeline =
  | "licitacao_vencida"
  | "homologacao"
  | "ata_contrato"
  | "empenho_recebido"
  | "compra_fornecedor"
  | "separacao"
  | "entrega"
  | "nf_emitida"
  | "aguardando_pagamento"
  | "recebido"
  | "concluido";

export type StatusContrato = "em_andamento" | "atrasado" | "concluido" | "problema";

export interface ItemContrato {
  id: string;
  nome: string;
  quantidade: number;
  unidade: string;
  valor_unitario: number;
  fornecedor: string;
  status: "pendente" | "entregue" | "devolvido";
}

export interface ContratoExecucao {
  id: string;
  orgao: string;
  numero_contrato: string;
  numero_empenho: string;
  valor: number;
  status: StatusContrato;
  etapa_atual: EtapaPipeline;
  prazo_entrega: string;
  nf_emitida: boolean;
  nf_numero?: string;
  data_pagamento?: string;
  margem_real: number;
  margem_prevista: number;
  proxima_acao: string;
  itens: ItemContrato[];
  observacoes?: string;
}

export interface AlertaExecucao {
  tipo: string;
  mensagem: string;
  severidade: "alta" | "media" | "baixa";
  contrato_id: string;
}

export interface ResumoExecucao {
  contratos_em_execucao: number;
  empenhos_pendentes: number;
  entregas_atrasadas: number;
  notas_fiscais_pendentes: number;
  valor_a_receber: number;
  margem_real_acumulada: number;
}
