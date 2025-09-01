async function testCalculator() {
  const fetch = (await import('node-fetch')).default;
  console.log('🔧 TESTE DEBUG CALCULADORA');
  console.log('=' .repeat(50));
  
  const calculatorData = {
    "funcao": "Ajudante de Armazém",
    "turno": "Manhã",
    "multiple_activities": [
      {
        "nome_atividade": "Prod Repack",
        "quantidade_produzida": 100,
        "tempo_horas": 5
      },
      {
        "nome_atividade": "Prod Devolução",
        "quantidade_produzida": 300,
        "tempo_horas": 3
      }
    ],
    "kpis_atingidos": [],
    "data_lancamento": "2025-08-06"
  };
  
  console.log('📊 Dados enviados:', JSON.stringify(calculatorData, null, 2));
  
  try {
    const response = await fetch('http://localhost:8888/api/calculate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(calculatorData)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('\n💰 Resultado completo da calculadora:');
    console.log(JSON.stringify(result, null, 2));
    
    console.log('\n🔍 Campos específicos:');
    console.log('- produtividadeAlcancada:', result.data.produtividadeAlcancada);
    console.log('- nivelAtingido:', result.data.nivelAtingido);
    console.log('- unidadeMedida:', result.data.unidadeMedida);
    console.log('- atividadesDetalhes:', result.data.atividadesDetalhes);
    console.log('- tarefasValidas:', result.data.tarefasValidas);
    console.log('- valorTarefas:', result.data.valorTarefas);
    console.log('- valorBrutoAtividades:', result.data.valorBrutoAtividades);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

testCalculator();