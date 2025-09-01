async function testCalculatorFields() {
  const { default: fetch } = await import('node-fetch');
  console.log('🔧 TESTE CAMPOS CALCULADORA');
  console.log('==================================================');
  
  try {
    // Teste 1: Verificar se a calculadora retorna os campos corretos
    console.log('\n1️⃣ TESTE: Calculadora com atividades múltiplas');
    console.log('--------------------------------------------------');
    
    const calculatorData = {
      funcao: 'Ajudante de Armazém',
      turno: 'Manhã',
      multiple_activities: [
        {
          nome_atividade: 'Prod Repack',
          quantidade_produzida: 100,
          tempo_horas: 5
        },
        {
          nome_atividade: 'Prod Devolução',
          quantidade_produzida: 300,
          tempo_horas: 3
        }
      ],
      kpis_atingidos: [],
      data_lancamento: '2025-08-06'
    };
    
    const calcResponse = await fetch('http://localhost:8888/api/calculate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(calculatorData)
    });
    
    if (!calcResponse.ok) {
      throw new Error(`Erro na calculadora: ${calcResponse.status}`);
    }
    
    const calcResult = await calcResponse.json();
    console.log('✅ Calculadora OK!');
    console.log('📊 Resultado completo:', JSON.stringify(calcResult, null, 2));
    
    // Verificar campos específicos
    console.log('\n🔍 Campos específicos na resposta:');
    console.log('- produtividadeAlcancada:', calcResult.data.produtividadeAlcancada);
    console.log('- nivelAtingido:', calcResult.data.nivelAtingido);
    console.log('- unidadeMedida:', calcResult.data.unidadeMedida);
    console.log('- atividadesDetalhes:', calcResult.data.atividadesDetalhes);
    console.log('- valorBrutoAtividades:', calcResult.data.valorBrutoAtividades);
    
    // Teste 2: Criar lançamento e verificar se os campos são salvos
    console.log('\n2️⃣ TESTE: Criação de lançamento');
    console.log('--------------------------------------------------');
    
    const lancamentoData = {
      user_id: 3,
      data_lancamento: '2025-08-06',
      calculator_data: calculatorData,
      calculator_result: calcResult.data
    };
    
    const lancResponse = await fetch('http://localhost:8888/api/lancamentos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(lancamentoData)
    });
    
    if (!lancResponse.ok) {
      throw new Error(`Erro no lançamento: ${lancResponse.status}`);
    }
    
    const lancResult = await lancResponse.json();
    console.log('✅ Lançamento criado! ID:', lancResult.id);
    
    // Aguardar um pouco para garantir que foi salvo
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('\n🎉 TESTE FINALIZADO!');
    console.log('============================================================');
    console.log('🆔 ID do lançamento criado:', lancResult.id);
    console.log('📝 Verifique no banco se os campos foram salvos corretamente.');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
    process.exit(1);
  }
}

testCalculatorFields();