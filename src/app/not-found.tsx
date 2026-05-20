import Link from "next/link";
import { Activity, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
      <div className="text-center max-w-sm px-4">
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-8 h-8 rounded-md bg-[#06B6D4] flex items-center justify-center">
            <Activity className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-base font-semibold text-neutral-900">LicitaMed</span>
        </div>

        <div className="text-7xl font-bold text-neutral-200 mb-4 tabular-nums">404</div>
        <h1 className="text-lg font-semibold text-neutral-900 mb-2">Página não encontrada</h1>
        <p className="text-sm text-neutral-500 mb-8 leading-relaxed">
          A página que você está procurando não existe ou foi movida.
        </p>

        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-[#06B6D4] text-white text-sm font-medium px-5 py-2.5 rounded-md hover:bg-[#0891B2] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao Dashboard
        </Link>
      </div>
    </div>
  );
}
