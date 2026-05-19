"use client";

import { useState } from "react";
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
} from "lucide-react";
import {
  fornecedores,
  getCategoriaColor,
  type ItemCategoria,
} from "@/lib/mock-data";
import { formatDate } from "@/lib/utils";
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

export default function FornecedoresPage() {
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [categoriaFilter, setCategoriaFilter] = useState<string>("todas");
  const [newFornecedor, setNewFornecedor] = useState({
    nome: "",
    cnpj: "",
    email: "",
    whatsapp: "",
    observacoes: "",
    categorias: [] as ItemCategoria[],
  });

  const filtered = fornecedores.filter((f) => {
    const matchSearch =
      !search ||
      f.nome.toLowerCase().includes(search.toLowerCase()) ||
      f.cnpj.includes(search) ||
      f.email.toLowerCase().includes(search.toLowerCase());
    const matchCat =
      categoriaFilter === "todas" ||
      f.categorias.includes(categoriaFilter as ItemCategoria);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">Fornecedores</h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            {fornecedores.length} fornecedores cadastrados
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
        className="flex items-center justify-between gap-4 bg-gradient-to-r from-[#EBF0FD] to-blue-50 border border-[#1A56DB]/20 rounded-lg px-5 py-4 hover:border-[#1A56DB]/40 transition-colors group"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-[#1A56DB]/10 flex items-center justify-center flex-shrink-0">
            <Radar className="w-4 h-4 text-[#1A56DB]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#1A56DB]">
              Quer expandir sua base de fornecedores?
            </p>
            <p className="text-xs text-neutral-500 mt-0.5">
              Busque novos fornecedores em todo o Brasil usando dados públicos do governo federal
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-[#1A56DB] whitespace-nowrap flex-shrink-0 group-hover:gap-2.5 transition-all">
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
                ? "bg-[#1A56DB] text-white border-[#1A56DB]"
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
                  ? "bg-[#1A56DB] text-white border-[#1A56DB]"
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
          {fornecedores.filter((f) => f.documentosOk).length} com docs OK
        </span>
        <span>·</span>
        <span className="flex items-center gap-1">
          <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
          {fornecedores.filter((f) => !f.documentosOk).length} com pendências
        </span>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((forn) => (
          <div
            key={forn.id}
            className="neon-card bg-white rounded-lg border border-neutral-200 shadow-card hover:shadow-card-hover transition-all duration-150 p-5"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neutral-100 to-neutral-200 flex items-center justify-center text-base font-semibold text-neutral-600 flex-shrink-0">
                  {forn.nome.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-neutral-900 leading-tight truncate">
                    {forn.nome}
                  </p>
                  <p className="text-xs text-neutral-400 mt-0.5 font-mono">{forn.cnpj}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <StarRating score={forn.score} />
                <span
                  className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border flex items-center gap-1 ${
                    forn.documentosOk
                      ? "bg-green-50 text-green-700 border-green-200"
                      : "bg-red-50 text-red-700 border-red-200"
                  }`}
                >
                  {forn.documentosOk ? (
                    <CheckCircle2 className="w-2.5 h-2.5" />
                  ) : (
                    <AlertTriangle className="w-2.5 h-2.5" />
                  )}
                  {forn.documentosOk ? "Docs OK" : "Vencido"}
                </span>
              </div>
            </div>

            {/* Categorias */}
            <div className="flex flex-wrap gap-1 mt-3">
              {forn.categorias.map((cat) => (
                <span
                  key={cat}
                  className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${getCategoriaColor(cat)}`}
                >
                  {cat}
                </span>
              ))}
            </div>

            {/* Contact */}
            <div className="mt-3 pt-3 border-t border-neutral-100 space-y-1.5">
              <div className="flex items-center gap-2 text-xs text-neutral-500">
                <Mail className="w-3.5 h-3.5 text-neutral-300" />
                <a href={`mailto:${forn.email}`} className="hover:text-[#1A56DB] transition-colors truncate">
                  {forn.email}
                </a>
              </div>
              <div className="flex items-center gap-2 text-xs text-neutral-500">
                <Phone className="w-3.5 h-3.5 text-neutral-300" />
                <span>{forn.whatsapp}</span>
              </div>
            </div>

            {/* Last quote */}
            <div className="mt-3 pt-3 border-t border-neutral-100 flex items-center justify-between">
              <span className="text-xs text-neutral-400">
                Última cotação: {formatDate(forn.ultimaCotacao)}
              </span>
              <button
                onClick={() => toast.success(`Link de cotação copiado para ${forn.nome}`)}
                className="text-xs font-medium text-[#1A56DB] hover:text-[#1547BF] transition-colors"
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

      {/* New Fornecedor Modal */}
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
                  WhatsApp *
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
                E-mail *
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
                        ? "bg-[#1A56DB] text-white border-[#1A56DB]"
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
                className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#1A56DB] focus:border-transparent resize-none"
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
              onClick={() => {
                setShowModal(false);
                setNewFornecedor({ nome: "", cnpj: "", email: "", whatsapp: "", observacoes: "", categorias: [] });
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (!newFornecedor.nome || !newFornecedor.cnpj) {
                  toast.error("Preencha os campos obrigatórios");
                  return;
                }
                toast.success(`Fornecedor "${newFornecedor.nome}" cadastrado com sucesso!`);
                setShowModal(false);
                setNewFornecedor({ nome: "", cnpj: "", email: "", whatsapp: "", observacoes: "", categorias: [] });
              }}
            >
              Cadastrar fornecedor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
