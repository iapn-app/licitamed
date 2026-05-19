export type LicitacaoStatus =
  | "em_cotacao"
  | "proposta_pronta"
  | "em_disputa"
  | "vencida"
  | "perdida";

export type ItemCategoria =
  | "Descartáveis"
  | "Medicamentos"
  | "Equipamentos"
  | "Curativos"
  | "EPIs"
  | "Saneantes"
  | "Laboratório"
  | "Ortopedia";

export type ItemStatus = "cotado" | "aguardando" | "sem_cotacao";

export interface Fornecedor {
  id: string;
  nome: string;
  cnpj: string;
  email: string;
  whatsapp: string;
  categorias: ItemCategoria[];
  score: number;
  documentosOk: boolean;
  ultimaCotacao: string;
  observacoes: string;
  token: string;
}

export interface Item {
  id: string;
  numero: number;
  descricao: string;
  quantidade: number;
  unidade: string;
  categoria: ItemCategoria;
  fornecedorSugeridoId: string;
  status: ItemStatus;
  valorReferencia: number;
}

export interface Cotacao {
  id: string;
  licitacaoId: string;
  itemId: string;
  fornecedorId: string;
  precoUnitario: number;
  marca: string;
  prazoEntrega: number;
  observacao: string;
  respondidoEm: string;
}

export interface Licitacao {
  id: string;
  nome: string;
  orgao: string;
  numeroProcesso: string;
  valorEstimado: number;
  dataPregao: string;
  status: LicitacaoStatus;
  itens: Item[];
  fornecedoresIds: string[];
  observacoes: string;
  responsavel: string;
  modalidade: string;
  uf: string;
  municipio: string;
}

// ─── FORNECEDORES ─────────────────────────────────────────────────────────────

export const fornecedores: Fornecedor[] = [
  {
    id: "f1",
    nome: "MedSupply Brasil Ltda",
    cnpj: "12.345.678/0001-90",
    email: "comercial@medsupply.com.br",
    whatsapp: "11999001001",
    categorias: ["Descartáveis", "Curativos", "EPIs"],
    score: 5,
    documentosOk: true,
    ultimaCotacao: "2024-05-10",
    observacoes: "Fornecedor preferencial para descartáveis. Entrega rápida.",
    token: "tok_f1_abc123",
  },
  {
    id: "f2",
    nome: "Farma Distribuição Hospitalar S.A.",
    cnpj: "98.765.432/0001-11",
    email: "licitacoes@farmadist.com.br",
    whatsapp: "11988002002",
    categorias: ["Medicamentos", "Saneantes"],
    score: 4,
    documentosOk: true,
    ultimaCotacao: "2024-05-08",
    observacoes: "Especialista em medicamentos genéricos. Preços competitivos.",
    token: "tok_f2_def456",
  },
  {
    id: "f3",
    nome: "TechMed Equipamentos",
    cnpj: "11.222.333/0001-44",
    email: "vendas@techmed.com.br",
    whatsapp: "21977003003",
    categorias: ["Equipamentos", "Laboratório"],
    score: 4,
    documentosOk: true,
    ultimaCotacao: "2024-04-28",
    observacoes: "Referência em equipamentos hospitalares. Assistência técnica inclusa.",
    token: "tok_f3_ghi789",
  },
  {
    id: "f4",
    nome: "Cristália Produtos Químicos",
    cnpj: "44.555.666/0001-77",
    email: "cotacoes@cristalia.com.br",
    whatsapp: "19966004004",
    categorias: ["Medicamentos"],
    score: 5,
    documentosOk: true,
    ultimaCotacao: "2024-05-12",
    observacoes: "Fabricante nacional. Certificação ANVISA em dia.",
    token: "tok_f4_jkl012",
  },
  {
    id: "f5",
    nome: "SafeGuard EPIs e Descartáveis",
    cnpj: "77.888.999/0001-22",
    email: "comercial@safeguard.com.br",
    whatsapp: "11955005005",
    categorias: ["EPIs", "Descartáveis"],
    score: 3,
    documentosOk: false,
    ultimaCotacao: "2024-03-15",
    observacoes: "Certificado de regularidade fiscal venceu em março. Cobrar renovação.",
    token: "tok_f5_mno345",
  },
  {
    id: "f6",
    nome: "Bandeirantes Hospitalar",
    cnpj: "55.444.333/0001-88",
    email: "licitacoes@bandeirantes.med.br",
    whatsapp: "11944006006",
    categorias: ["Curativos", "Descartáveis", "Saneantes"],
    score: 4,
    documentosOk: true,
    ultimaCotacao: "2024-05-05",
    observacoes: "Bom histórico de entrega. Preços médios do mercado.",
    token: "tok_f6_pqr678",
  },
  {
    id: "f7",
    nome: "Lab Diagnóstica Nacional",
    cnpj: "33.222.111/0001-99",
    email: "comercial@labdiagnostica.com.br",
    whatsapp: "11933007007",
    categorias: ["Laboratório"],
    score: 5,
    documentosOk: true,
    ultimaCotacao: "2024-05-14",
    observacoes: "Especialista em reagentes e materiais de laboratório.",
    token: "tok_f7_stu901",
  },
  {
    id: "f8",
    nome: "Ortho Implantes e Materiais",
    cnpj: "22.111.000/0001-66",
    email: "vendas@orthoimplantes.com.br",
    whatsapp: "21922008008",
    categorias: ["Ortopedia", "Equipamentos"],
    score: 4,
    documentosOk: true,
    ultimaCotacao: "2024-04-20",
    observacoes: "Importador de próteses e implantes ortopédicos.",
    token: "tok_f8_vwx234",
  },
  {
    id: "f9",
    nome: "Profilaxe Saneantes Ltda",
    cnpj: "66.777.888/0001-33",
    email: "comercial@profilaxe.com.br",
    whatsapp: "11911009009",
    categorias: ["Saneantes", "EPIs"],
    score: 3,
    documentosOk: true,
    ultimaCotacao: "2024-04-10",
    observacoes: "Fornece para prefeituras do interior de SP.",
    token: "tok_f9_yza567",
  },
  {
    id: "f10",
    nome: "MedFlex Distribuidora",
    cnpj: "99.000.111/0001-55",
    email: "cotacoes@medflex.com.br",
    whatsapp: "11900010010",
    categorias: ["Descartáveis", "Curativos", "Medicamentos"],
    score: 4,
    documentosOk: true,
    ultimaCotacao: "2024-05-11",
    observacoes: "Boa cobertura em SP e interior. Prazos competitivos.",
    token: "tok_f10_bcd890",
  },
  {
    id: "f11",
    nome: "Clínica Suprimentos SP",
    cnpj: "11.000.222/0001-44",
    email: "vendas@clinicasuprimentos.com.br",
    whatsapp: "11800011011",
    categorias: ["Equipamentos", "Laboratório", "Descartáveis"],
    score: 3,
    documentosOk: false,
    ultimaCotacao: "2024-02-20",
    observacoes: "Documento de regularidade trabalhista pendente.",
    token: "tok_f11_efg123",
  },
  {
    id: "f12",
    nome: "NovaMed Comércio e Distribuição",
    cnpj: "44.333.222/0001-11",
    email: "licitacoes@novamed.com.br",
    whatsapp: "11700012012",
    categorias: ["Medicamentos", "Saneantes", "Curativos"],
    score: 5,
    documentosOk: true,
    ultimaCotacao: "2024-05-13",
    observacoes: "Excelente histórico de preço e entrega. Parceiro estratégico.",
    token: "tok_f12_hij456",
  },
];

// ─── ITENS DA LICITAÇÃO SP (347 itens — representamos 20 para o mock) ─────────

const itensSP: Item[] = [
  { id: "i_sp_1", numero: 1, descricao: "Agulha hipodérmica 40x12mm cx/100un", quantidade: 5000, unidade: "CX", categoria: "Descartáveis", fornecedorSugeridoId: "f1", status: "cotado", valorReferencia: 28.5 },
  { id: "i_sp_2", numero: 2, descricao: "Seringa descartável 10ml s/agulha cx/100un", quantidade: 8000, unidade: "CX", categoria: "Descartáveis", fornecedorSugeridoId: "f1", status: "cotado", valorReferencia: 42.0 },
  { id: "i_sp_3", numero: 3, descricao: "Luva cirúrgica estéril 7.5 par", quantidade: 12000, unidade: "PAR", categoria: "Descartáveis", fornecedorSugeridoId: "f6", status: "cotado", valorReferencia: 3.8 },
  { id: "i_sp_4", numero: 4, descricao: "Dipirona sódica 500mg/ml ampola 2ml cx/100", quantidade: 500, unidade: "CX", categoria: "Medicamentos", fornecedorSugeridoId: "f2", status: "cotado", valorReferencia: 95.0 },
  { id: "i_sp_5", numero: 5, descricao: "Amoxicilina 500mg cápsula cx/100un", quantidade: 2000, unidade: "CX", categoria: "Medicamentos", fornecedorSugeridoId: "f4", status: "cotado", valorReferencia: 32.5 },
  { id: "i_sp_6", numero: 6, descricao: "Curativo absorvente estéril 10x10cm cx/50", quantidade: 3000, unidade: "CX", categoria: "Curativos", fornecedorSugeridoId: "f6", status: "cotado", valorReferencia: 48.0 },
  { id: "i_sp_7", numero: 7, descricao: "Atadura de crepe 10cm x 1,80m cx/12un", quantidade: 6000, unidade: "CX", categoria: "Curativos", fornecedorSugeridoId: "f6", status: "aguardando", valorReferencia: 24.0 },
  { id: "i_sp_8", numero: 8, descricao: "Máscara cirúrgica tripla camada cx/50un", quantidade: 10000, unidade: "CX", categoria: "EPIs", fornecedorSugeridoId: "f5", status: "cotado", valorReferencia: 18.5 },
  { id: "i_sp_9", numero: 9, descricao: "Touca descartável TNT cx/100un", quantidade: 5000, unidade: "CX", categoria: "EPIs", fornecedorSugeridoId: "f5", status: "aguardando", valorReferencia: 15.0 },
  { id: "i_sp_10", numero: 10, descricao: "Álcool etílico 70% 1L", quantidade: 8000, unidade: "UN", categoria: "Saneantes", fornecedorSugeridoId: "f9", status: "cotado", valorReferencia: 12.9 },
  { id: "i_sp_11", numero: 11, descricao: "Hipoclorito de sódio 1% 1L", quantidade: 4000, unidade: "UN", categoria: "Saneantes", fornecedorSugeridoId: "f9", status: "cotado", valorReferencia: 8.5 },
  { id: "i_sp_12", numero: 12, descricao: "Glicosímetro digital c/ tiras cx/50", quantidade: 200, unidade: "KIT", categoria: "Laboratório", fornecedorSugeridoId: "f7", status: "cotado", valorReferencia: 185.0 },
  { id: "i_sp_13", numero: 13, descricao: "Fita glicemia 50 tiras refil", quantidade: 2000, unidade: "CX", categoria: "Laboratório", fornecedorSugeridoId: "f7", status: "sem_cotacao", valorReferencia: 62.0 },
  { id: "i_sp_14", numero: 14, descricao: "Nebulizador ultrassônico adulto/infantil", quantidade: 150, unidade: "UN", categoria: "Equipamentos", fornecedorSugeridoId: "f3", status: "cotado", valorReferencia: 320.0 },
  { id: "i_sp_15", numero: 15, descricao: "Estetoscópio adulto duplo", quantidade: 300, unidade: "UN", categoria: "Equipamentos", fornecedorSugeridoId: "f3", status: "aguardando", valorReferencia: 85.0 },
  { id: "i_sp_16", numero: 16, descricao: "Soro fisiológico 0,9% 500ml", quantidade: 20000, unidade: "UN", categoria: "Medicamentos", fornecedorSugeridoId: "f2", status: "cotado", valorReferencia: 7.2 },
  { id: "i_sp_17", numero: 17, descricao: "Cateter intravenoso 20G cx/100un", quantidade: 3000, unidade: "CX", categoria: "Descartáveis", fornecedorSugeridoId: "f1", status: "sem_cotacao", valorReferencia: 165.0 },
  { id: "i_sp_18", numero: 18, descricao: "Equipo de soro macrogotas cx/100un", quantidade: 2500, unidade: "CX", categoria: "Descartáveis", fornecedorSugeridoId: "f10", status: "cotado", valorReferencia: 95.0 },
  { id: "i_sp_19", numero: 19, descricao: "Omeprazol 20mg cápsula cx/30un", quantidade: 3000, unidade: "CX", categoria: "Medicamentos", fornecedorSugeridoId: "f12", status: "cotado", valorReferencia: 18.5 },
  { id: "i_sp_20", numero: 20, descricao: "Bandagem elástica 15cm x 5m", quantidade: 1000, unidade: "UN", categoria: "Curativos", fornecedorSugeridoId: "f6", status: "aguardando", valorReferencia: 22.0 },
];

const itensRJ: Item[] = [
  { id: "i_rj_1", numero: 1, descricao: "Seringa descartável 5ml c/agulha cx/100un", quantidade: 3000, unidade: "CX", categoria: "Descartáveis", fornecedorSugeridoId: "f1", status: "cotado", valorReferencia: 38.0 },
  { id: "i_rj_2", numero: 2, descricao: "Luva de procedimento M cx/100un", quantidade: 5000, unidade: "CX", categoria: "Descartáveis", fornecedorSugeridoId: "f1", status: "cotado", valorReferencia: 32.0 },
  { id: "i_rj_3", numero: 3, descricao: "Paracetamol 750mg comprimido cx/100un", quantidade: 4000, unidade: "CX", categoria: "Medicamentos", fornecedorSugeridoId: "f4", status: "cotado", valorReferencia: 22.0 },
  { id: "i_rj_4", numero: 4, descricao: "Ibuprofeno 600mg comprimido cx/50un", quantidade: 2500, unidade: "CX", categoria: "Medicamentos", fornecedorSugeridoId: "f2", status: "cotado", valorReferencia: 28.5 },
  { id: "i_rj_5", numero: 5, descricao: "Soro glicosado 5% 500ml", quantidade: 10000, unidade: "UN", categoria: "Medicamentos", fornecedorSugeridoId: "f12", status: "cotado", valorReferencia: 8.9 },
  { id: "i_rj_6", numero: 6, descricao: "Avental descartável TNT cx/50un", quantidade: 2000, unidade: "CX", categoria: "EPIs", fornecedorSugeridoId: "f5", status: "cotado", valorReferencia: 45.0 },
  { id: "i_rj_7", numero: 7, descricao: "Sabão líquido 5L galão", quantidade: 1500, unidade: "GL", categoria: "Saneantes", fornecedorSugeridoId: "f9", status: "cotado", valorReferencia: 35.0 },
  { id: "i_rj_8", numero: 8, descricao: "Curativo transparente 10x12cm cx/100un", quantidade: 1000, unidade: "CX", categoria: "Curativos", fornecedorSugeridoId: "f6", status: "cotado", valorReferencia: 125.0 },
];

const itensMG: Item[] = [
  { id: "i_mg_1", numero: 1, descricao: "Prótese de quadril cimentada par", quantidade: 50, unidade: "PAR", categoria: "Ortopedia", fornecedorSugeridoId: "f8", status: "cotado", valorReferencia: 4800.0 },
  { id: "i_mg_2", numero: 2, descricao: "Placa de fixação tibial titanium", quantidade: 30, unidade: "UN", categoria: "Ortopedia", fornecedorSugeridoId: "f8", status: "cotado", valorReferencia: 3200.0 },
  { id: "i_mg_3", numero: 3, descricao: "Parafuso cortical 4.5mm cx/10un", quantidade: 200, unidade: "CX", categoria: "Ortopedia", fornecedorSugeridoId: "f8", status: "cotado", valorReferencia: 850.0 },
  { id: "i_mg_4", numero: 4, descricao: "Kit artroscopia c/instrumentais", quantidade: 10, unidade: "KIT", categoria: "Equipamentos", fornecedorSugeridoId: "f3", status: "cotado", valorReferencia: 12500.0 },
  { id: "i_mg_5", numero: 5, descricao: "Fio de sutura absorvível 3-0 cx/12un", quantidade: 500, unidade: "CX", categoria: "Curativos", fornecedorSugeridoId: "f6", status: "cotado", valorReferencia: 145.0 },
  { id: "i_mg_6", numero: 6, descricao: "Drain tubular 1/4 cx/10un", quantidade: 300, unidade: "CX", categoria: "Descartáveis", fornecedorSugeridoId: "f10", status: "cotado", valorReferencia: 88.0 },
];

const itensFed: Item[] = [
  { id: "i_fed_1", numero: 1, descricao: "Reagente HbA1c caixa/100 testes", quantidade: 800, unidade: "CX", categoria: "Laboratório", fornecedorSugeridoId: "f7", status: "sem_cotacao", valorReferencia: 380.0 },
  { id: "i_fed_2", numero: 2, descricao: "Reagente glicose enzimática cx/500 testes", quantidade: 1200, unidade: "CX", categoria: "Laboratório", fornecedorSugeridoId: "f7", status: "sem_cotacao", valorReferencia: 220.0 },
];

// ─── COTAÇÕES ─────────────────────────────────────────────────────────────────

export const cotacoes: Cotacao[] = [
  // SP - item 1 (agulha) - 3 fornecedores
  { id: "c1", licitacaoId: "l1", itemId: "i_sp_1", fornecedorId: "f1", precoUnitario: 24.80, marca: "BD", prazoEntrega: 7, observacao: "", respondidoEm: "2024-05-08" },
  { id: "c2", licitacaoId: "l1", itemId: "i_sp_1", fornecedorId: "f10", precoUnitario: 26.50, marca: "Medix", prazoEntrega: 10, observacao: "Estoque garantido", respondidoEm: "2024-05-09" },
  { id: "c3", licitacaoId: "l1", itemId: "i_sp_1", fornecedorId: "f6", precoUnitario: 25.90, marca: "Solidor", prazoEntrega: 7, observacao: "", respondidoEm: "2024-05-10" },
  // SP - item 2 (seringa)
  { id: "c4", licitacaoId: "l1", itemId: "i_sp_2", fornecedorId: "f1", precoUnitario: 38.50, marca: "BD", prazoEntrega: 7, observacao: "", respondidoEm: "2024-05-08" },
  { id: "c5", licitacaoId: "l1", itemId: "i_sp_2", fornecedorId: "f10", precoUnitario: 40.20, marca: "Medix", prazoEntrega: 12, observacao: "", respondidoEm: "2024-05-09" },
  // SP - item 4 (dipirona)
  { id: "c6", licitacaoId: "l1", itemId: "i_sp_4", fornecedorId: "f2", precoUnitario: 82.00, marca: "Mariol", prazoEntrega: 14, observacao: "Genérico Anvisa", respondidoEm: "2024-05-07" },
  { id: "c7", licitacaoId: "l1", itemId: "i_sp_4", fornecedorId: "f4", precoUnitario: 91.50, marca: "Cristália", prazoEntrega: 10, observacao: "Fabricante nacional", respondidoEm: "2024-05-08" },
  { id: "c8", licitacaoId: "l1", itemId: "i_sp_4", fornecedorId: "f12", precoUnitario: 78.90, marca: "NovaMed", prazoEntrega: 7, observacao: "Preço especial licitação", respondidoEm: "2024-05-10" },
  // SP - item 14 (nebulizador)
  { id: "c9", licitacaoId: "l1", itemId: "i_sp_14", fornecedorId: "f3", precoUnitario: 285.00, marca: "Invacare", prazoEntrega: 21, observacao: "Garantia 1 ano", respondidoEm: "2024-05-06" },
  { id: "c10", licitacaoId: "l1", itemId: "i_sp_14", fornecedorId: "f11", precoUnitario: 310.00, marca: "Philips", prazoEntrega: 15, observacao: "", respondidoEm: "2024-05-09" },
  // RJ - cotações
  { id: "c11", licitacaoId: "l2", itemId: "i_rj_1", fornecedorId: "f1", precoUnitario: 34.20, marca: "BD", prazoEntrega: 7, observacao: "", respondidoEm: "2024-04-20" },
  { id: "c12", licitacaoId: "l2", itemId: "i_rj_2", fornecedorId: "f1", precoUnitario: 28.90, marca: "Supermax", prazoEntrega: 5, observacao: "Estoque imediato", respondidoEm: "2024-04-20" },
  { id: "c13", licitacaoId: "l2", itemId: "i_rj_3", fornecedorId: "f4", precoUnitario: 19.50, marca: "Cristália", prazoEntrega: 10, observacao: "", respondidoEm: "2024-04-19" },
  { id: "c14", licitacaoId: "l2", itemId: "i_rj_5", fornecedorId: "f12", precoUnitario: 7.80, marca: "Equiplex", prazoEntrega: 7, observacao: "", respondidoEm: "2024-04-21" },
  // MG - cotações
  { id: "c15", licitacaoId: "l3", itemId: "i_mg_1", fornecedorId: "f8", precoUnitario: 4200.00, marca: "Stryker", prazoEntrega: 30, observacao: "Importado", respondidoEm: "2024-03-10" },
  { id: "c16", licitacaoId: "l3", itemId: "i_mg_2", fornecedorId: "f8", precoUnitario: 2850.00, marca: "Synthes", prazoEntrega: 21, observacao: "", respondidoEm: "2024-03-10" },
];

// ─── LICITAÇÕES ───────────────────────────────────────────────────────────────

export const licitacoes: Licitacao[] = [
  {
    id: "l1",
    nome: "Pregão Eletrônico nº 142/2024 — Material Hospitalar e Medicamentos",
    orgao: "Prefeitura de São Paulo — SMS",
    numeroProcesso: "6016.2024/0001-SP",
    valorEstimado: 19432000.0,
    dataPregao: "2024-06-18",
    status: "em_cotacao",
    itens: itensSP,
    fornecedoresIds: ["f1", "f2", "f4", "f5", "f6", "f9", "f10", "f12"],
    observacoes: "Pregão eletrônico de grande porte. Atenção para o credenciamento obrigatório no Comprasnet.",
    responsavel: "Ana Paula Ferreira",
    modalidade: "Pregão Eletrônico",
    uf: "SP",
    municipio: "São Paulo",
  },
  {
    id: "l2",
    nome: "PE nº 78/2024 — Materiais Descartáveis e Medicamentos Básicos",
    orgao: "Secretaria de Saúde do Estado do RJ",
    numeroProcesso: "E-08/001/4521/2024",
    valorEstimado: 3850000.0,
    dataPregao: "2024-05-30",
    status: "proposta_pronta",
    itens: itensRJ,
    fornecedoresIds: ["f1", "f2", "f4", "f6", "f9", "f12"],
    observacoes: "Proposta finalizada e revisada. Aguardando envio no portal SIGA-RJ.",
    responsavel: "Carlos Eduardo Moura",
    modalidade: "Pregão Eletrônico",
    uf: "RJ",
    municipio: "Rio de Janeiro",
  },
  {
    id: "l3",
    nome: "Tomada de Preços nº 12/2024 — Materiais Ortopédicos e Cirúrgicos",
    orgao: "Hospital das Clínicas — UFMG",
    numeroProcesso: "TP-HC-012/2024-MG",
    valorEstimado: 1280000.0,
    dataPregao: "2024-04-15",
    status: "vencida",
    itens: itensMG,
    fornecedoresIds: ["f3", "f6", "f8", "f10"],
    observacoes: "Parabéns! Vencemos 5 dos 6 lotes. Assinatura do contrato prevista para 01/05.",
    responsavel: "Ana Paula Ferreira",
    modalidade: "Tomada de Preços",
    uf: "MG",
    municipio: "Belo Horizonte",
  },
  {
    id: "l4",
    nome: "PE nº 218/2024 — Reagentes e Insumos de Laboratório",
    orgao: "Ministério da Saúde — CONASS",
    numeroProcesso: "25000.142.518/2024-Federal",
    valorEstimado: 8900000.0,
    dataPregao: "2024-05-10",
    status: "perdida",
    itens: itensFed,
    fornecedoresIds: ["f7", "f11"],
    observacoes: "Perdemos por margem pequena (R$ 0,32/unit). Revisar precificação de reagentes para próximas.",
    responsavel: "Carlos Eduardo Moura",
    modalidade: "Pregão Eletrônico",
    uf: "DF",
    municipio: "Brasília",
  },
];

// ─── COMPUTED HELPERS ─────────────────────────────────────────────────────────

export function getLicitacaoProgress(licitacao: Licitacao): number {
  if (licitacao.itens.length === 0) return 0;
  const cotados = licitacao.itens.filter((i) => i.status === "cotado").length;
  return Math.round((cotados / licitacao.itens.length) * 100);
}

export function getFornecedorById(id: string): Fornecedor | undefined {
  return fornecedores.find((f) => f.id === id);
}

export function getLicitacaoById(id: string): Licitacao | undefined {
  return licitacoes.find((l) => l.id === id);
}

export function getCotacoesByLicitacao(licitacaoId: string): Cotacao[] {
  return cotacoes.filter((c) => c.licitacaoId === licitacaoId);
}

export function getCotacoesByItem(licitacaoId: string, itemId: string): Cotacao[] {
  return cotacoes.filter((c) => c.licitacaoId === licitacaoId && c.itemId === itemId);
}

export function getStatusLabel(status: LicitacaoStatus): string {
  const labels: Record<LicitacaoStatus, string> = {
    em_cotacao: "Em cotação",
    proposta_pronta: "Proposta pronta",
    em_disputa: "Em disputa",
    vencida: "Vencida",
    perdida: "Perdida",
  };
  return labels[status];
}

export function getStatusColor(status: LicitacaoStatus): string {
  const colors: Record<LicitacaoStatus, string> = {
    em_cotacao: "bg-blue-50 text-blue-700 border-blue-200",
    proposta_pronta: "bg-purple-50 text-purple-700 border-purple-200",
    em_disputa: "bg-yellow-50 text-yellow-700 border-yellow-200",
    vencida: "bg-green-50 text-green-700 border-green-200",
    perdida: "bg-red-50 text-red-700 border-red-200",
  };
  return colors[status];
}

export function getCategoriaColor(categoria: ItemCategoria): string {
  const colors: Record<ItemCategoria, string> = {
    "Descartáveis": "bg-blue-50 text-blue-700 border-blue-200",
    "Medicamentos": "bg-purple-50 text-purple-700 border-purple-200",
    "Equipamentos": "bg-indigo-50 text-indigo-700 border-indigo-200",
    "Curativos": "bg-pink-50 text-pink-700 border-pink-200",
    "EPIs": "bg-orange-50 text-orange-700 border-orange-200",
    "Saneantes": "bg-teal-50 text-teal-700 border-teal-200",
    "Laboratório": "bg-cyan-50 text-cyan-700 border-cyan-200",
    "Ortopedia": "bg-amber-50 text-amber-700 border-amber-200",
  };
  return colors[categoria] || "bg-gray-50 text-gray-700 border-gray-200";
}

export function getItemStatusLabel(status: ItemStatus): string {
  const labels: Record<ItemStatus, string> = {
    cotado: "Cotado",
    aguardando: "Aguardando",
    sem_cotacao: "Sem cotação",
  };
  return labels[status];
}

export function getItemStatusColor(status: ItemStatus): string {
  const colors: Record<ItemStatus, string> = {
    cotado: "bg-green-50 text-green-700 border-green-200",
    aguardando: "bg-yellow-50 text-yellow-700 border-yellow-200",
    sem_cotacao: "bg-red-50 text-red-700 border-red-200",
  };
  return colors[status];
}

export const DASHBOARD_METRICS = {
  licitacoesAtivas: licitacoes.filter((l) =>
    ["em_cotacao", "proposta_pronta", "em_disputa"].includes(l.status)
  ).length,
  valorTotalAberto: licitacoes
    .filter((l) => ["em_cotacao", "proposta_pronta", "em_disputa"].includes(l.status))
    .reduce((sum, l) => sum + l.valorEstimado, 0),
  fornecedoresAguardando: 4,
  itensSemCotacao: licitacoes
    .flatMap((l) => l.itens)
    .filter((i) => i.status === "sem_cotacao").length,
  propostasParaEnvio: licitacoes.filter((l) => l.status === "proposta_pronta").length,
};
