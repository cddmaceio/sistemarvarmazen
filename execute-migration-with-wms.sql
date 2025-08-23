-- =====================================================
-- MIGRAÇÃO COMPLETA + ATIVIDADE TAREFAS WMS
-- Execute este script no SQL Editor do Supabase
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
  valor_atividade DECIMAL(10,3) NOT NULL,
  produtividade_minima DECIMAL(10,2) DEFAULT 0,
  unidade_medida TEXT DEFAULT 'unidades',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices e constraints para otimização
CREATE INDEX IF NOT EXISTS idx_activities_nome ON activities(nome_atividade);
CREATE INDEX IF NOT EXISTS idx_activities_nivel ON activities(nivel_atividade);
CREATE UNIQUE INDEX IF NOT EXISTS idx_activities_unique ON activities(nome_atividade, nivel_atividade);

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

-- Índices e constraints para otimização
CREATE INDEX IF NOT EXISTS idx_kpis_funcao ON kpis(funcao_kpi);
CREATE INDEX IF NOT EXISTS idx_kpis_turno ON kpis(turno_kpi);
CREATE UNIQUE INDEX IF NOT EXISTS idx_kpis_unique ON kpis(nome_kpi, funcao_kpi, turno_kpi);

-- =====================================================
-- 3. TABELA USUARIOS
-- =====================================================
CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  cpf TEXT NOT NULL UNIQUE,
  data_nascimento DATE NOT NULL,
  nome TEXT NOT NULL,
  tipo_usuario TEXT NOT NULL DEFAULT 'colaborador',
  status_usuario TEXT NOT NULL DEFAULT 'ativo',
  funcao TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para otimização
CREATE INDEX IF NOT EXISTS idx_usuarios_cpf ON usuarios(cpf);
CREATE INDEX IF NOT EXISTS idx_usuarios_tipo ON usuarios(tipo_usuario);
CREATE INDEX IF NOT EXISTS idx_usuarios_funcao ON usuarios(funcao);

-- =====================================================
-- 4. TABELA CADASTRO_WMS
-- =====================================================
CREATE TABLE IF NOT EXISTS cadastro_wms (
  id SERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  cpf TEXT NOT NULL,
  login_wms TEXT NOT NULL UNIQUE,
  nome_wms TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para otimização
CREATE INDEX IF NOT EXISTS idx_cadastro_wms_login ON cadastro_wms(login_wms);
CREATE INDEX IF NOT EXISTS idx_cadastro_wms_cpf ON cadastro_wms(cpf);

-- =====================================================
-- 5. TABELA TAREFAS_WMS
-- =====================================================
CREATE TABLE IF NOT EXISTS tarefas_wms (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  armazem_mapa TEXT,
  tarefa TEXT,
  placa_cavalo TEXT,
  placa_carreta TEXT,
  origem TEXT,
  destino TEXT,
  palete TEXT,
  prioridade TEXT,
  status TEXT,
  tipo TEXT,
  usuario TEXT,
  data_criacao TIMESTAMP,
  data_ultima_associacao TIMESTAMP,
  data_alteracao TIMESTAMP,
  data_liberacao TIMESTAMP,
  concluida_task BOOLEAN DEFAULT FALSE,
  tempo_execucao INTEGER, -- em segundos
  tarefa_valida BOOLEAN DEFAULT FALSE, -- TRUE se tempo_execucao > 10 segundos
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para otimização
CREATE INDEX IF NOT EXISTS idx_tarefas_wms_usuario ON tarefas_wms(usuario);
CREATE INDEX IF NOT EXISTS idx_tarefas_wms_data_criacao ON tarefas_wms(data_criacao);
CREATE INDEX IF NOT EXISTS idx_tarefas_wms_valida ON tarefas_wms(tarefa_valida);
CREATE INDEX IF NOT EXISTS idx_tarefas_wms_user_id ON tarefas_wms(user_id);
CREATE INDEX IF NOT EXISTS idx_tarefas_wms_status ON tarefas_wms(status);

-- =====================================================
-- 6. OUTRAS TABELAS NECESSÁRIAS
-- =====================================================
CREATE TABLE IF NOT EXISTS lancamentos_produtividade (
  id SERIAL PRIMARY KEY,
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
  status TEXT DEFAULT 'pendente',
  aprovado_por TEXT,
  data_aprovacao TIMESTAMP,
  observacoes TEXT,
  editado_por_admin TEXT,
  data_edicao TIMESTAMP,
  valores_originais TEXT,
  status_edicao TEXT DEFAULT 'original',
  observacoes_edicao TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 7. INSERÇÃO DE DADOS BÁSICOS
-- =====================================================

-- Inserir usuários básicos
INSERT INTO usuarios (cpf, data_nascimento, nome, tipo_usuario, status_usuario, funcao, created_at, updated_at) VALUES
  ('087.495.304-96', '1990-11-01', 'Ronier Cassio', 'administrador', 'ativo', 'Administrador', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('123.456.789-01', '1985-05-15', 'Maria Santos', 'colaborador', 'ativo', 'Conferente', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('456.789.123-02', '1992-03-25', 'Pedro Costa', 'colaborador', 'ativo', 'Operador de Empilhadeira', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('789.123.456-03', '1988-09-10', 'Ana Lima', 'colaborador', 'ativo', 'Ajudante de Armazém', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (cpf) DO UPDATE SET
  nome = EXCLUDED.nome,
  tipo_usuario = EXCLUDED.tipo_usuario,
  status_usuario = EXCLUDED.status_usuario,
  funcao = EXCLUDED.funcao,
  updated_at = CURRENT_TIMESTAMP;

-- Inserir atividades básicas incluindo Tarefas WMS
INSERT INTO activities (nome_atividade, nivel_atividade, valor_atividade, produtividade_minima, unidade_medida) VALUES
  ('Repack', 'N1', 0.25, 10.0, 'cxs/h'),
  ('Repack', 'N2', 0.30, 12.0, 'cxs/h'),
  ('Repack', 'N3', 0.35, 14.2, 'cxs/h'),
  ('Amarração', 'N1', 0.20, 8.0, 'plt/h'),
  ('Amarração', 'N2', 0.25, 10.0, 'plt/h'),
  ('Amarração', 'N3', 0.30, 12.0, 'plt/h'),
  ('Devolução', 'N1', 0.18, 5.0, 'cxs/h'),
  ('Devolução', 'N2', 0.22, 7.0, 'cxs/h'),
  ('Devolução', 'N3', 0.26, 9.0, 'cxs/h'),
  ('Tarefas WMS', 'Padrão', 0.009, 1, 'tarefas válidas')
ON CONFLICT (nome_atividade, nivel_atividade) DO UPDATE SET
  valor_atividade = EXCLUDED.valor_atividade,
  produtividade_minima = EXCLUDED.produtividade_minima,
  unidade_medida = EXCLUDED.unidade_medida,
  updated_at = CURRENT_TIMESTAMP;

-- Inserir KPIs básicos
INSERT INTO kpis (nome_kpi, valor_meta_kpi, peso_kpi, turno_kpi, funcao_kpi, status_ativo) VALUES
  ('Segurança', 100.0, 40.0, 'Geral', 'Operador de Empilhadeira', true),
  ('Eficiência', 95.0, 35.0, 'Manhã', 'Operador de Empilhadeira', true),
  ('Pontualidade', 95.0, 25.0, 'Geral', 'Ajudante de Armazém', true),
  ('Qualidade', 98.0, 30.0, 'Geral', 'Ajudante de Armazém', true),
  ('Produtividade Extra', 110.0, 35.0, 'Manhã', 'Ajudante de Armazém', true)
ON CONFLICT (nome_kpi, funcao_kpi, turno_kpi) DO UPDATE SET
  valor_meta_kpi = EXCLUDED.valor_meta_kpi,
  peso_kpi = EXCLUDED.peso_kpi,
  status_ativo = EXCLUDED.status_ativo,
  updated_at = CURRENT_TIMESTAMP;

-- =====================================================
-- 8. TRIGGERS PARA UPDATED_AT AUTOMÁTICO
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
CREATE TRIGGER update_cadastro_wms_updated_at BEFORE UPDATE ON cadastro_wms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tarefas_wms_updated_at BEFORE UPDATE ON tarefas_wms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lancamentos_updated_at BEFORE UPDATE ON lancamentos_produtividade FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 9. VERIFICAÇÃO FINAL
-- =====================================================

-- Verificar se a atividade 'Tarefas WMS' foi criada
SELECT 
  'Atividade Tarefas WMS criada com sucesso!' as status,
  id, 
  nome_atividade, 
  nivel_atividade, 
  valor_atividade, 
  unidade_medida 
FROM activities 
WHERE nome_atividade = 'Tarefas WMS';

-- Verificar contagem de registros
SELECT 'usuarios' as tabela, COUNT(*) as total FROM usuarios
UNION ALL
SELECT 'activities' as tabela, COUNT(*) as total FROM activities
UNION ALL
SELECT 'kpis' as tabela, COUNT(*) as total FROM kpis
UNION ALL
SELECT 'cadastro_wms' as tabela, COUNT(*) as total FROM cadastro_wms
UNION ALL
SELECT 'tarefas_wms' as tabela, COUNT(*) as total FROM tarefas_wms;

-- =====================================================
-- MIGRAÇÃO CONCLUÍDA!
-- =====================================================
-- Este script:
-- 1. Cria todas as tabelas necessárias
-- 2. Adiciona a atividade 'Tarefas WMS' com valor 0.009
-- 3. Insere dados básicos de usuários e KPIs
-- 4. Configura triggers para updated_at automático
-- 5. Verifica se tudo foi criado corretamente
-- =====================================================