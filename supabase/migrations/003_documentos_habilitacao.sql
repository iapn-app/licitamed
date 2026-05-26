-- ============================================================
-- LicitaMed — Documentos de Habilitação
-- Migration: 003_documentos_habilitacao.sql
-- ============================================================

create table if not exists documentos_habilitacao (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  nome text not null,
  tipo text not null,
  validade date,
  alerta_dias integer default 30,
  status text default 'valido',  -- valido | vencido | a_vencer | sem_data
  arquivo_url text,
  arquivo_nome text,
  observacoes text
);

create index if not exists idx_documentos_status on documentos_habilitacao(status);
create index if not exists idx_documentos_validade on documentos_habilitacao(validade);

-- Seed com documentos padrão
insert into documentos_habilitacao (nome, tipo, status) values
  ('Certidão Negativa Federal (RFB + PGFN)', 'Regularidade Fiscal', 'sem_data'),
  ('Certidão Negativa Estadual', 'Regularidade Fiscal', 'sem_data'),
  ('Certidão Negativa Municipal', 'Regularidade Fiscal', 'sem_data'),
  ('FGTS — Certidão de Regularidade', 'Regularidade Trabalhista', 'sem_data'),
  ('CNDT — Certidão de Débitos Trabalhistas', 'Regularidade Trabalhista', 'sem_data'),
  ('Certidão de Falência e Recuperação Judicial', 'Habilitação Jurídica', 'sem_data'),
  ('Contrato Social Consolidado / Estatuto', 'Habilitação Jurídica', 'sem_data'),
  ('Balanço Patrimonial (último exercício)', 'Qualificação Econômica', 'sem_data'),
  ('Certidão de Capacidade Técnica', 'Qualificação Técnica', 'sem_data'),
  ('Alvará de Funcionamento Municipal', 'Licenças e Autorizações', 'sem_data'),
  ('Autorização de Funcionamento ANVISA (AFE)', 'Licenças e Autorizações', 'sem_data');
