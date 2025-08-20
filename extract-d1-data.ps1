# Script para extrair dados reais do D1 Database
$dbName = "01987115-e7bd-783e-9f01-e0a5ed2ce55e"

Write-Host "Extraindo dados do D1 Database local..."

# Extrair usuários
Write-Host "Extraindo usuários..."
npx wrangler d1 execute $dbName --local --command "SELECT 'INSERT INTO usuarios (id, cpf, data_nascimento, nome, role, is_active, created_at, updated_at, funcao) VALUES (' || id || ', ''' || cpf || ''', ''' || data_nascimento || ''', ''' || replace(nome, '''', '''''') || ''', ''' || role || ''', ' || is_active || ', ''' || created_at || ''', ''' || updated_at || ''', ''' || replace(funcao, '''', '''''') || ''');' FROM usuarios;" > usuarios_data.sql

# Extrair atividades
Write-Host "Extraindo atividades..."
npx wrangler d1 execute $dbName --local --command "SELECT 'INSERT INTO activities (id, nome_atividade, nivel_atividade, valor_atividade, created_at, updated_at, produtividade_minima, unidade_medida) VALUES (' || id || ', ''' || replace(nome_atividade, '''', '''''') || ''', ''' || replace(nivel_atividade, '''', '''''') || ''', ' || valor_atividade || ', ''' || created_at || ''', ''' || updated_at || ''', ' || COALESCE(produtividade_minima, 0) || ', ''' || COALESCE(unidade_medida, 'unidades') || ''');' FROM activities;" > activities_data.sql

# Extrair KPIs
Write-Host "Extraindo KPIs..."
npx wrangler d1 execute $dbName --local --command "SELECT 'INSERT INTO kpis (id, nome_kpi, valor_meta_kpi, peso_kpi, turno_kpi, funcao_kpi, created_at, updated_at, descricao, status_ativo) VALUES (' || id || ', ''' || replace(nome_kpi, '''', '''''') || ''', ' || valor_meta_kpi || ', ' || peso_kpi || ', ''' || turno_kpi || ''', ''' || replace(funcao_kpi, '''', '''''') || ''', ''' || created_at || ''', ''' || updated_at || ''', ' || COALESCE('''' || replace(descricao, '''', '''''') || '''', 'NULL') || ', ' || COALESCE(status_ativo, 1) || ');' FROM kpis;" > kpis_data.sql

# Extrair lançamentos de produtividade
Write-Host "Extraindo lançamentos de produtividade..."
npx wrangler d1 execute $dbName --local --command "SELECT COUNT(*) as total FROM lancamentos_produtividade;" > lancamentos_count.txt

Write-Host "Dados extraídos com sucesso!"
Write-Host "Arquivos gerados:"
Write-Host "- usuarios_data.sql"
Write-Host "- activities_data.sql"
Write-Host "- kpis_data.sql"
Write-Host "- lancamentos_count.txt"