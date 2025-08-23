-- Migration 22 Down: Remover tabelas WMS
-- Remove as tabelas cadastro_wms e tarefas_wms

-- Remover triggers
DROP TRIGGER IF EXISTS calculate_tarefa_valida;
DROP TRIGGER IF EXISTS update_tarefas_wms_updated_at;
DROP TRIGGER IF EXISTS update_cadastro_wms_updated_at;

-- Remover índices
DROP INDEX IF EXISTS idx_tarefas_wms_usuario;
DROP INDEX IF EXISTS idx_tarefas_wms_tarefa_valida;
DROP INDEX IF EXISTS idx_tarefas_wms_status;
DROP INDEX IF EXISTS idx_tarefas_wms_data_criacao;
DROP INDEX IF EXISTS idx_tarefas_wms_user_id;
DROP INDEX IF EXISTS idx_cadastro_wms_login;
DROP INDEX IF EXISTS idx_cadastro_wms_cpf;

-- Remover tabelas
DROP TABLE IF EXISTS tarefas_wms;
DROP TABLE IF EXISTS cadastro_wms;