"use client";

import { ClipboardList } from "lucide-react";
import { NeonCard } from "@/components/shared/neon-card";
import Link from "next/link";

export default function CotacoesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">Cotações</h1>
        <p className="text-sm text-neutral-500 mt-0.5">
          Acompanhamento de respostas por licitação e fornecedor
        </p>
      </div>

      <NeonCard className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-14 h-14 rounded-full bg-[#ECFEFF] flex items-center justify-center mb-4">
          <ClipboardList className="w-7 h-7 text-[#06B6D4]" />
        </div>
        <h2 className="text-base font-semibold text-neutral-800 mb-1">
          Nenhuma cotação enviada
        </h2>
        <p className="text-sm text-neutral-400 max-w-sm mb-6">
          Envie cotações a partir de uma licitação cadastrada. As respostas dos fornecedores aparecerão aqui para comparação.
        </p>
        <Link
          href="/licitacoes"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#06B6D4] hover:bg-[#0891B2] rounded-md transition-colors"
        >
          <ClipboardList className="w-4 h-4" />
          Ir para Licitações
        </Link>
      </NeonCard>
    </div>
  );
}
