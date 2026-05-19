"use client";

import { useState } from "react";
import {
  Search,
  ExternalLink,
  Copy,
  Send,
  CheckCircle2,
  Clock,
} from "lucide-react";
import {
  licitacoes,
  cotacoes,
  getFornecedorById,
  getStatusColor,
  getStatusLabel,
} from "@/lib/mock-data";
import { formatDate } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function CotacoesPage() {
  const [search, setSearch] = useState("");

  // Group cotacoes by licitacao + fornecedor
  const agrupado = licitacoes.flatMap((lic) => {
    const fids = lic.fornecedoresIds;
    return fids.map((fid) => {
      const forn = getFornecedorById(fid);
      const cotacoesResp = cotacoes.filter(
        (c) => c.licitacaoId === lic.id && c.fornecedorId === fid
      );
      const itensForn = lic.itens.filter((i) => i.fornecedorSugeridoId === fid);
      const respondeu = cotacoesResp.length > 0;
      return { lic, forn, cotacoesResp, itensForn, respondeu };
    });
  });

  const filtered = agrupado.filter(({ lic, forn }) => {
    if (!search) return true;
    return (
      lic.orgao.toLowerCase().includes(search.toLowerCase()) ||
      forn?.nome.toLowerCase().includes(search.toLowerCase())
    );
  });

  const respondidas = filtered.filter((f) => f.respondeu).length;
  const aguardando = filtered.filter((f) => !f.respondeu).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">Cotações</h1>
        <p className="text-sm text-neutral-500 mt-0.5">
          Acompanhamento de respostas por licitação e fornecedor
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-neutral-200 shadow-card p-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-neutral-100 flex items-center justify-center">
              <Send className="w-3.5 h-3.5 text-neutral-500" />
            </div>
            <div>
              <p className="text-xs text-neutral-500">Total enviadas</p>
              <p className="text-xl font-semibold text-neutral-900">{filtered.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-neutral-200 shadow-card p-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-green-50 flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-neutral-500">Respondidas</p>
              <p className="text-xl font-semibold text-neutral-900">{respondidas}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-neutral-200 shadow-card p-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-yellow-50 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5 text-yellow-600" />
            </div>
            <div>
              <p className="text-xs text-neutral-500">Aguardando</p>
              <p className="text-xl font-semibold text-neutral-900">{aguardando}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
        <Input
          placeholder="Buscar por licitação ou fornecedor..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-neutral-200 shadow-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-neutral-100">
              <th className="text-left px-5 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide">Licitação</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide">Fornecedor</th>
              <th className="text-center px-5 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide">Itens</th>
              <th className="text-center px-5 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide">Respondeu</th>
              <th className="text-center px-5 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide">Status licitação</th>
              <th className="text-center px-5 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-50">
            {filtered.map(({ lic, forn, itensForn, respondeu, cotacoesResp }, idx) => (
              <tr key={idx} className="hover:bg-neutral-50 transition-colors">
                <td className="px-5 py-4">
                  <p className="text-sm font-medium text-neutral-800 truncate max-w-[250px]">{lic.orgao}</p>
                  <p className="text-xs text-neutral-400 mt-0.5">{formatDate(lic.dataPregao)}</p>
                </td>
                <td className="px-5 py-4">
                  <p className="text-sm text-neutral-700">{forn?.nome || "—"}</p>
                  <p className="text-xs text-neutral-400 mt-0.5 truncate max-w-[200px]">{forn?.email}</p>
                </td>
                <td className="px-5 py-4 text-center">
                  <span className="text-sm text-neutral-700">
                    {cotacoesResp.length}/{itensForn.length}
                  </span>
                </td>
                <td className="px-5 py-4 text-center">
                  {respondeu ? (
                    <span className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3" />
                      Sim
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs bg-yellow-50 text-yellow-700 border border-yellow-200 px-2 py-0.5 rounded-full">
                      <Clock className="w-3 h-3" />
                      Aguardando
                    </span>
                  )}
                </td>
                <td className="px-5 py-4 text-center">
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${getStatusColor(lic.status)}`}>
                    {getStatusLabel(lic.status)}
                  </span>
                </td>
                <td className="px-5 py-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      title="Copiar link de cotação"
                      onClick={() => {
                        toast.success(`Link copiado para ${forn?.nome}`);
                      }}
                      className="p-1.5 rounded-md hover:bg-neutral-100 transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5 text-neutral-400" />
                    </button>
                    <button
                      title="Reenviar por email/WhatsApp"
                      onClick={() => toast.success(`Cotação reenviada para ${forn?.nome}`)}
                      className="p-1.5 rounded-md hover:bg-neutral-100 transition-colors"
                    >
                      <Send className="w-3.5 h-3.5 text-neutral-400" />
                    </button>
                    {forn && (
                      <a
                        href={`/cotacao/${forn.token}`}
                        target="_blank"
                        className="p-1.5 rounded-md hover:bg-neutral-100 transition-colors"
                        title="Abrir portal do fornecedor"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-neutral-400" />
                      </a>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
