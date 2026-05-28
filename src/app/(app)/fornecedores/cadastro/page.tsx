"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Users, Plus, Mail, Package, Pencil, Trash2,
  X, Save, Loader2, RefreshCw, MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Produto {
  id?: string;
  produto: string;
  marca: string;
}

interface Fornecedor {
  id: string;
  nome_empresa: string;
  nome_contato: string | null;
  whatsapp: string | null;
  email: string | null;
  observacoes: string | null;
  ativo: boolean;
  created_at: string;
  fornecedores_produtos: Produto[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtWa(raw: string) {
  return raw.replace(/\D/g, '');
}

function inputCls(extra = '') {
  return cn(
    "w-full text-sm px-3 py-2 rounded-md border border-neutral-200 bg-white focus:outline-none focus:border-[#06B6D4] focus:ring-1 focus:ring-[#06B6D4]/20",
    extra,
  );
}

// ─── Fornecedor form (create / edit) ──────────────────────────────────────────

interface FornecedorFormProps {
  initial?: Fornecedor;
  onSave: () => void;
  onClose: () => void;
}

function FornecedorForm({ initial, onSave, onClose }: FornecedorFormProps) {
  const [nome, setNome] = useState(initial?.nome_empresa ?? '');
  const [contato, setContato] = useState(initial?.nome_contato ?? '');
  const [whatsapp, setWhatsapp] = useState(initial?.whatsapp ?? '');
  const [email, setEmail] = useState(initial?.email ?? '');
  const [obs, setObs] = useState(initial?.observacoes ?? '');
  const [produtos, setProdutos] = useState<Produto[]>(
    initial?.fornecedores_produtos ?? [{ produto: '', marca: '' }]
  );
  const [saving, setSaving] = useState(false);

  function addProduto() { setProdutos(p => [...p, { produto: '', marca: '' }]); }
  function removeProduto(i: number) { setProdutos(p => p.filter((_, idx) => idx !== i)); }
  function updateProduto(i: number, field: 'produto' | 'marca', val: string) {
    setProdutos(p => p.map((r, idx) => idx === i ? { ...r, [field]: val } : r));
  }

  async function handleSave() {
    if (!nome.trim()) { toast.error('Nome da empresa é obrigatório'); return; }
    setSaving(true);
    try {
      const payload = {
        nome_empresa: nome,
        nome_contato: contato || null,
        whatsapp: whatsapp || null,
        email: email || null,
        observacoes: obs || null,
        produtos: produtos.filter(p => p.produto.trim()),
      };

      const url = initial
        ? `/api/fornecedores-cadastro/${initial.id}`
        : '/api/fornecedores-cadastro';
      const method = initial ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json() as { error?: string };
        throw new Error(err.error ?? `HTTP ${res.status}`);
      }

      toast.success(initial ? 'Fornecedor atualizado!' : 'Fornecedor cadastrado!');
      onSave();
    } catch (e) {
      toast.error(String(e instanceof Error ? e.message : e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Basic info */}
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="block text-xs font-medium text-neutral-600 mb-1">Nome da Empresa *</label>
          <input value={nome} onChange={e => setNome(e.target.value)} className={inputCls()} placeholder="Ex: Medix Brasil Ltda" />
        </div>
        <div>
          <label className="block text-xs font-medium text-neutral-600 mb-1">Nome do Contato</label>
          <input value={contato} onChange={e => setContato(e.target.value)} className={inputCls()} placeholder="Ex: João Silva" />
        </div>
        <div>
          <label className="block text-xs font-medium text-neutral-600 mb-1">WhatsApp</label>
          <input value={whatsapp} onChange={e => setWhatsapp(e.target.value)} className={inputCls()} placeholder="+55 21 99999-9999" />
        </div>
        <div>
          <label className="block text-xs font-medium text-neutral-600 mb-1">E-mail</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} className={inputCls()} placeholder="comercial@empresa.com.br" />
        </div>
        <div>
          <label className="block text-xs font-medium text-neutral-600 mb-1">Observações</label>
          <input value={obs} onChange={e => setObs(e.target.value)} className={inputCls()} placeholder="Marcas, condições, etc." />
        </div>
      </div>

      {/* Produtos */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-neutral-700">Produtos fornecidos</p>
          <button onClick={addProduto} className="flex items-center gap-1 text-[11px] text-[#06B6D4] hover:text-[#0891B2] font-medium">
            <Plus className="w-3.5 h-3.5" /> Adicionar
          </button>
        </div>
        <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
          {produtos.map((p, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                value={p.produto}
                onChange={e => updateProduto(i, 'produto', e.target.value)}
                className={inputCls("flex-1 text-xs py-1.5")}
                placeholder="Nome do produto"
              />
              <input
                value={p.marca}
                onChange={e => updateProduto(i, 'marca', e.target.value)}
                className={inputCls("w-28 text-xs py-1.5")}
                placeholder="Marca"
              />
              <button onClick={() => removeProduto(i)} className="text-neutral-300 hover:text-red-400 flex-shrink-0 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-3 border-t border-neutral-100">
        <Button variant="outline" size="sm" onClick={onClose} disabled={saving}>Cancelar</Button>
        <Button size="sm" onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>
    </div>
  );
}

// ─── Fornecedor card ───────────────────────────────────────────────────────────

function FornecedorCard({ f, onEdit, onDelete }: {
  f: Fornecedor;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      onClick={onEdit}
      className="bg-white rounded-lg border border-neutral-200 p-4 hover:border-[#06B6D4]/50 hover:shadow-sm transition-all cursor-pointer group"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-neutral-900 truncate">{f.nome_empresa}</p>
          {f.nome_contato && (
            <p className="text-xs text-neutral-500 mt-0.5 truncate">{f.nome_contato}</p>
          )}
        </div>
        <button
          onClick={e => { e.stopPropagation(); onDelete(); }}
          className="opacity-0 group-hover:opacity-100 p-1 rounded text-neutral-300 hover:text-red-400 transition-all flex-shrink-0"
          title="Remover fornecedor"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Contact icons */}
      <div className="flex items-center gap-3 mt-3">
        {f.whatsapp && (
          <a
            href={`https://wa.me/${fmtWa(f.whatsapp)}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="flex items-center gap-1 text-[11px] text-green-600 hover:text-green-700 font-medium"
            title={f.whatsapp}
          >
            <MessageCircle className="w-3.5 h-3.5" />
            WhatsApp
          </a>
        )}
        {f.email && (
          <a
            href={`mailto:${f.email}`}
            onClick={e => e.stopPropagation()}
            className="flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-700 font-medium truncate"
            title={f.email}
          >
            <Mail className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate max-w-[120px]">{f.email}</span>
          </a>
        )}
        {!f.whatsapp && !f.email && (
          <span className="text-[11px] text-neutral-300">Sem contato</span>
        )}
      </div>

      {/* Products count */}
      <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-neutral-50">
        <Package className="w-3.5 h-3.5 text-neutral-300" />
        <span className="text-[11px] text-neutral-500">
          {f.fornecedores_produtos.length} produto{f.fornecedores_produtos.length !== 1 ? 's' : ''}
        </span>
        {f.observacoes && (
          <span className="text-[10px] text-neutral-400 ml-2 truncate">· {f.observacoes}</span>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CadastroFornecedoresPage() {
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [loading, setLoading] = useState(false);
  const [editando, setEditando] = useState<Fornecedor | null | 'novo'>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/fornecedores-cadastro');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setFornecedores(await res.json() as Fornecedor[]);
    } catch (e) {
      toast.error(`Erro ao carregar: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleDelete(f: Fornecedor) {
    if (!confirm(`Remover "${f.nome_empresa}" da sua carteira?`)) return;
    try {
      await fetch(`/api/fornecedores-cadastro/${f.id}`, { method: 'DELETE' });
      toast.success('Fornecedor removido');
      load();
    } catch {
      toast.error('Erro ao remover');
    }
  }

  const totalProdutos = fornecedores.reduce((s, f) => s + f.fornecedores_produtos.length, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <Users className="w-5 h-5 text-[#06B6D4]" />
            <h1 className="text-xl font-semibold text-neutral-900">Meus Fornecedores</h1>
          </div>
          <p className="text-sm text-neutral-500">
            Carteira própria da Power Med — fornecedores com quem já trabalhamos
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={load} disabled={loading} variant="outline" size="sm" className="gap-2">
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            Atualizar
          </Button>
          <Button onClick={() => setEditando('novo')} size="sm" className="gap-2">
            <Plus className="w-4 h-4" />
            Novo Fornecedor
          </Button>
        </div>
      </div>

      {/* Stats */}
      {fornecedores.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div className="bg-white rounded-lg border border-neutral-200 p-4">
            <p className="text-2xl font-bold text-neutral-900">{fornecedores.length}</p>
            <p className="text-xs text-neutral-400">Fornecedores ativos</p>
          </div>
          <div className="bg-white rounded-lg border border-neutral-200 p-4">
            <p className="text-2xl font-bold text-neutral-900">{totalProdutos}</p>
            <p className="text-xs text-neutral-400">Produtos cadastrados</p>
          </div>
          <div className="bg-white rounded-lg border border-neutral-200 p-4">
            <p className="text-2xl font-bold text-neutral-900">
              {fornecedores.filter(f => f.whatsapp).length}
            </p>
            <p className="text-xs text-neutral-400">Com WhatsApp</p>
          </div>
        </div>
      )}

      {/* Cards grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-36 rounded-lg border border-neutral-100 bg-neutral-50 animate-pulse" />
          ))}
        </div>
      ) : fornecedores.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-center">
          <div className="w-14 h-14 rounded-full bg-[#ECFEFF] flex items-center justify-center mb-4">
            <Users className="w-7 h-7 text-[#06B6D4]" />
          </div>
          <p className="text-sm font-semibold text-neutral-800 mb-1">Nenhum fornecedor cadastrado</p>
          <p className="text-xs text-neutral-400 max-w-xs mb-4">
            Adicione os fornecedores com quem a Power Med trabalha para facilitar cotações e matching de editais
          </p>
          <Button onClick={() => setEditando('novo')} size="sm" className="gap-2">
            <Plus className="w-4 h-4" />
            Adicionar primeiro fornecedor
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {fornecedores.map(f => (
            <FornecedorCard
              key={f.id}
              f={f}
              onEdit={() => setEditando(f)}
              onDelete={() => handleDelete(f)}
            />
          ))}
        </div>
      )}

      {/* Create / Edit dialog */}
      <Dialog open={!!editando} onOpenChange={open => !open && setEditando(null)}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editando === 'novo' ? (
                <><Plus className="w-5 h-5 text-[#06B6D4]" /> Novo Fornecedor</>
              ) : (
                <><Pencil className="w-5 h-5 text-[#06B6D4]" /> Editar Fornecedor</>
              )}
            </DialogTitle>
          </DialogHeader>
          {editando && (
            <FornecedorForm
              initial={editando === 'novo' ? undefined : editando}
              onSave={() => { setEditando(null); load(); }}
              onClose={() => setEditando(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
