"use client";

import { useState, useCallback } from "react";
import {
  Radio, Search, RefreshCw, ExternalLink, Clock,
  TrendingUp, FileText, DollarSign, CheckCircle2, XCircle,
  AlertCircle, ChevronUp, ChevronDown, X, ShieldCheck, Newspaper,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/shared/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { LicitacaoMonitor, StatusFonte } from "@/lib/monitor/types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface MonitorData {
  dados: LicitacaoMonitor[];
  total: number;
  encontradasHoje: number;
  ultimos30dias: number;
  fontesAtivas: number;
  fontes: StatusFonte[];
  timestamp: string;
}

type SortKey = 'dataPublicacao' | 'dataAbertura' | 'valorEstimado' | 'orgao' | 'fonte';
type SortDir = 'asc' | 'desc';

// ─── Constants ────────────────────────────────────────────────────────────────

const FONTE_COLORS: Record<string, string> = {
  PNCP: 'bg-blue-50 text-blue-700 border-blue-200',
  ComprasRio: 'bg-orange-50 text-orange-700 border-orange-200',
  'SEPLAG-RJ': 'bg-green-50 text-green-700 border-green-200',
  BLL: 'bg-purple-50 text-purple-700 border-purple-200',
  LicitacoesE: 'bg-yellow-50 text-yellow-700 border-yellow-200',
};

const MODALIDADES = ['Pregão Eletrônico', 'Pregão Presencial', 'Dispensa', 'Credenciamento', 'Concorrência', 'Tomada de Preços'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBRL(v: number | null | undefined) {
  if (!v) return '—';
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return '—';
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
}

function isNova(iso: string) {
  return Date.now() - new Date(iso).getTime() < 24 * 3600000;
}

const KW_STOPWORDS = new Set([
  'aquisição','aquisicao','de','para','e','do','da','dos','das','material','médico',
  'medico','hospitalar','com','em','o','a','os','as','um','uma','no','na','nos','nas',
  'por','pelo','pela','pelos','pelas','ao','aos','que','se','mais','ou','ser','ter',
  'tipo','conforme','contratação','contratacao','fornecimento','prestação','prestacao',
  'serviço','servico','serviços','servicos','registro','preço','preco','não','nao',
  'sob','sua','seu','entre','até','ate','uso','sua','sendo','seja','seus','suas',
]);

function extractKeywords(objeto: string): string[] {
  const tokenize = (text: string) =>
    text.toLowerCase()
      .split(/[\s,;/|.+&\-–]+/)
      .map(t => t.replace(/[^a-záàâãéèêíïóôõöúüçñ]/gi, '').trim())
      .filter(t => t.length > 3 && !KW_STOPWORDS.has(t));
  const parenTerms = Array.from(objeto.matchAll(/\(([^)]+)\)/g))
    .flatMap(m => tokenize(m[1]));
  if (parenTerms.length >= 1) return parenTerms.slice(0, 3);
  return tokenize(objeto).slice(0, 3);
}

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

function RowSkeleton() {
  return (
    <tr className="border-b border-neutral-100">
      {Array.from({ length: 7 }).map((_, i) => (
        <td key={i} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>
      ))}
    </tr>
  );
}

function SortIcon({ column, sortKey, sortDir }: { column: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (column !== sortKey) return <span className="w-3.5 h-3.5 opacity-0 inline-block" />;
  return sortDir === 'asc'
    ? <ChevronUp className="w-3.5 h-3.5 inline-block ml-1 text-[#06B6D4]" />
    : <ChevronDown className="w-3.5 h-3.5 inline-block ml-1 text-[#06B6D4]" />;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MonitorPage() {
  const [data, setData] = useState<MonitorData | null>(null);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Filters
  const [keyword, setKeyword] = useState('');
  const [fonte, setFonte] = useState('');
  const [modalidade, setModalidade] = useState('');
  const [dataInicial, setDataInicial] = useState('');
  const [dataFinal, setDataFinal] = useState('');

  // Sort
  const [sortKey, setSortKey] = useState<SortKey>('dataPublicacao');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  // Detail modal
  const [selected, setSelected] = useState<LicitacaoMonitor | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (keyword) params.set('keyword', keyword);
      if (fonte) params.set('fonte', fonte);
      if (dataInicial) params.set('dataInicial', dataInicial);
      if (dataFinal) params.set('dataFinal', dataFinal);

      const res = await fetch(`/api/monitor/licitacoes?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json() as MonitorData;
      setData(json);
      setLoaded(true);
    } catch (e) {
      toast.error(`Erro ao buscar licitações: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setLoading(false);
    }
  }, [keyword, fonte, dataInicial, dataFinal]);

  function handleSort(key: SortKey) {
    if (key === sortKey) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  }

  function clearFilters() {
    setKeyword(''); setFonte(''); setModalidade(''); setDataInicial(''); setDataFinal('');
  }

  // Apply client-side modalidade filter + sort
  const filtered = (data?.dados ?? [])
    .filter(d => !modalidade || d.modalidade === modalidade)
    .sort((a, b) => {
      let av: string | number = '';
      let bv: string | number = '';
      if (sortKey === 'dataPublicacao') { av = a.dataPublicacao; bv = b.dataPublicacao; }
      else if (sortKey === 'dataAbertura') { av = a.dataAbertura ?? ''; bv = b.dataAbertura ?? ''; }
      else if (sortKey === 'valorEstimado') { av = a.valorEstimado ?? 0; bv = b.valorEstimado ?? 0; }
      else if (sortKey === 'orgao') { av = a.orgao; bv = b.orgao; }
      else if (sortKey === 'fonte') { av = a.fonte; bv = b.fonte; }
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sortDir === 'asc' ? cmp : -cmp;
    });

  const hasFilters = keyword || fonte || modalidade || dataInicial || dataFinal;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <Radio className="w-5 h-5 text-[#06B6D4]" />
            <h1 className="text-xl font-semibold text-neutral-900">Monitor de Licitações — RJ</h1>
          </div>
          <p className="text-sm text-neutral-500">
            Editais hospitalares de 5 fontes: PNCP · ComprasRio · SEPLAG-RJ · BLL
          </p>
        </div>
        <Button
          onClick={fetchData}
          disabled={loading}
          className="gap-2"
        >
          {loading ? (
            <><RefreshCw className="w-4 h-4 animate-spin" />Buscando...</>
          ) : (
            <><Search className="w-4 h-4" />{loaded ? 'Atualizar' : 'Buscar licitações'}</>
          )}
        </Button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          icon={FileText} color="bg-blue-50" iconColor="text-blue-600"
          label="Total encontradas" value={loaded ? String(data?.total ?? 0) : '—'}
          desc="todas as fontes"
        />
        <StatCard
          icon={Clock} color="bg-green-50" iconColor="text-green-600"
          label="Hoje" value={loaded ? String(data?.encontradasHoje ?? 0) : '—'}
          desc="publicadas hoje"
        />
        <StatCard
          icon={TrendingUp} color="bg-orange-50" iconColor="text-orange-600"
          label="Últimos 30 dias" value={loaded ? String(data?.ultimos30dias ?? 0) : '—'}
          desc="janela histórica"
        />
        <StatCard
          icon={DollarSign} color="bg-purple-50" iconColor="text-purple-600"
          label="Fontes ativas" value={loaded ? `${data?.fontesAtivas ?? 0}/4` : '—'}
          desc="APIs respondendo"
        />
      </div>

      {/* Source status */}
      {loaded && data?.fontes && (
        <div className="neon-card bg-white rounded-lg border border-neutral-200 shadow-card px-5 py-4">
          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-widest mb-3">Status das fontes</p>
          <div className="flex flex-wrap gap-3">
            {data.fontes.map(f => (
              <div key={f.fonte} className="flex items-center gap-2">
                {f.ativa
                  ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                  : <XCircle className="w-3.5 h-3.5 text-neutral-300" />}
                <span className={cn(
                  'text-xs font-medium px-2 py-0.5 rounded-full border',
                  FONTE_COLORS[f.fonte] ?? 'bg-neutral-100 text-neutral-600 border-neutral-200'
                )}>
                  {f.fonte}
                </span>
                {f.ativa && f.totalEncontrado !== undefined && (
                  <span className="text-xs text-neutral-400">{f.totalEncontrado} itens</span>
                )}
                {!f.ativa && f.erro && (
                  <span className="text-xs text-red-400">indisponível</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

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
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
            <Input
              placeholder="Palavra-chave..."
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && fetchData()}
              className="pl-8 text-sm"
            />
          </div>
          <Select value={fonte || 'all'} onValueChange={v => setFonte(v === 'all' ? '' : v)}>
            <SelectTrigger><SelectValue placeholder="Fonte" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as fontes</SelectItem>
              {['PNCP', 'ComprasRio', 'SEPLAG-RJ', 'BLL'].map(f => (
                <SelectItem key={f} value={f}>{f}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={modalidade || 'all'} onValueChange={v => setModalidade(v === 'all' ? '' : v)}>
            <SelectTrigger><SelectValue placeholder="Modalidade" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {MODALIDADES.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input type="date" value={dataInicial} onChange={e => setDataInicial(e.target.value)} className="text-sm" />
          <Input type="date" value={dataFinal} onChange={e => setDataFinal(e.target.value)} className="text-sm" />
        </div>
      </div>

      {/* Table */}
      <div className="neon-card bg-white rounded-lg border border-neutral-200 shadow-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-neutral-100">
          <p className="text-sm font-semibold text-neutral-900">
            {loaded ? `${filtered.length} licitação${filtered.length !== 1 ? 'ões' : ''}` : 'Licitações'}
          </p>
          {data?.timestamp && (
            <p className="text-xs text-neutral-400">
              Atualizado às {new Date(data.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
        </div>

        {!loaded && !loading && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-12 h-12 rounded-full bg-[#ECFEFF] flex items-center justify-center mb-4">
              <Radio className="w-6 h-6 text-[#06B6D4]" />
            </div>
            <p className="text-sm font-semibold text-neutral-800 mb-1">Monitor aguardando</p>
            <p className="text-xs text-neutral-400 max-w-xs">
              Clique em &quot;Buscar licitações&quot; para carregar editais hospitalares de todas as fontes do RJ
            </p>
          </div>
        )}

        {(loading || (loaded && filtered.length > 0)) && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-50">
                  {[
                    { key: 'fonte' as SortKey, label: 'Fonte' },
                    { key: 'orgao' as SortKey, label: 'Órgão' },
                    { key: null, label: 'Objeto' },
                    { key: null, label: 'Modalidade' },
                    { key: 'valorEstimado' as SortKey, label: 'Valor' },
                    { key: 'dataPublicacao' as SortKey, label: 'Publicação' },
                    { key: 'dataAbertura' as SortKey, label: 'Abertura' },
                    { key: null, label: '' },
                  ].map(({ key, label }) => (
                    <th
                      key={label}
                      className={cn(
                        'text-left text-xs font-medium text-neutral-500 px-4 py-3 whitespace-nowrap select-none',
                        key && 'cursor-pointer hover:text-neutral-900'
                      )}
                      onClick={() => key && handleSort(key)}
                    >
                      {label}
                      {key && <SortIcon column={key} sortKey={sortKey} sortDir={sortDir} />}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading && Array.from({ length: 5 }).map((_, i) => <RowSkeleton key={i} />)}
                {!loading && filtered.map(item => (
                  <tr
                    key={item.id}
                    className="border-b border-neutral-50 hover:bg-neutral-50 transition-colors cursor-pointer"
                    onClick={() => setSelected(item)}
                  >
                    <td className="px-4 py-3">
                      <span className={cn(
                        'text-[10px] font-semibold px-2 py-0.5 rounded-full border whitespace-nowrap',
                        FONTE_COLORS[item.fonte] ?? 'bg-neutral-100 text-neutral-600 border-neutral-200'
                      )}>
                        {item.fonte}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs font-medium text-neutral-900 max-w-[180px] truncate">{item.orgao}</p>
                      {(item.municipio || item.uf) && (
                        <p className="text-[10px] text-neutral-400">{item.municipio}{item.municipio && item.uf ? ', ' : ''}{item.uf}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs text-neutral-700 max-w-[280px] line-clamp-2 leading-relaxed">{item.objeto}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-neutral-500 whitespace-nowrap">{item.modalidade}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-semibold text-neutral-900 whitespace-nowrap">{formatBRL(item.valorEstimado)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-neutral-500 whitespace-nowrap">{formatDate(item.dataPublicacao)}</span>
                      {isNova(item.dataPublicacao) && (
                        <span className="ml-1.5 text-[9px] font-bold px-1.5 py-0.5 bg-red-500 text-white rounded-full">NOVO</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-neutral-500 whitespace-nowrap">{formatDate(item.dataAbertura)}</span>
                    </td>
                    <td className="px-4 py-3">
                      {item.urlEdital && (
                        <a
                          href={item.urlEdital}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="p-1.5 rounded-md text-neutral-400 hover:text-[#06B6D4] hover:bg-[#ECFEFF] transition-colors inline-flex"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
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
            <p className="text-sm font-medium text-neutral-600">Nenhuma licitação encontrada</p>
            <p className="text-xs text-neutral-400 mt-1">Ajuste os filtros ou clique em Atualizar</p>
          </div>
        )}
      </div>

      {/* Detail modal */}
      <Dialog open={!!selected} onOpenChange={open => !open && setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da Licitação</DialogTitle>
            <DialogDescription>Informações completas do edital</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 text-sm">
              <div className="flex flex-wrap gap-2">
                <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full border', FONTE_COLORS[selected.fonte])}>
                  {selected.fonte}
                </span>
                {selected.palavrasEncontradas?.map(p => (
                  <span key={p} className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200">
                    {p}
                  </span>
                ))}
              </div>

              <div className="bg-neutral-50 rounded-md p-4 space-y-2">
                <p className="font-semibold text-neutral-900">{selected.objeto}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Órgão', value: selected.orgao },
                  { label: 'Modalidade', value: selected.modalidade },
                  { label: 'Número', value: selected.numeroEdital ?? '—' },
                  { label: 'Município', value: [selected.municipio, selected.uf].filter(Boolean).join(', ') || '—' },
                  { label: 'Valor estimado', value: formatBRL(selected.valorEstimado) },
                  { label: 'Publicação', value: formatDate(selected.dataPublicacao) },
                  { label: 'Abertura', value: formatDate(selected.dataAbertura) },
                  { label: 'Status', value: selected.status },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wide">{label}</p>
                    <p className="text-sm text-neutral-900 mt-0.5">{value}</p>
                  </div>
                ))}
              </div>

              {selected.urlEdital && (
                <a
                  href={selected.urlEdital}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-[#06B6D4] hover:text-[#0891B2] text-sm font-medium"
                >
                  <ExternalLink className="w-4 h-4" />
                  Acessar edital completo
                </a>
              )}

              <div className="flex flex-wrap gap-2 pt-2 border-t border-neutral-100">
                <Button
                  className="flex-1"
                  onClick={() => {
                    toast.success('Licitação importada para Power Med!', { description: selected.orgao });
                    setSelected(null);
                  }}
                >
                  Importar para Power Med
                </Button>
                <Link
                  href={`/anvisa?q=${encodeURIComponent(extractKeywords(selected.objeto).join(','))}&auto=true`}
                  target="_blank"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md border border-neutral-200 text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
                  onClick={() => setSelected(null)}
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-[#06B6D4]" />
                  Verificar ANVISA
                </Link>
                <Link
                  href={`/dou?q=${encodeURIComponent(extractKeywords(selected.objeto).join(' '))}&auto=true`}
                  target="_blank"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md border border-neutral-200 text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
                  onClick={() => setSelected(null)}
                >
                  <Newspaper className="w-3.5 h-3.5 text-orange-500" />
                  Buscar no DOU
                </Link>
                <Button variant="outline" onClick={() => setSelected(null)} className="shrink-0">Fechar</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
