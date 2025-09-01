const BASE_URL = 'http://localhost:8888';

async function testCalculadora() {
  const { default: fetch } = await import('node-fetch');
  console.log('🧮 Testando Calculadora de KPIs...');
  
  try {
    // 1. Testar se a página da calculadora carrega
    console.log('\n1. Testando carregamento da página da calculadora...');
    const pageResponse = await fetch(`${BASE_URL}/calculadora`);
    console.log(`Status da página: ${pageResponse.status}`);
    
    if (pageResponse.status === 200) {
      const pageContent = await pageResponse.text();
      console.log('✅ Página da calculadora carregou com sucesso');
      
      // Verificar se contém elementos importantes
      const hasKpiSection = pageContent.includes('KPIs Disponíveis');
      const hasCalculateButton = pageContent.includes('Calcular');
      const hasResultSection = pageContent.includes('resultado');
      
      console.log(`   - Seção de KPIs: ${hasKpiSection ? '✅' : '❌'}`);
      console.log(`   - Botão Calcular: ${hasCalculateButton ? '✅' : '❌'}`);
      console.log(`   - Seção de Resultado: ${hasResultSection ? '✅' : '❌'}`);
    } else {
      console.log('❌ Falha ao carregar a página da calculadora');
    }
    
    // 2. Testar API de funções
    console.log('\n2. Testando API de funções...');
    const functionsResponse = await fetch(`${BASE_URL}/api/functions`);
    console.log(`Status: ${functionsResponse.status}`);
    
    if (functionsResponse.status === 200) {
      const functions = await functionsResponse.json();
      console.log('Funções disponíveis:', functions);
    }
    
    // 3. Testar API de KPIs disponíveis para cada função
    console.log('\n3. Testando KPIs disponíveis para diferentes funções...');
    const testCases = [
      { funcao: 'Operador de Empilhadeira', turno: 'Manhã' },
      { funcao: 'Ajudante de Armazém', turno: 'Manhã' },
      { funcao: 'Operador de Empilhadeira', turno: 'Tarde' },
    ];
    
    for (const testCase of testCases) {
      const url = `${BASE_URL}/api/kpis/available?funcao=${encodeURIComponent(testCase.funcao)}&turno=${encodeURIComponent(testCase.turno)}`;
      const response = await fetch(url);
      
      console.log(`\n   Função: ${testCase.funcao}, Turno: ${testCase.turno}`);
      console.log(`   Status: ${response.status}`);
      
      if (response.status === 200) {
        const data = await response.json();
        console.log(`   KPIs encontrados: ${data.kpisAtingidos.length}`);
        data.kpisAtingidos.forEach((kpi, index) => {
          console.log(`     ${index + 1}. ${kpi.nome_kpi} (Meta: ${kpi.valor_meta_kpi})`);
        });
      } else {
        const error = await response.json();
        console.log(`   Erro: ${error.error}`);
      }
    }
    
    // 4. Testar cálculo de KPIs
    console.log('\n4. Testando cálculo de KPIs...');
    const calculatePayload = {
      funcao: 'Operador de Empilhadeira',
      turno: 'Manhã',
      kpisAtingidos: ['TMA', 'Ressuprimento'],
      valoresAtingidos: [95, 98]
    };
    
    const calculateResponse = await fetch(`${BASE_URL}/api/calculate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(calculatePayload)
    });
    
    console.log(`Status do cálculo: ${calculateResponse.status}`);
    
    if (calculateResponse.status === 200) {
      const result = await calculateResponse.json();
      console.log('✅ Cálculo realizado com sucesso!');
      console.log('Resultado:', JSON.stringify(result, null, 2));
    } else {
      const error = await calculateResponse.json();
      console.log('❌ Erro no cálculo:', error);
    }
    
  } catch (error) {
    console.error('❌ Erro durante os testes:', error.message);
  }
}

testCalculadora();