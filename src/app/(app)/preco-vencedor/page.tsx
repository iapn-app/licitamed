"use client";

import { useState } from "react";
import { Sparkles, Download, DollarSign, TrendingUp, AlertTriangle, ShoppingCart, BarChart2 } from "lucide-react";
import { PriceScenarioCard } from "@/components/preco-vencedor/PriceScenarioCard";
import { SmartPriceTable } from "@/components/preco-vencedor/SmartPriceTable";
import { PriceAlerts } from "@/components/preco-vencedor/PriceAlerts";
import { NeonCard } from "@/components/shared/neon-card";
import { formatCurrency } from "@/lib/utils";
import type { SimulacaoPreco, EstrategiaPreco } from "@/types/preco";

const simulacoes: SimulacaoPreco[] = [
  {
    licitacao_id: "1",
    licitacao_orgao: "SMS Nova Iguaçu — PE-SMSNIgu-023/2025",
    total_itens: 8,
    margem_media: 18,
    valor_total_compra: 68420,
    valor_total_sugerido: 83182,
    lucro_bruto: 14762,
    itens_com_risco: 1,
    cenarios: [
      { tipo: "agressivo", label: "Agressivo", chance_ganhar: 78, margem: 8, valor_total: 73895, lucro_estimado: 5475 },
      { tipo: "equilibrado", label: "Equilibrado", chance_ganhar: 55, margem: 18, valor_total: 83182, lucro_estimado: 14762 },
      { tipo: "conservador", label: "Conservador", chance_ganhar: 28, margem: 27, valor_total: 94593, lucro_estimado: 26173 },
    ],
    alertas: [
      { tipo: "margem", mensagem: "Soro fisiológico 500ml com margem de 4% — abaixo do mínimo de 8%", item: "Soro fisiológico 500ml", severidade: "alta" },
      { tipo: "fornecedor", mensagem: "MedRio Distribuidora cotou Equipo macrogotas 18% acima do histórico", item: "Equipo macrogotas", severidade: "media" },
      { tipo: "cmed", mensagem: "Verificar teto PMVG para medicamentos antes de fechar proposta", severidade: "baixa" },
    ],
    itens: [
      { id: "1", nome: "Luva nitrílica M", categoria: "EPI", quantidade: 5000, unidade: "cx 100un", menor_cotacao: 32.50, preco_historico: 35.00, preco_sugerido: 42.00, margem: 22, risco: "baixo", estrategia: "equilibrado", fornecedor: "MedRio Distribuidora" },
      { id: "2", nome: "Seringa 10ml s/ agulha", categoria: "Descartáveis", quantidade: 3000, unidade: "cx 100un", menor_cotacao: 18.90, preco_historico: 19.50, preco_sugerido: 23.50, margem: 19, risco: "baixo", estrategia: "equilibrado", fornecedor: "Hospitalar Brasil" },
      { id: "3", nome: "Gaze estéril 7,5x7,5", categoria: "Curativos", quantidade: 2000, unidade: "pct 10un", menor_cotacao: 4.20, preco_historico: 4.50, preco_sugerido: 5.40, margem: 22, risco: "baixo", estrategia: "equilibrado", fornecedor: "Saúde Max" },
      { id: "4", nome: "Álcool 70% 1L", categoria: "Saneantes", quantidade: 500, unidade: "un", menor_cotacao: 6.80, preco_historico: 7.20, preco_sugerido: 8.50, margem: 20, risco: "baixo", estrategia: "equilibrado", fornecedor: "Rio Med Supply" },
      { id: "5", nome: "Equipo macrogotas", categoria: "Descartáveis", quantidade: 1500, unidade: "un", menor_cotacao: 2.90, preco_historico: 2.45, preco_sugerido: 3.50, margem: 17, risco: "medio", estrategia: "equilibrado", fornecedor: "MedRio Distribuidora" },
      { id: "6", nome: "Máscara cirúrgica tripla", categoria: "EPI", quantidade: 10000, unidade: "cx 50un", menor_cotacao: 14.50, preco_historico: 15.00, preco_sugerido: 18.00, margem: 19, risco: "baixo", estrategia: "equilibrado", fornecedor: "Global Med" },
      { id: "7", nome: "Avental descartável", categoria: "EPI", quantidade: 2000, unidade: "cx 50un", menor_cotacao: 28.00, preco_historico: 29.00, preco_sugerido: 35.00, margem: 20, risco: "baixo", estrategia: "equilibrado", fornecedor: "Saúde Max" },
      { id: "8", nome: "Soro fisiológico 500ml", categoria: "Soluções", quantidade: 800, unidade: "cx 16un", menor_cotacao: 42.00, preco_historico: 40.00, preco_sugerido: 43.80, margem: 4, risco: "alto", estrategia: "nao_recomendado", fornecedor: "Hospitalar Brasil" },
    ],
  },
  {
    licitacao_id: "2",
    licitacao_orgao: "Hospital Federal do Andaraí — PE-HFA-012/2025",
    total_itens: 6,
    margem_media: 21,
    valor_total_compra: 42300,
    valor_total_sugerido: 54244,
    lucro_bruto: 11944,
    itens_com_risco: 0,
    cenarios: [
      { tipo: "agressivo", label: "Agressivo", chance_ganhar: 82, margem: 10, valor_total: 46992, lucro_estimado: 4692 },
      { tipo: "equilibrado", label: "Equilibrado", chance_ganhar: 61, margem: 21, valor_total: 54244, lucro_estimado: 11944 },
      { tipo: "conservador", label: "Conservador", chance_ganhar: 31, margem: 30, valor_total: 62007, lucro_estimado: 19707 },
    ],
    alertas: [
      { tipo: "logistica", mensagem: "Custo de entrega em Andaraí pode reduzir margem em até 1,5%", severidade: "baixa" },
    ],
    itens: [
      { id: "1", nome: "Luva nitrílica P", categoria: "EPI", quantidade: 3000, unidade: "cx 100un", menor_cotacao: 31.00, preco_historico: 33.00, preco_sugerido: 40.00, margem: 22, risco: "baixo", estrategia: "equilibrado", fornecedor: "MedRio Distribuidora" },
      { id: "2", nome: "Seringa 5ml c/ agulha", categoria: "Descartáveis", quantidade: 5000, unidade: "cx 100un", menor_cotacao: 16.50, preco_historico: 17.00, preco_sugerido: 21.00, margem: 21, risco: "baixo", estrategia: "equilibrado", fornecedor: "Hospitalar Brasil" },
      { id: "3", nome: "Curativo hidrocoloide 10x10", categoria: "Curativos", quantidade: 200, unidade: "cx 10un", menor_cotacao: 58.00, preco_historico: 60.00, preco_sugerido: 74.00, margem: 22, risco: "baixo", estrategia: "equilibrado", fornecedor: "Global Med" },
      { id: "4", nome: "Cateter nasal tipo óculos", categoria: "Descartáveis", quantidade: 500, unidade: "cx 50un", menor_cotacao: 45.00, preco_historico: 46.00, preco_sugerido: 57.00, margem: 21, risco: "baixo", estrategia: "equilibrado", fornecedor: "Saúde Max" },
      { id: "5", nome: "Fita crepe hospitalar", categoria: "Descartáveis", quantidade: 1000, unidade: "rl", menor_cotacao: 3.20, preco_historico: 3.40, preco_sugerido: 4.00, margem: 20, risco: "baixo", estrategia: "equilibrado", fornecedor: "Rio Med Supply" },
      { id: "6", nome: "Bandeja para instrumental", categoria: "Equipamentos", quantidade: 50, unidade: "un", menor_cotacao: 38.00, preco_historico: 40.00, preco_sugerido: 49.00, margem: 22, risco: "baixo", estrategia: "equilibrado", fornecedor: "Global Med" },
    ],
  },
];

export default function PrecoVencedorPage() {
  const [selectedSimulacaoId, setSelectedSimulacaoId] = useState("1");
  const [cenarioSelecionado, setCenarioSelecionado] = useState<EstrategiaPreco>("equilibrado");

  const simulacao = simulacoes.find((s) => s.licitacao_id === selectedSimulacaoId) ?? simulacoes[0];
  const cenarioAtivo = simulacao.cenarios.find((c) => c.tipo === cenarioSelecionado) ?? simulacao.cenarios[1];

  const resumoCards = [
    { label: "Total de itens", value: String(simulacao.total_itens), icon: BarChart2, color: "text-[#1A56DB]", bg: "bg-[#EBF0FD]" },
    { label: "Margem média", value: `${simulacao.margem_media}%`, icon: TrendingUp, color: "text-green-600", bg: "bg-green-50" },
    { label: "Total de compra", value: formatCurrency(simulacao.valor_total_compra), icon: ShoppingCart, color: "text-neutral-600", bg: "bg-neutral-100" },
    { label: "Total sugerido", value: formatCurrency(cenarioAtivo.valor_total), icon: DollarSign, color: "text-[#1A56DB]", bg: "bg-[#EBF0FD]" },
    { label: "Lucro bruto estimado", value: formatCurrency(cenarioAtivo.lucro_estimado), icon: TrendingUp, color: "text-green-600", bg: "bg-green-50" },
    { label: "Itens c/ risco", value: String(simulacao.itens_com_risco), icon: AlertTriangle, color: simulacao.itens_com_risco > 0 ? "text-red-600" : "text-green-600", bg: simulacao.itens_com_risco > 0 ? "bg-red-50" : "bg-green-50" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#1A56DB]" />
            Preço Vencedor IA
          </h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            Monte o melhor preço para ganhar licitações sem perder margem
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end gap-1">
            <label className="text-xs font-medium text-neutral-500">Licitação</label>
            <select
              value={selectedSimulacaoId}
              onChange={(e) => { setSelectedSimulacaoId(e.target.value); setCenarioSelecionado("equilibrado"); }}
              className="text-sm border border-neutral-200 rounded-md px-3 py-1.5 bg-white text-neutral-800 focus:outline-none focus:ring-2 focus:ring-[#1A56DB] min-w-[300px]"
            >
              {simulacoes.map((s) => (
                <option key={s.licitacao_id} value={s.licitacao_id}>{s.licitacao_orgao}</option>
              ))}
            </select>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#1A56DB] rounded-md hover:bg-[#1547BF] transition-colors mt-4">
            <Download className="w-4 h-4" />
            Exportar simulação
          </button>
        </div>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {resumoCards.map((card) => {
          const Icon = card.icon;
          return (
            <NeonCard key={card.label} className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-7 h-7 rounded-md ${card.bg} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-3.5 h-3.5 ${card.color}`} />
                </div>
              </div>
              <p className="text-xs text-neutral-500">{card.label}</p>
              <p className={`text-lg font-semibold mt-0.5 tabular-nums ${card.color}`}>{card.value}</p>
            </NeonCard>
          );
        })}
      </div>

      {/* Simulador de cenários */}
      <div>
        <div className="mb-3">
          <h2 className="text-sm font-semibold text-neutral-900">Simulador de cenários</h2>
          <p className="text-xs text-neutral-400 mt-0.5">Escolha a estratégia de precificação</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {simulacao.cenarios.map((cenario) => (
            <PriceScenarioCard
              key={cenario.tipo}
              cenario={cenario}
              selected={cenarioSelecionado === cenario.tipo}
              onSelect={() => setCenarioSelecionado(cenario.tipo)}
            />
          ))}
        </div>
      </div>

      {/* Alertas */}
      <PriceAlerts alertas={simulacao.alertas} />

      {/* Tabela de itens */}
      <SmartPriceTable itens={simulacao.itens} />
    </div>
  );
}
