async function testEditLancamento() {
  const { default: fetch } = await import('node-fetch');
  try {
    console.log('=== Teste de Debug - Erro 400 na Edição ===\n');
    
    // Dados da calculadora (baseado nos logs)
    const calculatorData = {
      nome_atividade: "Prod Amarração",
      funcao: "Ajudante de Armazém",
      turno: "Manha",
      quantidade_produzida: 40,
      tempo_horas: 3,
      input_adicional: 0,
      kpis_atingidos: ["Ressuprimento", "EFC"],
      nome_operador: "",
      valid_tasks_count: 0
    };
    
    console.log('Calculator Data:', JSON.stringify(calculatorData, null, 2));
    
    // Primeiro, vamos testar a calculadora
    console.log('\n=== Testando Calculadora ===');
    const calcResponse = await fetch('http://localhost:8888/api/calculate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(calculatorData)
    });
    
    console.log('Calculator Status:', calcResponse.status);
    
    if (!calcResponse.ok) {
      const calcError = await calcResponse.text();
      console.log('Calculator Error:', calcError);
      return;
    }
    
    const calculatorResult = await calcResponse.json();
    console.log('Calculator Result:', JSON.stringify(calculatorResult, null, 2));
    
    // Agora vamos testar a edição
    console.log('\n=== Testando Edição do Lançamento ===');
    
    // Extrair os dados do objeto 'data' retornado pela calculadora
    const calculatorResultData = calculatorResult.data;
    
    const editData = {
      calculator_data: calculatorData,
      calculator_result: calculatorResultData, // Usar apenas os dados, não o wrapper
      editado_por_admin: '087.495.304-96',
      observacoes: 'Teste de edição via script'
    };
    
    console.log('Edit Data:', JSON.stringify(editData, null, 2));
    
    const editResponse = await fetch('http://localhost:8888/api/lancamentos/100/edit', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(editData)
    });
    
    console.log('\nEdit Response Status:', editResponse.status);
    console.log('Edit Response Headers:', Object.fromEntries(editResponse.headers));
    
    const editResponseText = await editResponse.text();
    console.log('Edit Response Body:', editResponseText);
    
    if (!editResponse.ok) {
      console.log('\n❌ ERRO 400 - Detalhes:');
      try {
        const errorJson = JSON.parse(editResponseText);
        console.log('Error JSON:', JSON.stringify(errorJson, null, 2));
      } catch (e) {
        console.log('Error Text (não é JSON):', editResponseText);
      }
    } else {
      console.log('\n✅ Edição realizada com sucesso!');
      try {
        const successJson = JSON.parse(editResponseText);
        console.log('Success JSON:', JSON.stringify(successJson, null, 2));
      } catch (e) {
        console.log('Success Text:', editResponseText);
      }
    }
    
  } catch (error) {
    console.error('Erro no teste:', error);
  }
}

testEditLancamento();