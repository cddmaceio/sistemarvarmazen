-- Migration 27: Adicionar campos email, telefone, data_admissao e observacoes na tabela usuarios
-- Execute este script no SQL Editor do Supabase

-- Adicionar os novos campos na tabela usuarios
ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS telefone TEXT,
ADD COLUMN IF NOT EXISTS data_admissao DATE,
ADD COLUMN IF NOT EXISTS observacoes TEXT;

-- Criar índices para os novos campos (opcional, para melhor performance)
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_telefone ON usuarios(telefone);
CREATE INDEX IF NOT EXISTS idx_usuarios_data_admissao ON usuarios(data_admissao);

-- Verificar a estrutura atualizada da tabela
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'usuarios' 
ORDER BY ordinal_position;

-- Verificar os dados existentes
SELECT id, nome, cpf, email, telefone, data_admissao, observacoes 
FROM usuarios 
LIMIT 5;