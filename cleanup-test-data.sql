-- Script para limpar dados de teste antes do deploy em produção
-- Execute este script no Supabase SQL Editor

-- ATENÇÃO: Este script irá apagar os dados de teste criados durante os testes!
-- Certifique-se de que deseja fazer isso antes de executar

-- 1. Verificar os lançamentos de teste criados
SELECT 
    id,
    user_nome,
    data_lancamento,
    funcao,
    valid_tasks_count,
    tarefas_validas,
    valor_tarefas,
    remuneracao_total,
    created_at
FROM lancamentos_produtividade 
WHERE data_lancamento = '2025-01-15'
ORDER BY created_at DESC;

-- 2. Apagar os lançamentos de teste específicos (IDs 2, 3, 4)
-- Descomente a linha abaixo quando estiver pronto para executar
 DELETE FROM lancamentos_produtividade WHERE id IN (2, 3, 4);

-- 3. Verificar se os dados foram removidos
-- SELECT COUNT(*) as total_apos_limpeza FROM lancamentos_produtividade;

-- 4. OPCIONAL: Resetar a sequência do ID para começar do 1
-- Descomente as linhas abaixo se quiser resetar a sequência
-- SELECT setval('lancamentos_produtividade_id_seq', 1, false);

-- 5. Verificar integridade dos dados restantes
SELECT 
    COUNT(*) as total_lancamentos,
    COUNT(CASE WHEN funcao = 'Operador de Empilhadeira' THEN 1 END) as operadores_empilhadeira,
    COUNT(CASE WHEN funcao LIKE '%Auxiliar%' OR funcao LIKE '%Ajudante%' THEN 1 END) as auxiliares_armazem
FROM lancamentos_produtividade;

-- 6. Verificar se não há dados órfãos ou inconsistentes
SELECT 
    l.id,
    l.user_nome,
    l.funcao,
    u.nome as nome_usuario,
    u.funcao as funcao_usuario
FROM lancamentos_produtividade l
LEFT JOIN usuarios u ON l.user_id = u.id
WHERE u.id IS NULL
ORDER BY l.created_at DESC;

-- Comentários:
-- Este script ajuda a limpar os dados de teste e verificar a integridade
-- antes de fazer o deploy em produção. Execute cada seção conforme necessário.