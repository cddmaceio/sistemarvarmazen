-- Schema completo para migração do D1 Database para Supabase PostgreSQL
-- Sistema RV Armazém - Gestão de Produtividade

-- Tabela de atividades
CREATE TABLE activities (
  id SERIAL PRIMARY KEY,
  nome_atividade TEXT NOT NULL,
  nivel_atividade TEXT NOT NULL,  
  valor_atividade REAL NOT NULL,
  produtividade_minima REAL DEFAULT 0,
  unidade_medida TEXT DEFAULT 'unidades',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de KPIs
CREATE TABLE kpis (
  id SERIAL PRIMARY KEY,
  nome_kpi TEXT NOT NULL,
  valor_meta_kpi REAL NOT NULL,
  peso_kpi REAL NOT NULL,
  turno_kpi TEXT NOT NULL,
  funcao_kpi TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de perfis de usuário (para autenticação)
CREATE TABLE user_profiles (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  cpf TEXT,
  role TEXT NOT NULL DEFAULT 'user',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de usuários (sistema interno)
CREATE TABLE usuarios (
  id SERIAL PRIMARY KEY,
  cpf TEXT NOT NULL UNIQUE,
  data_nascimento DATE NOT NULL,
  nome TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de lançamentos de produtividade
CREATE TABLE lancamentos_produtividade (
  id SERIAL PRIMARY KEY,
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

-- Índices para otimização
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_cpf ON user_profiles(cpf);
CREATE INDEX idx_usuarios_cpf ON usuarios(cpf);
CREATE INDEX idx_lancamentos_user_id ON lancamentos_produtividade(user_id);
CREATE INDEX idx_lancamentos_data ON lancamentos_produtividade(data_lancamento);
CREATE INDEX idx_lancamentos_status ON lancamentos_produtividade(status);
CREATE INDEX idx_activities_nome ON activities(nome_atividade);
CREATE INDEX idx_kpis_funcao ON kpis(funcao_kpi);

-- Inserir usuário de teste
INSERT INTO usuarios (cpf, data_nascimento, nome, role, is_active)
VALUES ('087.495.304-96', '1990-11-01', 'Usuário de Teste', 'admin', true);

-- Inserir KPIs exemplo
INSERT INTO kpis (nome_kpi, valor_meta_kpi, peso_kpi, turno_kpi, funcao_kpi) VALUES
('Produtividade Geral', 95.0, 15.00, 'Geral', 'Operador de Logística'),
('Acuracidade', 99.5, 10.00, 'Geral', 'Separador'),
('Tempo de Ciclo', 8.0, 12.00, 'Manhã', 'Conferente'),
('Qualidade', 98.0, 8.00, 'Tarde', 'Operador de Empilhadeira');

-- Inserir atividades de exemplo (algumas principais)
INSERT INTO activities (nome_atividade, nivel_atividade, valor_atividade, produtividade_minima, unidade_medida) VALUES
-- Prod Repack
('Prod Repack', 'Nível 1 (0 cxs/h)', 0.05, 0, 'cxs/h'),
('Prod Repack', 'Nível 2 (14,2 cxs/h)', 0.08, 14.2, 'cxs/h'),
('Prod Repack', 'Nível 3 (17,8 cxs/h)', 0.10, 17.8, 'cxs/h'),
('Prod Repack', 'Nível 4 (24,75 cxs/h)', 0.12, 24.75, 'cxs/h'),
('Prod Repack', 'Nível 5 (28 cxs/h)', 0.13, 28, 'cxs/h'),

-- Prod Retrabalho
('Prod Retrabalho', 'Nível 1 (0 plt/h)', 0.10, 0, 'plt/h'),
('Prod Retrabalho', 'Nível 2 (1,5 plt/h)', 0.15, 1.5, 'plt/h'),
('Prod Retrabalho', 'Nível 3 (3 plt/h)', 0.20, 3, 'plt/h'),
('Prod Retrabalho', 'Nível 4 (5 plt/h)', 0.25, 5, 'plt/h'),
('Prod Retrabalho', 'Nível 5 (6 plt/h)', 0.35, 6, 'plt/h'),

-- Prod Amarração
('Prod Amarração', 'Nível 1 (0 plt/h)', 0.20, 0, 'plt/h'),
('Prod Amarração', 'Nível 2 (12 plt/h)', 0.24, 12, 'plt/h'),
('Prod Amarração', 'Nível 3 (16 plt/h)', 0.35, 16, 'plt/h'),
('Prod Amarração', 'Nível 4 (18 plt/h)', 0.40, 18, 'plt/h'),
('Prod Amarração', 'Nível 5 (20 plt/h)', 0.50, 20, 'plt/h');

-- Comentários sobre o schema:
-- 1. Convertido AUTOINCREMENT para SERIAL (padrão PostgreSQL)
-- 2. Mantidos os tipos de dados compatíveis
-- 3. Adicionados índices para otimização de consultas
-- 4. Incluídos dados de exemplo para teste
-- 5. Schema pronto para uso no Supabase