// Usando fetch nativo do Node.js 18+

// URL base do servidor Netlify Dev
const BASE_URL = 'http://localhost:8889/.netlify/functions/api';

async function testKPIEndpoints() {
  console.log('🧪 Testando endpoints de KPI no Netlify Dev (porta 8889)\n');

  try {
    // 1. Teste de Health Check
    console.log('1. 🏥 Testando Health Check...');
    const healthResponse = await fetch(`${BASE_URL}/health`);
    console.log(`   Status: ${healthResponse.status}`);
    console.log(`   Content-Type: ${healthResponse.headers.get('content-type')}`);
    
    if (healthResponse.headers.get('content-type')?.includes('application/json')) {
      const healthData = await healthResponse.json();
      console.log(`   Resposta: ${JSON.stringify(healthData)}`);
    } else {
      const healthText = await healthResponse.text();
      console.log(`   Resposta (primeiros 200 chars): ${healthText.substring(0, 200)}...`);
    }
    console.log('');

    // 2. Teste de todos os KPIs
    console.log('2. 📊 Testando GET /kpis (todos os KPIs)...');
    const allKpisResponse = await fetch(`${BASE_URL}/kpis`);
    console.log(`   Status: ${allKpisResponse.status}`);
    console.log(`   Content-Type: ${allKpisResponse.headers.get('content-type')}`);
    
    if (allKpisResponse.headers.get('content-type')?.includes('application/json')) {
      const allKpisData = await allKpisResponse.json();
      console.log(`   Total de KPIs: ${allKpisData.length}`);
      console.log(`   KPIs: ${JSON.stringify(allKpisData)}`);
    } else {
      const allKpisText = await allKpisResponse.text();
      console.log(`   Resposta (primeiros 200 chars): ${allKpisText.substring(0, 200)}...`);
    }
    console.log('');

    // 3. Teste de funções disponíveis
    console.log('3. 👥 Testando GET /functions...');
    const functionsResponse = await fetch(`${BASE_URL}/functions`);
    console.log(`   Status: ${functionsResponse.status}`);
    console.log(`   Content-Type: ${functionsResponse.headers.get('content-type')}`);
    
    if (functionsResponse.headers.get('content-type')?.includes('application/json')) {
      const functionsData = await functionsResponse.json();
      console.log(`   Funções: ${JSON.stringify(functionsData)}`);
    } else {
      const functionsText = await functionsResponse.text();
      console.log(`   Resposta (primeiros 200 chars): ${functionsText.substring(0, 200)}...`);
    }
    console.log('');

    // 4. Testes específicos de KPIs por função e turno
    const testCases = [
      { funcao: 'Operador de Empilhadeira', turno: 'Manhã' },
      { funcao: 'Operador de Empilhadeira', turno: 'Tarde' },
      { funcao: 'Operador de Empilhadeira', turno: 'Noite' },
      { funcao: 'Ajudante de Armazém', turno: 'Manhã' },
      { funcao: 'Ajudante de Armazém', turno: 'Tarde' }
    ];

    for (const testCase of testCases) {
      console.log(`4.${testCases.indexOf(testCase) + 1} 🎯 Testando KPIs para ${testCase.funcao} - ${testCase.turno}...`);
      
      const url = `${BASE_URL}/kpis/available?funcao=${encodeURIComponent(testCase.funcao)}&turno=${encodeURIComponent(testCase.turno)}`;
      console.log(`   URL: ${url}`);
      
      const response = await fetch(url);
      console.log(`   Status: ${response.status}`);
      console.log(`   Content-Type: ${response.headers.get('content-type')}`);
      
      if (response.headers.get('content-type')?.includes('application/json')) {
        const data = await response.json();
        console.log(`   KPIs encontrados: ${data.length}`);
        console.log(`   KPIs: ${JSON.stringify(data)}`);
      } else {
        const text = await response.text();
        console.log(`   Resposta (primeiros 200 chars): ${text.substring(0, 200)}...`);
      }
      console.log('');
    }

    // 5. Teste sem parâmetros (deve retornar erro)
    console.log('5. ❌ Testando /kpis/available sem parâmetros (deve retornar erro)...');
    const noParamsResponse = await fetch(`${BASE_URL}/kpis/available`);
    console.log(`   Status: ${noParamsResponse.status}`);
    console.log(`   Content-Type: ${noParamsResponse.headers.get('content-type')}`);
    
    if (noParamsResponse.headers.get('content-type')?.includes('application/json')) {
      const noParamsData = await noParamsResponse.json();
      console.log(`   Resposta: ${JSON.stringify(noParamsData)}`);
    } else {
      const noParamsText = await noParamsResponse.text();
      console.log(`   Resposta (primeiros 200 chars): ${noParamsText.substring(0, 200)}...`);
    }
    console.log('');

    console.log('✅ Teste concluído!');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
  }
}

testKPIEndpoints();