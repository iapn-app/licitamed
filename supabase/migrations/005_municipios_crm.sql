-- ============================================================
-- LicitaMed — CRM de Relacionamento Municipal
-- Migration: 005_municipios_crm.sql
-- ============================================================

create table if not exists municipios_crm (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  municipio text not null,
  uf text not null,
  contato_nome text,
  contato_cargo text,
  contato_email text,
  contato_telefone text,
  etapa text default 'prospectar',  -- prospectar | contato | proposta | negociacao | ganho | perdido
  valor_potencial numeric,
  ultima_interacao date,
  proximo_followup date,
  observacoes text,
  prioridade text default 'media'  -- alta | media | baixa
);

create table if not exists municipios_interacoes (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default now(),
  municipio_id uuid references municipios_crm(id) on delete cascade,
  tipo text not null,  -- email | ligacao | reuniao | proposta | outro
  descricao text not null,
  data_interacao date not null,
  resultado text
);

create index if not exists idx_crm_etapa on municipios_crm(etapa);
create index if not exists idx_crm_uf on municipios_crm(uf);
create index if not exists idx_interacoes_municipio on municipios_interacoes(municipio_id);
