-- Script para limpar a base de dados dos lançamentos de produtividade
-- Execute este script no Supabase SQL Editor

-- 1. Limpar tabela de histórico de lançamentos aprovados
DELETE FROM historico_lancamentos_aprovados;

-- 2. Limpar tabela de lançamentos revisados
DELETE FROM lancamentos_produtividade_revisado;

-- 3. Limpar tabela principal de lançamentos
DELETE FROM lancamentos_produtividade;

-- 4. Resetar sequências (se existirem)
-- Verificar se há sequências para resetar
SELECT setval(pg_get_serial_sequence('lancamentos_produtividade', 'id'), 1, false);
SELECT setval(pg_get_serial_sequence('lancamentos_produtividade_revisado', 'id'), 1, false);
SELECT setval(pg_get_serial_sequence('historico_lancamentos_aprovados', 'id'), 1, false);

-- 5. Verificar se as tabelas estão vazias
SELECT 'lancamentos_produtividade' as tabela, COUNT(*) as registros FROM lancamentos_produtividade
UNION ALL
SELECT 'lancamentos_produtividade_revisado' as tabela, COUNT(*) as registros FROM lancamentos_produtividade_revisado
UNION ALL
SELECT 'historico_lancamentos_aprovados' as tabela, COUNT(*) as registros FROM historico_lancamentos_aprovados;

-- IMPORTANTE: Execute este script com cuidado!
-- Todos os dados de lançamentos serão perdidos permanentemente.
-- Certifique-se de fazer backup se necessário antes da execução.