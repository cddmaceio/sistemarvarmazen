
-- Reverter usuário para role user
UPDATE usuarios 
SET 
  role = 'user',
  funcao = 'Ajudante de Armazém',
  updated_at = datetime('now')
WHERE cpf = '087.495.304-96' AND data_nascimento = '1990-11-01';
