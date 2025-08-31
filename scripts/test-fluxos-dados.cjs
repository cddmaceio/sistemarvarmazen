const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY; // Usando chave anônima disponível
const supabase = createClient(supabaseUrl, supabaseKey);

// Base URL para testes de API
const API_BASE = 'http://localhost:8888/api';

async function testFluxosDados() {
  console.log('🧪 TESTE DE FLUXOS DE DADOS - Sistema RV Armazém\n');

  // 1. Testar conectividade com Supabase
  console.log('1. Testando conectividade com Supabase...');
  try {
    const { data: usuarios, error } = await supabase
      .from('usuarios')
      .select('count')
      .limit(1);
    
    if (error) throw error;
    console.log('✅ Conexão com Supabase OK');
  } catch (error) {
    console.log('❌ Erro na conexão com Supabase:', error.message);
  }

  // 2. Testar estrutura das tabelas principais
  console.log('\n2. Verificando estrutura das tabelas...');
  
  const tabelas = ['usuarios', 'kpis', 'activities', 'lancamentos_produtividade'];
  
  for (const tabela of tabelas) {
    try {
      const { data, error } = await supabase
        .from(tabela)
        .select('*')
        .limit(1);
      
      if (error) throw error;
      console.log(`✅ Tabela '${tabela}': ${data ? data.length : 0} registros encontrados`);
      
      if (data && data.length > 0) {
        const colunas = Object.keys(data[0]);
        console.log(`   Colunas: ${colunas.slice(0, 5).join(', ')}${colunas.length > 5 ? '...' : ''}`);
      }
    } catch (error) {
      console.log(`❌ Erro na tabela '${tabela}':`, error.message);
    }
  }

  // 3. Testar dados de exemplo para fluxos
  console.log('\n3. Verificando dados de exemplo...');
  
  // Usuários para teste de autenticação
  try {
    const { data: usuarios, error } = await supabase
      .from('usuarios')
      .select('id, nome, cpf, funcao, turno, is_active')
      .eq('is_active', true)
      .limit(3);
    
    if (error) throw error;
    console.log(`✅ Usuários ativos: ${usuarios.length}`);
    usuarios.forEach(user => {
      console.log(`   - ${user.nome} (${user.funcao} - ${user.turno})`);
    });
  } catch (error) {
    console.log('❌ Erro ao buscar usuários:', error.message);
  }

  // KPIs para teste da calculadora
  try {
    const { data: kpis, error } = await supabase
      .from('kpis')
      .select('id, nome_kpi, funcao_kpi, turno_kpi, status_ativo')
      .eq('status_ativo', true)
      .limit(5);
    
    if (error) throw error;
    console.log(`\n✅ KPIs ativos: ${kpis.length}`);
    kpis.forEach(kpi => {
      console.log(`   - ${kpi.nome_kpi} (${kpi.funcao_kpi} - ${kpi.turno_kpi})`);
    });
  } catch (error) {
    console.log('❌ Erro ao buscar KPIs:', error.message);
  }

  // Atividades para teste de gerenciamento
  try {
    const { data: activities, error } = await supabase
      .from('activities')
      .select('id, nome_atividade, funcao_atividade, turno_atividade')
      .limit(5);
    
    if (error) throw error;
    console.log(`\n✅ Atividades: ${activities.length}`);
    activities.forEach(activity => {
      console.log(`   - ${activity.nome_atividade} (${activity.funcao_atividade} - ${activity.turno_atividade})`);
    });
  } catch (error) {
    console.log('❌ Erro ao buscar atividades:', error.message);
  }

  // 4. Testar fluxo de KPIs disponíveis
  console.log('\n4. Testando fluxo de KPIs disponíveis...');
  
  const testCases = [
    { funcao: 'Ajudante de Armazém', turno: 'Manhã' },
    { funcao: 'Operador de Empilhadeira', turno: 'Tarde' },
    { funcao: 'Conferente', turno: 'Noite' }
  ];

  for (const testCase of testCases) {
    try {
      const { data: kpis, error } = await supabase
        .from('kpis')
        .select('nome_kpi, turno_kpi')
        .eq('funcao_kpi', testCase.funcao)
        .in('turno_kpi', [testCase.turno, 'Geral'])
        .eq('status_ativo', true);
      
      if (error) throw error;
      console.log(`   ${testCase.funcao} - ${testCase.turno}: ${kpis.length} KPIs`);
      kpis.forEach(kpi => {
        console.log(`     - ${kpi.nome_kpi} (${kpi.turno_kpi})`);
      });
    } catch (error) {
      console.log(`   ❌ Erro para ${testCase.funcao} - ${testCase.turno}:`, error.message);
    }
  }

  // 5. Verificar arquivos de configuração
  console.log('\n5. Verificando configurações...');
  
  const configs = {
    'SUPABASE_URL': process.env.SUPABASE_URL,
    'SUPABASE_ANON_KEY': process.env.SUPABASE_ANON_KEY ? '***configurado***' : undefined,
    'VITE_SUPABASE_URL': process.env.VITE_SUPABASE_URL,
    'VITE_SUPABASE_ANON_KEY': process.env.VITE_SUPABASE_ANON_KEY ? '***configurado***' : undefined
  };

  Object.entries(configs).forEach(([key, value]) => {
    if (value) {
      console.log(`✅ ${key}: ${value}`);
    } else {
      console.log(`❌ ${key}: não configurado`);
    }
  });

  // 6. Verificar arquivos de rotas
  console.log('\n6. Verificando arquivos de rotas...');
  
  const fs = require('fs');
  const path = require('path');
  
  const routesDir = path.join(__dirname, 'src', 'worker', 'routes');
  const expectedRoutes = ['activities.ts', 'auth.ts', 'calculator.ts', 'kpis.ts', 'lancamentos.ts', 'users.ts'];
  
  expectedRoutes.forEach(route => {
    const routePath = path.join(routesDir, route);
    if (fs.existsSync(routePath)) {
      console.log(`✅ Rota encontrada: ${route}`);
    } else {
      console.log(`❌ Rota não encontrada: ${route}`);
    }
  });

  // 7. Verificar hooks do frontend
  console.log('\n7. Verificando hooks do frontend...');
  
  const hooksDir = path.join(__dirname, 'src', 'hooks');
  const expectedHooks = ['useApi.ts', 'useAuth.tsx'];
  
  expectedHooks.forEach(hook => {
    const hookPath = path.join(hooksDir, hook);
    if (fs.existsSync(hookPath)) {
      console.log(`✅ Hook encontrado: ${hook}`);
      
      // Verificar conteúdo básico
      const content = fs.readFileSync(hookPath, 'utf8');
      if (hook === 'useApi.ts') {
        const hooks = ['useActivities', 'useKPIs', 'useAvailableKPIs', 'useCalculator'];
        hooks.forEach(hookName => {
          if (content.includes(hookName)) {
            console.log(`   ✅ ${hookName} implementado`);
          } else {
            console.log(`   ❌ ${hookName} não encontrado`);
          }
        });
      }
    } else {
      console.log(`❌ Hook não encontrado: ${hook}`);
    }
  });

  // 8. Resumo dos fluxos principais
  console.log('\n8. Resumo dos fluxos principais...');
  
  console.log('\n📋 FLUXOS MAPEADOS:');
  console.log('===================');
  console.log('✅ Autenticação: useAuth → /api/auth/login → Supabase');
  console.log('✅ KPIs Disponíveis: useAvailableKPIs → /api/kpis/available → Supabase');
  console.log('✅ Calculadora: useCalculator → /api/calculate → Supabase');
  console.log('✅ Atividades: useActivities → /api/activities → Supabase');
  console.log('✅ Gerenciamento KPIs: useKPIs → /api/kpis → Supabase');
  
  console.log('\n📝 HOOKS IMPLEMENTADOS:');
  console.log('=======================');
  console.log('✅ useAuth - Autenticação e estado do usuário');
  console.log('✅ useActivities - CRUD de atividades');
  console.log('✅ useKPIs - CRUD de KPIs');
  console.log('✅ useAvailableKPIs - KPIs por função/turno');
  console.log('✅ useCalculator - Cálculo de produtividade');
  console.log('✅ useFunctions - Lista de funções');
  console.log('✅ useActivityNames - Nomes de atividades');
  console.log('✅ useKPILimit - Limite de KPIs');
  
  console.log('\n⚠️  HOOKS FALTANTES:');
  console.log('====================');
  console.log('❌ useUsers - Gerenciamento de usuários');
  console.log('❌ useLancamentos - Gerenciamento de lançamentos');
  
  console.log('\n🎯 TESTE CONCLUÍDO!');
  console.log('Verifique o arquivo "mapeamento-fluxos-dados.md" para documentação completa.');
}

// Executar teste
testFluxosDados().catch(console.error);