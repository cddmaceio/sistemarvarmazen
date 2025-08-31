// Usando fetch nativo do Node.js 18+

// Teste de autenticação com dados reais
async function testAuth() {
  const testData = {
    cpf: '109.625.114-04',
    data_nascimento: '1993-10-21' // Formato YYYY-MM-DD
  };

  console.log('Testando autenticação com:', testData);

  try {
    const response = await fetch('http://localhost:8888/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    console.log('Status da resposta:', response.status);
    console.log('Headers da resposta:', Object.fromEntries(response.headers));

    const responseData = await response.text();
    console.log('Dados da resposta:', responseData);

    if (!response.ok) {
      console.error('Erro na autenticação:', response.status, responseData);
    } else {
      console.log('Autenticação bem-sucedida!');
    }
  } catch (error) {
    console.error('Erro na requisição:', error.message);
  }
}

// Teste com diferentes formatos de data
async function testDifferentDateFormats() {
  const formats = [
    '1993-10-21',
    '1993-10-21T02:00:00.000Z',
    '21/10/1993',
    '1993/10/21'
  ];

  for (const dateFormat of formats) {
    console.log(`\n--- Testando formato: ${dateFormat} ---`);
    
    const testData = {
      cpf: '109.625.114-04',
      data_nascimento: dateFormat
    };

    try {
      const response = await fetch('http://localhost:8888/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData),
      });

      console.log(`Status: ${response.status}`);
      const responseData = await response.text();
      console.log(`Resposta: ${responseData}`);
    } catch (error) {
      console.error(`Erro: ${error.message}`);
    }
  }
}

// Executar testes
async function runTests() {
  console.log('=== TESTE DE AUTENTICAÇÃO ===\n');
  
  await testAuth();
  
  console.log('\n=== TESTE DE FORMATOS DE DATA ===');
  await testDifferentDateFormats();
}

runTests().catch(console.error);