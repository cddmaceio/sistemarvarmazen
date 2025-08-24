-- ========================================
-- SCRIPT PARA CORRIGIR TAREFAS VÁLIDAS
-- ========================================
-- Este script corrige os lançamentos que têm valid_tasks_count preenchido
-- mas tarefas_validas e valor_tarefas como null

-- PASSO 1: Verificar registros que serão afetados
-- Execute esta consulta primeiro para confirmar os dados
SELECT 
    id,
    user_nome,
    funcao,
    data_lancamento,
    valid_tasks_count,
    tarefas_validas,
    valor_tarefas,
    subtotal_atividades,
    -- Mostrar os valores que serão calculados
    valid_tasks_count as "novo_tarefas_validas",
    (valid_tasks_count * 0.093) as "novo_valor_tarefas",
    ((valid_tasks_count * 0.093) / 2) as "novo_subtotal_atividades"
FROM lancamentos_produtividade 
WHERE funcao = 'Operador de Empilhadeira'
  AND valid_tasks_count IS NOT NULL 
  AND valid_tasks_count > 0
  AND (tarefas_validas IS NULL OR valor_tarefas IS NULL)
ORDER BY id;

-- PASSO 2: Executar a correção
-- ATENÇÃO: Este UPDATE irá modificar os dados permanentemente
-- Execute apenas após confirmar que os valores acima estão corretos

UPDATE lancamentos_produtividade 
SET 
    tarefas_validas = valid_tasks_count,
    valor_tarefas = valid_tasks_count * 0.093,
    subtotal_atividades = (valid_tasks_count * 0.093) / 2
WHERE funcao = 'Operador de Empilhadeira'
  AND valid_tasks_count IS NOT NULL 
  AND valid_tasks_count > 0
  AND (tarefas_validas IS NULL OR valor_tarefas IS NULL);

-- PASSO 3: Verificar os resultados após a correção
SELECT 
    id,
    user_nome,
    funcao,
    data_lancamento,
    valid_tasks_count,
    tarefas_validas,
    valor_tarefas,
    subtotal_atividades,
    bonus_kpis,
    remuneracao_total
FROM lancamentos_produtividade 
WHERE funcao = 'Operador de Empilhadeira'
  AND valid_tasks_count IS NOT NULL 
  AND valid_tasks_count > 0
ORDER BY id;

-- PASSO 4: Verificar se todos os lançamentos agora aparecerão no frontend
-- Esta consulta deve retornar apenas lançamentos que aparecerão no histórico
SELECT 
    id,
    user_nome,
    data_lancamento,
    tarefas_validas,
    valor_tarefas,
    remuneracao_total,
    'APARECERÁ NO FRONTEND' as status_frontend
FROM lancamentos_produtividade 
WHERE funcao = 'Operador de Empilhadeira'
  AND tarefas_validas IS NOT NULL 
  AND valor_tarefas IS NOT NULL
  AND tarefas_validas > 0
ORDER BY data_lancamento DESC;

-- ========================================
-- RESUMO DA CORREÇÃO:
-- ========================================
-- IDs afetados: 2, 4, 6, 7, 10
-- Usuário: DILSON ARLINDO DOS SANTOS
-- Função: Operador de Empilhadeira
-- 
-- Fórmulas aplicadas:
-- - tarefas_validas = valid_tasks_count
-- - valor_tarefas = valid_tasks_count * 0.093
-- - subtotal_atividades = (valid_tasks_count * 0.093) / 2
-- ========================================