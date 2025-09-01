// Script para testar o cenário específico da imagem: sem KPIs selecionados

async function testZeroKPIs() {
  console.log('🔍 Testando cenário sem KPIs selecionados...');
  
  const { default: fetch } = await import('node-fetch');
  const BASE_URL = 'http://localhost:8888';
  
  try {
    // Cenário 1: Array vazio de KPIs
    console.log('\n1. 🧪 Testando com array vazio de KPIs...');
    const testPayload1 = {
      funcao: 'Ajudante de Armazém',
      turno: 'Manhã',
      data_lancamento: '2025-01-27',
      nome_atividade: 'Prod Amarração',
      quantidade_produzida: 100,
      tempo_horas: 8,
      kpis_atingidos: [], // Array vazio
      input_adicional: 0
    };
    
    console.log('📤 Payload:', JSON.stringify(testPayload1, null, 2));
    
    const response1 = await fetch(`${BASE_URL}/api/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testPayload1)
    });
    
    if (response1.ok) {
      const result1 = await response1.json();
      const data1 = result1.data || result1;
      
      console.log('📊 Resultado:');
      console.log(`   💰 Subtotal Atividades: R$ ${data1.subtotalAtividades || 0}`);
      console.log(`   🎯 Bonus KPIs: R$ ${data1.bonusKpis || 0}`);
      console.log(`   💵 Total: R$ ${data1.remuneracaoTotal || 0}`);
      console.log(`   📝 KPIs: ${JSON.stringify(data1.kpisAtingidos || [])}`);
      
      if (data1.bonusKpis > 0) {
        console.log('   ❌ PROBLEMA: Bonus > 0 sem KPIs selecionados!');
      } else {
        console.log('   ✅ Correto: Bonus = 0 sem KPIs');
      }
    } else {
      const errorText = await response1.text();
      console.log('❌ Erro:', errorText);
    }
    
    // Cenário 2: Sem campo kpis_atingidos
    console.log('\n2. 🧪 Testando sem campo kpis_atingidos...');
    const testPayload2 = {
      funcao: 'Ajudante de Armazém',
      turno: 'Manhã',
      data_lancamento: '2025-01-27',
      nome_atividade: 'Prod Amarração',
      quantidade_produzida: 100,
      tempo_horas: 8,
      // kpis_atingidos: removido propositalmente
      input_adicional: 0
    };
    
    console.log('📤 Payload:', JSON.stringify(testPayload2, null, 2));
    
    const response2 = await fetch(`${BASE_URL}/api/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testPayload2)
    });
    
    if (response2.ok) {
      const result2 = await response2.json();
      const data2 = result2.data || result2;
      
      console.log('📊 Resultado:');
      console.log(`   💰 Subtotal Atividades: R$ ${data2.subtotalAtividades || 0}`);
      console.log(`   🎯 Bonus KPIs: R$ ${data2.bonusKpis || 0}`);
      console.log(`   💵 Total: R$ ${data2.remuneracaoTotal || 0}`);
      console.log(`   📝 KPIs: ${JSON.stringify(data2.kpisAtingidos || [])}`);
      
      if (data2.bonusKpis > 0) {
        console.log('   ❌ PROBLEMA: Bonus > 0 sem campo KPIs!');
      } else {
        console.log('   ✅ Correto: Bonus = 0 sem campo KPIs');
      }
    } else {
      const errorText = await response2.text();
      console.log('❌ Erro:', errorText);
    }
    
    // Cenário 3: KPI inválido
    console.log('\n3. 🧪 Testando com KPI inválido...');
    const testPayload3 = {
      funcao: 'Ajudante de Armazém',
      turno: 'Manhã',
      data_lancamento: '2025-01-27',
      nome_atividade: 'Prod Amarração',
      quantidade_produzida: 100,
      tempo_horas: 8,
      kpis_atingidos: ['KPI_INEXISTENTE'], // KPI que não existe
      input_adicional: 0
    };
    
    console.log('📤 Payload:', JSON.stringify(testPayload3, null, 2));
    
    const response3 = await fetch(`${BASE_URL}/api/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testPayload3)
    });
    
    if (response3.ok) {
      const result3 = await response3.json();
      const data3 = result3.data || result3;
      
      console.log('📊 Resultado:');
      console.log(`   💰 Subtotal Atividades: R$ ${data3.subtotalAtividades || 0}`);
      console.log(`   🎯 Bonus KPIs: R$ ${data3.bonusKpis || 0}`);
      console.log(`   💵 Total: R$ ${data3.remuneracaoTotal || 0}`);
      console.log(`   📝 KPIs: ${JSON.stringify(data3.kpisAtingidos || [])}`);
      
      if (data3.bonusKpis > 0) {
        console.log('   ❌ PROBLEMA: Bonus > 0 com KPI inválido!');
      } else {
        console.log('   ✅ Correto: Bonus = 0 com KPI inválido');
      }
    } else {
      const errorText = await response3.text();
      console.log('❌ Erro:', errorText);
    }
    
    // Cenário 4: Reproduzir exatamente o que aparece na imagem
    console.log('\n4. 🧪 Reproduzindo cenário da imagem...');
    console.log('   (Baseado na imagem: 1 KPI atingido mas valor deveria ser R$ 0,00)');
    
    const testPayload4 = {
      funcao: 'Ajudante de Armazém',
      turno: 'Manhã',
      data_lancamento: '2025-01-27',
      nome_atividade: 'Prod Amarração',
      quantidade_produzida: 100,
      tempo_horas: 8,
      kpis_atingidos: ['EFC'], // 1 KPI como na imagem
      input_adicional: 0
    };
    
    console.log('📤 Payload:', JSON.stringify(testPayload4, null, 2));
    
    const response4 = await fetch(`${BASE_URL}/api/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testPayload4)
    });
    
    if (response4.ok) {
      const result4 = await response4.json();
      const data4 = result4.data || result4;
      
      console.log('📊 Resultado (cenário da imagem):');
      console.log(`   💰 Subtotal Atividades: R$ ${data4.subtotalAtividades || 0}`);
      console.log(`   🎯 Bonus KPIs: R$ ${data4.bonusKpis || 0}`);
      console.log(`   💵 Total: R$ ${data4.remuneracaoTotal || 0}`);
      console.log(`   📝 KPIs: ${JSON.stringify(data4.kpisAtingidos || [])}`);
      
      console.log('\n🔍 Análise do problema:');
      if (data4.bonusKpis === 3 && data4.kpisAtingidos && data4.kpisAtingidos.includes('EFC')) {
        console.log('   ✅ API está calculando corretamente: KPI EFC = R$ 3,00');
        console.log('   🤔 O problema pode estar na interface ou na interpretação do usuário');
        console.log('   💡 Verificar se o usuário esperava que o KPI não fosse atingido');
      } else {
        console.log('   ❌ Há um problema no cálculo da API');
      }
    } else {
      const errorText = await response4.text();
      console.log('❌ Erro:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

testZeroKPIs();