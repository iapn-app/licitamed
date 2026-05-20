"use client";

import { ClipboardCheck, FolderOpen } from "lucide-react";
import { NeonCard } from "@/components/shared/neon-card";

export default function ExecucaoPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900 flex items-center gap-2">
          <ClipboardCheck className="w-5 h-5 text-[#06B6D4]" />
          Execução
        </h1>
        <p className="text-sm text-neutral-500 mt-0.5">
          Controle pós-vitória — do empenho ao pagamento
        </p>
      </div>

      <NeonCard className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-14 h-14 rounded-full bg-[#ECFEFF] flex items-center justify-center mb-4">
          <FolderOpen className="w-7 h-7 text-[#06B6D4]" />
        </div>
        <h2 className="text-base font-semibold text-neutral-800 mb-1">
          Nenhum contrato em execução
        </h2>
        <p className="text-sm text-neutral-400 max-w-sm">
          Contratos aparecem aqui após vencer uma licitação. Acompanhe o status do empenho até o pagamento em um só lugar.
        </p>
      </NeonCard>
    </div>
  );
}
