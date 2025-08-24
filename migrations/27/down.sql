-- Migration 27 Down: Remover campos email, telefone, data_admissao e observacoes da tabela usuarios
-- Execute este script no SQL Editor do Supabase para reverter a migration

-- Remover índices criados
DROP INDEX IF EXISTS idx_usuarios_email;
DROP INDEX IF EXISTS idx_usuarios_telefone;
DROP INDEX IF EXISTS idx_usuarios_data_admissao;

-- Remover as colunas adicionadas
ALTER TABLE usuarios 
DROP COLUMN IF EXISTS email,
DROP COLUMN IF EXISTS telefone,
DROP COLUMN IF EXISTS data_admissao,
DROP COLUMN IF EXISTS observacoes;

-- Verificar a estrutura da tabela após remoção
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'usuarios' 
ORDER BY ordinal_position;