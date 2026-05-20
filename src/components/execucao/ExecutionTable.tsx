import { CheckCircle2, Clock, AlertTriangle, XCircle, ArrowRight } from "lucide-react";
import { NeonCard } from "@/components/shared/neon-card";
import { formatCurrency, formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { ContratoExecucao, StatusContrato } from "@/types/execucao";

interface ExecutionTableProps {
  contratos: ContratoExecucao[];
  onClickContrato: (contrato: ContratoExecucao) => void;
}

const statusConfig: Record<StatusContrato, { label: string; icon: React.ComponentType<{ className?: string }>; bg: string; text: string; border: string }> = {
  em_andamento: { label: "Em andamento", icon: Clock, bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  atrasado: { label: "Atrasado", icon: AlertTriangle, bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
  concluido: { label: "Concluído", icon: CheckCircle2, bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
  problema: { label: "Problema", icon: XCircle, bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
};

const etapaLabel: Record<string, string> = {
  licitacao_vencida: "Licitação vencida",
  homologacao: "Homologação",
  ata_contrato: "Ata/Contrato",
  empenho_recebido: "Empenho recebido",
  compra_fornecedor: "Compra c/ forn.",
  separacao: "Separação",
  entrega: "Entrega",
  nf_emitida: "NF emitida",
  aguardando_pagamento: "Ag. pagamento",
  recebido: "Recebido",
  concluido: "Concluído",
};

export function ExecutionTable({ contratos, onClickContrato }: ExecutionTableProps) {
  return (
    <NeonCard className="overflow-hidden">
      <div className="px-5 py-4 border-b border-neutral-100">
        <h3 className="text-sm font-semibold text-neutral-900">Contratos em execução</h3>
        <p className="text-xs text-neutral-400 mt-0.5">{contratos.length} contrato{contratos.length !== 1 ? "s" : ""} ativo{contratos.length !== 1 ? "s" : ""}</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-neutral-100">
              <th className="text-left px-5 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide">Órgão</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide">Empenho</th>
              <th className="text-right px-5 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide">Valor</th>
              <th className="text-center px-5 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide">Status</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide">Etapa atual</th>
              <th className="text-center px-5 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide">Prazo entrega</th>
              <th className="text-center px-5 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide">NF</th>
              <th className="text-right px-5 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide">Margem real</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide">Próxima ação</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-50">
            {contratos.map((c) => {
              const sCfg = statusConfig[c.status];
              const StatusIcon = sCfg.icon;
              const margemColor = c.margem_real >= c.margem_prevista ? "text-green-600" : c.margem_real >= c.margem_prevista * 0.8 ? "text-yellow-600" : "text-red-600";
              return (
                <tr
                  key={c.id}
                  className="hover:bg-neutral-50 transition-colors cursor-pointer group"
                  onClick={() => onClickContrato(c)}
                >
                  <td className="px-5 py-4">
                    <p className="text-sm font-medium text-neutral-800 truncate max-w-[200px]">{c.orgao}</p>
                    <p className="text-xs text-neutral-400 mt-0.5">{c.numero_contrato}</p>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-sm text-neutral-600">{c.numero_empenho}</span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <span className="text-sm font-medium text-neutral-800 tabular-nums">{formatCurrency(c.valor)}</span>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span className={cn("inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border", sCfg.bg, sCfg.text, sCfg.border)}>
                      <StatusIcon className="w-3 h-3" />
                      {sCfg.label}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-xs font-medium text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded-full">
                      {etapaLabel[c.etapa_atual] ?? c.etapa_atual}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span className={cn("text-sm", c.status === "atrasado" ? "text-red-600 font-semibold" : "text-neutral-600")}>
                      {formatDate(c.prazo_entrega)}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-center">
                    {c.nf_emitida ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500 mx-auto" />
                    ) : (
                      <Clock className="w-4 h-4 text-yellow-400 mx-auto" />
                    )}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div>
                      <span className={cn("text-sm font-semibold tabular-nums", margemColor)}>{c.margem_real}%</span>
                      <p className="text-xs text-neutral-400 mt-0.5">prev. {c.margem_prevista}%</p>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-xs text-neutral-600 max-w-[160px] truncate">{c.proxima_acao}</p>
                  </td>
                  <td className="px-5 py-4">
                    <ArrowRight className="w-3.5 h-3.5 text-neutral-300 group-hover:text-[#06B6D4] transition-colors" />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </NeonCard>
  );
}
