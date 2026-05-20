import {
  TrendingUp,
  DollarSign,
  Clock,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ChevronUp,
  ChevronDown,
  FileText,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { getStatusLabel, getStatusColor } from "@/lib/mock-data";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle, CardValue, CardDescription } from "@/components/ui/card";
import { NeonCard } from "@/components/shared/neon-card";
import { supabase } from "@/lib/supabase";
import type { LicitacaoRow } from "@/lib/database.types";
import type { LicitacaoStatus } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

const ACTIVE_STATUSES = ["em_analise", "em_cotacao", "proposta_pronta", "em_disputa"];

export default async function DashboardPage() {
  const [
    { data: licitacoesData, error: licitacoesError },
    { count: fornecedoresAguardando },
    { count: itensSemCotacao },
  ] = await Promise.all([
    supabase.from("licitacoes").select("*").order("created_at", { ascending: false }),
    supabase.from("cotacoes").select("*", { count: "exact", head: true }).eq("status", "enviada"),
    supabase.from("itens_licitacao").select("*", { count: "exact", head: true }).eq("status", "sem_cotacao"),
  ]);

  if (licitacoesError) {
    console.error("Dashboard: erro ao buscar licitações:", licitacoesError.message);
  }

  const licitacoes: LicitacaoRow[] = licitacoesData ?? [];

  const licitacoesAtivas = licitacoes.filter((l) => ACTIVE_STATUSES.includes(l.status));
  const valorTotalAberto = licitacoesAtivas.reduce((sum, l) => sum + (l.valor_estimado ?? 0), 0);
  const propostasParaEnvio = licitacoes.filter((l) => l.status === "proposta_pronta").length;

  const metricCards = [
    {
      title: "Licitações ativas",
      href: "/licitacoes",
      value: String(licitacoesAtivas.length),
      description: "Em análise, cotação ou disputa",
      icon: TrendingUp,
      color: "text-[#06B6D4]",
      bg: "bg-[#ECFEFF]",
      trend: `${licitacoes.length} total`,
      trendUp: licitacoesAtivas.length > 0,
    },
    {
      title: "Valor total em aberto",
      href: "/licitacoes",
      value: valorTotalAberto > 0 ? formatCurrency(valorTotalAberto) : "R$ 0",
      description: "Valor estimado das licitações ativas",
      icon: DollarSign,
      color: "text-[#0E9F6E]",
      bg: "bg-[#E8F7F2]",
      trend: licitacoesAtivas.length > 0 ? "Licitações ativas" : "Nenhuma ativa",
      trendUp: licitacoesAtivas.length > 0,
    },
    {
      title: "Fornecedores aguardando",
      href: "/cotacoes",
      value: String(fornecedoresAguardando ?? 0),
      description: "Cotações enviadas sem resposta",
      icon: Clock,
      color: "text-[#D97706]",
      bg: "bg-[#FEF9EB]",
      trend: "Aguardando resposta",
      trendUp: false,
    },
    {
      title: "Itens sem cotação",
      href: "/licitacoes",
      value: String(itensSemCotacao ?? 0),
      description: "Precisam de fornecedor",
      icon: AlertCircle,
      color: "text-[#E02424]",
      bg: "bg-[#FEF0F0]",
      trend: (itensSemCotacao ?? 0) > 0 ? "Ação necessária" : "Tudo em ordem",
      trendUp: false,
    },
    {
      title: "Propostas para envio",
      href: "/licitacoes",
      value: String(propostasParaEnvio),
      description: "Prontas para submissão",
      icon: CheckCircle2,
      color: "text-[#0E9F6E]",
      bg: "bg-[#E8F7F2]",
      trend: propostasParaEnvio > 0 ? "Aguardando envio" : "Nenhuma pendente",
      trendUp: propostasParaEnvio > 0,
    },
  ];

  const proximosPrazos = licitacoes.filter((l) =>
    ["em_cotacao", "proposta_pronta", "em_analise"].includes(l.status) && l.data_pregao
  );

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">Dashboard</h1>
        <p className="text-sm text-neutral-500 mt-0.5">
          Visão geral das licitações e cotações — atualizado agora
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
            <p className="text-xs text-neutral-400 mt-0.5">
              {licitacoes.length} licitaç{licitacoes.length !== 1 ? "ões" : "ão"} no total
            </p>
          </div>
          {licitacoes.length > 0 && (
            <Link
              href="/licitacoes"
              className="flex items-center gap-1 text-xs font-medium text-[#06B6D4] hover:text-[#0891B2] transition-colors"
            >
              Ver todas
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        <NeonCard className="shadow-card overflow-hidden">
          {licitacoes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-6">
              <div className="w-12 h-12 rounded-full bg-[#ECFEFF] flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-[#06B6D4]" />
              </div>
              <p className="text-sm font-semibold text-neutral-800 mb-1">
                Nenhuma licitação cadastrada ainda
              </p>
              <p className="text-xs text-neutral-400 mb-5 max-w-xs">
                Cadastre a primeira licitação para começar a acompanhar os processos aqui no Dashboard.
              </p>
              <Link
                href="/licitacoes"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#06B6D4] hover:bg-[#0891B2] rounded-md transition-colors"
              >
                <Plus className="w-4 h-4" />
                Nova Licitação
              </Link>
            </div>
          ) : (
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
                {licitacoes.slice(0, 10).map((lic) => (
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
                          {lic.numero_processo}
                        </p>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className="text-sm font-medium text-neutral-800 tabular-nums">
                        {lic.valor_estimado != null ? formatCurrency(lic.valor_estimado) : "—"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className="text-sm text-neutral-600">
                        {lic.data_pregao ? formatDate(lic.data_pregao) : "—"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${getStatusColor(lic.status as LicitacaoStatus)}`}>
                        {getStatusLabel(lic.status as LicitacaoStatus)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 min-w-[120px]">
                        <Progress value={lic.progresso} className="flex-1" />
                        <span className="text-xs text-neutral-500 tabular-nums w-8 text-right">
                          {lic.progresso}%
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <Link
                        href={`/licitacoes/${lic.id}`}
                        className="text-xs font-medium text-[#06B6D4] hover:text-[#0891B2] opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1"
                      >
                        Ver
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </NeonCard>
      </div>

      {/* Quick actions + Próximos prazos */}
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
              <div className="w-7 h-7 rounded-md bg-[#ECFEFF] flex items-center justify-center">
                <TrendingUp className="w-3.5 h-3.5 text-[#06B6D4]" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-neutral-700">Nova licitação</p>
                <p className="text-xs text-neutral-400">Cadastrar processo</p>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-neutral-300 group-hover:text-[#06B6D4] transition-colors" />
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
              <ArrowRight className="w-3.5 h-3.5 text-neutral-300 group-hover:text-[#06B6D4] transition-colors" />
            </Link>
          </div>
        </NeonCard>

        <NeonCard className="col-span-2 p-5 shadow-card">
          <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3">
            Próximos prazos
          </h3>
          {proximosPrazos.length === 0 ? (
            <p className="text-xs text-neutral-400">Nenhum prazo cadastrado</p>
          ) : (
            <div className="space-y-3">
              {proximosPrazos.slice(0, 5).map((lic) => {
                const daysUntil = Math.ceil(
                  (new Date(lic.data_pregao!).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                );
                return (
                  <Link key={lic.id} href={`/licitacoes/${lic.id}`} className="flex items-center gap-3 group">
                    <div
                      className={`w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                        daysUntil <= 0
                          ? "bg-red-50 text-red-600"
                          : daysUntil <= 7
                          ? "bg-red-50 text-red-600"
                          : daysUntil <= 14
                          ? "bg-yellow-50 text-yellow-600"
                          : "bg-neutral-100 text-neutral-500"
                      }`}
                    >
                      {daysUntil > 0 ? daysUntil : "Hj"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-800 truncate group-hover:text-[#06B6D4] transition-colors">
                        {lic.orgao}
                      </p>
                      <p className="text-xs text-neutral-400">
                        Pregão em {formatDate(lic.data_pregao!)}
                      </p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${getStatusColor(lic.status as LicitacaoStatus)}`}>
                      {getStatusLabel(lic.status as LicitacaoStatus)}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </NeonCard>
      </div>
    </div>
  );
}
