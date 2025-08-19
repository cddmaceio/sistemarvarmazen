
CREATE TABLE lancamentos_produtividade_revisado (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lancamento_original_id INTEGER NOT NULL,
  admin_user_id INTEGER NOT NULL,
  admin_nome TEXT NOT NULL,
  
  -- Revised data (same structure as original)
  user_id INTEGER NOT NULL,
  user_nome TEXT NOT NULL,
  user_cpf TEXT NOT NULL,
  data_lancamento DATE NOT NULL,
  funcao TEXT NOT NULL,
  turno TEXT NOT NULL,
  
  nome_atividade TEXT,
  quantidade_produzida INTEGER,
  tempo_horas REAL,
  input_adicional REAL DEFAULT 0,
  multiple_activities TEXT,
  nome_operador TEXT,
  valid_tasks_count INTEGER,
  kpis_atingidos TEXT,
  
  subtotal_atividades REAL NOT NULL DEFAULT 0,
  bonus_kpis REAL NOT NULL DEFAULT 0,
  remuneracao_total REAL NOT NULL DEFAULT 0,
  produtividade_alcancada REAL,
  nivel_atingido TEXT,
  unidade_medida TEXT,
  atividades_detalhes TEXT,
  tarefas_validas INTEGER,
  valor_tarefas REAL,
  
  -- Revision tracking
  acao_admin TEXT NOT NULL, -- aprovado, reprovado, editado
  observacoes_admin TEXT,
  alteracoes_feitas TEXT, -- JSON describing changes made
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
