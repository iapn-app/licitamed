"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
  ShieldCheck, Search, AlertTriangle, CheckCircle2,
  XCircle, Download, ExternalLink, ChevronUp, ChevronDown, Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/shared/skeleton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ANVISAItem {
  numeroRegistro: string;
  nomeProduto: string;
  razaoSocial: string;
  cnpj: string;
  situacao: string;
  dataVencimento: string;
  categoria: string;
  classeRisco: string;
}

type SortKey = 'nomeProduto' | 'situacao' | 'dataVencimento' | 'razaoSocial';
type SortDir = 'asc' | 'desc';

function normalize(item: Record<string, unknown>): ANVISAItem {
  const emp = (item.empresa ?? {}) as Record<string, unknown>;
  return {
    numeroRegistro: String(item.numeroRegistro ?? item.numero ?? ''),
    nomeProduto: String(item.nomeProduto ?? item.nome ?? item.produto ?? ''),
    razaoSocial: String(emp.razaoSocial ?? item.razaoSocial ?? item.empresa ?? ''),
    cnpj: String(emp.cnpj ?? item.cnpj ?? ''),
    situacao: String(item.situacao ?? item.situacaoRegistro ?? ''),
    dataVencimento: String(item.dataVencimento ?? item.vencimento ?? ''),
    categoria: String(item.categoria ?? item.categoriaRegulatoria ?? ''),
    classeRisco: String(item.classeRisco ?? item.classe ?? ''),
  };
}

function SituacaoBadge({ situacao }: { situacao: string }) {
  const s = situacao.toLowerCase();
  if (s.includes('válido') || s.includes('valido') || s === 'ativo') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">
        <CheckCircle2 className="w-2.5 h-2.5" />Válido
      </span>
    );
  }
  if (s.includes('vencido') || s.includes('cancelado')) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
        <XCircle className="w-2.5 h-2.5" />
        {s.includes('cancel') ? 'Cancelado' : 'Vencido'}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-500 border border-neutral-200">
      {situacao || '—'}
    </span>
  );
}

function formatCNPJ(cnpj: string): string {
  const c = cnpj.replace(/\D/g, '').padStart(14, '0');
  return `${c.slice(0, 2)}.${c.slice(2, 5)}.${c.slice(5, 8)}/${c.slice(8, 12)}-${c.slice(12, 14)}`;
}

function formatDate(d: string): string {
  if (!d) return '—';
  if (d.includes('-')) {
    const [y, m, day] = d.slice(0, 10).split('-');
    return `${day}/${m}/${y}`;
  }
  return d;
}

function exportCSV(data: ANVISAItem[]) {
  const headers = ['Produto', 'Empresa', 'CNPJ', 'Nº Registro', 'Validade', 'Situação', 'Categoria', 'Classe de Risco'];
  const rows = data.map(d => [
    `"${d.nomeProduto}"`, `"${d.razaoSocial}"`, `"${formatCNPJ(d.cnpj)}"`,
    `"${d.numeroRegistro}"`, `"${formatDate(d.dataVencimento)}"`,
    `"${d.situacao}"`, `"${d.categoria}"`, `"${d.classeRisco}"`,
  ].join(','));
  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `anvisa-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AnvisaPage() {
  const [query, setQuery] = useState('');
  const [tipo, setTipo] = useState<'produto' | 'medicamento'>('produto');
  const [situacaoFilter, setSituacaoFilter] = useState('todos');
  const [sortKey, setSortKey] = useState<SortKey>('nomeProduto');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [resultados, setResultados] = useState<ANVISAItem[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [selected, setSelected] = useState<ANVISAItem | null>(null);

  const autoFiredRef = useRef(false);

  const buscar = useCallback(async (overrideQuery?: string) => {
    const searchQuery = overrideQuery !== undefined ? overrideQuery : query;
    if (!searchQuery.trim()) { toast.error('Digite um nome de produto ou número de registro'); return; }
    setState('loading');
    setResultados([]);
    try {
      const params = new URLSearchParams({ q: searchQuery.trim(), tipo });
      const res = await fetch(`/api/anvisa/buscar?${params}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { erro?: string };
        throw new Error(err.erro ?? `HTTP ${res.status}`);
      }
      const data = await res.json() as { content?: unknown[]; data?: unknown[]; result?: unknown[] };
      const items = (data.content ?? data.data ?? data.result ?? []) as Record<string, unknown>[];
      const resultadosNorm = items.map(normalize);
      setResultados(resultadosNorm);
      setState('done');
      if (resultadosNorm.length === 0) toast.info('Nenhum produto encontrado para essa busca');
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : String(e));
      setState('error');
    }
  }, [query, tipo]);

  useEffect(() => {
    if (autoFiredRef.current) return;
    const sp = new URLSearchParams(window.location.search);
    const q = sp.get('q');
    if (q && sp.get('auto') === 'true') {
      autoFiredRef.current = true;
      setQuery(q);
      buscar(q);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSort(k: SortKey) {
    if (k === sortKey) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(k); setSortDir('asc'); }
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (col !== sortKey) return null;
    return sortDir === 'asc'
      ? <ChevronUp className="w-3 h-3 inline ml-1 text-[#06B6D4]" />
      : <ChevronDown className="w-3 h-3 inline ml-1 text-[#06B6D4]" />;
  }

  const filtered = resultados
    .filter(r => {
      if (situacaoFilter === 'valido') return r.situacao.toLowerCase().includes('valid') || r.situacao.toLowerCase() === 'ativo';
      if (situacaoFilter === 'vencido') return r.situacao.toLowerCase().includes('vencid') || r.situacao.toLowerCase().includes('cancel');
      return true;
    })
    .sort((a, b) => {
      const av = a[sortKey] ?? '';
      const bv = b[sortKey] ?? '';
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sortDir === 'asc' ? cmp : -cmp;
    });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <ShieldCheck className="w-5 h-5 text-[#06B6D4]" />
            <h1 className="text-xl font-semibold text-neutral-900">Consulta ANVISA</h1>
          </div>
          <p className="text-sm text-neutral-500">
            Verifique registros de produtos médico-hospitalares e medicamentos
          </p>
        </div>
        <span className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 border border-blue-200 rounded-full text-xs font-medium text-blue-700 whitespace-nowrap">
          <Info className="w-3.5 h-3.5" />
          Dados oficiais ANVISA
        </span>
      </div>

      {/* Search */}
      <div className="neon-card bg-white rounded-lg border border-neutral-200 shadow-card p-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <div className="md:col-span-2">
            <label className="text-xs font-medium text-neutral-600 mb-1.5 block">
              Nome do produto ou número de registro
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <Input
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && buscar()}
                placeholder="Ex: curativo, luva cirúrgica, 80104870..."
                className="pl-9"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-neutral-600 mb-1.5 block">Tipo</label>
            <Select value={tipo} onValueChange={v => setTipo(v as 'produto' | 'medicamento')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="produto">Produto Hospitalar</SelectItem>
                <SelectItem value="medicamento">Medicamento</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Button onClick={() => buscar()} disabled={state === 'loading'} className="gap-2">
            {state === 'loading'
              ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Consultando...</>
              : <><Search className="w-4 h-4" />Consultar ANVISA</>
            }
          </Button>
          <Select value={situacaoFilter} onValueChange={setSituacaoFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Situação" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="valido">Válidos</SelectItem>
              <SelectItem value="vencido">Vencidos / Cancelados</SelectItem>
            </SelectContent>
          </Select>
          {state === 'done' && filtered.length > 0 && (
            <Button variant="outline" size="sm" className="gap-2 ml-auto" onClick={() => exportCSV(filtered)}>
              <Download className="w-4 h-4" />
              Exportar CSV
            </Button>
          )}
        </div>
      </div>

      {/* Error */}
      {state === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-700">Erro ao consultar ANVISA</p>
            <p className="text-xs text-red-500 mt-0.5">{errorMsg}</p>
            <Button variant="outline" size="sm" className="mt-2" onClick={() => buscar()}>Tentar novamente</Button>
          </div>
        </div>
      )}

      {/* Idle */}
      {state === 'idle' && (
        <div className="bg-white rounded-lg border border-neutral-200 p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-[#ECFEFF] flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-6 h-6 text-[#06B6D4]" />
          </div>
          <p className="text-sm font-semibold text-neutral-800 mb-1">Consulta ANVISA</p>
          <p className="text-xs text-neutral-400 max-w-xs mx-auto">
            Pesquise por nome de produto, descrição ou número de registro ANVISA
          </p>
        </div>
      )}

      {/* Results */}
      {(state === 'loading' || state === 'done') && (
        <div className="neon-card bg-white rounded-lg border border-neutral-200 shadow-card overflow-hidden">
          <div className="px-5 py-3 border-b border-neutral-100 flex items-center justify-between">
            <p className="text-sm font-semibold text-neutral-900">
              {state === 'done' ? `${filtered.length} resultado${filtered.length !== 1 ? 's' : ''}` : 'Buscando...'}
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-50">
                  {(
                    [
                      { key: 'nomeProduto', label: 'Produto' },
                      { key: 'razaoSocial', label: 'Empresa' },
                      { key: null, label: 'CNPJ' },
                      { key: null, label: 'Nº Registro' },
                      { key: 'dataVencimento', label: 'Validade' },
                      { key: 'situacao', label: 'Situação' },
                      { key: null, label: 'Classe de Risco' },
                      { key: null, label: '' },
                    ] as { key: SortKey | null; label: string }[]
                  ).map(({ key, label }) => (
                    <th
                      key={label}
                      onClick={() => key && handleSort(key)}
                      className={cn(
                        'text-left text-xs font-medium text-neutral-500 px-4 py-3 whitespace-nowrap select-none',
                        key && 'cursor-pointer hover:text-neutral-900'
                      )}
                    >
                      {label}
                      {key && <SortIcon col={key} />}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {state === 'loading' && Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-neutral-50">
                    {Array.from({ length: 8 }).map((__, j) => (
                      <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>
                    ))}
                  </tr>
                ))}
                {state === 'done' && filtered.map((item, idx) => (
                  <tr
                    key={`${item.numeroRegistro}-${idx}`}
                    className="border-b border-neutral-50 hover:bg-neutral-50 transition-colors cursor-pointer"
                    onClick={() => setSelected(item)}
                  >
                    <td className="px-4 py-3">
                      <p className="text-xs font-medium text-neutral-900 max-w-[200px] truncate">{item.nomeProduto || '—'}</p>
                      {item.categoria && <p className="text-[10px] text-neutral-400">{item.categoria}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs text-neutral-700 max-w-[160px] truncate">{item.razaoSocial || '—'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-[10px] font-mono text-neutral-500 whitespace-nowrap">
                        {item.cnpj ? formatCNPJ(item.cnpj) : '—'}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs font-mono text-neutral-700 whitespace-nowrap">{item.numeroRegistro || '—'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-neutral-500 whitespace-nowrap">{formatDate(item.dataVencimento)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <SituacaoBadge situacao={item.situacao} />
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-neutral-500">{item.classeRisco || '—'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={e => { e.stopPropagation(); setSelected(item); }}
                        className="text-[10px] font-medium text-[#06B6D4] hover:text-[#0891B2]"
                      >
                        Detalhes
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {state === 'done' && filtered.length === 0 && resultados.length > 0 && (
            <div className="py-8 text-center">
              <p className="text-sm text-neutral-500">Nenhum resultado para o filtro selecionado</p>
            </div>
          )}
        </div>
      )}

      {/* Detail modal */}
      <Dialog open={!!selected} onOpenChange={open => !open && setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Registro ANVISA</DialogTitle>
            <DialogDescription>Informações completas do produto</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="bg-neutral-50 rounded-md p-4">
                <p className="text-sm font-semibold text-neutral-900">{selected.nomeProduto}</p>
                <SituacaoBadge situacao={selected.situacao} />
              </div>
              <dl className="space-y-3">
                {[
                  { label: 'Nº de Registro', value: selected.numeroRegistro },
                  { label: 'Empresa', value: selected.razaoSocial },
                  { label: 'CNPJ', value: selected.cnpj ? formatCNPJ(selected.cnpj) : '—' },
                  { label: 'Categoria', value: selected.categoria },
                  { label: 'Classe de Risco', value: selected.classeRisco },
                  { label: 'Data de Vencimento', value: formatDate(selected.dataVencimento) },
                  { label: 'Situação', value: selected.situacao },
                ].filter(r => r.value).map(({ label, value }) => (
                  <div key={label}>
                    <dt className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wide">{label}</dt>
                    <dd className="text-sm text-neutral-900 mt-0.5">{value}</dd>
                  </div>
                ))}
              </dl>
              <a
                href={`https://consultas.anvisa.gov.br/#/produtosHospitalares/${selected.numeroRegistro}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm text-[#06B6D4] hover:text-[#0891B2] font-medium"
              >
                <ExternalLink className="w-4 h-4" />
                Ver no portal ANVISA
              </a>
              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setSelected(null)}>Fechar</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
