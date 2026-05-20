"use client";

import { useState } from "react";
import {
  Search,
  Radar,
  Building2,
  MapPin,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/shared/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

const PAGE_SIZE = 50;

const CATEGORIAS = [
  { id: "mat-medicos", label: "Materiais médicos e hospitalares", cnae: "4645101" },
  { id: "equip-med", label: "Equipamentos médico-hospitalares", cnae: "4664800" },
  { id: "medicamentos", label: "Medicamentos e drogas", cnae: "4644301" },
  { id: "descartaveis", label: "Descartáveis e correlatos", cnae: "4645102" },
  { id: "saneantes", label: "Saneantes e higiene hospitalar", cnae: "4684201" },
  { id: "laboratorio", label: "Laboratório e diagnóstico", cnae: "4645101" },
];

const UFS = [
  "AC", "AL", "AM", "AP", "BA", "CE", "DF", "ES", "GO",
  "MA", "MG", "MS", "MT", "PA", "PB", "PE", "PI", "PR",
  "RJ", "RN", "RO", "RR", "RS", "SC", "SE", "SP", "TO",
];

const UF_NAMES: Record<string, string> = {
  AC: "Acre", AL: "Alagoas", AM: "Amazonas", AP: "Amapá", BA: "Bahia",
  CE: "Ceará", DF: "Distrito Federal", ES: "Espírito Santo", GO: "Goiás",
  MA: "Maranhão", MG: "Minas Gerais", MS: "Mato Grosso do Sul",
  MT: "Mato Grosso", PA: "Pará", PB: "Paraíba", PE: "Pernambuco",
  PI: "Piauí", PR: "Paraná", RJ: "Rio de Janeiro", RN: "Rio Grande do Norte",
  RO: "Rondônia", RR: "Roraima", RS: "Rio Grande do Sul",
  SC: "Santa Catarina", SE: "Sergipe", SP: "São Paulo", TO: "Tocantins",
};

const AVATAR_COLORS = [
  "bg-blue-100 text-blue-700",
  "bg-purple-100 text-purple-700",
  "bg-green-100 text-green-700",
  "bg-orange-100 text-orange-700",
  "bg-red-100 text-red-700",
  "bg-indigo-100 text-indigo-700",
  "bg-pink-100 text-pink-700",
  "bg-teal-100 text-teal-700",
];

interface FornecedorAPI {
  cnpj: string;
  nome: string;
  municipio_descricao: string;
  uf: string;
  ativo: boolean;
  habilitado_licitar: boolean;
}

interface CNPJData {
  // Flat structure (receitaws-style)
  nome?: string;
  fantasia?: string;
  situacao?: string;
  abertura?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  municipio?: string;
  uf?: string;
  cep?: string;
  telefone?: string;
  email?: string;
  // Nested structure (cnpj.ws-style)
  razao_social?: string;
  nome_fantasia?: string;
  estabelecimento?: {
    nome_fantasia?: string;
    situacao_cadastral?: string;
    data_inicio_atividade?: string;
    tipo_logradouro?: string;
    logradouro?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
    cep?: string;
    cidade?: { nome?: string };
    estado?: { sigla?: string };
    contato?: { email?: string; telefone?: string };
  };
}

function getAvatarColor(name: string): string {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

function formatCNPJ(cnpj: string): string {
  const c = cnpj.replace(/\D/g, "").padStart(14, "0");
  return `${c.slice(0, 2)}.${c.slice(2, 5)}.${c.slice(5, 8)}/${c.slice(8, 12)}-${c.slice(12, 14)}`;
}

function formatPhone(phone: string): string {
  const p = phone.replace(/\D/g, "");
  if (p.length === 11) return `(${p.slice(0, 2)}) ${p.slice(2, 7)}-${p.slice(7)}`;
  if (p.length === 10) return `(${p.slice(0, 2)}) ${p.slice(2, 6)}-${p.slice(6)}`;
  return phone;
}

function formatCEP(cep: string): string {
  const c = cep.replace(/\D/g, "");
  return c.length === 8 ? `${c.slice(0, 5)}-${c.slice(5)}` : cep;
}

function SupplierCardSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-neutral-200 p-5 space-y-3">
      <div className="flex items-start gap-3">
        <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <Skeleton className="h-3 w-2/5" />
      <div className="flex gap-2">
        <Skeleton className="h-5 w-28 rounded-full" />
        <Skeleton className="h-5 w-14 rounded-full" />
      </div>
      <div className="flex gap-2 pt-3 border-t border-neutral-100">
        <Skeleton className="h-8 flex-1 rounded-md" />
        <Skeleton className="h-8 flex-1 rounded-md" />
      </div>
    </div>
  );
}

export default function RadarPage() {
  const [categoriaId, setCategoriaId] = useState("");
  const [uf, setUf] = useState("");
  const [nameSearch, setNameSearch] = useState("");
  const [searchState, setSearchState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [results, setResults] = useState<FornecedorAPI[]>([]);
  const [usingMock, setUsingMock] = useState(false);
  const [page, setPage] = useState(0);

  const [selectedForn, setSelectedForn] = useState<FornecedorAPI | null>(null);
  const [cnpjData, setCnpjData] = useState<CNPJData | null>(null);
  const [cnpjLoading, setCnpjLoading] = useState(false);
  const [cnpjError, setCnpjError] = useState(false);

  const handleSearch = async () => {
    if (!categoriaId) { toast.error("Selecione uma categoria"); return; }
    if (!uf) { toast.error("Selecione um estado"); return; }

    const categoria = CATEGORIAS.find((c) => c.id === categoriaId);
    if (!categoria) return;

    setSearchState("loading");
    setResults([]);
    setUsingMock(false);
    setPage(0);

    try {
      const params = new URLSearchParams({ cnae: categoria.cnae, uf });
      const res = await fetch(`/api/radar?${params}`);

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || `Erro ${res.status}`);
      }

      const data = await res.json() as { fornecedores: FornecedorAPI[]; useMock?: boolean };
      if (data.useMock) setUsingMock(true);
      let items = (data.fornecedores ?? []).filter((f) => f.ativo);

      if (nameSearch.trim()) {
        const q = nameSearch.toLowerCase();
        items = items.filter((f) => f.nome.toLowerCase().includes(q));
      }

      setResults(items);
      setSearchState("success");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido";
      setErrorMsg(msg);
      setSearchState("error");
    }
  };

  const openModal = async (forn: FornecedorAPI) => {
    setSelectedForn(forn);
    setCnpjData(null);
    setCnpjError(false);
    setCnpjLoading(true);

    try {
      const cnpjClean = forn.cnpj.replace(/\D/g, "");
      const res = await fetch(`/api/cnpj/${cnpjClean}`);
      if (!res.ok) throw new Error("Indisponível");
      const data = await res.json() as CNPJData;
      setCnpjData(data);
    } catch {
      setCnpjError(true);
    } finally {
      setCnpjLoading(false);
    }
  };

  const handleAddToRegistry = (forn: FornecedorAPI) => {
    toast.success(`Fornecedor adicionado! Complete o cadastro em Fornecedores.`, {
      description: forn.nome,
    });
  };

  const totalPages = Math.ceil(results.length / PAGE_SIZE);
  const pageItems = results.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const startItem = results.length > 0 ? page * PAGE_SIZE + 1 : 0;
  const endItem = Math.min((page + 1) * PAGE_SIZE, results.length);

  const goToPage = (next: number) => {
    setPage(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Helpers to extract data from either CNPJ API format
  const est = cnpjData?.estabelecimento;
  const cnpjRazaoSocial = cnpjData?.razao_social ?? cnpjData?.nome;
  const cnpjFantasia = cnpjData?.nome_fantasia ?? est?.nome_fantasia ?? cnpjData?.fantasia;
  const cnpjSituacao = est?.situacao_cadastral ?? cnpjData?.situacao;
  const cnpjAbertura = est?.data_inicio_atividade ?? cnpjData?.abertura;
  const cnpjTelefone = est?.contato?.telefone ?? cnpjData?.telefone;
  const cnpjEmail = est?.contato?.email ?? cnpjData?.email;
  const cnpjEndereco = est
    ? [
        est.tipo_logradouro,
        est.logradouro,
        est.numero && `nº ${est.numero}`,
        est.complemento || undefined,
        est.bairro,
        est.cidade?.nome,
        est.estado?.sigla,
        est.cep && formatCEP(est.cep),
      ]
        .filter(Boolean)
        .join(", ")
    : [
        cnpjData?.logradouro,
        cnpjData?.numero,
        cnpjData?.complemento || undefined,
        cnpjData?.bairro,
        cnpjData?.municipio,
        cnpjData?.uf,
        cnpjData?.cep,
      ]
        .filter(Boolean)
        .join(", ");

  const formatAberturaDate = (d: string) => {
    // Handle both "YYYY-MM-DD" and "DD/MM/YYYY"
    if (!d) return d;
    if (d.includes("-")) {
      return new Date(d + "T12:00:00").toLocaleDateString("pt-BR");
    }
    return d;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <Radar className="w-5 h-5 text-[#06B6D4]" />
            <h1 className="text-xl font-semibold text-neutral-900">Radar de Fornecedores</h1>
          </div>
          <p className="text-sm text-neutral-500">
            Encontre novos fornecedores em todo o Brasil usando dados públicos oficiais
          </p>
        </div>
        <span className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 border border-green-200 rounded-full text-xs font-medium text-green-700 whitespace-nowrap flex-shrink-0">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Dados oficiais do governo federal
        </span>
      </div>

      {/* Search panel */}
      <div className="neon-card bg-white rounded-lg border border-neutral-200 shadow-card p-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <div>
            <label className="text-xs font-medium text-neutral-600 mb-1.5 block">Categoria</label>
            <Select value={categoriaId} onValueChange={setCategoriaId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIAS.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs font-medium text-neutral-600 mb-1.5 block">Estado (UF)</label>
            <Select value={uf} onValueChange={setUf}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um estado" />
              </SelectTrigger>
              <SelectContent>
                {UFS.map((sigla) => (
                  <SelectItem key={sigla} value={sigla}>
                    {sigla} — {UF_NAMES[sigla]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs font-medium text-neutral-600 mb-1.5 block">
              Buscar por nome{" "}
              <span className="text-neutral-400 font-normal">(opcional)</span>
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <Input
                placeholder="Nome da empresa..."
                value={nameSearch}
                onChange={(e) => setNameSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="pl-9"
              />
            </div>
          </div>
        </div>

        <Button
          onClick={handleSearch}
          disabled={searchState === "loading"}
          className="gap-2 w-full md:w-auto"
        >
          {searchState === "loading" ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Buscando...
            </>
          ) : (
            <>
              <Search className="w-4 h-4" />
              Buscar Fornecedores
            </>
          )}
        </Button>
      </div>

      {/* Loading skeletons */}
      {searchState === "loading" && (
        <div className="space-y-4">
          <Skeleton className="h-4 w-52" />
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <SupplierCardSkeleton key={i} />
            ))}
          </div>
        </div>
      )}

      {/* Error state */}
      {searchState === "error" && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-5 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-700">Erro ao buscar fornecedores</p>
            <p className="text-xs text-red-600 mt-0.5">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Empty state */}
      {searchState === "success" && results.length === 0 && (
        <div className="bg-white rounded-lg border border-neutral-200 p-12 text-center">
          <Building2 className="w-10 h-10 text-neutral-200 mx-auto mb-3" />
          <p className="text-sm font-medium text-neutral-600">
            Nenhum fornecedor encontrado para esse filtro
          </p>
          <p className="text-xs text-neutral-400 mt-1">
            Tente outro estado ou categoria
          </p>
        </div>
      )}

      {/* Mock data warning */}
      {searchState === "success" && usingMock && (
        <div className="flex items-center gap-2.5 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-xs text-amber-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>
            API do governo temporariamente indisponível — exibindo dados de exemplo para demonstração.
          </span>
        </div>
      )}

      {/* Results */}
      {searchState === "success" && results.length > 0 && (
        <div className="space-y-4">
          {/* Counter + top pagination */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <p className="text-sm text-neutral-500">
              Encontrados{" "}
              <span className="font-semibold text-neutral-900">{results.length}</span>{" "}
              fornecedores · Exibindo{" "}
              <span className="font-semibold text-neutral-900">
                {startItem}–{endItem}
              </span>
            </p>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                  className="gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Anterior
                </Button>
                <span className="text-xs text-neutral-500 tabular-nums px-1">
                  {page + 1} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(Math.min(totalPages - 1, page + 1))}
                  disabled={page === totalPages - 1}
                  className="gap-1"
                >
                  Próximo
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {pageItems.map((forn) => (
              <div
                key={forn.cnpj}
                className="neon-card bg-white rounded-lg border border-neutral-200 shadow-card p-5 flex flex-col"
              >
                {/* Card header */}
                <div className="flex items-start gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 ${getAvatarColor(forn.nome)}`}
                  >
                    {getInitials(forn.nome)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-neutral-900 leading-snug line-clamp-2">
                      {forn.nome}
                    </p>
                    <p className="text-xs text-neutral-400 mt-0.5 font-mono">
                      {formatCNPJ(forn.cnpj)}
                    </p>
                  </div>
                </div>

                {/* Location */}
                <div className="flex items-center gap-1.5 mt-3 text-xs text-neutral-500">
                  <MapPin className="w-3.5 h-3.5 text-neutral-300 flex-shrink-0" />
                  <span className="truncate">
                    {forn.municipio_descricao}, {forn.uf}
                  </span>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {forn.habilitado_licitar ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">
                      <CheckCircle2 className="w-2.5 h-2.5" />
                      Habilitado a licitar
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-500 border border-neutral-200">
                      <XCircle className="w-2.5 h-2.5" />
                      Não habilitado
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    Ativo
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t border-neutral-100 mt-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs h-8"
                    onClick={() => openModal(forn)}
                  >
                    Ver detalhes
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 text-xs h-8"
                    onClick={() => handleAddToRegistry(forn)}
                  >
                    Adicionar
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                Anterior
              </Button>
              <span className="text-xs text-neutral-500 tabular-nums">
                Página {page + 1} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(Math.min(totalPages - 1, page + 1))}
                disabled={page === totalPages - 1}
                className="gap-1"
              >
                Próximo
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Detail modal */}
      <Dialog open={!!selectedForn} onOpenChange={(open) => !open && setSelectedForn(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Fornecedor</DialogTitle>
            <DialogDescription>
              Informações básicas e dados da Receita Federal
            </DialogDescription>
          </DialogHeader>

          {selectedForn && (
            <div className="space-y-4">
              {/* Basic info card */}
              <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-md border border-neutral-100">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-base font-semibold flex-shrink-0 ${getAvatarColor(selectedForn.nome)}`}
                >
                  {getInitials(selectedForn.nome)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-neutral-900 leading-snug">
                    {selectedForn.nome}
                  </p>
                  <p className="text-xs text-neutral-400 font-mono mt-0.5">
                    {formatCNPJ(selectedForn.cnpj)}
                  </p>
                  <div className="flex items-center gap-1 mt-1 text-xs text-neutral-500">
                    <MapPin className="w-3 h-3 flex-shrink-0" />
                    {selectedForn.municipio_descricao}, {selectedForn.uf}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 flex-wrap">
                {selectedForn.habilitado_licitar ? (
                  <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-200">
                    <CheckCircle2 className="w-3 h-3" />
                    Habilitado a licitar
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-500 border border-neutral-200">
                    <XCircle className="w-3 h-3" />
                    Não habilitado
                  </span>
                )}
                <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  Ativo
                </span>
              </div>

              {/* Receita Federal section */}
              <div className="border-t border-neutral-100 pt-4">
                <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-widest mb-3">
                  Dados da Receita Federal
                </p>

                {cnpjLoading && (
                  <div className="space-y-2.5">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-4 w-3/5" />
                  </div>
                )}

                {cnpjError && !cnpjLoading && (
                  <div className="flex items-center gap-2 text-xs text-neutral-400 bg-neutral-50 rounded-md p-3 border border-neutral-100">
                    <Info className="w-4 h-4 flex-shrink-0" />
                    Dados detalhados indisponíveis no momento
                  </div>
                )}

                {cnpjData && !cnpjLoading && (
                  <dl className="space-y-2.5">
                    {cnpjRazaoSocial && (
                      <div>
                        <dt className="text-[10px] font-medium text-neutral-400 uppercase tracking-wide">
                          Razão Social
                        </dt>
                        <dd className="text-sm text-neutral-900 mt-0.5">{cnpjRazaoSocial}</dd>
                      </div>
                    )}
                    {cnpjFantasia && (
                      <div>
                        <dt className="text-[10px] font-medium text-neutral-400 uppercase tracking-wide">
                          Nome Fantasia
                        </dt>
                        <dd className="text-sm text-neutral-900 mt-0.5">{cnpjFantasia}</dd>
                      </div>
                    )}
                    {cnpjSituacao && (
                      <div>
                        <dt className="text-[10px] font-medium text-neutral-400 uppercase tracking-wide">
                          Situação Cadastral
                        </dt>
                        <dd className="text-sm text-neutral-900 mt-0.5">{cnpjSituacao}</dd>
                      </div>
                    )}
                    {cnpjAbertura && (
                      <div>
                        <dt className="text-[10px] font-medium text-neutral-400 uppercase tracking-wide">
                          Data de Abertura
                        </dt>
                        <dd className="text-sm text-neutral-900 mt-0.5">
                          {formatAberturaDate(cnpjAbertura)}
                        </dd>
                      </div>
                    )}
                    {cnpjTelefone && (
                      <div>
                        <dt className="text-[10px] font-medium text-neutral-400 uppercase tracking-wide">
                          Telefone
                        </dt>
                        <dd className="text-sm text-neutral-900 mt-0.5">
                          {formatPhone(cnpjTelefone)}
                        </dd>
                      </div>
                    )}
                    {cnpjEmail && (
                      <div>
                        <dt className="text-[10px] font-medium text-neutral-400 uppercase tracking-wide">
                          E-mail
                        </dt>
                        <dd className="text-sm text-neutral-900 mt-0.5">{cnpjEmail}</dd>
                      </div>
                    )}
                    {cnpjEndereco && (
                      <div>
                        <dt className="text-[10px] font-medium text-neutral-400 uppercase tracking-wide">
                          Endereço
                        </dt>
                        <dd className="text-sm text-neutral-900 mt-0.5">{cnpjEndereco}</dd>
                      </div>
                    )}
                  </dl>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setSelectedForn(null)}>
              Fechar
            </Button>
            {selectedForn && (
              <Button
                onClick={() => {
                  handleAddToRegistry(selectedForn);
                  setSelectedForn(null);
                }}
              >
                Adicionar ao cadastro
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
