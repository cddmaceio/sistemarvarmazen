const checkDatabaseData = async () => {
  const { default: fetch } = await import('node-fetch');
  
  const baseUrl = 'http://localhost:8888/.netlify/functions/api';
  
  console.log('Verificando dados no banco de dados...\n');
  
  // Verificar KPIs disponíveis
  console.log('=== VERIFICANDO KPIS DISPONÍVEIS ===');
  try {
    const kpisResponse = await fetch(`${baseUrl}/kpis`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (kpisResponse.ok) {
      const kpisData = await kpisResponse.json();
      console.log('KPIs encontrados:', JSON.stringify(kpisData, null, 2));
    } else {
      console.log('Status da resposta KPIs:', kpisResponse.status);
      const errorText = await kpisResponse.text();
      console.log('Erro ao buscar KPIs:', errorText);
    }
  } catch (error) {
    console.error('Erro na requisição de KPIs:', error.message);
  }
  
  // Verificar atividades disponíveis
  console.log('\n=== VERIFICANDO ATIVIDADES DISPONÍVEIS ===');
  try {
    const atividadesResponse = await fetch(`${baseUrl}/activities`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (atividadesResponse.ok) {
      const atividadesData = await atividadesResponse.json();
      console.log('Atividades encontradas:', JSON.stringify(atividadesData, null, 2));
    } else {
      console.log('Status da resposta Atividades:', atividadesResponse.status);
      const errorText = await atividadesResponse.text();
      console.log('Erro ao buscar atividades:', errorText);
    }
  } catch (error) {
    console.error('Erro na requisição de atividades:', error.message);
  }
  
  // Testar endpoint de debug se existir
  console.log('\n=== TESTANDO ENDPOINT DE DEBUG ===');
  try {
    const debugResponse = await fetch(`${baseUrl}/debug/kpis?funcao=Ajudante de Armazém&turno=Manhã`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (debugResponse.ok) {
      const debugData = await debugResponse.json();
      console.log('Debug KPIs:', JSON.stringify(debugData, null, 2));
    } else {
      console.log('Endpoint de debug não disponível ou erro:', debugResponse.status);
    }
  } catch (error) {
    console.log('Endpoint de debug não disponível');
  }
};

checkDatabaseData().catch(console.error);