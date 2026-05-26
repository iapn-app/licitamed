"use client";

import { useState, useEffect, useCallback } from "react";
import {
  MapPin, Plus, RefreshCw, X, Pencil, Trash2,
  Phone, Mail, DollarSign, Calendar, ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Municipio {
  id: string;
  municipio: string;
  uf: string;
  contato_nome: string | null;
  contato_cargo: string | null;
  contato_email: string | null;
  contato_telefone: string | null;
  etapa: string;
  valor_potencial: number | null;
  proximo_followup: string | null;
  ultima_interacao: string | null;
  observacoes: string | null;
  prioridade: string;
  municipios_interacoes: Array<{ id: string; tipo: string; descricao: string; data_interacao: string }>;
}

const ETAPAS = [
  { id: 'prospectar',  label: 'Prospectar',    color: 'bg-neutral-100 text-neutral-600 border-neutral-200' },
  { id: 'contato',     label: 'Contato feito', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { id: 'proposta',    label: 'Proposta env.', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  { id: 'negociacao',  label: 'Negociação',    color: 'bg-orange-50 text-orange-700 border-orange-200' },
  { id: 'ganho',       label: 'Ganho',         color: 'bg-green-50 text-green-700 border-green-200' },
  { id: 'perdido',     label: 'Perdido',       color: 'bg-red-50 text-red-700 border-red-200' },
];

const PRIORIDADE_CONFIG: Record<string, string> = {
  alta:  'text-red-600',
  media: 'text-yellow-600',
  baixa: 'text-neutral-400',
};

function fmt(v: number) { return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }); }
function fmtDate(d: string | null) {
  if (!d) return '—';
  try { return new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }); } catch { return d; }
}

interface MunicipioForm {
  municipio: string; uf: string; contato_nome: string; contato_cargo: string;
  contato_email: string; contato_telefone: string; etapa: string;
  valor_potencial: string; proximo_followup: string; prioridade: string; observacoes: string;
}

const EMPTY_FORM: MunicipioForm = {
  municipio: '', uf: 'RJ', contato_nome: '', contato_cargo: '',
  contato_email: '', contato_telefone: '', etapa: 'prospectar',
  valor_potencial: '', proximo_followup: '', prioridade: 'media', observacoes: '',
};

const UFS = ['AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO'];

export default function CRMPage() {
  const [municipios, setMunicipios] = useState<Municipio[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Municipio | null>(null);
  const [form, setForm] = useState<MunicipioForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [filtroEtapa, setFiltroEtapa] = useState('todas');
  const [selected, setSelected] = useState<Municipio | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/crm');
      const data = await res.json() as { municipios?: Municipio[]; erro?: string };
      if (data.erro) throw new Error(data.erro);
      setMunicipios(data.municipios ?? []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao carregar CRM');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  function openNew() { setEditing(null); setForm(EMPTY_FORM); setShowModal(true); }
  function openEdit(m: Municipio) {
    setEditing(m);
    setForm({
      municipio: m.municipio, uf: m.uf,
      contato_nome: m.contato_nome ?? '', contato_cargo: m.contato_cargo ?? '',
      contato_email: m.contato_email ?? '', contato_telefone: m.contato_telefone ?? '',
      etapa: m.etapa, valor_potencial: m.valor_potencial ? String(m.valor_potencial) : '',
      proximo_followup: m.proximo_followup?.slice(0, 10) ?? '',
      prioridade: m.prioridade, observacoes: m.observacoes ?? '',
    });
    setShowModal(true);
  }

  async function save() {
    if (!form.municipio.trim() || !form.uf) { toast.error('Município e UF obrigatórios'); return; }
    setSaving(true);
    try {
      const payload = {
        municipio: form.municipio.trim(), uf: form.uf,
        contato_nome: form.contato_nome.trim() || null,
        contato_cargo: form.contato_cargo.trim() || null,
        contato_email: form.contato_email.trim() || null,
        contato_telefone: form.contato_telefone.trim() || null,
        etapa: form.etapa,
        valor_potencial: form.valor_potencial ? parseFloat(form.valor_potencial.replace(',', '.')) : null,
        proximo_followup: form.proximo_followup || null,
        prioridade: form.prioridade,
        observacoes: form.observacoes.trim() || null,
      };
      const url = editing ? `/api/crm/${editing.id}` : '/api/crm';
      const method = editing ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json() as { erro?: string };
      if (data.erro) throw new Error(data.erro);
      toast.success(editing ? 'Atualizado' : 'Município adicionado');
      setShowModal(false);
      void load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao salvar');
    } finally { setSaving(false); }
  }

  async function remove(m: Municipio) {
    if (!confirm(`Excluir ${m.municipio}?`)) return;
    const res = await fetch(`/api/crm/${m.id}`, { method: 'DELETE' });
    const data = await res.json() as { erro?: string };
    if (data.erro) { toast.error(data.erro); return; }
    toast.success('Excluído');
    void load();
  }

  async function moverEtapa(m: Municipio, etapa: string) {
    await fetch(`/api/crm/${m.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ etapa }) });
    void load();
  }

  const filtered = filtroEtapa === 'todas' ? municipios : municipios.filter(m => m.etapa === filtroEtapa);
  const kanbanEtapas = ETAPAS.filter(e => !['ganho', 'perdido'].includes(e.id));

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <MapPin className="w-5 h-5 text-[#06B6D4]" />
            <h1 className="text-xl font-semibold text-neutral-900">CRM Municipal</h1>
          </div>
          <p className="text-sm text-neutral-500">Gestão de relacionamento com secretarias de saúde municipais</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load} className="gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" />Atualizar
          </Button>
          <Button size="sm" onClick={openNew} className="gap-1.5">
            <Plus className="w-3.5 h-3.5" />Adicionar município
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
        {ETAPAS.map(e => {
          const count = municipios.filter(m => m.etapa === e.id).length;
          return (
            <button
              key={e.id}
              onClick={() => setFiltroEtapa(filtroEtapa === e.id ? 'todas' : e.id)}
              className={cn('rounded-lg border px-3 py-2 text-center transition-colors', filtroEtapa === e.id ? e.color : 'bg-white border-neutral-200 hover:bg-neutral-50')}
            >
              <p className="text-lg font-bold text-neutral-900">{count}</p>
              <p className="text-[10px] text-neutral-500">{e.label}</p>
            </button>
          );
        })}
      </div>

      {/* Kanban-style list */}
      {loading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-20 bg-neutral-100 rounded-lg animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-lg border border-neutral-200 p-12 text-center">
          <MapPin className="w-10 h-10 text-neutral-200 mx-auto mb-3" />
          <p className="text-sm text-neutral-500 mb-1">Nenhum município cadastrado</p>
          <p className="text-xs text-neutral-400 mb-4">Execute a migration <code className="bg-neutral-100 px-1 rounded">005_municipios_crm.sql</code> para habilitar</p>
          <Button size="sm" onClick={openNew} className="gap-1.5"><Plus className="w-3.5 h-3.5" />Adicionar</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map(m => {
            const etapaCfg = ETAPAS.find(e => e.id === m.etapa);
            const nextEtapa = kanbanEtapas.find((_, i) => kanbanEtapas[i - 1]?.id === m.etapa);
            return (
              <div key={m.id} className="bg-white rounded-lg border border-neutral-200 p-4 hover:border-[#06B6D4]/30 transition-colors">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className={cn('w-2 h-2 rounded-full inline-block', PRIORIDADE_CONFIG[m.prioridade])} style={{ backgroundColor: 'currentColor' }} />
                      <p className="text-sm font-semibold text-neutral-900">{m.municipio}</p>
                      <span className="text-xs text-neutral-400">/{m.uf}</span>
                    </div>
                    <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded-full border', etapaCfg?.color ?? '')}>
                      {etapaCfg?.label}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => setSelected(m)} className="p-1 text-neutral-300 hover:text-[#06B6D4]">
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => openEdit(m)} className="p-1 text-neutral-300 hover:text-[#06B6D4]">
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button onClick={() => remove(m)} className="p-1 text-neutral-300 hover:text-red-500">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <div className="space-y-1 mt-2">
                  {m.contato_nome && (
                    <p className="text-[10px] text-neutral-500">{m.contato_nome}{m.contato_cargo ? ` — ${m.contato_cargo}` : ''}</p>
                  )}
                  {m.contato_telefone && (
                    <a href={`tel:${m.contato_telefone}`} className="flex items-center gap-1 text-[10px] text-neutral-400 hover:text-[#06B6D4]">
                      <Phone className="w-2.5 h-2.5" />{m.contato_telefone}
                    </a>
                  )}
                  {m.contato_email && (
                    <a href={`mailto:${m.contato_email}`} className="flex items-center gap-1 text-[10px] text-neutral-400 hover:text-[#06B6D4]">
                      <Mail className="w-2.5 h-2.5" />{m.contato_email}
                    </a>
                  )}
                </div>
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-neutral-50">
                  {m.valor_potencial ? (
                    <div className="flex items-center gap-1 text-[10px] text-green-600">
                      <DollarSign className="w-3 h-3" />{fmt(m.valor_potencial)}
                    </div>
                  ) : <span />}
                  {m.proximo_followup && (
                    <div className="flex items-center gap-1 text-[10px] text-neutral-400">
                      <Calendar className="w-3 h-3" />Follow-up: {fmtDate(m.proximo_followup)}
                    </div>
                  )}
                </div>
                {nextEtapa && (
                  <button
                    onClick={() => moverEtapa(m, nextEtapa.id)}
                    className="mt-2 w-full text-[10px] text-[#06B6D4] hover:text-[#0891B2] border border-dashed border-[#06B6D4]/30 rounded py-1 hover:bg-[#ECFEFF] transition-colors"
                  >
                    Mover para: {nextEtapa.label} →
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Detail panel */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-end z-50">
          <div className="bg-white w-full max-w-sm h-full overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
              <div>
                <h2 className="text-sm font-semibold">{selected.municipio}/{selected.uf}</h2>
                <p className="text-[10px] text-neutral-400">{selected.municipios_interacoes?.length ?? 0} interação(ões)</p>
              </div>
              <button onClick={() => setSelected(null)}><X className="w-4 h-4 text-neutral-400" /></button>
            </div>
            <div className="px-5 py-4 space-y-4">
              {selected.observacoes && (
                <p className="text-xs text-neutral-600 bg-neutral-50 rounded-lg p-3">{selected.observacoes}</p>
              )}
              <div>
                <h3 className="text-xs font-semibold text-neutral-700 mb-2">Histórico de interações</h3>
                {(selected.municipios_interacoes ?? []).length === 0 ? (
                  <p className="text-xs text-neutral-400">Nenhuma interação registrada</p>
                ) : (
                  <div className="space-y-2">
                    {[...(selected.municipios_interacoes ?? [])].sort((a, b) => b.data_interacao.localeCompare(a.data_interacao)).map(i => (
                      <div key={i.id} className="border-l-2 border-[#06B6D4]/30 pl-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-medium text-[#06B6D4] uppercase">{i.tipo}</span>
                          <span className="text-[10px] text-neutral-400">{fmtDate(i.data_interacao)}</span>
                        </div>
                        <p className="text-xs text-neutral-700">{i.descricao}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
              <h2 className="text-sm font-semibold">{editing ? 'Editar município' : 'Novo município'}</h2>
              <button onClick={() => setShowModal(false)}><X className="w-4 h-4 text-neutral-400" /></button>
            </div>
            <div className="px-5 py-4 space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="text-xs font-medium text-neutral-600 mb-1 block">Município *</label>
                  <Input value={form.municipio} onChange={e => setForm(f => ({ ...f, municipio: e.target.value }))} placeholder="Ex: Nova Iguaçu" />
                </div>
                <div>
                  <label className="text-xs font-medium text-neutral-600 mb-1 block">UF *</label>
                  <Select value={form.uf} onValueChange={v => setForm(f => ({ ...f, uf: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{UFS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-neutral-600 mb-1 block">Etapa</label>
                  <Select value={form.etapa} onValueChange={v => setForm(f => ({ ...f, etapa: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{ETAPAS.map(e => <SelectItem key={e.id} value={e.id}>{e.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-medium text-neutral-600 mb-1 block">Prioridade</label>
                  <Select value={form.prioridade} onValueChange={v => setForm(f => ({ ...f, prioridade: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="alta">Alta</SelectItem>
                      <SelectItem value="media">Média</SelectItem>
                      <SelectItem value="baixa">Baixa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-neutral-600 mb-1 block">Contato (nome)</label>
                  <Input value={form.contato_nome} onChange={e => setForm(f => ({ ...f, contato_nome: e.target.value }))} placeholder="Dr. João Silva" />
                </div>
                <div>
                  <label className="text-xs font-medium text-neutral-600 mb-1 block">Cargo</label>
                  <Input value={form.contato_cargo} onChange={e => setForm(f => ({ ...f, contato_cargo: e.target.value }))} placeholder="Secretário de Saúde" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-neutral-600 mb-1 block">E-mail</label>
                  <Input type="email" value={form.contato_email} onChange={e => setForm(f => ({ ...f, contato_email: e.target.value }))} placeholder="joao@prefeitura.rj.gov.br" />
                </div>
                <div>
                  <label className="text-xs font-medium text-neutral-600 mb-1 block">Telefone</label>
                  <Input value={form.contato_telefone} onChange={e => setForm(f => ({ ...f, contato_telefone: e.target.value }))} placeholder="(21) 99999-9999" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-neutral-600 mb-1 block">Valor potencial (R$)</label>
                  <Input type="number" value={form.valor_potencial} onChange={e => setForm(f => ({ ...f, valor_potencial: e.target.value }))} placeholder="0" />
                </div>
                <div>
                  <label className="text-xs font-medium text-neutral-600 mb-1 block">Próximo follow-up</label>
                  <Input type="date" value={form.proximo_followup} onChange={e => setForm(f => ({ ...f, proximo_followup: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-neutral-600 mb-1 block">Observações</label>
                <Input value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))} placeholder="Notas sobre o relacionamento..." />
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
