const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://qcqkfipckcnydsjjdral.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjcWtmaXBja2NueWRzampkcmFsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTYyNzczNywiZXhwIjoyMDcxMjAzNzM3fQ.Y6-YwCobWRNlNnObdVRdxEBWJpIMe66N5JGwpaoiFB8';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testValidTasksFix() {
  console.log('=== TESTE DA CORREÇÃO DE TAREFAS VÁLIDAS ===\n');
  
  try {
    // Simular dados de um lançamento de Operador de Empilhadeira
    const testLancamentoData = {
      user_id: 1, // ID do Dilson
      data_lancamento: '2025-01-25',
      calculator_data: {
        funcao: 'Operador de Empilhadeira',
        turno: 'Manhã',
        nome_operador: 'DILSON ARLINDO DOS SANTOS',
        valid_tasks_count: 150, // Teste com 150 tarefas válidas
        kpis_atingidos: []
      },
      calculator_result: {
        subtotalAtividades: 6.975, // 150 * 0.093 / 2
        bonusKpis: 0,
        remuneracaoTotal: 6.975,
        tarefas_validas: 150,
        valor_tarefas: 13.95 // 150 * 0.093
      }
    };
    
    console.log('📤 Enviando dados de teste para a API...');
    console.log('Dados:', JSON.stringify(testLancamentoData, null, 2));
    
    // Fazer a requisição para a API
    const response = await fetch('http://localhost:8888/api/lancamentos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testLancamentoData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Erro na API:', errorData);
      return;
    }
    
    const result = await response.json();
    console.log('\n✅ Lançamento criado com sucesso!');
    console.log('ID do lançamento:', result.id);
    
    // Verificar se os dados foram salvos corretamente
    const { data: lancamento, error } = await supabase
      .from('lancamentos_produtividade')
      .select('id, valid_tasks_count, tarefas_validas, valor_tarefas, nome_operador')
      .eq('id', result.id)
      .single();
      
    if (error) {
      console.error('❌ Erro ao verificar dados salvos:', error);
      return;
    }
    
    console.log('\n🔍 VERIFICAÇÃO DOS DADOS SALVOS:');
    console.log(`   ID: ${lancamento.id}`);
    console.log(`   Valid Tasks Count: ${lancamento.valid_tasks_count}`);
    console.log(`   Tarefas Válidas: ${lancamento.tarefas_validas}`);
    console.log(`   Valor Tarefas: R$ ${lancamento.valor_tarefas}`);
    console.log(`   Nome Operador: ${lancamento.nome_operador}`);
    
    // Verificar se a correção funcionou
    const isFixed = (
      lancamento.valid_tasks_count === 150 &&
      lancamento.tarefas_validas === 150 &&
      lancamento.valor_tarefas === 13.95 &&
      lancamento.nome_operador === 'DILSON ARLINDO DOS SANTOS'
    );
    
    if (isFixed) {
      console.log('\n🎉 CORREÇÃO FUNCIONOU! Todos os campos estão sendo salvos corretamente.');
    } else {
      console.log('\n❌ CORREÇÃO NÃO FUNCIONOU. Ainda há problemas com os dados.');
    }
    
    // Limpar o lançamento de teste
    await supabase
      .from('lancamentos_produtividade')
      .delete()
      .eq('id', result.id);
      
    console.log('\n🧹 Lançamento de teste removido.');
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testValidTasksFix();