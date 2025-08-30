// Using native fetch (Node.js 18+)

// Test data for multiple activities
const testData = {
  funcao: 'Ajudante de Armazém',
  turno: 'Manhã',
  multiple_activities: [
    {
      nome_atividade: 'Prod Repack',
      quantidade_produzida: 150,
      tempo_horas: 6
    },
    {
      nome_atividade: 'Prod Devolução',
      quantidade_produzida: 800,
      tempo_horas: 3
    }
  ],
  kpis_atingidos: ['EFC', 'Ressuprimento'],
  input_adicional: 0
};

async function testMultipleActivitiesAPI() {
  try {
    console.log('🧪 Testando API com múltiplas atividades...');
    console.log('📊 Dados de teste:', JSON.stringify(testData, null, 2));
    
    const response = await fetch('http://localhost:5173/api/calculate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });
    
    const result = await response.json();
    
    console.log('\n📋 Resultado da API:');
    console.log(JSON.stringify(result, null, 2));
    
    if (result.data) {
      const { data } = result;
      
      console.log('\n✅ Verificações:');
      console.log(`- Subtotal Atividades: R$ ${data.subtotalAtividades?.toFixed(2) || '0.00'}`);
      console.log(`- Valor Bruto Atividades: R$ ${data.valorBrutoAtividades?.toFixed(2) || 'NÃO ENCONTRADO'}`);
      console.log(`- Bonus KPIs: R$ ${data.bonusKpis?.toFixed(2) || '0.00'}`);
      console.log(`- Remuneração Total: R$ ${data.remuneracaoTotal?.toFixed(2) || '0.00'}`);
      
      if (data.atividadesDetalhes) {
        console.log('\n📝 Detalhes das Atividades:');
        data.atividadesDetalhes.forEach((detalhe, index) => {
          console.log(`  ${index + 1}. ${detalhe}`);
        });
      }
      
      // Verificar se valor_bruto_atividades está presente
      if (data.valorBrutoAtividades) {
        console.log('\n✅ SUCESSO: valor_bruto_atividades está sendo retornado!');
        
        // Verificar se a regra de 50% está sendo aplicada
        const expectedSubtotal = data.valorBrutoAtividades / 2;
        const actualSubtotal = data.subtotalAtividades - (data.bonusKpis || 0);
        
        if (Math.abs(expectedSubtotal - actualSubtotal) < 0.01) {
          console.log('✅ SUCESSO: Regra de 50% aplicada corretamente!');
        } else {
          console.log('❌ ERRO: Regra de 50% não está sendo aplicada corretamente');
          console.log(`  Esperado: ${expectedSubtotal.toFixed(2)}`);
          console.log(`  Atual: ${actualSubtotal.toFixed(2)}`);
        }
      } else {
        console.log('❌ ERRO: valor_bruto_atividades não está sendo retornado!');
      }
    } else {
      console.log('❌ ERRO na API:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Erro ao testar API:', error.message);
  }
}

// Execute the test
testMultipleActivitiesAPI();