"use client";

import { useState } from "react";
import { TrendingUp } from "lucide-react";
import { OpportunityScoreCard } from "@/components/analise-oportunidade/OpportunityScoreCard";
import { OpportunityCriteriaTable } from "@/components/analise-oportunidade/OpportunityCriteriaTable";
import { OpportunityAlerts } from "@/components/analise-oportunidade/OpportunityAlerts";
import type { OportunidadeLicitacao } from "@/types/oportunidade";

const oportunidades: OportunidadeLicitacao[] = [
  {
    id: "1",
    orgao: "Secretaria Municipal de Saúde de Nova Iguaçu",
    numero_processo: "PE-SMSNIgu-023/2025",
    valor_estimado: 485000,
    data_pregao: "2025-06-12",
    score: 78,
    atratividade: "alta",
    margem_estimada: 18,
    risco_operacional: "baixo",
    itens_sem_fornecedor: 2,
    documentos_pendentes: 1,
    dias_ate_pregao: 23,
    criterios: [
      { nome: "Margem provável", nota: 8, peso: 3, status: "ok", descricao: "Margem de ~18% projetada com cotações atuais" },
      { nome: "Prazo do pregão", nota: 7, peso: 2, status: "ok", descricao: "23 dias — tempo suficiente para preparar proposta" },
      { nome: "Quantidade de itens", nota: 9, peso: 2, status: "ok", descricao: "14 itens, todos no portfólio habitual" },
      { nome: "Local de entrega", nota: 9, peso: 1, status: "ok", descricao: "Nova Iguaçu — dentro da região de atuação" },
      { nome: "Histórico do órgão", nota: 8, peso: 2, status: "ok", descricao: "SMS Nova Iguaçu paga em até 30 dias, sem inadimplência" },
      { nome: "Concorrência provável", nota: 7, peso: 2, status: "ok", descricao: "2–3 concorrentes habituais, mercado não saturado" },
      { nome: "Documentos exigidos", nota: 6, peso: 2, status: "atencao", descricao: "Alvará sanitário vence em 45 dias — renovar antes do pregão" },
      { nome: "Fornecedores disponíveis", nota: 7, peso: 2, status: "atencao", descricao: "2 itens ainda sem cotação confirmada" },
      { nome: "Risco regulatório", nota: 9, peso: 1, status: "ok", descricao: "Todos os itens com registro Anvisa vigente" },
      { nome: "Capital necessário", nota: 8, peso: 1, status: "ok", descricao: "Valor acessível com capital de giro atual" },
    ],
    alertas: [
      { tipo: "documento", mensagem: "Alvará sanitário vence em 45 dias — renovar antes do pregão de 12/06", severidade: "media" },
      { tipo: "fornecedor", mensagem: "2 itens críticos sem fornecedor confirmado: Equipo macrogotas e Sonda vesical", severidade: "media" },
    ],
  },
  {
    id: "2",
    orgao: "Prefeitura de Duque de Caxias — Secretaria de Saúde",
    numero_processo: "PP-PMDCaxias-041/2025",
    valor_estimado: 1240000,
    data_pregao: "2025-05-30",
    score: 44,
    atratividade: "media",
    margem_estimada: 11,
    risco_operacional: "medio",
    itens_sem_fornecedor: 6,
    documentos_pendentes: 3,
    dias_ate_pregao: 10,
    criterios: [
      { nome: "Margem provável", nota: 5, peso: 3, status: "atencao", descricao: "Margem reduzida pela alta competitividade no pregão" },
      { nome: "Prazo do pregão", nota: 3, peso: 2, status: "risco", descricao: "Apenas 10 dias — cotações incompletas para todos os itens" },
      { nome: "Quantidade de itens", nota: 4, peso: 2, status: "atencao", descricao: "34 itens, alguns fora do portfólio habitual" },
      { nome: "Local de entrega", nota: 7, peso: 1, status: "ok", descricao: "Duque de Caxias — região acessível" },
      { nome: "Histórico do órgão", nota: 6, peso: 2, status: "atencao", descricao: "Histórico de atraso em pagamentos (60–90 dias)" },
      { nome: "Concorrência provável", nota: 4, peso: 2, status: "risco", descricao: "Pregão grande atrai distribuidores de grande porte" },
      { nome: "Documentos exigidos", nota: 3, peso: 2, status: "risco", descricao: "3 documentos pendentes: Balanço, CRF, Certidão Estadual" },
      { nome: "Fornecedores disponíveis", nota: 4, peso: 2, status: "risco", descricao: "6 itens sem fornecedor e prazo curto para cotar" },
      { nome: "Risco regulatório", nota: 7, peso: 1, status: "ok", descricao: "Maioria dos itens com Anvisa regular" },
      { nome: "Capital necessário", nota: 5, peso: 1, status: "atencao", descricao: "Volume alto exige capital de giro adicional" },
    ],
    alertas: [
      { tipo: "prazo", mensagem: "Prazo crítico: 10 dias para o pregão com cotações incompletas", severidade: "alta" },
      { tipo: "fornecedor", mensagem: "6 itens sem fornecedor confirmado — risco de não poder participar de lotes inteiros", severidade: "alta" },
      { tipo: "documento", mensagem: "3 documentos de habilitação pendentes: Balanço Patrimonial, CRF e Certidão Estadual RJ", severidade: "alta" },
      { tipo: "margem", mensagem: "Margem estimada de 11% está abaixo do mínimo recomendado de 15% para este perfil de risco", severidade: "media" },
      { tipo: "entrega", mensagem: "Entrega parcelada exigida em 3 endereços diferentes — custo logístico pode reduzir margem em 2–3%", severidade: "media" },
    ],
  },
  {
    id: "3",
    orgao: "Hospital Federal do Andaraí — MHFA",
    numero_processo: "PE-HFA-012/2025",
    valor_estimado: 312000,
    data_pregao: "2025-06-25",
    score: 85,
    atratividade: "alta",
    margem_estimada: 22,
    risco_operacional: "baixo",
    itens_sem_fornecedor: 0,
    documentos_pendentes: 0,
    dias_ate_pregao: 36,
    criterios: [
      { nome: "Margem provável", nota: 9, peso: 3, status: "ok", descricao: "Margem de ~22% com fornecedores já cotados" },
      { nome: "Prazo do pregão", nota: 9, peso: 2, status: "ok", descricao: "36 dias — tempo excelente para preparação" },
      { nome: "Quantidade de itens", nota: 8, peso: 2, status: "ok", descricao: "8 itens, todos no portfólio com estoque de fornecedores" },
      { nome: "Local de entrega", nota: 8, peso: 1, status: "ok", descricao: "Andaraí, Rio de Janeiro — logística simples" },
      { nome: "Histórico do órgão", nota: 9, peso: 2, status: "ok", descricao: "HFA paga em 30 dias corridos, zero inadimplência" },
      { nome: "Concorrência provável", nota: 8, peso: 2, status: "ok", descricao: "Itens específicos favorecem distribuidoras especializadas" },
      { nome: "Documentos exigidos", nota: 10, peso: 2, status: "ok", descricao: "Todos os documentos válidos e em dia" },
      { nome: "Fornecedores disponíveis", nota: 10, peso: 2, status: "ok", descricao: "100% dos itens com cotação e fornecedor confirmado" },
      { nome: "Risco regulatório", nota: 9, peso: 1, status: "ok", descricao: "Todos os produtos com Anvisa vigente" },
      { nome: "Capital necessário", nota: 9, peso: 1, status: "ok", descricao: "Valor compatível com capital de giro disponível" },
    ],
    alertas: [],
  },
  {
    id: "4",
    orgao: "Secretaria Estadual de Saúde do RJ — SES-RJ",
    numero_processo: "PE-SES-RJ-089/2025",
    valor_estimado: 3850000,
    data_pregao: "2025-06-05",
    score: 31,
    atratividade: "baixa",
    margem_estimada: 6,
    risco_operacional: "alto",
    itens_sem_fornecedor: 12,
    documentos_pendentes: 4,
    dias_ate_pregao: 16,
    criterios: [
      { nome: "Margem provável", nota: 2, peso: 3, status: "risco", descricao: "Margem projetada de 6% — abaixo do custo operacional mínimo" },
      { nome: "Prazo do pregão", nota: 3, peso: 2, status: "risco", descricao: "16 dias para organizar 48 itens — prazo inviável" },
      { nome: "Quantidade de itens", nota: 2, peso: 2, status: "risco", descricao: "48 itens — metade fora do portfólio habitual" },
      { nome: "Local de entrega", nota: 5, peso: 1, status: "atencao", descricao: "Múltiplos endereços no estado — frete expressivo" },
      { nome: "Histórico do órgão", nota: 4, peso: 2, status: "risco", descricao: "SES-RJ tem histórico de atrasos superiores a 120 dias" },
      { nome: "Concorrência provável", nota: 2, peso: 2, status: "risco", descricao: "Grandes distribuidoras nacionais participam com poder de compra superior" },
      { nome: "Documentos exigidos", nota: 2, peso: 2, status: "risco", descricao: "4 documentos críticos pendentes incluindo certificação técnica" },
      { nome: "Fornecedores disponíveis", nota: 2, peso: 2, status: "risco", descricao: "12 itens sem fornecedor — inclui 4 itens com exigência Anvisa especial" },
      { nome: "Risco regulatório", nota: 4, peso: 1, status: "risco", descricao: "Alguns itens exigem registro específico ainda não obtido" },
      { nome: "Capital necessário", nota: 2, peso: 1, status: "risco", descricao: "Volume exige capital de giro 4x acima do disponível" },
    ],
    alertas: [
      { tipo: "margem", mensagem: "Margem estimada de 6% não cobre custos operacionais mínimos da POWER MED", severidade: "alta" },
      { tipo: "fornecedor", mensagem: "12 itens sem fornecedor — impossível montar proposta competitiva completa", severidade: "alta" },
      { tipo: "documento", mensagem: "4 documentos críticos pendentes: Certidão CREA, Certificação ISO, CRF e Balanço", severidade: "alta" },
      { tipo: "anvisa", mensagem: "4 itens exigem registro Anvisa especial de dispensação que a POWER MED não possui", severidade: "alta" },
      { tipo: "prazo", mensagem: "16 dias é insuficiente para organizar 48 itens e regularizar documentação", severidade: "alta" },
      { tipo: "entrega", mensagem: "Entrega em 12 cidades do estado — custo logístico inviabiliza a margem", severidade: "media" },
    ],
  },
];

export default function AnaliseOportunidadePage() {
  const [selectedId, setSelectedId] = useState("1");
  const oportunidade = oportunidades.find((o) => o.id === selectedId) ?? oportunidades[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#1A56DB]" />
            Análise da Oportunidade
          </h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            Avalie se vale disputar uma licitação antes de comprometer recursos
          </p>
        </div>

        {/* Selector de licitação */}
        <div className="flex flex-col items-end gap-1">
          <label className="text-xs font-medium text-neutral-500">Licitação analisada</label>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="text-sm border border-neutral-200 rounded-md px-3 py-1.5 bg-white text-neutral-800 focus:outline-none focus:ring-2 focus:ring-[#1A56DB] min-w-[320px]"
          >
            {oportunidades.map((o) => (
              <option key={o.id} value={o.id}>
                {o.orgao}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Score card + métricas */}
      <OpportunityScoreCard oportunidade={oportunidade} />

      {/* Critérios */}
      <OpportunityCriteriaTable criterios={oportunidade.criterios} />

      {/* Alertas */}
      <OpportunityAlerts alertas={oportunidade.alertas} />
    </div>
  );
}
