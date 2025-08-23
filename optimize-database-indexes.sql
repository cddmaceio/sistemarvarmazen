-- =====================================================
-- OTIMIZAÇÃO DE ÍNDICES PARA PERFORMANCE DE INSERÇÃO
-- Execute este script no SQL Editor do Supabase
-- =====================================================

-- 1. Remover índices desnecessários durante inserções em massa
-- (podem ser recriados após a inserção)
DROP INDEX IF EXISTS idx_tarefas_wms_data_criacao;
DROP INDEX IF EXISTS idx_tarefas_wms_data_alteracao;
DROP INDEX IF EXISTS idx_tarefas_wms_usuario_data_alteracao;
DROP INDEX IF EXISTS idx_tarefas_wms_status_data_alteracao;
DROP INDEX IF EXISTS idx_tarefas_wms_tarefa_valida_data_alteracao;

-- 2. Manter apenas índices essenciais para upsert
-- Índice para a constraint única (necessário para upsert)
CREATE INDEX IF NOT EXISTS idx_tarefas_wms_upsert_key 
ON tarefas_wms(data_alteracao, usuario, status);

-- Índice para user_id (usado nas consultas)
CREATE INDEX IF NOT EXISTS idx_tarefas_wms_user_id ON tarefas_wms(user_id);

-- Índice para tarefa_valida (usado nas estatísticas)
CREATE INDEX IF NOT EXISTS idx_tarefas_wms_valida ON tarefas_wms(tarefa_valida);

-- 3. Configurar parâmetros de performance para inserções
-- Aumentar work_mem temporariamente para operações de inserção
SET work_mem = '256MB';

-- Desabilitar autovacuum temporariamente durante inserções grandes
ALTER TABLE tarefas_wms SET (autovacuum_enabled = false);

-- 4. Criar função para recriar índices após inserção
CREATE OR REPLACE FUNCTION recreate_tarefas_wms_indexes()
RETURNS void AS $$
BEGIN
    -- Recriar índices otimizados após inserção
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tarefas_wms_data_criacao 
    ON tarefas_wms(data_criacao);
    
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tarefas_wms_data_alteracao 
    ON tarefas_wms(data_alteracao);
    
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tarefas_wms_usuario_data_alteracao 
    ON tarefas_wms(usuario, data_alteracao);
    
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tarefas_wms_status_data_alteracao 
    ON tarefas_wms(status, data_alteracao);
    
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tarefas_wms_tarefa_valida_data_alteracao 
    ON tarefas_wms(tarefa_valida, data_alteracao);
    
    -- Reabilitar autovacuum
    ALTER TABLE tarefas_wms SET (autovacuum_enabled = true);
    
    -- Executar VACUUM ANALYZE para atualizar estatísticas
    VACUUM ANALYZE tarefas_wms;
    
    RAISE NOTICE 'Índices recriados e tabela otimizada com sucesso!';
END;
$$ LANGUAGE plpgsql;

-- 5. Criar função para preparar inserção em massa
CREATE OR REPLACE FUNCTION prepare_bulk_insert()
RETURNS void AS $$
BEGIN
    -- Configurações para melhor performance de inserção
    SET work_mem = '256MB';
    SET maintenance_work_mem = '512MB';
    SET checkpoint_completion_target = 0.9;
    SET wal_buffers = '16MB';
    
    -- Desabilitar autovacuum temporariamente
    ALTER TABLE tarefas_wms SET (autovacuum_enabled = false);
    
    RAISE NOTICE 'Banco preparado para inserção em massa!';
END;
$$ LANGUAGE plpgsql;

-- 6. Verificar índices atuais
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'tarefas_wms'
ORDER BY indexname;

-- 7. Verificar estatísticas da tabela
SELECT 
    schemaname,
    relname as tablename,
    n_tup_ins as inserções,
    n_tup_upd as atualizações,
    n_tup_del as exclusões,
    n_live_tup as linhas_ativas,
    n_dead_tup as linhas_mortas,
    last_vacuum,
    last_autovacuum,
    last_analyze,
    last_autoanalyze
FROM pg_stat_user_tables 
WHERE relname = 'tarefas_wms';

-- =====================================================
-- INSTRUÇÕES DE USO:
-- =====================================================
-- 1. Execute este script antes de fazer inserções grandes
-- 2. Execute prepare_bulk_insert() antes da inserção
-- 3. Execute recreate_tarefas_wms_indexes() após a inserção
-- =====================================================

SELECT 'Otimização de índices configurada com sucesso!' as status;