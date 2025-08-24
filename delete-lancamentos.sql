-- Script para apagar todos os lançamentos da tabela lancamentos_produtividade
-- Execute este script no Supabase SQL Editor para limpar os dados de teste

-- ATENÇÃO: Este script irá apagar TODOS os lançamentos!
-- Certifique-se de que deseja fazer isso antes de executar

-- Primeiro, vamos verificar quantos registros existem
SELECT COUNT(*) as total_lancamentos FROM lancamentos_produtividade;

-- Mostrar alguns exemplos dos dados que serão apagados
SELECT 
    id,
    user_nome,
    data_lancamento,
    valid_tasks_count,
    tarefas_validas,
    valor_tarefas,
    created_at
FROM lancamentos_produtividade 
ORDER BY created_at DESC 
LIMIT 10;

-- COMANDO PARA APAGAR TODOS OS LANÇAMENTOS
-- Descomente a linha abaixo quando estiver pronto para executar
-- DELETE FROM lancamentos_produtividade;

-- Verificar se a tabela está vazia após a exclusão
-- SELECT COUNT(*) as total_apos_exclusao FROM lancamentos_produtividade;

-- OPCIONAL: Resetar a sequência do ID (se necessário)
-- ALTER SEQUENCE lancamentos_produtividade_id_seq RESTART WITH 1;