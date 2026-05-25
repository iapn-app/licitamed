"use client";

import { useState } from "react";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Minus,
  Trophy,
  DollarSign,
  Target,
  Building2,
  Zap,
  Info,
  AlertCircle,
  CheckCircle2,
  MapPin,
  Clock,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type Tendencia = "subindo" | "estavel" | "caindo";
type PagadorStatus = "bom" | "medio" | "lento";
type AlertaTipo = "alta" | "media" | "info";

interface MonthlyData {
  month: string;
  participadas: number;
  ganhas: number;
  valor: number;
}

interface MarketItem {
  item: string;
  media: number;
  minimo: number;
  maximo: number;
  frequencia: number;
  tendencia: Tendencia;
}

interface StateShare {
  uf: string;
  estado: string;
  valor: number;
  contratos: number;
}

interface OrgaoItem {
  nome: string;
  uf: string;
  valor: number;
  contratos: number;
  prazo: number;
  status: PagadorStatus;
}

interface Alerta {
  id: string;
  tipo: AlertaTipo;
  titulo: string;
  descricao: string;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const ALL_MONTHS: MonthlyData[] = [
  { month: "Jun/24", participadas: 3, ganhas: 1, valor: 850000 },
  { month: "Jul/24", participadas: 4, ganhas: 2, valor: 1200000 },
  { month: "Ago/24", participadas: 5, ganhas: 1, valor: 340000 },
  { month: "Set/24", participadas: 6, ganhas: 3, valor: 2100000 },
  { month: "Out/24", participadas: 4, ganhas: 1, valor: 560000 },
  { month: "Nov/24", participadas: 7, ganhas: 3, valor: 1850000 },
  { month: "Dez/24", participadas: 5, ganhas: 2, valor: 920000 },
  { month: "Jan/25", participadas: 3, ganhas: 1, valor: 450000 },
  { month: "Fev/25", participadas: 6, ganhas: 2, valor: 1340000 },
  { month: "Mar/25", participadas: 8, ganhas: 3, valor: 2250000 },
  { month: "Abr/25", participadas: 7, ganhas: 2, valor: 1100000 },
  { month: "Mai/25", participadas: 6, ganhas: 3, valor: 1890000 },
];

const MARKET_ITEMS: MarketItem[] = [
  { item: "Luva nitrílica M",           media: 0.89, minimo: 0.72, maximo: 1.10,  frequencia: 47, tendencia: "estavel" },
  { item: "Seringa 10ml",               media: 0.42, minimo: 0.35, maximo: 0.58,  frequencia: 38, tendencia: "subindo" },
  { item: "Gaze estéril 7,5x7,5",       media: 0.18, minimo: 0.14, maximo: 0.24,  frequencia: 29, tendencia: "caindo"  },
  { item: "Álcool 70% 1L",              media: 8.90, minimo: 7.20, maximo: 11.50, frequencia: 22, tendencia: "subindo" },
  { item: "Máscara cirúrgica tripla",    media: 0.31, minimo: 0.24, maximo: 0.42,  frequencia: 31, tendencia: "estavel" },
  { item: "Equipo macrogotas",           media: 1.45, minimo: 1.10, maximo: 1.85,  frequencia: 18, tendencia: "estavel" },
  { item: "Soro fisiológico 500ml",      media: 4.20, minimo: 3.60, maximo: 5.10,  frequencia: 25, tendencia: "caindo"  },
  { item: "Avental descartável",         media: 2.80, minimo: 2.20, maximo: 3.50,  frequencia: 15, tendencia: "estavel" },
];

const STATES: StateShare[] = [
  { uf: "RJ", estado: "Rio de Janeiro",  valor: 12400000, contratos: 18 },
  { uf: "SP", estado: "São Paulo",       valor: 3850000,  contratos: 7  },
  { uf: "MG", estado: "Minas Gerais",    valor: 1900000,  contratos: 4  },
  { uf: "ES", estado: "Espírito Santo",  valor: 890000,   contratos: 3  },
  { uf: "BA", estado: "Bahia",           valor: 560000,   contratos: 2  },
];

const ORGAOS: OrgaoItem[] = [
  { nome: "Ministério da Saúde",               uf: "DF", valor: 8900000, contratos: 1, prazo: 120, status: "lento"  },
  { nome: "Secretaria Estadual de Saúde RJ",   uf: "RJ", valor: 3850000, contratos: 3, prazo: 45,  status: "bom"    },
  { nome: "Hospital Federal dos Servidores",   uf: "RJ", valor: 2100000, contratos: 2, prazo: 62,  status: "medio"  },
  { nome: "Prefeitura de Nova Iguaçu",         uf: "RJ", valor: 1450000, contratos: 4, prazo: 89,  status: "lento"  },
  { nome: "Prefeitura de Duque de Caxias",     uf: "RJ", valor: 980000,  contratos: 2, prazo: 54,  status: "bom"    },
];

const ALERTAS: Alerta[] = [
  {
    id: "1",
    tipo: "alta",
    titulo: "Preço de luvas subiu 18%",
    descricao: "Preço de luvas nitrílicas subiu 18% nos últimos 30 dias. Revisar cotações abertas antes de fechar proposta.",
  },
  {
    id: "2",
    tipo: "media",
    titulo: "Edital SES-RJ previsto para Julho",
    descricao: "Secretaria de Saúde RJ tem histórico de 3 anos consecutivos com edital de descartáveis em Julho. Prepare documentação com antecedência.",
  },
  {
    id: "3",
    tipo: "alta",
    titulo: "Margem em medicamentos abaixo da média",
    descricao: "Margem em medicamentos está 4% abaixo da média dos últimos 6 meses. Verificar precificação nas cotações em aberto.",
  },
  {
    id: "4",
    tipo: "info",
    titulo: "Concorrente ativo em SP: MedRio",
    descricao: "MedRio ganhou 3 licitações este mês em SP com preço médio 12% abaixo do seu. Avaliar estratégia de expansão no estado.",
  },
];

const HEATMAP_CATS = ["Descartáveis", "Medicamentos", "Equipamentos", "EPIs", "Saneantes"];
const HEATMAP_MOS  = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const HEATMAP: number[][] = [
  // Descartáveis
  [4, 3, 3, 2, 2, 3, 4, 3, 2, 2, 3, 3],
  // Medicamentos
  [3, 3, 4, 2, 3, 2, 3, 4, 3, 2, 3, 2],
  // Equipamentos
  [1, 2, 2, 2, 2, 2, 2, 2, 3, 3, 4, 4],
  // EPIs
  [2, 4, 4, 3, 2, 2, 2, 3, 3, 2, 2, 2],
  // Saneantes
  [4, 2, 2, 2, 2, 3, 4, 2, 2, 2, 2, 3],
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fBRL(v: number, dec = 0) {
  return v.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: dec,
    maximumFractionDigits: dec,
  });
}

function fCompact(v: number) {
  if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `R$ ${(v / 1_000).toFixed(0)}K`;
  return fBRL(v);
}

function heatBg(i: number): string {
  const palette = ["#F9FAFB", "#CFFAFE", "#67E8F9", "#22D3EE", "#0891B2"];
  return palette[Math.min(i, 4)];
}

function heatText(i: number): string {
  return i >= 3 ? "#ffffff" : "#374151";
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TendenciaBadge({ t }: { t: Tendencia }) {
  if (t === "subindo") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-50 text-red-700 border border-red-200">
        <TrendingUp className="w-3 h-3" />
        subindo
      </span>
    );
  }
  if (t === "caindo") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-50 text-green-700 border border-green-200">
        <TrendingDown className="w-3 h-3" />
        caindo
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-neutral-100 text-neutral-600 border border-neutral-200">
      <Minus className="w-3 h-3" />
      estável
    </span>
  );
}

function PagadorBadge({ s }: { s: PagadorStatus }) {
  if (s === "bom") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-50 text-green-700 border border-green-200 whitespace-nowrap">
        <CheckCircle2 className="w-3 h-3" />
        Bom pagador
      </span>
    );
  }
  if (s === "lento") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-50 text-red-700 border border-red-200 whitespace-nowrap">
        <AlertCircle className="w-3 h-3" />
        Pagador lento
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-yellow-50 text-yellow-700 border border-yellow-200 whitespace-nowrap">
      <Minus className="w-3 h-3" />
      Pagador médio
    </span>
  );
}

function AlertaCard({ alerta }: { alerta: Alerta }) {
  const config = {
    alta: {
      border: "border-red-200",
      bg: "bg-red-50",
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
      badge: "bg-red-100 text-red-700 border-red-200",
      label: "Alta",
      Icon: Zap,
    },
    media: {
      border: "border-yellow-200",
      bg: "bg-yellow-50",
      iconBg: "bg-yellow-100",
      iconColor: "text-yellow-600",
      badge: "bg-yellow-100 text-yellow-700 border-yellow-200",
      label: "Média",
      Icon: AlertCircle,
    },
    info: {
      border: "border-blue-200",
      bg: "bg-blue-50",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      badge: "bg-blue-100 text-blue-700 border-blue-200",
      label: "Informativo",
      Icon: Info,
    },
  }[alerta.tipo];

  const AlertIcon = config.Icon;

  return (
    <div className={cn("rounded-lg border p-4 flex gap-3", config.border, config.bg)}>
      <div className={cn("w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5", config.iconBg)}>
        <AlertIcon className={cn("w-4 h-4", config.iconColor)} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <p className="text-sm font-semibold text-neutral-900">{alerta.titulo}</p>
          <span className={cn("inline-block text-[10px] font-medium px-2 py-0.5 rounded-full border whitespace-nowrap flex-shrink-0", config.badge)}>
            {config.label}
          </span>
        </div>
        <p className="text-xs text-neutral-600 leading-relaxed">{alerta.descricao}</p>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [periodo, setPeriodo] = useState<"3m" | "6m" | "12m">("6m");

  const chartData =
    periodo === "3m" ? ALL_MONTHS.slice(-3) :
    periodo === "6m" ? ALL_MONTHS.slice(-6) :
    ALL_MONTHS;

  const maxP    = Math.max(...chartData.map(d => d.participadas), 1);
  const maxV    = Math.max(...chartData.map(d => d.valor), 1);
  const totP    = ALL_MONTHS.reduce((s, d) => s + d.participadas, 0);
  const totG    = ALL_MONTHS.reduce((s, d) => s + d.ganhas, 0);
  const totV    = ALL_MONTHS.reduce((s, d) => s + d.valor, 0);
  const maxSt   = Math.max(...STATES.map(s => s.valor), 1);
  const totalSt = STATES.reduce((s, st) => s + st.valor, 0);

  return (
    <div className="space-y-6">

      {/* ─── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <BarChart3 className="w-5 h-5 text-[#06B6D4]" />
            <h1 className="text-xl font-semibold text-neutral-900">Analytics & Inteligência</h1>
          </div>
          <p className="text-sm text-neutral-500">
            Inteligência comercial baseada nos seus dados reais e no mercado público de saúde
          </p>
        </div>
        <span className="flex items-center gap-1.5 px-2.5 py-1 bg-cyan-50 border border-cyan-200 rounded-full text-xs font-medium text-cyan-700 whitespace-nowrap flex-shrink-0">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Dados do PNCP + histórico POWER MED
        </span>
      </div>

      {/* ─── KPI Cards ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
        {[
          {
            Icon: Target,
            color: "bg-blue-50",
            ic: "text-blue-600",
            label: "Licitações participadas",
            value: String(totP),
            sub: "últimos 12 meses",
          },
          {
            Icon: Trophy,
            color: "bg-green-50",
            ic: "text-green-600",
            label: "Taxa de vitória",
            value: `${Math.round((totG / totP) * 100)}%`,
            sub: `${totG} ganhas de ${totP}`,
          },
          {
            Icon: TrendingUp,
            color: "bg-purple-50",
            ic: "text-purple-600",
            label: "Margem média real",
            value: "22%",
            sub: "média ponderada dos contratos",
          },
          {
            Icon: DollarSign,
            color: "bg-cyan-50",
            ic: "text-[#06B6D4]",
            label: "Valor total ganho",
            value: fCompact(totV),
            sub: "receita bruta acumulada",
          },
          {
            Icon: Building2,
            color: "bg-orange-50",
            ic: "text-orange-600",
            label: "Melhor órgão comprador",
            value: "SES-RJ",
            sub: "Secretaria Estadual de Saúde",
          },
          {
            Icon: Star,
            color: "bg-yellow-50",
            ic: "text-yellow-500",
            label: "Item mais lucrativo",
            value: "Luva nitrílica M",
            sub: "maior margem acumulada",
          },
        ].map(({ Icon, color, ic, label, value, sub }) => (
          <div key={label} className="neon-card bg-white rounded-lg border border-neutral-200 shadow-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className={cn("w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0", color)}>
                <Icon className={cn("w-4 h-4", ic)} />
              </div>
              <p className="text-xs font-medium text-neutral-500 leading-tight">{label}</p>
            </div>
            <p className="text-2xl font-semibold text-neutral-900 truncate">{value}</p>
            <p className="text-xs text-neutral-400 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* ─── Performance por Período ────────────────────────────────────── */}
      <div className="neon-card bg-white rounded-lg border border-neutral-200 shadow-card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 gap-3 flex-wrap">
          <div>
            <h2 className="text-sm font-semibold text-neutral-900">Performance por período</h2>
            <p className="text-xs text-neutral-400 mt-0.5">Licitações participadas, ganhas e valor acumulado</p>
          </div>
          <div className="flex gap-1">
            {(["3m", "6m", "12m"] as const).map(p => (
              <button
                key={p}
                onClick={() => setPeriodo(p)}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                  periodo === p
                    ? "bg-[#06B6D4] text-white"
                    : "text-neutral-600 hover:bg-neutral-100"
                )}
              >
                {p === "3m" ? "3 meses" : p === "6m" ? "6 meses" : "12 meses"}
              </button>
            ))}
          </div>
        </div>
        <div className="p-5">
          <div className="flex items-center gap-4 mb-5">
            <span className="flex items-center gap-1.5 text-xs text-neutral-500">
              <span className="w-3 h-3 rounded-sm bg-cyan-200 inline-block" />
              Participadas
            </span>
            <span className="flex items-center gap-1.5 text-xs text-neutral-500">
              <span className="w-3 h-3 rounded-sm bg-[#06B6D4] inline-block" />
              Ganhas
            </span>
            <span className="flex items-center gap-1.5 text-xs text-neutral-500">
              <span className="w-3 h-3 rounded-sm bg-purple-400 inline-block" />
              Valor (relativo)
            </span>
          </div>
          <div className="flex items-end gap-2 h-40 overflow-x-auto pb-1">
            {chartData.map(d => (
              <div
                key={d.month}
                className="flex flex-col items-center gap-1 flex-shrink-0"
                style={{ minWidth: "56px" }}
              >
                <div className="flex items-end gap-0.5 w-full h-32">
                  <div
                    className="flex-1 bg-cyan-200 rounded-t-sm min-h-[2px] transition-all duration-300"
                    style={{ height: `${Math.max(2, Math.round((d.participadas / maxP) * 100))}%` }}
                    title={`Participadas: ${d.participadas}`}
                  />
                  <div
                    className="flex-1 bg-[#06B6D4] rounded-t-sm min-h-[2px] transition-all duration-300"
                    style={{ height: `${Math.max(2, Math.round((d.ganhas / maxP) * 100))}%` }}
                    title={`Ganhas: ${d.ganhas}`}
                  />
                  <div
                    className="flex-1 bg-purple-400 rounded-t-sm min-h-[2px] transition-all duration-300"
                    style={{ height: `${Math.max(2, Math.round((d.valor / maxV) * 100))}%` }}
                    title={`Valor: ${fCompact(d.valor)}`}
                  />
                </div>
                <span className="text-[10px] text-neutral-400 whitespace-nowrap">{d.month}</span>
                <span className="text-[10px] font-medium text-neutral-600">{d.ganhas}/{d.participadas}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Preços vencedores do mercado ───────────────────────────────── */}
      <div className="neon-card bg-white rounded-lg border border-neutral-200 shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-100">
          <h2 className="text-sm font-semibold text-neutral-900">Preços vencedores do mercado</h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Histórico de preços praticados em licitações públicas — últimos 30 dias via PNCP
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50">
                <th className="text-left text-xs font-medium text-neutral-500 px-4 py-3">Item</th>
                <th className="text-right text-xs font-medium text-neutral-500 px-4 py-3">Preço médio</th>
                <th className="text-right text-xs font-medium text-neutral-500 px-4 py-3">Mínimo</th>
                <th className="text-right text-xs font-medium text-neutral-500 px-4 py-3">Máximo</th>
                <th className="text-right text-xs font-medium text-neutral-500 px-4 py-3 hidden lg:table-cell">Freq.</th>
                <th className="text-center text-xs font-medium text-neutral-500 px-4 py-3">Tendência</th>
              </tr>
            </thead>
            <tbody>
              {MARKET_ITEMS.map((item, i) => (
                <tr
                  key={item.item}
                  className={cn(
                    "hover:bg-neutral-50 transition-colors",
                    i < MARKET_ITEMS.length - 1 && "border-b border-neutral-50"
                  )}
                >
                  <td className="px-4 py-3 text-sm font-medium text-neutral-900">{item.item}</td>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-neutral-900">
                    {fBRL(item.media, 2)}
                  </td>
                  <td className="px-4 py-3 text-right text-xs text-green-700 font-medium">
                    {fBRL(item.minimo, 2)}
                  </td>
                  <td className="px-4 py-3 text-right text-xs text-red-600 font-medium">
                    {fBRL(item.maximo, 2)}
                  </td>
                  <td className="px-4 py-3 text-right text-xs text-neutral-500 hidden lg:table-cell">
                    {item.frequencia}×
                  </td>
                  <td className="px-4 py-3 text-center">
                    <TendenciaBadge t={item.tendencia} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Market Share + Órgãos ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

        {/* Market Share por Estado */}
        <div className="neon-card bg-white rounded-lg border border-neutral-200 shadow-card">
          <div className="px-5 py-4 border-b border-neutral-100">
            <h2 className="text-sm font-semibold text-neutral-900">Market share por estado</h2>
            <p className="text-xs text-neutral-400 mt-0.5">Participação nas vendas por UF</p>
          </div>
          <div className="p-5 space-y-4">
            {STATES.map(s => (
              <div key={s.uf}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-6 rounded text-[10px] font-bold flex items-center justify-center bg-neutral-100 text-neutral-700 flex-shrink-0">
                      {s.uf}
                    </span>
                    <span className="text-xs font-medium text-neutral-700">{s.estado}</span>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-xs font-semibold text-neutral-900">{fCompact(s.valor)}</span>
                    <span className="text-[10px] text-neutral-400 ml-1.5">{s.contratos} contratos</span>
                  </div>
                </div>
                <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                  <div
                    className="h-2 bg-[#06B6D4] rounded-full transition-all duration-500"
                    style={{ width: `${Math.round((s.valor / maxSt) * 100)}%` }}
                  />
                </div>
                <p className="text-[10px] text-neutral-400 mt-1 text-right">
                  {Math.round((s.valor / totalSt) * 100)}% do total
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Órgãos mais valiosos */}
        <div className="neon-card bg-white rounded-lg border border-neutral-200 shadow-card overflow-hidden">
          <div className="px-5 py-4 border-b border-neutral-100">
            <h2 className="text-sm font-semibold text-neutral-900">Órgãos mais valiosos</h2>
            <p className="text-xs text-neutral-400 mt-0.5">Ranking por valor contratado</p>
          </div>
          <div className="divide-y divide-neutral-50">
            {ORGAOS.map((o, i) => (
              <div key={o.nome} className="flex items-center gap-3 px-5 py-3.5 hover:bg-neutral-50 transition-colors">
                <span className="w-6 h-6 rounded-full bg-neutral-100 text-[11px] font-bold text-neutral-500 flex items-center justify-center flex-shrink-0">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-neutral-900 truncate">{o.nome}</p>
                  <div className="flex items-center gap-2.5 mt-0.5 flex-wrap">
                    <span className="flex items-center gap-0.5 text-[10px] text-neutral-400">
                      <MapPin className="w-3 h-3" />{o.uf}
                    </span>
                    <span className="text-[10px] text-neutral-400">
                      {o.contratos} contrato{o.contratos > 1 ? "s" : ""}
                    </span>
                    <span className="flex items-center gap-0.5 text-[10px] text-neutral-400">
                      <Clock className="w-3 h-3" />{o.prazo}d
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <span className="text-xs font-semibold text-neutral-900">{fCompact(o.valor)}</span>
                  <PagadorBadge s={o.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Sazonalidade ────────────────────────────────────────────────── */}
      <div className="neon-card bg-white rounded-lg border border-neutral-200 shadow-card">
        <div className="px-5 py-4 border-b border-neutral-100">
          <h2 className="text-sm font-semibold text-neutral-900">Sazonalidade de editais</h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Concentração histórica de editais hospitalares por mês e categoria — baseado nos últimos 3 anos do PNCP
          </p>
        </div>
        <div className="p-5 overflow-x-auto">
          <div style={{ minWidth: "600px" }}>
            {/* Month headers */}
            <div className="flex gap-1 mb-1 pl-28">
              {HEATMAP_MOS.map(m => (
                <div key={m} className="flex-1 text-center text-[10px] font-medium text-neutral-500">
                  {m}
                </div>
              ))}
            </div>
            {/* Rows */}
            {HEATMAP_CATS.map((cat, ci) => (
              <div key={cat} className="flex items-center gap-1 mb-1">
                <div className="w-28 text-xs text-neutral-600 font-medium flex-shrink-0 pr-2 text-right leading-tight">
                  {cat}
                </div>
                {HEATMAP[ci].map((intensity, mi) => (
                  <div
                    key={mi}
                    className="flex-1 h-8 rounded-sm flex items-center justify-center text-[10px] font-semibold transition-colors"
                    style={{
                      backgroundColor: heatBg(intensity),
                      color: heatText(intensity),
                    }}
                    title={`${cat} — ${HEATMAP_MOS[mi]}: intensidade ${intensity}/4`}
                  >
                    {intensity > 0 ? intensity : ""}
                  </div>
                ))}
              </div>
            ))}
            {/* Legend */}
            <div className="flex items-center gap-2 mt-4 pl-28">
              <span className="text-[10px] text-neutral-400 mr-1">Intensidade:</span>
              {[0, 1, 2, 3, 4].map(i => (
                <div key={i} className="flex items-center gap-1">
                  <div
                    className="w-5 h-5 rounded-sm border border-neutral-200 flex-shrink-0"
                    style={{ backgroundColor: heatBg(i) }}
                  />
                  {(i === 0 || i === 4) && (
                    <span className="text-[10px] text-neutral-400">
                      {i === 0 ? "Baixo" : "Alto"}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Alertas de Inteligência ─────────────────────────────────────── */}
      <div>
        <h2 className="text-sm font-semibold text-neutral-900 mb-4">Alertas de inteligência</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {ALERTAS.map(alerta => (
            <AlertaCard key={alerta.id} alerta={alerta} />
          ))}
        </div>
      </div>

    </div>
  );
}
