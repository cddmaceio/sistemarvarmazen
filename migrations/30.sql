DROP VIEW IF EXISTS public.monthly_earnings_view;
CREATE OR REPLACE VIEW public.monthly_earnings_view
AS
SELECT u.funcao,
    u.nome,
    sum(l.remuneracao_total) AS total_ganho,
    to_char(date_trunc('month'::text, l.data_lancamento), 'YYYY-MM'::text) AS mes_ano
   FROM lancamentos_produtividade l
     JOIN usuarios u ON l.user_cpf = u.cpf
  GROUP BY u.funcao, u.nome, (to_char(date_trunc('month'::text, l.data_lancamento), 'YYYY-MM'::text));