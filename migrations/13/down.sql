
-- Revert admin user name change
UPDATE usuarios 
SET nome = 'teste', updated_at = datetime('now')
WHERE cpf = '087.495.304-96';
