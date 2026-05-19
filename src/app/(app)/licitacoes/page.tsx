"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  Filter,
  ArrowRight,
  Building2,
  Calendar,
  Package,
} from "lucide-react";
import {
  licitacoes,
  getLicitacaoProgress,
  getStatusLabel,
  getStatusColor,
} from "@/lib/mock-data";
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

const statusOptions: { value: string; label: string }[] = [
  { value: "todos", label: "Todos os status" },
  { value: "em_cotacao", label: "Em cotação" },
  { value: "proposta_pronta", label: "Proposta pronta" },
  { value: "em_disputa", label: "Em disputa" },
  { value: "vencida", label: "Vencida" },
  { value: "perdida", label: "Perdida" },
];

export default function LicitacoesPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [showModal, setShowModal] = useState(false);

  const filtered = licitacoes.filter((l) => {
    const matchSearch =
      !search ||
      l.orgao.toLowerCase().includes(search.toLowerCase()) ||
      l.numeroProcesso.toLowerCase().includes(search.toLowerCase()) ||
      l.nome.toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      statusFilter === "todos" || l.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">Licitações</h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            {licitacoes.length} processos cadastrados
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

      {/* Results count */}
      {search || statusFilter !== "todos" ? (
        <p className="text-xs text-neutral-400">
          {filtered.length} resultado{filtered.length !== 1 ? "s" : ""} encontrado{filtered.length !== 1 ? "s" : ""}
        </p>
      ) : null}

      {/* Cards */}
      <div className="space-y-3">
        {filtered.map((lic) => {
          const progress = getLicitacaoProgress(lic);
          const cotados = lic.itens.filter((i) => i.status === "cotado").length;

          return (
            <Link key={lic.id} href={`/licitacoes/${lic.id}`}>
              <div className="neon-card bg-white rounded-lg border border-neutral-200 shadow-card hover:shadow-card-hover transition-all duration-150 p-5 group">
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="w-10 h-10 rounded-md bg-neutral-50 border border-neutral-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Building2 className="w-5 h-5 text-neutral-400" />
                  </div>

                  {/* Main content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${getStatusColor(lic.status)}`}
                          >
                            {getStatusLabel(lic.status)}
                          </span>
                          <span className="text-xs text-neutral-400">{lic.modalidade}</span>
                          <span className="text-xs text-neutral-300">•</span>
                          <span className="text-xs text-neutral-400">{lic.municipio}, {lic.uf}</span>
                        </div>
                        <h3 className="text-sm font-semibold text-neutral-900 leading-snug">
                          {lic.orgao}
                        </h3>
                        <p className="text-xs text-neutral-400 mt-0.5">{lic.numeroProcesso}</p>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <p className="text-lg font-semibold text-neutral-900 tabular-nums">
                          {formatCurrency(lic.valorEstimado)}
                        </p>
                        <p className="text-xs text-neutral-400">Valor estimado</p>
                      </div>
                    </div>

                    {/* Stats row */}
                    <div className="flex items-center gap-5 mt-3">
                      <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                        <Calendar className="w-3.5 h-3.5 text-neutral-300" />
                        Pregão: <span className="font-medium text-neutral-700">{formatDate(lic.dataPregao)}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                        <Package className="w-3.5 h-3.5 text-neutral-300" />
                        <span className="font-medium text-neutral-700">{lic.itens.length}</span> itens
                        <span className="text-neutral-300">|</span>
                        <span className="font-medium text-neutral-700">{cotados}</span> cotados
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                        Responsável: <span className="font-medium text-neutral-700">{lic.responsavel}</span>
                      </div>
                    </div>

                    {/* Progress */}
                    <div className="flex items-center gap-3 mt-3">
                      <Progress value={progress} className="flex-1 max-w-[200px]" />
                      <span className="text-xs text-neutral-500 tabular-nums">
                        {progress}% cotado
                      </span>
                    </div>
                  </div>

                  {/* Arrow */}
                  <ArrowRight className="w-4 h-4 text-neutral-300 group-hover:text-[#1A56DB] transition-colors flex-shrink-0 mt-1" />
                </div>
              </div>
            </Link>
          );
        })}

        {filtered.length === 0 && (
          <div className="bg-white rounded-lg border border-neutral-200 p-12 text-center">
            <p className="text-sm text-neutral-400">Nenhuma licitação encontrada</p>
            <p className="text-xs text-neutral-300 mt-1">Tente ajustar os filtros</p>
          </div>
        )}
      </div>

      {/* New Licitacao Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Nova Licitação</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-xs font-medium text-neutral-600 mb-1.5 block">
                  Órgão comprador
                </label>
                <Input placeholder="Ex: Prefeitura de São Paulo — SMS" />
              </div>
              <div>
                <label className="text-xs font-medium text-neutral-600 mb-1.5 block">
                  Número do processo
                </label>
                <Input placeholder="Ex: 6016.2024/0001-SP" />
              </div>
              <div>
                <label className="text-xs font-medium text-neutral-600 mb-1.5 block">
                  Modalidade
                </label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pregao">Pregão Eletrônico</SelectItem>
                    <SelectItem value="tomada">Tomada de Preços</SelectItem>
                    <SelectItem value="concorrencia">Concorrência</SelectItem>
                    <SelectItem value="dispensa">Dispensa de Licitação</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-neutral-600 mb-1.5 block">
                  Valor estimado (R$)
                </label>
                <Input placeholder="0,00" />
              </div>
              <div>
                <label className="text-xs font-medium text-neutral-600 mb-1.5 block">
                  Data do pregão
                </label>
                <Input type="date" />
              </div>
              <div>
                <label className="text-xs font-medium text-neutral-600 mb-1.5 block">
                  Estado (UF)
                </label>
                <Input placeholder="SP" maxLength={2} />
              </div>
              <div>
                <label className="text-xs font-medium text-neutral-600 mb-1.5 block">
                  Município
                </label>
                <Input placeholder="São Paulo" />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-medium text-neutral-600 mb-1.5 block">
                  Responsável
                </label>
                <Input placeholder="Nome do responsável" />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-medium text-neutral-600 mb-1.5 block">
                  Observações
                </label>
                <textarea
                  className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#1A56DB] focus:border-transparent resize-none"
                  rows={3}
                  placeholder="Informações adicionais..."
                />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                toast.success("Licitação criada com sucesso!");
                setShowModal(false);
              }}
            >
              Criar licitação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
