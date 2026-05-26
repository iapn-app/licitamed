"use client";

import { useState, useCallback } from "react";
import {
  BarChart2, RefreshCw, Download, FileText, TrendingUp,
  ClipboardList, CheckCircle2, Clock, AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Relatorio {
  periodo: { inicio: string; fim: string };
  licitacoes: {
    total: number;
    porStatus: Record<string, number>;
    valorTotal: number;
    lista: Array<{ id: string; nome: string; status: string; valor_estimado: number | null }>;
  };
  cotacoes: { total: number };
  geradoEm: string;
}

const STATUS_LABELS: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  em_analise:    { label: 'Em análise',   color: 'text-blue-600',   icon: Clock },
  em_disputa:    { label: 'Em disputa',   color: 'text-yellow-600', icon: TrendingUp },
  ganho:         { label: 'Ganho',        color: 'text-green-600',  icon: CheckCircle2 },
  perdido:       { label: 'Perdido',      color: 'text-red-600',    icon: AlertTriangle },
  cancelado:     { label: 'Cancelado',    color: 'text-neutral-400',icon: AlertTriangle },
};

function fmt(v: number) { return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
function fmtDate(d: string) {
  return new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
}

function gerarTexto(r: Relatorio): string {
  const lines = [
    `RELATÓRIO SEMANAL — POWER MED`,
    `Período: ${fmtDate(r.periodo.inicio)} a ${fmtDate(r.periodo.fim)}`,
    `Gerado em: ${new Date(r.geradoEm).toLocaleString('pt-BR')}`,
    '',
    `LICITAÇÕES (${r.licitacoes.total} no período)`,
    `Valor total estimado: ${fmt(r.licitacoes.valorTotal)}`,
    '',
    'Por status:',
    ...Object.entries(r.licitacoes.porStatus).map(([s, n]) => `  ${STATUS_LABELS[s]?.label ?? s}: ${n}`),
    '',
    `COTAÇÕES: ${r.cotacoes.total} enviadas no período`,
    '',
    'LICITAÇÕES RECENTES:',
    ...r.licitacoes.lista.map((l, i) =>
      `${i + 1}. ${l.nome} [${STATUS_LABELS[l.status]?.label ?? l.status}]${l.valor_estimado ? ` — ${fmt(l.valor_estimado)}` : ''}`
    ),
  ];
  return lines.join('\n');
}

export default function RelatoriosPage() {
  const [loading, setLoading] = useState(false);
  const [relatorio, setRelatorio] = useState<Relatorio | null>(null);

  const gerar = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/relatorios/semanal');
      const data = await res.json() as Relatorio & { erro?: string };
      if (data.erro) throw new Error(data.erro);
      setRelatorio(data);
      toast.success('Relatório gerado');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao gerar relatório');
    } finally { setLoading(false); }
  }, []);

  function exportarTXT() {
    if (!relatorio) return;
    const texto = gerarTexto(relatorio);
    const blob = new Blob([texto], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio_semanal_${relatorio.periodo.fim}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Relatório exportado');
  }

  function exportarCSV() {
    if (!relatorio) return;
    const header = 'Nome;Status;Valor Estimado';
    const rows = relatorio.licitacoes.lista.map(l =>
      `"${l.nome}";"${STATUS_LABELS[l.status]?.label ?? l.status}";"${l.valor_estimado ? fmt(l.valor_estimado) : ''}"`)
      .join('\n');
    const blob = new Blob(['﻿' + header + '\n' + rows], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio_${relatorio.periodo.fim}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <BarChart2 className="w-5 h-5 text-[#06B6D4]" />
            <h1 className="text-xl font-semibold text-neutral-900">Relatório Semanal</h1>
          </div>
          <p className="text-sm text-neutral-500">Resumo de licitações, cotações e performance da semana</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {relatorio && (
            <>
              <Button variant="outline" size="sm" onClick={exportarCSV} className="gap-1.5">
                <Download className="w-3.5 h-3.5" />CSV
              </Button>
              <Button variant="outline" size="sm" onClick={exportarTXT} className="gap-1.5">
                <FileText className="w-3.5 h-3.5" />TXT
              </Button>
            </>
          )}
          <Button size="sm" onClick={gerar} disabled={loading} className="gap-1.5">
            {loading ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" />Gerando...</> : <><BarChart2 className="w-3.5 h-3.5" />Gerar relatório</>}
          </Button>
        </div>
      </div>

      {!relatorio && !loading && (
        <div className="bg-white rounded-lg border border-neutral-200 p-12 text-center">
          <BarChart2 className="w-10 h-10 text-neutral-200 mx-auto mb-3" />
          <p className="text-sm text-neutral-500 mb-1">Nenhum relatório gerado</p>
          <p className="text-xs text-neutral-400 mb-4">Clique em &quot;Gerar relatório&quot; para consolidar os dados da última semana</p>
          <Button size="sm" onClick={gerar} className="gap-1.5">
            <BarChart2 className="w-3.5 h-3.5" />Gerar agora
          </Button>
        </div>
      )}

      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 bg-neutral-100 rounded-lg animate-pulse" />)}
        </div>
      )}

      {relatorio && !loading && (
        <div className="space-y-4">
          <div className="bg-neutral-50 rounded-lg border border-neutral-200 px-5 py-3 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-neutral-700">
                {fmtDate(relatorio.periodo.inicio)} — {fmtDate(relatorio.periodo.fim)}
              </p>
              <p className="text-[10px] text-neutral-400">
                Gerado em {new Date(relatorio.geradoEm).toLocaleString('pt-BR')}
              </p>
            </div>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg border border-neutral-200 p-4">
              <FileText className="w-4 h-4 text-[#06B6D4] mb-2" />
              <p className="text-2xl font-bold text-neutral-900">{relatorio.licitacoes.total}</p>
              <p className="text-xs text-neutral-400">Licitações no período</p>
            </div>
            <div className="bg-white rounded-lg border border-neutral-200 p-4">
              <ClipboardList className="w-4 h-4 text-purple-500 mb-2" />
              <p className="text-2xl font-bold text-neutral-900">{relatorio.cotacoes.total}</p>
              <p className="text-xs text-neutral-400">Cotações enviadas</p>
            </div>
            <div className="bg-white rounded-lg border border-[#06B6D4]/30 p-4 col-span-2 md:col-span-1">
              <TrendingUp className="w-4 h-4 text-green-500 mb-2" />
              <p className="text-2xl font-bold text-neutral-900">{fmt(relatorio.licitacoes.valorTotal)}</p>
              <p className="text-xs text-neutral-400">Valor total estimado</p>
            </div>
          </div>

          {/* Por status */}
          {Object.keys(relatorio.licitacoes.porStatus).length > 0 && (
            <div className="bg-white rounded-lg border border-neutral-200 p-5">
              <h3 className="text-sm font-semibold text-neutral-900 mb-3">Licitações por status</h3>
              <div className="space-y-2">
                {Object.entries(relatorio.licitacoes.porStatus).map(([s, n]) => {
                  const cfg = STATUS_LABELS[s] ?? { label: s, color: 'text-neutral-500', icon: FileText };
                  const Icon = cfg.icon;
                  const max = Math.max(...Object.values(relatorio.licitacoes.porStatus));
                  return (
                    <div key={s} className="flex items-center gap-3">
                      <Icon className={cn('w-4 h-4 flex-shrink-0', cfg.color)} />
                      <span className="text-xs text-neutral-600 w-28 flex-shrink-0">{cfg.label}</span>
                      <div className="flex-1 bg-neutral-100 rounded-full h-2">
                        <div className="bg-[#06B6D4] h-2 rounded-full" style={{ width: `${(n / max) * 100}%` }} />
                      </div>
                      <span className="text-xs font-semibold text-neutral-900 w-4 text-right">{n}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Lista */}
          {relatorio.licitacoes.lista.length > 0 && (
            <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
              <div className="px-5 py-3 border-b border-neutral-100">
                <h3 className="text-sm font-semibold text-neutral-900">Licitações do período</h3>
              </div>
              <div className="divide-y divide-neutral-50">
                {relatorio.licitacoes.lista.map(l => {
                  const cfg = STATUS_LABELS[l.status] ?? { label: l.status, color: 'text-neutral-500', icon: FileText };
                  const Icon = cfg.icon;
                  return (
                    <div key={l.id} className="flex items-center gap-3 px-5 py-3">
                      <Icon className={cn('w-3.5 h-3.5 flex-shrink-0', cfg.color)} />
                      <p className="text-xs font-medium text-neutral-800 flex-1 line-clamp-1">{l.nome}</p>
                      {l.valor_estimado && (
                        <span className="text-xs text-neutral-500 whitespace-nowrap">{fmt(l.valor_estimado)}</span>
                      )}
                      <span className={cn('text-[10px]', cfg.color)}>{cfg.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
