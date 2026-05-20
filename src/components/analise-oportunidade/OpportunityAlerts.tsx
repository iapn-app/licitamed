import { AlertTriangle, Clock, Package, FileText, TrendingDown, MapPin, Shield } from "lucide-react";
import { NeonCard } from "@/components/shared/neon-card";
import type { AlertaOportunidade } from "@/types/oportunidade";
import { cn } from "@/lib/utils";

interface OpportunityAlertsProps {
  alertas: AlertaOportunidade[];
}

const severidadeConfig = {
  alta: { bg: "bg-red-50", border: "border-red-200", text: "text-red-700", badge: "bg-red-100 text-red-700 border-red-200", dot: "bg-red-500", label: "Alta" },
  media: { bg: "bg-yellow-50", border: "border-yellow-200", text: "text-yellow-700", badge: "bg-yellow-100 text-yellow-700 border-yellow-200", dot: "bg-yellow-500", label: "Média" },
  baixa: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", badge: "bg-blue-100 text-blue-700 border-blue-200", dot: "bg-blue-400", label: "Baixa" },
};

const tipoIcone: Record<string, React.ComponentType<{ className?: string }>> = {
  prazo: Clock,
  fornecedor: Package,
  documento: FileText,
  margem: TrendingDown,
  entrega: MapPin,
  anvisa: Shield,
};

export function OpportunityAlerts({ alertas }: OpportunityAlertsProps) {
  if (alertas.length === 0) {
    return (
      <NeonCard className="p-5">
        <p className="text-sm text-neutral-400 text-center">Nenhum alerta identificado</p>
      </NeonCard>
    );
  }

  const altas = alertas.filter((a) => a.severidade === "alta").length;
  const medias = alertas.filter((a) => a.severidade === "media").length;

  return (
    <NeonCard className="overflow-hidden">
      <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-neutral-900">Alertas inteligentes</h3>
          <p className="text-xs text-neutral-400 mt-0.5">{alertas.length} ponto{alertas.length !== 1 ? "s" : ""} de atenção identificado{alertas.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex items-center gap-2">
          {altas > 0 && (
            <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border bg-red-50 text-red-700 border-red-200">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              {altas} critico{altas !== 1 ? "s" : ""}
            </span>
          )}
          {medias > 0 && (
            <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border bg-yellow-50 text-yellow-700 border-yellow-200">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
              {medias} atenção
            </span>
          )}
        </div>
      </div>
      <div className="divide-y divide-neutral-50">
        {alertas.map((alerta, idx) => {
          const cfg = severidadeConfig[alerta.severidade];
          const IconComp = tipoIcone[alerta.tipo] || AlertTriangle;
          return (
            <div key={idx} className={cn("flex items-start gap-3 px-5 py-3.5", cfg.bg)}>
              <div className={cn("w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 border", cfg.border)}>
                <IconComp className={cn("w-3.5 h-3.5", cfg.text)} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn("text-sm font-medium", cfg.text)}>{alerta.mensagem}</p>
              </div>
              <span className={cn("inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full border flex-shrink-0", cfg.badge)}>
                {cfg.label}
              </span>
            </div>
          );
        })}
      </div>
    </NeonCard>
  );
}
