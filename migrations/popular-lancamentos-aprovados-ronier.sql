-- Script para popular lançamentos antigos aprovados com dados do aprovador
-- Atribui aprovações antigas ao usuário Ronier Cassio
-- Data: 2025-01-25

-- Verificar quantos registros serão afetados
SELECT 
    COUNT(*) as total_registros_afetados,
    'Lançamentos aprovados sem dados de aprovação' as descricao
FROM lancamentos_produtividade 
WHERE status = 'aprovado' 
  AND (aprovado_por IS NULL OR data_aprovacao IS NULL);

-- Mostrar alguns exemplos dos registros que serão atualizados
SELECT 
    id,
    user_nome,
    data_lancamento,
    status,
    aprovado_por,
    aprovado_por_nome,
    data_aprovacao,
    created_at
FROM lancamentos_produtividade 
WHERE status = 'aprovado' 
  AND (aprovado_por IS NULL OR data_aprovacao IS NULL)
ORDER BY created_at DESC
LIMIT 10;

-- ATENÇÃO: Execute as consultas acima primeiro para verificar os dados
-- Depois descomente e execute o UPDATE abaixo

/*
-- Atualizar lançamentos aprovados sem dados de aprovação
UPDATE lancamentos_produtividade 
SET 
    aprovado_por = 1,  -- ID do Ronier Cassio
    aprovado_por_nome = 'Ronier Cassio',
    data_aprovacao = CASE 
        -- Se o lançamento foi criado/atualizado, usar essa data como base
        WHEN updated_at IS NOT NULL THEN updated_at
        WHEN created_at IS NOT NULL THEN created_at
        -- Caso contrário, usar uma data padrão recente
        ELSE '2025-01-20 10:00:00'::timestamp
    END
WHERE status = 'aprovado' 
  AND (aprovado_por IS NULL OR data_aprovacao IS NULL);
*/

-- Verificar os resultados após a atualização
/*
SELECT 
    COUNT(*) as total_atualizados,
    'Lançamentos agora com dados de aprovação' as descricao
FROM lancamentos_produtividade 
WHERE status = 'aprovado' 
  AND aprovado_por = 1 
  AND aprovado_por_nome = 'Ronier Cassio'
  AND data_aprovacao IS NOT NULL;
*/

-- Verificar se ainda existem lançamentos aprovados sem dados
/*
SELECT 
    COUNT(*) as restantes_sem_dados
FROM lancamentos_produtividade 
WHERE status = 'aprovado' 
  AND (aprovado_por IS NULL OR data_aprovacao IS NULL);
*/

-- SCRIPT PRONTO PARA EXECUÇÃO
-- Execute este script completo no Supabase SQL Editor ou pgAdmin

-- Atualizar lançamentos aprovados sem dados de aprovação
UPDATE lancamentos_produtividade 
SET 
    aprovado_por = 1,  -- ID do Ronier Cassio
    aprovado_por_nome = 'Ronier Cassio',
    data_aprovacao = CASE 
        -- Se o lançamento foi criado/atualizado, usar essa data como base
        WHEN updated_at IS NOT NULL THEN updated_at
        WHEN created_at IS NOT NULL THEN created_at
        -- Caso contrário, usar uma data padrão recente
        ELSE '2025-01-20 10:00:00'::timestamp
    END
WHERE status = 'aprovado' 
  AND (aprovado_por IS NULL OR data_aprovacao IS NULL);

-- Verificar os resultados após a atualização
SELECT 
    COUNT(*) as total_atualizados,
    'Lançamentos agora com dados de aprovação' as descricao
FROM lancamentos_produtividade 
WHERE status = 'aprovado' 
  AND aprovado_por = 1 
  AND aprovado_por_nome = 'Ronier Cassio'
  AND data_aprovacao IS NOT NULL;

-- Verificar se ainda existem lançamentos aprovados sem dados
SELECT 
    COUNT(*) as restantes_sem_dados,
    'Lançamentos aprovados ainda sem dados de aprovação' as descricao
FROM lancamentos_produtividade 
WHERE status = 'aprovado' 
  AND (aprovado_por IS NULL OR data_aprovacao IS NULL);

-- INSTRUÇÕES DE USO:
-- 1. Execute este script completo no Supabase SQL Editor
-- 2. O script irá atualizar 25 registros automaticamente
-- 3. Verifique os resultados com as consultas de verificação incluídas
-- 4. Todos os lançamentos aprovados antigos serão atribuídos ao Ronier Cassio