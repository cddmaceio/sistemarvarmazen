-- Script para adicionar campo turno na tabela usuarios
-- Execute este script no SQL Editor do Supabase Dashboard

-- 1. Verificar se a coluna turno já existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'usuarios' AND column_name = 'turno'
    ) THEN
        -- Adicionar campo turno na tabela usuarios (NULL para administradores)
        ALTER TABLE usuarios ADD COLUMN turno TEXT;
        
        -- Atualizar apenas usuários operacionais com turnos baseados na função
        -- Administradores (Supervisor, Gerente) ficam com turno NULL
        UPDATE usuarios 
        SET turno = CASE 
            WHEN funcao = 'Operador de Empilhadeira' THEN 'Manhã'
            WHEN funcao = 'Ajudante de Armazém' THEN 'Manhã'
            WHEN funcao = 'Conferente' THEN 'Tarde'
            -- Supervisor e Gerente ficam com NULL (não precisam de turno)
            WHEN funcao IN ('Supervisor', 'Gerente') THEN NULL
            ELSE 'Manhã'
        END
        WHERE turno IS NULL;
        
        -- Criar índice para o campo turno
        CREATE INDEX IF NOT EXISTS idx_usuarios_turno ON usuarios(turno);
        
        RAISE NOTICE 'Campo turno adicionado com sucesso à tabela usuarios';
    ELSE
        RAISE NOTICE 'Campo turno já existe na tabela usuarios';
    END IF;
END
$$;

-- Verificar os dados atualizados
SELECT id, nome, funcao, turno FROM usuarios ORDER BY id;