const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://qcqkfipckcnydsjjdral.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjcWtmaXBja2NueWRzampkcmFsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTYyNzczNywiZXhwIjoyMDcxMjAzNzM3fQ.Y6-YwCobWRNlNnObdVRdxEBWJpIMe66N5JGwpaoiFB8';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDilsonValidTasks() {
  console.log('=== VERIFICAÇÃO DOS DADOS DE TAREFAS VÁLIDAS ===\n');
  
  try {
    // Primeiro, vamos ver todos os usuários no banco
    const { data: usuarios, error: errorUsuarios } = await supabase
      .from('lancamentos_produtividade')
      .select('user_nome')
      .order('user_nome');
      
    if (errorUsuarios) {
      console.error('❌ Erro ao buscar usuários:', errorUsuarios);
      return;
    }
    
    const nomesUnicos = [...new Set(usuarios.map(u => u.user_nome))];
    console.log('👥 Usuários encontrados no banco:');
    nomesUnicos.forEach(nome => console.log(`   - ${nome}`));
    console.log('');
    
    // Buscar lançamentos do Dilson (todos os status)
    const { data: lancamentos, error } = await supabase
      .from('lancamentos_produtividade')
      .select('id, data_lancamento, funcao, valid_tasks_count, tarefas_validas, valor_tarefas, nome_operador, status')
      .ilike('user_nome', '%Dilson%')
      .order('data_lancamento', { ascending: false })
      .limit(10);
      
    if (error) {
      console.error('❌ Erro ao buscar dados:', error);
      return;
    }
    
    if (!lancamentos || lancamentos.length === 0) {
      console.log('❌ Nenhum lançamento encontrado para Dilson Arlindo');
      return;
    }
    
    console.log(`✅ Encontrados ${lancamentos.length} lançamentos para Dilson Arlindo:\n`);
    
    lancamentos.forEach((lancamento, index) => {
      console.log(`📋 Lançamento ${index + 1}:`);
      console.log(`   ID: ${lancamento.id}`);
      console.log(`   Data: ${lancamento.data_lancamento}`);
      console.log(`   Função: ${lancamento.funcao}`);
      console.log(`   Valid Tasks Count: ${lancamento.valid_tasks_count || 'null'}`);
      console.log(`   Tarefas Válidas: ${lancamento.tarefas_validas || 'null'}`);
      console.log(`   Valor Tarefas: ${lancamento.valor_tarefas || 'null'}`);
      console.log(`   Nome Operador: ${lancamento.nome_operador || 'null'}`);
      console.log(`   Status: ${lancamento.status}`);
      console.log('');
    });
    
    // Verificar se há inconsistências
    const inconsistencias = lancamentos.filter(l => 
      l.funcao === 'Operador de Empilhadeira' && 
      (l.valid_tasks_count === null || l.tarefas_validas === null)
    );
    
    if (inconsistencias.length > 0) {
      console.log(`⚠️  INCONSISTÊNCIAS ENCONTRADAS: ${inconsistencias.length} lançamentos`);
      console.log('   - Operador de Empilhadeira deveria ter valid_tasks_count e tarefas_validas preenchidos');
    } else {
      console.log('✅ Todos os lançamentos estão consistentes');
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

checkDilsonValidTasks();