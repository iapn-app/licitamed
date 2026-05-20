import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { NeonCard } from "@/components/shared/neon-card";
import type { OportunidadeLicitacao } from "@/types/oportunidade";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface OpportunityScoreCardProps {
  oportunidade: OportunidadeLicitacao;
}

export function OpportunityScoreCard({ oportunidade }: OpportunityScoreCardProps) {
  const { score, atratividade, margem_estimada, risco_operacional, valor_estimado, dias_ate_pregao, itens_sem_fornecedor, documentos_pendentes } = oportunidade;

  const atratividadeConfig = {
    alta: { label: "Alta atratividade", bg: "bg-green-50", text: "text-green-700", border: "border-green-200", bar: "bg-green-500" },
    media: { label: "Média atratividade", bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200", bar: "bg-yellow-500" },
    baixa: { label: "Baixa atratividade", bg: "bg-red-50", text: "text-red-700", border: "border-red-200", bar: "bg-red-500" },
  }[atratividade];

  const riscoConfig = {
    alto: { label: "Alto", color: "text-red-600", bg: "bg-red-50" },
    medio: { label: "Médio", color: "text-yellow-600", bg: "bg-yellow-50" },
    baixo: { label: "Baixo", color: "text-green-600", bg: "bg-green-50" },
  }[risco_operacional];

  const metricCards = [
    { label: "Score da oportunidade", value: `${score}/100`, sub: "Pontuação composta", color: score >= 70 ? "text-green-600" : score >= 40 ? "text-yellow-600" : "text-red-600" },
    { label: "Margem estimada", value: `${margem_estimada}%`, sub: "Sobre valor de venda", color: margem_estimada >= 15 ? "text-green-600" : margem_estimada >= 8 ? "text-yellow-600" : "text-red-600" },
    { label: "Valor estimado", value: formatCurrency(valor_estimado), sub: "Valor do edital", color: "text-neutral-800" },
    { label: "Dias até o pregão", value: String(dias_ate_pregao), sub: dias_ate_pregao <= 7 ? "Urgente!" : "Dias restantes", color: dias_ate_pregao <= 7 ? "text-red-600" : dias_ate_pregao <= 14 ? "text-yellow-600" : "text-neutral-800" },
    { label: "Itens sem fornecedor", value: String(itens_sem_fornecedor), sub: "Precisam de cotação", color: itens_sem_fornecedor > 0 ? "text-red-600" : "text-green-600" },
    { label: "Docs pendentes", value: String(documentos_pendentes), sub: "Para habilitar", color: documentos_pendentes > 0 ? "text-yellow-600" : "text-green-600" },
    { label: "Risco operacional", value: riscoConfig.label, sub: "Avaliação geral", color: riscoConfig.color },
    { label: "Recomendação", value: score >= 70 ? "Disputar" : score >= 40 ? "Avaliar" : "Não disputar", sub: "Com base no score", color: score >= 70 ? "text-green-600" : score >= 40 ? "text-yellow-600" : "text-red-600" },
  ];

  return (
    <div className="space-y-4">
      {/* Badge principal */}
      <NeonCard className={cn("p-5 border-2", atratividadeConfig.border, atratividadeConfig.bg)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <span className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Avaliação da oportunidade</span>
              <span className={cn("text-lg font-bold mt-0.5", atratividadeConfig.text)}>{atratividadeConfig.label}</span>
              <span className="text-xs text-neutral-400 mt-0.5">{oportunidade.orgao}</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2">
              {score >= 70 ? <TrendingUp className="w-5 h-5 text-green-500" /> : score >= 40 ? <Minus className="w-5 h-5 text-yellow-500" /> : <TrendingDown className="w-5 h-5 text-red-500" />}
              <span className={cn("text-4xl font-bold tabular-nums", atratividadeConfig.text)}>{score}</span>
            </div>
            <div className="w-40 h-2 bg-neutral-200 rounded-full overflow-hidden">
              <div className={cn("h-full rounded-full transition-all", atratividadeConfig.bar)} style={{ width: `${score}%` }} />
            </div>
            <span className="text-xs text-neutral-400">Score 0–100</span>
          </div>
        </div>
      </NeonCard>

      {/* Cards de métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map((m) => (
          <NeonCard key={m.label} className="p-4">
            <p className="text-xs font-medium text-neutral-500">{m.label}</p>
            <p className={cn("text-xl font-semibold mt-1 tracking-tight", m.color)}>{m.value}</p>
            <p className="text-xs text-neutral-400 mt-0.5">{m.sub}</p>
          </NeonCard>
        ))}
      </div>
    </div>
  );
}
