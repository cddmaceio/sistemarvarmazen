-- Script para corrigir problemas de encoding/acentos no Supabase
-- Execute este script no SQL Editor do Supabase Dashboard

-- Corrigir turno 'Manhã' para 'Manha' na tabela kpis
UPDATE kpis SET turno_kpi = 'Manha' WHERE turno_kpi = 'Manhã';

-- Corrigir função 'Ajudante de Armazém' para 'Ajudante de Armazem' na tabela kpis
UPDATE kpis SET funcao_kpi = 'Ajudante de Armazem' WHERE funcao_kpi = 'Ajudante de Armazém';

-- Verificar se há outras funções com acentos na tabela kpis
UPDATE kpis SET funcao_kpi = 'Operador de Empilhadeira' WHERE funcao_kpi LIKE '%Empilhadeira%';

-- Corrigir na tabela activities se necessário
UPDATE activities SET funcao = 'Ajudante de Armazem' WHERE funcao = 'Ajudante de Armazém';
UPDATE activities SET turno = 'Manha' WHERE turno = 'Manhã';
UPDATE activities SET turno = 'Tarde' WHERE turno = 'Tarde';
UPDATE activities SET turno = 'Noite' WHERE turno = 'Noite';

-- Verificar resultados
SELECT DISTINCT funcao_kpi, turno_kpi FROM kpis ORDER BY funcao_kpi, turno_kpi;
SELECT DISTINCT funcao, turno FROM activities WHERE funcao IS NOT NULL AND turno IS NOT NULL ORDER BY funcao, turno;

-- Verificar KPIs específicos para teste
SELECT * FROM kpis WHERE funcao_kpi = 'Ajudante de Armazem' AND (turno_kpi = 'Manha' OR turno_kpi = 'Geral');