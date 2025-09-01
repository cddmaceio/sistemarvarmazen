DROP VIEW IF EXISTS ganhos_mensais_com_usuarios;
CREATE OR REPLACE VIEW ganhos_mensais_com_usuarios AS
SELECT
    u.nome,
    u.funcao,
    u.id AS user_id,
    to_char(lp.data_lancamento, 'YYYY-MM') AS mes_ano,
    SUM(COALESCE(lp.bonus_kpis, 0)) AS valor_kpi,
    SUM(COALESCE(lp.subtotal_atividades, 0)) AS valor_atividade,
    SUM(COALESCE(lp.valor_tarefas, 0)) AS valor_tarefas,
    SUM(COALESCE(lp.remuneracao_total, 0)) AS valor_final
FROM
    lancamentos_produtividade lp
JOIN
    usuarios u ON lp.user_cpf = u.cpf
WHERE
    lp.status = 'aprovado'
GROUP BY
    u.id,
    u.nome,
    u.funcao,
    to_char(lp.data_lancamento, 'YYYY-MM');