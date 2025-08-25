-- Migration 28: Adicionar coluna valor_bruto_atividades para Ajudante de Armazém
-- Execute este script no SQL Editor do Supabase

-- Adicionar a coluna valor_bruto_atividades
ALTER TABLE lancamentos_produtividade 
ADD COLUMN IF NOT EXISTS valor_bruto_atividades DECIMAL(10,2) DEFAULT 0;

-- Atualizar registros existentes para calcular valor_bruto_atividades para Ajudante de Armazém
-- Será calculado como subtotal_atividades * 2 para registros existentes
UPDATE lancamentos_produtividade 
SET valor_bruto_atividades = subtotal_atividades * 2 
WHERE funcao = 'Ajudante de Armazém' AND valor_bruto_atividades = 0;

-- Verificar a estrutura atualizada da tabela
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'lancamentos_produtividade' 
AND column_name = 'valor_bruto_atividades';