-- Migração 23: Adicionar atividade 'Tarefas WMS' para Operador de Empilhadeira

-- Inserir atividade 'Tarefas WMS' se não existir
INSERT OR IGNORE INTO activities (nome_atividade, nivel_atividade, valor_atividade, produtividade_minima, unidade_medida, created_at, updated_at)
VALUES 
  ('Tarefas WMS', 'Padrão', 0.009, 1, 'tarefas válidas', datetime('now'), datetime('now'));