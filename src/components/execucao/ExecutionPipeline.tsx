import { CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EtapaPipeline } from "@/types/execucao";

interface ExecutionPipelineProps {
  etapaAtual: EtapaPipeline;
}

const etapas: { id: EtapaPipeline; label: string }[] = [
  { id: "licitacao_vencida", label: "Licitação vencida" },
  { id: "homologacao", label: "Homologação" },
  { id: "ata_contrato", label: "Ata/Contrato" },
  { id: "empenho_recebido", label: "Empenho recebido" },
  { id: "compra_fornecedor", label: "Compra c/ fornecedor" },
  { id: "separacao", label: "Separação" },
  { id: "entrega", label: "Entrega" },
  { id: "nf_emitida", label: "NF emitida" },
  { id: "aguardando_pagamento", label: "Aguardando pagamento" },
  { id: "recebido", label: "Recebido" },
  { id: "concluido", label: "Concluído" },
];

export function ExecutionPipeline({ etapaAtual }: ExecutionPipelineProps) {
  const etapaIndex = etapas.findIndex((e) => e.id === etapaAtual);

  return (
    <div className="neon-card bg-white rounded-lg border border-neutral-200 p-5 overflow-x-auto">
      <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-4">Pipeline de execução</h3>
      <div className="flex items-center min-w-max">
        {etapas.map((etapa, idx) => {
          const done = idx < etapaIndex;
          const current = idx === etapaIndex;
          return (
            <div key={etapa.id} className="flex items-center">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all",
                    done ? "bg-green-500 border-green-500" : current ? "bg-[#06B6D4] border-[#06B6D4]" : "bg-white border-neutral-300"
                  )}
                >
                  {done ? (
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  ) : current ? (
                    <div className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
                  ) : (
                    <Circle className="w-4 h-4 text-neutral-300" />
                  )}
                </div>
                <span
                  className={cn(
                    "text-[10px] font-medium text-center max-w-[72px] leading-tight",
                    done ? "text-green-600" : current ? "text-[#06B6D4]" : "text-neutral-400"
                  )}
                >
                  {etapa.label}
                </span>
              </div>
              {idx < etapas.length - 1 && (
                <div
                  className={cn(
                    "h-0.5 w-10 mx-1 mb-6 rounded-full flex-shrink-0 transition-all",
                    idx < etapaIndex ? "bg-green-400" : "bg-neutral-200"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
