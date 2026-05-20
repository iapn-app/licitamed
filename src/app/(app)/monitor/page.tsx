"use client";

import { useState, useEffect, useRef } from "react";
import {
  Radio,
  Search,
  CheckCircle2,
  X,
  ExternalLink,
  Clock,
  TrendingUp,
  FileText,
  DollarSign,
  Bell,
  AlertCircle,
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
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const UFS = [
  "AC", "AL", "AM", "AP", "BA", "CE", "DF", "ES", "GO",
  "MA", "MG", "MS", "MT", "PA", "PB", "PE", "PI", "PR",
  "RJ", "RN", "RO", "RR", "RS", "SC", "SE", "SP", "TO",
];

type StatusHistorico = "importado" | "visualizado" | "ignorado";

interface EditalPNCP {
  id: string;
  orgao: string;
  municipio: string;
  uf: string;
  objeto: string;
  valor: number | null;
  dataAbertura: string | null;
  dataPublicacao: string;
  link: string;
}

interface HistoricoEdital {
  id: string;
  dataHora: string;
  orgao: string;
  uf: string;
  objeto: string;
  valor: number;
  status: StatusHistorico;
}

interface PNCPContratacao {
  numeroControlePNCP?: string;
  unidadeOrgao?: {
    nomeUnidade?: string;
    municipioNome?: string;
    ufSigla?: string;
  };
  orgaoEntidade?: { razaoSocial?: string };
  objetoCompra?: string;
  valorTotalEstimado?: number;
  dataAberturaProposta?: string;
  dataPublicacaoPncp?: string;
  linkSistemaOrigem?: string;
}

interface PNCPResponse {
  data?: PNCPContratacao[];
  useMock?: boolean;
  error?: string;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_EDITAIS: EditalPNCP[] = [
  {
    id: "mock-1",
    orgao: "Prefeitura Municipal de Campinas",
    municipio: "Campinas",
    uf: "SP",
    objeto:
      "Aquisição de materiais de curativo hospitalar — curativos simples, complexos e especiais para UTI e pronto-socorro",
    valor: 890000,
    dataAbertura: new Date(Date.now() + 5 * 86400000).toISOString(),
    dataPublicacao: new Date(Date.now() - 90 * 60000).toISOString(),
    link: "#",
  },
  {
    id: "mock-2",
    orgao: "Secretaria de Estado da Saúde de MG",
    municipio: "Belo Horizonte",
    uf: "MG",
    objeto:
      "Registro de preços para aquisição de luvas descartáveis (cirúrgicas e de procedimento) e demais descartáveis hospitalares",
    valor: 2340000,
    dataAbertura: new Date(Date.now() + 7 * 86400000).toISOString(),
    dataPublicacao: new Date(Date.now() - 4 * 3600000).toISOString(),
    link: "#",
  },
  {
    id: "mock-3",
    orgao: "Hospital Federal dos Servidores do Estado",
    municipio: "Rio de Janeiro",
    uf: "RJ",
    objeto:
      "Aquisição de equipamentos hospitalares de monitorização e ventilação mecânica para UTI adulto",
    valor: 5100000,
    dataAbertura: new Date(Date.now() + 10 * 86400000).toISOString(),
    dataPublicacao: new Date(Date.now() - 6 * 3600000).toISOString(),
    link: "#",
  },
  {
    id: "mock-4",
    orgao: "Prefeitura Municipal de Salvador",
    municipio: "Salvador",
    uf: "BA",
    objeto:
      "Contratação para fornecimento de medicamentos — antibióticos, anti-inflamatórios e medicamentos de uso contínuo",
    valor: 1200000,
    dataAbertura: new Date(Date.now() + 3 * 86400000).toISOString(),
    dataPublicacao: new Date(Date.now() - 8 * 3600000).toISOString(),
    link: "#",
  },
  {
    id: "mock-5",
    orgao: "Ministério da Saúde",
    municipio: "Brasília",
    uf: "DF",
    objeto:
      "Aquisição de insumos laboratoriais para diagnóstico clínico — reagentes, meios de cultura e materiais para análises",
    valor: 7800000,
    dataAbertura: new Date(Date.now() + 14 * 86400000).toISOString(),
    dataPublicacao: new Date(Date.now() - 10 * 3600000).toISOString(),
    link: "#",
  },
];

const HISTORICO: HistoricoEdital[] = [];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

function formatDT(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isNovo(iso: string) {
  return Date.now() - new Date(iso).getTime() < 2 * 3600000;
}

function normalizePNCP(item: PNCPContratacao): EditalPNCP {
  return {
    id: item.numeroControlePNCP ?? Math.random().toString(36).slice(2),
    orgao:
      item.unidadeOrgao?.nomeUnidade ??
      item.orgaoEntidade?.razaoSocial ??
      "Órgão não informado",
    municipio: item.unidadeOrgao?.municipioNome ?? "",
    uf: item.unidadeOrgao?.ufSigla ?? "",
    objeto: item.objetoCompra ?? "Objeto não informado",
    valor: item.valorTotalEstimado ?? null,
    dataAbertura: item.dataAberturaProposta ?? null,
    dataPublicacao: item.dataPublicacaoPncp ?? new Date().toISOString(),
    link: item.linkSistemaOrigem ?? "#",
  };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function EditalSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-neutral-200 p-5 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-5 w-14 rounded-full" />
      </div>
      <Skeleton className="h-3 w-1/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <div className="flex items-center justify-between pt-3 border-t border-neutral-100">
        <Skeleton className="h-4 w-1/3" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-24 rounded-md" />
          <Skeleton className="h-8 w-24 rounded-md" />
        </div>
      </div>
    </div>
  );
}

const STATUS_STYLE: Record<StatusHistorico, string> = {
  importado: "bg-green-50 text-green-700 border-green-200",
  visualizado: "bg-neutral-100 text-neutral-600 border-neutral-200",
  ignorado: "bg-red-50 text-red-600 border-red-200",
};

const STATUS_LABEL: Record<StatusHistorico, string> = {
  importado: "Importado",
  visualizado: "Apenas visualizado",
  ignorado: "Ignorado",
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MonitorPage() {
  const [keywords, setKeywords] = useState<string[]>([
    "luva", "gaze", "seringa", "curativo", "máscara",
  ]);
  const [kwInput, setKwInput] = useState("");
  const [selectedUFs, setSelectedUFs] = useState<string[]>(["SP", "RJ", "MG"]);
  const [minValue, setMinValue] = useState("");
  const [maxValue, setMaxValue] = useState("");
  const [frequency, setFrequency] = useState("6h");
  const [alertEmail, setAlertEmail] = useState("");
  const [monitorActive, setMonitorActive] = useState(true);

  const [fetchState, setFetchState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [editais, setEditais] = useState<EditalPNCP[]>([]);
  const [usingMock, setUsingMock] = useState(false);
  const [lastScan, setLastScan] = useState("");

  const kwInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchEditais();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchEditais() {
    setFetchState("loading");
    setLastScan(new Date().toISOString());
    try {
      const res = await fetch("/api/pncp?tamanhoPagina=20");
      const data = (await res.json()) as PNCPResponse;

      if (data.useMock || !res.ok) {
        setEditais(MOCK_EDITAIS);
        setUsingMock(true);
      } else {
        const items = (data.data ?? []).map(normalizePNCP);
        setEditais(items.length > 0 ? items : MOCK_EDITAIS);
        setUsingMock(items.length === 0);
      }
      setFetchState("success");
    } catch {
      setEditais(MOCK_EDITAIS);
      setUsingMock(true);
      setFetchState("success");
    }
  }

  function addKeyword(kw: string) {
    const t = kw.trim().replace(/,+$/, "").trim();
    if (t && !keywords.includes(t)) setKeywords((p) => [...p, t]);
    setKwInput("");
  }

  function handleKwKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addKeyword(kwInput);
    } else if (e.key === "Backspace" && kwInput === "" && keywords.length > 0) {
      setKeywords((p) => p.slice(0, -1));
    }
  }

  function toggleUF(uf: string) {
    setSelectedUFs((p) => (p.includes(uf) ? p.filter((u) => u !== uf) : [...p, uf]));
  }

  const filteredEditais =
    keywords.length === 0
      ? editais
      : editais.filter((e) =>
          keywords.some(
            (kw) =>
              e.objeto.toLowerCase().includes(kw.toLowerCase()) ||
              e.orgao.toLowerCase().includes(kw.toLowerCase())
          )
        );

  const totalValor = filteredEditais.reduce((a, e) => a + (e.valor ?? 0), 0);
  const lastScanTime = lastScan
    ? new Date(lastScan).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    : "—";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <Radio className="w-5 h-5 text-[#06B6D4]" />
            <h1 className="text-xl font-semibold text-neutral-900">Monitor de Licitações</h1>
          </div>
          <p className="text-sm text-neutral-500">
            Editais hospitalares novos chegam até você automaticamente
          </p>
        </div>
        <span className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 border border-blue-200 rounded-full text-xs font-medium text-blue-700 whitespace-nowrap flex-shrink-0">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Conectado ao PNCP — API oficial do governo federal
        </span>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          {
            icon: FileText,
            color: "bg-blue-50",
            iconColor: "text-blue-600",
            label: "Editais hoje",
            value: fetchState === "success" ? String(filteredEditais.length) : "—",
            desc: "encontrados hoje",
          },
          {
            icon: TrendingUp,
            color: "bg-purple-50",
            iconColor: "text-purple-600",
            label: "Esta semana",
            value: "47",
            desc: "nos últimos 7 dias",
          },
          {
            icon: DollarSign,
            color: "bg-green-50",
            iconColor: "text-green-600",
            label: "Valor monitorado",
            value: fetchState === "success" ? formatBRL(totalValor) : "—",
            desc: "total dos editais de hoje",
          },
          {
            icon: Clock,
            color: "bg-orange-50",
            iconColor: "text-orange-600",
            label: "Último scan",
            value: lastScanTime,
            desc: "verificação automática",
          },
        ].map(({ icon: Icon, color, iconColor, label, value, desc }) => (
          <div
            key={label}
            className="neon-card bg-white rounded-lg border border-neutral-200 shadow-card p-5"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className={cn("w-8 h-8 rounded-md flex items-center justify-center", color)}>
                <Icon className={cn("w-4 h-4", iconColor)} />
              </div>
              <p className="text-xs font-medium text-neutral-500">{label}</p>
            </div>
            <p className="text-2xl font-semibold text-neutral-900 truncate">{value}</p>
            <p className="text-xs text-neutral-400 mt-0.5">{desc}</p>
          </div>
        ))}
      </div>

      {/* Config panel */}
      <div className="neon-card bg-white rounded-lg border border-neutral-200 shadow-card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-neutral-400" />
            <h2 className="text-sm font-semibold text-neutral-900">Configuração de alertas</h2>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="text-xs text-neutral-500">
              {monitorActive ? "Monitor ativo" : "Monitor inativo"}
            </span>
            <button
              onClick={() => setMonitorActive((v) => !v)}
              className={cn(
                "relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none",
                monitorActive ? "bg-[#06B6D4]" : "bg-neutral-200"
              )}
            >
              <span
                className={cn(
                  "inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform",
                  monitorActive ? "translate-x-4" : "translate-x-0.5"
                )}
              />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* Keywords tag input */}
          <div>
            <label className="text-xs font-medium text-neutral-600 mb-1.5 block">
              Palavras-chave{" "}
              <span className="text-neutral-400 font-normal">(Enter ou vírgula para adicionar)</span>
            </label>
            <div
              className="flex flex-wrap gap-1.5 min-h-[2.25rem] w-full rounded-md border border-neutral-200 bg-white px-2.5 py-1.5 focus-within:ring-2 focus-within:ring-[#06B6D4] focus-within:border-transparent cursor-text"
              onClick={() => kwInputRef.current?.focus()}
            >
              {keywords.map((kw) => (
                <span
                  key={kw}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs font-medium"
                >
                  {kw}
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setKeywords((p) => p.filter((k) => k !== kw)); }}
                    className="hover:text-blue-900"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              <input
                ref={kwInputRef}
                value={kwInput}
                onChange={(e) => setKwInput(e.target.value)}
                onKeyDown={handleKwKeyDown}
                onBlur={() => kwInput.trim() && addKeyword(kwInput)}
                placeholder={keywords.length === 0 ? "luva, gaze, seringa..." : ""}
                className="flex-1 min-w-[6rem] text-sm text-neutral-900 placeholder:text-neutral-400 bg-transparent focus:outline-none"
              />
            </div>
          </div>

          {/* UF checkboxes */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-neutral-600">Estados de interesse</label>
              <button
                type="button"
                onClick={() => setSelectedUFs((p) => (p.length === UFS.length ? [] : [...UFS]))}
                className="text-xs text-[#06B6D4] hover:text-[#0891B2] font-medium"
              >
                {selectedUFs.length === UFS.length ? "Desmarcar todos" : "Selecionar todos"}
              </button>
            </div>
            <div className="grid grid-cols-5 sm:grid-cols-9 gap-x-3 gap-y-2">
              {UFS.map((uf) => (
                <label key={uf} className="flex items-center gap-1.5 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={selectedUFs.includes(uf)}
                    onChange={() => toggleUF(uf)}
                    className="w-3.5 h-3.5 rounded border-neutral-300 accent-[#06B6D4] cursor-pointer"
                  />
                  <span className="text-xs text-neutral-600 group-hover:text-neutral-900 select-none">
                    {uf}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Value + frequency + email */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-medium text-neutral-600 mb-1.5 block">
                Valor mínimo
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400">
                  R$
                </span>
                <Input
                  placeholder="0"
                  value={minValue}
                  onChange={(e) => setMinValue(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-neutral-600 mb-1.5 block">
                Valor máximo
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400">
                  R$
                </span>
                <Input
                  placeholder="Sem limite"
                  value={maxValue}
                  onChange={(e) => setMaxValue(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-neutral-600 mb-1.5 block">
                Frequência de busca
              </label>
              <Select value={frequency} onValueChange={setFrequency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1h">A cada hora</SelectItem>
                  <SelectItem value="6h">A cada 6 horas</SelectItem>
                  <SelectItem value="1d">Uma vez ao dia</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-neutral-600 mb-1.5 block">
                E-mail para alertas
              </label>
              <Input
                type="email"
                placeholder="seuemail@empresa.com.br"
                value={alertEmail}
                onChange={(e) => setAlertEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <Button
              onClick={() => toast.success("Configurações salvas com sucesso!")}
              className="gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              Salvar configurações
            </Button>
          </div>
        </div>
      </div>

      {/* Editais encontrados hoje */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-neutral-900">Editais encontrados hoje</h2>
            {usingMock && fetchState === "success" && (
              <p className="text-xs text-neutral-400 mt-0.5 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Exibindo dados de exemplo — PNCP pode estar temporariamente indisponível
              </p>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchEditais}
            disabled={fetchState === "loading"}
            className="gap-1.5 text-xs"
          >
            {fetchState === "loading" ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-neutral-300 border-t-neutral-600 rounded-full animate-spin" />
                Buscando...
              </>
            ) : (
              <>
                <Search className="w-3.5 h-3.5" />
                Atualizar
              </>
            )}
          </Button>
        </div>

        {fetchState === "loading" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <EditalSkeleton key={i} />)}
          </div>
        )}

        {fetchState === "success" && filteredEditais.length === 0 && (
          <div className="bg-white rounded-lg border border-neutral-200 p-12 text-center">
            <FileText className="w-10 h-10 text-neutral-200 mx-auto mb-3" />
            <p className="text-sm font-medium text-neutral-600">
              Nenhum edital encontrado para suas palavras-chave hoje
            </p>
            <p className="text-xs text-neutral-400 mt-1">
              Adicione mais palavras-chave ou expanda os estados selecionados
            </p>
          </div>
        )}

        {fetchState === "success" && filteredEditais.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredEditais.map((edital) => (
              <div
                key={edital.id}
                className="neon-card bg-white rounded-lg border border-neutral-200 shadow-card p-5 flex flex-col gap-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-neutral-900 leading-snug">
                    {edital.orgao}
                  </p>
                  {isNovo(edital.dataPublicacao) && (
                    <span className="flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500 text-white">
                      NOVO
                    </span>
                  )}
                </div>

                {(edital.municipio || edital.uf) && (
                  <p className="text-xs text-neutral-500 -mt-1">
                    {edital.municipio ? `${edital.municipio}, ` : ""}{edital.uf}
                  </p>
                )}

                <p className="text-sm text-neutral-700 line-clamp-2 leading-relaxed">
                  {edital.objeto}
                </p>

                <div className="flex items-center gap-4 text-xs text-neutral-500 flex-wrap">
                  {edital.valor !== null && (
                    <span className="font-semibold text-neutral-900">
                      {formatBRL(edital.valor)}
                    </span>
                  )}
                  {edital.dataAbertura && (
                    <span>Abertura: {formatDT(edital.dataAbertura)}</span>
                  )}
                </div>

                <div className="flex gap-2 pt-3 border-t border-neutral-100 mt-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs h-8 gap-1"
                    onClick={() => {
                      if (edital.link && edital.link !== "#") {
                        window.open(edital.link, "_blank");
                      } else {
                        toast.info("Link não disponível neste exemplo");
                      }
                    }}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Ver edital completo
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 text-xs h-8"
                    onClick={() =>
                      toast.success("Edital adicionado à sua lista de licitações!", {
                        description: edital.orgao,
                      })
                    }
                  >
                    Importar para POWER MED
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Como funciona */}
      <div className="neon-card bg-white rounded-lg border border-neutral-200 shadow-card p-6">
        <h2 className="text-sm font-semibold text-neutral-900 mb-6">Como funciona</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          <div className="hidden md:block absolute top-5 left-[calc(33%+24px)] right-[calc(33%+24px)] h-px bg-neutral-200" />
          {(
            [
              {
                step: "1",
                icon: Bell,
                title: "Configure palavras-chave e regiões",
                desc: "Defina termos de busca como 'luva', 'seringa', 'curativo' e selecione os estados de interesse",
              },
              {
                step: "2",
                icon: Search,
                title: "Monitoramento automático",
                desc: "O POWER MED consulta o PNCP automaticamente e filtra editais hospitalares para você",
              },
              {
                step: "3",
                icon: FileText,
                title: "Alertas e importação",
                desc: "Você recebe um resumo por e-mail e importa o edital com um clique",
              },
            ] as const
          ).map(({ step, icon: Icon, title, desc }) => (
            <div key={step} className="flex flex-col items-center text-center gap-3 relative">
              <div className="w-11 h-11 rounded-full bg-[#ECFEFF] flex items-center justify-center flex-shrink-0 z-10">
                <Icon className="w-5 h-5 text-[#06B6D4]" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-[#06B6D4] uppercase tracking-widest mb-1">
                  Passo {step}
                </p>
                <p className="text-sm font-semibold text-neutral-900 mb-1">{title}</p>
                <p className="text-xs text-neutral-500 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Histórico */}
      <div>
        <h2 className="text-sm font-semibold text-neutral-900 mb-4">Histórico de alertas</h2>
        <div className="neon-card bg-white rounded-lg border border-neutral-200 shadow-card overflow-hidden">
          {HISTORICO.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-6">
              <div className="w-12 h-12 rounded-full bg-[#ECFEFF] flex items-center justify-center mb-4">
                <Bell className="w-6 h-6 text-[#06B6D4]" />
              </div>
              <p className="text-sm font-semibold text-neutral-800 mb-1">
                Nenhum alerta registrado ainda
              </p>
              <p className="text-xs text-neutral-400 max-w-xs">
                Os editais detectados pelo Monitor aparecerão aqui automaticamente.
              </p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-50">
                  <th className="text-left text-xs font-medium text-neutral-500 px-4 py-3">Data/hora</th>
                  <th className="text-left text-xs font-medium text-neutral-500 px-4 py-3">Órgão</th>
                  <th className="text-left text-xs font-medium text-neutral-500 px-4 py-3 hidden md:table-cell">UF</th>
                  <th className="text-left text-xs font-medium text-neutral-500 px-4 py-3 hidden lg:table-cell">Valor estimado</th>
                  <th className="text-left text-xs font-medium text-neutral-500 px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {HISTORICO.map((h, i) => (
                  <tr
                    key={h.id}
                    className={cn(
                      "hover:bg-neutral-50 transition-colors",
                      i < HISTORICO.length - 1 && "border-b border-neutral-50"
                    )}
                  >
                    <td className="px-4 py-3 text-xs text-neutral-500 whitespace-nowrap">
                      {formatDT(h.dataHora)}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs font-medium text-neutral-900">{h.orgao}</p>
                      <p className="text-[10px] text-neutral-400">{h.objeto}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-neutral-500 hidden md:table-cell">{h.uf}</td>
                    <td className="px-4 py-3 text-xs font-medium text-neutral-900 hidden lg:table-cell whitespace-nowrap">
                      {formatBRL(h.valor)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-block text-[10px] font-medium px-2 py-0.5 rounded-full border whitespace-nowrap",
                          STATUS_STYLE[h.status]
                        )}
                      >
                        {STATUS_LABEL[h.status]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
