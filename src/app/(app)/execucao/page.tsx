"use client";

import { useState } from "react";
import { ClipboardCheck, FileText, Truck, DollarSign, TrendingUp } from "lucide-react";
import { ExecutionTable } from "@/components/execucao/ExecutionTable";
import { ExecutionAlerts } from "@/components/execucao/ExecutionAlerts";
import { ExecutionDetailModal } from "@/components/execucao/ExecutionDetailModal";
import { NeonCard } from "@/components/shared/neon-card";
import { formatCurrency } from "@/lib/utils";
import type { ContratoExecucao, AlertaExecucao } from "@/types/execucao";

const contratos: ContratoExecucao[] = [
  {
    id: "1",
    orgao: "Secretaria Municipal de Saúde de Nova Iguaçu",
    numero_contrato: "CT-SMSNI-2025-014",
    numero_empenho: "2025NE001847",
    valor: 485000,
    status: "em_andamento",
    etapa_atual: "empenho_recebido",
    prazo_entrega: "2025-06-20",
    nf_emitida: false,
    margem_real: 17,
    margem_prevista: 18,
    proxima_acao: "Iniciar compra com fornecedores e agendar separação",
    observacoes: "Empenho recebido em 05/05/2025. Entrega em lote único no almoxarifado central.",
    itens: [
      { id: "1", nome: "Luva nitrílica M", quantidade: 5000, unidade: "cx 100un", valor_unitario: 42.00, fornecedor: "MedRio Distribuidora", status: "pendente" },
      { id: "2", nome: "Seringa 10ml s/ agulha", quantidade: 3000, unidade: "cx 100un", valor_unitario: 23.50, fornecedor: "Hospitalar Brasil", status: "pendente" },
      { id: "3", nome: "Gaze estéril 7,5x7,5", quantidade: 2000, unidade: "pct 10un", valor_unitario: 5.40, fornecedor: "Saúde Max", status: "pendente" },
      { id: "4", nome: "Álcool 70% 1L", quantidade: 500, unidade: "un", valor_unitario: 8.50, fornecedor: "Rio Med Supply", status: "pendente" },
    ],
  },
  {
    id: "2",
    orgao: "Hospital Federal do Andaraí — MHFA",
    numero_contrato: "CT-HFA-2025-007",
    numero_empenho: "2025NE004221",
    valor: 312000,
    status: "em_andamento",
    etapa_atual: "entrega",
    prazo_entrega: "2025-05-28",
    nf_emitida: false,
    margem_real: 21,
    margem_prevista: 21,
    proxima_acao: "Confirmar entrega e emitir nota fiscal em até 48h",
    observacoes: "Entrega prevista para 28/05. Conferência com setor de almoxarifado obrigatória.",
    itens: [
      { id: "1", nome: "Luva nitrílica P", quantidade: 3000, unidade: "cx 100un", valor_unitario: 40.00, fornecedor: "MedRio Distribuidora", status: "entregue" },
      { id: "2", nome: "Seringa 5ml c/ agulha", quantidade: 5000, unidade: "cx 100un", valor_unitario: 21.00, fornecedor: "Hospitalar Brasil", status: "entregue" },
      { id: "3", nome: "Curativo hidrocoloide 10x10", quantidade: 200, unidade: "cx 10un", valor_unitario: 74.00, fornecedor: "Global Med", status: "entregue" },
      { id: "4", nome: "Cateter nasal tipo óculos", quantidade: 500, unidade: "cx 50un", valor_unitario: 57.00, fornecedor: "Saúde Max", status: "pendente" },
    ],
  },
  {
    id: "3",
    orgao: "Prefeitura de Belford Roxo — Secretaria de Saúde",
    numero_contrato: "CT-PMBRX-2025-031",
    numero_empenho: "2025NE007734",
    valor: 218500,
    status: "atrasado",
    etapa_atual: "nf_emitida",
    prazo_entrega: "2025-05-10",
    nf_emitida: true,
    nf_numero: "NF-2025-00342",
    margem_real: 14,
    margem_prevista: 17,
    proxima_acao: "Acionar financeiro da prefeitura sobre pagamento em atraso",
    observacoes: "Entrega realizada em 08/05. NF emitida em 09/05. Pagamento previsto para 10/06 mas não confirmado.",
    itens: [
      { id: "1", nome: "Máscara cirúrgica tripla", quantidade: 8000, unidade: "cx 50un", valor_unitario: 18.00, fornecedor: "Global Med", status: "entregue" },
      { id: "2", nome: "Avental descartável", quantidade: 1500, unidade: "cx 50un", valor_unitario: 35.00, fornecedor: "Saúde Max", status: "entregue" },
      { id: "3", nome: "Termômetro digital", quantidade: 100, unidade: "un", valor_unitario: 28.50, fornecedor: "Rio Med Supply", status: "entregue" },
    ],
  },
  {
    id: "4",
    orgao: "UPA 24h Queimados — Prefeitura de Queimados",
    numero_contrato: "CT-PMQ-2025-009",
    numero_empenho: "2025NE000892",
    valor: 94200,
    status: "concluido",
    etapa_atual: "concluido",
    prazo_entrega: "2025-04-30",
    nf_emitida: true,
    nf_numero: "NF-2025-00298",
    data_pagamento: "2025-05-12",
    margem_real: 19,
    margem_prevista: 18,
    proxima_acao: "Contrato encerrado — arquivar documentação",
    observacoes: "Contrato executado com sucesso. Margem superou a prevista.",
    itens: [
      { id: "1", nome: "Luva procedimento G", quantidade: 2000, unidade: "cx 100un", valor_unitario: 38.50, fornecedor: "MedRio Distribuidora", status: "entregue" },
      { id: "2", nome: "Soro fisiológico 250ml", quantidade: 300, unidade: "cx 16un", valor_unitario: 32.00, fornecedor: "Hospitalar Brasil", status: "entregue" },
    ],
  },
  {
    id: "5",
    orgao: "Hospital Estadual Rocha Faria — SES-RJ",
    numero_contrato: "CT-HERF-2025-022",
    numero_empenho: "2025NE012541",
    valor: 567800,
    status: "problema",
    etapa_atual: "ata_contrato",
    prazo_entrega: "2025-06-15",
    nf_emitida: false,
    margem_real: 9,
    margem_prevista: 19,
    proxima_acao: "Reunião jurídica sobre revisão da ata — cláusula de reajuste contestada",
    observacoes: "Órgão contestou cláusula de reajuste. Assessoria jurídica envolvida. Prazo de entrega em risco.",
    itens: [
      { id: "1", nome: "Kit cirurgia básica", quantidade: 150, unidade: "kt", valor_unitario: 320.00, fornecedor: "Global Med", status: "pendente" },
      { id: "2", nome: "Fio de sutura absorvível 0", quantidade: 500, unidade: "cx 12un", valor_unitario: 85.00, fornecedor: "Hospitalar Brasil", status: "pendente" },
      { id: "3", nome: "Lâmina de bisturi nº 22", quantidade: 2000, unidade: "cx 100un", valor_unitario: 24.00, fornecedor: "Rio Med Supply", status: "pendente" },
    ],
  },
];

const alertas: AlertaExecucao[] = [
  { tipo: "atraso", mensagem: "Prefeitura de Belford Roxo: pagamento vencido há 10 dias — NF emitida em 09/05", severidade: "alta", contrato_id: "3" },
  { tipo: "prazo", mensagem: "Hospital Federal do Andaraí: entrega prevista para 28/05 — confirmar logística", severidade: "alta", contrato_id: "2" },
  { tipo: "margem", mensagem: "Hospital Rocha Faria: margem real (9%) muito abaixo da prevista (19%) — situação crítica", severidade: "alta", contrato_id: "5" },
  { tipo: "nf", mensagem: "SMS Nova Iguaçu: empenho recebido mas NF ainda não emitida — verificar timeline", severidade: "media", contrato_id: "1" },
  { tipo: "pagamento", mensagem: "Hospital Federal do Andaraí: emitir NF assim que entrega for confirmada", severidade: "media", contrato_id: "2" },
];

export default function ExecucaoPage() {
  const [contratoSelecionado, setContratoSelecionado] = useState<ContratoExecucao | null>(null);

  const emAndamento = contratos.filter((c) => c.status === "em_andamento").length;
  const atrasados = contratos.filter((c) => c.status === "atrasado").length;
  const problemas = contratos.filter((c) => c.status === "problema").length;
  const empenhosPendentes = contratos.filter((c) => ["licitacao_vencida", "homologacao", "ata_contrato"].includes(c.etapa_atual)).length;
  const nfPendentes = contratos.filter((c) => !c.nf_emitida && c.status !== "concluido").length;
  const valorAReceber = contratos.filter((c) => !c.data_pagamento && c.nf_emitida).reduce((s, c) => s + c.valor, 0);
  const margemAcumulada = Math.round(contratos.filter((c) => c.status !== "problema").reduce((s, c) => s + c.margem_real, 0) / contratos.filter((c) => c.status !== "problema").length);

  const resumoCards = [
    { label: "Contratos em execução", value: String(emAndamento), icon: ClipboardCheck, color: "text-[#1A56DB]", bg: "bg-[#EBF0FD]" },
    { label: "Empenhos pendentes", value: String(empenhosPendentes), icon: FileText, color: "text-yellow-600", bg: "bg-yellow-50" },
    { label: "Entregas atrasadas", value: String(atrasados + problemas), icon: Truck, color: atrasados + problemas > 0 ? "text-red-600" : "text-green-600", bg: atrasados + problemas > 0 ? "bg-red-50" : "bg-green-50" },
    { label: "NFs pendentes", value: String(nfPendentes), icon: FileText, color: nfPendentes > 0 ? "text-orange-600" : "text-green-600", bg: nfPendentes > 0 ? "bg-orange-50" : "bg-green-50" },
    { label: "Valor a receber", value: formatCurrency(valorAReceber), icon: DollarSign, color: "text-green-600", bg: "bg-green-50" },
    { label: "Margem real acumulada", value: `${margemAcumulada}%`, icon: TrendingUp, color: margemAcumulada >= 15 ? "text-green-600" : "text-yellow-600", bg: margemAcumulada >= 15 ? "bg-green-50" : "bg-yellow-50" },
  ];

  const handleClickContrato = (id: string) => {
    const c = contratos.find((x) => x.id === id);
    if (c) setContratoSelecionado(c);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-neutral-900 flex items-center gap-2">
          <ClipboardCheck className="w-5 h-5 text-[#1A56DB]" />
          Execução
        </h1>
        <p className="text-sm text-neutral-500 mt-0.5">
          Controle pós-vitória — do empenho ao pagamento
        </p>
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

      {/* Alertas */}
      <ExecutionAlerts alertas={alertas} onClickContrato={handleClickContrato} />

      {/* Tabela de contratos */}
      <ExecutionTable contratos={contratos} onClickContrato={setContratoSelecionado} />

      {/* Modal de detalhe */}
      <ExecutionDetailModal contrato={contratoSelecionado} onClose={() => setContratoSelecionado(null)} />
    </div>
  );
}
