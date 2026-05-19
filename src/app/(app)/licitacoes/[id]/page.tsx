"use client";

import { notFound } from "next/navigation";
import { useState } from "react";
import {
  Building2,
  Calendar,
  Package,
  Users,
  Download,
  Send,
  Star,
  TrendingDown,
  FileText,
} from "lucide-react";
import {
  getLicitacaoById,
  getFornecedorById,
  getCotacoesByLicitacao,
  getCotacoesByItem,
  getStatusLabel,
  getStatusColor,
  getItemStatusLabel,
  getItemStatusColor,
  getCategoriaColor,
  getLicitacaoProgress,
} from "@/lib/mock-data";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const MARGEM_PADRAO = 0.2;

export default function LicitacaoDetailPage({ params }: { params: { id: string } }) {
  const licitacao = getLicitacaoById(params.id);
  const [margens] = useState<Record<string, number>>({});
  const [activeTab, setActiveTab] = useState("itens");

  if (!licitacao) notFound();

  const progress = getLicitacaoProgress(licitacao);
  const cotacoes = getCotacoesByLicitacao(licitacao.id);
  const fornecedoresVinculados = licitacao.fornecedoresIds.map((id) =>
    getFornecedorById(id)
  ).filter(Boolean);

  const getMargemItem = (itemId: string) =>
    margens[itemId] !== undefined ? margens[itemId] : MARGEM_PADRAO;

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: "Licitações", href: "/licitacoes" },
          { label: licitacao.orgao },
        ]}
      />

      {/* Header */}
      <div className="bg-white rounded-lg border border-neutral-200 shadow-card p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-neutral-50 border border-neutral-200 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-6 h-6 text-neutral-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${getStatusColor(licitacao.status)}`}
                >
                  {getStatusLabel(licitacao.status)}
                </span>
                <span className="text-xs text-neutral-400">{licitacao.modalidade}</span>
              </div>
              <h1 className="text-lg font-semibold text-neutral-900">{licitacao.orgao}</h1>
              <p className="text-sm text-neutral-500 mt-0.5">{licitacao.nome}</p>
              <p className="text-xs text-neutral-400 mt-1 font-mono">{licitacao.numeroProcesso}</p>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-2xl font-bold text-neutral-900 tabular-nums">
              {formatCurrency(licitacao.valorEstimado)}
            </p>
            <p className="text-xs text-neutral-400 mt-0.5">Valor estimado</p>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-6 mt-5 pt-5 border-t border-neutral-100">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-neutral-300" />
            <span className="text-neutral-500">Pregão:</span>
            <span className="font-medium text-neutral-800">{formatDate(licitacao.dataPregao)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Package className="w-4 h-4 text-neutral-300" />
            <span className="text-neutral-500">Itens:</span>
            <span className="font-medium text-neutral-800">{licitacao.itens.length}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Users className="w-4 h-4 text-neutral-300" />
            <span className="text-neutral-500">Fornecedores:</span>
            <span className="font-medium text-neutral-800">{fornecedoresVinculados.length}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-neutral-500">Local:</span>
            <span className="font-medium text-neutral-800">{licitacao.municipio}, {licitacao.uf}</span>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Progress value={progress} className="w-24" />
              <span className="text-xs text-neutral-500 tabular-nums">{progress}% cotado</span>
            </div>
          </div>
        </div>

        {licitacao.observacoes && (
          <div className="mt-4 pt-4 border-t border-neutral-100">
            <p className="text-xs text-neutral-500 flex items-start gap-1.5">
              <FileText className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-neutral-300" />
              {licitacao.observacoes}
            </p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg border border-neutral-200 shadow-card">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="px-5 border-b border-neutral-100">
            <TabsList>
              <TabsTrigger value="itens">
                Itens ({licitacao.itens.length})
              </TabsTrigger>
              <TabsTrigger value="fornecedores">
                Fornecedores ({fornecedoresVinculados.length})
              </TabsTrigger>
              <TabsTrigger value="cotacoes">
                Cotações ({cotacoes.length})
              </TabsTrigger>
              <TabsTrigger value="proposta">Proposta</TabsTrigger>
            </TabsList>
          </div>

          {/* ABA: ITENS */}
          <TabsContent value="itens" className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-100">
                    <th className="text-left px-5 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide w-12">Nº</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide">Descrição</th>
                    <th className="text-right px-5 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide">Qtd</th>
                    <th className="text-center px-5 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide">Un</th>
                    <th className="text-center px-5 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide">Categoria</th>
                    <th className="text-right px-5 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide">Ref. unitário</th>
                    <th className="text-center px-5 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50">
                  {licitacao.itens.map((item) => (
                    <tr key={item.id} className="hover:bg-neutral-50 transition-colors duration-100">
                      <td className="px-5 py-3.5 text-xs text-neutral-400 tabular-nums">{item.numero}</td>
                      <td className="px-5 py-3.5">
                        <p className="text-sm text-neutral-900">{item.descricao}</p>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <span className="text-sm text-neutral-700 tabular-nums font-medium">
                          {item.quantidade.toLocaleString("pt-BR")}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className="text-xs text-neutral-500">{item.unidade}</span>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${getCategoriaColor(item.categoria)}`}
                        >
                          {item.categoria}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <span className="text-sm text-neutral-600 tabular-nums">
                          {formatCurrency(item.valorReferencia)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${getItemStatusColor(item.status)}`}
                        >
                          {getItemStatusLabel(item.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* ABA: FORNECEDORES */}
          <TabsContent value="fornecedores" className="p-5">
            <div className="space-y-3">
              {fornecedoresVinculados.map((f) => {
                if (!f) return null;
                const itensDoFornecedor = licitacao.itens.filter(
                  (i) => i.fornecedorSugeridoId === f.id
                );
                const cotacoesDoFornecedor = cotacoes.filter(
                  (c) => c.fornecedorId === f.id
                );
                const respondeu = cotacoesDoFornecedor.length > 0;

                return (
                  <div
                    key={f.id}
                    className="flex items-center gap-4 p-4 rounded-lg border border-neutral-100 hover:bg-neutral-50 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-full bg-neutral-100 flex items-center justify-center text-sm font-semibold text-neutral-500 flex-shrink-0">
                      {f.nome.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-neutral-900">{f.nome}</p>
                        {!f.documentosOk && (
                          <span className="text-xs text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-full">
                            Docs vencidos
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <p className="text-xs text-neutral-400">{f.email}</p>
                        <span className="text-neutral-200">·</span>
                        <p className="text-xs text-neutral-400">
                          {itensDoFornecedor.length} itens nesta licitação
                        </p>
                      </div>
                      <div className="flex gap-1 mt-1.5">
                        {f.categorias.map((cat) => (
                          <span
                            key={cat}
                            className={`text-xs px-1.5 py-0.5 rounded-full border ${getCategoriaColor(cat)}`}
                          >
                            {cat}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 space-y-1">
                      <div className="flex items-center gap-1 justify-end">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3 h-3 ${i < f.score ? "fill-yellow-400 text-yellow-400" : "text-neutral-200"}`}
                          />
                        ))}
                      </div>
                      <span
                        className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full border font-medium ${
                          respondeu
                            ? "bg-green-50 text-green-700 border-green-200"
                            : "bg-yellow-50 text-yellow-700 border-yellow-200"
                        }`}
                      >
                        {respondeu ? "Respondeu" : "Aguardando"}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-shrink-0"
                      onClick={() => {
                        toast.success(`Link enviado para ${f.email}`);
                      }}
                    >
                      <Send className="w-3.5 h-3.5 mr-1" />
                      Enviar cotação
                    </Button>
                  </div>
                );
              })}
            </div>
          </TabsContent>

          {/* ABA: COTAÇÕES */}
          <TabsContent value="cotacoes" className="p-0">
            <div className="p-5 border-b border-neutral-100">
              <p className="text-sm text-neutral-500">
                Comparativo de preços — menor preço destacado em verde
              </p>
            </div>
            <div className="overflow-x-auto">
              {licitacao.itens
                .filter((item) => item.status === "cotado")
                .map((item) => {
                  const itemCotacoes = getCotacoesByItem(licitacao.id, item.id);
                  if (itemCotacoes.length === 0) return null;
                  const menorPreco = Math.min(...itemCotacoes.map((c) => c.precoUnitario));

                  return (
                    <div key={item.id} className="border-b border-neutral-50 last:border-0">
                      <div className="px-5 py-3 bg-neutral-50">
                        <p className="text-xs font-medium text-neutral-600">
                          <span className="text-neutral-400 mr-2">#{item.numero}</span>
                          {item.descricao}
                        </p>
                        <p className="text-xs text-neutral-400 mt-0.5">
                          Qtd: {item.quantidade.toLocaleString("pt-BR")} {item.unidade}
                        </p>
                      </div>
                      <table className="w-full">
                        <thead>
                          <tr>
                            <th className="text-left px-5 py-2 text-xs font-medium text-neutral-400">Fornecedor</th>
                            <th className="text-right px-5 py-2 text-xs font-medium text-neutral-400">Preço unit.</th>
                            <th className="text-right px-5 py-2 text-xs font-medium text-neutral-400">Total</th>
                            <th className="text-center px-5 py-2 text-xs font-medium text-neutral-400">Marca</th>
                            <th className="text-center px-5 py-2 text-xs font-medium text-neutral-400">Prazo</th>
                            <th className="text-right px-5 py-2 text-xs font-medium text-neutral-400">Preço proposto (+20%)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {itemCotacoes
                            .sort((a, b) => a.precoUnitario - b.precoUnitario)
                            .map((cot) => {
                              const forn = getFornecedorById(cot.fornecedorId);
                              const isMenor = cot.precoUnitario === menorPreco;
                              const margem = getMargemItem(item.id);
                              const precoFinal = cot.precoUnitario * (1 + margem);

                              return (
                                <tr
                                  key={cot.id}
                                  className={`hover:bg-neutral-50 transition-colors ${isMenor ? "bg-green-50/50" : ""}`}
                                >
                                  <td className="px-5 py-2.5">
                                    <div className="flex items-center gap-2">
                                      {isMenor && (
                                        <TrendingDown className="w-3.5 h-3.5 text-green-600" />
                                      )}
                                      <span className={`text-xs ${isMenor ? "text-green-700 font-medium" : "text-neutral-600"}`}>
                                        {forn?.nome || "—"}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="px-5 py-2.5 text-right">
                                    <span className={`text-sm font-medium tabular-nums ${isMenor ? "text-green-700" : "text-neutral-800"}`}>
                                      {formatCurrency(cot.precoUnitario)}
                                    </span>
                                  </td>
                                  <td className="px-5 py-2.5 text-right">
                                    <span className="text-xs text-neutral-500 tabular-nums">
                                      {formatCurrency(cot.precoUnitario * item.quantidade)}
                                    </span>
                                  </td>
                                  <td className="px-5 py-2.5 text-center">
                                    <span className="text-xs text-neutral-500">{cot.marca}</span>
                                  </td>
                                  <td className="px-5 py-2.5 text-center">
                                    <span className="text-xs text-neutral-500">{cot.prazoEntrega}d</span>
                                  </td>
                                  <td className="px-5 py-2.5 text-right">
                                    <span className="text-sm font-medium text-[#1A56DB] tabular-nums">
                                      {formatCurrency(precoFinal)}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  );
                })}
            </div>
          </TabsContent>

          {/* ABA: PROPOSTA */}
          <TabsContent value="proposta" className="p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-sm font-semibold text-neutral-900">Resumo da Proposta</h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Margem aplicada: {(MARGEM_PADRAO * 100).toFixed(0)}%
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => toast.success("Exportando Excel...")}
                >
                  <Download className="w-3.5 h-3.5 mr-1.5" />
                  Exportar Excel
                </Button>
                <Button
                  size="sm"
                  onClick={() => toast.success("Exportando PDF...")}
                >
                  <Download className="w-3.5 h-3.5 mr-1.5" />
                  Exportar PDF
                </Button>
              </div>
            </div>

            <div className="rounded-lg border border-neutral-200 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-neutral-50 border-b border-neutral-200">
                    <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide">Item</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide">Descrição</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide">Qtd</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide">Compra unit.</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide">Proposta unit.</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide">Margem</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide">Total proposta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50">
                  {licitacao.itens
                    .filter((item) => item.status === "cotado")
                    .map((item) => {
                      const itemCotacoes = getCotacoesByItem(licitacao.id, item.id);
                      if (itemCotacoes.length === 0) return null;
                      const menorPreco = Math.min(...itemCotacoes.map((c) => c.precoUnitario));
                      const margem = getMargemItem(item.id);
                      const precoVenda = menorPreco * (1 + margem);
                      const totalProposta = precoVenda * item.quantidade;

                      return (
                        <tr key={item.id} className="hover:bg-neutral-50">
                          <td className="px-4 py-3 text-xs text-neutral-400">{item.numero}</td>
                          <td className="px-4 py-3 text-sm text-neutral-800">{item.descricao}</td>
                          <td className="px-4 py-3 text-right text-sm text-neutral-600 tabular-nums">
                            {item.quantidade.toLocaleString("pt-BR")} {item.unidade}
                          </td>
                          <td className="px-4 py-3 text-right text-sm text-neutral-600 tabular-nums">
                            {formatCurrency(menorPreco)}
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-medium text-[#1A56DB] tabular-nums">
                            {formatCurrency(precoVenda)}
                          </td>
                          <td className="px-4 py-3 text-right text-xs text-green-600 font-medium">
                            {(margem * 100).toFixed(0)}%
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-semibold text-neutral-900 tabular-nums">
                            {formatCurrency(totalProposta)}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
                <tfoot>
                  <tr className="border-t border-neutral-200 bg-neutral-50">
                    <td colSpan={6} className="px-4 py-3 text-sm font-semibold text-neutral-700">
                      Total da Proposta
                    </td>
                    <td className="px-4 py-3 text-right text-base font-bold text-neutral-900 tabular-nums">
                      {formatCurrency(
                        licitacao.itens
                          .filter((item) => item.status === "cotado")
                          .reduce((sum, item) => {
                            const itemCotacoes = getCotacoesByItem(licitacao.id, item.id);
                            if (itemCotacoes.length === 0) return sum;
                            const menorPreco = Math.min(...itemCotacoes.map((c) => c.precoUnitario));
                            const margem = getMargemItem(item.id);
                            return sum + menorPreco * (1 + margem) * item.quantidade;
                          }, 0)
                      )}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs text-amber-700">
                <strong>Atenção:</strong> {licitacao.itens.filter(i => i.status !== "cotado").length} item(ns) ainda sem cotação não foram incluídos nesta proposta.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
