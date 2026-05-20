import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const LICITACOES = [
  {
    nome: "Pregão Eletrônico nº 142/2024 — Material Hospitalar e Medicamentos",
    orgao: "Prefeitura de São Paulo — SMS",
    numero_processo: "6016.2024/0001-SP",
    valor_estimado: 19432000,
    data_pregao: "2026-06-18",
    status: "em_cotacao",
    progresso: 70,
    uf: "SP",
    municipio: "São Paulo",
    observacoes: "Pregão eletrônico de grande porte. Atenção para o credenciamento obrigatório no Comprasnet.",
  },
  {
    nome: "PE nº 78/2024 — Materiais Descartáveis e Medicamentos Básicos",
    orgao: "Secretaria de Saúde do Estado do RJ",
    numero_processo: "E-08/001/4521/2024",
    valor_estimado: 3850000,
    data_pregao: "2026-05-30",
    status: "proposta_pronta",
    progresso: 100,
    uf: "RJ",
    municipio: "Rio de Janeiro",
    observacoes: "Proposta finalizada e revisada. Aguardando envio no portal SIGA-RJ.",
  },
  {
    nome: "Tomada de Preços nº 12/2024 — Materiais Ortopédicos e Cirúrgicos",
    orgao: "Hospital das Clínicas — UFMG",
    numero_processo: "TP-HC-012/2024-MG",
    valor_estimado: 1280000,
    data_pregao: "2026-04-15",
    status: "vencida",
    progresso: 100,
    uf: "MG",
    municipio: "Belo Horizonte",
    observacoes: "Parabéns! Vencemos 5 dos 6 lotes. Assinatura do contrato prevista para 01/05.",
  },
  {
    nome: "PE nº 218/2024 — Reagentes e Insumos de Laboratório",
    orgao: "Ministério da Saúde — CONASS",
    numero_processo: "25000.142.518/2024-Federal",
    valor_estimado: 8900000,
    data_pregao: "2026-05-10",
    status: "perdida",
    progresso: 0,
    uf: "DF",
    municipio: "Brasília",
    observacoes: "Perdemos por margem pequena (R$ 0,32/unit). Revisar precificação de reagentes para próximas.",
  },
];

const FORNECEDORES = [
  { nome: "MedSupply Brasil Ltda", cnpj: "12.345.678/0001-90", email: "comercial@medsupply.com.br", whatsapp: "11999001001", categorias: ["Descartáveis", "Curativos", "EPIs"], score: 5, ativo: true, observacoes: "Fornecedor preferencial para descartáveis. Entrega rápida." },
  { nome: "Farma Distribuição Hospitalar S.A.", cnpj: "98.765.432/0001-11", email: "licitacoes@farmadist.com.br", whatsapp: "11988002002", categorias: ["Medicamentos", "Saneantes"], score: 4, ativo: true, observacoes: "Especialista em medicamentos genéricos. Preços competitivos." },
  { nome: "TechMed Equipamentos", cnpj: "11.222.333/0001-44", email: "vendas@techmed.com.br", whatsapp: "21977003003", categorias: ["Equipamentos", "Laboratório"], score: 4, ativo: true, observacoes: "Referência em equipamentos hospitalares. Assistência técnica inclusa." },
  { nome: "Cristália Produtos Químicos", cnpj: "44.555.666/0001-77", email: "cotacoes@cristalia.com.br", whatsapp: "19966004004", categorias: ["Medicamentos"], score: 5, ativo: true, observacoes: "Fabricante nacional. Certificação ANVISA em dia." },
  { nome: "SafeGuard EPIs e Descartáveis", cnpj: "77.888.999/0001-22", email: "comercial@safeguard.com.br", whatsapp: "11955005005", categorias: ["EPIs", "Descartáveis"], score: 3, ativo: false, observacoes: "Certificado de regularidade fiscal venceu em março. Cobrar renovação." },
  { nome: "Bandeirantes Hospitalar", cnpj: "55.444.333/0001-88", email: "licitacoes@bandeirantes.med.br", whatsapp: "11944006006", categorias: ["Curativos", "Descartáveis", "Saneantes"], score: 4, ativo: true, observacoes: "Bom histórico de entrega. Preços médios do mercado." },
  { nome: "Lab Diagnóstica Nacional", cnpj: "33.222.111/0001-99", email: "comercial@labdiagnostica.com.br", whatsapp: "11933007007", categorias: ["Laboratório"], score: 5, ativo: true, observacoes: "Especialista em reagentes e materiais de laboratório." },
  { nome: "Ortho Implantes e Materiais", cnpj: "22.111.000/0001-66", email: "vendas@orthoimplantes.com.br", whatsapp: "21922008008", categorias: ["Ortopedia", "Equipamentos"], score: 4, ativo: true, observacoes: "Importador de próteses e implantes ortopédicos." },
  { nome: "Profilaxe Saneantes Ltda", cnpj: "66.777.888/0001-33", email: "comercial@profilaxe.com.br", whatsapp: "11911009009", categorias: ["Saneantes", "EPIs"], score: 3, ativo: true, observacoes: "Fornece para prefeituras do interior de SP." },
  { nome: "MedFlex Distribuidora", cnpj: "99.000.111/0001-55", email: "cotacoes@medflex.com.br", whatsapp: "11900010010", categorias: ["Descartáveis", "Curativos", "Medicamentos"], score: 4, ativo: true, observacoes: "Boa cobertura em SP e interior. Prazos competitivos." },
  { nome: "Clínica Suprimentos SP", cnpj: "11.000.222/0001-44", email: "vendas@clinicasuprimentos.com.br", whatsapp: "11800011011", categorias: ["Equipamentos", "Laboratório", "Descartáveis"], score: 3, ativo: false, observacoes: "Documento de regularidade trabalhista pendente." },
  { nome: "NovaMed Comércio e Distribuição", cnpj: "44.333.222/0001-11", email: "licitacoes@novamed.com.br", whatsapp: "11700012012", categorias: ["Medicamentos", "Saneantes", "Curativos"], score: 5, ativo: true, observacoes: "Excelente histórico de preço e entrega. Parceiro estratégico." },
];

export async function POST() {
  const { count: licitacoesCount } = await supabase
    .from("licitacoes")
    .select("*", { count: "exact", head: true });

  const { count: fornecedoresCount } = await supabase
    .from("fornecedores")
    .select("*", { count: "exact", head: true });

  const results: Record<string, unknown> = {};

  if ((licitacoesCount ?? 0) === 0) {
    const { error, count } = await supabase.from("licitacoes").insert(LICITACOES, { count: "exact" });
    results.licitacoes = error ? { error: error.message } : { inserted: count };
  } else {
    results.licitacoes = { skipped: `${licitacoesCount} registros já existem` };
  }

  if ((fornecedoresCount ?? 0) === 0) {
    const { error, count } = await supabase.from("fornecedores").insert(FORNECEDORES, { count: "exact" });
    results.fornecedores = error ? { error: error.message } : { inserted: count };
  } else {
    results.fornecedores = { skipped: `${fornecedoresCount} registros já existem` };
  }

  return NextResponse.json({ ok: true, results });
}

export async function DELETE() {
  const tables = ["cotacao_itens", "cotacoes", "itens_licitacao", "licitacoes", "fornecedores"];
  const results: Record<string, unknown> = {};
  for (const table of tables) {
    const { error, count } = await supabase.from(table).delete({ count: "exact" }).not("id", "is", null);
    results[table] = error ? { error: error.message } : { deleted: count };
  }
  return NextResponse.json({ ok: true, results });
}

export async function GET() {
  return NextResponse.json(
    { error: "Use POST para seed, DELETE para limpar" },
    { status: 405 }
  );
}
