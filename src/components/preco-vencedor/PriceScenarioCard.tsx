import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, Target, Shield, CheckCircle2 } from "lucide-react";
import type { CenarioPreco, EstrategiaPreco } from "@/types/preco";

interface PriceScenarioCardProps {
  cenario: CenarioPreco;
  selected: boolean;
  onSelect: () => void;
}

const cenarioConfig: Record<EstrategiaPreco, {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  activeBg: string;
  activeBorder: string;
  activeText: string;
  badgeBg: string;
  badgeText: string;
  idleBorder: string;
}> = {
  agressivo: {
    label: "Agressivo",
    icon: TrendingUp,
    activeBg: "bg-blue-50",
    activeBorder: "border-[#1A56DB]",
    activeText: "text-[#1A56DB]",
    badgeBg: "bg-blue-100",
    badgeText: "text-blue-700",
    idleBorder: "border-neutral-200",
  },
  equilibrado: {
    label: "Equilibrado",
    icon: Target,
    activeBg: "bg-green-50",
    activeBorder: "border-green-500",
    activeText: "text-green-700",
    badgeBg: "bg-green-100",
    badgeText: "text-green-700",
    idleBorder: "border-neutral-200",
  },
  conservador: {
    label: "Conservador",
    icon: Shield,
    activeBg: "bg-yellow-50",
    activeBorder: "border-yellow-500",
    activeText: "text-yellow-700",
    badgeBg: "bg-yellow-100",
    badgeText: "text-yellow-700",
    idleBorder: "border-neutral-200",
  },
  nao_recomendado: {
    label: "Não recomendado",
    icon: Shield,
    activeBg: "bg-red-50",
    activeBorder: "border-red-400",
    activeText: "text-red-600",
    badgeBg: "bg-red-100",
    badgeText: "text-red-700",
    idleBorder: "border-neutral-200",
  },
};

export function PriceScenarioCard({ cenario, selected, onSelect }: PriceScenarioCardProps) {
  const cfg = cenarioConfig[cenario.tipo];
  const Icon = cfg.icon;

  return (
    <div
      className={cn(
        "neon-card rounded-lg border-2 p-5 cursor-pointer transition-all duration-150",
        selected ? [cfg.activeBg, cfg.activeBorder] : ["bg-white", cfg.idleBorder, "hover:border-neutral-300"]
      )}
      onClick={onSelect}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={cn("w-8 h-8 rounded-md flex items-center justify-center", selected ? cfg.badgeBg : "bg-neutral-100")}>
            <Icon className={cn("w-4 h-4", selected ? cfg.badgeText : "text-neutral-400")} />
          </div>
          <span className={cn("text-sm font-semibold", selected ? cfg.activeText : "text-neutral-700")}>{cfg.label}</span>
        </div>
        {selected && <CheckCircle2 className={cn("w-4 h-4", cfg.activeText)} />}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-neutral-500">Chance de ganhar</span>
          <span className={cn("text-sm font-bold tabular-nums", selected ? cfg.activeText : "text-neutral-700")}>
            {cenario.chance_ganhar}%
          </span>
        </div>
        <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
          <div
            className={cn("h-full rounded-full", selected ? (cenario.tipo === "agressivo" ? "bg-[#1A56DB]" : cenario.tipo === "equilibrado" ? "bg-green-500" : "bg-yellow-500") : "bg-neutral-300")}
            style={{ width: `${cenario.chance_ganhar}%` }}
          />
        </div>

        <div className="pt-2 border-t border-neutral-100 space-y-2">
          <div className="flex justify-between">
            <span className="text-xs text-neutral-500">Margem prevista</span>
            <span className={cn("text-xs font-semibold", cenario.margem >= 15 ? "text-green-600" : cenario.margem >= 8 ? "text-yellow-600" : "text-red-600")}>
              {cenario.margem}%
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-xs text-neutral-500">Valor total</span>
            <span className="text-xs font-medium text-neutral-700 tabular-nums">{formatCurrency(cenario.valor_total)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-xs text-neutral-500">Lucro estimado</span>
            <span className={cn("text-xs font-semibold", cenario.lucro_estimado > 0 ? "text-green-600" : "text-red-600")}>
              {formatCurrency(cenario.lucro_estimado)}
            </span>
          </div>
        </div>
      </div>

      <button
        onClick={(e) => { e.stopPropagation(); onSelect(); }}
        className={cn(
          "w-full mt-4 py-2 rounded-md text-xs font-semibold transition-colors",
          selected
            ? cn(cfg.badgeBg, cfg.badgeText, "border border-transparent")
            : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
        )}
      >
        {selected ? "Cenário selecionado" : "Aplicar cenário"}
      </button>
    </div>
  );
}
