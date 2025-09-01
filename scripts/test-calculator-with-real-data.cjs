const testCalculatorWithRealData = async () => {
  const { default: fetch } = await import('node-fetch');
  
  const baseUrl = 'http://localhost:8888/.netlify/functions/api';
  
  console.log('Testando calculadora com dados mais realistas...\n');
  
  // Teste 1: Separação com quantidade maior
  console.log('=== TESTE 1: SEPARAÇÃO COM ALTA PRODUTIVIDADE ===');
  const testData1 = {
    funcao: 'Ajudante de Armazém',
    atividades: [
      {
        nome_atividade: 'Separação',
        quantidade_produzida: 500,
        tempo_horas: 8,
        input_adicional: 0
      }
    ],
    turno: 'Manhã',
    data: '2025-01-15'
  };
  
  try {
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
  
  // Teste 2: Múltiplas atividades
  console.log('\n=== TESTE 2: MÚLTIPLAS ATIVIDADES ===');
  const testData2 = {
    funcao: 'Ajudante de Armazém',
    atividades: [
      {
        nome_atividade: 'Separação',
        quantidade_produzida: 300,
        tempo_horas: 4,
        input_adicional: 0
      },
      {
        nome_atividade: 'Conferência',
        quantidade_produzida: 200,
        tempo_horas: 4,
        input_adicional: 0
      }
    ],
    turno: 'Tarde',
    data: '2025-01-15'
  };
  
  try {
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
  
  // Teste 3: Turno Noite
  console.log('\n=== TESTE 3: TURNO NOITE ===');
  const testData3 = {
    funcao: 'Ajudante de Armazém',
    atividades: [
      {
        nome_atividade: 'Separação',
        quantidade_produzida: 400,
        tempo_horas: 8,
        input_adicional: 0
      }
    ],
    turno: 'Noite',
    data: '2025-01-15'
  };
  
  try {
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
};

testCalculatorWithRealData().catch(console.error);