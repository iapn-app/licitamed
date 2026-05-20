"use client";

import { X, CheckCircle2, Clock, FileText, Package, DollarSign } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { ContratoExecucao } from "@/types/execucao";
import { ExecutionPipeline } from "./ExecutionPipeline";

interface ExecutionDetailModalProps {
  contrato: ContratoExecucao | null;
  onClose: () => void;
}

export function ExecutionDetailModal({ contrato, onClose }: ExecutionDetailModalProps) {
  if (!contrato) return null;

  const margemColor = contrato.margem_real >= contrato.margem_prevista
    ? "text-green-600"
    : contrato.margem_real >= contrato.margem_prevista * 0.8
    ? "text-yellow-600"
    : "text-red-600";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl border border-neutral-200 shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-neutral-100">
          <div>
            <h2 className="text-base font-semibold text-neutral-900">{contrato.orgao}</h2>
            <p className="text-xs text-neutral-400 mt-0.5">{contrato.numero_contrato} · Empenho {contrato.numero_empenho}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-neutral-100 transition-colors">
            <X className="w-4 h-4 text-neutral-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Pipeline */}
          <ExecutionPipeline etapaAtual={contrato.etapa_atual} />

          {/* Métricas */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-lg border border-neutral-100 bg-neutral-50">
              <p className="text-xs text-neutral-500">Valor do contrato</p>
              <p className="text-lg font-semibold text-neutral-900 mt-1">{formatCurrency(contrato.valor)}</p>
            </div>
            <div className="p-4 rounded-lg border border-neutral-100 bg-neutral-50">
              <p className="text-xs text-neutral-500">Margem real</p>
              <p className={cn("text-lg font-semibold mt-1", margemColor)}>{contrato.margem_real}%</p>
              <p className="text-xs text-neutral-400 mt-0.5">Previsto: {contrato.margem_prevista}%</p>
            </div>
            <div className="p-4 rounded-lg border border-neutral-100 bg-neutral-50">
              <p className="text-xs text-neutral-500">Prazo de entrega</p>
              <p className="text-lg font-semibold text-neutral-900 mt-1">{formatDate(contrato.prazo_entrega)}</p>
            </div>
          </div>

          {/* Itens */}
          <div>
            <h3 className="text-sm font-semibold text-neutral-800 mb-3 flex items-center gap-2">
              <Package className="w-4 h-4 text-neutral-400" />
              Itens do contrato
            </h3>
            <div className="rounded-lg border border-neutral-100 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-100 bg-neutral-50">
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-neutral-500">Item</th>
                    <th className="text-right px-4 py-2.5 text-xs font-medium text-neutral-500">Qtd</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-neutral-500">Un.</th>
                    <th className="text-right px-4 py-2.5 text-xs font-medium text-neutral-500">Vl. unit.</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-neutral-500">Fornecedor</th>
                    <th className="text-center px-4 py-2.5 text-xs font-medium text-neutral-500">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50">
                  {contrato.itens.map((item) => (
                    <tr key={item.id} className="hover:bg-neutral-50">
                      <td className="px-4 py-2.5 text-sm text-neutral-800">{item.nome}</td>
                      <td className="px-4 py-2.5 text-sm text-neutral-700 text-right tabular-nums">{item.quantidade.toLocaleString("pt-BR")}</td>
                      <td className="px-4 py-2.5 text-xs text-neutral-500">{item.unidade}</td>
                      <td className="px-4 py-2.5 text-sm text-neutral-700 text-right tabular-nums">{formatCurrency(item.valor_unitario)}</td>
                      <td className="px-4 py-2.5 text-xs text-neutral-500">{item.fornecedor}</td>
                      <td className="px-4 py-2.5 text-center">
                        {item.status === "entregue" ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-500 mx-auto" />
                        ) : item.status === "pendente" ? (
                          <Clock className="w-3.5 h-3.5 text-yellow-400 mx-auto" />
                        ) : (
                          <span className="text-xs text-red-500">Devolvido</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* NF e Pagamento */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg border border-neutral-100">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-neutral-400" />
                <h3 className="text-sm font-medium text-neutral-700">Nota fiscal</h3>
              </div>
              {contrato.nf_emitida ? (
                <div>
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3 h-3" />
                    Emitida
                  </span>
                  {contrato.nf_numero && <p className="text-xs text-neutral-500 mt-1.5">NF {contrato.nf_numero}</p>}
                </div>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-yellow-700 bg-yellow-50 border border-yellow-200 px-2 py-0.5 rounded-full">
                  <Clock className="w-3 h-3" />
                  Pendente
                </span>
              )}
            </div>
            <div className="p-4 rounded-lg border border-neutral-100">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-neutral-400" />
                <h3 className="text-sm font-medium text-neutral-700">Pagamento</h3>
              </div>
              {contrato.data_pagamento ? (
                <div>
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3 h-3" />
                    Recebido
                  </span>
                  <p className="text-xs text-neutral-500 mt-1.5">Em {formatDate(contrato.data_pagamento)}</p>
                </div>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                  <Clock className="w-3 h-3" />
                  Aguardando
                </span>
              )}
            </div>
          </div>

          {/* Observações */}
          {contrato.observacoes && (
            <div className="p-4 rounded-lg border border-neutral-100 bg-neutral-50">
              <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1.5">Observações</h3>
              <p className="text-sm text-neutral-600">{contrato.observacoes}</p>
            </div>
          )}

          {/* Próxima ação */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-[#ECFEFF] border border-[#A5F3FC]">
            <div>
              <p className="text-xs font-medium text-[#06B6D4] uppercase tracking-wide">Próxima ação</p>
              <p className="text-sm font-semibold text-neutral-800 mt-0.5">{contrato.proxima_acao}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
