
-- Add missing columns for edit tracking and audit
ALTER TABLE lancamentos_produtividade ADD COLUMN editado_por_admin TEXT;
ALTER TABLE lancamentos_produtividade ADD COLUMN data_edicao DATETIME;
ALTER TABLE lancamentos_produtividade ADD COLUMN valores_originais TEXT; -- JSON backup
ALTER TABLE lancamentos_produtividade ADD COLUMN status_edicao TEXT DEFAULT 'original'; -- 'original' or 'editado_admin'
ALTER TABLE lancamentos_produtividade ADD COLUMN observacoes_edicao TEXT;

-- Create new table for approved entries history
CREATE TABLE historico_lancamentos_aprovados (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lancamento_id INTEGER NOT NULL,
  colaborador_id INTEGER NOT NULL,
  colaborador_nome TEXT NOT NULL,
  colaborador_cpf TEXT NOT NULL,
  data_lancamento DATE NOT NULL,
  data_aprovacao DATETIME NOT NULL,
  aprovado_por TEXT NOT NULL,
  editado BOOLEAN NOT NULL DEFAULT false,
  editado_por TEXT,
  dados_finais TEXT, -- JSON snapshot
  observacoes TEXT,
  remuneracao_total REAL NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
