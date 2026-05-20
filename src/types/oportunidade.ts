export type AtrativdadeLevel = "alta" | "media" | "baixa";
export type CriterioStatus = "ok" | "atencao" | "risco";
export type AlertaSeveridade = "alta" | "media" | "baixa";

export interface CriterioOportunidade {
  nome: string;
  nota: number;
  peso: number;
  status: CriterioStatus;
  descricao: string;
}

export interface AlertaOportunidade {
  tipo: string;
  mensagem: string;
  severidade: AlertaSeveridade;
}

export interface OportunidadeLicitacao {
  id: string;
  orgao: string;
  numero_processo: string;
  valor_estimado: number;
  data_pregao: string;
  score: number;
  atratividade: AtrativdadeLevel;
  margem_estimada: number;
  risco_operacional: "alto" | "medio" | "baixo";
  itens_sem_fornecedor: number;
  documentos_pendentes: number;
  dias_ate_pregao: number;
  criterios: CriterioOportunidade[];
  alertas: AlertaOportunidade[];
}
