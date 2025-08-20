-- =====================================================
-- MIGRAÇÃO PARA ADICIONAR COLUNAS FALTANTES
-- Baseado na estrutura atual do Supabase
-- =====================================================

-- Adicionar colunas faltantes na tabela lancamentos_produtividade
ALTER TABLE lancamentos_produtividade 
ADD COLUMN IF NOT EXISTS user_id INTEGER,
ADD COLUMN IF NOT EXISTS user_nome TEXT,
ADD COLUMN IF NOT EXISTS user_cpf TEXT,
ADD COLUMN IF NOT EXISTS funcao TEXT DEFAULT 'Ajudante de Armazém',
ADD COLUMN IF NOT EXISTS nome_atividade TEXT,
ADD COLUMN IF NOT EXISTS quantidade_produzida INTEGER,
ADD COLUMN IF NOT EXISTS tempo_horas DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS input_adicional DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS multiple_activities TEXT,
ADD COLUMN IF NOT EXISTS nome_operador TEXT,
ADD COLUMN IF NOT EXISTS valid_tasks_count INTEGER,
ADD COLUMN IF NOT EXISTS kpis_atingidos TEXT,
ADD COLUMN IF NOT EXISTS subtotal_atividades DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS bonus_kpis DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS remuneracao_total DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS produtividade_alcancada DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS nivel_atingido TEXT,
ADD COLUMN IF NOT EXISTS unidade_medida TEXT,
ADD COLUMN IF NOT EXISTS atividades_detalhes TEXT,
ADD COLUMN IF NOT EXISTS tarefas_validas INTEGER,
ADD COLUMN IF NOT EXISTS valor_tarefas DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS editado_por_admin TEXT,
ADD COLUMN IF NOT EXISTS data_edicao TIMESTAMP,
ADD COLUMN IF NOT EXISTS valores_originais TEXT,
ADD COLUMN IF NOT EXISTS status_edicao TEXT DEFAULT 'original',
ADD COLUMN IF NOT EXISTS observacoes_edicao TEXT;

-- Adicionar colunas faltantes na tabela lancamentos_produtividade_revisado
ALTER TABLE lancamentos_produtividade_revisado 
ADD COLUMN IF NOT EXISTS admin_user_id INTEGER,
ADD COLUMN IF NOT EXISTS admin_nome TEXT,
ADD COLUMN IF NOT EXISTS user_id INTEGER,
ADD COLUMN IF NOT EXISTS user_nome TEXT,
ADD COLUMN IF NOT EXISTS user_cpf TEXT,
ADD COLUMN IF NOT EXISTS data_lancamento DATE,
ADD COLUMN IF NOT EXISTS funcao TEXT,
ADD COLUMN IF NOT EXISTS turno TEXT,
ADD COLUMN IF NOT EXISTS nome_atividade TEXT,
ADD COLUMN IF NOT EXISTS quantidade_produzida INTEGER,
ADD COLUMN IF NOT EXISTS tempo_horas DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS input_adicional DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS multiple_activities TEXT,
ADD COLUMN IF NOT EXISTS nome_operador TEXT,
ADD COLUMN IF NOT EXISTS valid_tasks_count INTEGER,
ADD COLUMN IF NOT EXISTS kpis_atingidos TEXT,
ADD COLUMN IF NOT EXISTS subtotal_atividades DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS bonus_kpis DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS remuneracao_total DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS produtividade_alcancada DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS nivel_atingido TEXT,
ADD COLUMN IF NOT EXISTS unidade_medida TEXT,
ADD COLUMN IF NOT EXISTS atividades_detalhes TEXT,
ADD COLUMN IF NOT EXISTS tarefas_validas INTEGER,
ADD COLUMN IF NOT EXISTS valor_tarefas DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS acao_admin TEXT,
ADD COLUMN IF NOT EXISTS observacoes_admin TEXT,
ADD COLUMN IF NOT EXISTS alteracoes_feitas TEXT;

-- Adicionar colunas faltantes na tabela historico_lancamentos_aprovados
ALTER TABLE historico_lancamentos_aprovados 
ADD COLUMN IF NOT EXISTS colaborador_id INTEGER,
ADD COLUMN IF NOT EXISTS colaborador_nome TEXT,
ADD COLUMN IF NOT EXISTS colaborador_cpf TEXT,
ADD COLUMN IF NOT EXISTS editado BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS editado_por TEXT,
ADD COLUMN IF NOT EXISTS dados_finais TEXT,
ADD COLUMN IF NOT EXISTS remuneracao_total DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Adicionar colunas faltantes na tabela log_exportacoes
ALTER TABLE log_exportacoes 
ADD COLUMN IF NOT EXISTS admin_id INTEGER,
ADD COLUMN IF NOT EXISTS admin_nome TEXT,
ADD COLUMN IF NOT EXISTS formato_exportacao TEXT,
ADD COLUMN IF NOT EXISTS nome_arquivo TEXT,
ADD COLUMN IF NOT EXISTS data_exportacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS ip_origem TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Adicionar colunas faltantes na tabela user_profiles
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS tipo_usuario TEXT DEFAULT 'colaborador',
ADD COLUMN IF NOT EXISTS status_usuario TEXT DEFAULT 'ativo';

-- Criar índices para otimização
CREATE INDEX IF NOT EXISTS idx_lancamentos_user_id ON lancamentos_produtividade(user_id);
CREATE INDEX IF NOT EXISTS idx_lancamentos_data ON lancamentos_produtividade(data_lancamento);
CREATE INDEX IF NOT EXISTS idx_lancamentos_status ON lancamentos_produtividade(status);
CREATE INDEX IF NOT EXISTS idx_lancamentos_funcao ON lancamentos_produtividade(funcao);
CREATE INDEX IF NOT EXISTS idx_lancamentos_turno ON lancamentos_produtividade(turno);

-- Função para atualizar updated_at (se não existir)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at (apenas se não existirem)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_lancamentos_updated_at') THEN
        CREATE TRIGGER update_lancamentos_updated_at 
        BEFORE UPDATE ON lancamentos_produtividade 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_lancamentos_revisado_updated_at') THEN
        CREATE TRIGGER update_lancamentos_revisado_updated_at 
        BEFORE UPDATE ON lancamentos_produtividade_revisado 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_historico_updated_at') THEN
        CREATE TRIGGER update_historico_updated_at 
        BEFORE UPDATE ON historico_lancamentos_aprovados 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_log_exportacoes_updated_at') THEN
        CREATE TRIGGER update_log_exportacoes_updated_at 
        BEFORE UPDATE ON log_exportacoes 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_profiles_updated_at') THEN
        CREATE TRIGGER update_user_profiles_updated_at 
        BEFORE UPDATE ON user_profiles 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END
$$;

-- =====================================================
-- COMENTÁRIOS FINAIS
-- =====================================================
-- Este script adiciona apenas as colunas que faltam:
-- 1. Colunas para valores calculados na tabela lancamentos_produtividade
-- 2. Colunas de controle e metadados necessárias
-- 3. Índices para performance
-- 4. Triggers para atualização automática de timestamps
--
-- Compatível com a estrutura atual do Supabase
-- Execute este script no SQL Editor do Supabase
-- =====================================================