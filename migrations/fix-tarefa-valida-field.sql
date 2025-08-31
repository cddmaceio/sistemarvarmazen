-- Script para corrigir o campo tarefa_valida em todas as tarefas existentes
-- Baseado no tempo de execução e metas por tipo de tarefa

-- 1. Primeiro, vamos verificar o estado atual
SELECT 
  'Estado atual das tarefas' as info,
  COUNT(*) as total_tarefas,
  COUNT(CASE WHEN tarefa_valida = true THEN 1 END) as tarefas_validas_atual,
  COUNT(CASE WHEN tempo_execucao > 10 THEN 1 END) as tarefas_com_tempo_maior_10s
FROM tarefas_wms;

-- 2. Verificar tarefas do ALMIR especificamente
SELECT 
  'Tarefas do ALMIR - Estado atual' as info,
  COUNT(*) as total_tarefas,
  COUNT(CASE WHEN tarefa_valida = true THEN 1 END) as tarefas_validas_atual,
  COUNT(CASE WHEN tempo_execucao > 10 THEN 1 END) as tarefas_com_tempo_maior_10s
FROM tarefas_wms 
WHERE usuario ILIKE '%ALMIR%';

-- 3. Atualizar campo tarefa_valida baseado no tempo de execução
-- Regra: tarefa_valida = true se tempo_execucao > 10 segundos
UPDATE tarefas_wms 
SET tarefa_valida = CASE 
  WHEN tempo_execucao > 10 THEN true 
  ELSE false 
END;

-- 4. Verificar o resultado após a atualização
SELECT 
  'Estado após atualização' as info,
  COUNT(*) as total_tarefas,
  COUNT(CASE WHEN tarefa_valida = true THEN 1 END) as tarefas_validas_atualizadas,
  COUNT(CASE WHEN tempo_execucao > 10 THEN 1 END) as tarefas_com_tempo_maior_10s
FROM tarefas_wms;

-- 5. Verificar tarefas do ALMIR após atualização
SELECT 
  'Tarefas do ALMIR - Após atualização' as info,
  COUNT(*) as total_tarefas,
  COUNT(CASE WHEN tarefa_valida = true THEN 1 END) as tarefas_validas_atualizadas,
  COUNT(CASE WHEN tempo_execucao > 10 THEN 1 END) as tarefas_com_tempo_maior_10s
FROM tarefas_wms 
WHERE usuario ILIKE '%ALMIR%';

-- 6. Mostrar algumas tarefas do ALMIR para verificação
SELECT 
  id,
  usuario,
  tipo,
  tempo_execucao,
  tarefa_valida,
  data_alteracao,
  created_at
FROM tarefas_wms 
WHERE usuario ILIKE '%ALMIR%'
  AND tempo_execucao > 10
ORDER BY data_alteracao DESC
LIMIT 10;

-- 7. Verificar distribuição por tipo de tarefa
SELECT 
  tipo,
  COUNT(*) as total,
  COUNT(CASE WHEN tarefa_valida = true THEN 1 END) as validas,
  COUNT(CASE WHEN tempo_execucao > 10 THEN 1 END) as tempo_maior_10s,
  ROUND(AVG(tempo_execucao), 2) as tempo_medio
FROM tarefas_wms 
WHERE usuario ILIKE '%ALMIR%'
GROUP BY tipo
ORDER BY total DESC;

-- 8. Verificar se há inconsistências (tarefa_valida diferente do esperado)
SELECT 
  'Verificação de consistência' as info,
  COUNT(CASE WHEN tarefa_valida = true AND tempo_execucao <= 10 THEN 1 END) as inconsistencias_valida_true,
  COUNT(CASE WHEN tarefa_valida = false AND tempo_execucao > 10 THEN 1 END) as inconsistencias_valida_false
FROM tarefas_wms;

COMMIT;