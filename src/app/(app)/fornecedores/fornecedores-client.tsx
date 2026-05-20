"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  Search,
  Star,
  Mail,
  Phone,
  CheckCircle2,
  AlertTriangle,
  Radar,
  ArrowRight,
  Users,
} from "lucide-react";
import { getCategoriaColor, type ItemCategoria } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import type { FornecedorRow } from "@/lib/database.types";

const CATEGORIAS: ItemCategoria[] = [
  "Descartáveis",
  "Medicamentos",
  "Equipamentos",
  "Curativos",
  "EPIs",
  "Saneantes",
  "Laboratório",
  "Ortopedia",
];

function StarRating({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`w-3 h-3 ${i < score ? "fill-yellow-400 text-yellow-400" : "text-neutral-200"}`}
        />
      ))}
    </div>
  );
}

const emptyForm = {
  nome: "",
  cnpj: "",
  email: "",
  whatsapp: "",
  observacoes: "",
  categorias: [] as ItemCategoria[],
};

interface Props {
  initialData: FornecedorRow[];
}

export default function FornecedoresClient({ initialData }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [categoriaFilter, setCategoriaFilter] = useState("todas");
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newFornecedor, setNewFornecedor] = useState(emptyForm);

  const filtered = initialData.filter((f) => {
    const matchSearch =
      !search ||
      f.nome.toLowerCase().includes(search.toLowerCase()) ||
      (f.cnpj ?? "").includes(search) ||
      (f.email ?? "").toLowerCase().includes(search.toLowerCase());
    const matchCat =
      categoriaFilter === "todas" ||
      (f.categorias ?? []).includes(categoriaFilter);
    return matchSearch && matchCat;
  });

  const toggleCategoria = (cat: ItemCategoria) => {
    setNewFornecedor((prev) => ({
      ...prev,
      categorias: prev.categorias.includes(cat)
        ? prev.categorias.filter((c) => c !== cat)
        : [...prev.categorias, cat],
    }));
  };

  async function handleSave() {
    if (!newFornecedor.nome.trim() || !newFornecedor.cnpj.trim()) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("fornecedores").insert([
      {
        nome: newFornecedor.nome.trim(),
        cnpj: newFornecedor.cnpj.trim(),
        email: newFornecedor.email.trim() || null,
        whatsapp: newFornecedor.whatsapp.trim() || null,
        categorias: newFornecedor.categorias,
        observacoes: newFornecedor.observacoes.trim() || null,
        score: 3,
        ativo: true,
      },
    ]);
    setSaving(false);
    if (error) {
      toast.error("Erro ao cadastrar fornecedor: " + error.message);
      return;
    }
    toast.success(`Fornecedor "${newFornecedor.nome}" cadastrado!`);
    setShowModal(false);
    setNewFornecedor(emptyForm);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">Fornecedores</h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            {initialData.length} fornecedor{initialData.length !== 1 ? "es" : ""} cadastrado{initialData.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={() => setShowModal(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Novo Fornecedor
        </Button>
      </div>

      {/* Radar banner */}
      <Link
        href="/fornecedores/radar"
        className="flex items-center justify-between gap-4 bg-gradient-to-r from-[#ECFEFF] to-blue-50 border border-[#06B6D4]/20 rounded-lg px-5 py-4 hover:border-[#06B6D4]/40 transition-colors group"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-[#06B6D4]/10 flex items-center justify-center flex-shrink-0">
            <Radar className="w-4 h-4 text-[#06B6D4]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#06B6D4]">
              Quer expandir sua base de fornecedores?
            </p>
            <p className="text-xs text-neutral-500 mt-0.5">
              Busque novos fornecedores em todo o Brasil usando dados públicos do governo federal
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-[#06B6D4] whitespace-nowrap flex-shrink-0 group-hover:gap-2.5 transition-all">
          Buscar no Radar
          <ArrowRight className="w-3.5 h-3.5" />
        </div>
      </Link>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <Input
            placeholder="Buscar por nome, CNPJ, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setCategoriaFilter("todas")}
            className={`px-3 py-1.5 text-xs rounded-full border font-medium transition-colors ${
              categoriaFilter === "todas"
                ? "bg-[#06B6D4] text-white border-[#06B6D4]"
                : "bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50"
            }`}
          >
            Todas
          </button>
          {CATEGORIAS.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoriaFilter(cat === categoriaFilter ? "todas" : cat)}
              className={`px-3 py-1.5 text-xs rounded-full border font-medium transition-colors ${
                categoriaFilter === cat
                  ? "bg-[#06B6D4] text-white border-[#06B6D4]"
                  : "bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-xs text-neutral-500">
        <span>{filtered.length} exibido{filtered.length !== 1 ? "s" : ""}</span>
        <span>·</span>
        <span className="flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
          {initialData.filter((f) => f.ativo).length} ativos
        </span>
        <span>·</span>
        <span className="flex items-center gap-1">
          <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
          {initialData.filter((f) => !f.ativo).length} inativos
        </span>
      </div>

      {/* Empty state */}
      {initialData.length === 0 ? (
        <div className="bg-white rounded-lg border border-neutral-200 p-16 text-center">
          <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-4">
            <Users className="w-6 h-6 text-neutral-400" />
          </div>
          <p className="text-sm font-medium text-neutral-700">Nenhum fornecedor cadastrado</p>
          <p className="text-xs text-neutral-400 mt-1 mb-5">Cadastre fornecedores para enviar cotações</p>
          <Button onClick={() => setShowModal(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Cadastrar primeiro fornecedor
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((forn) => (
            <div
              key={forn.id}
              className="neon-card bg-white rounded-lg border border-neutral-200 shadow-card p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neutral-100 to-neutral-200 flex items-center justify-center text-base font-semibold text-neutral-600 flex-shrink-0">
                    {forn.nome.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-neutral-900 leading-tight truncate">
                      {forn.nome}
                    </p>
                    {forn.cnpj && (
                      <p className="text-xs text-neutral-400 mt-0.5 font-mono">{forn.cnpj}</p>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <StarRating score={forn.score} />
                  <span
                    className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border flex items-center gap-1 ${
                      forn.ativo
                        ? "bg-green-50 text-green-700 border-green-200"
                        : "bg-red-50 text-red-700 border-red-200"
                    }`}
                  >
                    {forn.ativo ? (
                      <CheckCircle2 className="w-2.5 h-2.5" />
                    ) : (
                      <AlertTriangle className="w-2.5 h-2.5" />
                    )}
                    {forn.ativo ? "Ativo" : "Inativo"}
                  </span>
                </div>
              </div>

              {(forn.categorias ?? []).length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {(forn.categorias ?? []).map((cat) => (
                    <span
                      key={cat}
                      className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${getCategoriaColor(cat as ItemCategoria)}`}
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-3 pt-3 border-t border-neutral-100 space-y-1.5">
                {forn.email && (
                  <div className="flex items-center gap-2 text-xs text-neutral-500">
                    <Mail className="w-3.5 h-3.5 text-neutral-300" />
                    <a href={`mailto:${forn.email}`} className="hover:text-[#06B6D4] transition-colors truncate">
                      {forn.email}
                    </a>
                  </div>
                )}
                {forn.whatsapp && (
                  <div className="flex items-center gap-2 text-xs text-neutral-500">
                    <Phone className="w-3.5 h-3.5 text-neutral-300" />
                    <span>{forn.whatsapp}</span>
                  </div>
                )}
              </div>

              <div className="mt-3 pt-3 border-t border-neutral-100 flex items-center justify-end">
                <button
                  onClick={() => toast.success(`Link de cotação copiado para ${forn.nome}`)}
                  className="text-xs font-medium text-[#06B6D4] hover:text-[#0891B2] transition-colors"
                >
                  Enviar cotação →
                </button>
              </div>

              {forn.observacoes && (
                <p className="text-xs text-neutral-400 mt-2 pt-2 border-t border-neutral-50 italic leading-relaxed">
                  {forn.observacoes}
                </p>
              )}
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="col-span-3 bg-white rounded-lg border border-neutral-200 p-12 text-center">
              <p className="text-sm text-neutral-400">Nenhum fornecedor encontrado</p>
            </div>
          )}
        </div>
      )}

      {/* Modal novo fornecedor */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Fornecedor</DialogTitle>
            <DialogDescription>
              Cadastre um novo fornecedor para receber cotações
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-neutral-600 mb-1.5 block">
                Razão Social *
              </label>
              <Input
                placeholder="Nome da empresa"
                value={newFornecedor.nome}
                onChange={(e) => setNewFornecedor({ ...newFornecedor, nome: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-neutral-600 mb-1.5 block">
                  CNPJ *
                </label>
                <Input
                  placeholder="00.000.000/0000-00"
                  value={newFornecedor.cnpj}
                  onChange={(e) => setNewFornecedor({ ...newFornecedor, cnpj: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-neutral-600 mb-1.5 block">
                  WhatsApp
                </label>
                <Input
                  placeholder="(11) 99999-9999"
                  value={newFornecedor.whatsapp}
                  onChange={(e) => setNewFornecedor({ ...newFornecedor, whatsapp: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-neutral-600 mb-1.5 block">
                E-mail
              </label>
              <Input
                type="email"
                placeholder="comercial@empresa.com.br"
                value={newFornecedor.email}
                onChange={(e) => setNewFornecedor({ ...newFornecedor, email: e.target.value })}
              />
            </div>

            <div>
              <label className="text-xs font-medium text-neutral-600 mb-2 block">
                Categorias atendidas
              </label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIAS.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleCategoria(cat)}
                    className={`px-3 py-1.5 text-xs rounded-full border font-medium transition-colors ${
                      newFornecedor.categorias.includes(cat)
                        ? "bg-[#06B6D4] text-white border-[#06B6D4]"
                        : "bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-neutral-600 mb-1.5 block">
                Observações
              </label>
              <textarea
                className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#06B6D4] focus:border-transparent resize-none"
                rows={3}
                placeholder="Notas sobre o fornecedor, condições especiais..."
                value={newFornecedor.observacoes}
                onChange={(e) => setNewFornecedor({ ...newFornecedor, observacoes: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => { setShowModal(false); setNewFornecedor(emptyForm); }}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Salvando..." : "Cadastrar fornecedor"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
