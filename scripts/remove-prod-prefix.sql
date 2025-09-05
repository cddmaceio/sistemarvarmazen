-- Script para remover o prefixo 'Prod ' dos nomes das atividades
-- na tabela lancamentos_produtividade

-- Primeiro, vamos verificar quais atividades têm o prefixo 'Prod '
SELECT DISTINCT nome_atividade 
FROM lancamentos_produtividade 
WHERE nome_atividade LIKE 'Prod %'
ORDER BY nome_atividade;

-- Contar quantos registros serão afetados no campo nome_atividade
SELECT COUNT(*) as registros_nome_atividade_a_serem_atualizados
FROM lancamentos_produtividade 
WHERE nome_atividade LIKE 'Prod %';

-- Contar quantos registros serão afetados no campo atividades_detalhes
SELECT COUNT(*) as registros_atividades_detalhes_a_serem_atualizados
FROM lancamentos_produtividade 
WHERE atividades_detalhes LIKE '%Prod %';

-- Atualizar os nomes das atividades removendo o prefixo 'Prod '
UPDATE lancamentos_produtividade 
SET nome_atividade = TRIM(SUBSTRING(nome_atividade FROM 6))
WHERE nome_atividade LIKE 'Prod %';

-- Atualizar o campo calculator_data removendo o prefixo 'Prod ' do nome_atividade
UPDATE lancamentos_produtividade 
SET calculator_data = REPLACE(calculator_data, '"nome_atividade":"Prod ', '"nome_atividade":"')
WHERE calculator_data LIKE '%"nome_atividade":"Prod %';

-- Atualizar o campo atividades_detalhes removendo o prefixo 'Prod '
UPDATE lancamentos_produtividade 
SET atividades_detalhes = REPLACE(atividades_detalhes, 'Prod ', '')
WHERE atividades_detalhes LIKE '%Prod %';

-- Verificar o resultado após a atualização
SELECT DISTINCT nome_atividade 
FROM lancamentos_produtividade 
ORDER BY nome_atividade;

-- Confirmar que não há mais atividades com prefixo 'Prod '
SELECT COUNT(*) as atividades_com_prefixo_restantes
FROM lancamentos_produtividade 
WHERE nome_atividade LIKE 'Prod %' OR atividades_detalhes LIKE '%Prod %' OR calculator_data LIKE '%"nome_atividade":"Prod %';