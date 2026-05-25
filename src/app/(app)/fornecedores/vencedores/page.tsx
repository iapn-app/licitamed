"use client";

import { useState, useCallback } from "react";
import {
  Trophy, Search, RefreshCw, ExternalLink, DollarSign,
  Building2, ChevronUp, ChevronDown, X, AlertCircle,
  Users, TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/shared/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { CORES_SEGMENTO, TODOS_SEGMENTOS } from "@/lib/monitor/segmentos";
import type { VencedorMonitor } from "@/lib/monitor/types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface VencedoresData {
  dados: VencedorMonitor[];
  total: number;
  valorTotal: number;
  segmentoLider: string;
  novosSemana: number;
  porSegmento: Record<string, { total: number; valor: number }>;
  timestamp: string;
}

type SortKey = 'valorTotalContratosRj' | 'totalContratosRj' | 'razaoSocial' | 'ultimoContrato';
type SortDir = 'asc' | 'desc';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBRL(v: number) {
  if (!v) return 'R$ 0';
  if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `R$ ${(v / 1_000).toFixed(0)}K`;
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatBRLFull(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
}

function formatCNPJ(cnpj: string) {
  const c = cnpj.replace(/\D/g, '').padStart(14, '0');
  return `${c.slice(0, 2)}.${c.slice(2, 5)}.${c.slice(5, 8)}/${c.slice(8, 12)}-${c.slice(12, 14)}`;
}

function formatDate(iso: string | undefined) {
  if (!iso) return '—';
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
}

function getInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

const AVATAR_COLORS = [
  'bg-blue-100 text-blue-700', 'bg-purple-100 text-purple-700',
  'bg-green-100 text-green-700', 'bg-orange-100 text-orange-700',
  'bg-red-100 text-red-700', 'bg-indigo-100 text-indigo-700',
];
function getAvatarColor(name: string) { return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]; }

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ icon: Icon, color, iconColor, label, value, desc }: {
  icon: React.ComponentType<{ className?: string }>;
  color: string; iconColor: string; label: string; value: string; desc: string;
}) {
  return (
    <div className="neon-card bg-white rounded-lg border border-neutral-200 shadow-card p-5">
      <div className="flex items-center gap-2 mb-3">
        <div className={cn("w-8 h-8 rounded-md flex items-center justify-center", color)}>
          <Icon className={cn("w-4 h-4", iconColor)} />
        </div>
        <p className="text-xs font-medium text-neutral-500">{label}</p>
      </div>
      <p className="text-2xl font-semibold text-neutral-900 truncate">{value}</p>
      <p className="text-xs text-neutral-400 mt-0.5">{desc}</p>
    </div>
  );
}

function SortIcon({ column, sortKey, sortDir }: { column: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (column !== sortKey) return null;
  return sortDir === 'asc'
    ? <ChevronUp className="w-3.5 h-3.5 inline-block ml-1 text-[#06B6D4]" />
    : <ChevronDown className="w-3.5 h-3.5 inline-block ml-1 text-[#06B6D4]" />;
}

function RowSkeleton() {
  return (
    <tr className="border-b border-neutral-100">
      {Array.from({ length: 7 }).map((_, i) => (
        <td key={i} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>
      ))}
    </tr>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function VencedoresPage() {
  const [data, setData] = useState<VencedoresData | null>(null);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const [busca, setBusca] = useState('');
  const [segmento, setSegmento] = useState('');
  const [minContratos, setMinContratos] = useState('');
  const [minValor, setMinValor] = useState('');

  const [sortKey, setSortKey] = useState<SortKey>('valorTotalContratosRj');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const [selected, setSelected] = useState<VencedorMonitor | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (segmento) params.set('segmento', segmento);
      if (busca) params.set('busca', busca);
      if (minContratos) params.set('minContratos', minContratos);
      if (minValor) params.set('minValor', (parseFloat(minValor) * 1000).toString());

      const res = await fetch(`/api/monitor/vencedores?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json() as VencedoresData;
      setData(json);
      setLoaded(true);
    } catch (e) {
      toast.error(`Erro: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setLoading(false);
    }
  }, [busca, segmento, minContratos, minValor]);

  function handleSort(key: SortKey) {
    if (key === sortKey) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  }

  function clearFilters() {
    setBusca(''); setSegmento(''); setMinContratos(''); setMinValor('');
  }

  const filtered = (data?.dados ?? []).sort((a, b) => {
    let av: string | number = '', bv: string | number = '';
    if (sortKey === 'valorTotalContratosRj') { av = a.valorTotalContratosRj; bv = b.valorTotalContratosRj; }
    else if (sortKey === 'totalContratosRj') { av = a.totalContratosRj; bv = b.totalContratosRj; }
    else if (sortKey === 'razaoSocial') { av = a.razaoSocial; bv = b.razaoSocial; }
    else if (sortKey === 'ultimoContrato') { av = a.ultimoContrato ?? ''; bv = b.ultimoContrato ?? ''; }
    const cmp = av < bv ? -1 : av > bv ? 1 : 0;
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const hasFilters = busca || segmento || minContratos || minValor;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <Trophy className="w-5 h-5 text-[#06B6D4]" />
            <h1 className="text-xl font-semibold text-neutral-900">Fornecedores Vencedores — RJ</h1>
          </div>
          <p className="text-sm text-neutral-500">
            Empresas que venceram licitações hospitalares públicas no Rio de Janeiro
          </p>
        </div>
        <Button onClick={fetchData} disabled={loading} className="gap-2">
          {loading
            ? <><RefreshCw className="w-4 h-4 animate-spin" />Buscando...</>
            : <><Search className="w-4 h-4" />{loaded ? 'Atualizar' : 'Buscar vencedores'}</>
          }
        </Button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={Users} color="bg-blue-50" iconColor="text-blue-600"
          label="Fornecedores" value={loaded ? String(data?.total ?? 0) : '—'} desc="vencedores identificados" />
        <StatCard icon={DollarSign} color="bg-emerald-50" iconColor="text-emerald-600"
          label="Valor total" value={loaded ? formatBRL(data?.valorTotal ?? 0) : '—'} desc="contratos agregados" />
        <StatCard icon={Trophy} color="bg-violet-50" iconColor="text-violet-600"
          label="Segmento líder" value={loaded ? (data?.segmentoLider ?? '—') : '—'} desc="mais fornecedores" />
        <StatCard icon={TrendingUp} color="bg-amber-50" iconColor="text-amber-600"
          label="Novos (7 dias)" value={loaded ? String(data?.novosSemana ?? 0) : '—'} desc="contratados recentemente" />
      </div>

      {/* Filters */}
      <div className="neon-card bg-white rounded-lg border border-neutral-200 shadow-card p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold text-neutral-900">Filtros</p>
          {hasFilters && (
            <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-neutral-400 hover:text-neutral-700">
              <X className="w-3.5 h-3.5" />Limpar
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
            <Input placeholder="Nome ou CNPJ..." value={busca} onChange={e => setBusca(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && fetchData()} className="pl-8 text-sm" />
          </div>
          <Select value={segmento || 'all'} onValueChange={v => setSegmento(v === 'all' ? '' : v)}>
            <SelectTrigger><SelectValue placeholder="Segmento" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os segmentos</SelectItem>
              {TODOS_SEGMENTOS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="relative">
            <Input type="number" placeholder="Mín. contratos" value={minContratos}
              onChange={e => setMinContratos(e.target.value)} className="text-sm" min="0" />
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400">R$</span>
            <Input type="number" placeholder="Valor mín. (K)" value={minValor}
              onChange={e => setMinValor(e.target.value)} className="text-sm pl-8" min="0" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="neon-card bg-white rounded-lg border border-neutral-200 shadow-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-neutral-100">
          <p className="text-sm font-semibold text-neutral-900">
            {loaded ? `${filtered.length} empresa${filtered.length !== 1 ? 's' : ''}` : 'Fornecedores Vencedores'}
          </p>
          <p className="text-xs text-neutral-400">Dados: PNCP · 90 dias</p>
        </div>

        {!loaded && !loading && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-12 h-12 rounded-full bg-[#ECFEFF] flex items-center justify-center mb-4">
              <Trophy className="w-6 h-6 text-[#06B6D4]" />
            </div>
            <p className="text-sm font-semibold text-neutral-800 mb-1">Inteligência de mercado</p>
            <p className="text-xs text-neutral-400 max-w-xs">
              Clique em &quot;Buscar vencedores&quot; para ver quem está ganhando licitações hospitalares no RJ
            </p>
          </div>
        )}

        {(loading || (loaded && filtered.length > 0)) && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-50">
                  {[
                    { key: 'razaoSocial' as SortKey, label: 'Empresa' },
                    { key: null, label: 'CNPJ' },
                    { key: null, label: 'Segmento' },
                    { key: 'totalContratosRj' as SortKey, label: 'Contratos RJ' },
                    { key: 'valorTotalContratosRj' as SortKey, label: 'Valor Total' },
                    { key: 'ultimoContrato' as SortKey, label: 'Último Contrato' },
                    { key: null, label: 'Localização' },
                  ].map(({ key, label }) => (
                    <th key={label}
                      className={cn('text-left text-xs font-medium text-neutral-500 px-4 py-3 whitespace-nowrap select-none',
                        key && 'cursor-pointer hover:text-neutral-900')}
                      onClick={() => key && handleSort(key)}
                    >
                      {label}
                      {key && <SortIcon column={key} sortKey={sortKey} sortDir={sortDir} />}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading && Array.from({ length: 6 }).map((_, i) => <RowSkeleton key={i} />)}
                {!loading && filtered.map(v => (
                  <tr key={v.cnpj}
                    className="border-b border-neutral-50 hover:bg-neutral-50 transition-colors cursor-pointer"
                    onClick={() => setSelected(v)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0', getAvatarColor(v.razaoSocial))}>
                          {getInitials(v.razaoSocial)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-neutral-900 truncate max-w-[200px]">{v.razaoSocial}</p>
                          {v.nomeFantasia && <p className="text-[10px] text-neutral-400 truncate">{v.nomeFantasia}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-neutral-500">{formatCNPJ(v.cnpj)}</td>
                    <td className="px-4 py-3">
                      <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full border', CORES_SEGMENTO[v.segmento] ?? CORES_SEGMENTO['Outros'])}>
                        {v.segmento}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-semibold text-neutral-900">{v.totalContratosRj}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-semibold text-neutral-900 whitespace-nowrap">{formatBRL(v.valorTotalContratosRj)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-neutral-500">{formatDate(v.ultimoContrato)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-neutral-500">{[v.municipio, v.uf].filter(Boolean).join(', ') || '—'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {loaded && !loading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <AlertCircle className="w-10 h-10 text-neutral-200 mx-auto mb-3" />
            <p className="text-sm font-medium text-neutral-600">Nenhum fornecedor encontrado</p>
            <p className="text-xs text-neutral-400 mt-1">Ajuste os filtros e tente novamente</p>
          </div>
        )}
      </div>

      {/* Detail modal */}
      <Dialog open={!!selected} onOpenChange={open => !open && setSelected(null)}>
        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Fornecedor Vencedor</DialogTitle>
            <DialogDescription>Dados do PNCP e Receita Federal</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-md border border-neutral-100">
                <div className={cn('w-12 h-12 rounded-full flex items-center justify-center text-base font-semibold flex-shrink-0', getAvatarColor(selected.razaoSocial))}>
                  {getInitials(selected.razaoSocial)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-neutral-900">{selected.razaoSocial}</p>
                  {selected.nomeFantasia && <p className="text-xs text-neutral-500">{selected.nomeFantasia}</p>}
                  <p className="text-xs text-neutral-400 font-mono mt-0.5">{formatCNPJ(selected.cnpj)}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className={cn('text-xs font-medium px-2.5 py-1 rounded-full border', CORES_SEGMENTO[selected.segmento] ?? CORES_SEGMENTO['Outros'])}>
                  {selected.segmento}
                </span>
                {selected.porte && (
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-600 border border-neutral-200">
                    {selected.porte}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 bg-neutral-50 rounded-md p-4">
                <div>
                  <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wide">Contratos RJ</p>
                  <p className="text-lg font-semibold text-neutral-900">{selected.totalContratosRj}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wide">Valor Total</p>
                  <p className="text-lg font-semibold text-neutral-900">{formatBRLFull(selected.valorTotalContratosRj)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wide">Último contrato</p>
                  <p className="text-sm text-neutral-900">{formatDate(selected.ultimoContrato)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wide">Localização</p>
                  <p className="text-sm text-neutral-900">{[selected.municipio, selected.uf].filter(Boolean).join(', ') || '—'}</p>
                </div>
              </div>

              {(selected.telefone || selected.email) && (
                <div className="border-t border-neutral-100 pt-3 space-y-1.5">
                  <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-widest">Contato</p>
                  {selected.telefone && <p className="text-sm text-neutral-700">{selected.telefone}</p>}
                  {selected.email && <a href={`mailto:${selected.email}`} className="text-sm text-[#06B6D4]">{selected.email}</a>}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  className="flex-1"
                  onClick={() => {
                    toast.success(`${selected.razaoSocial} adicionado ao cadastro!`);
                    setSelected(null);
                  }}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Adicionar ao cadastro
                </Button>
                <Button variant="outline" onClick={() => setSelected(null)}>Fechar</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Info footer */}
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-lg px-5 py-4">
        <Building2 className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-blue-700">
          Dados extraídos do PNCP (Portal Nacional de Contratações Públicas) — contratos assinados nos últimos 90 dias no RJ, filtrados por palavras-chave hospitalares. Para adicionar um fornecedor ao seu cadastro, clique no nome da empresa.
        </p>
      </div>
    </div>
  );
}
