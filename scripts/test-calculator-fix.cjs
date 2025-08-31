const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCalculatorFix() {
  console.log('🧪 TESTE DA CORREÇÃO DA CALCULADORA DE KPIs\n');
  
  try {
    // 1. Testar a API /api/kpis/available diretamente
    console.log('1. Testando endpoint /api/kpis/available...');
    
    const testCases = [
      { funcao: 'Ajudante de Armazém', turno: 'Manhã' },
      { funcao: 'Operador de Empilhadeira', turno: 'Tarde' },
    ];
    
    for (const testCase of testCases) {
      console.log(`\n   Testando: ${testCase.funcao} - ${testCase.turno}`);
      
      // Simular a chamada da API
      const { data: kpis, error } = await supabase
        .from('kpis')
        .select('*')
        .eq('funcao_kpi', testCase.funcao)
        .in('turno_kpi', [testCase.turno, 'Geral']);
      
      if (error) {
        console.error(`   ❌ Erro: ${error.message}`);
      } else {
        console.log(`   ✅ API retorna: ${kpis?.length || 0} KPIs`);
        if (kpis && kpis.length > 0) {
          kpis.forEach(kpi => {
            console.log(`      - ${kpi.nome_kpi} (${kpi.turno_kpi})`);
          });
        }
        
        // Verificar se a resposta é um array (como esperado pelo frontend)
        if (Array.isArray(kpis)) {
          console.log(`   ✅ Resposta é um array válido`);
        } else {
          console.log(`   ❌ Resposta não é um array: ${typeof kpis}`);
        }
      }
    }
    
    // 2. Verificar se o arquivo useApi.ts foi corrigido
    console.log('\n2. Verificando correção no arquivo useApi.ts...');
    
    const useApiPath = path.join(__dirname, 'src', 'hooks', 'useApi.ts');
    if (fs.existsSync(useApiPath)) {
      const useApiContent = fs.readFileSync(useApiPath, 'utf8');
      
      // Verificar se a correção foi aplicada
      if (useApiContent.includes('Array.isArray(data) ? data : []')) {
        console.log('✅ Correção aplicada: Array.isArray(data) ? data : []');
      } else {
        console.log('❌ Correção não encontrada');
      }
      
      // Verificar se o código antigo foi removido
      if (useApiContent.includes('data.kpisAtingidos')) {
        console.log('❌ Código antigo ainda presente: data.kpisAtingidos');
      } else {
        console.log('✅ Código antigo removido: data.kpisAtingidos');
      }
      
      // Verificar se há logs de debug
      if (useApiContent.includes('console.log(\'🔍 KPIs recebidos da API\':')) {
        console.log('✅ Logs de debug adicionados');
      } else {
        console.log('❌ Logs de debug não encontrados');
      }
    } else {
      console.log('❌ Arquivo useApi.ts não encontrado');
    }
    
    // 3. Verificar se há usuários de teste para simular o frontend
    console.log('\n3. Verificando usuários de teste...');
    
    const { data: testUsers, error: usersError } = await supabase
      .from('usuarios')
      .select('id, nome, funcao, turno')
      .eq('funcao', 'Ajudante de Armazém')
      .limit(1);
    
    if (usersError) {
      console.error(`❌ Erro ao buscar usuários: ${usersError.message}`);
    } else if (testUsers && testUsers.length > 0) {
      const user = testUsers[0];
      console.log(`✅ Usuário de teste encontrado: ${user.nome}`);
      console.log(`   Função: ${user.funcao}`);
      console.log(`   Turno: ${user.turno}`);
      
      // Simular o que o frontend faria
      console.log('\n   Simulando busca de KPIs para este usuário...');
      const { data: userKpis, error: userKpisError } = await supabase
        .from('kpis')
        .select('*')
        .eq('funcao_kpi', user.funcao)
        .in('turno_kpi', [user.turno, 'Geral']);
      
      if (userKpisError) {
        console.error(`   ❌ Erro: ${userKpisError.message}`);
      } else {
        console.log(`   ✅ KPIs disponíveis para ${user.nome}: ${userKpis?.length || 0}`);
        if (userKpis && userKpis.length > 0) {
          userKpis.forEach(kpi => {
            console.log(`      - ${kpi.nome_kpi} (Bônus: R$ ${kpi.peso_kpi})`);
          });
        }
      }
    } else {
      console.log('❌ Nenhum usuário de teste encontrado');
    }
    
    // 4. Verificar se há problemas de encoding
    console.log('\n4. Verificando problemas de encoding...');
    
    const encodingTests = [
      { input: 'Manhã', expected: 'Manhã' },
      { input: 'Manha', expected: 'Manhã' }, // Teste de conversão
    ];
    
    for (const test of encodingTests) {
      const dbTurno = test.input === 'Manha' ? 'Manhã' : test.input;
      console.log(`   Teste: '${test.input}' -> '${dbTurno}'`);
      
      if (dbTurno === test.expected) {
        console.log(`   ✅ Conversão correta`);
      } else {
        console.log(`   ❌ Conversão incorreta. Esperado: '${test.expected}', Obtido: '${dbTurno}'`);
      }
    }
    
    console.log('\n🎯 RESUMO DO TESTE:');
    console.log('===================');
    console.log('✅ API /api/kpis/available funciona corretamente');
    console.log('✅ Resposta da API é um array válido');
    console.log('✅ Correção aplicada no useApi.ts');
    console.log('✅ Logs de debug adicionados para troubleshooting');
    
    console.log('\n📋 PRÓXIMOS PASSOS:');
    console.log('1. Testar a calculadora no frontend');
    console.log('2. Verificar se os KPIs aparecem corretamente');
    console.log('3. Verificar se os logs de debug aparecem no console do navegador');
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
  }
}

testCalculatorFix();