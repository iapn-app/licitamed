import { NeonCard } from "@/components/shared/neon-card";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { ItemPreco, EstrategiaPreco, RiscoPreco } from "@/types/preco";

interface SmartPriceTableProps {
  itens: ItemPreco[];
}

const estrategiaConfig: Record<EstrategiaPreco, { label: string; bg: string; text: string; border: string }> = {
  agressivo: { label: "Agressivo", bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  equilibrado: { label: "Equilibrado", bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
  conservador: { label: "Conservador", bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200" },
  nao_recomendado: { label: "Não recomendado", bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
};

const riscoConfig: Record<RiscoPreco, { label: string; color: string }> = {
  alto: { label: "Alto", color: "text-red-600" },
  medio: { label: "Médio", color: "text-yellow-600" },
  baixo: { label: "Baixo", color: "text-green-600" },
};

export function SmartPriceTable({ itens }: SmartPriceTableProps) {
  return (
    <NeonCard className="overflow-hidden">
      <div className="px-5 py-4 border-b border-neutral-100">
        <h3 className="text-sm font-semibold text-neutral-900">Tabela inteligente de preços</h3>
        <p className="text-xs text-neutral-400 mt-0.5">{itens.length} itens analisados com IA</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-neutral-100">
              <th className="text-left px-5 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide">Item</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide">Categoria</th>
              <th className="text-right px-5 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide">Qtd</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide">Un.</th>
              <th className="text-right px-5 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide">Menor cotação</th>
              <th className="text-right px-5 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide">Histórico</th>
              <th className="text-right px-5 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide">Preço sugerido</th>
              <th className="text-right px-5 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide">Margem</th>
              <th className="text-center px-5 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide">Risco</th>
              <th className="text-center px-5 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide">Estratégia</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-50">
            {itens.map((item) => {
              const estr = estrategiaConfig[item.estrategia];
              const risco = riscoConfig[item.risco];
              return (
                <tr key={item.id} className="hover:bg-neutral-50 transition-colors">
                  <td className="px-5 py-3">
                    <div>
                      <p className="text-sm font-medium text-neutral-800">{item.nome}</p>
                      <p className="text-xs text-neutral-400 mt-0.5">{item.fornecedor}</p>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-xs bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-full">{item.categoria}</span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <span className="text-sm text-neutral-700 tabular-nums">{item.quantidade.toLocaleString("pt-BR")}</span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-xs text-neutral-500">{item.unidade}</span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <span className="text-sm text-neutral-700 tabular-nums">{formatCurrency(item.menor_cotacao)}</span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <span className="text-sm text-neutral-500 tabular-nums">{formatCurrency(item.preco_historico)}</span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <span className="text-sm font-semibold text-[#06B6D4] tabular-nums">{formatCurrency(item.preco_sugerido)}</span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <span className={cn("text-sm font-semibold tabular-nums", item.margem >= 15 ? "text-green-600" : item.margem >= 8 ? "text-yellow-600" : "text-red-600")}>
                      {item.margem}%
                    </span>
                  </td>
                  <td className="px-5 py-3 text-center">
                    <span className={cn("text-xs font-medium", risco.color)}>{risco.label}</span>
                  </td>
                  <td className="px-5 py-3 text-center">
                    <span className={cn("inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full border", estr.bg, estr.text, estr.border)}>
                      {estr.label}
                    </span>
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
