const fetch = require('node-fetch');

async function testDilsonNewLancamento() {
  console.log('=== TESTE DE NOVO LANÇAMENTO PARA DILSON ===\n');
  
  try {
    // Dados para um novo lançamento de teste
    const testData = {
      user_id: 1, // ID do Dilson
      data_lancamento: '2025-01-26',
      calculator_data: {
        funcao: 'Operador de Empilhadeira',
        turno: 'Manhã',
        nome_operador: 'DILSON ARLINDO DOS SANTOS',
        valid_tasks_count: 100, // Teste com 100 tarefas válidas
        kpis_atingidos: ['Produtividade'] // Teste com um KPI
      },
      calculator_result: {
        subtotalAtividades: 4.65, // 100 * 0.093 / 2
        bonusKpis: 3.00, // Bonus por KPI
        remuneracaoTotal: 7.65, // subtotal + bonus
        tarefas_validas: 100,
        valor_tarefas: 9.30 // 100 * 0.093
      }
    };
    
    console.log('📤 Enviando dados para a API...');
    console.log('Dados:', JSON.stringify(testData, null, 2));
    
    // Fazer a requisição para a API
    const response = await fetch('http://localhost:8888/api/lancamentos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Erro na API:', errorData);
      return;
    }
    
    const result = await response.json();
    console.log('\n✅ Lançamento criado com sucesso!');
    console.log('ID do lançamento:', result.id);
    console.log('Status:', result.status);
    console.log('Tarefas válidas salvas:', result.tarefas_validas);
    console.log('Valor tarefas salvo:', result.valor_tarefas);
    console.log('Remuneração total:', result.remuneracao_total);
    
    // Agora vamos buscar os dados do Dilson novamente
    console.log('\n📊 Buscando dados atualizados do Dilson...');
    
    const getLancamentosResponse = await fetch('http://localhost:8888/api/lancamentos?user_id=1');
    
    if (!getLancamentosResponse.ok) {
      console.error('❌ Erro ao buscar lançamentos');
      return;
    }
    
    const lancamentos = await getLancamentosResponse.json();
    const dilsonLancamentos = lancamentos.filter(l => l.user_id === 1);
    
    console.log(`\n📋 Total de lançamentos do Dilson: ${dilsonLancamentos.length}`);
    
    // Verificar o lançamento recém-criado
    const novoLancamento = dilsonLancamentos.find(l => l.id === result.id);
    if (novoLancamento) {
      console.log('\n🔍 Verificação do novo lançamento:');
      console.log(`   ID: ${novoLancamento.id}`);
      console.log(`   Data: ${novoLancamento.data_lancamento}`);
      console.log(`   Função: ${novoLancamento.funcao}`);
      console.log(`   Valid Tasks Count: ${novoLancamento.valid_tasks_count}`);
      console.log(`   Tarefas Válidas: ${novoLancamento.tarefas_validas}`);
      console.log(`   Valor Tarefas: ${novoLancamento.valor_tarefas}`);
      console.log(`   Status: ${novoLancamento.status}`);
      
      // Verificar se os campos estão corretos
      if (novoLancamento.tarefas_validas === 100 && novoLancamento.valor_tarefas === 9.30) {
        console.log('\n✅ SUCESSO: Os campos tarefas_validas e valor_tarefas foram salvos corretamente!');
      } else {
        console.log('\n❌ PROBLEMA: Os campos não foram salvos corretamente.');
        console.log(`   Esperado: tarefas_validas=100, valor_tarefas=9.30`);
        console.log(`   Recebido: tarefas_validas=${novoLancamento.tarefas_validas}, valor_tarefas=${novoLancamento.valor_tarefas}`);
      }
    }
    
    // Verificar lançamentos antigos com problemas
    console.log('\n🔍 Verificando lançamentos antigos com problemas...');
    const problemLancamentos = dilsonLancamentos.filter(l => 
      l.funcao === 'Operador de Empilhadeira' && 
      l.valid_tasks_count > 0 && 
      (l.tarefas_validas === null || l.valor_tarefas === null)
    );
    
    console.log(`Lançamentos com problemas encontrados: ${problemLancamentos.length}`);
    problemLancamentos.forEach(l => {
      console.log(`   ID ${l.id}: valid_tasks_count=${l.valid_tasks_count}, tarefas_validas=${l.tarefas_validas}, valor_tarefas=${l.valor_tarefas}`);
    });
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

// Executar o teste
testDilsonNewLancamento();