-- Migração 25: Atualizar valores dos KPIs para Operador de Empilhadeira
-- Limitando o orçamento mensal a R$ 150,00 (52 KPIs × R$ 2,88 = R$ 149,76)

UPDATE kpis 
SET peso_kpi = 2.88, 
    updated_at = CURRENT_TIMESTAMP
WHERE funcao_kpi = 'Operador de Empilhadeira';

-- Verificar os valores atualizados
SELECT nome_kpi, peso_kpi, turno_kpi, funcao_kpi 
FROM kpis 
WHERE funcao_kpi = 'Operador de Empilhadeira'
ORDER BY turno_kpi, nome_kpi;