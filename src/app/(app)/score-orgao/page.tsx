"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Star, Search, AlertTriangle, CheckCircle2, TrendingUp, Clock, BarChart2, History, ExternalLink, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/shared/skeleton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { ScoreResult } from "@/app/api/score-orgao/route";

function formatBRL(v: number) {
  if (!v) return '—';
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
}

function formatDate(d: string) {
  if (!d) return '—';
  const [y, m, day] = d.slice(0, 10).split('-');
  return `${day}/${m}/${y}`;
}

function formatCNPJ(c: string) {
  const d = c.replace(/\D/g, '').padStart(14, '0');
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12, 14)}`;
}

const SCORE_CONFIG: Record<string, { color: string; ring: string; bg: string; label: string; emoji: string }> = {
  excelente:    { color: 'text-green-700',  ring: '#16A34A', bg: 'bg-green-50 border-green-200',   label: 'Excelente pagador',   emoji: '🟢' },
  bom:          { color: 'text-blue-700',   ring: '#2563EB', bg: 'bg-blue-50 border-blue-200',     label: 'Bom pagador',         emoji: '🔵' },
  regular:      { color: 'text-orange-700', ring: '#EA580C', bg: 'bg-orange-50 border-orange-200', label: 'Pagador regular',     emoji: '🟠' },
  risco:        { color: 'text-red-700',    ring: '#DC2626', bg: 'bg-red-50 border-red-200',       label: 'Alto risco',          emoji: '🔴' },
  insuficiente: { color: 'text-neutral-600',ring: '#9CA3AF', bg: 'bg-neutral-100 border-neutral-300',label: 'Dados insuficientes',emoji: '⚠️' },
};

function ScoreGauge({ score, classificacao }: { score: number; classificacao: string }) {
  const cfg = SCORE_CONFIG[classificacao] ?? SCORE_CONFIG.regular;
  const r = 52;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-36 h-36">
        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
          <circle cx="60" cy="60" r={r} fill="none" stroke="#E5E7EB" strokeWidth="10" />
          <circle
            cx="60" cy="60" r={r} fill="none"
            stroke={cfg.ring} strokeWidth="10"
            strokeDasharray={`${dash} ${circ}`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 0.6s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-neutral-900">{score}</span>
          <span className="text-xs text-neutral-400">/ 100</span>
        </div>
      </div>
      <span className={cn('text-sm font-semibold px-3 py-1 rounded-full border', cfg.bg, cfg.color)}>
        {cfg.emoji} {cfg.label}
      </span>
    </div>
  );
}

function CriterioBar({ label, score, peso, detalhe }: { label: string; score: number; peso: number; detalhe: string }) {
  const color = score >= 70 ? 'bg-green-500' : score >= 40 ? 'bg-orange-400' : 'bg-red-500';
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-neutral-700">{label} <span className="text-neutral-400 font-normal">({peso}%)</span></span>
        <span className="font-semibold text-neutral-900">{score}/100</span>
      </div>
      <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full transition-all duration-500', color)} style={{ width: `${score}%` }} />
      </div>
      <p className="text-[10px] text-neutral-400">{detalhe}</p>
    </div>
  );
}

export default function ScoreOrgaoPage() {
  const [cnpj, setCnpj] = useState('');
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [resultado, setResultado] = useState<ScoreResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const autoFiredRef = useRef(false);

  const buscar = useCallback(async (overrideCnpj?: string) => {
    const q = (overrideCnpj ?? cnpj).replace(/\D/g, '');
    if (q.length !== 14) { toast.error('Digite um CNPJ válido (14 dígitos)'); return; }
    setState('loading');
    setResultado(null);
    try {
      const res = await fetch(`/api/score-orgao?cnpj=${q}`);
      const data = await res.json() as ScoreResult & { erro?: string };
      if (data.erro) throw new Error(data.erro);
      setResultado(data);
      setState('done');
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : String(e));
      setState('error');
    }
  }, [cnpj]);

  useEffect(() => {
    if (autoFiredRef.current) return;
    const sp = new URLSearchParams(window.location.search);
    const q = sp.get('cnpj');
    if (q) {
      autoFiredRef.current = true;
      setCnpj(q);
      buscar(q);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const r = resultado;
  const cfg = r ? (SCORE_CONFIG[r.classificacao] ?? SCORE_CONFIG.regular) : null;

  function detalhesCriterio(r: ScoreResult) {
    return {
      tempoPagamento: r.criterios.tempoPagamento.diasMedios !== null
        ? `Média de ${r.criterios.tempoPagamento.diasMedios} dias entre empenho e pagamento`
        : 'Sem dados do Portal da Transparência (configure TRANSPARENCIA_API_KEY)',
      regularidade: `${r.criterios.regularidade.percentual}% dos contratos com situação definida`,
      volume: `${r.criterios.volume.total} contratos no histórico`,
      historico: `${r.criterios.historico.recentes} contratos nos últimos 12 meses`,
    };
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <Star className="w-5 h-5 text-[#06B6D4]" />
            <h1 className="text-xl font-semibold text-neutral-900">Score de Órgãos Públicos</h1>
          </div>
          <p className="text-sm text-neutral-500">
            Avalie se um órgão público é bom pagador antes de participar de um pregão
          </p>
        </div>
        <span className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 border border-blue-200 rounded-full text-xs font-medium text-blue-700 whitespace-nowrap">
          <Info className="w-3.5 h-3.5" />
          Dados: PNCP + Portal Transparência
        </span>
      </div>

      {/* Search */}
      <div className="neon-card bg-white rounded-lg border border-neutral-200 shadow-card p-5">
        <label className="text-xs font-medium text-neutral-600 mb-1.5 block">CNPJ do Órgão Público</label>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <Input
              value={cnpj}
              onChange={e => setCnpj(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && buscar()}
              placeholder="Ex: 44.267.353/0001-63"
              className="pl-9"
            />
          </div>
          <Button onClick={() => buscar()} disabled={state === 'loading'} className="gap-2 shrink-0">
            {state === 'loading'
              ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Analisando...</>
              : <><Star className="w-4 h-4" />Calcular Score</>
            }
          </Button>
        </div>
        <p className="text-[10px] text-neutral-400 mt-2">
          Exemplos: SES-RJ 44.267.353/0001-63 · Ministério da Saúde 00.394.544/0001-75
        </p>
      </div>

      {/* Error */}
      {state === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-700">Erro ao calcular score</p>
            <p className="text-xs text-red-500 mt-0.5">{errorMsg}</p>
            <Button variant="outline" size="sm" className="mt-2" onClick={() => buscar()}>Tentar novamente</Button>
          </div>
        </div>
      )}

      {/* Idle */}
      {state === 'idle' && (
        <div className="bg-white rounded-lg border border-neutral-200 p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-[#ECFEFF] flex items-center justify-center mx-auto mb-4">
            <Star className="w-6 h-6 text-[#06B6D4]" />
          </div>
          <p className="text-sm font-semibold text-neutral-800 mb-1">Avalie antes de participar</p>
          <p className="text-xs text-neutral-400 max-w-sm mx-auto">
            Informe o CNPJ do órgão comprador para analisar seu histórico de pagamentos e contratos
          </p>
        </div>
      )}

      {/* Loading skeleton */}
      {state === 'loading' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="neon-card bg-white rounded-lg border border-neutral-200 p-6 flex flex-col items-center gap-4">
            <Skeleton className="w-36 h-36 rounded-full" />
            <Skeleton className="h-6 w-32" />
          </div>
          <div className="lg:col-span-2 space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-1.5">
                <Skeleton className="h-3 w-1/3" />
                <Skeleton className="h-2 w-full" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Result */}
      {state === 'done' && r && cfg && (
        <div className="space-y-6">
          {/* Top row: gauge + criteria */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Score gauge */}
            <div className="neon-card bg-white rounded-lg border border-neutral-200 shadow-card p-6 flex flex-col items-center gap-4">
              <ScoreGauge score={r.dadosInsuficientes && r.semChaveTransparencia ? 0 : r.score} classificacao={r.classificacao} />
              <div className="text-center">
                <div className="flex items-center justify-center gap-1.5 flex-wrap mb-0.5">
                  <p className="text-sm font-semibold text-neutral-900">{r.nomeOrgao !== r.cnpj ? r.nomeOrgao : formatCNPJ(r.cnpj)}</p>
                  {r.federal && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">GOV FEDERAL</span>
                  )}
                </div>
                <p className="text-[10px] text-neutral-400">{formatCNPJ(r.cnpj)}</p>
                {r.buscouRaiz && (
                  <p className="text-[10px] text-amber-600 mt-1">⚠️ Subunidade — buscando pela org. principal</p>
                )}
              </div>

              {/* Badges de avisos */}
              {r.dadosInsuficientes && (
                <div className="w-full flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-md">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <p className="text-xs font-medium text-amber-700">
                    Dados insuficientes ({r.totalContratos} contrato{r.totalContratos !== 1 ? 's' : ''} no PNCP)
                  </p>
                </div>
              )}
              {r.semChaveTransparencia && (
                <div className="w-full flex items-center gap-2 px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-md">
                  <Info className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                  <p className="text-[10px] text-neutral-500">
                    Configure <code className="font-mono bg-neutral-200 px-0.5 rounded">TRANSPARENCIA_API_KEY</code> para dados de pagamento
                  </p>
                </div>
              )}
              {r.irregularidades && (
                <div className="w-full flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-md">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                  <p className="text-xs font-medium text-red-700">Irregularidade no CEIS/CNEP</p>
                </div>
              )}
              {r.bonusFederal > 0 && (
                <div className="w-full flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-md">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <p className="text-[10px] text-blue-700">
                    Bônus federal aplicado: +{r.bonusFederal} pts (score base: {r.scoreBase})
                  </p>
                </div>
              )}

              <div className="w-full text-center text-[10px] text-neutral-400">
                Score baseado em {r.totalContratos} contrato{r.totalContratos !== 1 ? 's' : ''} analisados · {r.fontesDados.join(' · ')}
              </div>
            </div>

            {/* Criteria bars */}
            <div className="lg:col-span-2 neon-card bg-white rounded-lg border border-neutral-200 shadow-card p-6 space-y-5">
              <h3 className="text-sm font-semibold text-neutral-900 mb-4">Detalhamento dos Critérios</h3>
              {(() => {
                const det = detalhesCriterio(r);
                return (
                  <>
                    <CriterioBar label="Tempo de Pagamento" score={r.criterios.tempoPagamento.score} peso={35} detalhe={det.tempoPagamento} />
                    <CriterioBar label="Regularidade" score={r.criterios.regularidade.score} peso={25} detalhe={det.regularidade} />
                    <CriterioBar label="Volume de Contratos" score={r.criterios.volume.score} peso={20} detalhe={det.volume} />
                    <CriterioBar label="Histórico Recente" score={r.criterios.historico.score} peso={20} detalhe={det.historico} />
                  </>
                );
              })()}
            </div>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { icon: BarChart2, label: 'Total de contratos', value: r.totalContratos.toString(), color: 'bg-blue-50', iconColor: 'text-blue-500' },
              { icon: TrendingUp, label: 'Contratos ativos', value: r.contratosAtivos.toString(), color: 'bg-green-50', iconColor: 'text-green-500' },
              { icon: History, label: 'Contratos (12m)', value: r.contratosRecentes.toString(), color: 'bg-purple-50', iconColor: 'text-purple-500' },
            ].map(({ icon: Icon, label, value, color, iconColor }) => (
              <div key={label} className="bg-white rounded-lg border border-neutral-200 p-4">
                <div className={cn('w-8 h-8 rounded-md flex items-center justify-center mb-2', color)}>
                  <Icon className={cn('w-4 h-4', iconColor)} />
                </div>
                <p className="text-xl font-bold text-neutral-900">{value}</p>
                <p className="text-xs text-neutral-400">{label}</p>
              </div>
            ))}
          </div>

          {/* Recommendation */}
          <div className={cn('rounded-lg border p-4 flex items-start gap-3', cfg.bg)}>
            <CheckCircle2 className={cn('w-5 h-5 shrink-0 mt-0.5', cfg.color)} />
            <div>
              <p className={cn('text-sm font-semibold', cfg.color)}>Recomendação</p>
              <p className="text-sm text-neutral-700 mt-0.5">{r.recomendacao}</p>
            </div>
          </div>

          {/* Last contracts */}
          {r.ultimosContratos.length > 0 && (
            <div className="neon-card bg-white rounded-lg border border-neutral-200 shadow-card overflow-hidden">
              <div className="px-5 py-3 border-b border-neutral-100">
                <p className="text-sm font-semibold text-neutral-900">Últimos Contratos (PNCP)</p>
              </div>
              <div className="divide-y divide-neutral-50">
                {r.ultimosContratos.map((c, i) => (
                  <div key={i} className="px-5 py-3 flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-mono text-neutral-500">{c.numero}</p>
                      <p className="text-xs text-neutral-700 truncate mt-0.5">{c.objeto || '—'}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-semibold text-neutral-900">{formatBRL(c.valor)}</p>
                      <p className="text-[10px] text-neutral-400">{formatDate(c.data)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty contracts */}
          {r.ultimosContratos.length === 0 && (
            <div className="bg-white rounded-lg border border-neutral-200 p-8 text-center">
              <Clock className="w-8 h-8 text-neutral-200 mx-auto mb-2" />
              <p className="text-sm text-neutral-500">Nenhum contrato encontrado no PNCP para este CNPJ</p>
              <p className="text-xs text-neutral-400 mt-1">
                O órgão pode não ter contratos registrados no PNCP ou o CNPJ pode ser de uma subunidade
              </p>
              <a
                href={`https://pncp.gov.br/app/editais?cnpj=${r.cnpj}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 mt-3 text-xs font-medium text-[#06B6D4] hover:text-[#0891B2]"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Verificar no PNCP
              </a>
            </div>
          )}

          {r.cached && (
            <p className="text-[10px] text-neutral-400 text-center">
              Dados em cache · Atualizado em {new Date(r.timestamp).toLocaleString('pt-BR')} · Cache válido por 24h
            </p>
          )}
        </div>
      )}
    </div>
  );
}
