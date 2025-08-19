
-- Update admin user name as requested
UPDATE usuarios 
SET nome = 'Ronier Cassio', updated_at = datetime('now')
WHERE cpf = '087.495.304-96';
