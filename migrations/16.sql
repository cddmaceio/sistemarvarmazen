
INSERT OR REPLACE INTO usuarios (cpf, data_nascimento, nome, role, is_active, funcao, created_at, updated_at) VALUES
  ('987.654.321-00', '1980-12-20', 'Ronier Cassio', 'admin', true, 'Administrador', datetime('now'), datetime('now')),
  ('087.495.304-96', '1990-11-01', 'João Silva', 'user', true, 'Ajudante de Armazém', datetime('now'), datetime('now')),
  ('123.456.789-01', '1985-05-15', 'Maria Santos', 'user', true, 'Conferente', datetime('now'), datetime('now')),
  ('456.789.123-02', '1992-03-25', 'Pedro Costa', 'user', true, 'Operador de Empilhadeira', datetime('now'), datetime('now')),
  ('789.123.456-03', '1988-09-10', 'Ana Lima', 'user', true, 'Ajudante de Armazém', datetime('now'), datetime('now'));
