"use client";

import { Sparkles, Calculator } from "lucide-react";
import { NeonCard } from "@/components/shared/neon-card";
import Link from "next/link";

export default function PrecoVencedorPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#06B6D4]" />
          Preço Vencedor IA
        </h1>
        <p className="text-sm text-neutral-500 mt-0.5">
          Monte o melhor preço para ganhar licitações sem perder margem
        </p>
      </div>

      <NeonCard className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-14 h-14 rounded-full bg-[#ECFEFF] flex items-center justify-center mb-4">
          <Calculator className="w-7 h-7 text-[#06B6D4]" />
        </div>
        <h2 className="text-base font-semibold text-neutral-800 mb-1">
          Nenhuma simulação disponível
        </h2>
        <p className="text-sm text-neutral-400 max-w-sm mb-6">
          Cadastre uma licitação e receba cotações para usar o simulador de preço com IA.
        </p>
        <Link
          href="/licitacoes"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#06B6D4] hover:bg-[#0891B2] rounded-md transition-colors"
        >
          <Sparkles className="w-4 h-4" />
          Cadastrar Licitação
        </Link>
      </NeonCard>
    </div>
  );
}
