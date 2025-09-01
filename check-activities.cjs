// Script para verificar atividades disponíveis e testar cálculo

async function checkActivities() {
  console.log('🔍 Verificando atividades disponíveis...');
  
  const { default: fetch } = await import('node-fetch');
  const BASE_URL = 'http://localhost:8888';
  
  try {
    // 1. Verificar atividades disponíveis
    console.log('1. 📋 Buscando atividades disponíveis...');
    const activitiesResponse = await fetch(`${BASE_URL}/api/activity-names`);
    
    if (activitiesResponse.ok) {
      const activitiesData = await activitiesResponse.json();
      console.log('✅ Atividades encontradas:', activitiesData);
      const activities = activitiesData.results || activitiesData;
      
      if (activities.length > 0) {
        // 2. Testar cálculo com uma atividade válida
        const testActivity = activities[0].nome_atividade || activities[0];
        console.log(`\n2. 🧪 Testando cálculo com atividade: ${testActivity}`);
        
        const testPayload = {
          funcao: 'Ajudante de Armazém',
          turno: 'Manhã',
          data_lancamento: '2025-01-27',
          nome_atividade: testActivity,
          quantidade_produzida: 100,
          tempo_horas: 8,
          kpis_atingidos: ['EFC'], // Vamos testar com este KPI
          input_adicional: 0
        };
        
        console.log('📤 Payload:', JSON.stringify(testPayload, null, 2));
        
        const calcResponse = await fetch(`${BASE_URL}/api/calculate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(testPayload)
        });
        
        if (calcResponse.ok) {
          const result = await calcResponse.json();
          console.log('✅ Resultado:', JSON.stringify(result, null, 2));
          
          const data = result.data || result;
          console.log('\n📊 Análise:');
          console.log(`   💰 Subtotal Atividades: R$ ${data.subtotalAtividades || 0}`);
          console.log(`   🎯 Bonus KPIs: R$ ${data.bonusKpis || 0}`);
          console.log(`   💵 Total: R$ ${data.remuneracaoTotal || 0}`);
          console.log(`   📝 KPIs: ${JSON.stringify(data.kpisAtingidos || [])}`);
          
          // Verificar se há problema no cálculo
          if (data.bonusKpis > 0 && (!data.kpisAtingidos || data.kpisAtingidos.length === 0)) {
            console.log('\n❌ PROBLEMA: Bonus > 0 mas nenhum KPI registrado!');
          } else if (data.bonusKpis === 0 && data.kpisAtingidos && data.kpisAtingidos.length > 0) {
            console.log('\n❌ PROBLEMA: KPIs registrados mas bonus = 0!');
          } else {
            console.log('\n✅ Cálculo parece estar funcionando');
          }
        } else {
          const errorText = await calcResponse.text();
          console.log('❌ Erro no cálculo:', errorText);
        }
      }
    } else {
      console.log('❌ Erro ao buscar atividades');
    }
    
    // 3. Verificar KPIs disponíveis
    console.log('\n3. 🎯 Verificando KPIs disponíveis...');
    const kpisResponse = await fetch(`${BASE_URL}/api/kpis/available?funcao=Ajudante de Armazém&turno=Manhã`);
    
    if (kpisResponse.ok) {
      const kpisData = await kpisResponse.json();
      console.log('📋 KPIs disponíveis:', JSON.stringify(kpisData, null, 2));
      
      const kpisArray = kpisData.kpisAtingidos || [];
      if (kpisArray.length > 0) {
        console.log('\n📊 KPIs encontrados:');
        kpisArray.forEach((kpi, index) => {
          console.log(`   ${index + 1}. ${kpi.nome_kpi} - Peso: R$ ${kpi.peso_kpi}`);
        });
        
        // Testar com um KPI válido
        const validKpi = kpisArray[0];
        console.log(`\n4. 🧪 Testando com KPI válido: ${validKpi.nome_kpi}`);
        
        // Buscar atividades novamente para garantir que temos os dados
        const activitiesResponse2 = await fetch(`${BASE_URL}/api/activity-names`);
        let activityName = 'Prod Amarração'; // fallback
        
        if (activitiesResponse2.ok) {
          const activitiesData2 = await activitiesResponse2.json();
          const activities2 = activitiesData2.results || activitiesData2;
          if (activities2.length > 0) {
            activityName = activities2[0].nome_atividade || activities2[0];
          }
        }
        
        const testPayload2 = {
          funcao: 'Ajudante de Armazém',
          turno: 'Manhã',
          data_lancamento: '2025-01-27',
          nome_atividade: activityName,
          quantidade_produzida: 100,
          tempo_horas: 8,
          kpis_atingidos: [validKpi.nome_kpi],
          input_adicional: 0
        };
        
        const calcResponse2 = await fetch(`${BASE_URL}/api/calculate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(testPayload2)
        });
        
        if (calcResponse2.ok) {
          const result2 = await calcResponse2.json();
          const data2 = result2.data || result2;
          
          console.log('\n📊 Resultado com KPI válido:');
          console.log(`   🎯 KPI: ${validKpi.nome_kpi}`);
          console.log(`   💰 Peso esperado: R$ ${validKpi.peso_kpi}`);
          console.log(`   📊 Bonus calculado: R$ ${data2.bonusKpis || 0}`);
          console.log(`   💵 Total: R$ ${data2.remuneracaoTotal || 0}`);
          
          const expected = parseFloat(validKpi.peso_kpi);
          const actual = parseFloat(data2.bonusKpis || 0);
          
          if (Math.abs(expected - actual) < 0.01) {
            console.log('   ✅ Cálculo CORRETO!');
          } else {
            console.log('   ❌ Cálculo INCORRETO!');
            console.log(`   📈 Diferença: R$ ${Math.abs(expected - actual)}`);
          }
        }
      } else {
        console.log('❌ Nenhum KPI disponível para esta função/turno');
      }
    } else {
      console.log('❌ Erro ao buscar KPIs disponíveis');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

checkActivities();