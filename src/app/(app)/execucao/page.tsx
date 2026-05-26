"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ClipboardCheck, Plus, RefreshCw, X, Pencil, Trash2,
  DollarSign, CheckCircle2, Clock, AlertTriangle, Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Entrega {
  id: string;
  descricao: string;
  quantidade: number;
  unidade: string;
  data_prevista: string | null;
  data_realizada: string | null;
  status: string;
  nota_fiscal: string | null;
  valor_item: number | null;
}

interface Contrato {
  id: string;
  numero_contrato: string | null;
  orgao: string;
  objeto: string;
  valor_total: number;
  data_assinatura: string | null;
  data_inicio: string | null;
  data_fim: string | null;
  status: string;
  valor_pago: number;
  empenho_numero: string | null;
  observacoes: string | null;
  contratos_entregas: Entrega[];
}

const STATUS_CONTRATO: Record<string, { label: string; color: string }> = {
  em_execucao: { label: 'Em execução',  color: 'bg-blue-50 text-blue-700 border-blue-200' },
  concluido:   { label: 'Concluído',    color: 'bg-green-50 text-green-700 border-green-200' },
  suspenso:    { label: 'Suspenso',     color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  rescindido:  { label: 'Rescindido',   color: 'bg-red-50 text-red-700 border-red-200' },
};

const STATUS_ENTREGA: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pendente: { label: 'Pendente', color: 'text-neutral-500', icon: Clock },
  entregue: { label: 'Entregue', color: 'text-green-600', icon: CheckCircle2 },
  parcial:  { label: 'Parcial',  color: 'text-yellow-600', icon: Package },
  atrasado: { label: 'Atrasado', color: 'text-red-600',    icon: AlertTriangle },
};

function fmt(v: number) { return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
function fmtDate(d: string | null) {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('pt-BR'); } catch { return d; }
}

interface ContratoForm {
  numero_contrato: string; orgao: string; objeto: string; valor_total: string;
  data_assinatura: string; data_inicio: string; data_fim: string;
  status: string; empenho_numero: string; observacoes: string;
}

const EMPTY_FORM: ContratoForm = {
  numero_contrato: '', orgao: '', objeto: '', valor_total: '',
  data_assinatura: '', data_inicio: '', data_fim: '',
  status: 'em_execucao', empenho_numero: '', observacoes: '',
};

export default function ExecucaoPage() {
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Contrato | null>(null);
  const [form, setForm] = useState<ContratoForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/execucao');
      const data = await res.json() as { contratos?: Contrato[]; erro?: string };
      if (data.erro) throw new Error(data.erro);
      setContratos(data.contratos ?? []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao carregar contratos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  function openNew() { setEditing(null); setForm(EMPTY_FORM); setShowModal(true); }
  function openEdit(c: Contrato) {
    setEditing(c);
    setForm({
      numero_contrato: c.numero_contrato ?? '',
      orgao: c.orgao, objeto: c.objeto,
      valor_total: String(c.valor_total),
      data_assinatura: c.data_assinatura?.slice(0, 10) ?? '',
      data_inicio: c.data_inicio?.slice(0, 10) ?? '',
      data_fim: c.data_fim?.slice(0, 10) ?? '',
      status: c.status,
      empenho_numero: c.empenho_numero ?? '',
      observacoes: c.observacoes ?? '',
    });
    setShowModal(true);
  }

  async function save() {
    if (!form.orgao.trim() || !form.objeto.trim() || !form.valor_total) {
      toast.error('Órgão, objeto e valor são obrigatórios'); return;
    }
    setSaving(true);
    try {
      const payload = {
        numero_contrato: form.numero_contrato.trim() || null,
        orgao: form.orgao.trim(),
        objeto: form.objeto.trim(),
        valor_total: parseFloat(form.valor_total.replace(',', '.')) || 0,
        data_assinatura: form.data_assinatura || null,
        data_inicio: form.data_inicio || null,
        data_fim: form.data_fim || null,
        status: form.status,
        empenho_numero: form.empenho_numero.trim() || null,
        observacoes: form.observacoes.trim() || null,
      };
      const url = editing ? `/api/execucao/${editing.id}` : '/api/execucao';
      const method = editing ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json() as { erro?: string };
      if (data.erro) throw new Error(data.erro);
      toast.success(editing ? 'Contrato atualizado' : 'Contrato adicionado');
      setShowModal(false);
      void load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao salvar');
    } finally { setSaving(false); }
  }

  async function remove(c: Contrato) {
    if (!confirm(`Excluir contrato com ${c.orgao}?`)) return;
    const res = await fetch(`/api/execucao/${c.id}`, { method: 'DELETE' });
    const data = await res.json() as { erro?: string };
    if (data.erro) { toast.error(data.erro); return; }
    toast.success('Contrato excluído');
    void load();
  }

  const totalContratos = contratos.length;
  const totalValor = contratos.reduce((s, c) => s + c.valor_total, 0);
  const totalPago = contratos.reduce((s, c) => s + (c.valor_pago ?? 0), 0);
  const emExecucao = contratos.filter(c => c.status === 'em_execucao').length;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <ClipboardCheck className="w-5 h-5 text-[#06B6D4]" />
            <h1 className="text-xl font-semibold text-neutral-900">Execução de Contratos</h1>
          </div>
          <p className="text-sm text-neutral-500">Controle pós-vitória — do empenho ao pagamento</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load} className="gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" />Atualizar
          </Button>
          <Button size="sm" onClick={openNew} className="gap-1.5">
            <Plus className="w-3.5 h-3.5" />Novo contrato
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total contratos', value: String(totalContratos), icon: ClipboardCheck, color: 'bg-blue-50 text-blue-600' },
          { label: 'Em execução',     value: String(emExecucao),     icon: Clock,          color: 'bg-yellow-50 text-yellow-600' },
          { label: 'Valor total',     value: fmt(totalValor),        icon: DollarSign,     color: 'bg-green-50 text-green-600' },
          { label: 'Total pago',      value: fmt(totalPago),         icon: CheckCircle2,   color: 'bg-cyan-50 text-[#06B6D4]' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-lg border border-neutral-200 p-4">
            <div className={cn('w-8 h-8 rounded-md flex items-center justify-center mb-3', color)}>
              <Icon className="w-4 h-4" />
            </div>
            <p className="text-xs text-neutral-400 mb-0.5">{label}</p>
            <p className="text-base font-bold text-neutral-900 truncate">{value}</p>
          </div>
        ))}
      </div>

      {loading && (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 bg-neutral-100 rounded-lg animate-pulse" />
        ))}</div>
      )}

      {!loading && contratos.length === 0 && (
        <div className="bg-white rounded-lg border border-neutral-200 p-12 text-center">
          <ClipboardCheck className="w-10 h-10 text-neutral-200 mx-auto mb-3" />
          <p className="text-sm text-neutral-500 mb-1">Nenhum contrato em execução</p>
          <p className="text-xs text-neutral-400 mb-4">Execute a migration <code className="bg-neutral-100 px-1 rounded">004_contratos_execucao.sql</code> no Supabase para habilitar</p>
          <Button size="sm" onClick={openNew} className="gap-1.5">
            <Plus className="w-3.5 h-3.5" />Adicionar primeiro contrato
          </Button>
        </div>
      )}

      {!loading && contratos.map(c => {
        const cfg = STATUS_CONTRATO[c.status] ?? STATUS_CONTRATO.em_execucao;
        const pctPago = c.valor_total > 0 ? Math.min(100, (c.valor_pago / c.valor_total) * 100) : 0;
        const isExpanded = expanded === c.id;
        return (
          <div key={c.id} className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
            <div className="px-5 py-4">
              <div className="flex items-start gap-3 justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    {c.numero_contrato && (
                      <span className="text-[10px] font-mono text-neutral-400">#{c.numero_contrato}</span>
                    )}
                    <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full border', cfg.color)}>
                      {cfg.label}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-neutral-900">{c.orgao}</p>
                  <p className="text-xs text-neutral-500 mt-0.5 line-clamp-1">{c.objeto}</p>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => openEdit(c)} className="p-1.5 text-neutral-400 hover:text-[#06B6D4] rounded">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => remove(c)} className="p-1.5 text-neutral-400 hover:text-red-500 rounded">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-3">
                <div>
                  <p className="text-[10px] text-neutral-400">Valor contrato</p>
                  <p className="text-sm font-bold text-neutral-900">{fmt(c.valor_total)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-neutral-400">Valor pago</p>
                  <p className="text-sm font-bold text-green-600">{fmt(c.valor_pago ?? 0)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-neutral-400">Vigência</p>
                  <p className="text-xs text-neutral-600">{fmtDate(c.data_inicio)} — {fmtDate(c.data_fim)}</p>
                </div>
              </div>
              {/* Progress bar */}
              <div className="mt-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-neutral-400">Pagamento</span>
                  <span className="text-[10px] text-neutral-600 font-medium">{pctPago.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-neutral-100 rounded-full h-1.5">
                  <div className="bg-[#06B6D4] h-1.5 rounded-full" style={{ width: `${pctPago}%` }} />
                </div>
              </div>
              {c.contratos_entregas?.length > 0 && (
                <button
                  onClick={() => setExpanded(isExpanded ? null : c.id)}
                  className="mt-3 text-[10px] font-medium text-[#06B6D4] hover:text-[#0891B2]"
                >
                  {isExpanded ? 'Ocultar' : 'Ver'} {c.contratos_entregas.length} entrega{c.contratos_entregas.length > 1 ? 's' : ''}
                </button>
              )}
            </div>
            {isExpanded && c.contratos_entregas?.length > 0 && (
              <div className="border-t border-neutral-100 bg-neutral-50/50">
                {c.contratos_entregas.map(e => {
                  const ecfg = STATUS_ENTREGA[e.status] ?? STATUS_ENTREGA.pendente;
                  const EIcon = ecfg.icon;
                  return (
                    <div key={e.id} className="flex items-center gap-3 px-5 py-2.5 border-b border-neutral-100 last:border-0">
                      <EIcon className={cn('w-3.5 h-3.5 flex-shrink-0', ecfg.color)} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-neutral-700">{e.descricao}</p>
                        <p className="text-[10px] text-neutral-400">{e.quantidade} {e.unidade}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-neutral-500">Previsto: {fmtDate(e.data_prevista)}</p>
                        {e.data_realizada && <p className="text-[10px] text-green-600">Realizado: {fmtDate(e.data_realizada)}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
              <h2 className="text-sm font-semibold">{editing ? 'Editar contrato' : 'Novo contrato'}</h2>
              <button onClick={() => setShowModal(false)}><X className="w-4 h-4 text-neutral-400" /></button>
            </div>
            <div className="px-5 py-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-neutral-600 mb-1 block">Nº Contrato</label>
                  <Input value={form.numero_contrato} onChange={e => setForm(f => ({ ...f, numero_contrato: e.target.value }))} placeholder="2025/001" />
                </div>
                <div>
                  <label className="text-xs font-medium text-neutral-600 mb-1 block">Nº Empenho</label>
                  <Input value={form.empenho_numero} onChange={e => setForm(f => ({ ...f, empenho_numero: e.target.value }))} placeholder="NE 2025001" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-neutral-600 mb-1 block">Órgão contratante *</label>
                <Input value={form.orgao} onChange={e => setForm(f => ({ ...f, orgao: e.target.value }))} placeholder="Hospital Federal dos Servidores" />
              </div>
              <div>
                <label className="text-xs font-medium text-neutral-600 mb-1 block">Objeto *</label>
                <Input value={form.objeto} onChange={e => setForm(f => ({ ...f, objeto: e.target.value }))} placeholder="Fornecimento de material hospitalar..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-neutral-600 mb-1 block">Valor total (R$) *</label>
                  <Input type="number" value={form.valor_total} onChange={e => setForm(f => ({ ...f, valor_total: e.target.value }))} placeholder="0.00" />
                </div>
                <div>
                  <label className="text-xs font-medium text-neutral-600 mb-1 block">Status</label>
                  <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="em_execucao">Em execução</SelectItem>
                      <SelectItem value="concluido">Concluído</SelectItem>
                      <SelectItem value="suspenso">Suspenso</SelectItem>
                      <SelectItem value="rescindido">Rescindido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium text-neutral-600 mb-1 block">Assinatura</label>
                  <Input type="date" value={form.data_assinatura} onChange={e => setForm(f => ({ ...f, data_assinatura: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs font-medium text-neutral-600 mb-1 block">Início</label>
                  <Input type="date" value={form.data_inicio} onChange={e => setForm(f => ({ ...f, data_inicio: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs font-medium text-neutral-600 mb-1 block">Fim</label>
                  <Input type="date" value={form.data_fim} onChange={e => setForm(f => ({ ...f, data_fim: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-neutral-600 mb-1 block">Observações</label>
                <Input value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))} placeholder="Opcional" />
              </div>
            </div>
            <div className="flex justify-end gap-2 px-5 py-4 border-t border-neutral-100">
              <Button variant="outline" size="sm" onClick={() => setShowModal(false)}>Cancelar</Button>
              <Button size="sm" onClick={save} disabled={saving} className="gap-1.5">
                {saving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                {editing ? 'Salvar' : 'Adicionar'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
