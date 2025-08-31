-- Script para corrigir lançamentos antigos que têm valid_tasks_count mas tarefas_validas/valor_tarefas null
-- Aplicar a mesma lógica da API: tarefas_validas = valid_tasks_count, valor_tarefas = valid_tasks_count * 0.093

-- Primeiro, vamos verificar quantos registros serão afetados
SELECT 
    id,
    user_nome,
    funcao,
    data_lancamento,
    valid_tasks_count,
    tarefas_validas,
    valor_tarefas,
    subtotal_atividades
FROM lancamentos_produtividade 
WHERE funcao = 'Operador de Empilhadeira'
  AND valid_tasks_count IS NOT NULL 
  AND valid_tasks_count > 0
  AND (tarefas_validas IS NULL OR valor_tarefas IS NULL)
ORDER BY id;

-- Agora vamos corrigir os dados
UPDATE lancamentos_produtividade 
SET 
    tarefas_validas = valid_tasks_count,
    valor_tarefas = valid_tasks_count * 0.093,
    -- Também vamos recalcular o subtotal_atividades aplicando a regra dos 50%
    subtotal_atividades = (valid_tasks_count * 0.093) / 2
WHERE funcao = 'Operador de Empilhadeira'
  AND valid_tasks_count IS NOT NULL 
  AND valid_tasks_count > 0
  AND (tarefas_validas IS NULL OR valor_tarefas IS NULL);

-- Verificar os resultados após a correção
SELECT 
    id,
    user_nome,
    funcao,
    data_lancamento,
    valid_tasks_count,
    tarefas_validas,
    valor_tarefas,
    subtotal_atividades,
    remuneracao_total
FROM lancamentos_produtividade 
WHERE funcao = 'Operador de Empilhadeira'
  AND valid_tasks_count IS NOT NULL 
  AND valid_tasks_count > 0
ORDER BY id;