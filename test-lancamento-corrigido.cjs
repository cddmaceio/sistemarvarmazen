const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testLancamentoCorrigido() {
  console.log('🔧 TESTE: Verificando correção dos campos tarefas_validas e valor_tarefas');
  console.log('=' .repeat(70));
  
  try {
    // 1. Primeiro, vamos buscar um usuário Operador de Empilhadeira
    console.log('\n👤 1. Buscando usuário Operador de Empilhadeira...');
    const { data: usuarios, error: errorUsuarios } = await supabase
      .from('usuarios')
      .select('id, nome, funcao')
      .eq('funcao', 'Operador de Empilhadeira')
      .limit(1);
    
    if (errorUsuarios) {
      console.error('❌ Erro ao buscar usuários:', errorUsuarios);
      return;
    }
    
    if (!usuarios || usuarios.length === 0) {
      console.log('❌ Nenhum usuário Operador de Empilhadeira encontrado');
      return;
    }
    
    const usuario = usuarios[0];
    console.log(`✅ Usuário encontrado: ${usuario.nome} (ID: ${usuario.id})`);
    
    // 2. Testar a API de cálculo
    console.log('\n🧮 2. Testando API de cálculo...');
    const calculatorInput = {
      funcao: 'Operador de Empilhadeira',
      turno: 'Manhã',
      valid_tasks_count: 75,
      nome_operador: usuario.nome,
      kpis_atingidos: ['Pontualidade']
    };
    
    console.log('📤 Dados para cálculo:', calculatorInput);
    
    const responseCalc = await fetch('http://localhost:8888/api/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(calculatorInput)
    });
    
    if (!responseCalc.ok) {
      console.error('❌ Erro na API de cálculo:', responseCalc.status, await responseCalc.text());
      return;
    }
    
    const calculatorResult = await responseCalc.json();
    console.log('✅ Resultado do cálculo:', calculatorResult);
    console.log('🔍 Chaves do resultado:', Object.keys(calculatorResult));
    console.log('🔍 Verificando campos específicos:');
    console.log('   - tarefas_validas existe?', 'tarefas_validas' in calculatorResult);
    console.log('   - valor_tarefas existe?', 'valor_tarefas' in calculatorResult);
    console.log('   - tarefasValidas existe?', 'tarefasValidas' in calculatorResult);
    console.log('   - valorTarefas existe?', 'valorTarefas' in calculatorResult);
    
    // 3. Verificar se os campos estão presentes
    console.log('\n🔍 3. Verificando campos no resultado:');
    console.log(`   - tarefas_validas: ${calculatorResult.tarefas_validas} (${typeof calculatorResult.tarefas_validas})`);
    console.log(`   - valor_tarefas: ${calculatorResult.valor_tarefas} (${typeof calculatorResult.valor_tarefas})`);
    console.log(`   - subtotalAtividades: ${calculatorResult.subtotalAtividades} (${typeof calculatorResult.subtotalAtividades})`);
    
    if (calculatorResult.tarefas_validas === undefined || calculatorResult.valor_tarefas === undefined) {
      console.log('❌ PROBLEMA: Campos ainda estão undefined!');
      return;
    }
    
    // 4. Testar lançamento completo
    console.log('\n🚀 4. Testando lançamento completo...');
    const lancamentoData = {
      data_lancamento: '2025-01-15',
      user_id: usuario.id,
      calculator_data: calculatorInput,
      calculator_result: calculatorResult
    };
    
    console.log('📤 Dados para lançamento:', {
      ...lancamentoData,
      calculator_result: {
        ...calculatorResult,
        tarefas_validas: calculatorResult.tarefas_validas,
        valor_tarefas: calculatorResult.valor_tarefas
      }
    });
    
    const responseLanc = await fetch('http://localhost:8888/api/lancamentos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(lancamentoData)
    });
    
    if (!responseLanc.ok) {
      const errorText = await responseLanc.text();
      console.error('❌ Erro no lançamento:', responseLanc.status, errorText);
      return;
    }
    
    const lancamentoResult = await responseLanc.json();
    console.log('✅ Lançamento criado:', lancamentoResult);
    
    // 5. Verificar se os campos foram salvos corretamente no banco
    console.log('\n🔍 5. Verificando dados salvos no banco...');
    console.log(`   - ID do lançamento: ${lancamentoResult.id}`);
    console.log(`   - tarefas_validas: ${lancamentoResult.tarefas_validas}`);
    console.log(`   - valor_tarefas: ${lancamentoResult.valor_tarefas}`);
    console.log(`   - subtotal_atividades: ${lancamentoResult.subtotal_atividades}`);
    console.log(`   - remuneracao_total: ${lancamentoResult.remuneracao_total}`);
    
    if (lancamentoResult.tarefas_validas !== null && lancamentoResult.valor_tarefas !== null) {
      console.log('\n✅ SUCESSO! Os campos tarefas_validas e valor_tarefas foram salvos corretamente!');
      
      // Calcular valores esperados
      const expectedTarefasValidas = calculatorInput.valid_tasks_count;
      const expectedValorTarefas = calculatorInput.valid_tasks_count * 0.093;
      const expectedSubtotal = expectedValorTarefas / 2;
      
      console.log('\n📊 Verificação de valores:');
      console.log(`   - Tarefas válidas esperadas: ${expectedTarefasValidas}, salvas: ${lancamentoResult.tarefas_validas} ${expectedTarefasValidas === lancamentoResult.tarefas_validas ? '✅' : '❌'}`);
      console.log(`   - Valor tarefas esperado: ${expectedValorTarefas.toFixed(3)}, salvo: ${lancamentoResult.valor_tarefas} ${Math.abs(expectedValorTarefas - lancamentoResult.valor_tarefas) < 0.001 ? '✅' : '❌'}`);
      console.log(`   - Subtotal esperado: ${expectedSubtotal.toFixed(3)}, salvo: ${lancamentoResult.subtotal_atividades} ${Math.abs(expectedSubtotal - lancamentoResult.subtotal_atividades) < 0.001 ? '✅' : '❌'}`);
      
    } else {
      console.log('\n❌ PROBLEMA: Os campos ainda estão null no banco de dados!');
    }
    
    console.log('\n🎯 Teste concluído!');
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

// Executar o teste
testLancamentoCorrigido();