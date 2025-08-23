-- Rollback da migração 23: Remover atividade 'Tarefas WMS'

-- Remover atividade 'Tarefas WMS'
DELETE FROM activities WHERE nome_atividade = 'Tarefas WMS';