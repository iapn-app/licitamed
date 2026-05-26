CREATE TABLE IF NOT EXISTS checklists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  licitacao_id TEXT NOT NULL,
  orgao TEXT,
  objeto TEXT,
  status TEXT DEFAULT 'pendente',
  progresso INTEGER DEFAULT 0,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS checklist_itens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  checklist_id UUID REFERENCES checklists(id) ON DELETE CASCADE,
  categoria TEXT NOT NULL,
  item TEXT NOT NULL,
  descricao TEXT,
  status TEXT DEFAULT 'pendente',
  valor_extraido TEXT,
  prazo DATE,
  obrigatorio BOOLEAN DEFAULT true,
  observacao TEXT,
  ordem INTEGER,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_checklists_licitacao_id ON checklists(licitacao_id);
CREATE INDEX IF NOT EXISTS idx_checklist_itens_checklist_id ON checklist_itens(checklist_id);
