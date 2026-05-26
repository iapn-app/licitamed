-- ============================================================
-- LicitaMed — Contratos em Execução
-- Migration: 004_contratos_execucao.sql
-- ============================================================

create table if not exists contratos_execucao (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  numero_contrato text,
  orgao text not null,
  objeto text not null,
  valor_total numeric not null,
  data_assinatura date,
  data_inicio date,
  data_fim date,
  status text default 'em_execucao',  -- em_execucao | concluido | suspenso | rescindido
  valor_pago numeric default 0,
  empenho_numero text,
  observacoes text
);

create table if not exists contratos_entregas (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default now(),
  contrato_id uuid references contratos_execucao(id) on delete cascade,
  descricao text not null,
  quantidade numeric not null,
  unidade text default 'unidade',
  data_prevista date,
  data_realizada date,
  status text default 'pendente',  -- pendente | entregue | parcial | atrasado
  nota_fiscal text,
  valor_item numeric
);

create index if not exists idx_contratos_status on contratos_execucao(status);
create index if not exists idx_entregas_contrato on contratos_entregas(contrato_id);
