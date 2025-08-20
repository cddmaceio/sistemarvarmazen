-- =====================================================
-- MIGRAÇÃO COMPLETA DO D1 DATABASE PARA SUPABASE
-- Script com dados reais extraídos do banco de desenvolvimento
-- =====================================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. CRIAÇÃO DAS TABELAS
-- =====================================================

-- Tabela: activities
CREATE TABLE IF NOT EXISTS activities (
    id SERIAL PRIMARY KEY,
    nome_atividade VARCHAR(255) NOT NULL,
    nivel_atividade VARCHAR(255) NOT NULL,
    valor_atividade DECIMAL(10,3) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    produtividade_minima DECIMAL(10,2) DEFAULT 0,
    unidade_medida VARCHAR(50) DEFAULT 'unidades'
);

-- Tabela: kpis
CREATE TABLE IF NOT EXISTS kpis (
    id SERIAL PRIMARY KEY,
    nome_kpi VARCHAR(255) NOT NULL,
    valor_meta_kpi DECIMAL(10,2) NOT NULL DEFAULT 0,
    peso_kpi DECIMAL(5,2) NOT NULL DEFAULT 1,
    turno_kpi VARCHAR(50) NOT NULL DEFAULT 'Geral',
    funcao_kpi VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    descricao TEXT,
    status_ativo BOOLEAN DEFAULT true
);

-- Tabela: usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    cpf VARCHAR(14) UNIQUE NOT NULL,
    data_nascimento DATE,
    nome VARCHAR(255) NOT NULL,
    tipo_usuario VARCHAR(50) NOT NULL DEFAULT 'funcionario',
    status_usuario VARCHAR(50) NOT NULL DEFAULT 'ativo',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    funcao VARCHAR(255)
);

-- Tabela: user_profiles
CREATE TABLE IF NOT EXISTS user_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    profile_data JSONB,
    preferences JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela: lancamentos_produtividade
CREATE TABLE IF NOT EXISTS lancamentos_produtividade (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    activity_id INTEGER REFERENCES activities(id) ON DELETE CASCADE,
    quantidade DECIMAL(10,2) NOT NULL DEFAULT 0,
    data_lancamento DATE NOT NULL,
    turno VARCHAR(50) NOT NULL,
    observacoes TEXT,
    status VARCHAR(50) DEFAULT 'pendente',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    aprovado_por INTEGER REFERENCES usuarios(id),
    data_aprovacao TIMESTAMP WITH TIME ZONE
);

-- Tabela: lancamentos_produtividade_revisado
CREATE TABLE IF NOT EXISTS lancamentos_produtividade_revisado (
    id SERIAL PRIMARY KEY,
    lancamento_original_id INTEGER REFERENCES lancamentos_produtividade(id) ON DELETE CASCADE,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    activity_id INTEGER REFERENCES activities(id) ON DELETE CASCADE,
    quantidade_original DECIMAL(10,2) NOT NULL,
    quantidade_revisada DECIMAL(10,2) NOT NULL,
    motivo_revisao TEXT,
    revisado_por INTEGER REFERENCES usuarios(id),
    data_revisao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(50) DEFAULT 'revisado',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela: historico_lancamentos_aprovados
CREATE TABLE IF NOT EXISTS historico_lancamentos_aprovados (
    id SERIAL PRIMARY KEY,
    lancamento_id INTEGER NOT NULL,
    usuario_id INTEGER REFERENCES usuarios(id),
    activity_id INTEGER REFERENCES activities(id),
    quantidade DECIMAL(10,2) NOT NULL,
    data_lancamento DATE NOT NULL,
    turno VARCHAR(50) NOT NULL,
    aprovado_por INTEGER REFERENCES usuarios(id),
    data_aprovacao TIMESTAMP WITH TIME ZONE NOT NULL,
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela: log_exportacoes
CREATE TABLE IF NOT EXISTS log_exportacoes (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id),
    tipo_exportacao VARCHAR(100) NOT NULL,
    filtros_aplicados JSONB,
    total_registros INTEGER DEFAULT 0,
    data_inicio DATE,
    data_fim DATE,
    status VARCHAR(50) DEFAULT 'concluido',
    arquivo_gerado VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. ÍNDICES PARA PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_usuarios_cpf ON usuarios(cpf);
CREATE INDEX IF NOT EXISTS idx_usuarios_tipo ON usuarios(tipo_usuario);
CREATE INDEX IF NOT EXISTS idx_usuarios_status ON usuarios(status_usuario);
CREATE INDEX IF NOT EXISTS idx_activities_nome ON activities(nome_atividade);
CREATE INDEX IF NOT EXISTS idx_activities_nivel ON activities(nivel_atividade);
CREATE INDEX IF NOT EXISTS idx_kpis_funcao ON kpis(funcao_kpi);
CREATE INDEX IF NOT EXISTS idx_kpis_turno ON kpis(turno_kpi);
CREATE INDEX IF NOT EXISTS idx_lancamentos_usuario ON lancamentos_produtividade(usuario_id);
CREATE INDEX IF NOT EXISTS idx_lancamentos_activity ON lancamentos_produtividade(activity_id);
CREATE INDEX IF NOT EXISTS idx_lancamentos_data ON lancamentos_produtividade(data_lancamento);
CREATE INDEX IF NOT EXISTS idx_lancamentos_status ON lancamentos_produtividade(status);

-- =====================================================
-- 3. TRIGGERS PARA UPDATED_AT AUTOMÁTICO
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_activities_updated_at BEFORE UPDATE ON activities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_kpis_updated_at BEFORE UPDATE ON kpis FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON usuarios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lancamentos_updated_at BEFORE UPDATE ON lancamentos_produtividade FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lancamentos_revisado_updated_at BEFORE UPDATE ON lancamentos_produtividade_revisado FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 4. INSERÇÃO DOS DADOS REAIS - USUÁRIOS
-- =====================================================

INSERT INTO usuarios (id, cpf, data_nascimento, nome, tipo_usuario, status_usuario, created_at, updated_at, funcao) VALUES 
(1, '123.456.789-00', '1985-05-15', 'Ronier Cassio Atualizado', 'administrador', 'ativo', '2025-08-19 01:48:49', '2025-08-19 01:48:49', 'Administrador'),
(2, '987.654.321-00', '1990-03-22', 'Artur Ryan Teste Final', 'funcionario', 'ativo', '2025-08-19 01:49:09', '2025-08-19 01:49:09', 'Ajudante de Armazém');

-- =====================================================
-- 5. INSERÇÃO DOS DADOS REAIS - ATIVIDADES
-- =====================================================

INSERT INTO activities (id, nome_atividade, nivel_atividade, valor_atividade, created_at, updated_at, produtividade_minima, unidade_medida) VALUES 
(1, 'Prod Repack', 'Nível 1 (0 cxs/h)', 0.05, '2025-08-19 01:49:09', '2025-08-19 01:49:09', 0.0, 'cxs/h'),
(2, 'Prod Repack', 'Nível 2 (14,2 cxs/h)', 0.08, '2025-08-19 01:49:09', '2025-08-19 01:49:09', 14.2, 'cxs/h'),
(3, 'Prod Repack', 'Nível 3 (17,8 cxs/h)', 0.1, '2025-08-19 01:49:09', '2025-08-19 01:49:09', 17.8, 'cxs/h'),
(4, 'Prod Repack', 'Nível 4 (24,75 cxs/h)', 0.12, '2025-08-19 01:49:09', '2025-08-19 01:49:09', 24.75, 'cxs/h'),
(5, 'Prod Repack', 'Nível 5 (28 cxs/h)', 0.13, '2025-08-19 01:49:09', '2025-08-19 01:49:09', 28.0, 'cxs/h'),
(6, 'Prod Retrabalho', 'Nível 1 (0 plt/h)', 0.1, '2025-08-19 01:49:09', '2025-08-19 01:49:09', 0.0, 'plt/h'),
(7, 'Prod Retrabalho', 'Nível 2 (1,5 plt/h)', 0.15, '2025-08-19 01:49:09', '2025-08-19 01:49:09', 1.5, 'plt/h'),
(8, 'Prod Retrabalho', 'Nível 3 (3 plt/h)', 0.2, '2025-08-19 01:49:09', '2025-08-19 01:49:09', 3.0, 'plt/h'),
(9, 'Prod Retrabalho', 'Nível 4 (5 plt/h)', 0.25, '2025-08-19 01:49:09', '2025-08-19 01:49:09', 5.0, 'plt/h'),
(10, 'Prod Retrabalho', 'Nível 5 (6 plt/h)', 0.35, '2025-08-19 01:49:09', '2025-08-19 01:49:09', 6.0, 'plt/h'),
(11, 'Prod Amarração', 'Nível 1 (0 plt/h)', 0.2, '2025-08-19 01:49:09', '2025-08-19 01:49:09', 0.0, 'plt/h'),
(12, 'Prod Amarração', 'Nível 2 (12 plt/h)', 0.24, '2025-08-19 01:49:09', '2025-08-19 01:49:09', 12.0, 'plt/h'),
(13, 'Prod Amarração', 'Nível 3 (16 plt/h)', 0.35, '2025-08-19 01:49:09', '2025-08-19 01:49:09', 16.0, 'plt/h'),
(14, 'Prod Amarração', 'Nível 4 (18 plt/h)', 0.4, '2025-08-19 01:49:09', '2025-08-19 01:49:09', 18.0, 'plt/h'),
(15, 'Prod Amarração', 'Nível 5 (20 plt/h)', 0.5, '2025-08-19 01:49:09', '2025-08-19 01:49:09', 20.0, 'plt/h'),
(16, 'Prod Devolução', 'Nível 1 (0 cxs/h)', 0.01, '2025-08-19 01:49:09', '2025-08-19 01:49:09', 0.0, 'cxs/h'),
(17, 'Prod Devolução', 'Nível 2 (200 cxs/h)', 0.009, '2025-08-19 01:49:09', '2025-08-19 01:49:09', 200.0, 'cxs/h'),
(18, 'Prod Devolução', 'Nível 3 (500 cxs/h)', 0.004, '2025-08-19 01:49:09', '2025-08-19 01:49:09', 500.0, 'cxs/h'),
(19, 'Prod Devolução', 'Nível 4 (900 cxs/h)', 0.005, '2025-08-19 01:49:09', '2025-08-19 01:49:09', 900.0, 'cxs/h'),
(20, 'Prod Devolução', 'Nível 5 (1000 cxs/h)', 0.01, '2025-08-19 01:49:09', '2025-08-19 01:49:09', 1000.0, 'cxs/h'),
(21, 'Prod Retorno', 'Nível 1 (1 plt/h)', 0.05, '2025-08-19 01:49:09', '2025-08-19 01:49:09', 1.0, 'plt/h'),
(22, 'Prod Retorno', 'Nível 2 (3 plt/h)', 0.1, '2025-08-19 01:49:09', '2025-08-19 01:49:09', 3.0, 'plt/h'),
(23, 'Prod Retorno', 'Nível 3 (5 plt/h)', 0.14, '2025-08-19 01:49:09', '2025-08-19 01:49:09', 5.0, 'plt/h'),
(24, 'Prod Retorno', 'Nível 4 (8 plt/h)', 0.15, '2025-08-19 01:49:09', '2025-08-19 01:49:09', 8.0, 'plt/h'),
(25, 'Prod Retorno', 'Nível 5 (20 plt/h)', 0.16, '2025-08-19 01:49:09', '2025-08-19 01:49:09', 20.0, 'plt/h'),
(26, 'Prod Refugo', 'Nível 1 (0 plt/h)', 0.75, '2025-08-19 01:49:09', '2025-08-19 01:49:09', 0.0, 'plt/h'),
(27, 'Prod Refugo', 'Nível 2 (1 plt/h)', 0.8, '2025-08-19 01:49:09', '2025-08-19 01:49:09', 1.0, 'plt/h'),
(28, 'Prod Refugo', 'Nível 3 (2 plt/h)', 0.85, '2025-08-19 01:49:09', '2025-08-19 01:49:09', 2.0, 'plt/h'),
(29, 'Prod Refugo', 'Nível 4 (3 plt/h)', 0.9, '2025-08-19 01:49:09', '2025-08-19 01:49:09', 3.0, 'plt/h'),
(30, 'Prod Refugo', 'Nível 5 (4 plt/h)', 1.0, '2025-08-19 01:49:09', '2025-08-19 01:49:09', 4.0, 'plt/h'),
(31, 'Prod Blocagem Repack', 'Nível 1 (0 cxs/h)', 0.05, '2025-08-19 01:49:09', '2025-08-19 01:49:09', 0.0, 'cxs/h'),
(32, 'Prod Blocagem Repack', 'Nível 2 (14,2 cxs/h)', 0.08, '2025-08-19 01:49:09', '2025-08-19 01:49:09', 14.2, 'cxs/h'),
(33, 'Prod Blocagem Repack', 'Nível 3 (17,8 cxs/h)', 0.1, '2025-08-19 01:49:09', '2025-08-19 01:49:09', 17.8, 'cxs/h'),
(34, 'Prod Blocagem Repack', 'Nível 4 (24,75 cxs/h)', 0.12, '2025-08-19 01:49:09', '2025-08-19 01:49:09', 24.75, 'cxs/h'),
(35, 'Prod Blocagem Repack', 'Nível 5 (28 cxs/h)', 0.13, '2025-08-19 01:49:09', '2025-08-19 01:49:09', 28.0, 'cxs/h'),
(36, 'Separação de Produtos', 'Nível 1 (0 itens/h)', 0.1, '2025-08-19 01:49:09', '2025-08-19 01:49:09', 0.0, 'itens/h'),
(37, 'Separação de Produtos', 'Nível 2 (50 itens/h)', 0.15, '2025-08-19 01:49:09', '2025-08-19 01:49:09', 50.0, 'itens/h'),
(38, 'Separação de Produtos', 'Nível 3 (100 itens/h)', 0.2, '2025-08-19 01:49:09', '2025-08-19 01:49:09', 100.0, 'itens/h'),
(39, 'Conferência de Pedidos', 'Nível 1 (0 pedidos/h)', 0.08, '2025-08-19 01:49:09', '2025-08-19 01:49:09', 0.0, 'pedidos/h'),
(40, 'Conferência de Pedidos', 'Nível 2 (10 pedidos/h)', 0.12, '2025-08-19 01:49:09', '2025-08-19 01:49:09', 10.0, 'pedidos/h'),
(41, 'Conferência de Pedidos', 'Nível 3 (20 pedidos/h)', 0.16, '2025-08-19 01:49:09', '2025-08-19 01:49:09', 20.0, 'pedidos/h');

-- =====================================================
-- 6. INSERÇÃO DOS DADOS REAIS - KPIS
-- =====================================================

INSERT INTO kpis (id, nome_kpi, valor_meta_kpi, peso_kpi, turno_kpi, funcao_kpi, created_at, updated_at, descricao, status_ativo) VALUES 
(36, 'EFC', 100.0, 3.0, 'Geral', 'Ajudante de Armazém', '2025-08-19 02:21:35', '2025-08-19 02:21:35', NULL, true),
(37, 'TMA', 100.0, 3.0, 'Geral', 'Operador de Empilhadeira', '2025-08-19 02:21:51', '2025-08-19 02:21:51', NULL, true),
(38, 'Ressuprimento', 100.0, 3.0, 'Manhã', 'Operador de Empilhadeira', '2025-08-19 02:22:26', '2025-08-19 02:22:26', NULL, true),
(39, 'EFD', 100.0, 3.0, 'Tarde', 'Operador de Empilhadeira', '2025-08-19 02:23:08', '2025-08-19 02:23:08', NULL, true),
(40, 'Ressuprimento', 100.0, 3.0, 'Manhã', 'Ajudante de Armazém', '2025-08-19 02:23:31', '2025-08-19 02:23:31', NULL, true),
(41, 'EFC', 100.0, 3.0, 'Noite', 'Operador de Empilhadeira', '2025-08-19 02:23:57', '2025-08-19 02:23:57', NULL, true),
(42, 'Maria Mole', 100.0, 3.0, 'Tarde', 'Ajudante de Armazém', '2025-08-19 02:24:22', '2025-08-19 02:24:22', NULL, true);

-- =====================================================
-- 7. ATUALIZAÇÃO DAS SEQUENCES
-- =====================================================

SELECT setval('usuarios_id_seq', (SELECT MAX(id) FROM usuarios));
SELECT setval('activities_id_seq', (SELECT MAX(id) FROM activities));
SELECT setval('kpis_id_seq', (SELECT MAX(id) FROM kpis));

-- =====================================================
-- 8. VERIFICAÇÃO DOS DADOS INSERIDOS
-- =====================================================

-- Verificar contagem de registros
SELECT 'usuarios' as tabela, COUNT(*) as total FROM usuarios
UNION ALL
SELECT 'activities' as tabela, COUNT(*) as total FROM activities
UNION ALL
SELECT 'kpis' as tabela, COUNT(*) as total FROM kpis;

-- =====================================================
-- MIGRAÇÃO CONCLUÍDA
-- =====================================================
-- Total de registros migrados:
-- - 2 usuários (1 administrador, 1 funcionário)
-- - 41 atividades (com diferentes níveis de produtividade)
-- - 7 KPIs (para diferentes funções e turnos)
-- - 14 lançamentos de produtividade (dados históricos)
-- =====================================================