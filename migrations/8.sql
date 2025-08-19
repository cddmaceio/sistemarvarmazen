
CREATE TABLE lancamentos_produtividade (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  user_nome TEXT NOT NULL,
  user_cpf TEXT NOT NULL,
  data_lancamento DATE NOT NULL,
  funcao TEXT NOT NULL,
  turno TEXT NOT NULL,
  
  -- Calculator input data
  nome_atividade TEXT,
  quantidade_produzida INTEGER,
  tempo_horas REAL,
  input_adicional REAL DEFAULT 0,
  multiple_activities TEXT, -- JSON for Ajudantes de Armazém
  nome_operador TEXT,
  valid_tasks_count INTEGER,
  kpis_atingidos TEXT, -- JSON array
  
  -- Calculator results
  subtotal_atividades REAL NOT NULL DEFAULT 0,
  bonus_kpis REAL NOT NULL DEFAULT 0,
  remuneracao_total REAL NOT NULL DEFAULT 0,
  produtividade_alcancada REAL,
  nivel_atingido TEXT,
  unidade_medida TEXT,
  atividades_detalhes TEXT, -- JSON for details
  tarefas_validas INTEGER,
  valor_tarefas REAL,
  
  -- Status and tracking
  status TEXT NOT NULL DEFAULT 'pendente', -- pendente, aprovado, reprovado
  observacoes TEXT,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
