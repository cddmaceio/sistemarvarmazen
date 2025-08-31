ALTER TABLE public.lancamentos_produtividade
ADD COLUMN IF NOT EXISTS calculator_data JSONB,
ADD COLUMN IF NOT EXISTS calculator_result JSONB;