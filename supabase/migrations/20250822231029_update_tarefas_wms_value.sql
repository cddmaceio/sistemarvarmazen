-- Migração: Atualizar valor da atividade 'Tarefas WMS' para R$ 0,093

-- Atualizar o valor da atividade 'Tarefas WMS' de 0.009 para 0.093
UPDATE activities 
SET valor_atividade = 0.093, 
    updated_at = CURRENT_TIMESTAMP
WHERE nome_atividade = 'Tarefas WMS' 
  AND nivel_atividade = 'Padrão';

-- Verificar se a atualização foi aplicada
-- SELECT nome_atividade, nivel_atividade, valor_atividade, unidade_medida 
-- FROM activities 
-- WHERE nome_atividade = 'Tarefas WMS';