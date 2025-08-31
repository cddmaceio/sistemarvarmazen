const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testTarefasValidasDebug() {
  console.log('🔍 TESTE: Verificando problema com tarefas_validas e valor_tarefas');
  console.log('=' .repeat(60));
  
  try {
    // 1. Primeiro, vamos verificar os últimos lançamentos de Operador de Empilhadeira
    console.log('\n📊 1. Verificando últimos lançamentos de Operador de Empilhadeira...');
    const { data: ultimosLancamentos, error: errorUltimos } = await supabase
      .from('lancamentos_produtividade')
      .select('*')
      .eq('funcao', 'Operador de Empilhadeira')
      .order('id', { ascending: false })
      .limit(5);
    
    if (errorUltimos) {
      console.error('❌ Erro ao buscar últimos lançamentos:', errorUltimos);
      return;
    }
    
    console.log(`\n📋 Encontrados ${ultimosLancamentos?.length || 0} lançamentos recentes:`);
    ultimosLancamentos?.forEach((lancamento, index) => {
      console.log(`\n${index + 1}. ID: ${lancamento.id}`);
      console.log(`   - Usuário: ${lancamento.user_nome}`);
      console.log(`   - Data: ${lancamento.data_lancamento}`);
      console.log(`   - valid_tasks_count: ${lancamento.valid_tasks_count}`);
      console.log(`   - tarefas_validas: ${lancamento.tarefas_validas}`);
      console.log(`   - valor_tarefas: ${lancamento.valor_tarefas}`);
      console.log(`   - subtotal_atividades: ${lancamento.subtotal_atividades}`);
      console.log(`   - remuneracao_total: ${lancamento.remuneracao_total}`);
      console.log(`   - Status: ${lancamento.status}`);
    });
    
    // 2. Vamos simular um cálculo como a API faz
    console.log('\n🧮 2. Simulando cálculo da API...');
    const valid_tasks_count = 50; // Exemplo
    const tarefas_validas = valid_tasks_count;
    const valor_tarefas = valid_tasks_count * 0.093; // R$ 0,093 per valid task
    const subtotal_atividades = valor_tarefas / 2; // Apply 50% rule
    
    console.log(`   - valid_tasks_count: ${valid_tasks_count}`);
    console.log(`   - tarefas_validas calculado: ${tarefas_validas}`);
    console.log(`   - valor_tarefas calculado: R$ ${valor_tarefas.toFixed(3)}`);
    console.log(`   - subtotal_atividades calculado: R$ ${subtotal_atividades.toFixed(3)}`);
    
    // 3. Vamos testar a API de cálculo diretamente
    console.log('\n🔗 3. Testando API de cálculo...');
    const calculatorInput = {
      funcao: 'Operador de Empilhadeira',
      turno: 'Manhã',
      valid_tasks_count: valid_tasks_count,
      nome_operador: 'Teste Operador',
      kpis_atingidos: ['Pontualidade']
    };
    
    console.log('📤 Enviando para API:', calculatorInput);
    
    const response = await fetch('http://localhost:8888/api/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(calculatorInput)
    });
    
    if (!response.ok) {
      console.error('❌ Erro na API de cálculo:', response.status, await response.text());
      return;
    }
    
    const calculatorResult = await response.json();
    console.log('✅ Resultado da API de cálculo:', calculatorResult);
    
    // 4. Verificar se os campos estão presentes no resultado
    console.log('\n🔍 4. Verificando campos no resultado:');
    console.log(`   - tarefas_validas: ${calculatorResult.tarefas_validas} (${typeof calculatorResult.tarefas_validas})`);
    console.log(`   - valor_tarefas: ${calculatorResult.valor_tarefas} (${typeof calculatorResult.valor_tarefas})`);
    console.log(`   - subtotalAtividades: ${calculatorResult.subtotalAtividades} (${typeof calculatorResult.subtotalAtividades})`);
    
    if (calculatorResult.tarefas_validas === undefined || calculatorResult.valor_tarefas === undefined) {
      console.log('❌ PROBLEMA IDENTIFICADO: Campos tarefas_validas ou valor_tarefas estão undefined no resultado da API!');
    } else {
      console.log('✅ Campos estão presentes no resultado da API');
    }
    
    // 5. Verificar se há algum usuário de teste para simular um lançamento
    console.log('\n👤 5. Verificando usuários disponíveis...');
    const { data: usuarios, error: errorUsuarios } = await supabase
      .from('users')
      .select('id, nome, funcao')
      .eq('funcao', 'Operador de Empilhadeira')
      .limit(3);
    
    if (errorUsuarios) {
      console.error('❌ Erro ao buscar usuários:', errorUsuarios);
      return;
    }
    
    console.log(`\n📋 Encontrados ${usuarios?.length || 0} operadores de empilhadeira:`);
    usuarios?.forEach((usuario, index) => {
      console.log(`${index + 1}. ID: ${usuario.id} - ${usuario.nome} (${usuario.funcao})`);
    });
    
    console.log('\n✅ Teste concluído!');
    console.log('\n💡 Próximos passos:');
    console.log('1. Verificar se a API está retornando os campos corretamente');
    console.log('2. Verificar se o frontend está enviando os dados corretamente');
    console.log('3. Verificar se o backend está salvando os dados corretamente');
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

// Executar o teste
testTarefasValidasDebug();