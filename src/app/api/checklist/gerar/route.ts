import { NextRequest, NextResponse } from 'next/server';
import { adminSupabase } from '@/lib/supabase';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

interface AIItem {
  categoria: string;
  item: string;
  status?: string;
  valor_extraido?: string;
  prazo?: string;
  obrigatorio?: boolean;
  descricao?: string;
  alerta?: string;
}

const TEMPLATE: { categoria: string; itens: Omit<AIItem, 'categoria'>[] }[] = [
  {
    categoria: '📅 DATAS E PRAZOS CRÍTICOS',
    itens: [
      { item: 'Data/hora de abertura do pregão', status: 'pendente', descricao: 'Confirme a data/hora exata no edital e no portal', obrigatorio: true },
      { item: 'Prazo final para envio de propostas', status: 'pendente', descricao: 'Verificar data limite no portal (geralmente antes da abertura)', obrigatorio: true },
      { item: 'Prazo para credenciamento no portal', status: 'pendente', descricao: 'Geralmente 3 dias úteis antes — credenciar com antecedência', obrigatorio: true, alerta: 'Credenciamento tardio = exclusão automática' },
      { item: 'Prazo para documentos de habilitação', status: 'pendente', descricao: 'Geralmente 1-2 horas após solicitação do pregoeiro', obrigatorio: true },
      { item: 'Prazo para documentos complementares', status: 'pendente', descricao: 'Geralmente 48h após a sessão (verificar edital)', obrigatorio: false },
      { item: 'Validade da proposta (mínimo exigido)', status: 'pendente', descricao: 'Geralmente 60 dias — informar na proposta', obrigatorio: true },
      { item: 'Prazo de entrega dos produtos/serviços', status: 'pendente', descricao: 'Conforme Termo de Referência', obrigatorio: true },
    ],
  },
  {
    categoria: '🏢 HABILITAÇÃO JURÍDICA',
    itens: [
      { item: 'Contrato Social / Estatuto atualizado', status: 'pendente', descricao: 'Última alteração com registro na Junta Comercial', obrigatorio: true },
      { item: 'Cópia de identidade e CPF dos sócios', status: 'pendente', descricao: 'Todos os sócios administradores', obrigatorio: true },
      { item: 'Certidão da Junta Comercial (ME/EPP)', status: 'pendente', descricao: 'Se aplicável — comprova enquadramento ME/EPP', obrigatorio: false },
    ],
  },
  {
    categoria: '💰 HABILITAÇÃO ECONÔMICO-FINANCEIRA',
    itens: [
      { item: 'Balanço Patrimonial (últimos 2 exercícios)', status: 'pendente', descricao: 'Assinado por contador habilitado com CRC', obrigatorio: true },
      { item: 'DRE — Demonstração de Resultado', status: 'pendente', descricao: 'Acompanha o Balanço Patrimonial', obrigatorio: true },
      { item: 'Certidão negativa de falência/concordata', status: 'pendente', descricao: 'Da comarca da sede da empresa', obrigatorio: true },
      { item: 'Certidão de distribuição de cartório', status: 'pendente', descricao: 'Verificar se exigida no edital', obrigatorio: false },
    ],
  },
  {
    categoria: '📋 HABILITAÇÃO FISCAL',
    itens: [
      { item: 'CNPJ — cartão atualizado', status: 'pendente', descricao: 'Situação ativa na Receita Federal', obrigatorio: true },
      { item: 'Certidão Negativa Federal (RFB + PGFN)', status: 'pendente', descricao: 'certidoes.receita.fazenda.gov.br', obrigatorio: true, alerta: 'Validade 180 dias — verificar vencimento' },
      { item: 'Certidão Negativa Estadual', status: 'pendente', descricao: 'Secretaria de Fazenda do estado sede', obrigatorio: true },
      { item: 'Certidão Negativa Municipal', status: 'pendente', descricao: 'Prefeitura do município sede', obrigatorio: true },
      { item: 'Certidão FGTS (CEF)', status: 'pendente', descricao: 'portal.caixa.gov.br/certificadofgts', obrigatorio: true, alerta: 'Validade 30 dias — emitir próximo ao pregão' },
      { item: 'CNDT — Certidão de Débitos Trabalhistas', status: 'pendente', descricao: 'tst.jus.br/certidao', obrigatorio: true },
    ],
  },
  {
    categoria: '👷 HABILITAÇÃO TRABALHISTA E SOCIAL',
    itens: [
      { item: 'Declaração de não emprego de menor', status: 'pendente', descricao: 'Art. 7º, XXXIII da CF — modelo no edital', obrigatorio: true },
      { item: 'Declaração de reserva de vagas PCD', status: 'pendente', descricao: 'Verificar se exigida no edital', obrigatorio: false },
    ],
  },
  {
    categoria: '🧪 QUALIFICAÇÃO TÉCNICA',
    itens: [
      { item: 'Atestado(s) de Capacidade Técnica', status: 'pendente', descricao: 'Fornecido por pessoa jurídica de direito público ou privado', obrigatorio: true },
      { item: 'Alvará de Licença Sanitária (ANVISA)', status: 'pendente', descricao: 'Licença de funcionamento válida', obrigatorio: true, alerta: 'Verificar validade — vence anualmente' },
      { item: 'AFE — Autorização de Funcionamento', status: 'pendente', descricao: 'Emitido pela ANVISA para distribuidoras', obrigatorio: true },
      { item: 'Registro dos Produtos na ANVISA', status: 'pendente', descricao: 'Para cada item licitado — verificar números de registro', obrigatorio: true, alerta: 'Produto sem registro válido = desclassificação' },
      { item: 'SICAF — Sistema de Cadastro Unificado', status: 'pendente', descricao: 'Se exigido no edital federal', obrigatorio: false },
    ],
  },
  {
    categoria: '📝 PROPOSTA DE PREÇOS',
    itens: [
      { item: 'Modelo de proposta preenchido (Anexo)', status: 'pendente', descricao: 'Usar modelo do edital se houver', obrigatorio: true },
      { item: 'MARCA dos produtos informada', status: 'atencao', descricao: 'Obrigatório em itens hospitalares', obrigatorio: true, alerta: 'MARCA OBRIGATÓRIA — omissão causa desclassificação' },
      { item: 'Validade da proposta informada', status: 'pendente', descricao: 'Atender mínimo exigido (geralmente 60 dias)', obrigatorio: true },
      { item: 'Prazo de entrega na proposta', status: 'pendente', descricao: 'Cumprir prazo do Termo de Referência', obrigatorio: true },
      { item: 'Dados bancários para pagamento', status: 'pendente', descricao: 'Banco, agência, conta, CNPJ titular', obrigatorio: true },
      { item: 'Dados do representante legal', status: 'pendente', descricao: 'Nome, CPF, cargo, telefone, email', obrigatorio: true },
      { item: 'Razão Social, CNPJ e endereço completo', status: 'pendente', descricao: 'Idênticos ao contrato social', obrigatorio: true },
    ],
  },
  {
    categoria: '📎 ANEXOS OBRIGATÓRIOS',
    itens: [
      { item: 'Declaração Unificada (Anexo 03 ou equiv.)', status: 'pendente', descricao: 'Confirmar número do anexo no edital', obrigatorio: true },
      { item: 'Modelo de proposta (Anexo 02)', status: 'pendente', descricao: 'Preencher conforme modelo do edital', obrigatorio: true },
      { item: 'Outros anexos identificados no edital', status: 'pendente', descricao: 'Verificar todos os anexos no índice', obrigatorio: true },
    ],
  },
  {
    categoria: '⚠️ ARMADILHAS E ALERTAS ESPECIAIS',
    itens: [
      { item: 'Credenciamento na plataforma eletrônica', status: 'critico', descricao: 'BBMNET, ComprasNet ou outra — verificar qual plataforma', obrigatorio: true, alerta: 'Credenciar com mínimo 3 dias úteis de antecedência' },
      { item: 'Itens com MARCA obrigatória identificados', status: 'critico', descricao: 'Verificar no Termo de Referência', obrigatorio: true, alerta: 'Proposta sem marca = desclassificação automática' },
      { item: 'Documentos próximos do vencimento', status: 'atencao', descricao: 'FGTS (30d), CND Federal (180d), CNDT (180d)', obrigatorio: true },
      { item: 'Restrições de participação (ME/EPP exclusivo?)', status: 'pendente', descricao: 'Verificar cota exclusiva ou preferência ME/EPP', obrigatorio: true },
      { item: 'Exigências específicas do Termo de Referência', status: 'pendente', descricao: 'Ler TR completo — requisitos técnicos específicos', obrigatorio: true },
      { item: 'Local e horário de entrega', status: 'pendente', descricao: 'Endereço exato, horário de recebimento, responsável', obrigatorio: true },
      { item: 'Modo de disputa', status: 'pendente', descricao: 'Aberto, fechado ou combinado — estratégia de lance', obrigatorio: true },
    ],
  },
];

async function gerarComIA(objeto: string, orgao: string, textoEdital?: string): Promise<AIItem[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return [];

  const prompt = `Você é especialista em licitações públicas brasileiras (distribuidora hospitalar).

Analise este edital e preencha um checklist completo de participação.

EDITAL:
- Órgão: ${orgao}
- Objeto: ${objeto}
${textoEdital ? `- Trecho do edital:\n${textoEdital.slice(0, 3000)}` : ''}

Retorne APENAS um array JSON válido (sem markdown, sem texto extra) com objetos:
[
  {
    "categoria": "📅 DATAS E PRAZOS CRÍTICOS",
    "item": "nome do item",
    "status": "pendente|atencao|critico",
    "valor_extraido": "valor ou data encontrada no edital",
    "prazo": "YYYY-MM-DD se houver data",
    "obrigatorio": true,
    "descricao": "instrução clara e objetiva do que fazer",
    "alerta": "armadilha ou ponto crítico — omitir se não houver"
  }
]

Categorias (incluir todas):
1. "📅 DATAS E PRAZOS CRÍTICOS"
2. "🏢 HABILITAÇÃO JURÍDICA"
3. "💰 HABILITAÇÃO ECONÔMICO-FINANCEIRA"
4. "📋 HABILITAÇÃO FISCAL"
5. "👷 HABILITAÇÃO TRABALHISTA E SOCIAL"
6. "🧪 QUALIFICAÇÃO TÉCNICA"
7. "📝 PROPOSTA DE PREÇOS"
8. "📎 ANEXOS OBRIGATÓRIOS"
9. "⚠️ ARMADILHAS E ALERTAS ESPECIAIS"

Priorize extrair do objeto/edital:
- Datas específicas com horários (status "critico" se próximas)
- Exigência de MARCA (status "critico")
- Produtos que precisam de registro ANVISA específico
- Plataforma de disputa (BBMNET, ComprasNet, etc.)
- Modo de disputa (aberto/fechado/combinado)
- Prazo de entrega específico
- Restrições ME/EPP`;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }],
      }),
      signal: AbortSignal.timeout(40000),
    });
    if (!res.ok) return [];
    const data = await res.json() as { content?: { type: string; text: string }[] };
    const text = data.content?.find(c => c.type === 'text')?.text ?? '';
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) return [];
    return JSON.parse(match[0]) as AIItem[];
  } catch {
    return [];
  }
}

function templateParaItens(): AIItem[] {
  const itens: AIItem[] = [];
  for (const { categoria, itens: catItens } of TEMPLATE) {
    for (const i of catItens) {
      itens.push({ ...i, categoria });
    }
  }
  return itens;
}

export async function POST(request: NextRequest) {
  const db = adminSupabase();
  if (!db) {
    console.error('[checklist/gerar] SUPABASE_SERVICE_ROLE_KEY não configurada');
    return NextResponse.json({ erro: 'Banco de dados não configurado' }, { status: 500 });
  }

  let body: { licitacaoId: string; objeto: string; orgao: string; textoEdital?: string };
  try {
    body = await request.json() as typeof body;
  } catch (e) {
    console.error('[checklist/gerar] Erro ao parsear body:', e);
    return NextResponse.json({ erro: 'Body inválido' }, { status: 400 });
  }

  if (!body.licitacaoId || !body.objeto) {
    return NextResponse.json({ erro: 'licitacaoId e objeto são obrigatórios' }, { status: 400 });
  }

  // Try AI generation, fall back to template
  let itensAI = await gerarComIA(body.objeto, body.orgao ?? '', body.textoEdital);
  const usouIA = itensAI.length > 0;
  if (!usouIA) {
    itensAI = templateParaItens();
  }

  // Create checklist
  const { data: checklist, error: errChecklist } = await db
    .from('checklists')
    .insert({
      licitacao_id: body.licitacaoId,
      orgao: body.orgao ?? null,
      objeto: body.objeto,
      status: 'pendente',
      progresso: 0,
    })
    .select('id')
    .single();

  if (errChecklist || !checklist) {
    console.error('[checklist/gerar] Erro ao criar checklist:', errChecklist);
    return NextResponse.json({ erro: errChecklist?.message ?? 'Erro ao criar checklist' }, { status: 500 });
  }

  // Insert items
  const rows = itensAI.map((item, idx) => ({
    checklist_id: checklist.id,
    categoria: item.categoria,
    item: item.item,
    descricao: item.descricao ?? null,
    status: item.status ?? 'pendente',
    valor_extraido: item.valor_extraido ?? (item.alerta ? `⚠️ ${item.alerta}` : null),
    prazo: item.prazo ?? null,
    obrigatorio: item.obrigatorio ?? true,
    ordem: idx,
  }));

  const { error: errItens } = await db.from('checklist_itens').insert(rows);
  if (errItens) {
    console.error('[checklist/gerar] Erro ao inserir itens:', errItens);
    await db.from('checklists').delete().eq('id', checklist.id);
    return NextResponse.json({ erro: errItens.message }, { status: 500 });
  }

  return NextResponse.json({
    checklistId: checklist.id,
    totalItens: rows.length,
    usouIA,
    modelo: usouIA ? 'claude-haiku-4-5-20251001' : 'template-padrao',
  });
}
