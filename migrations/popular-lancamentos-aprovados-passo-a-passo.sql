-- Script PASSO A PASSO para popular lançamentos antigos aprovados
-- Execução segura com verificações em cada etapa
-- Atribui aprovações antigas ao usuário Ronier Cassio (ID: 1)
-- Data: 2025-01-25

-- ========================================
-- PASSO 1: VERIFICAR DADOS ATUAIS
-- ========================================

-- Verificar quantos registros serão afetados
SELECT 
    COUNT(*) as total_registros_afetados,
    'Lançamentos aprovados sem dados de aprovação' as descricao
FROM lancamentos_produtividade 
WHERE status = 'aprovado' 
  AND (aprovado_por IS NULL OR data_aprovacao IS NULL);

-- Mostrar detalhes dos registros que serão atualizados
SELECT 
    id,
    user_nome,
    data_lancamento,
    status,
    aprovado_por,
    aprovado_por_nome,
    data_aprovacao,
    created_at,
    updated_at
FROM lancamentos_produtividade 
WHERE status = 'aprovado' 
  AND (aprovado_por IS NULL OR data_aprovacao IS NULL)
ORDER BY created_at DESC;

-- ========================================
-- PASSO 2: VERIFICAR USUÁRIO RONIER CASSIO
-- ========================================

-- Confirmar dados do usuário Ronier Cassio
SELECT 
    id,
    nome,
    tipo_usuario
FROM usuarios 
WHERE id = 1;

-- ========================================
-- PASSO 3: EXECUTAR ATUALIZAÇÃO (DESCOMENTE PARA EXECUTAR)
-- ========================================

/*
-- ATENÇÃO: Descomente este bloco apenas após verificar os passos 1 e 2

BEGIN;

-- Atualizar lançamentos aprovados sem dados de aprovação
UPDATE lancamentos_produtividade 
SET 
    aprovado_por = 1,  -- ID do Ronier Cassio
    aprovado_por_nome = 'Ronier Cassio',
    data_aprovacao = CASE 
        -- Usar updated_at se disponível (mais recente)
        WHEN updated_at IS NOT NULL THEN updated_at
        -- Senão usar created_at
        WHEN created_at IS NOT NULL THEN created_at
        -- Caso contrário, usar data padrão
        ELSE '2025-01-20 10:00:00'::timestamp
    END
WHERE status = 'aprovado' 
  AND (aprovado_por IS NULL OR data_aprovacao IS NULL);

-- Verificar quantos registros foram afetados
SELECT 
    ROW_COUNT() as registros_atualizados;

-- Se tudo estiver correto, confirme a transação:
-- COMMIT;

-- Se algo estiver errado, desfaça a transação:
-- ROLLBACK;

*/

-- ========================================
-- PASSO 4: VERIFICAÇÕES PÓS-ATUALIZAÇÃO
-- ========================================

-- Verificar total de lançamentos com dados de aprovação do Ronier
SELECT 
    COUNT(*) as total_aprovados_ronier,
    'Lançamentos aprovados por Ronier Cassio' as descricao
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

-- Mostrar alguns exemplos dos registros atualizados
SELECT 
    id,
    user_nome,
    data_lancamento,
    status,
    aprovado_por,
    aprovado_por_nome,
    data_aprovacao
FROM lancamentos_produtividade 
WHERE status = 'aprovado' 
  AND aprovado_por = 1
  AND aprovado_por_nome = 'Ronier Cassio'
ORDER BY data_aprovacao DESC
LIMIT 10;

-- ========================================
-- INSTRUÇÕES DE USO:
-- ========================================
/*
1. Execute os PASSOS 1 e 2 para verificar os dados
2. Analise os resultados e confirme se está tudo correto
3. Descomente o PASSO 3 e execute a atualização
4. Use COMMIT para confirmar ou ROLLBACK para desfazer
5. Execute o PASSO 4 para verificar os resultados finais

Este script irá:
- Atualizar aproximadamente 25 lançamentos aprovados
- Atribuir todos ao Ronier Cassio (ID: 1)
- Usar a data de criação/atualização como data de aprovação
- Manter a integridade dos dados existentes
*/