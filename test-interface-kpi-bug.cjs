// Script para testar o bug específico da interface de KPIs

async function testInterfaceKPIBug() {
  console.log('🐛 TESTE DO BUG DA INTERFACE DE KPIs');
  console.log('===================================\n');
  
  const { default: fetch } = await import('node-fetch');
  const BASE_URL = 'http://localhost:8888';
  
  try {
    // Cenário 1: Simular exatamente o que a interface envia quando não há KPIs selecionados
    console.log('1. 🧪 Testando cenário: NENHUM KPI selecionado na interface...');
    
    // Este é o payload que a interface deveria enviar quando selectedKPIs = []
    const payloadSemKPIs = {
      funcao: 'Ajudante de Armazém',
      turno: 'Manhã',
      data_lancamento: '2025-01-27',
      nome_atividade: 'Prod Amarração',
      quantidade_produzida: 100,
      tempo_horas: 8,
      kpis_atingidos: [], // Array vazio - nenhum KPI selecionado
      input_adicional: 0
    };
    
    console.log('📤 Payload (sem KPIs):', JSON.stringify(payloadSemKPIs, null, 2));
    
    const response1 = await fetch(`${BASE_URL}/api/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payloadSemKPIs)
    });
    
    if (response1.ok) {
      const result1 = await response1.json();
      const data1 = result1.data || result1;
      
      console.log('📊 Resultado (sem KPIs):');
      console.log(`   💰 Subtotal Atividades: R$ ${data1.subtotalAtividades || 0}`);
      console.log(`   🎯 Bonus KPIs: R$ ${data1.bonusKpis || 0}`);
      console.log(`   💵 Total: R$ ${data1.remuneracaoTotal || 0}`);
      console.log(`   📝 KPIs retornados: ${JSON.stringify(data1.kpisAtingidos || [])}`);
      
      if (data1.bonusKpis > 0) {
        console.log('   ❌ BUG CONFIRMADO: Bonus > 0 sem KPIs selecionados!');
        console.log('   🔍 Investigando possíveis causas...');
        
        // Verificar se há KPIs sendo retornados mesmo sem enviar
        if (data1.kpisAtingidos && data1.kpisAtingidos.length > 0) {
          console.log('   🚨 CAUSA: API está retornando KPIs mesmo sem enviar!');
          console.log(`   📋 KPIs fantasma: ${JSON.stringify(data1.kpisAtingidos)}`);
        } else {
          console.log('   🤔 CAUSA: Bonus calculado sem KPIs registrados');
        }
      } else {
        console.log('   ✅ Comportamento correto: Bonus = 0 sem KPIs');
      }
    } else {
      const errorText = await response1.text();
      console.log('❌ Erro:', errorText);
    }
    
    // Cenário 2: Testar se há algum KPI sendo enviado por padrão
    console.log('\n2. 🧪 Testando possível KPI padrão...');
    
    // Verificar se há algum KPI que está sendo considerado "sempre ativo"
    const kpisResponse = await fetch(`${BASE_URL}/api/kpis/available?funcao=Ajudante de Armazém&turno=Manhã`);
    
    if (kpisResponse.ok) {
      const kpisData = await kpisResponse.json();
      const kpisArray = kpisData.kpisAtingidos || [];
      
      console.log('📋 KPIs disponíveis para Ajudante de Armazém/Manhã:');
      kpisArray.forEach((kpi, index) => {
        console.log(`   ${index + 1}. ${kpi.nome_kpi} - Peso: R$ ${kpi.peso_kpi} - Status: ${kpi.status_ativo ? 'Ativo' : 'Inativo'}`);
      });
      
      // Verificar se algum KPI tem configuração especial
      const kpisSuspeitos = kpisArray.filter(kpi => 
        kpi.turno_kpi === 'Geral' || 
        kpi.valor_meta_kpi === 0 ||
        kpi.nome_kpi.toLowerCase().includes('padrão') ||
        kpi.nome_kpi.toLowerCase().includes('base')
      );
      
      if (kpisSuspeitos.length > 0) {
        console.log('\n🚨 KPIs suspeitos encontrados:');
        kpisSuspeitos.forEach(kpi => {
          console.log(`   - ${kpi.nome_kpi}: Turno=${kpi.turno_kpi}, Meta=${kpi.valor_meta_kpi}`);
        });
      }
    }
    
    // Cenário 3: Testar com dados exatos da imagem do usuário
    console.log('\n3. 🧪 Reproduzindo cenário EXATO da imagem...');
    console.log('   (Baseado na imagem: Valor KPIs = R$ 3,00, mas deveria ser R$ 0,00)');
    
    // Tentar reproduzir exatamente o que está acontecendo
    const payloadImagem = {
      funcao: 'Ajudante de Armazém',
      turno: 'Manhã',
      data_lancamento: '2025-01-27',
      nome_atividade: 'Prod Amarração', // Atividade comum
      quantidade_produzida: 100,
      tempo_horas: 8,
      kpis_atingidos: ['EFC'], // 1 KPI como mostrado na imagem
      input_adicional: 0
    };
    
    console.log('📤 Payload (cenário da imagem):', JSON.stringify(payloadImagem, null, 2));
    
    const response3 = await fetch(`${BASE_URL}/api/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payloadImagem)
    });
    
    if (response3.ok) {
      const result3 = await response3.json();
      const data3 = result3.data || result3;
      
      console.log('📊 Resultado (cenário da imagem):');
      console.log(`   💰 Valor Bruto Atividades: R$ ${data3.subtotalAtividades || 0}`);
      console.log(`   🎯 Valor KPIs: R$ ${data3.bonusKpis || 0}`);
      console.log(`   💵 Total Estimado do Dia: R$ ${data3.remuneracaoTotal || 0}`);
      console.log(`   📝 KPIs Atingidos: ${data3.kpisAtingidos ? data3.kpisAtingidos.length : 0}`);
      
      console.log('\n🔍 Análise do problema:');
      
      if (data3.bonusKpis === 3 && data3.kpisAtingidos && data3.kpisAtingidos.includes('EFC')) {
        console.log('   ✅ API está funcionando CORRETAMENTE!');
        console.log('   📋 KPI "EFC" foi enviado e tem peso R$ 3,00');
        console.log('   🤔 POSSÍVEIS CAUSAS DO PROBLEMA:');
        console.log('      1. Usuário não percebeu que selecionou o KPI "EFC"');
        console.log('      2. Interface está selecionando KPI automaticamente');
        console.log('      3. Usuário esperava que o KPI não fosse atingido (meta não alcançada)');
        console.log('      4. Há confusão sobre quando o KPI deve ser considerado "atingido"');
        
        console.log('\n💡 RECOMENDAÇÕES:');
        console.log('   1. Verificar se a interface está auto-selecionando KPIs');
        console.log('   2. Adicionar validação de meta antes de considerar KPI atingido');
        console.log('   3. Melhorar feedback visual na seleção de KPIs');
        console.log('   4. Adicionar confirmação antes de calcular com KPIs selecionados');
        
      } else {
        console.log('   ❌ Há um problema real no cálculo!');
      }
    }
    
    // Cenário 4: Verificar se há problema na validação de metas
    console.log('\n4. 🧪 Testando validação de metas dos KPIs...');
    
    // O problema pode ser que o sistema está considerando KPIs "atingidos"
    // mesmo quando a meta não foi alcançada
    console.log('   🎯 Verificando se KPIs deveriam ser validados contra metas...');
    
    const payloadComMeta = {
      funcao: 'Ajudante de Armazém',
      turno: 'Manhã',
      data_lancamento: '2025-01-27',
      nome_atividade: 'Prod Amarração',
      quantidade_produzida: 50, // Quantidade baixa - pode não atingir meta
      tempo_horas: 8,
      kpis_atingidos: ['EFC'], // KPI selecionado
      input_adicional: 0
    };
    
    console.log('📤 Payload (baixa produtividade):', JSON.stringify(payloadComMeta, null, 2));
    
    const response4 = await fetch(`${BASE_URL}/api/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payloadComMeta)
    });
    
    if (response4.ok) {
      const result4 = await response4.json();
      const data4 = result4.data || result4;
      
      console.log('📊 Resultado (baixa produtividade):');
      console.log(`   📈 Produtividade: ${data4.produtividadeAlcancada || 'N/A'}`);
      console.log(`   🎯 Nível: ${data4.nivelAtingido || 'N/A'}`);
      console.log(`   💰 Bonus KPIs: R$ ${data4.bonusKpis || 0}`);
      console.log(`   📝 KPIs: ${JSON.stringify(data4.kpisAtingidos || [])}`);
      
      if (data4.bonusKpis > 0) {
        console.log('   🚨 PROBLEMA: KPI pago mesmo com baixa produtividade!');
        console.log('   💡 SOLUÇÃO: Implementar validação de meta antes de pagar KPI');
      } else {
        console.log('   ✅ Correto: KPI não pago com baixa produtividade');
      }
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

testInterfaceKPIBug();