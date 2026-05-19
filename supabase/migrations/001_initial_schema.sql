-- ============================================================
-- LicitaMed — POWER MED Material Hospitalar
-- Schema inicial: 001_initial_schema.sql
-- ============================================================

-- Licitações
create table licitacoes (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default now(),
  nome text not null,
  orgao text not null,
  numero_processo text,
  valor_estimado numeric,
  data_pregao timestamp with time zone,
  status text default 'em_analise',
  progresso integer default 0,
  uf text,
  municipio text,
  objeto text,
  edital_url text,
  observacoes text
);

-- Itens da licitação
create table itens_licitacao (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default now(),
  licitacao_id uuid references licitacoes(id) on delete cascade,
  numero_item integer,
  descricao text not null,
  quantidade numeric,
  unidade text,
  categoria text,
  valor_referencia numeric,
  status text default 'sem_cotacao'
);

-- Fornecedores
create table fornecedores (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default now(),
  nome text not null,
  cnpj text unique,
  email text,
  whatsapp text,
  categorias text[],
  score integer default 3,
  uf text,
  municipio text,
  observacoes text,
  ativo boolean default true
);

-- Cotações (pedidos enviados para fornecedores)
create table cotacoes (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default now(),
  licitacao_id uuid references licitacoes(id) on delete cascade,
  fornecedor_id uuid references fornecedores(id),
  token text unique default gen_random_uuid()::text,
  status text default 'enviada',
  prazo_resposta timestamp with time zone,
  respondida_em timestamp with time zone
);

-- Itens das cotações (respostas dos fornecedores)
create table cotacao_itens (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default now(),
  cotacao_id uuid references cotacoes(id) on delete cascade,
  item_licitacao_id uuid references itens_licitacao(id),
  preco_unitario numeric,
  marca text,
  prazo_entrega integer,
  observacao text
);

-- Documentos da empresa
create table documentos (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default now(),
  nome text not null,
  tipo text,
  validade date,
  status text default 'valido',
  arquivo_url text
);

-- Histórico de preços
create table historico_precos (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default now(),
  item_descricao text,
  preco numeric,
  fornecedor_id uuid references fornecedores(id),
  licitacao_id uuid references licitacoes(id),
  orgao text,
  uf text
);

-- Índices para performance
create index idx_itens_licitacao_licitacao_id on itens_licitacao(licitacao_id);
create index idx_cotacoes_licitacao_id on cotacoes(licitacao_id);
create index idx_cotacoes_fornecedor_id on cotacoes(fornecedor_id);
create index idx_cotacoes_token on cotacoes(token);
create index idx_cotacao_itens_cotacao_id on cotacao_itens(cotacao_id);
create index idx_historico_precos_licitacao_id on historico_precos(licitacao_id);
create index idx_historico_precos_fornecedor_id on historico_precos(fornecedor_id);

-- Row Level Security (RLS) — desabilitado por padrão, habilitar quando houver auth
alter table licitacoes enable row level security;
alter table itens_licitacao enable row level security;
alter table fornecedores enable row level security;
alter table cotacoes enable row level security;
alter table cotacao_itens enable row level security;
alter table documentos enable row level security;
alter table historico_precos enable row level security;

-- Política temporária: acesso total via anon key (remover quando implementar auth)
create policy "allow_all_licitacoes" on licitacoes for all using (true) with check (true);
create policy "allow_all_itens_licitacao" on itens_licitacao for all using (true) with check (true);
create policy "allow_all_fornecedores" on fornecedores for all using (true) with check (true);
create policy "allow_all_cotacoes" on cotacoes for all using (true) with check (true);
create policy "allow_all_cotacao_itens" on cotacao_itens for all using (true) with check (true);
create policy "allow_all_documentos" on documentos for all using (true) with check (true);
create policy "allow_all_historico_precos" on historico_precos for all using (true) with check (true);
