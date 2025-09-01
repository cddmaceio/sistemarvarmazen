async function testKPIsDisponiveis() {
  const { default: fetch } = await import('node-fetch');
  console.log('🔍 Testando API de KPIs Disponíveis...');
  
  const baseUrl = 'http://localhost:8888';
  
  // Teste 1: Verificar se a API está respondendo
  try {
    console.log('\n1. Testando endpoint /api/kpis/available...');
    const response = await fetch(`${baseUrl}/api/kpis/available`);
    console.log('Status:', response.status);
    const data = await response.json();
    console.log('Resposta sem parâmetros:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Erro no teste 1:', error.message);
  }
  
  // Teste 2: Com parâmetros válidos
  try {
    console.log('\n2. Testando com função e turno...');
    const funcao = 'Operador de Empilhadeira';
    const turno = 'Manhã';
    const url = `${baseUrl}/api/kpis/available?funcao=${encodeURIComponent(funcao)}&turno=${encodeURIComponent(turno)}`;
    console.log('URL:', url);
    
    const response = await fetch(url);
    console.log('Status:', response.status);
    const data = await response.json();
    console.log('Resposta com parâmetros:', JSON.stringify(data, null, 2));
    
    if (data.kpisAtingidos) {
      console.log('\n📊 KPIs encontrados:', data.kpisAtingidos.length);
      data.kpisAtingidos.forEach((kpi, index) => {
        console.log(`  ${index + 1}. ${kpi.nome_kpi} - Meta: ${kpi.valor_meta_kpi}`);
      });
    }
  } catch (error) {
    console.error('Erro no teste 2:', error.message);
  }
  
  // Teste 3: Verificar outras funções
  try {
    console.log('\n3. Testando outras funções disponíveis...');
    const functionsResponse = await fetch(`${baseUrl}/api/functions`);
    const functionsData = await functionsResponse.json();
    console.log('Funções disponíveis:', functionsData);
    
    // Testar com cada função
    for (const funcao of functionsData) {
      console.log(`\n   Testando função: ${funcao}`);
      const url = `${baseUrl}/api/kpis/available?funcao=${encodeURIComponent(funcao)}&turno=Manhã`;
      const response = await fetch(url);
      const data = await response.json();
      console.log(`   KPIs para ${funcao}:`, data.kpisAtingidos?.length || 0);
    }
  } catch (error) {
    console.error('Erro no teste 3:', error.message);
  }
  
  // Teste 4: Verificar logs do console
  console.log('\n4. Verificando se há logs de debug no servidor...');
  console.log('   (Verifique o terminal do servidor para logs de debug)');
}

testKPIsDisponiveis().catch(console.error);