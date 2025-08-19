
-- Remove added columns
ALTER TABLE lancamentos_produtividade DROP COLUMN editado_por_admin;
ALTER TABLE lancamentos_produtividade DROP COLUMN data_edicao;
ALTER TABLE lancamentos_produtividade DROP COLUMN valores_originais;
ALTER TABLE lancamentos_produtividade DROP COLUMN status_edicao;
ALTER TABLE lancamentos_produtividade DROP COLUMN observacoes_edicao;

-- Drop the history table
DROP TABLE historico_lancamentos_aprovados;
