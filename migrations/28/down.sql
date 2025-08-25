-- Migration 28 Down: Remover coluna valor_bruto_atividades
ALTER TABLE lancamentos_produtividade DROP COLUMN IF EXISTS valor_bruto_atividades;