-- =====================================================
-- MIGRAÇÃO COMPLETA DO D1 DATABASE PARA SUPABASE
-- Inclui todos os dados reais do desenvolvimento
-- =====================================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. TABELA ACTIVITIES
-- =====================================================
CREATE TABLE IF NOT EXISTS activities (
  id SERIAL PRIMARY KEY,
  nome_atividade TEXT NOT NULL,
  nivel_atividade TEXT NOT NULL,
  valor_atividade DECIMAL(10,2) NOT NULL,
  produtividade_minima DECIMAL(10,2) DEFAULT 0,
  unidade_medida TEXT DEFAULT 'unidades',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para otimização
CREATE INDEX IF NOT EXISTS idx_activities_nome ON activities(nome_atividade);
CREATE INDEX IF NOT EXISTS idx_activities_nivel ON activities(nivel_atividade);

-- =====================================================
-- 2. TABELA KPIS
-- =====================================================
CREATE TABLE IF NOT EXISTS kpis (
  id SERIAL PRIMARY KEY,
  nome_kpi TEXT NOT NULL,
  descricao TEXT,
  valor_meta_kpi DECIMAL(10,2) NOT NULL,
  peso_kpi DECIMAL(10,2) NOT NULL,
  turno_kpi TEXT NOT NULL,
  funcao_kpi TEXT NOT NULL,
  status_ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para otimização
CREATE INDEX IF NOT EXISTS idx_kpis_funcao ON kpis(funcao_kpi);
CREATE INDEX IF NOT EXISTS idx_kpis_turno ON kpis(turno_kpi);
CREATE INDEX IF NOT EXISTS idx_kpis_ativo ON kpis(status_ativo);

-- =====================================================
-- 3. TABELA USUARIOS
-- =====================================================
CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  cpf TEXT UNIQUE NOT NULL,
  data_nascimento DATE,
  nome TEXT NOT NULL,
  tipo_usuario TEXT NOT NULL DEFAULT 'colaborador',
  status_usuario TEXT DEFAULT 'ativo',
  funcao TEXT DEFAULT 'Ajudante de Armazém',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para otimização
CREATE UNIQUE INDEX IF NOT EXISTS idx_usuarios_cpf ON usuarios(cpf);
CREATE INDEX IF NOT EXISTS idx_usuarios_tipo ON usuarios(tipo_usuario);
CREATE INDEX IF NOT EXISTS idx_usuarios_status ON usuarios(status_usuario);

-- =====================================================
-- 4. TABELA USER_PROFILES (compatibilidade)
-- =====================================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  email TEXT,
  name TEXT,
  cpf TEXT,
  tipo_usuario TEXT DEFAULT 'colaborador',
  status_usuario TEXT DEFAULT 'ativo',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para otimização
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_cpf ON user_profiles(cpf);

-- =====================================================
-- 5. TABELA LANCAMENTOS_PRODUTIVIDADE
-- =====================================================
CREATE TABLE IF NOT EXISTS lancamentos_produtividade (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  user_nome TEXT NOT NULL,
  user_cpf TEXT NOT NULL,
  data_lancamento DATE NOT NULL,
  funcao TEXT NOT NULL,
  turno TEXT NOT NULL,
  
  -- Dados de entrada da calculadora
  nome_atividade TEXT,
  quantidade_produzida INTEGER,
  tempo_horas DECIMAL(10,2),
  input_adicional DECIMAL(10,2) DEFAULT 0,
  multiple_activities TEXT, -- JSON
  nome_operador TEXT,
  valid_tasks_count INTEGER,
  kpis_atingidos TEXT, -- JSON
  
  -- Resultados da calculadora
  subtotal_atividades DECIMAL(10,2) NOT NULL DEFAULT 0,
  bonus_kpis DECIMAL(10,2) NOT NULL DEFAULT 0,
  remuneracao_total DECIMAL(10,2) NOT NULL DEFAULT 0,
  produtividade_alcancada DECIMAL(10,2),
  nivel_atingido TEXT,
  unidade_medida TEXT,
  atividades_detalhes TEXT, -- JSON
  tarefas_validas INTEGER,
  valor_tarefas DECIMAL(10,2),
  
  -- Status de acompanhamento
  status TEXT DEFAULT 'pendente', -- pendente, aprovado, reprovado
  aprovado_por TEXT,
  data_aprovacao TIMESTAMP,
  observacoes TEXT,
  
  -- Campos para edição por admin
  editado_por_admin TEXT,
  data_edicao TIMESTAMP,
  valores_originais TEXT, -- JSON backup
  status_edicao TEXT DEFAULT 'original', -- 'original' ou 'editado_admin'
  observacoes_edicao TEXT,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para otimização
CREATE INDEX IF NOT EXISTS idx_lancamentos_user_id ON lancamentos_produtividade(user_id);
CREATE INDEX IF NOT EXISTS idx_lancamentos_data ON lancamentos_produtividade(data_lancamento);
CREATE INDEX IF NOT EXISTS idx_lancamentos_status ON lancamentos_produtividade(status);
CREATE INDEX IF NOT EXISTS idx_lancamentos_funcao ON lancamentos_produtividade(funcao);
CREATE INDEX IF NOT EXISTS idx_lancamentos_turno ON lancamentos_produtividade(turno);

-- =====================================================
-- 6. TABELA LANCAMENTOS_PRODUTIVIDADE_REVISADO
-- =====================================================
CREATE TABLE IF NOT EXISTS lancamentos_produtividade_revisado (
  id SERIAL PRIMARY KEY,
  lancamento_original_id INTEGER NOT NULL,
  admin_user_id INTEGER NOT NULL,
  admin_nome TEXT NOT NULL,
  
  -- Dados revisados (mesma estrutura do original)
  user_id INTEGER NOT NULL,
  user_nome TEXT NOT NULL,
  user_cpf TEXT NOT NULL,
  data_lancamento DATE NOT NULL,
  funcao TEXT NOT NULL,
  turno TEXT NOT NULL,
  
  nome_atividade TEXT,
  quantidade_produzida INTEGER,
  tempo_horas DECIMAL(10,2),
  input_adicional DECIMAL(10,2) DEFAULT 0,
  multiple_activities TEXT,
  nome_operador TEXT,
  valid_tasks_count INTEGER,
  kpis_atingidos TEXT,
  
  subtotal_atividades DECIMAL(10,2) NOT NULL DEFAULT 0,
  bonus_kpis DECIMAL(10,2) NOT NULL DEFAULT 0,
  remuneracao_total DECIMAL(10,2) NOT NULL DEFAULT 0,
  produtividade_alcancada DECIMAL(10,2),
  nivel_atingido TEXT,
  unidade_medida TEXT,
  atividades_detalhes TEXT,
  tarefas_validas INTEGER,
  valor_tarefas DECIMAL(10,2),
  
  -- Controle de revisão
  acao_admin TEXT NOT NULL, -- aprovado, reprovado, editado
  observacoes_admin TEXT,
  alteracoes_feitas TEXT, -- JSON descrevendo mudanças
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 7. TABELA HISTORICO_LANCAMENTOS_APROVADOS
-- =====================================================
CREATE TABLE IF NOT EXISTS historico_lancamentos_aprovados (
  id SERIAL PRIMARY KEY,
  lancamento_id INTEGER NOT NULL,
  colaborador_id INTEGER NOT NULL,
  colaborador_nome TEXT NOT NULL,
  colaborador_cpf TEXT NOT NULL,
  data_lancamento DATE NOT NULL,
  data_aprovacao TIMESTAMP NOT NULL,
  aprovado_por TEXT NOT NULL,
  editado BOOLEAN NOT NULL DEFAULT false,
  editado_por TEXT,
  dados_finais TEXT, -- JSON snapshot
  observacoes TEXT,
  remuneracao_total DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 8. TABELA LOG_EXPORTACOES
-- =====================================================
CREATE TABLE IF NOT EXISTS log_exportacoes (
  id SERIAL PRIMARY KEY,
  admin_id INTEGER NOT NULL,
  admin_nome TEXT NOT NULL,
  filtros_aplicados TEXT, -- JSON
  formato_exportacao TEXT NOT NULL, -- csv, xlsx, pdf
  total_registros INTEGER NOT NULL,
  nome_arquivo TEXT,
  data_exportacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_origem TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- INSERÇÃO DE DADOS REAIS DO DESENVOLVIMENTO
-- =====================================================

-- Usuários reais do sistema
INSERT INTO usuarios (cpf, data_nascimento, nome, tipo_usuario, status_usuario, funcao, created_at, updated_at) VALUES
  ('087.495.304-96', '1990-11-01', 'Ronier Cassio', 'administrador', 'ativo', 'Administrador', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('987.654.321-00', '1980-12-20', 'Ronier Cassio', 'administrador', 'ativo', 'Administrador', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('123.456.789-01', '1985-05-15', 'Maria Santos', 'colaborador', 'ativo', 'Conferente', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('456.789.123-02', '1992-03-25', 'Pedro Costa', 'colaborador', 'ativo', 'Operador de Empilhadeira', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('789.123.456-03', '1988-09-10', 'Ana Lima', 'colaborador', 'ativo', 'Ajudante de Armazém', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('123.456.789-00', '1985-05-15', 'João Silva', 'colaborador', 'ativo', 'Ajudante de Armazém', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (cpf) DO UPDATE SET
  nome = EXCLUDED.nome,
  tipo_usuario = EXCLUDED.tipo_usuario,
  status_usuario = EXCLUDED.status_usuario,
  funcao = EXCLUDED.funcao,
  updated_at = CURRENT_TIMESTAMP;

-- Atividades reais do sistema
INSERT INTO activities (nome_atividade, nivel_atividade, valor_atividade, produtividade_minima, unidade_medida) VALUES
  ('Prod Repack', 'N1', 0.25, 10.0, 'cxs/h'),
  ('Prod Repack', 'N2', 0.30, 12.0, 'cxs/h'),
  ('Prod Repack', 'N3', 0.35, 14.2, 'cxs/h'),
  ('Prod Retrabalho', 'N1', 0.28, 8.0, 'cxs/h'),
  ('Prod Retrabalho', 'N2', 0.32, 10.0, 'cxs/h'),
  ('Prod Retrabalho', 'N3', 0.36, 12.0, 'cxs/h'),
  ('Prod Amarração', 'N1', 0.20, 8.0, 'plt/h'),
  ('Prod Amarração', 'N2', 0.25, 10.0, 'plt/h'),
  ('Prod Amarração', 'N3', 0.30, 12.0, 'plt/h'),
  ('Prod Devolução', 'N1', 0.18, 5.0, 'cxs/h'),
  ('Prod Devolução', 'N2', 0.22, 7.0, 'cxs/h'),
  ('Prod Devolução', 'N3', 0.26, 9.0, 'cxs/h'),
  ('Prod Retorno', 'N1', 0.22, 12.0, 'cxs/h'),
  ('Prod Retorno', 'N2', 0.26, 15.0, 'cxs/h'),
  ('Prod Retorno', 'N3', 0.30, 18.0, 'cxs/h'),
  ('Prod Refugo', 'N1', 0.15, 15.0, 'cxs/h'),
  ('Prod Refugo', 'N2', 0.18, 18.0, 'cxs/h'),
  ('Prod Refugo', 'N3', 0.21, 21.0, 'cxs/h'),
  ('Prod Blocagem Repack', 'N1', 0.24, 6.0, 'cxs/h'),
  ('Prod Blocagem Repack', 'N2', 0.28, 8.0, 'cxs/h'),
  ('Prod Blocagem Repack', 'N3', 0.32, 10.0, 'cxs/h'),
  ('Repack', 'N1', 0.25, 10.0, 'cxs/h'),
  ('Repack', 'N2', 0.30, 12.0, 'cxs/h'),
  ('Repack', 'N3', 0.35, 14.2, 'cxs/h'),
  ('Amarração', 'N1', 0.20, 8.0, 'plt/h'),
  ('Amarração', 'N2', 0.25, 10.0, 'plt/h'),
  ('Amarração', 'N3', 0.30, 12.0, 'plt/h'),
  ('Devolução', 'N1', 0.18, 5.0, 'cxs/h'),
  ('Devolução', 'N2', 0.22, 7.0, 'cxs/h'),
  ('Devolução', 'N3', 0.26, 9.0, 'cxs/h'),
  ('Refugo', 'N1', 0.15, 15.0, 'cxs/h'),
  ('Refugo', 'N2', 0.18, 18.0, 'cxs/h'),
  ('Refugo', 'N3', 0.21, 21.0, 'cxs/h'),
  ('Retorno', 'N1', 0.22, 12.0, 'cxs/h'),
  ('Retorno', 'N2', 0.26, 15.0, 'cxs/h'),
  ('Retorno', 'N3', 0.30, 18.0, 'cxs/h'),
  ('Retrabalho', 'N1', 0.28, 8.0, 'cxs/h'),
  ('Retrabalho', 'N2', 0.32, 10.0, 'cxs/h'),
  ('Retrabalho', 'N3', 0.36, 12.0, 'cxs/h'),
  ('Blocagem', 'N1', 0.24, 6.0, 'cxs/h'),
  ('Blocagem', 'N2', 0.28, 8.0, 'cxs/h'),
  ('Blocagem', 'N3', 0.32, 10.0, 'cxs/h'),
  ('Separação de Produtos', 'Básico', 0.50, 50, 'itens/hora'),
  ('Separação de Produtos', 'Intermediário', 0.75, 80, 'itens/hora'),
  ('Separação de Produtos', 'Avançado', 1.00, 120, 'itens/hora'),
  ('Conferência de Pedidos', 'Básico', 0.60, 30, 'pedidos/hora'),
  ('Conferência de Pedidos', 'Intermediário', 0.85, 50, 'pedidos/hora'),
  ('Conferência de Pedidos', 'Avançado', 1.10, 75, 'pedidos/hora');

-- KPIs reais do sistema
INSERT INTO kpis (nome_kpi, descricao, valor_meta_kpi, peso_kpi, turno_kpi, funcao_kpi, status_ativo) VALUES
  ('Produtividade na Separação', NULL, 99.5, 10.00, 'Manhã', 'Ajudante de Armazém', true),
  ('Produtividade na Separação', NULL, 99.5, 10.00, 'Tarde', 'Ajudante de Armazém', true),
  ('Produtividade na Separação', NULL, 99.5, 10.00, 'Noite', 'Ajudante de Armazém', true),
  ('Acuracidade na Separação', NULL, 99.8, 15.00, 'Manhã', 'Ajudante de Armazém', true),
  ('Acuracidade na Separação', NULL, 99.8, 15.00, 'Tarde', 'Ajudante de Armazém', true),
  ('Acuracidade na Separação', NULL, 99.8, 15.00, 'Noite', 'Ajudante de Armazém', true),
  ('Disponibilidade de Equipment', NULL, 98.0, 12.00, 'Geral', 'Operador de Empilhadeira', true),
  ('Eficiência Operacional', NULL, 95.0, 18.00, 'Manhã', 'Operador de Empilhadeira', true),
  ('Eficiência Operacional', NULL, 95.0, 18.00, 'Tarde', 'Operador de Empilhadeira', true),
  ('Eficiência Operacional', NULL, 95.0, 18.00, 'Noite', 'Operador de Empilhadeira', true),
  ('Acuracidade na Conferência', NULL, 99.9, 20.00, 'Manhã', 'Conferente', true),
  ('Acuracidade na Conferência', NULL, 99.9, 20.00, 'Tarde', 'Conferente', true),
  ('Acuracidade na Conferência', NULL, 99.9, 20.00, 'Noite', 'Conferente', true),
  ('Velocidade na Conferência', NULL, 95.0, 12.00, 'Manhã', 'Conferente', true),
  ('Velocidade na Conferência', NULL, 95.0, 12.00, 'Tarde', 'Conferente', true),
  ('Velocidade na Conferência', NULL, 95.0, 12.00, 'Noite', 'Conferente', true),
  ('Gestão de Equipe', NULL, 98.0, 25.00, 'Geral', 'Supervisor', true),
  ('Cumprimento de Metas', NULL, 95.0, 20.00, 'Geral', 'Supervisor', true),
  ('Indicadores Gerais', NULL, 97.0, 30.00, 'Geral', 'Gerente', true),
  ('Gestão de Processos', NULL, 96.0, 25.00, 'Geral', 'Gerente', true),
  ('Segurança e Qualidade', NULL, 99.0, 22.00, 'Geral', 'Ajudante de Armazém', true),
  ('Segurança e Qualidade', NULL, 99.0, 22.00, 'Geral', 'Operador de Empilhadeira', true),
  ('Segurança e Qualidade', NULL, 99.0, 22.00, 'Geral', 'Conferente', true),
  ('Melhoria Contínua', NULL, 90.0, 15.00, 'Geral', 'Supervisor', true),
  ('Pontualidade', 'Chegada no horário durante o mês', 95, 25, 'Geral', 'Ajudante de Armazém', true),
  ('Qualidade', 'Baixo índice de erros na separação', 98, 30, 'Geral', 'Ajudante de Armazém', true),
  ('Produtividade Extra', 'Superação das metas diárias', 110, 35, 'Manhã', 'Ajudante de Armazém', true),
  ('Organização', 'Manutenção da organização do setor', 90, 20, 'Tarde', 'Ajudante de Armazém', true),
  ('Segurança', 'Cumprimento das normas de segurança', 100, 40, 'Geral', 'Operador de Empilhadeira', true),
  ('Eficiência', 'Tempo médio por tarefa dentro do padrão', 95, 35, 'Manhã', 'Operador de Empilhadeira', true);

-- =====================================================
-- TRIGGERS PARA UPDATED_AT AUTOMÁTICO
-- =====================================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para cada tabela
CREATE TRIGGER update_activities_updated_at BEFORE UPDATE ON activities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_kpis_updated_at BEFORE UPDATE ON kpis FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON usuarios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lancamentos_updated_at BEFORE UPDATE ON lancamentos_produtividade FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lancamentos_revisado_updated_at BEFORE UPDATE ON lancamentos_produtividade_revisado FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_historico_updated_at BEFORE UPDATE ON historico_lancamentos_aprovados FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_log_exportacoes_updated_at BEFORE UPDATE ON log_exportacoes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- COMENTÁRIOS FINAIS
-- =====================================================
-- Este script contém:
-- 1. Todas as tabelas do sistema original
-- 2. Todos os dados reais inseridos durante o desenvolvimento
-- 3. Índices otimizados para performance
-- 4. Triggers para atualização automática de timestamps
-- 5. Compatibilidade total com PostgreSQL/Supabase
--
-- Para executar:
-- 1. Copie este script completo
-- 2. Cole no SQL Editor do Supabase
-- 3. Execute o script
-- 4. Verifique se todas as tabelas e dados foram criados
-- =====================================================