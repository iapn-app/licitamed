"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  ExternalLink,
  Clock,
  Trash2,
  Info,
  FileText,
  Users,
  ClipboardList,
  Tag,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

type FileStatus = "pendente" | "processando" | "concluido" | "erro";

interface ImportResult {
  tipo: string;
  confianca: number;
  total_linhas: number;
  registros_identificados: number;
  registros_importados: number;
  campos_identificados: string[];
  resumo: string;
  erro_salvar: string | null;
}

interface FileItem {
  id: string;
  name: string;
  size: number;
  status: FileStatus;
  result?: ImportResult;
  error?: string;
}

interface HistoryEntry {
  id: string;
  timestamp: string;
  filename: string;
  tipo: string;
  registros: number;
  status: "sucesso" | "parcial" | "erro";
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TIPO_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; border: string; href?: string; Icon: React.ComponentType<{ className?: string }> }
> = {
  licitacoes:      { label: "Licitações",      color: "text-blue-700",   bg: "bg-blue-50",   border: "border-blue-200",   href: "/licitacoes",  Icon: FileText    },
  fornecedores:    { label: "Fornecedores",     color: "text-green-700",  bg: "bg-green-50",  border: "border-green-200",  href: "/fornecedores",Icon: Users        },
  cotacoes:        { label: "Cotações",         color: "text-purple-700", bg: "bg-purple-50", border: "border-purple-200", href: "/cotacoes",    Icon: ClipboardList},
  itens_licitacao: { label: "Itens de edital",  color: "text-orange-700", bg: "bg-orange-50", border: "border-orange-200",                       Icon: Tag         },
  misto:           { label: "Dados mistos",     color: "text-yellow-700", bg: "bg-yellow-50", border: "border-yellow-200",                       Icon: FileSpreadsheet },
};

const DEFAULT_TIPO = { label: "Desconhecido", color: "text-neutral-600", bg: "bg-neutral-100", border: "border-neutral-200", Icon: FileSpreadsheet };

const HISTORY_KEY = "importar_historico";
const ACCEPTED_EXTS = [".xlsx", ".xls", ".csv"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fDateTime(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });
}

function isAccepted(name: string) {
  return ACCEPTED_EXTS.some((ext) => name.toLowerCase().endsWith(ext));
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ImportarPage() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(HISTORY_KEY);
      if (saved) setHistory(JSON.parse(saved) as HistoryEntry[]);
    } catch {}
  }, []);

  const processFile = useCallback(async (id: string, file: File) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, status: "processando" } : f))
    );

    try {
      const form = new FormData();
      form.append("file", file);

      const res = await fetch("/api/importar", { method: "POST", body: form });
      const data = (await res.json()) as ImportResult & { error?: string; success?: boolean };

      if (!res.ok || data.error) {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === id ? { ...f, status: "erro", error: data.error ?? "Erro desconhecido" } : f
          )
        );
        return;
      }

      setFiles((prev) =>
        prev.map((f) => (f.id === id ? { ...f, status: "concluido", result: data } : f))
      );

      const entry: HistoryEntry = {
        id,
        timestamp: new Date().toISOString(),
        filename: file.name,
        tipo: data.tipo,
        registros: data.registros_importados,
        status: data.erro_salvar ? "parcial" : "sucesso",
      };

      setHistory((prev) => {
        const updated = [entry, ...prev].slice(0, 20);
        try { localStorage.setItem(HISTORY_KEY, JSON.stringify(updated)); } catch {}
        return updated;
      });
    } catch (err) {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === id
            ? { ...f, status: "erro", error: err instanceof Error ? err.message : String(err) }
            : f
        )
      );
    }
  }, []);

  function addFiles(fileList: FileList | null) {
    if (!fileList) return;
    const valid = Array.from(fileList).filter((f) => isAccepted(f.name));
    if (valid.length === 0) return;

    const newItems: FileItem[] = valid.map((f) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name: f.name,
      size: f.size,
      status: "pendente",
    }));

    setFiles((prev) => [...prev, ...newItems]);

    newItems.forEach((item, i) => {
      setTimeout(() => processFile(item.id, valid[i]), i * 300);
    });
  }

  function removeFile(id: string) {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }

  function clearHistory() {
    setHistory([]);
    try { localStorage.removeItem(HISTORY_KEY); } catch {}
  }

  const pendingCount = files.filter((f) => f.status === "processando").length;

  return (
    <div className="space-y-6">

      {/* ─── Header ──────────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2.5 mb-1">
          <Upload className="w-5 h-5 text-[#06B6D4]" />
          <h1 className="text-xl font-semibold text-neutral-900">Importar Dados</h1>
        </div>
        <p className="text-sm text-neutral-500">
          Suba suas planilhas Excel e a IA identifica e organiza tudo automaticamente
        </p>
      </div>

      {/* ─── Info Banner ─────────────────────────────────────────────────── */}
      <div className="flex items-start gap-3 px-4 py-3 bg-cyan-50 border border-cyan-200 rounded-lg">
        <Info className="w-4 h-4 text-cyan-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-cyan-800 leading-relaxed">
          <span className="font-semibold">Formatos aceitos: .xlsx, .xls, .csv</span>
          {" — "}O sistema reconhece automaticamente se é uma planilha de licitações,
          fornecedores, cotações ou itens. Não precisa seguir um modelo específico.
        </p>
      </div>

      {/* ─── Drop Zone ───────────────────────────────────────────────────── */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => { e.preventDefault(); setIsDragging(false); addFiles(e.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "border-2 border-dashed rounded-xl p-12 flex flex-col items-center justify-center gap-4 cursor-pointer transition-colors",
          isDragging
            ? "border-[#06B6D4] bg-cyan-50"
            : "border-neutral-200 bg-white hover:border-[#06B6D4] hover:bg-cyan-50/30"
        )}
      >
        <div className={cn(
          "w-16 h-16 rounded-full flex items-center justify-center transition-colors",
          isDragging ? "bg-cyan-100" : "bg-neutral-100"
        )}>
          <Upload className={cn("w-8 h-8 transition-colors", isDragging ? "text-[#06B6D4]" : "text-neutral-400")} />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-neutral-800">
            {isDragging ? "Solte o arquivo aqui" : "Arraste seus arquivos aqui ou clique para selecionar"}
          </p>
          <p className="text-xs text-neutral-400 mt-1">
            Planilhas de licitações, fornecedores, cotações ou itens — a IA identifica cada uma
          </p>
        </div>
        <span className="text-[10px] text-neutral-400 px-3 py-1 bg-neutral-100 rounded-full">
          .xlsx · .xls · .csv · máx 10 MB por arquivo
        </span>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={(e) => addFiles(e.target.files)}
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      {/* ─── File Queue ──────────────────────────────────────────────────── */}
      {files.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-neutral-900">
              Arquivos
              {pendingCount > 0 && (
                <span className="ml-2 text-xs font-normal text-neutral-400">
                  — processando {pendingCount}...
                </span>
              )}
            </h2>
            <button
              onClick={() => setFiles([])}
              className="text-xs text-neutral-400 hover:text-neutral-700 transition-colors"
            >
              Limpar tudo
            </button>
          </div>

          {files.map((item) => {
            const cfg = TIPO_CONFIG[item.result?.tipo ?? ""] ?? DEFAULT_TIPO;
            return (
              <div
                key={item.id}
                className="neon-card bg-white rounded-lg border border-neutral-200 p-4"
              >
                {/* File header */}
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-md bg-neutral-100 flex items-center justify-center flex-shrink-0">
                    <FileSpreadsheet className="w-5 h-5 text-neutral-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-neutral-900 truncate">{item.name}</p>
                    <p className="text-xs text-neutral-400 mt-0.5">{fSize(item.size)}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {item.status === "processando" && (
                      <span className="flex items-center gap-1.5 text-xs text-cyan-600">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Analisando...
                      </span>
                    )}
                    {item.status === "pendente" && (
                      <span className="text-xs text-neutral-400">Aguardando...</span>
                    )}
                    {item.status === "concluido" && (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    )}
                    {item.status === "erro" && (
                      <AlertCircle className="w-4 h-4 text-red-500" />
                    )}
                    <button
                      onClick={() => removeFile(item.id)}
                      className="p-1 rounded hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Error state */}
                {item.status === "erro" && item.error && (
                  <div className="mt-3 flex items-start gap-2 px-3 py-2.5 bg-red-50 border border-red-200 rounded-md">
                    <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-red-700">{item.error}</p>
                  </div>
                )}

                {/* Success state */}
                {item.status === "concluido" && item.result && (
                  <div className="mt-4 space-y-3">
                    {/* Type + confidence */}
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border",
                        cfg.color, cfg.bg, cfg.border
                      )}>
                        <cfg.Icon className="w-3.5 h-3.5" />
                        {cfg.label}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-neutral-100 border border-neutral-200 rounded-full text-xs font-medium text-neutral-700">
                        {item.result.confianca}% de confiança
                      </span>
                      <span className="text-xs text-neutral-500">
                        {item.result.registros_identificados} registros identificados
                        · {item.result.total_linhas} linhas totais
                      </span>
                    </div>

                    {/* Resumo */}
                    <p className="text-xs text-neutral-700 leading-relaxed px-1">
                      {item.result.resumo}
                    </p>

                    {/* Fields recognized */}
                    {item.result.campos_identificados?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {item.result.campos_identificados.map((campo) => (
                          <span
                            key={campo}
                            className="inline-block px-2 py-0.5 bg-cyan-50 text-cyan-700 border border-cyan-200 rounded text-[10px] font-medium"
                          >
                            {campo}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Import count */}
                    {item.result.registros_importados > 0 ? (
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <p className="text-xs text-green-700 font-medium">
                          {item.result.registros_importados} registro{item.result.registros_importados > 1 ? "s" : ""} salvo{item.result.registros_importados > 1 ? "s" : ""} no sistema
                        </p>
                        {cfg.href && (
                          <Link
                            href={cfg.href}
                            className="inline-flex items-center gap-1 text-xs text-[#06B6D4] hover:text-[#0891B2] font-medium transition-colors ml-1"
                          >
                            Ver dados importados
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        )}
                      </div>
                    ) : item.result.erro_salvar ? (
                      <div className="flex items-start gap-2 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-md">
                        <AlertCircle className="w-3.5 h-3.5 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-yellow-800">{item.result.erro_salvar}</p>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Import History ───────────────────────────────────────────────── */}
      {history.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-neutral-900">Histórico de importações</h2>
            <button
              onClick={clearHistory}
              className="flex items-center gap-1 text-xs text-neutral-400 hover:text-neutral-700 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Limpar histórico
            </button>
          </div>
          <div className="neon-card bg-white rounded-lg border border-neutral-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-50">
                  <th className="text-left text-xs font-medium text-neutral-500 px-4 py-3">Data/hora</th>
                  <th className="text-left text-xs font-medium text-neutral-500 px-4 py-3">Arquivo</th>
                  <th className="text-left text-xs font-medium text-neutral-500 px-4 py-3">Tipo</th>
                  <th className="text-right text-xs font-medium text-neutral-500 px-4 py-3">Registros</th>
                  <th className="text-center text-xs font-medium text-neutral-500 px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h, i) => {
                  const cfg = TIPO_CONFIG[h.tipo] ?? DEFAULT_TIPO;
                  return (
                    <tr
                      key={h.id}
                      className={cn(
                        "hover:bg-neutral-50 transition-colors",
                        i < history.length - 1 && "border-b border-neutral-50"
                      )}
                    >
                      <td className="px-4 py-3 text-xs text-neutral-500 whitespace-nowrap">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {fDateTime(h.timestamp)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1.5 text-xs text-neutral-700">
                          <FileSpreadsheet className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
                          <span className="max-w-[160px] truncate">{h.filename}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold border", cfg.color, cfg.bg, cfg.border)}>
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-xs font-medium text-neutral-900">
                        {h.registros}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {h.status === "sucesso" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-50 text-green-700 border border-green-200">
                            <CheckCircle2 className="w-3 h-3" /> Sucesso
                          </span>
                        )}
                        {h.status === "parcial" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-yellow-50 text-yellow-700 border border-yellow-200">
                            <AlertCircle className="w-3 h-3" /> Parcial
                          </span>
                        )}
                        {h.status === "erro" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-50 text-red-700 border border-red-200">
                            <X className="w-3 h-3" /> Erro
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── Format Tips ──────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-sm font-semibold text-neutral-900">Dicas de formato</h2>
          <span className="text-xs text-neutral-400">— a IA adapta automaticamente, mas estas colunas ajudam</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          {[
            {
              Icon: FileText,
              label: "Licitações",
              color: "text-blue-600",
              bg: "bg-blue-50",
              border: "border-blue-200",
              cols: ["Órgão", "Nº Processo", "Valor", "Data Pregão", "Status", "UF"],
            },
            {
              Icon: Users,
              label: "Fornecedores",
              color: "text-green-600",
              bg: "bg-green-50",
              border: "border-green-200",
              cols: ["Nome", "CNPJ", "E-mail", "WhatsApp", "Categorias", "UF"],
            },
            {
              Icon: ClipboardList,
              label: "Cotações",
              color: "text-purple-600",
              bg: "bg-purple-50",
              border: "border-purple-200",
              cols: ["Item", "Fornecedor", "Preço Unit.", "Marca", "Prazo", "Unidade"],
            },
            {
              Icon: Tag,
              label: "Itens de Edital",
              color: "text-orange-600",
              bg: "bg-orange-50",
              border: "border-orange-200",
              cols: ["Nº Item", "Descrição", "Quantidade", "Unidade", "Categoria"],
            },
          ].map(({ Icon, label, color, bg, border, cols }) => (
            <div key={label} className={cn("rounded-lg border p-4", bg, border)}>
              <div className="flex items-center gap-2 mb-3">
                <Icon className={cn("w-4 h-4", color)} />
                <span className={cn("text-xs font-semibold", color)}>{label}</span>
              </div>
              <div className="space-y-1">
                {cols.map((col) => (
                  <div key={col} className="flex items-center gap-1.5">
                    <div className={cn("w-1 h-1 rounded-full flex-shrink-0", color.replace("text-", "bg-"))} />
                    <span className="text-[11px] text-neutral-700">{col}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-neutral-400 mt-2 text-center">
          Não precisa seguir exatamente — a IA adapta automaticamente ao formato da sua planilha
        </p>
      </div>

    </div>
  );
}
