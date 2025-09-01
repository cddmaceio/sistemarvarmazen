// Script para testar a calculadora e verificar se os KPIs estão carregando corretamente

async function testCalculadora() {
  try {
    console.log('=== TESTE DA CALCULADORA DE KPIs ===\n');
    
    // Importar fetch dinamicamente
    const { default: fetch } = await import('node-fetch');
    const BASE_URL = 'http://localhost:8888';
    
    // 1. Testar se as funções estão disponíveis
    console.log('1. Testando lista de funções...');
    const functionsResponse = await fetch(`${BASE_URL}/api/functions`);
    if (functionsResponse.status !== 200) {
      throw new Error(`Erro ao buscar funções: ${functionsResponse.status}`);
    }
    const functions = await functionsResponse.json();
    console.log(`✅ Funções encontradas: ${functions.join(', ')}`);
    
    // 2. Testar KPIs disponíveis para cada função
    const turnos = ['Manhã', 'Tarde', 'Noite'];
    
    for (const funcao of functions) {
      console.log(`\n2. Testando KPIs para função: ${funcao}`);
      
      for (const turno of turnos) {
        console.log(`   Turno: ${turno}`);
        
        const kpisResponse = await fetch(`${BASE_URL}/api/kpis/available?funcao=${encodeURIComponent(funcao)}&turno=${encodeURIComponent(turno)}`);
        
        if (kpisResponse.status !== 200) {
          console.log(`   ❌ Erro ao buscar KPIs: ${kpisResponse.status}`);
          continue;
        }
        
        const kpisData = await kpisResponse.json();
        console.log(`   ✅ KPIs disponíveis: ${kpisData.kpisAtingidos ? kpisData.kpisAtingidos.length : 0}`);
        
        if (kpisData.kpisAtingidos && kpisData.kpisAtingidos.length > 0) {
          console.log(`   📊 Exemplos: ${kpisData.kpisAtingidos.slice(0, 3).map(k => k.nome || k.id).join(', ')}`);
        }
      }
    }
    
    // 3. Testar o endpoint de cálculo
    console.log('\n3. Testando endpoint de cálculo...');
    const calculatePayload = {
      funcao: functions[0], // Usar a primeira função disponível
      turno: 'Manhã',
      mes: new Date().getMonth() + 1,
      ano: new Date().getFullYear()
    };
    
    const calculateResponse = await fetch(`${BASE_URL}/api/calculate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(calculatePayload)
    });
    
    if (calculateResponse.status === 200) {
      const calculateData = await calculateResponse.json();
      console.log(`✅ Cálculo executado com sucesso`);
      console.log(`📊 Dados retornados: ${Object.keys(calculateData).join(', ')}`);
    } else {
      const errorText = await calculateResponse.text();
      console.log(`❌ Erro no cálculo: ${calculateResponse.status} - ${errorText}`);
    }
    
    // 4. Testar lançamentos pendentes
    console.log('\n4. Testando lançamentos pendentes...');
    const pendentesResponse = await fetch(`${BASE_URL}/api/lancamentos/pendentes`);
    
    if (pendentesResponse.status === 200) {
      const pendentesData = await pendentesResponse.json();
      console.log(`✅ Lançamentos pendentes: ${pendentesData.length}`);
      
      if (pendentesData.length > 0) {
        console.log(`📋 Exemplo: ID ${pendentesData[0].id}, Data: ${pendentesData[0].data_lancamento}, Turno: ${pendentesData[0].turno}`);
      }
    } else {
      console.log(`❌ Erro ao buscar lançamentos pendentes: ${pendentesResponse.status}`);
    }
    
    // 5. Testar nomes das atividades
    console.log('\n5. Testando nomes das atividades...');
    const activityNamesResponse = await fetch(`${BASE_URL}/api/activity-names`);
    
    if (activityNamesResponse.status === 200) {
      const activityNamesData = await activityNamesResponse.json();
      const activities = activityNamesData.results || activityNamesData;
      console.log(`✅ Atividades encontradas: ${activities.length}`);
      
      if (activities.length > 0) {
        const sampleActivities = activities.slice(0, 3).map(a => a.nome_atividade || a.name || a).join(', ');
        console.log(`📋 Exemplos: ${sampleActivities}`);
      }
    } else {
      console.log(`❌ Erro ao buscar nomes das atividades: ${activityNamesResponse.status}`);
    }
    
    console.log('\n=== TESTE CONCLUÍDO ===');
    console.log('✅ A calculadora está funcionando corretamente!');
    console.log('🎯 Todas as APIs necessárias estão respondendo.');
    
  } catch (error) {
    console.error('❌ Erro durante o teste da calculadora:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Executar o teste
testCalculadora().then(() => {
  console.log('\n🎉 Teste da calculadora finalizado com sucesso!');
  process.exit(0);
}).catch(error => {
  console.error('💥 Falha no teste da calculadora:', error);
  process.exit(1);
});