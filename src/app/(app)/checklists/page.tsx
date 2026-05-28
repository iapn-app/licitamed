"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  ClipboardList, RefreshCw, ChevronDown, ChevronRight,
  AlertTriangle, CheckCircle2, Clock, XCircle, ExternalLink,
  TrendingUp, Sparkles, FileText, Plus, Trash2, Loader2,
  Users, MessageCircle, Mail,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/shared/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChecklistRow {
  id: string;
  licitacao_id: string;
  orgao: string | null;
  objeto: string | null;
  status: string;
  progresso: number;
  criado_em: string;
  atualizado_em: string;
  totalItens: number;
  itensCriticos: number;
}

interface ChecklistItem {
  id: string;
  checklist_id: string;
  categoria: string;
  item: string;
  descricao: string | null;
  status: string;
  valor_extraido: string | null;
  prazo: string | null;
  obrigatorio: boolean;
  observacao: string | null;
  ordem: number | null;
}

interface FornecedorInterno {
  fornecedor_id: string;
  nome_empresa: string;
  whatsapp: string | null;
  email: string | null;
  nome_contato: string | null;
  produto_match: string;
}

interface ChecklistDetail extends ChecklistRow {
  itens: ChecklistItem[];
  categorias: Record<string, ChecklistItem[]>;
  fornecedoresInternos?: FornecedorInterno[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}

function prazoRestante(prazo: string): { texto: string; urgente: boolean } {
  const diff = Math.ceil((new Date(prazo).getTime() - Date.now()) / 86400000);
  if (diff < 0) return { texto: `${Math.abs(diff)}d atrás`, urgente: true };
  if (diff === 0) return { texto: "Hoje!", urgente: true };
  if (diff <= 3) return { texto: `${diff}d`, urgente: true };
  return { texto: `${diff}d`, urgente: false };
}

const STATUS_CFG: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string; label: string }> = {
  ok:       { icon: CheckCircle2, color: "text-green-500",  label: "Concluído" },
  atencao:  { icon: AlertTriangle, color: "text-orange-500", label: "Atenção" },
  critico:  { icon: XCircle,      color: "text-red-500",    label: "Crítico" },
  pendente: { icon: Clock,        color: "text-neutral-400", label: "Pendente" },
};

const CHECKLIST_STATUS: Record<string, { label: string; badge: string }> = {
  pronto:       { label: "Pronto para participar", badge: "bg-green-50 text-green-700 border-green-200" },
  em_andamento: { label: "Em andamento",           badge: "bg-blue-50 text-blue-700 border-blue-200" },
  critico:      { label: "Itens críticos",          badge: "bg-red-50 text-red-700 border-red-200" },
  pendente:     { label: "Pendente",                badge: "bg-neutral-100 text-neutral-600 border-neutral-300" },
};

// ─── Item row ─────────────────────────────────────────────────────────────────

function ItemRow({ item, onUpdate }: { item: ChecklistItem; onUpdate: (id: string, status: string) => void }) {
  const [obs, setObs] = useState(item.observacao ?? "");
  const [saving, setSaving] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cfg = STATUS_CFG[item.status] ?? STATUS_CFG.pendente!;
  const Icon = cfg.icon;

  function toggleOk() {
    const next = item.status === "ok" ? "pendente" : "ok";
    onUpdate(item.id, next);
  }

  function saveObs(val: string) {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      setSaving(true);
      await fetch(`/api/checklist-itens/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ observacao: val }),
      });
      setSaving(false);
    }, 800);
  }

  return (
    <div className={cn(
      "px-4 py-3 border-b border-neutral-50 last:border-0",
      item.status === "critico" && "bg-red-50/40",
      item.status === "atencao" && "bg-orange-50/30",
    )}>
      <div className="flex items-start gap-3">
        <button
          onClick={toggleOk}
          className={cn(
            "mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors",
            item.status === "ok"
              ? "bg-green-500 border-green-500"
              : "border-neutral-300 hover:border-[#06B6D4]"
          )}
        >
          {item.status === "ok" && <CheckCircle2 className="w-3 h-3 text-white" />}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 flex-wrap">
            <p className={cn(
              "text-sm font-medium",
              item.status === "ok" ? "line-through text-neutral-400" : "text-neutral-800"
            )}>
              {item.item}
              {!item.obrigatorio && (
                <span className="ml-1.5 text-[10px] font-normal text-neutral-400">(opcional)</span>
              )}
            </p>
            <Icon className={cn("w-3.5 h-3.5 flex-shrink-0 mt-0.5", cfg.color)} />
          </div>

          {item.descricao && (
            <p className="text-xs text-neutral-500 mt-0.5 leading-relaxed">{item.descricao}</p>
          )}

          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            {item.valor_extraido && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-medium">
                {item.valor_extraido}
              </span>
            )}
            {item.prazo && (() => {
              const { texto, urgente } = prazoRestante(item.prazo);
              return (
                <span className={cn(
                  "text-[10px] px-2 py-0.5 rounded-full border font-medium",
                  urgente
                    ? "bg-red-50 text-red-700 border-red-200"
                    : "bg-orange-50 text-orange-700 border-orange-200"
                )}>
                  ⏱ {formatDate(item.prazo)} ({texto})
                </span>
              );
            })()}
          </div>

          <input
            type="text"
            value={obs}
            placeholder="Adicionar observação..."
            onChange={e => { setObs(e.target.value); saveObs(e.target.value); }}
            className="mt-2 w-full text-[11px] px-2 py-1 rounded border border-neutral-200 bg-white text-neutral-600 placeholder:text-neutral-300 focus:outline-none focus:border-[#06B6D4]"
          />
          {saving && <p className="text-[10px] text-neutral-300 mt-0.5">Salvando...</p>}
        </div>
      </div>
    </div>
  );
}

// ─── Category accordion ────────────────────────────────────────────────────────

function CategoriaAccordion({ categoria, itens, onUpdate }: {
  categoria: string;
  itens: ChecklistItem[];
  onUpdate: (id: string, status: string) => void;
}) {
  const [open, setOpen] = useState(true);
  const concluidos = itens.filter(i => i.status === "ok").length;
  const criticos = itens.filter(i => i.status === "critico").length;
  const atencao = itens.filter(i => i.status === "atencao").length;

  return (
    <div className="rounded-lg border border-neutral-200 overflow-hidden mb-3">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-neutral-50 hover:bg-neutral-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          {open ? <ChevronDown className="w-4 h-4 text-neutral-400" /> : <ChevronRight className="w-4 h-4 text-neutral-400" />}
          <span className="text-sm font-semibold text-neutral-800">{categoria}</span>
          {criticos > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 font-bold">{criticos} crítico{criticos > 1 ? "s" : ""}</span>
          )}
          {atencao > 0 && !criticos && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700 font-bold">{atencao} atenção</span>
          )}
        </div>
        <span className="text-xs text-neutral-400 shrink-0">{concluidos}/{itens.length}</span>
      </button>

      {open && (
        <div className="bg-white">
          {itens.map(item => (
            <ItemRow key={item.id} item={item} onUpdate={onUpdate} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Cotação modal ─────────────────────────────────────────────────────────────

interface ItemRow {
  descricao: string;
  apresentacao: string;
  unidade: string;
  quantidade: string;
  marca: string;
  valorUnitario: string;
}

const emptyItem = (): ItemRow => ({ descricao: '', apresentacao: '', unidade: 'UN', quantidade: '', marca: '', valorUnitario: '' });

function CotacaoModal({ checklistId, orgao, onClose }: { checklistId: string; orgao: string; onClose: () => void }) {
  const [condicoesPgto, setCondicoesPgto] = useState('30/60/90 dias');
  const [frete, setFrete] = useState('CIF');
  const [validade, setValidade] = useState('15 dias úteis');
  const [itens, setItens] = useState<ItemRow[]>([emptyItem(), emptyItem(), emptyItem()]);
  const [gerando, setGerando] = useState(false);

  function addRow() { setItens(prev => [...prev, emptyItem()]); }
  function removeRow(i: number) { setItens(prev => prev.filter((_, idx) => idx !== i)); }
  function updateRow(i: number, field: keyof ItemRow, val: string) {
    setItens(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: val } : r));
  }

  async function handleGerar() {
    setGerando(true);
    try {
      const payload = {
        checklistId,
        condicoesPgto,
        frete,
        validade,
        itens: itens
          .filter(r => r.descricao.trim())
          .map(r => ({
            descricao: r.descricao,
            apresentacao: r.apresentacao || undefined,
            unidade: r.unidade || undefined,
            quantidade: r.quantidade ? Number(r.quantidade) : undefined,
            marca: r.marca || undefined,
            valorUnitario: r.valorUnitario ? Number(r.valorUnitario.replace(',', '.')) : undefined,
          })),
      };

      const res = await fetch('/api/cotacao/gerar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const numero = res.headers.get('X-Cotacao-Numero') ?? 'cotacao';
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cotacao-${numero}.docx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Cotação ${numero} gerada com sucesso!`);
      onClose();
    } catch (e) {
      toast.error(`Erro ao gerar cotação: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setGerando(false);
    }
  }

  const inputCls = "w-full text-xs px-2 py-1.5 rounded border border-neutral-200 focus:outline-none focus:border-[#06B6D4] bg-white";

  return (
    <div className="space-y-5">
      {/* Info fields */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-[11px] font-medium text-neutral-600 mb-1">Condições de Pagamento</label>
          <input value={condicoesPgto} onChange={e => setCondicoesPgto(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-neutral-600 mb-1">Frete</label>
          <input value={frete} onChange={e => setFrete(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-neutral-600 mb-1">Validade da Proposta</label>
          <input value={validade} onChange={e => setValidade(e.target.value)} className={inputCls} />
        </div>
      </div>

      {/* Items table */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-neutral-700">Itens da Cotação</p>
          <button onClick={addRow} className="flex items-center gap-1 text-[11px] text-[#06B6D4] hover:text-[#0891B2] font-medium">
            <Plus className="w-3.5 h-3.5" /> Adicionar linha
          </button>
        </div>

        <div className="overflow-x-auto rounded border border-neutral-200">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-200">
                {['#', 'Descrição *', 'Apresentação', 'Unid.', 'Quant.', 'Marca', 'Vl.Unit. (R$)', ''].map(h => (
                  <th key={h} className="px-2 py-1.5 text-left font-semibold text-neutral-600 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {itens.map((row, i) => (
                <tr key={i} className="border-b border-neutral-100 last:border-0">
                  <td className="px-2 py-1 text-neutral-400 w-6">{i + 1}</td>
                  <td className="px-1 py-1 min-w-[160px]">
                    <input value={row.descricao} onChange={e => updateRow(i, 'descricao', e.target.value)} className={inputCls} placeholder="Descrição do produto" />
                  </td>
                  <td className="px-1 py-1 min-w-[100px]">
                    <input value={row.apresentacao} onChange={e => updateRow(i, 'apresentacao', e.target.value)} className={inputCls} placeholder="Ex: Cx c/ 100" />
                  </td>
                  <td className="px-1 py-1 w-14">
                    <input value={row.unidade} onChange={e => updateRow(i, 'unidade', e.target.value)} className={inputCls} />
                  </td>
                  <td className="px-1 py-1 w-16">
                    <input type="number" value={row.quantidade} onChange={e => updateRow(i, 'quantidade', e.target.value)} className={inputCls} min="0" />
                  </td>
                  <td className="px-1 py-1 min-w-[90px]">
                    <input value={row.marca} onChange={e => updateRow(i, 'marca', e.target.value)} className={inputCls} placeholder="Marca" />
                  </td>
                  <td className="px-1 py-1 w-24">
                    <input value={row.valorUnitario} onChange={e => updateRow(i, 'valorUnitario', e.target.value)} className={inputCls} placeholder="0,00" />
                  </td>
                  <td className="px-1 py-1 w-6">
                    {itens.length > 1 && (
                      <button onClick={() => removeRow(i)} className="text-neutral-300 hover:text-red-400 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[10px] text-neutral-400 mt-1">Linhas sem descrição são ignoradas.</p>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2 border-t border-neutral-100">
        <Button variant="outline" size="sm" onClick={onClose} disabled={gerando}>Cancelar</Button>
        <Button size="sm" onClick={handleGerar} disabled={gerando} className="gap-2">
          {gerando ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
          {gerando ? 'Gerando...' : 'Gerar e Baixar .docx'}
        </Button>
      </div>
    </div>
  );
}

// ─── Detail dialog ─────────────────────────────────────────────────────────────

function ChecklistDialog({ id }: { id: string }) {
  const [detail, setDetail] = useState<ChecklistDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCotacao, setShowCotacao] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/checklists/${id}`);
    if (res.ok) setDetail(await res.json() as ChecklistDetail);
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function handleUpdate(itemId: string, status: string) {
    await fetch(`/api/checklist-itens/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    // Refresh
    const res = await fetch(`/api/checklists/${id}`);
    if (res.ok) setDetail(await res.json() as ChecklistDetail);
  }

  if (loading) {
    return (
      <div className="space-y-4 py-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-full" />
        {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
      </div>
    );
  }

  if (!detail) return <p className="text-sm text-neutral-500 py-4">Checklist não encontrado</p>;

  const criticos = detail.itens.filter(i => i.status === "critico");
  const statusCfg = CHECKLIST_STATUS[detail.status] ?? CHECKLIST_STATUS.pendente!;
  const concluidos = detail.itens.filter(i => i.status === "ok" && i.obrigatorio).length;
  const obrigatorios = detail.itens.filter(i => i.obrigatorio).length;

  return (
    <div className="space-y-4">
      {/* Header info */}
      <div className="bg-neutral-50 rounded-md p-4">
        <p className="text-sm font-semibold text-neutral-900 mb-0.5">{detail.orgao ?? "—"}</p>
        <p className="text-xs text-neutral-500 line-clamp-2">{detail.objeto ?? "—"}</p>
        <div className="flex items-center gap-3 mt-3">
          <Progress value={detail.progresso} className="flex-1 h-2" />
          <span className="text-xs font-semibold text-neutral-700 shrink-0">{concluidos}/{obrigatorios} obrigatórios</span>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full border", statusCfg.badge)}>
            {statusCfg.label}
          </span>
          <span className="text-[10px] text-neutral-400">{detail.progresso}% concluído</span>
        </div>
      </div>

      {/* Critical alerts */}
      {criticos.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <p className="text-xs font-bold text-red-700">{criticos.length} item{criticos.length > 1 ? "s" : ""} crítico{criticos.length > 1 ? "s" : ""} — ação imediata necessária</p>
          </div>
          {criticos.map(c => (
            <p key={c.id} className="text-xs text-red-600 ml-6">• {c.item}{c.valor_extraido ? `: ${c.valor_extraido}` : ""}</p>
          ))}
        </div>
      )}

      {/* Fornecedores internos */}
      {(detail.fornecedoresInternos ?? []).length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-md p-3">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-green-600" />
            <p className="text-xs font-bold text-green-700">
              {detail.fornecedoresInternos!.length} fornecedor{detail.fornecedoresInternos!.length > 1 ? 'es' : ''} da sua carteira para este edital
            </p>
          </div>
          <div className="space-y-1.5">
            {detail.fornecedoresInternos!.map(f => (
              <div key={f.fornecedor_id} className="flex items-center gap-3 bg-white rounded px-3 py-2 border border-green-100">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-neutral-800">{f.nome_empresa}</p>
                  <p className="text-[10px] text-neutral-500 truncate">Produto: {f.produto_match}</p>
                </div>
                {f.whatsapp && (
                  <a
                    href={`https://wa.me/${f.whatsapp.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[11px] text-green-600 hover:text-green-700 font-medium flex-shrink-0"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    WhatsApp
                  </a>
                )}
                {f.email && (
                  <a
                    href={`mailto:${f.email}`}
                    className="text-[11px] text-blue-600 hover:text-blue-700 flex-shrink-0"
                    title={f.email}
                  >
                    <Mail className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Categories */}
      <div>
        {Object.entries(detail.categorias).map(([cat, itens]) => (
          <CategoriaAccordion key={cat} categoria={cat} itens={itens} onUpdate={handleUpdate} />
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-1">
        <p className="text-[10px] text-neutral-400">
          Criado em {formatDate(detail.criado_em)} · Auto-salvo
        </p>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowCotacao(true)}
          className="gap-1.5 text-xs"
        >
          <FileText className="w-3.5 h-3.5" />
          Gerar Cotação
        </Button>
      </div>

      {/* Cotação modal */}
      {showCotacao && (
        <Dialog open onOpenChange={open => !open && setShowCotacao(false)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#06B6D4]" />
                Gerar Cotação de Preços
              </DialogTitle>
            </DialogHeader>
            <CotacaoModal
              checklistId={id}
              orgao={detail.orgao ?? ''}
              onClose={() => setShowCotacao(false)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ChecklistsPage() {
  const [checklists, setChecklists] = useState<ChecklistRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/checklists");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setChecklists(await res.json() as ChecklistRow[]);
      setLoaded(true);
    } catch (e) {
      toast.error(`Erro ao carregar: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const stats = {
    total: checklists.length,
    criticos: checklists.filter(c => c.itensCriticos > 0).length,
    prontos: checklists.filter(c => c.status === "pronto").length,
    mediaProgresso: checklists.length > 0
      ? Math.round(checklists.reduce((s, c) => s + c.progresso, 0) / checklists.length)
      : 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <ClipboardList className="w-5 h-5 text-[#06B6D4]" />
            <h1 className="text-xl font-semibold text-neutral-900">Checklists Inteligentes</h1>
          </div>
          <p className="text-sm text-neutral-500">
            Gerados automaticamente com IA ao importar licitações do Monitor
          </p>
        </div>
        <Button onClick={load} disabled={loading} variant="outline" className="gap-2">
          <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          Atualizar
        </Button>
      </div>

      {/* Stats */}
      {loaded && (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            { label: "Total de checklists", value: String(stats.total), icon: ClipboardList, color: "bg-blue-50", ic: "text-blue-500" },
            { label: "Com itens críticos", value: String(stats.criticos), icon: AlertTriangle, color: "bg-red-50", ic: "text-red-500" },
            { label: "Prontos para participar", value: String(stats.prontos), icon: CheckCircle2, color: "bg-green-50", ic: "text-green-500" },
            { label: "Progresso médio", value: `${stats.mediaProgresso}%`, icon: TrendingUp, color: "bg-purple-50", ic: "text-purple-500" },
          ].map(({ label, value, icon: Icon, color, ic }) => (
            <div key={label} className="bg-white rounded-lg border border-neutral-200 p-4">
              <div className={cn("w-8 h-8 rounded-md flex items-center justify-center mb-2", color)}>
                <Icon className={cn("w-4 h-4", ic)} />
              </div>
              <p className="text-xl font-bold text-neutral-900">{value}</p>
              <p className="text-xs text-neutral-400">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* List */}
      <div className="bg-white rounded-lg border border-neutral-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-neutral-100 flex items-center justify-between">
          <p className="text-sm font-semibold text-neutral-900">
            {loaded ? `${checklists.length} checklist${checklists.length !== 1 ? "s" : ""}` : "Checklists"}
          </p>
          <Link
            href="/monitor"
            className="flex items-center gap-1.5 text-xs font-medium text-[#06B6D4] hover:text-[#0891B2]"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Importar do Monitor
          </Link>
        </div>

        {loading && (
          <div className="p-5 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
          </div>
        )}

        {!loading && loaded && checklists.length === 0 && (
          <div className="flex flex-col items-center py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-[#ECFEFF] flex items-center justify-center mb-4">
              <ClipboardList className="w-6 h-6 text-[#06B6D4]" />
            </div>
            <p className="text-sm font-semibold text-neutral-800 mb-1">Nenhum checklist gerado</p>
            <p className="text-xs text-neutral-400 max-w-xs mb-4">
              Importe uma licitação do Monitor para gerar automaticamente um checklist completo com IA
            </p>
            <Link href="/monitor">
              <Button size="sm" className="gap-2">
                <ExternalLink className="w-4 h-4" />
                Ir para o Monitor
              </Button>
            </Link>
          </div>
        )}

        {!loading && checklists.length > 0 && (
          <div className="divide-y divide-neutral-50">
            {checklists.map(c => {
              const statusCfg = CHECKLIST_STATUS[c.status] ?? CHECKLIST_STATUS.pendente!;
              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedId(c.id)}
                  className="px-5 py-4 hover:bg-neutral-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="text-sm font-semibold text-neutral-900 truncate max-w-[300px]">
                          {c.orgao ?? "Órgão não informado"}
                        </p>
                        <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-full border", statusCfg.badge)}>
                          {statusCfg.label}
                        </span>
                        {c.itensCriticos > 0 && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-700">
                            ⚠️ {c.itensCriticos} crítico{c.itensCriticos > 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-neutral-500 line-clamp-1">{c.objeto ?? "—"}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <Progress value={c.progresso} className="flex-1 h-1.5" />
                        <span className="text-xs text-neutral-500 shrink-0">{c.progresso}%</span>
                        <span className="text-[10px] text-neutral-400 shrink-0">{c.totalItens} itens</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[10px] text-neutral-400">{formatDate(c.criado_em)}</p>
                      <ChevronRight className="w-4 h-4 text-neutral-300 mt-2 ml-auto" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail dialog */}
      <Dialog open={!!selectedId} onOpenChange={open => !open && setSelectedId(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-[#06B6D4]" />
              Checklist de Participação
            </DialogTitle>
          </DialogHeader>
          {selectedId && (
            <ChecklistDialog id={selectedId} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
