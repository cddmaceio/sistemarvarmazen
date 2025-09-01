// Teste da API da calculadora

async function testarAPICalculadora() {
  const { default: fetch } = await import('node-fetch');
  console.log('🧪 Testando API da Calculadora');
  console.log('=' .repeat(50));

  const testData = {
    funcao: 'Ajudante de Armazém',
    turno: 'Manha',
    nome_atividade: 'Prod Amarração',
    quantidade_produzida: 100,
    tempo_horas: 8,
    kpis_atingidos: ['Ressuprimento', 'EFC']
  };

  console.log('📤 Dados enviados:');
  console.log(JSON.stringify(testData, null, 2));

  try {
    const response = await fetch('http://localhost:8888/.netlify/functions/api/calculate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });

    console.log(`\n📥 Status da resposta: ${response.status}`);
    
    const responseText = await response.text();
    console.log('📄 Resposta completa:');
    console.log(responseText);

    if (response.ok) {
      try {
        const result = JSON.parse(responseText);
        console.log('\n✅ Resultado parseado:');
        console.log(JSON.stringify(result, null, 2));
      } catch (e) {
        console.log('❌ Erro ao parsear JSON:', e.message);
      }
    } else {
      console.log('❌ Erro na requisição');
    }

  } catch (error) {
    console.error('❌ Erro na requisição:', error.message);
  }
}

testarAPICalculadora().catch(console.error);