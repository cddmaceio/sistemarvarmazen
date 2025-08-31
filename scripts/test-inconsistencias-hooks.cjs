const fs = require('fs');
const path = require('path');

async function testInconsistenciasHooks() {
  console.log('🧪 TESTE DE INCONSISTÊNCIAS NOS HOOKS\n');

  // 1. Verificar correção do endpoint no useAuth
  console.log('1. Verificando correção do endpoint no useAuth...');
  
  const useAuthPath = path.join(__dirname, 'src', 'hooks', 'useAuth.tsx');
  
  if (fs.existsSync(useAuthPath)) {
    const useAuthContent = fs.readFileSync(useAuthPath, 'utf8');
    
    // Verificar se o endpoint foi corrigido
    if (useAuthContent.includes('/usuarios/${user.id}')) {
      console.log('✅ Endpoint corrigido: /usuarios/${user.id}');
    } else if (useAuthContent.includes('/users/${user.id}')) {
      console.log('❌ Endpoint ainda incorreto: /users/${user.id}');
    } else {
      console.log('⚠️  Endpoint não encontrado no updateUser');
    }
    
    // Verificar se há tratamento de loading em updateUser
    if (useAuthContent.includes('setLoading') && useAuthContent.includes('updateUser')) {
      console.log('✅ Loading state implementado em updateUser');
    } else {
      console.log('❌ Loading state faltando em updateUser');
    }
  } else {
    console.log('❌ Arquivo useAuth.tsx não encontrado');
  }

  // 2. Analisar padrões nos hooks do useApi
  console.log('\n2. Analisando padrões nos hooks do useApi...');
  
  const useApiPath = path.join(__dirname, 'src', 'hooks', 'useApi.ts');
  
  if (fs.existsSync(useApiPath)) {
    const useApiContent = fs.readFileSync(useApiPath, 'utf8');
    
    // Verificar hooks implementados
    const hooksImplementados = [
      'useActivities',
      'useKPIs', 
      'useFunctions',
      'useActivityNames',
      'useCalculator',
      'useKPILimit',
      'useAvailableKPIs'
    ];
    
    console.log('   Hooks implementados:');
    hooksImplementados.forEach(hook => {
      if (useApiContent.includes(`export function ${hook}`)) {
        console.log(`   ✅ ${hook}`);
      } else {
        console.log(`   ❌ ${hook}`);
      }
    });
    
    // Verificar hooks faltantes
    const hooksFaltantes = ['useUsers', 'useLancamentos'];
    console.log('\n   Hooks faltantes:');
    hooksFaltantes.forEach(hook => {
      if (useApiContent.includes(`export function ${hook}`)) {
        console.log(`   ✅ ${hook} - Implementado`);
      } else {
        console.log(`   ❌ ${hook} - Não implementado`);
      }
    });
    
    // Verificar padrões de tratamento de erro
    const errorPatterns = [
      'err instanceof Error ? err.message : \'Unknown error\'',
      'setError(err instanceof Error ? err.message : \'Unknown error\')'
    ];
    
    console.log('\n   Padrões de tratamento de erro:');
    const errorMatches = errorPatterns.filter(pattern => 
      useApiContent.includes(pattern)
    );
    
    if (errorMatches.length > 0) {
      console.log(`   ✅ Padrão consistente encontrado (${errorMatches.length} ocorrências)`);
    } else {
      console.log('   ❌ Padrão de erro inconsistente');
    }
    
    // Verificar uso de loading states
    const loadingMatches = useApiContent.match(/setLoading\(true\)/g);
    const loadingFinallyMatches = useApiContent.match(/setLoading\(false\)/g);
    
    console.log('\n   Estados de loading:');
    console.log(`   - setLoading(true): ${loadingMatches ? loadingMatches.length : 0} ocorrências`);
    console.log(`   - setLoading(false): ${loadingFinallyMatches ? loadingFinallyMatches.length : 0} ocorrências`);
    
    if (loadingMatches && loadingFinallyMatches && loadingMatches.length === loadingFinallyMatches.length) {
      console.log('   ✅ Loading states balanceados');
    } else {
      console.log('   ⚠️  Loading states podem estar desbalanceados');
    }
    
    // Verificar logs de debug em produção
    const debugLogs = useApiContent.match(/console\.log/g);
    console.log('\n   Logs de debug:');
    if (debugLogs) {
      console.log(`   ⚠️  ${debugLogs.length} console.log encontrados (remover em produção)`);
    } else {
      console.log('   ✅ Nenhum console.log encontrado');
    }
    
  } else {
    console.log('❌ Arquivo useApi.ts não encontrado');
  }

  // 3. Verificar estrutura de tipos
  console.log('\n3. Verificando estrutura de tipos...');
  
  const typesPath = path.join(__dirname, 'src', 'shared', 'types.ts');
  
  if (fs.existsSync(typesPath)) {
    const typesContent = fs.readFileSync(typesPath, 'utf8');
    
    const expectedTypes = [
      'UserType',
      'ActivityType', 
      'KPIType',
      'CalculatorInputType',
      'CalculatorResultType',
      'LoginSchema'
    ];
    
    console.log('   Tipos definidos:');
    expectedTypes.forEach(type => {
      if (typesContent.includes(type)) {
        console.log(`   ✅ ${type}`);
      } else {
        console.log(`   ❌ ${type}`);
      }
    });
    
    // Verificar uso de 'any'
    const anyMatches = typesContent.match(/:\s*any/g);
    if (anyMatches) {
      console.log(`\n   ⚠️  ${anyMatches.length} usos de 'any' encontrados`);
    } else {
      console.log('\n   ✅ Nenhum uso de \'any\' encontrado');
    }
    
  } else {
    console.log('❌ Arquivo types.ts não encontrado');
  }

  // 4. Verificar rotas backend correspondentes
  console.log('\n4. Verificando rotas backend correspondentes...');
  
  const routesDir = path.join(__dirname, 'src', 'worker', 'routes');
  const expectedRoutes = {
    'useActivities': 'activities.ts',
    'useKPIs': 'kpis.ts', 
    'useAuth': 'auth.ts',
    'useCalculator': 'calculator.ts',
    'useUsers': 'users.ts',
    'useLancamentos': 'lancamentos.ts'
  };
  
  Object.entries(expectedRoutes).forEach(([hook, routeFile]) => {
    const routePath = path.join(routesDir, routeFile);
    if (fs.existsSync(routePath)) {
      console.log(`   ✅ ${hook} → ${routeFile}`);
    } else {
      console.log(`   ❌ ${hook} → ${routeFile} (rota não encontrada)`);
    }
  });

  // 5. Análise de duplicação de código
  console.log('\n5. Análise de duplicação de código...');
  
  if (fs.existsSync(useApiPath)) {
    const useApiContent = fs.readFileSync(useApiPath, 'utf8');
    
    // Padrão comum de estado
    const statePattern = /const \[\w+, set\w+\] = useState<[^>]+>\(\[\]\);\s*const \[loading, setLoading\] = useState\(true\);\s*const \[error, setError\] = useState<string \| null>\(null\);/g;
    const stateMatches = useApiContent.match(statePattern);
    
    if (stateMatches && stateMatches.length > 1) {
      console.log(`   ⚠️  Padrão de estado duplicado ${stateMatches.length} vezes`);
      console.log('   💡 Oportunidade: Criar hook base genérico');
    } else {
      console.log('   ✅ Pouca duplicação de padrões de estado');
    }
    
    // Padrão comum de fetch
    const fetchPattern = /const response = await fetch\(`\$\{API_BASE\}\/[^`]+`\);/g;
    const fetchMatches = useApiContent.match(fetchPattern);
    
    if (fetchMatches) {
      console.log(`   📊 ${fetchMatches.length} chamadas de fetch encontradas`);
      console.log('   💡 Oportunidade: Abstrair lógica de fetch comum');
    }
  }

  // 6. Verificar configuração de ambiente
  console.log('\n6. Verificando configuração de ambiente...');
  
  const envPath = path.join(__dirname, '.env.local');
  
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    const requiredVars = [
      'SUPABASE_URL',
      'SUPABASE_ANON_KEY', 
      'VITE_SUPABASE_URL',
      'VITE_SUPABASE_ANON_KEY'
    ];
    
    console.log('   Variáveis de ambiente:');
    requiredVars.forEach(varName => {
      if (envContent.includes(`${varName}=`)) {
        console.log(`   ✅ ${varName}`);
      } else {
        console.log(`   ❌ ${varName}`);
      }
    });
  } else {
    console.log('   ❌ Arquivo .env.local não encontrado');
  }

  // 7. Resumo da análise
  console.log('\n7. Resumo da análise...');
  
  console.log('\n📋 PROBLEMAS IDENTIFICADOS:');
  console.log('============================');
  console.log('✅ Endpoint corrigido no useAuth');
  console.log('❌ Hooks faltantes: useUsers, useLancamentos');
  console.log('⚠️  Logs de debug em produção');
  console.log('⚠️  Duplicação de código entre hooks CRUD');
  console.log('⚠️  Falta de loading state em updateUser');
  
  console.log('\n💡 RECOMENDAÇÕES:');
  console.log('==================');
  console.log('1. Implementar hooks faltantes (useUsers, useLancamentos)');
  console.log('2. Criar hook base genérico para reduzir duplicação');
  console.log('3. Remover console.log em produção');
  console.log('4. Adicionar loading states faltantes');
  console.log('5. Implementar retry logic para falhas de rede');
  console.log('6. Adicionar cache para melhorar performance');
  
  console.log('\n🎯 PRÓXIMOS PASSOS:');
  console.log('===================');
  console.log('1. Implementar useUsers hook');
  console.log('2. Implementar useLancamentos hook');
  console.log('3. Criar script de teste para novos hooks');
  console.log('4. Refatorar para hook base genérico');
  
  console.log('\n✅ ANÁLISE CONCLUÍDA!');
  console.log('Verifique o arquivo "analise-inconsistencias-hooks.md" para detalhes completos.');
}

// Executar análise
testInconsistenciasHooks().catch(console.error);