
-- Remover dados de exemplo (cuidado - isso apagará dados!)
DELETE FROM kpis WHERE nome_kpi IN ('Pontualidade', 'Qualidade', 'Produtividade Extra', 'Organização', 'Segurança', 'Eficiência');
DELETE FROM activities WHERE nome_atividade IN ('Separação de Produtos', 'Conferência de Pedidos');
DELETE FROM usuarios WHERE cpf = '123.456.789-00';
