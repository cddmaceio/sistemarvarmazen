async function findAndTestUser() {
  console.log('Finding a valid user ID from existing launches...');

  try {
    // 1. Fetch existing launches to find a valid user_id
    const getResponse = await fetch('http://localhost:3000/.netlify/functions/api/lancamentos');
    if (!getResponse.ok) {
      console.error(`Error fetching launches: ${getResponse.status} ${getResponse.statusText}`);
      const errorText = await getResponse.text();
      console.error('Response body:', errorText);
      return;
    }
    const launches = await getResponse.json();

    if (!launches || launches.length === 0) {
      console.error('No launches found to extract a user ID from.');
      return;
    }

    // Extract a user_id from the first launch
    const validUserId = launches[0].user_id;
    console.log(`Found valid user ID: ${validUserId}`);

    // 2. Use the valid user_id to create a new launch
    const payload = {
      data_lancamento: '2025-01-24',
      user_id: validUserId,
      calculator_data: {
        funcao: 'Operador de Empilhadeira',
        turno: 'Tarde',
        nome_atividade: 'Paletização',
        quantidade_produzida: 150,
        tempo_horas: 8,
      },
      calculator_result: {
        subtotalAtividades: 130.0,
        bonusKpis: 0,
        remuneracaoTotal: 130.0,
        kpisAtingidos: [],
        produtividade_alcancada: 18.75,
        nivel_atingido: 'Nível 4',
        unidade_medida: 'paletes/hora',
      },
    };

    console.log('\n--- Testing new launch with valid user ID ---');
    console.log('Payload:', JSON.stringify(payload, null, 2));

    const postResponse = await fetch('http://localhost:3000/.netlify/functions/api/lancamentos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const responseBody = await postResponse.json();
    console.log('POST Response status:', postResponse.status);
    console.log('POST Response body:', JSON.stringify(responseBody, null, 2));

    if (postResponse.ok) {
      console.log('✅ Successfully created launch!');
    } else {
      console.log('❌ Failed to create launch.');
    }
  } catch (error) {
    console.error('An error occurred:', error);
  }
}

findAndTestUser();