-- Script para atualizar a estrutura da tabela usuarios no Supabase
-- Execute este script no SQL Editor do Supabase

-- 1. Adicionar as novas colunas se não existirem
ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS tipo_usuario TEXT DEFAULT 'colaborador',
ADD COLUMN IF NOT EXISTS status_usuario TEXT DEFAULT 'ativo';

-- 2. Migrar dados das colunas antigas para as novas (se existirem)
UPDATE usuarios 
SET 
  tipo_usuario = CASE 
    WHEN role = 'admin' THEN 'administrador'
    WHEN role = 'user' THEN 'colaborador'
    ELSE 'colaborador'
  END,
  status_usuario = CASE 
    WHEN is_active = true THEN 'ativo'
    WHEN is_active = false THEN 'inativo'
    ELSE 'ativo'
  END
WHERE tipo_usuario IS NULL OR status_usuario IS NULL;

-- 3. Remover as colunas antigas (opcional - descomente se quiser remover)
-- ALTER TABLE usuarios DROP COLUMN IF EXISTS role;
-- ALTER TABLE usuarios DROP COLUMN IF EXISTS is_active;

-- 4. Criar índices para as novas colunas
CREATE INDEX IF NOT EXISTS idx_usuarios_tipo ON usuarios(tipo_usuario);
CREATE INDEX IF NOT EXISTS idx_usuarios_status ON usuarios(status_usuario);

-- 5. Verificar os dados atualizados
SELECT cpf, nome, tipo_usuario, status_usuario, funcao 
FROM usuarios 
WHERE cpf = '087.495.304-96';