"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  Search,
  Filter,
  ArrowRight,
  Building2,
  Calendar,
  FileText,
} from "lucide-react";
import { getStatusLabel, getStatusColor } from "@/lib/mock-data";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import type { LicitacaoRow } from "@/lib/database.types";
import type { LicitacaoStatus } from "@/lib/mock-data";

const statusOptions = [
  { value: "todos", label: "Todos os status" },
  { value: "em_cotacao", label: "Em cotação" },
  { value: "proposta_pronta", label: "Proposta pronta" },
  { value: "em_disputa", label: "Em disputa" },
  { value: "vencida", label: "Vencida" },
  { value: "perdida", label: "Perdida" },
];

interface Props {
  initialData: LicitacaoRow[];
}

const emptyForm = {
  orgao: "",
  nome: "",
  numero_processo: "",
  valor_estimado: "",
  data_pregao: "",
  uf: "",
  municipio: "",
  observacoes: "",
};

export default function LicitacoesClient({ initialData }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const filtered = initialData.filter((l) => {
    const matchSearch =
      !search ||
      l.orgao.toLowerCase().includes(search.toLowerCase()) ||
      (l.numero_processo ?? "").toLowerCase().includes(search.toLowerCase()) ||
      l.nome.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "todos" || l.status === statusFilter;
    return matchSearch && matchStatus;
  });

  async function handleSave() {
    if (!form.orgao.trim()) {
      toast.error("Preencha o campo Órgão comprador");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("licitacoes").insert([
      {
        nome: form.nome.trim() || form.orgao.trim(),
        orgao: form.orgao.trim(),
        numero_processo: form.numero_processo.trim() || null,
        valor_estimado: form.valor_estimado ? parseFloat(form.valor_estimado.replace(",", ".")) : null,
        data_pregao: form.data_pregao || null,
        uf: form.uf.trim().toUpperCase() || null,
        municipio: form.municipio.trim() || null,
        observacoes: form.observacoes.trim() || null,
        status: "em_analise",
        progresso: 0,
      },
    ]);
    setSaving(false);
    if (error) {
      toast.error("Erro ao criar licitação: " + error.message);
      return;
    }
    toast.success("Licitação criada com sucesso!");
    setShowModal(false);
    setForm(emptyForm);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">Licitações</h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            {initialData.length} processo{initialData.length !== 1 ? "s" : ""} cadastrado{initialData.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={() => setShowModal(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Nova Licitação
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <Input
            placeholder="Buscar por órgão, processo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <Filter className="w-3.5 h-3.5 text-neutral-400 mr-1" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {(search || statusFilter !== "todos") && (
        <p className="text-xs text-neutral-400">
          {filtered.length} resultado{filtered.length !== 1 ? "s" : ""} encontrado{filtered.length !== 1 ? "s" : ""}
        </p>
      )}

      {/* Empty state */}
      {initialData.length === 0 ? (
        <div className="neon-card bg-white rounded-lg border border-neutral-200 flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-full bg-[#ECFEFF] flex items-center justify-center mb-4">
            <FileText className="w-7 h-7 text-[#06B6D4]" />
          </div>
          <p className="text-base font-semibold text-neutral-800 mb-1">Nenhuma licitação cadastrada</p>
          <p className="text-sm text-neutral-400 mt-1 mb-6 max-w-sm">
            Cadastre sua primeira licitação ou importe um edital do Monitor
          </p>
          <Button onClick={() => setShowModal(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Nova Licitação
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((lic) => (
            <Link key={lic.id} href={`/licitacoes/${lic.id}`}>
              <div className="neon-card bg-white rounded-lg border border-neutral-200 shadow-card p-5 group">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-md bg-neutral-50 border border-neutral-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Building2 className="w-5 h-5 text-neutral-400" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${getStatusColor(lic.status as LicitacaoStatus)}`}>
                            {getStatusLabel(lic.status as LicitacaoStatus)}
                          </span>
                          {(lic.municipio || lic.uf) && (
                            <>
                              <span className="text-xs text-neutral-300">•</span>
                              <span className="text-xs text-neutral-400">
                                {[lic.municipio, lic.uf].filter(Boolean).join(", ")}
                              </span>
                            </>
                          )}
                        </div>
                        <h3 className="text-sm font-semibold text-neutral-900 leading-snug">
                          {lic.orgao}
                        </h3>
                        {lic.numero_processo && (
                          <p className="text-xs text-neutral-400 mt-0.5">{lic.numero_processo}</p>
                        )}
                      </div>

                      <div className="text-right flex-shrink-0">
                        {lic.valor_estimado != null && (
                          <>
                            <p className="text-lg font-semibold text-neutral-900 tabular-nums">
                              {formatCurrency(lic.valor_estimado)}
                            </p>
                            <p className="text-xs text-neutral-400">Valor estimado</p>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-5 mt-3">
                      {lic.data_pregao && (
                        <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                          <Calendar className="w-3.5 h-3.5 text-neutral-300" />
                          Pregão:{" "}
                          <span className="font-medium text-neutral-700">
                            {formatDate(lic.data_pregao)}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3 mt-3">
                      <Progress value={lic.progresso} className="flex-1 max-w-[200px]" />
                      <span className="text-xs text-neutral-500 tabular-nums">
                        {lic.progresso}% concluído
                      </span>
                    </div>
                  </div>

                  <ArrowRight className="w-4 h-4 text-neutral-300 group-hover:text-[#06B6D4] transition-colors flex-shrink-0 mt-1" />
                </div>
              </div>
            </Link>
          ))}

          {filtered.length === 0 && (
            <div className="bg-white rounded-lg border border-neutral-200 p-12 text-center">
              <p className="text-sm text-neutral-400">Nenhuma licitação encontrada</p>
              <p className="text-xs text-neutral-300 mt-1">Tente ajustar os filtros</p>
            </div>
          )}
        </div>
      )}

      {/* Modal nova licitação */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Nova Licitação</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-xs font-medium text-neutral-600 mb-1.5 block">
                  Órgão comprador *
                </label>
                <Input
                  placeholder="Ex: Prefeitura de São Paulo — SMS"
                  value={form.orgao}
                  onChange={(e) => setForm({ ...form, orgao: e.target.value })}
                />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-medium text-neutral-600 mb-1.5 block">
                  Objeto / Título do processo
                </label>
                <Input
                  placeholder="Ex: Material Hospitalar e Medicamentos"
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-neutral-600 mb-1.5 block">
                  Número do processo
                </label>
                <Input
                  placeholder="Ex: 6016.2024/0001-SP"
                  value={form.numero_processo}
                  onChange={(e) => setForm({ ...form, numero_processo: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-neutral-600 mb-1.5 block">
                  Valor estimado (R$)
                </label>
                <Input
                  placeholder="0,00"
                  value={form.valor_estimado}
                  onChange={(e) => setForm({ ...form, valor_estimado: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-neutral-600 mb-1.5 block">
                  Data do pregão
                </label>
                <Input
                  type="date"
                  value={form.data_pregao}
                  onChange={(e) => setForm({ ...form, data_pregao: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-neutral-600 mb-1.5 block">
                  Estado (UF)
                </label>
                <Input
                  placeholder="SP"
                  maxLength={2}
                  value={form.uf}
                  onChange={(e) => setForm({ ...form, uf: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-neutral-600 mb-1.5 block">
                  Município
                </label>
                <Input
                  placeholder="São Paulo"
                  value={form.municipio}
                  onChange={(e) => setForm({ ...form, municipio: e.target.value })}
                />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-medium text-neutral-600 mb-1.5 block">
                  Observações
                </label>
                <textarea
                  className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#06B6D4] focus:border-transparent resize-none"
                  rows={3}
                  placeholder="Informações adicionais..."
                  value={form.observacoes}
                  onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => { setShowModal(false); setForm(emptyForm); }}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Salvando..." : "Criar licitação"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
