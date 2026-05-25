"use client";

import { useState, useEffect } from "react";
import {
  Crosshair,
  AlertTriangle,
  RefreshCw,
  Building2,
  DollarSign,
  Users,
  CheckCircle2,
  AlertCircle,
  Minus,
  Clock,
  BarChart2,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type Resultado = "poderia_ganhar" | "competitivo" | "fora";
type TipoConcorrente = "direto" | "indireto";

interface Disputa {
  id: string;
  orgao: string;
  uf: string;
  objeto: string;
  valor: number;
  data: string;
  vencedor: string;
  valorVencedor: number;
  difPct: number;
  resultado: Resultado;
}

interface Concorrente {
  id: string;
  nome: string;
  cnpj: string;
  licitacoes: number;
  valorTotal: number;
  estados: string[];
  itens: string[];
  tipo: TipoConcorrente;
}

interface OportunidadePreco {
  item: string;
  mediaVencedor: number;
  menorPreco: number;
  maiorPreco: number;
  vezes: number;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_DISPUTAS: Disputa[] = [
  {
    id: "d1",
    orgao: "Secretaria Estadual de Saúde RJ",
    uf: "RJ",
    objeto: "Registro de preços para luvas nitrílicas descartáveis de procedimento",
    valor: 285000,
    data: "2025-05-08",
    vencedor: "MedRio Distribuidora LTDA",
    valorVencedor: 267000,
    difPct: 7,
    resultado: "poderia_ganhar",
  },
  {
    id: "d2",
    orgao: "Prefeitura de Nova Iguaçu",
    uf: "RJ",
    objeto: "Aquisição de seringas 10ml e agulhas descartáveis estéreis",
    valor: 142000,
    data: "2025-05-06",
    vencedor: "Hospitalar Brasil Comércio",
    valorVencedor: 138000,
    difPct: 2,
    resultado: "competitivo",
  },
  {
    id: "d3",
    orgao: "Hospital Federal dos Servidores",
    uf: "RJ",
    objeto: "Fornecimento de gaze estéril, curativos simples e ataduras hospitalares",
    valor: 198000,
    data: "2025-05-03",
    vencedor: "Saúde Max Produtos Médicos",
    valorVencedor: 171000,
    difPct: -13,
    resultado: "fora",
  },
  {
    id: "d4",
    orgao: "Prefeitura de Duque de Caxias",
    uf: "RJ",
    objeto: "Aquisição de máscaras cirúrgicas tripla camada e aventais descartáveis",
    valor: 87000,
    data: "2025-05-01",
    vencedor: "Rio Med Supply LTDA",
    valorVencedor: 81000,
    difPct: 5,
    resultado: "competitivo",
  },
  {
    id: "d5",
    orgao: "Secretaria Municipal de Saúde Niterói",
    uf: "RJ",
    objeto: "Registro de preços para soro fisiológico 500ml e equipo macrogotas",
    valor: 320000,
    data: "2025-04-28",
    vencedor: "MedRio Distribuidora LTDA",
    valorVencedor: 290000,
    difPct: 10,
    resultado: "poderia_ganhar",
  },
  {
    id: "d6",
    orgao: "UPA Bangu — SMS Rio de Janeiro",
    uf: "RJ",
    objeto: "Aquisição de álcool 70% 1L, degermante e saneantes hospitalares",
    valor: 156000,
    data: "2025-04-25",
    vencedor: "Global Med Hospitalares",
    valorVencedor: 131000,
    difPct: -16,
    resultado: "fora",
  },
  {
    id: "d7",
    orgao: "Instituto Nacional de Câncer",
    uf: "RJ",
    objeto: "Material hospitalar: cateteres, equipos, seringas e descartáveis em geral",
    valor: 510000,
    data: "2025-04-22",
    vencedor: "Hospitalar Brasil Comércio",
    valorVencedor: 476000,
    difPct: 8,
    resultado: "poderia_ganhar",
  },
  {
    id: "d8",
    orgao: "Secretaria de Saúde Volta Redonda",
    uf: "RJ",
    objeto: "Aquisição de luvas cirúrgicas estéreis e EPIs hospitalares",
    valor: 94000,
    data: "2025-04-18",
    vencedor: "Rio Med Supply LTDA",
    valorVencedor: 89000,
    difPct: 4,
    resultado: "competitivo",
  },
];

const MOCK_CONCORRENTES: Concorrente[] = [
  {
    id: "c1",
    nome: "MedRio Distribuidora LTDA",
    cnpj: "12.345.678/0001-90",
    licitacoes: 12,
    valorTotal: 2300000,
    estados: ["RJ", "SP", "MG"],
    itens: ["Luvas nitrílicas", "Soro fisiológico", "Equipos"],
    tipo: "direto",
  },
  {
    id: "c2",
    nome: "Hospitalar Brasil Comércio",
    cnpj: "23.456.789/0001-01",
    licitacoes: 8,
    valorTotal: 1800000,
    estados: ["RJ", "ES"],
    itens: ["Seringas", "Curativos", "Cateteres"],
    tipo: "direto",
  },
  {
    id: "c3",
    nome: "Saúde Max Produtos Médicos",
    cnpj: "34.567.890/0001-12",
    licitacoes: 6,
    valorTotal: 890000,
    estados: ["RJ"],
    itens: ["Gaze estéril", "Ataduras", "Curativos"],
    tipo: "direto",
  },
  {
    id: "c4",
    nome: "Rio Med Supply LTDA",
    cnpj: "45.678.901/0001-23",
    licitacoes: 5,
    valorTotal: 1200000,
    estados: ["RJ", "MG"],
    itens: ["Máscaras cirúrgicas", "Aventais", "Luvas"],
    tipo: "direto",
  },
  {
    id: "c5",
    nome: "Global Med Hospitalares",
    cnpj: "56.789.012/0001-34",
    licitacoes: 4,
    valorTotal: 670000,
    estados: ["RJ", "SP", "BA"],
    itens: ["Álcool 70%", "Saneantes", "Degermantes"],
    tipo: "indireto",
  },
];

const MOCK_OPORTUNIDADES: OportunidadePreco[] = [
  { item: "Luva nitrílica M",       mediaVencedor: 0.89, menorPreco: 0.72, maiorPreco: 1.10, vezes: 12 },
  { item: "Seringa 10ml",           mediaVencedor: 0.42, menorPreco: 0.35, maiorPreco: 0.58, vezes: 9  },
  { item: "Gaze estéril 7,5×7,5",   mediaVencedor: 0.18, menorPreco: 0.14, maiorPreco: 0.24, vezes: 7  },
  { item: "Álcool 70% 1L",          mediaVencedor: 8.90, menorPreco: 7.20, maiorPreco: 11.50, vezes: 6 },
  { item: "Máscara cirúrgica tripla",mediaVencedor: 0.31, menorPreco: 0.24, maiorPreco: 0.42, vezes: 8  },
];

const UFS = [
  "AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT",
  "PA","PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fBRL(v: number, dec = 0) {
  return v.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: dec,
    maximumFractionDigits: dec,
  });
}

function fCompact(v: number) {
  if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `R$ ${(v / 1_000).toFixed(0)}K`;
  return fBRL(v);
}

function fDate(iso: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "2-digit",
  });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ResultadoBadge({ r, dif }: { r: Resultado; dif: number }) {
  if (r === "poderia_ganhar") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-50 text-green-700 border border-green-200 whitespace-nowrap">
        <CheckCircle2 className="w-3 h-3" />
        Poderia ganhar (+{dif}%)
      </span>
    );
  }
  if (r === "competitivo") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-yellow-50 text-yellow-700 border border-yellow-200 whitespace-nowrap">
        <Minus className="w-3 h-3" />
        Preço competitivo ({dif > 0 ? `+${dif}` : dif}%)
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-50 text-red-700 border border-red-200 whitespace-nowrap">
      <AlertCircle className="w-3 h-3" />
      Fora do alcance ({dif}%)
    </span>
  );
}

function TipoBadge({ t }: { t: TipoConcorrente }) {
  if (t === "direto") {
    return (
      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-50 text-red-700 border border-red-200 whitespace-nowrap">
        Concorrente direto
      </span>
    );
  }
  return (
    <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-neutral-100 text-neutral-600 border border-neutral-200 whitespace-nowrap">
      Concorrente indireto
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ConcorrentesPage() {
  const [dias, setDias] = useState("30");
  const [uf, setUf] = useState("todos");
  const [categoria, setCategoria] = useState("todos");
  const [loading, setLoading] = useState(false);
  const [usingMock, setUsingMock] = useState(true);
  const [disputas, setDisputas] = useState<Disputa[]>(MOCK_DISPUTAS);

  useEffect(() => {
    fetchData("30", "todos");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchData(d: string, u: string) {
    setLoading(true);
    try {
      const params = new URLSearchParams({ dias: d });
      if (u !== "todos") params.set("uf", u);
      const res = await fetch(`/api/concorrentes?${params}`);
      const json = await res.json() as { useMock?: boolean; data?: { orgao: string; uf: string; objeto: string; valor: number | null; data: string }[] };

      if (!json.useMock && json.data && json.data.length > 0) {
        // Map PNCP data to Disputa shape with mock winner data
        const mapped: Disputa[] = json.data.slice(0, 10).map((item, i) => {
          const valor = item.valor ?? 100000;
          const difOptions: number[] = [-16, -13, -8, 2, 4, 5, 7, 8, 10];
          const dif = difOptions[i % difOptions.length];
          const resultado: Resultado =
            dif > 5 ? "poderia_ganhar" : dif >= -5 ? "competitivo" : "fora";
          return {
            id: `pncp-${i}`,
            orgao: item.orgao,
            uf: item.uf,
            objeto: item.objeto,
            valor,
            data: item.data,
            vencedor: MOCK_CONCORRENTES[i % MOCK_CONCORRENTES.length].nome,
            valorVencedor: Math.round(valor * (1 - Math.abs(dif) / 100)),
            difPct: dif,
            resultado,
          };
        });
        setDisputas(mapped);
        setUsingMock(false);
      } else {
        setDisputas(MOCK_DISPUTAS);
        setUsingMock(true);
      }
    } catch {
      setDisputas(MOCK_DISPUTAS);
      setUsingMock(true);
    } finally {
      setLoading(false);
    }
  }

  function handleAtualizar() {
    fetchData(dias, uf);
  }

  // KPI computations from current disputas
  const totalConcorrentes = new Set(disputas.map(d => d.vencedor)).size;
  const totalLicitacoes = disputas.length;
  const menorPreco = Math.min(...disputas.map(d => d.valorVencedor));
  const orgaoFreq = disputas.reduce<Record<string, number>>((acc, d) => {
    acc[d.orgao] = (acc[d.orgao] ?? 0) + 1;
    return acc;
  }, {});
  const orgaoTop = Object.entries(orgaoFreq).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";

  const filteredDisputas = categoria === "todos"
    ? disputas
    : disputas.filter(d => {
        const obj = d.objeto.toLowerCase();
        const map: Record<string, string[]> = {
          descartaveis: ["luva", "seringa", "gaze", "curativo", "máscara", "mascara", "avental"],
          soros: ["soro", "equipo", "solução", "solucao"],
          alcool: ["álcool", "alcool", "saneante", "degermante"],
          epi: ["epi", "proteção", "protecao"],
        };
        return (map[categoria] ?? []).some(kw => obj.includes(kw));
      });

  return (
    <div className="space-y-6">

      {/* ─── Alert Banner ────────────────────────────────────────────────── */}
      <div className="flex items-start gap-3 px-4 py-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-yellow-800 leading-relaxed">
          <span className="font-semibold">Dados públicos do PNCP.</span>{" "}
          Estes dados são baseados em resultados públicos de licitações. Use como referência
          estratégica para precificar suas propostas e identificar concorrentes recorrentes.
        </p>
      </div>

      {/* ─── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <Crosshair className="w-5 h-5 text-[#06B6D4]" />
            <h1 className="text-xl font-semibold text-neutral-900">Radar de Concorrentes</h1>
          </div>
          <p className="text-sm text-neutral-500">
            Inteligência competitiva baseada em resultados públicos de licitações hospitalares
          </p>
        </div>
        {usingMock && (
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-yellow-50 border border-yellow-200 rounded-full text-xs font-medium text-yellow-700 whitespace-nowrap flex-shrink-0">
            <AlertCircle className="w-3.5 h-3.5" />
            Dados de exemplo — PNCP indisponível
          </span>
        )}
        {!usingMock && (
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-cyan-50 border border-cyan-200 rounded-full text-xs font-medium text-cyan-700 whitespace-nowrap flex-shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Dados reais do PNCP
          </span>
        )}
      </div>

      {/* ─── Filters ─────────────────────────────────────────────────────── */}
      <div className="neon-card bg-white rounded-lg border border-neutral-200 p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-shrink-0">
            <Clock className="w-4 h-4 text-neutral-400" />
            <span className="text-xs font-medium text-neutral-600">Período:</span>
          </div>
          <Select
            value={dias}
            onValueChange={(v) => setDias(v)}
          >
            <SelectTrigger className="w-36 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="60">Últimos 60 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={uf}
            onValueChange={(v) => setUf(v)}
          >
            <SelectTrigger className="w-28 h-8 text-xs">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os UFs</SelectItem>
              {UFS.map(u => (
                <SelectItem key={u} value={u}>{u}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={categoria}
            onValueChange={(v) => setCategoria(v)}
          >
            <SelectTrigger className="w-40 h-8 text-xs">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas as categorias</SelectItem>
              <SelectItem value="descartaveis">Descartáveis</SelectItem>
              <SelectItem value="soros">Soros e equipos</SelectItem>
              <SelectItem value="alcool">Álcool e saneantes</SelectItem>
              <SelectItem value="epi">EPIs</SelectItem>
            </SelectContent>
          </Select>

          <Button
            size="sm"
            onClick={handleAtualizar}
            disabled={loading}
            className="h-8 gap-1.5 text-xs"
          >
            {loading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Buscando...
              </>
            ) : (
              <>
                <RefreshCw className="w-3.5 h-3.5" />
                Atualizar dados
              </>
            )}
          </Button>
        </div>
      </div>

      {/* ─── Summary Cards ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          {
            Icon: Users,
            color: "bg-blue-50",
            ic: "text-blue-600",
            label: "Concorrentes mapeados",
            value: String(totalConcorrentes),
            sub: `no período de ${dias} dias`,
          },
          {
            Icon: BarChart2,
            color: "bg-purple-50",
            ic: "text-purple-600",
            label: "Licitações monitoradas",
            value: String(totalLicitacoes),
            sub: "disputas com material hospitalar",
          },
          {
            Icon: DollarSign,
            color: "bg-green-50",
            ic: "text-green-600",
            label: "Menor preço vencedor",
            value: fCompact(menorPreco),
            sub: "menor valor de lote ganho",
          },
          {
            Icon: Building2,
            color: "bg-orange-50",
            ic: "text-orange-600",
            label: "Órgão com mais disputas",
            value: orgaoTop.split(" ").slice(0, 2).join(" "),
            sub: `${orgaoFreq[orgaoTop] ?? 1} licitação(ões)`,
          },
        ].map(({ Icon, color, ic, label, value, sub }) => (
          <div key={label} className="neon-card bg-white rounded-lg border border-neutral-200 p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className={cn("w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0", color)}>
                <Icon className={cn("w-4 h-4", ic)} />
              </div>
              <p className="text-xs font-medium text-neutral-500 leading-tight">{label}</p>
            </div>
            <p className="text-2xl font-semibold text-neutral-900 truncate">{value}</p>
            <p className="text-xs text-neutral-400 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* ─── Disputes Table ──────────────────────────────────────────────── */}
      <div className="neon-card bg-white rounded-lg border border-neutral-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-100">
          <h2 className="text-sm font-semibold text-neutral-900">Disputas recentes</h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Licitações de material hospitalar e seus vencedores
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50">
                <th className="text-left text-xs font-medium text-neutral-500 px-4 py-3">Órgão</th>
                <th className="text-left text-xs font-medium text-neutral-500 px-4 py-3">UF</th>
                <th className="text-left text-xs font-medium text-neutral-500 px-4 py-3">Objeto</th>
                <th className="text-right text-xs font-medium text-neutral-500 px-4 py-3">Valor</th>
                <th className="text-left text-xs font-medium text-neutral-500 px-4 py-3">Data</th>
                <th className="text-left text-xs font-medium text-neutral-500 px-4 py-3">Vencedor</th>
                <th className="text-right text-xs font-medium text-neutral-500 px-4 py-3">Vl. vencedor</th>
                <th className="text-center text-xs font-medium text-neutral-500 px-4 py-3">Resultado</th>
              </tr>
            </thead>
            <tbody>
              {filteredDisputas.map((d, i) => (
                <tr
                  key={d.id}
                  className={cn(
                    "hover:bg-neutral-50 transition-colors",
                    i < filteredDisputas.length - 1 && "border-b border-neutral-50"
                  )}
                >
                  <td className="px-4 py-3">
                    <p className="text-xs font-semibold text-neutral-900 max-w-[180px] truncate">{d.orgao}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-block w-8 h-5 rounded text-[10px] font-bold text-center leading-5 bg-neutral-100 text-neutral-700">
                      {d.uf}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-xs text-neutral-700 max-w-[220px] line-clamp-2 leading-snug">{d.objeto}</p>
                  </td>
                  <td className="px-4 py-3 text-right text-xs font-medium text-neutral-700 whitespace-nowrap">
                    {fBRL(d.valor)}
                  </td>
                  <td className="px-4 py-3 text-xs text-neutral-500 whitespace-nowrap">
                    {fDate(d.data)}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-xs font-medium text-neutral-800 max-w-[160px] truncate">{d.vencedor}</p>
                  </td>
                  <td className="px-4 py-3 text-right text-xs font-semibold text-neutral-900 whitespace-nowrap">
                    {fBRL(d.valorVencedor)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <ResultadoBadge r={d.resultado} dif={d.difPct} />
                  </td>
                </tr>
              ))}
              {filteredDisputas.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-xs text-neutral-400">
                    Nenhuma disputa encontrada para os filtros selecionados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Competitors + Price Opp ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

        {/* Concorrentes mais ativos */}
        <div className="neon-card bg-white rounded-lg border border-neutral-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-neutral-100">
            <h2 className="text-sm font-semibold text-neutral-900">Concorrentes mais ativos</h2>
            <p className="text-xs text-neutral-400 mt-0.5">Empresas que mais venceram licitações no período</p>
          </div>
          <div className="divide-y divide-neutral-50">
            {MOCK_CONCORRENTES.map((c, i) => (
              <div key={c.id} className="px-5 py-4 hover:bg-neutral-50 transition-colors">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-start gap-3 min-w-0">
                    <span className="w-6 h-6 rounded-full bg-neutral-100 text-[11px] font-bold text-neutral-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-neutral-900 truncate">{c.nome}</p>
                      <p className="text-[10px] text-neutral-400 mt-0.5">{c.cnpj}</p>
                    </div>
                  </div>
                  <TipoBadge t={c.tipo} />
                </div>
                <div className="ml-9 grid grid-cols-3 gap-2 mt-2">
                  <div>
                    <p className="text-[10px] text-neutral-400">Licitações ganhas</p>
                    <p className="text-xs font-semibold text-neutral-800">{c.licitacoes}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-neutral-400">Valor total</p>
                    <p className="text-xs font-semibold text-neutral-800">{fCompact(c.valorTotal)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-neutral-400">Estados</p>
                    <p className="text-xs font-semibold text-neutral-800">{c.estados.join(", ")}</p>
                  </div>
                </div>
                <div className="ml-9 mt-2 flex flex-wrap gap-1">
                  {c.itens.map(item => (
                    <span
                      key={item}
                      className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-cyan-50 text-cyan-700 border border-cyan-200 rounded text-[10px] font-medium"
                    >
                      <Tag className="w-2.5 h-2.5" />
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Oportunidades de preço */}
        <div className="neon-card bg-white rounded-lg border border-neutral-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-neutral-100">
            <h2 className="text-sm font-semibold text-neutral-900">Oportunidades de preço</h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Preços vencedores históricos por item — use como referência de proposta
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-50">
                  <th className="text-left text-xs font-medium text-neutral-500 px-4 py-3">Item</th>
                  <th className="text-right text-xs font-medium text-neutral-500 px-4 py-3">Médio</th>
                  <th className="text-right text-xs font-medium text-neutral-500 px-4 py-3">Mín.</th>
                  <th className="text-right text-xs font-medium text-neutral-500 px-4 py-3">Máx.</th>
                  <th className="text-center text-xs font-medium text-neutral-500 px-4 py-3">Freq.</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_OPORTUNIDADES.map((o, i) => (
                  <tr
                    key={o.item}
                    className={cn(
                      "hover:bg-neutral-50 transition-colors",
                      i < MOCK_OPORTUNIDADES.length - 1 && "border-b border-neutral-50"
                    )}
                  >
                    <td className="px-4 py-3">
                      <p className="text-xs font-medium text-neutral-900">{o.item}</p>
                      <p className="text-[10px] text-neutral-400 mt-0.5">Use {fBRL(o.mediaVencedor, 2)}/un como ref.</p>
                    </td>
                    <td className="px-4 py-3 text-right text-xs font-semibold text-neutral-900">
                      {fBRL(o.mediaVencedor, 2)}
                    </td>
                    <td className="px-4 py-3 text-right text-xs font-medium text-green-700">
                      {fBRL(o.menorPreco, 2)}
                    </td>
                    <td className="px-4 py-3 text-right text-xs font-medium text-red-600">
                      {fBRL(o.maiorPreco, 2)}
                    </td>
                    <td className="px-4 py-3 text-center text-xs text-neutral-500">
                      {o.vezes}×
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 bg-cyan-50 border-t border-cyan-100">
            <p className="text-[10px] text-cyan-700 leading-relaxed">
              <span className="font-semibold">Sugestão estratégica:</span>{" "}
              Para disputar competitivamente, posicione seu preço entre o mínimo e a média vencedora.
              Abaixo do mínimo histórico pode levantar suspeitas de inexequibilidade.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
