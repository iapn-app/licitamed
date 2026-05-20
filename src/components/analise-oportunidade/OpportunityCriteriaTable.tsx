import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { NeonCard } from "@/components/shared/neon-card";
import type { CriterioOportunidade } from "@/types/oportunidade";
import { cn } from "@/lib/utils";

interface OpportunityCriteriaTableProps {
  criterios: CriterioOportunidade[];
}

const statusConfig = {
  ok: { icon: CheckCircle2, color: "text-green-500", bg: "bg-green-50", border: "border-green-200", label: "OK" },
  atencao: { icon: AlertTriangle, color: "text-yellow-500", bg: "bg-yellow-50", border: "border-yellow-200", label: "Atenção" },
  risco: { icon: XCircle, color: "text-red-500", bg: "bg-red-50", border: "border-red-200", label: "Risco" },
};

export function OpportunityCriteriaTable({ criterios }: OpportunityCriteriaTableProps) {
  const scoreTotal = criterios.reduce((sum, c) => sum + (c.nota * c.peso), 0);
  const pesoTotal = criterios.reduce((sum, c) => sum + c.peso, 0);
  const scorePonderado = pesoTotal > 0 ? Math.round(scoreTotal / pesoTotal) : 0;

  return (
    <NeonCard className="overflow-hidden">
      <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-neutral-900">Critérios de avaliação</h3>
          <p className="text-xs text-neutral-400 mt-0.5">Nota de 0–10 ponderada pelo peso</p>
        </div>
        <div className="text-right">
          <span className="text-xs text-neutral-500">Score ponderado</span>
          <p className={cn("text-xl font-bold", scorePonderado >= 7 ? "text-green-600" : scorePonderado >= 4 ? "text-yellow-600" : "text-red-600")}>
            {scorePonderado}/10
          </p>
        </div>
      </div>
      <table className="w-full">
        <thead>
          <tr className="border-b border-neutral-100">
            <th className="text-left px-5 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide">Critério</th>
            <th className="text-center px-5 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide">Nota</th>
            <th className="text-center px-5 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide">Peso</th>
            <th className="text-left px-5 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide">Avaliação visual</th>
            <th className="text-center px-5 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide">Status</th>
            <th className="text-left px-5 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide">Observação</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-50">
          {criterios.map((c) => {
            const cfg = statusConfig[c.status];
            const StatusIcon = cfg.icon;
            const barColor = c.status === "ok" ? "bg-green-500" : c.status === "atencao" ? "bg-yellow-400" : "bg-red-500";
            return (
              <tr key={c.nome} className="hover:bg-neutral-50 transition-colors">
                <td className="px-5 py-3">
                  <span className="text-sm font-medium text-neutral-800">{c.nome}</span>
                </td>
                <td className="px-5 py-3 text-center">
                  <span className={cn("text-sm font-semibold tabular-nums", c.nota >= 7 ? "text-green-600" : c.nota >= 4 ? "text-yellow-600" : "text-red-600")}>
                    {c.nota}/10
                  </span>
                </td>
                <td className="px-5 py-3 text-center">
                  <span className="text-xs font-medium text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-full">
                    {c.peso}x
                  </span>
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-neutral-100 rounded-full overflow-hidden max-w-[120px]">
                      <div className={cn("h-full rounded-full", barColor)} style={{ width: `${c.nota * 10}%` }} />
                    </div>
                    <span className="text-xs text-neutral-400 tabular-nums w-6">{c.nota * 10}%</span>
                  </div>
                </td>
                <td className="px-5 py-3 text-center">
                  <span className={cn("inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border", cfg.bg, cfg.color, cfg.border)}>
                    <StatusIcon className="w-3 h-3" />
                    {cfg.label}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <span className="text-xs text-neutral-500">{c.descricao}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </NeonCard>
  );
}
