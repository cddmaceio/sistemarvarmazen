require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

console.log('🔍 VERIFICANDO - Estrutura do banco de dados');
console.log('==================================================');

// Configurar Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkDatabaseStructure() {
  console.log('\n1. Verificando tabelas disponíveis...');
  
  const tablesToCheck = ['usuarios', 'kpis', 'atividades', 'activities', 'lancamentos'];
  
  for (const table of tablesToCheck) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`   ❌ Tabela '${table}': ${error.message}`);
      } else {
        console.log(`   ✅ Tabela '${table}': existe`);
        if (data && data.length > 0) {
          console.log(`      Colunas: ${Object.keys(data[0]).join(', ')}`);
        }
      }
    } catch (error) {
      console.log(`   ❌ Erro ao verificar tabela '${table}': ${error.message}`);
    }
  }
  
  console.log('\n2. Verificando estrutura da tabela KPIs...');
  try {
    const { data: kpis, error } = await supabase
      .from('kpis')
      .select('*')
      .limit(3);
    
    if (error) {
      console.log('   ❌ Erro:', error.message);
    } else {
      console.log(`   ✅ Encontrados ${kpis.length} registros de exemplo`);
      if (kpis.length > 0) {
        console.log('   Estrutura do primeiro registro:');
        console.log('   ', JSON.stringify(kpis[0], null, 2));
      }
    }
  } catch (error) {
    console.log('   ❌ Erro:', error.message);
  }
  
  console.log('\n3. Verificando funções únicas dos usuários...');
  try {
    const { data: users, error } = await supabase
      .from('usuarios')
      .select('funcao')
      .not('funcao', 'is', null);
    
    if (error) {
      console.log('   ❌ Erro:', error.message);
    } else {
      const uniqueFunctions = [...new Set(users.map(u => u.funcao))];
      console.log(`   ✅ Funções encontradas (${uniqueFunctions.length}):`);
      uniqueFunctions.forEach(func => console.log(`      - ${func}`));
    }
  } catch (error) {
    console.log('   ❌ Erro:', error.message);
  }
  
  console.log('\n4. Verificando se existe tabela de atividades alternativa...');
  const alternativeNames = ['activity', 'atividade', 'activities_list', 'activity_names'];
  
  for (const name of alternativeNames) {
    try {
      const { data, error } = await supabase
        .from(name)
        .select('*')
        .limit(1);
      
      if (!error) {
        console.log(`   ✅ Encontrada tabela '${name}'`);
        if (data && data.length > 0) {
          console.log(`      Colunas: ${Object.keys(data[0]).join(', ')}`);
        }
      }
    } catch (error) {
      // Ignorar erros para tabelas que não existem
    }
  }
}

checkDatabaseStructure().then(() => {
  console.log('\n==================================================');
  console.log('🏁 VERIFICAÇÃO concluída!');
}).catch(error => {
  console.error('❌ Erro na verificação:', error);
  process.exit(1);
});