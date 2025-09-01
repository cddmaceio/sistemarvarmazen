async function testEditLancamento() {
  const { default: fetch } = await import('node-fetch');
  try {
    console.log('🔍 Testando edição de lançamento...');
    
    // Dados de teste que simulam o que o frontend está enviando
    const testData = {
      calculator_data: {
        funcao: "Operador de Empilhadeira",
        turno: "Manhã",
        nome_operador: "Teste Operador",
        valid_tasks_count: 10,
        data_lancamento: "2024-01-15"
      },
      calculator_result: {
        subtotalAtividades: 100,
        bonusKpis: 50,
        remuneracaoTotal: 150,
        kpisAtingidos: ["KPI1", "KPI2"]
      },
      editado_por_admin: "1",
      observacoes: "Teste de edição"
    };

    console.log('📤 Enviando dados:', JSON.stringify(testData, null, 2));

    const response = await fetch('http://localhost:8888/api/lancamentos/98/edit', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });

    console.log('📊 Status da resposta:', response.status);
    console.log('📊 Headers da resposta:', Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log('📄 Resposta completa:', responseText);

    if (!response.ok) {
      try {
        const errorData = JSON.parse(responseText);
        console.log('❌ Erro estruturado:', JSON.stringify(errorData, null, 2));
      } catch (e) {
        console.log('❌ Erro não é JSON válido:', responseText);
      }
    } else {
      console.log('✅ Edição realizada com sucesso!');
    }

  } catch (error) {
    console.error('💥 Erro no teste:', error.message);
    if (error.code) {
      console.error('💥 Código do erro:', error.code);
    }
  }
}

testEditLancamento();