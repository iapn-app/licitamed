import { Clock, AlertTriangle, FileText, DollarSign, TrendingDown } from "lucide-react";
import { NeonCard } from "@/components/shared/neon-card";
import type { AlertaExecucao } from "@/types/execucao";
import { cn } from "@/lib/utils";

interface ExecutionAlertsProps {
  alertas: AlertaExecucao[];
  onClickContrato?: (id: string) => void;
}

const severidadeConfig = {
  alta: { bg: "bg-red-50", border: "border-red-200", text: "text-red-700", dot: "bg-red-500", label: "Crítico" },
  media: { bg: "bg-yellow-50", border: "border-yellow-200", text: "text-yellow-700", dot: "bg-yellow-500", label: "Atenção" },
  baixa: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", dot: "bg-blue-400", label: "Info" },
};

const tipoIcone: Record<string, React.ComponentType<{ className?: string }>> = {
  prazo: Clock,
  atraso: AlertTriangle,
  nf: FileText,
  pagamento: DollarSign,
  margem: TrendingDown,
};

export function ExecutionAlerts({ alertas, onClickContrato }: ExecutionAlertsProps) {
  if (alertas.length === 0) return null;

  return (
    <NeonCard className="overflow-hidden">
      <div className="px-5 py-4 border-b border-neutral-100">
        <h3 className="text-sm font-semibold text-neutral-900">Alertas de execução</h3>
        <p className="text-xs text-neutral-400 mt-0.5">{alertas.length} alerta{alertas.length !== 1 ? "s" : ""} ativo{alertas.length !== 1 ? "s" : ""}</p>
      </div>
      <div className="divide-y divide-neutral-50">
        {alertas.map((alerta, idx) => {
          const cfg = severidadeConfig[alerta.severidade];
          const IconComp = tipoIcone[alerta.tipo] || AlertTriangle;
          return (
            <div
              key={idx}
              className={cn("flex items-start gap-3 px-5 py-3.5 cursor-pointer transition-opacity hover:opacity-90", cfg.bg)}
              onClick={() => onClickContrato?.(alerta.contrato_id)}
            >
              <div className={cn("w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 border", cfg.border)}>
                <IconComp className={cn("w-3.5 h-3.5", cfg.text)} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn("text-sm font-medium", cfg.text)}>{alerta.mensagem}</p>
              </div>
              <span className={cn("inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border flex-shrink-0", cfg.bg, cfg.text, cfg.border)}>
                <span className={cn("w-1.5 h-1.5 rounded-full", cfg.dot)} />
                {cfg.label}
              </span>
            </div>
          );
        })}
      </div>
    </NeonCard>
  );
}
