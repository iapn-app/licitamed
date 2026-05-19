import {
  TrendingUp,
  DollarSign,
  Clock,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import Link from "next/link";
import {
  licitacoes,
  DASHBOARD_METRICS,
  getLicitacaoProgress,
  getStatusLabel,
  getStatusColor,
} from "@/lib/mock-data";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle, CardValue, CardDescription } from "@/components/ui/card";
import { NeonCard } from "@/components/shared/neon-card";

const metricCards = [
  {
    title: "Licitações ativas",
    href: "/licitacoes",
    value: String(DASHBOARD_METRICS.licitacoesAtivas),
    description: "Em cotação, disputa ou proposta",
    icon: TrendingUp,
    color: "text-[#1A56DB]",
    bg: "bg-[#EBF0FD]",
    trend: "+1 este mês",
    trendUp: true,
  },
  {
    title: "Valor total em aberto",
    href: "/licitacoes",
    value: formatCurrency(DASHBOARD_METRICS.valorTotalAberto),
    description: "Valor estimado das licitações ativas",
    icon: DollarSign,
    color: "text-[#0E9F6E]",
    bg: "bg-[#E8F7F2]",
    trend: "R$ 23,3M no mês anterior",
    trendUp: false,
  },
  {
    title: "Fornecedores aguardando",
    href: "/cotacoes",
    value: String(DASHBOARD_METRICS.fornecedoresAguardando),
    description: "Cotações enviadas sem resposta",
    icon: Clock,
    color: "text-[#D97706]",
    bg: "bg-[#FEF9EB]",
    trend: "2 com prazo hoje",
    trendUp: false,
  },
  {
    title: "Itens sem cotação",
    href: "/licitacoes",
    value: String(DASHBOARD_METRICS.itensSemCotacao),
    description: "Precisam de fornecedor",
    icon: AlertCircle,
    color: "text-[#E02424]",
    bg: "bg-[#FEF0F0]",
    trend: "Ação necessária",
    trendUp: false,
  },
  {
    title: "Propostas para envio",
    href: "/licitacoes",
    value: String(DASHBOARD_METRICS.propostasParaEnvio),
    description: "Prontas para submissão",
    icon: CheckCircle2,
    color: "text-[#0E9F6E]",
    bg: "bg-[#E8F7F2]",
    trend: "Prazo: 30/05",
    trendUp: true,
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">Dashboard</h1>
        <p className="text-sm text-neutral-500 mt-0.5">
          Visão geral das licitações e cotações — atualizado hoje
        </p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {metricCards.map((metric) => {
          const Icon = metric.icon;
          return (
            <Link key={metric.title} href={metric.href} className="block">
              <Card className="neon-card cursor-pointer h-full">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle>{metric.title}</CardTitle>
                    <div className={`w-7 h-7 rounded-md ${metric.bg} flex items-center justify-center`}>
                      <Icon className={`w-3.5 h-3.5 ${metric.color}`} />
                    </div>
                  </div>
                  <CardValue className="text-xl mt-2">{metric.value}</CardValue>
                  <CardDescription>{metric.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-1 text-xs">
                    {metric.trendUp ? (
                      <ChevronUp className="w-3 h-3 text-[#0E9F6E]" />
                    ) : (
                      <ChevronDown className="w-3 h-3 text-neutral-400" />
                    )}
                    <span className="text-neutral-400">{metric.trend}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Recent licitações */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-neutral-900">Licitações recentes</h2>
            <p className="text-xs text-neutral-400 mt-0.5">{licitacoes.length} licitações no total</p>
          </div>
          <Link
            href="/licitacoes"
            className="flex items-center gap-1 text-xs font-medium text-[#1A56DB] hover:text-[#1547BF] transition-colors"
          >
            Ver todas
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <NeonCard className="shadow-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-100">
                <th className="text-left px-5 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide">
                  Licitação / Órgão
                </th>
                <th className="text-right px-5 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide">
                  Valor estimado
                </th>
                <th className="text-center px-5 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide">
                  Pregão
                </th>
                <th className="text-center px-5 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide">
                  Status
                </th>
                <th className="px-5 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide">
                  Progresso
                </th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {licitacoes.map((lic) => {
                const progress = getLicitacaoProgress(lic);
                return (
                  <tr
                    key={lic.id}
                    className="hover:bg-neutral-50 transition-colors duration-100 group relative cursor-pointer"
                  >
                    <td className="px-5 py-4">
                      <Link href={`/licitacoes/${lic.id}`} className="absolute inset-0 z-10" aria-label={`Ver licitação ${lic.orgao}`} />
                      <div>
                        <p className="text-sm font-medium text-neutral-900 leading-tight">
                          {lic.orgao}
                        </p>
                        <p className="text-xs text-neutral-400 mt-0.5 truncate max-w-[300px]">
                          {lic.numeroProcesso}
                        </p>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className="text-sm font-medium text-neutral-800 tabular-nums">
                        {formatCurrency(lic.valorEstimado)}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className="text-sm text-neutral-600">
                        {formatDate(lic.dataPregao)}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${getStatusColor(lic.status)}`}
                      >
                        {getStatusLabel(lic.status)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 min-w-[120px]">
                        <Progress value={progress} className="flex-1" />
                        <span className="text-xs text-neutral-500 tabular-nums w-8 text-right">
                          {progress}%
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <Link
                        href={`/licitacoes/${lic.id}`}
                        className="text-xs font-medium text-[#1A56DB] hover:text-[#1547BF] opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1"
                      >
                        Ver
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </NeonCard>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-3 gap-4">
        <NeonCard className="p-5 shadow-card">
          <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3">
            Ações rápidas
          </h3>
          <div className="space-y-2">
            <Link
              href="/licitacoes"
              className="flex items-center gap-3 p-2 rounded-md hover:bg-neutral-50 transition-colors group"
            >
              <div className="w-7 h-7 rounded-md bg-[#EBF0FD] flex items-center justify-center">
                <TrendingUp className="w-3.5 h-3.5 text-[#1A56DB]" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-neutral-700">Nova licitação</p>
                <p className="text-xs text-neutral-400">Cadastrar processo</p>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-neutral-300 group-hover:text-[#1A56DB] transition-colors" />
            </Link>
            <Link
              href="/fornecedores"
              className="flex items-center gap-3 p-2 rounded-md hover:bg-neutral-50 transition-colors group"
            >
              <div className="w-7 h-7 rounded-md bg-[#E8F7F2] flex items-center justify-center">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#0E9F6E]" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-neutral-700">Enviar cotações</p>
                <p className="text-xs text-neutral-400">Para fornecedores</p>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-neutral-300 group-hover:text-[#1A56DB] transition-colors" />
            </Link>
          </div>
        </NeonCard>

        <NeonCard className="col-span-2 p-5 shadow-card">
          <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3">
            Próximos prazos
          </h3>
          <div className="space-y-3">
            {licitacoes
              .filter((l) => ["em_cotacao", "proposta_pronta"].includes(l.status))
              .map((lic) => {
                const daysUntil = Math.ceil(
                  (new Date(lic.dataPregao).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                );
                return (
                  <div key={lic.id} className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                        daysUntil <= 7
                          ? "bg-red-50 text-red-600"
                          : daysUntil <= 14
                          ? "bg-yellow-50 text-yellow-600"
                          : "bg-neutral-100 text-neutral-500"
                      }`}
                    >
                      {daysUntil > 0 ? daysUntil : "Hoje"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-800 truncate">
                        {lic.orgao}
                      </p>
                      <p className="text-xs text-neutral-400">
                        Pregão em {formatDate(lic.dataPregao)}
                      </p>
                    </div>
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full border ${getStatusColor(lic.status)}`}
                    >
                      {getStatusLabel(lic.status)}
                    </span>
                  </div>
                );
              })}
          </div>
        </NeonCard>
      </div>
    </div>
  );
}
