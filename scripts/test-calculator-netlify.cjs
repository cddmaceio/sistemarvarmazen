// Teste da calculadora via Netlify Functions
async function testCalculatorNetlify() {
  const { default: fetch } = await import('node-fetch');
  console.log('=== TESTE DA CALCULADORA VIA NETLIFY ===');
  
  try {
    // URL do Netlify local
    const baseUrl = 'http://localhost:8888/.netlify/functions/api';
    
    // Dados de teste para a calculadora
    const testData = {
      funcao: 'Ajudante de Armazém',
      atividades: [
        {
          nome_atividade: 'Separação',
          quantidade_produzida: 100,
          tempo_horas: 8,
          input_adicional: 0
        }
      ],
      turno: 'Manhã',
      data: '2025-01-15'
    };
    
    console.log('Enviando dados para calculadora:', JSON.stringify(testData, null, 2));
    
    const response = await fetch(`${baseUrl}/calculate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });
    
    console.log('Status da resposta:', response.status);
    console.log('Headers da resposta:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('Resposta bruta:', responseText);
    
    if (response.ok) {
      try {
        const result = JSON.parse(responseText);
        console.log('✅ Calculadora funcionando!');
        console.log('Resultado:', JSON.stringify(result, null, 2));
        return true;
      } catch (parseError) {
        console.log('❌ Erro ao fazer parse da resposta:', parseError.message);
        return false;
      }
    } else {
      console.log('❌ Erro na requisição:', response.status, responseText);
      return false;
    }
    
  } catch (error) {
    console.log('❌ Erro na conexão:', error.message);
    return false;
  }
}

// Teste de health check
async function testHealthCheck() {
  const { default: fetch } = await import('node-fetch');
  console.log('\n=== TESTE DE HEALTH CHECK ===');
  
  try {
    const baseUrl = 'http://localhost:8888/.netlify/functions/api';
    
    const response = await fetch(`${baseUrl}/health`);
    console.log('Status:', response.status);
    
    const result = await response.text();
    console.log('Resposta:', result);
    
    return response.ok;
  } catch (error) {
    console.log('❌ Erro no health check:', error.message);
    return false;
  }
}

// Executar testes
async function runTests() {
  console.log('Iniciando testes da calculadora via Netlify...');
  
  const healthOk = await testHealthCheck();
  if (!healthOk) {
    console.log('❌ Health check falhou - servidor pode não estar rodando');
    return;
  }
  
  const calculatorOk = await testCalculatorNetlify();
  
  console.log('\n=== RESUMO DOS TESTES ===');
  console.log('Health Check:', healthOk ? '✅' : '❌');
  console.log('Calculadora:', calculatorOk ? '✅' : '❌');
}

runTests().catch(console.error);