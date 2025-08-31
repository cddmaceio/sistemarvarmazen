// Using native fetch (Node.js 18+)


async function testLancamento() {
  console.log('=== TESTING LANÇAMENTO AJUSTADO ===');

  const url = 'http://localhost:3000/.netlify/functions/api/lancamentos';

  const payload = {
  data_lancamento: '2025-01-24',
  user_id: 40, // Using user_id 9 from usuarios_data.sql
    calculator_data: {
      funcao: 'Operador de Empilhadeira',
      turno: 'Manhã',
      nome_atividade: 'Paletização',
      quantidade_produzida: 100,
      tempo_horas: 8,
    },
    calculator_result: {
      subtotalAtividades: 120.5,
      bonusKpis: 25.0,
      remuneracaoTotal: 145.5,
      kpisAtingidos: ['KPI_PRODUTIVIDADE_ACIMA_95'],
      produtividade_alcancada: 12.5,
      nivel_atingido: 'Nível 3',
      unidade_medida: 'paletes/hora',
    },
  };

  console.log('Payload a ser enviado:');
  console.log(JSON.stringify(payload, null, 2));

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    console.log(`POST Response status: ${response.status}`);

    const responseBody = await response.json();
    console.log('POST Response body:', JSON.stringify(responseBody, null, 2));

    if (response.status === 201) {
      console.log('✅ Lançamento criado com sucesso!');
    } else {
      console.log('❌ Falha ao criar lançamento.');
    }
  } catch (error) {
    console.error('Error during fetch:', error);
  }
}

testLancamento();