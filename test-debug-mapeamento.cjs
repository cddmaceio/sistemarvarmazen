async function testMapeamento() {
  const { default: fetch } = await import('node-fetch');
  
  console.log('🔧 TESTE DEBUG MAPEAMENTO');
  console.log('==================================================');
  
  try {
    // Teste 1: Verificar calculadora
    console.log('\n1️⃣ TESTE: Calculadora');
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
    
    const calcResult = await calcResponse.json();
    console.log('✅ Calculadora OK!');
    console.log('📊 Calculator Result Data:', JSON.stringify(calcResult.data, null, 2));
    
    // Teste 2: Verificar mapeamento específico
    console.log('\n2️⃣ TESTE: Mapeamento específico');
    console.log('--------------------------------------------------');
    
    const result = calcResult.data;
    console.log('🔍 Campos específicos:');
    console.log('- result.produtividadeAlcancada:', result.produtividadeAlcancada);
    console.log('- result.nivelAtingido:', result.nivelAtingido);
    console.log('- result.unidadeMedida:', result.unidadeMedida);
    console.log('- result.atividadesDetalhes:', result.atividadesDetalhes);
    console.log('- result.valorBrutoAtividades:', result.valorBrutoAtividades);
    
    // Teste 3: Criar lançamento com debug
    console.log('\n3️⃣ TESTE: Criação com debug');
    console.log('--------------------------------------------------');
    
    const lancamentoData = {
      user_id: 3,
      data_lancamento: '2025-08-06',
      calculator_data: calculatorData,
      calculator_result: result
    };
    
    console.log('📤 Dados enviados para lançamento:');
    console.log('- calculator_result.produtividadeAlcancada:', lancamentoData.calculator_result.produtividadeAlcancada);
    console.log('- calculator_result.nivelAtingido:', lancamentoData.calculator_result.nivelAtingido);
    console.log('- calculator_result.unidadeMedida:', lancamentoData.calculator_result.unidadeMedida);
    console.log('- calculator_result.atividadesDetalhes:', lancamentoData.calculator_result.atividadesDetalhes);
    console.log('- calculator_result.valorBrutoAtividades:', lancamentoData.calculator_result.valorBrutoAtividades);
    
    const lancResponse = await fetch('http://localhost:8888/api/lancamentos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(lancamentoData)
    });
    
    if (!lancResponse.ok) {
      const errorText = await lancResponse.text();
      console.error('❌ Erro no lançamento:', errorText);
      return;
    }
    
    const lancResult = await lancResponse.json();
    console.log('✅ Lançamento criado! ID:', lancResult.id);
    
    // Aguardar um pouco
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('\n🎉 TESTE FINALIZADO!');
    console.log('============================================================');
    console.log('🆔 ID do lançamento criado:', lancResult.id);
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
    process.exit(1);
  }
}

testMapeamento();