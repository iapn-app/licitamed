"use client";

import { useState, useCallback } from "react";
import {
  Newspaper, Search, AlertTriangle, ExternalLink, Bell, RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/shared/skeleton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface DOUPublicacao {
  id: string;
  titulo: string;
  conteudo: string;
  pubDate: string;
  urlTitle: string;
  secao: string;
  edicao: string;
  destacado: boolean;
  powerMed?: boolean;
}

const SECAO_COLORS: Record<string, string> = {
  DO1: 'bg-blue-50 text-blue-700 border-blue-200',
  DO2: 'bg-green-50 text-green-700 border-green-200',
  DO3: 'bg-orange-50 text-orange-700 border-orange-200',
};

const SECAO_LABELS: Record<string, string> = {
  DO1: 'Seção 1',
  DO2: 'Seção 2',
  DO3: 'Seção 3',
  todas: 'Todas as seções',
};

function formatPubDate(d: string): string {
  if (!d) return '';
  try {
    const date = new Date(d.includes('T') ? d : d.replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$3-$2-$1'));
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  } catch { return d; }
}

function highlight(text: string, termo: string): string {
  if (!termo) return text;
  const regex = new RegExp(`(${termo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return text.replace(regex, '<mark class="bg-yellow-100 text-yellow-900 px-0.5 rounded">$1</mark>');
}

const SUGESTOES = [
  'material hospitalar', 'OPME', 'medicamento', 'equipamento médico',
  'pregão eletrônico', 'dispensa de licitação', 'insumo hospitalar',
];

export default function DOUPage() {
  const [query, setQuery] = useState('material hospitalar');
  const [secao, setSecao] = useState('DO3');
  const [dias, setDias] = useState('7');
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [publicacoes, setPublicacoes] = useState<DOUPublicacao[]>([]);
  const [total, setTotal] = useState(0);
  const [powerMedAlerts, setPowerMedAlerts] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');

  const buscar = useCallback(async () => {
    if (!query.trim()) { toast.error('Digite um termo de busca'); return; }
    setState('loading');
    setPublicacoes([]);
    try {
      const params = new URLSearchParams({ q: query.trim(), secao, dias });
      const res = await fetch(`/api/dou/busca?${params}`);
      const data = await res.json() as {
        publicacoes?: DOUPublicacao[];
        total?: number;
        powerMedAlerts?: number;
        erro?: string;
      };
      if (data.erro && !data.publicacoes?.length) throw new Error(data.erro);
      setPublicacoes(data.publicacoes ?? []);
      setTotal(data.total ?? 0);
      setPowerMedAlerts(data.powerMedAlerts ?? 0);
      setState('done');
      if ((data.publicacoes?.length ?? 0) === 0) toast.info('Nenhuma publicação encontrada para esse período');
      if ((data.powerMedAlerts ?? 0) > 0) {
        toast.warning(`⚠️ Power Med mencionada em ${data.powerMedAlerts} publicação(ões)!`, { duration: 8000 });
      }
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : String(e));
      setState('error');
    }
  }, [query, secao, dias]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <Newspaper className="w-5 h-5 text-[#06B6D4]" />
            <h1 className="text-xl font-semibold text-neutral-900">Diário Oficial da União</h1>
          </div>
          <p className="text-sm text-neutral-500">
            Publicações relevantes para o setor de saúde — fonte: Imprensa Nacional
          </p>
        </div>
        {powerMedAlerts > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
            <Bell className="w-4 h-4 text-red-500" />
            <span className="text-xs font-semibold text-red-700">
              Power Med mencionada em {powerMedAlerts} publicação{powerMedAlerts > 1 ? 'ões' : ''}
            </span>
          </div>
        )}
      </div>

      {/* Search */}
      <div className="neon-card bg-white rounded-lg border border-neutral-200 shadow-card p-5">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
          <div className="md:col-span-2">
            <label className="text-xs font-medium text-neutral-600 mb-1.5 block">Palavra-chave</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <Input
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && buscar()}
                placeholder="Ex: material hospitalar, OPME..."
                className="pl-9"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-neutral-600 mb-1.5 block">Seção</label>
            <Select value={secao} onValueChange={setSecao}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="DO1">DO1 — Seção 1 (Atos normativos)</SelectItem>
                <SelectItem value="DO2">DO2 — Seção 2 (Servidores)</SelectItem>
                <SelectItem value="DO3">DO3 — Seção 3 (Licitações e contratos)</SelectItem>
                <SelectItem value="todas">Todas as seções</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-neutral-600 mb-1.5 block">Período</label>
            <Select value={dias} onValueChange={setDias}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Hoje</SelectItem>
                <SelectItem value="3">Últimos 3 dias</SelectItem>
                <SelectItem value="7">Últimos 7 dias</SelectItem>
                <SelectItem value="15">Últimos 15 dias</SelectItem>
                <SelectItem value="30">Últimos 30 dias</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Sugestões */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {SUGESTOES.map(s => (
            <button
              key={s}
              onClick={() => { setQuery(s); }}
              className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600 hover:bg-[#ECFEFF] hover:text-[#06B6D4] border border-neutral-200 transition-colors"
            >
              {s}
            </button>
          ))}
        </div>

        <Button onClick={buscar} disabled={state === 'loading'} className="gap-2">
          {state === 'loading'
            ? <><RefreshCw className="w-4 h-4 animate-spin" />Buscando no DOU...</>
            : <><Search className="w-4 h-4" />{state === 'done' ? 'Atualizar' : 'Buscar no DOU'}</>
          }
        </Button>
      </div>

      {/* Error */}
      {state === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-700">Erro ao acessar o DOU</p>
            <p className="text-xs text-red-500 mt-0.5">{errorMsg}</p>
            <Button variant="outline" size="sm" className="mt-2" onClick={buscar}>Tentar novamente</Button>
          </div>
        </div>
      )}

      {/* Idle */}
      {state === 'idle' && (
        <div className="bg-white rounded-lg border border-neutral-200 p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-[#ECFEFF] flex items-center justify-center mx-auto mb-4">
            <Newspaper className="w-6 h-6 text-[#06B6D4]" />
          </div>
          <p className="text-sm font-semibold text-neutral-800 mb-1">Monitoramento do DOU</p>
          <p className="text-xs text-neutral-400 max-w-xs mx-auto">
            Busque publicações relevantes para saúde, licitações e contratos na Seção 3 do Diário Oficial
          </p>
        </div>
      )}

      {/* Results */}
      {(state === 'loading' || state === 'done') && (
        <div className="space-y-3">
          {state === 'done' && (
            <p className="text-sm text-neutral-500">
              <span className="font-semibold text-neutral-900">{publicacoes.length}</span> publicações
              {total > publicacoes.length && ` (de ${total.toLocaleString('pt-BR')} no total)`}
              {' '}— {SECAO_LABELS[secao] ?? secao}, últimos {dias} dia{Number(dias) !== 1 ? 's' : ''}
            </p>
          )}

          {state === 'loading' && Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-neutral-200 p-5 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/4" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-5/6" />
            </div>
          ))}

          {state === 'done' && publicacoes.map((pub) => (
            <div
              key={pub.id}
              className={cn(
                'bg-white rounded-lg border p-5 transition-all',
                pub.powerMed
                  ? 'border-red-300 bg-red-50'
                  : pub.destacado
                    ? 'border-[#06B6D4]/30 shadow-sm'
                    : 'border-neutral-200'
              )}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  {pub.powerMed && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500 text-white">
                      <Bell className="w-2.5 h-2.5" />ALERTA POWER MED
                    </span>
                  )}
                  <span className={cn(
                    'text-[10px] font-semibold px-2 py-0.5 rounded-full border',
                    SECAO_COLORS[pub.secao] ?? 'bg-neutral-100 text-neutral-600 border-neutral-200'
                  )}>
                    {pub.secao}
                  </span>
                  {pub.edicao && (
                    <span className="text-[10px] text-neutral-400">Edição {pub.edicao}</span>
                  )}
                </div>
                {pub.pubDate && (
                  <span className="text-[10px] text-neutral-400 whitespace-nowrap flex-shrink-0">
                    {formatPubDate(pub.pubDate)}
                  </span>
                )}
              </div>

              <h3
                className="text-sm font-semibold text-neutral-900 mb-1.5 leading-snug"
                dangerouslySetInnerHTML={{ __html: highlight(pub.titulo, query) }}
              />

              {pub.conteudo && (
                <p
                  className="text-xs text-neutral-500 leading-relaxed line-clamp-3"
                  dangerouslySetInnerHTML={{ __html: highlight(pub.conteudo, query) }}
                />
              )}

              {pub.urlTitle && (
                <a
                  href={`https://www.in.gov.br/web/dou/-/${pub.urlTitle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 mt-3 text-[10px] font-medium text-[#06B6D4] hover:text-[#0891B2]"
                >
                  <ExternalLink className="w-3 h-3" />
                  Ver publicação original
                </a>
              )}
            </div>
          ))}

          {state === 'done' && publicacoes.length === 0 && (
            <div className="bg-white rounded-lg border border-neutral-200 p-12 text-center">
              <Newspaper className="w-10 h-10 text-neutral-200 mx-auto mb-3" />
              <p className="text-sm text-neutral-500">Nenhuma publicação encontrada para esse filtro</p>
              <p className="text-xs text-neutral-400 mt-1">Tente ampliar o período ou mudar a palavra-chave</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
