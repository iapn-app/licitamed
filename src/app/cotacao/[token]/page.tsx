"use client";

import { useState } from "react";
import {
  Activity,
  CheckCircle2,
  Package,
  Clock,
  Send,
  AlertCircle,
} from "lucide-react";
import { fornecedores, licitacoes } from "@/lib/mock-data";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Toaster } from "sonner";

interface ItemCotacao {
  itemId: string;
  preco: string;
  marca: string;
  prazo: string;
  observacao: string;
}

export default function CotacaoPortalPage({ params }: { params: { token: string } }) {
  const { token } = params;

  // Find fornecedor by token
  const fornecedor = fornecedores.find((f) => f.token === token);

  // For demo, use first active licitacao
  const licitacao = licitacoes.find((l) => l.status === "em_cotacao");

  const [enviado, setEnviado] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [cotacoes, setCotacoes] = useState<Record<string, ItemCotacao>>({});

  if (!fornecedor) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-4">
        <Toaster position="top-center" richColors />
        <div className="text-center">
          <div className="w-14 h-14 rounded-full bg-red-50 border border-red-200 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-7 h-7 text-red-500" />
          </div>
          <h1 className="text-lg font-semibold text-neutral-900">Link inválido</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Este link de cotação não é válido ou expirou.
          </p>
        </div>
      </div>
    );
  }

  const itensFornecedor = licitacao?.itens.filter(
    (i) => i.fornecedorSugeridoId === fornecedor.id
  ) || [];

  const updateCotacao = (itemId: string, field: keyof ItemCotacao, value: string) => {
    setCotacoes((prev) => ({
      ...prev,
      [itemId]: {
        ...(prev[itemId] || { itemId, preco: "", marca: "", prazo: "", observacao: "" }),
        [field]: value,
      },
    }));
  };

  const preenchidos = itensFornecedor.filter(
    (item) => cotacoes[item.id]?.preco
  ).length;

  const handleEnviar = () => {
    if (preenchidos === 0) {
      toast.error("Preencha pelo menos um preço antes de enviar.");
      return;
    }
    setConfirmando(true);
  };

  const handleConfirmar = () => {
    setEnviado(true);
    toast.success("Cotação enviada com sucesso!");
  };

  if (enviado) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-4">
        <Toaster position="top-center" richColors />
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-green-50 border border-green-200 flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-xl font-semibold text-neutral-900">Cotação enviada!</h1>
          <p className="text-sm text-neutral-500 mt-2 leading-relaxed">
            Obrigado, <strong>{fornecedor.nome}</strong>. Sua cotação foi recebida com sucesso e será analisada pela equipe da POWER MED.
          </p>
          <div className="mt-6 p-4 bg-white border border-neutral-200 rounded-lg text-left">
            <p className="text-xs text-neutral-500 font-medium uppercase tracking-wide mb-2">Resumo</p>
            <p className="text-sm text-neutral-700">
              {preenchidos} item(ns) cotado(s) de {itensFornecedor.length}
            </p>
            {licitacao && (
              <p className="text-xs text-neutral-400 mt-1">
                Licitação: {licitacao.orgao}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <Toaster position="top-center" richColors />

      {/* Header */}
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-[#06B6D4] flex items-center justify-center">
              <Activity className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-sm font-semibold text-neutral-900">LicitaMed</span>
            <span className="text-neutral-200 text-sm">·</span>
            <span className="text-sm text-neutral-500">POWER MED</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-neutral-500">
            <Package className="w-3.5 h-3.5" />
            {preenchidos}/{itensFornecedor.length} itens preenchidos
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-5">
        {/* Licitação info */}
        {licitacao && (
          <div className="bg-white rounded-lg border border-neutral-200 shadow-card p-5">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <p className="text-xs font-medium text-[#06B6D4] uppercase tracking-wide mb-1">
                  Solicitação de Cotação
                </p>
                <h1 className="text-base font-semibold text-neutral-900">
                  {licitacao.orgao}
                </h1>
                <p className="text-xs text-neutral-500 mt-0.5">
                  {licitacao.nome}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-neutral-100">
              <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                <Clock className="w-3.5 h-3.5 text-neutral-300" />
                Prazo: <strong className="text-neutral-700">{formatDate(licitacao.dataPregao)}</strong>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                <Package className="w-3.5 h-3.5 text-neutral-300" />
                <strong className="text-neutral-700">{itensFornecedor.length}</strong> itens para cotar
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-neutral-100">
              <p className="text-xs text-neutral-500">
                Fornecedor: <strong className="text-neutral-700">{fornecedor.nome}</strong>
              </p>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-xs text-blue-700 leading-relaxed">
            <strong>Como preencher:</strong> Para cada item abaixo, informe o preço unitário, a marca do produto e o prazo de entrega em dias. O campo de observação é opcional. Após preencher, clique em &ldquo;Enviar Cotação&rdquo;.
          </p>
        </div>

        {/* Itens */}
        <div className="space-y-3">
          {itensFornecedor.length === 0 ? (
            <div className="bg-white rounded-lg border border-neutral-200 p-8 text-center">
              <p className="text-sm text-neutral-400">
                Nenhum item encontrado para este fornecedor nesta licitação.
              </p>
            </div>
          ) : (
            itensFornecedor.map((item, idx) => {
              const cot = cotacoes[item.id];
              const filled = !!cot?.preco;

              return (
                <div
                  key={item.id}
                  className={`bg-white rounded-lg border shadow-card transition-all ${
                    filled
                      ? "border-green-200 bg-green-50/30"
                      : "border-neutral-200"
                  }`}
                >
                  {/* Item header */}
                  <div className="flex items-start justify-between gap-3 p-4 pb-3">
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-7 h-7 rounded-md flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5 ${
                          filled
                            ? "bg-green-100 text-green-700"
                            : "bg-neutral-100 text-neutral-500"
                        }`}
                      >
                        {filled ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-neutral-900 leading-snug">
                          {item.descricao}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-neutral-400">
                            Qtd: <strong className="text-neutral-600">{item.quantidade.toLocaleString("pt-BR")} {item.unidade}</strong>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Fields */}
                  <div className="px-4 pb-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="col-span-1">
                      <label className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wide mb-1 block">
                        Preço unitário (R$) *
                      </label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0,00"
                        value={cot?.preco || ""}
                        onChange={(e) => updateCotacao(item.id, "preco", e.target.value)}
                        className="text-sm font-medium"
                      />
                    </div>
                    <div className="col-span-1">
                      <label className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wide mb-1 block">
                        Marca / Fabricante
                      </label>
                      <Input
                        placeholder="Ex: BD, Cristália..."
                        value={cot?.marca || ""}
                        onChange={(e) => updateCotacao(item.id, "marca", e.target.value)}
                        className="text-sm"
                      />
                    </div>
                    <div className="col-span-1">
                      <label className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wide mb-1 block">
                        Prazo entrega (dias)
                      </label>
                      <Input
                        type="number"
                        min="1"
                        placeholder="Ex: 7"
                        value={cot?.prazo || ""}
                        onChange={(e) => updateCotacao(item.id, "prazo", e.target.value)}
                        className="text-sm"
                      />
                    </div>
                    <div className="col-span-1 md:col-span-1">
                      <label className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wide mb-1 block">
                        Observação
                      </label>
                      <Input
                        placeholder="Opcional"
                        value={cot?.observacao || ""}
                        onChange={(e) => updateCotacao(item.id, "observacao", e.target.value)}
                        className="text-sm"
                      />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Progress bar */}
        {itensFornecedor.length > 0 && (
          <div className="bg-white rounded-lg border border-neutral-200 shadow-card p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-neutral-500">
                Progresso: {preenchidos} de {itensFornecedor.length} itens preenchidos
              </span>
              <span className="text-xs font-medium text-neutral-700">
                {Math.round((preenchidos / itensFornecedor.length) * 100)}%
              </span>
            </div>
            <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#06B6D4] rounded-full transition-all duration-300"
                style={{ width: `${(preenchidos / itensFornecedor.length) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Submit */}
        {!confirmando ? (
          <Button
            onClick={handleEnviar}
            className="w-full py-3 text-sm"
            size="lg"
            disabled={itensFornecedor.length === 0}
          >
            <Send className="w-4 h-4 mr-2" />
            Enviar Cotação ({preenchidos} item{preenchidos !== 1 ? "ns" : ""})
          </Button>
        ) : (
          <div className="bg-white rounded-lg border border-neutral-200 shadow-card p-5 space-y-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-neutral-900">Confirmar envio?</p>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Você preencheu <strong>{preenchidos}</strong> de <strong>{itensFornecedor.length}</strong> itens.
                  Após o envio, não será possível alterar os valores.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setConfirmando(false)}
              >
                Voltar e editar
              </Button>
              <Button
                className="flex-1 bg-[#0E9F6E] hover:bg-green-700"
                onClick={handleConfirmar}
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Confirmar e enviar
              </Button>
            </div>
          </div>
        )}

        <p className="text-center text-xs text-neutral-300 pb-6">
          LicitaMed · POWER MED · {new Date().getFullYear()}
        </p>
      </main>
    </div>
  );
}
