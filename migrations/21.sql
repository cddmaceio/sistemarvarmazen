
-- Inserir usuário de teste se não existir
INSERT OR IGNORE INTO usuarios (cpf, data_nascimento, nome, role, is_active, funcao, created_at, updated_at)
VALUES ('123.456.789-00', '1985-05-15', 'João Silva', 'user', true, 'Ajudante de Armazém', datetime('now'), datetime('now'));

-- Inserir algumas atividades base se não existirem
INSERT OR IGNORE INTO activities (nome_atividade, nivel_atividade, valor_atividade, produtividade_minima, unidade_medida, created_at, updated_at)
VALUES 
  ('Separação de Produtos', 'Básico', 0.50, 50, 'itens/hora', datetime('now'), datetime('now')),
  ('Separação de Produtos', 'Intermediário', 0.75, 80, 'itens/hora', datetime('now'), datetime('now')),
  ('Separação de Produtos', 'Avançado', 1.00, 120, 'itens/hora', datetime('now'), datetime('now')),
  ('Conferência de Pedidos', 'Básico', 0.60, 30, 'pedidos/hora', datetime('now'), datetime('now')),
  ('Conferência de Pedidos', 'Intermediário', 0.85, 50, 'pedidos/hora', datetime('now'), datetime('now')),
  ('Conferência de Pedidos', 'Avançado', 1.10, 75, 'pedidos/hora', datetime('now'), datetime('now'));

-- Inserir alguns KPIs base se não existirem
INSERT OR IGNORE INTO kpis (nome_kpi, descricao, valor_meta_kpi, peso_kpi, turno_kpi, funcao_kpi, status_ativo, created_at, updated_at)
VALUES 
  ('Pontualidade', 'Chegada no horário durante o mês', 95, 25, 'Geral', 'Ajudante de Armazém', true, datetime('now'), datetime('now')),
  ('Qualidade', 'Baixo índice de erros na separação', 98, 30, 'Geral', 'Ajudante de Armazém', true, datetime('now'), datetime('now')),
  ('Produtividade Extra', 'Superação das metas diárias', 110, 35, 'Manhã', 'Ajudante de Armazém', true, datetime('now'), datetime('now')),
  ('Organização', 'Manutenção da organização do setor', 90, 20, 'Tarde', 'Ajudante de Armazém', true, datetime('now'), datetime('now')),
  ('Segurança', 'Cumprimento das normas de segurança', 100, 40, 'Geral', 'Operador de Empilhadeira', true, datetime('now'), datetime('now')),
  ('Eficiência', 'Tempo médio por tarefa dentro do padrão', 95, 35, 'Manhã', 'Operador de Empilhadeira', true, datetime('now'), datetime('now'));
