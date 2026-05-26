"use client";

import { useState } from "react";
import { Sparkles, Search, TrendingUp, AlertTriangle, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface AnaliseResult {
  produto: string;
  quantidade: number;
  precoMediano: number;
  precoMin: number;
  precoMax: number;
  precoSugerido: number;
  totalSugerido: number;
  confianca: 'alta' | 'media' | 'baixa';
  amostras: number;
  referencias: Array<{ descricao: string; orgao: string; valorUnitario: number; data: string }>;
  timestamp: string;
}

const CONFIANCA_CONFIG = {
  alta:  { label: 'Alta confiança',  color: 'text-green-700 bg-green-50 border-green-200' },
  media: { label: 'Média confiança', color: 'text-yellow-700 bg-yellow-50 border-yellow-200' },
  baixa: { label: 'Baixa confiança', color: 'text-red-700 bg-red-50 border-red-200' },
};

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatData(d: string) {
  if (!d) return '';
  try {
    return new Date(d).toLocaleDateString('pt-BR');
  } catch { return d.slice(0, 10); }
}

const SUGESTOES = [
  'seringa descartável', 'cateter venoso', 'luva cirúrgica',
  'curativo', 'sonda vesical', 'material de sutura',
  'equipamento de proteção individual', 'kit de intubação',
];

export default function PrecoVencedorPage() {
  const [produto, setProduto] = useState('');
  const [quantidade, setQuantidade] = useState('1');
  const [unidade, setUnidade] = useState('unidade');
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<AnaliseResult | null>(null);
  const [showRefs, setShowRefs] = useState(false);
  const [precoCustom, setPrecoCustom] = useState('');

  async function analisar() {
    if (!produto.trim()) { toast.error('Digite o nome do produto'); return; }
    setLoading(true);
    setResultado(null);
    try {
      const res = await fetch('/api/preco-ia/analisar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ produto: produto.trim(), quantidade: Number(quantidade) || 1, unidade }),
      });
      const data = await res.json() as AnaliseResult & { erro?: string };
      if (data.erro) throw new Error(data.erro);
      setResultado(data);
      setPrecoCustom(data.precoSugerido.toFixed(2).replace('.', ','));
      if (data.amostras === 0) toast.info('Nenhuma referência de preço encontrada — use os valores como estimativa');
      else toast.success(`Análise concluída com ${data.amostras} referências do PNCP`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro na análise');
    } finally {
      setLoading(false);
    }
  }

  const precoCustomNum = parseFloat(precoCustom.replace(',', '.')) || 0;
  const totalCustom = precoCustomNum * (Number(quantidade) || 1);
  const variacaoCustom = resultado ? ((precoCustomNum - resultado.precoMediano) / resultado.precoMediano) * 100 : 0;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2.5 mb-1">
          <Sparkles className="w-5 h-5 text-[#06B6D4]" />
          <h1 className="text-xl font-semibold text-neutral-900">Calculadora de Preço IA</h1>
        </div>
        <p className="text-sm text-neutral-500">
          Monte o melhor preço para ganhar licitações com base em referências reais do PNCP
        </p>
      </div>

      {/* Input */}
      <div className="bg-white rounded-lg border border-neutral-200 shadow-sm p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2">
            <label className="text-xs font-medium text-neutral-600 mb-1.5 block">Nome do produto / item</label>
            <Input
              value={produto}
              onChange={e => setProduto(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && analisar()}
              placeholder="Ex: cateter venoso central, luva cirúrgica..."
            />
          </div>
          <div>
            <label className="text-xs font-medium text-neutral-600 mb-1.5 block">Quantidade</label>
            <div className="flex gap-2">
              <Input
                type="number"
                min="1"
                value={quantidade}
                onChange={e => setQuantidade(e.target.value)}
                className="w-24"
              />
              <Input
                value={unidade}
                onChange={e => setUnidade(e.target.value)}
                placeholder="unidade"
                className="flex-1"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {SUGESTOES.map(s => (
            <button
              key={s}
              onClick={() => setProduto(s)}
              className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600 hover:bg-[#ECFEFF] hover:text-[#06B6D4] border border-neutral-200 transition-colors"
            >
              {s}
            </button>
          ))}
        </div>

        <Button onClick={analisar} disabled={loading} className="gap-2">
          {loading
            ? <><RefreshCw className="w-4 h-4 animate-spin" />Analisando PNCP...</>
            : <><Search className="w-4 h-4" />Analisar Preço</>
          }
        </Button>
      </div>

      {/* Result */}
      {resultado && (
        <div className="space-y-4">
          {/* Confiança */}
          <div className="flex items-center gap-3">
            <span className={cn(
              'text-xs font-semibold px-3 py-1 rounded-full border',
              CONFIANCA_CONFIG[resultado.confianca].color
            )}>
              {CONFIANCA_CONFIG[resultado.confianca].label}
            </span>
            <span className="text-xs text-neutral-400">
              {resultado.amostras} referência{resultado.amostras !== 1 ? 's' : ''} do PNCP
            </span>
          </div>

          {/* Price cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white rounded-lg border border-neutral-200 p-4">
              <p className="text-[10px] text-neutral-400 mb-1">Preço mínimo</p>
              <p className="text-sm font-bold text-neutral-800">{fmt(resultado.precoMin)}</p>
            </div>
            <div className="bg-white rounded-lg border border-[#06B6D4]/30 shadow-sm p-4">
              <p className="text-[10px] text-neutral-400 mb-1">Mediana</p>
              <p className="text-sm font-bold text-[#06B6D4]">{fmt(resultado.precoMediano)}</p>
            </div>
            <div className="bg-white rounded-lg border border-neutral-200 p-4">
              <p className="text-[10px] text-neutral-400 mb-1">Preço máximo</p>
              <p className="text-sm font-bold text-neutral-800">{fmt(resultado.precoMax)}</p>
            </div>
            <div className="bg-[#ECFEFF] rounded-lg border border-[#06B6D4]/30 p-4">
              <p className="text-[10px] text-[#0891B2] mb-1 font-medium">Sugerido pela IA</p>
              <p className="text-sm font-bold text-[#06B6D4]">{fmt(resultado.precoSugerido)}</p>
              <p className="text-[10px] text-neutral-400">−3% da mediana</p>
            </div>
          </div>

          {/* Simulador */}
          <div className="bg-white rounded-lg border border-neutral-200 p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-[#06B6D4]" />
              <h3 className="text-sm font-semibold text-neutral-900">Simulador de proposta</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <label className="text-xs font-medium text-neutral-600 mb-1.5 block">
                  Seu preço unitário (R$)
                </label>
                <Input
                  value={precoCustom}
                  onChange={e => setPrecoCustom(e.target.value)}
                  placeholder="0,00"
                />
              </div>
              <div className="bg-neutral-50 rounded-lg p-3">
                <p className="text-[10px] text-neutral-400 mb-0.5">Total da proposta</p>
                <p className="text-base font-bold text-neutral-900">{fmt(totalCustom)}</p>
                <p className="text-[10px] text-neutral-400">{quantidade} × {fmt(precoCustomNum)}</p>
              </div>
              <div className={cn(
                'rounded-lg p-3',
                variacaoCustom < -10 ? 'bg-yellow-50' : variacaoCustom > 10 ? 'bg-red-50' : 'bg-green-50'
              )}>
                <p className="text-[10px] text-neutral-400 mb-0.5">vs. mediana do mercado</p>
                <p className={cn(
                  'text-base font-bold',
                  variacaoCustom < -10 ? 'text-yellow-700' : variacaoCustom > 10 ? 'text-red-700' : 'text-green-700'
                )}>
                  {variacaoCustom > 0 ? '+' : ''}{variacaoCustom.toFixed(1)}%
                </p>
                <p className="text-[10px] text-neutral-400">
                  {variacaoCustom < -10 ? 'Muito abaixo — risco de inexequibilidade' :
                   variacaoCustom > 10 ? 'Acima da mediana — risco de perder' :
                   'Faixa competitiva'}
                </p>
              </div>
            </div>
          </div>

          {/* Referências */}
          {resultado.referencias.length > 0 && (
            <div className="bg-white rounded-lg border border-neutral-200">
              <button
                onClick={() => setShowRefs(!showRefs)}
                className="flex items-center justify-between w-full px-5 py-3 text-sm font-medium text-neutral-700"
              >
                <span>Referências do PNCP ({resultado.referencias.length})</span>
                {showRefs ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {showRefs && (
                <div className="border-t border-neutral-100">
                  {resultado.referencias.map((ref, i) => (
                    <div key={i} className="flex items-start gap-3 px-5 py-3 border-b border-neutral-50 last:border-0">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-neutral-700 line-clamp-1">{ref.descricao}</p>
                        <p className="text-[10px] text-neutral-400 mt-0.5">{ref.orgao}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs font-bold text-neutral-900">{fmt(ref.valorUnitario)}</p>
                        {ref.data && <p className="text-[10px] text-neutral-400">{formatData(ref.data)}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {resultado.amostras === 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-yellow-800">Sem referências encontradas no PNCP</p>
                <p className="text-xs text-yellow-600 mt-0.5">
                  Tente termos mais genéricos ou consulte o banco de preços CONAB/CEIS manualmente.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
