// Script para testar e corrigir o problema de cálculo dos KPIs

async function testKPICalculation() {
  console.log('🔧 TESTE E CORREÇÃO DO CÁLCULO DE KPIs');
  console.log('=====================================\n');
  
  const { default: fetch } = await import('node-fetch');
  const BASE_URL = 'http://localhost:8888';
  
  try {
    // 1. Testar cenário atual que está dando erro
    console.log('1. 🧪 Testando cenário atual (que está incorreto)...');
    
    const testPayload = {
      funcao: 'Ajudante de Armazém',
      turno: 'Manhã',
      data_lancamento: '2025-01-27',
      nome_atividade: 'Picking',
      quantidade_produzida: 100,
      tempo_horas: 8,
      kpis_atingidos: ['EFC'], // 1 KPI selecionado
      input_adicional: 0
    };
    
    console.log('📤 Payload de teste:', JSON.stringify(testPayload, null, 2));
    
    const response = await fetch(`${BASE_URL}/api/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testPayload)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ Erro na API:', errorText);
      return;
    }
    
    const result = await response.json();
    console.log('📊 Resultado atual:', JSON.stringify(result, null, 2));
    
    // Analisar o resultado
    const data = result.data || result;
    console.log('\n📋 Análise do resultado:');
    console.log(`   💰 Subtotal Atividades: R$ ${data.subtotalAtividades || 0}`);
    console.log(`   🎯 Bonus KPIs: R$ ${data.bonusKpis || 0}`);
    console.log(`   💵 Remuneração Total: R$ ${data.remuneracaoTotal || 0}`);
    console.log(`   📝 KPIs Atingidos: ${JSON.stringify(data.kpisAtingidos || [])}`);
    
    // 2. Verificar KPIs disponíveis para esta função/turno
    console.log('\n2. 🔍 Verificando KPIs disponíveis...');
    
    const kpisResponse = await fetch(`${BASE_URL}/api/kpis/available?funcao=${encodeURIComponent(testPayload.funcao)}&turno=${encodeURIComponent(testPayload.turno)}`);
    
    if (kpisResponse.ok) {
      const kpisData = await kpisResponse.json();
      console.log('📋 KPIs disponíveis:', JSON.stringify(kpisData, null, 2));
      
      // Verificar se o KPI 'EFC' existe
      const kpisArray = kpisData.kpisAtingidos || [];
      const efcKpi = kpisArray.find(kpi => kpi.nome_kpi === 'EFC');
      
      if (efcKpi) {
        console.log(`\n✅ KPI 'EFC' encontrado:`);
        console.log(`   📊 Nome: ${efcKpi.nome_kpi}`);
        console.log(`   🎯 Meta: ${efcKpi.valor_meta_kpi}`);
        console.log(`   💰 Peso: R$ ${efcKpi.peso_kpi}`);
        console.log(`   🏢 Função: ${efcKpi.funcao_kpi}`);
        console.log(`   ⏰ Turno: ${efcKpi.turno_kpi}`);
        
        // Verificar se o valor calculado está correto
        const expectedBonus = parseFloat(efcKpi.peso_kpi);
        const actualBonus = parseFloat(data.bonusKpis || 0);
        
        console.log(`\n🔍 Verificação do cálculo:`);
        console.log(`   📈 Valor esperado: R$ ${expectedBonus}`);
        console.log(`   📊 Valor calculado: R$ ${actualBonus}`);
        console.log(`   ✅ Correto: ${expectedBonus === actualBonus ? 'SIM' : 'NÃO'}`);
        
        if (expectedBonus !== actualBonus) {
          console.log(`\n❌ PROBLEMA IDENTIFICADO:`);
          console.log(`   O valor dos KPIs está sendo calculado incorretamente!`);
          console.log(`   Esperado: R$ ${expectedBonus}`);
          console.log(`   Atual: R$ ${actualBonus}`);
          console.log(`   Diferença: R$ ${Math.abs(expectedBonus - actualBonus)}`);
        }
      } else {
        console.log(`\n❌ KPI 'EFC' não encontrado nos KPIs disponíveis!`);
        console.log('   Isso pode explicar por que o valor está incorreto.');
      }
    } else {
      console.log('❌ Erro ao buscar KPIs disponíveis');
    }
    
    // 3. Testar com KPI que sabemos que existe
    console.log('\n3. 🧪 Testando com KPI conhecido...');
    
    // Primeiro, vamos listar todos os KPIs para encontrar um válido
    const allKpisResponse = await fetch(`${BASE_URL}/api/kpis`);
    if (allKpisResponse.ok) {
      const allKpisData = await allKpisResponse.json();
      const allKpis = allKpisData.kpisAtingidos || [];
      
      // Filtrar KPIs para Ajudante de Armazém
      const ajudanteKpis = allKpis.filter(kpi => 
        kpi.funcao_kpi === 'Ajudante de Armazém' && 
        (kpi.turno_kpi === 'Manhã' || kpi.turno_kpi === 'Geral')
      );
      
      if (ajudanteKpis.length > 0) {
        const testKpi = ajudanteKpis[0];
        console.log(`\n🎯 Testando com KPI válido: ${testKpi.nome_kpi}`);
        
        const testPayload2 = {
          ...testPayload,
          kpis_atingidos: [testKpi.nome_kpi]
        };
        
        const response2 = await fetch(`${BASE_URL}/api/calculate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(testPayload2)
        });
        
        if (response2.ok) {
          const result2 = await response2.json();
          const data2 = result2.data || result2;
          
          console.log(`\n📊 Resultado com KPI válido:`);
          console.log(`   🎯 KPI testado: ${testKpi.nome_kpi}`);
          console.log(`   💰 Peso do KPI: R$ ${testKpi.peso_kpi}`);
          console.log(`   📊 Bonus calculado: R$ ${data2.bonusKpis || 0}`);
          console.log(`   💵 Total: R$ ${data2.remuneracaoTotal || 0}`);
          
          const expectedBonus2 = parseFloat(testKpi.peso_kpi);
          const actualBonus2 = parseFloat(data2.bonusKpis || 0);
          
          if (expectedBonus2 === actualBonus2) {
            console.log(`   ✅ Cálculo CORRETO!`);
          } else {
            console.log(`   ❌ Cálculo INCORRETO!`);
            console.log(`   📈 Esperado: R$ ${expectedBonus2}`);
            console.log(`   📊 Atual: R$ ${actualBonus2}`);
          }
        }
      } else {
        console.log('❌ Nenhum KPI encontrado para Ajudante de Armazém');
      }
    }
    
    // 4. Diagnóstico final
    console.log('\n4. 🔍 DIAGNÓSTICO FINAL');
    console.log('========================');
    
    if (data.bonusKpis > 0 && data.kpisAtingidos && data.kpisAtingidos.length === 0) {
      console.log('❌ PROBLEMA: Bonus de KPIs > 0 mas nenhum KPI foi registrado como atingido');
      console.log('   Isso indica um problema na lógica de cálculo dos KPIs');
    } else if (data.bonusKpis === 0 && data.kpisAtingidos && data.kpisAtingidos.length > 0) {
      console.log('❌ PROBLEMA: KPIs registrados como atingidos mas bonus = 0');
      console.log('   Isso indica um problema na busca ou cálculo do peso dos KPIs');
    } else if (data.bonusKpis > 0 && data.kpisAtingidos && data.kpisAtingidos.length > 0) {
      console.log('✅ KPIs sendo calculados corretamente');
    } else {
      console.log('⚠️  Nenhum KPI foi selecionado ou calculado');
    }
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
  }
}

testKPICalculation();