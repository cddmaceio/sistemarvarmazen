-- Script para inserir dados de teste de lançamentos aprovados
INSERT INTO lancamentos_produtividade (
  user_id,
  user_nome,
  user_cpf,
  data_lancamento,
  funcao,
  turno,
  nome_atividade,
  kpis_atingidos,
  tarefas_validas,
  valor_tarefas,
  bonus_kpis,
  subtotal_atividades,
  remuneracao_total,
  status,
  aprovado_por
) VALUES (
  1,
  'João Silva',
  '12345678901',
  '2025-01-22',
  'Operador de Empilhadeira',
  'Manhã',
  'Movimentação de Pallets',
  '["TMA", "Ressuprimento"]',
  138,
  12.83,
  6.00,
  7.88,
  26.71,
  'aprovado',
  'Sistema'
);

-- Verificar se foi inserido
SELECT * FROM lancamentos_produtividade WHERE status = 'aprovado' ORDER BY data_lancamento DESC LIMIT 1;