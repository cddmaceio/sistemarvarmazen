const testCalculatorRealActivities = async () => {
  const { default: fetch } = await import('node-fetch');
  
  const baseUrl = 'http://localhost:8888/.netlify/functions/api';
  
  console.log('Testando calculadora com atividades reais do banco...\n');
  
  // Teste 1: Separação (atividade que existe no banco)
  console.log('=== TESTE 1: SEPARAÇÃO (ATIVIDADE REAL) ===');
  const testData1 = {
    funcao: 'Ajudante de Armazém',
    multiple_activities: [
      {
        nome_atividade: 'Separação',
        quantidade_produzida: 50, // 50 pallets em 8 horas = 6.25 plt/h
        tempo_horas: 8
      }
    ],
    turno: 'Manhã',
    data_lancamento: '2025-01-15'
  };
  
  try {
    console.log('Enviando dados:', JSON.stringify(testData1, null, 2));
    const response1 = await fetch(`${baseUrl}/calculate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData1)
    });
    
    const result1 = await response1.json();
    console.log('Resultado Teste 1:', JSON.stringify(result1, null, 2));
  } catch (error) {
    console.error('Erro no Teste 1:', error.message);
  }
  
  // Teste 2: Conferência (atividade que existe no banco)
  console.log('\n=== TESTE 2: CONFERÊNCIA (ATIVIDADE REAL) ===');
  const testData2 = {
    funcao: 'Ajudante de Armazém',
    multiple_activities: [
      {
        nome_atividade: 'Conferência',
        quantidade_produzida: 40, // 40 pallets em 8 horas = 5 plt/h
        tempo_horas: 8
      }
    ],
    turno: 'Tarde',
    data_lancamento: '2025-01-15'
  };
  
  try {
    console.log('Enviando dados:', JSON.stringify(testData2, null, 2));
    const response2 = await fetch(`${baseUrl}/calculate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData2)
    });
    
    const result2 = await response2.json();
    console.log('Resultado Teste 2:', JSON.stringify(result2, null, 2));
  } catch (error) {
    console.error('Erro no Teste 2:', error.message);
  }
  
  // Teste 3: Prod Retorno (atividade que existe no banco)
  console.log('\n=== TESTE 3: PROD RETORNO (ATIVIDADE REAL) ===');
  const testData3 = {
    funcao: 'Ajudante de Armazém',
    multiple_activities: [
      {
        nome_atividade: 'Prod Retorno',
        quantidade_produzida: 10, // 10 pallets em 8 horas = 1.25 plt/h
        tempo_horas: 8
      }
    ],
    turno: 'Manhã',
    data_lancamento: '2025-01-15'
  };
  
  try {
    console.log('Enviando dados:', JSON.stringify(testData3, null, 2));
    const response3 = await fetch(`${baseUrl}/calculate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData3)
    });
    
    const result3 = await response3.json();
    console.log('Resultado Teste 3:', JSON.stringify(result3, null, 2));
  } catch (error) {
    console.error('Erro no Teste 3:', error.message);
  }
  
  // Teste 4: Alta produtividade para testar bônus
  console.log('\n=== TESTE 4: ALTA PRODUTIVIDADE (SEPARAÇÃO) ===');
  const testData4 = {
    funcao: 'Ajudante de Armazém',
    multiple_activities: [
      {
        nome_atividade: 'Separação',
        quantidade_produzida: 80, // 80 pallets em 8 horas = 10 plt/h (alta produtividade)
        tempo_horas: 8
      }
    ],
    turno: 'Manhã',
    data_lancamento: '2025-01-15'
  };
  
  try {
    console.log('Enviando dados:', JSON.stringify(testData4, null, 2));
    const response4 = await fetch(`${baseUrl}/calculate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData4)
    });
    
    const result4 = await response4.json();
    console.log('Resultado Teste 4:', JSON.stringify(result4, null, 2));
  } catch (error) {
    console.error('Erro no Teste 4:', error.message);
  }
};

testCalculatorRealActivities().catch(console.error);