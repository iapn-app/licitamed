"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Upload, FileText, CheckCircle2, AlertTriangle, Clock, Plus,
  Pencil, Trash2, X, RefreshCw, FolderOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Doc {
  id: string;
  nome: string;
  tipo: string;
  validade: string | null;
  alerta_dias: number;
  status: string;
  arquivo_nome: string | null;
  observacoes: string | null;
  updated_at: string;
}

const TIPOS = [
  'Regularidade Fiscal',
  'Regularidade Trabalhista',
  'Habilitação Jurídica',
  'Qualificação Econômica',
  'Qualificação Técnica',
  'Licenças e Autorizações',
];

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  valido:   { label: 'Válido',    color: 'bg-green-50 text-green-700 border-green-200',  icon: CheckCircle2 },
  a_vencer: { label: 'A vencer',  color: 'bg-yellow-50 text-yellow-700 border-yellow-200', icon: Clock },
  vencido:  { label: 'Vencido',   color: 'bg-red-50 text-red-700 border-red-200',        icon: AlertTriangle },
  sem_data: { label: 'Sem data',  color: 'bg-neutral-50 text-neutral-500 border-neutral-200', icon: FileText },
};

function diasRestantes(validade: string | null): number | null {
  if (!validade) return null;
  return Math.floor((new Date(validade).getTime() - Date.now()) / 86400000);
}

function fmtDate(d: string | null) {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('pt-BR'); } catch { return d; }
}

interface FormState {
  nome: string; tipo: string; validade: string;
  alerta_dias: string; arquivo_nome: string; observacoes: string;
}

const EMPTY_FORM: FormState = {
  nome: '', tipo: TIPOS[0], validade: '', alerta_dias: '30', arquivo_nome: '', observacoes: '',
};

export default function DocumentosPage() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Doc | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/documentos');
      const data = await res.json() as { documentos?: Doc[]; erro?: string };
      if (data.erro) throw new Error(data.erro);
      setDocs(data.documentos ?? []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao carregar documentos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  function openNew() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  }

  function openEdit(doc: Doc) {
    setEditing(doc);
    setForm({
      nome: doc.nome,
      tipo: doc.tipo,
      validade: doc.validade?.slice(0, 10) ?? '',
      alerta_dias: String(doc.alerta_dias ?? 30),
      arquivo_nome: doc.arquivo_nome ?? '',
      observacoes: doc.observacoes ?? '',
    });
    setShowModal(true);
  }

  async function save() {
    if (!form.nome.trim()) { toast.error('Nome obrigatório'); return; }
    setSaving(true);
    try {
      const payload = {
        nome: form.nome.trim(),
        tipo: form.tipo,
        validade: form.validade || null,
        alerta_dias: Number(form.alerta_dias) || 30,
        arquivo_nome: form.arquivo_nome.trim() || null,
        observacoes: form.observacoes.trim() || null,
      };
      const url = editing ? `/api/documentos/${editing.id}` : '/api/documentos';
      const method = editing ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json() as { erro?: string };
      if (data.erro) throw new Error(data.erro);
      toast.success(editing ? 'Documento atualizado' : 'Documento adicionado');
      setShowModal(false);
      void load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  }

  async function remove(doc: Doc) {
    if (!confirm(`Excluir "${doc.nome}"?`)) return;
    const res = await fetch(`/api/documentos/${doc.id}`, { method: 'DELETE' });
    const data = await res.json() as { erro?: string };
    if (data.erro) { toast.error(data.erro); return; }
    toast.success('Documento excluído');
    void load();
  }

  const grouped = docs.reduce<Record<string, Doc[]>>((acc, d) => {
    if (!acc[d.tipo]) acc[d.tipo] = [];
    acc[d.tipo].push(d);
    return acc;
  }, {});

  const vencidos = docs.filter(d => d.status === 'vencido').length;
  const aVencer = docs.filter(d => d.status === 'a_vencer').length;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <FolderOpen className="w-5 h-5 text-[#06B6D4]" />
            <h1 className="text-xl font-semibold text-neutral-900">Documentos de Habilitação</h1>
          </div>
          <p className="text-sm text-neutral-500">Gestão de certidões, licenças e documentos exigidos em licitações</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load} className="gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" />Atualizar
          </Button>
          <Button size="sm" onClick={openNew} className="gap-1.5">
            <Plus className="w-3.5 h-3.5" />Adicionar
          </Button>
        </div>
      </div>

      {/* Alertas */}
      {(vencidos > 0 || aVencer > 0) && (
        <div className="flex flex-wrap gap-3">
          {vencidos > 0 && (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-red-50 border border-red-200 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <span className="text-sm text-red-700"><strong>{vencidos}</strong> documento{vencidos > 1 ? 's' : ''} vencido{vencidos > 1 ? 's' : ''}</span>
            </div>
          )}
          {aVencer > 0 && (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-yellow-50 border border-yellow-200 rounded-lg">
              <Clock className="w-4 h-4 text-yellow-500" />
              <span className="text-sm text-yellow-700"><strong>{aVencer}</strong> a vencer em breve</span>
            </div>
          )}
        </div>
      )}

      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-14 bg-neutral-100 rounded-lg animate-pulse" />
          ))}
        </div>
      )}

      {!loading && docs.length === 0 && (
        <div className="bg-white rounded-lg border border-neutral-200 p-12 text-center">
          <FolderOpen className="w-10 h-10 text-neutral-200 mx-auto mb-3" />
          <p className="text-sm text-neutral-500 mb-3">Nenhum documento cadastrado</p>
          <p className="text-xs text-neutral-400 mb-4">
            Se a tabela ainda não foi criada no Supabase, execute a migration{' '}
            <code className="bg-neutral-100 px-1 rounded">003_documentos_habilitacao.sql</code>
          </p>
          <Button size="sm" onClick={openNew} className="gap-1.5">
            <Plus className="w-3.5 h-3.5" />Adicionar primeiro documento
          </Button>
        </div>
      )}

      {!loading && Object.entries(grouped).map(([tipo, items]) => (
        <div key={tipo} className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-neutral-100 bg-neutral-50/50">
            <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">{tipo}</h3>
          </div>
          <div className="divide-y divide-neutral-50">
            {items.map(doc => {
              const cfg = STATUS_CONFIG[doc.status] ?? STATUS_CONFIG.sem_data;
              const StatusIcon = cfg.icon;
              const dias = diasRestantes(doc.validade);
              return (
                <div key={doc.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-neutral-50/50">
                  <FileText className="w-4 h-4 text-neutral-300 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-neutral-800">{doc.nome}</p>
                    {doc.arquivo_nome && (
                      <p className="text-[10px] text-neutral-400 mt-0.5">
                        <Upload className="w-2.5 h-2.5 inline mr-0.5" />{doc.arquivo_nome}
                      </p>
                    )}
                  </div>
                  <div className="text-right hidden sm:block">
                    <p className="text-xs text-neutral-500">Validade: <strong>{fmtDate(doc.validade)}</strong></p>
                    {dias !== null && dias >= 0 && dias <= 60 && (
                      <p className="text-[10px] text-yellow-600">{dias}d restantes</p>
                    )}
                  </div>
                  <span className={cn('inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border flex-shrink-0', cfg.color)}>
                    <StatusIcon className="w-3 h-3" />
                    {cfg.label}
                  </span>
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => openEdit(doc)} className="p-1.5 text-neutral-400 hover:text-[#06B6D4] rounded transition-colors">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => remove(doc)} className="p-1.5 text-neutral-400 hover:text-red-500 rounded transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
              <h2 className="text-sm font-semibold text-neutral-900">
                {editing ? 'Editar documento' : 'Novo documento'}
              </h2>
              <button onClick={() => setShowModal(false)}>
                <X className="w-4 h-4 text-neutral-400" />
              </button>
            </div>
            <div className="px-5 py-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-neutral-600 mb-1 block">Nome do documento</label>
                <Input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Ex: Certidão Negativa Federal" />
              </div>
              <div>
                <label className="text-xs font-medium text-neutral-600 mb-1 block">Tipo</label>
                <Select value={form.tipo} onValueChange={v => setForm(f => ({ ...f, tipo: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TIPOS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-neutral-600 mb-1 block">Validade</label>
                  <Input type="date" value={form.validade} onChange={e => setForm(f => ({ ...f, validade: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs font-medium text-neutral-600 mb-1 block">Alertar (dias antes)</label>
                  <Input type="number" min="1" value={form.alerta_dias} onChange={e => setForm(f => ({ ...f, alerta_dias: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-neutral-600 mb-1 block">Nome do arquivo (se houver)</label>
                <Input value={form.arquivo_nome} onChange={e => setForm(f => ({ ...f, arquivo_nome: e.target.value }))} placeholder="certidao_federal_jan25.pdf" />
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
                {editing ? 'Salvar alterações' : 'Adicionar'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
