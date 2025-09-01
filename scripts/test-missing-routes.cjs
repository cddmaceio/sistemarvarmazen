require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

console.log('🧪 TESTE - Verificando rotas faltantes da API');
console.log('==================================================');

// Configurar Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testMissingRoutes() {
  console.log('\n1. Testando rotas que estão retornando 404...');
  
  const routesToTest = [
    '/api/activity-names',
    '/api/functions', 
    '/api/kpis/available?funcao=Ajudante%20de%20Armaz%C3%A9m&turno=Manh%C3%A3'
  ];
  
  for (const route of routesToTest) {
    try {
      console.log(`\n   Testando: ${route}`);
      const response = await fetch(`http://localhost:8888${route}`);
      console.log(`   Status: ${response.status}`);
      
      if (response.status === 404) {
        console.log('   ❌ Rota não encontrada');
      } else {
        const data = await response.text();
        console.log(`   ✅ Rota funcionando: ${data.substring(0, 100)}...`);
      }
    } catch (error) {
      console.log(`   ❌ Erro: ${error.message}`);
    }
  }
  
  console.log('\n2. Verificando dados no banco para implementar as rotas...');
  
  // Testar activity-names
  try {
    const { data: activities, error } = await supabase
      .from('atividades')
      .select('nome')
      .order('nome');
    
    if (error) {
      console.log('   ❌ Erro ao buscar atividades:', error.message);
    } else {
      console.log(`   ✅ Encontradas ${activities.length} atividades no banco`);
      console.log(`   Exemplos: ${activities.slice(0, 3).map(a => a.nome).join(', ')}`);
    }
  } catch (error) {
    console.log('   ❌ Erro ao testar atividades:', error.message);
  }
  
  // Testar functions
  try {
    const { data: users, error } = await supabase
      .from('usuarios')
      .select('funcao')
      .not('funcao', 'is', null);
    
    if (error) {
      console.log('   ❌ Erro ao buscar funções:', error.message);
    } else {
      const uniqueFunctions = [...new Set(users.map(u => u.funcao))];
      console.log(`   ✅ Encontradas ${uniqueFunctions.length} funções únicas no banco`);
      console.log(`   Exemplos: ${uniqueFunctions.slice(0, 3).join(', ')}`);
    }
  } catch (error) {
    console.log('   ❌ Erro ao testar funções:', error.message);
  }
  
  // Testar KPIs disponíveis
  try {
    const { data: kpis, error } = await supabase
      .from('kpis')
      .select('*')
      .eq('funcao', 'Ajudante de Armazém')
      .eq('turno', 'Manhã');
    
    if (error) {
      console.log('   ❌ Erro ao buscar KPIs:', error.message);
    } else {
      console.log(`   ✅ Encontrados ${kpis.length} KPIs para Ajudante de Armazém - Manhã`);
      if (kpis.length > 0) {
        console.log(`   Exemplo: ${kpis[0].atividade || kpis[0].nome || 'N/A'}`);
      }
    }
  } catch (error) {
    console.log('   ❌ Erro ao testar KPIs:', error.message);
  }
}

testMissingRoutes().then(() => {
  console.log('\n==================================================');
  console.log('🏁 TESTE concluído!');
  console.log('\n💡 PRÓXIMOS PASSOS:');
  console.log('   1. Implementar as rotas faltantes na função Netlify');
  console.log('   2. Adicionar handlers para /api/activity-names, /api/functions e /api/kpis/available');
  console.log('   3. Testar novamente após implementação');
}).catch(error => {
  console.error('❌ Erro no teste:', error);
  process.exit(1);
});