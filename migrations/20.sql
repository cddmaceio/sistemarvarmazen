
-- Inserir o usuário admin se não existir
INSERT OR IGNORE INTO usuarios (cpf, data_nascimento, nome, role, is_active, funcao, created_at, updated_at)
VALUES ('087.495.304-96', '1990-11-01', 'Ronier Cassio', 'admin', true, 'Administrador', datetime('now'), datetime('now'));

-- Atualizar o usuário existente para admin
UPDATE usuarios 
SET 
  role = 'admin',
  is_active = true,
  nome = 'Ronier Cassio',
  funcao = 'Administrador',
  updated_at = datetime('now')
WHERE cpf = '087.495.304-96' AND data_nascimento = '1990-11-01';
