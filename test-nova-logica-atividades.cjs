// Teste da nova lógica de cálculo das atividades
// Fórmula: quantidade_produzida * valor_atividade / 2 + KPIs

async function testarNovaLogicaAtividades() {
  const { default: fetch } = await import('node-fetch');
  console.log('🧪 Testando Nova Lógica de Cálculo das Atividades');
  console.log('=' .repeat(60));
  
  const baseUrl = 'http://localhost:8888/.netlify/functions/api';
  
  // Teste 1: Atividade única com KPIs
  console.log('\n📋 Teste 1: Atividade única + 2 KPIs');
  const teste1 = {
    funcao: 'Ajudante de Armazém',
    turno: 'Manhã',
    nome_atividade: 'Prod Amarração',
    quantidade_produzida: 100, // 100 pallets
    tempo_horas: 8,
    kpis_atingidos: ['Ressuprimento', 'EFC']
  };
  
  try {
    const response1 = await fetch(`${baseUrl}/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(teste1)
    });
    
    const result1 = await response1.json();
    
    if (result1.data) {
      console.log('✅ Resultado do Teste 1:');
      console.log(`   Quantidade Produzida: ${teste1.quantidade_produzida}`);
      console.log(`   Valor Bruto Atividades: R$ ${result1.data.valorBrutoAtividades?.toFixed(2) || 'N/A'}`);
      console.log(`   Subtotal Atividades (50%): R$ ${result1.data.subtotalAtividades.toFixed(2)}`);
      console.log(`   Bonus KPIs: R$ ${result1.data.bonusKpis.toFixed(2)}`);
      console.log(`   Total Final: R$ ${result1.data.remuneracaoTotal.toFixed(2)}`);
      
      // Validação da fórmula
      // Produtividade: 100 pallets / 8h = 12.5 plt/h
      // Nível atingido: Nível 2 (12 plt/h) com valor_atividade = 0.240
      const produtividade = teste1.quantidade_produzida / teste1.tempo_horas; // 12.5 plt/h
      const valorAtividadeEsperado = 0.240; // Nível 2 para 12.5 plt/h
      const valorBrutoEsperado = teste1.quantidade_produzida * valorAtividadeEsperado;
      const subtotalEsperado = valorBrutoEsperado / 2;
      const kpisEsperado = 6.00; // 2 KPIs * R$ 3,00
      const totalEsperado = subtotalEsperado + kpisEsperado;
      
      console.log('\n🔍 Validação da Fórmula:');
      console.log(`   Produtividade: ${teste1.quantidade_produzida} plt / ${teste1.tempo_horas}h = ${produtividade.toFixed(1)} plt/h`);
      console.log(`   Nível Atingido: Nível 2 (valor_atividade = ${valorAtividadeEsperado})`);
      console.log(`   Valor Bruto Esperado: ${teste1.quantidade_produzida} * ${valorAtividadeEsperado} = R$ ${valorBrutoEsperado.toFixed(2)}`);
      console.log(`   Subtotal Esperado: R$ ${valorBrutoEsperado.toFixed(2)} / 2 = R$ ${subtotalEsperado.toFixed(2)}`);
      console.log(`   KPIs Esperado: R$ ${kpisEsperado.toFixed(2)}`);
      console.log(`   Total Esperado: R$ ${subtotalEsperado.toFixed(2)} + R$ ${kpisEsperado.toFixed(2)} = R$ ${totalEsperado.toFixed(2)}`);
      
      const subtotalCorreto = Math.abs(result1.data.subtotalAtividades - subtotalEsperado) < 0.01;
      const kpisCorreto = Math.abs(result1.data.bonusKpis - kpisEsperado) < 0.01;
      
      if (subtotalCorreto && kpisCorreto) {
        console.log('✅ Fórmula aplicada corretamente!');
      } else {
        console.log('❌ Erro na aplicação da fórmula!');
        if (!subtotalCorreto) console.log(`   Subtotal incorreto: esperado R$ ${subtotalEsperado.toFixed(2)}, obtido R$ ${result1.data.subtotalAtividades.toFixed(2)}`);
        if (!kpisCorreto) console.log(`   KPIs incorreto: esperado R$ ${kpisEsperado.toFixed(2)}, obtido R$ ${result1.data.bonusKpis.toFixed(2)}`);
      }
    } else {
      console.log('❌ Erro no Teste 1:', result1.error);
    }
  } catch (error) {
    console.log('❌ Erro de conexão no Teste 1:', error.message);
  }
  
  // Teste 2: Atividades múltiplas
  console.log('\n📋 Teste 2: Atividades múltiplas + 1 KPI');
  const teste2 = {
    funcao: 'Ajudante de Armazém',
    turno: 'Tarde',
    multiple_activities: [
      {
        nome_atividade: 'Prod Amarração',
        quantidade_produzida: 50,
        tempo_horas: 4
      },
      {
        nome_atividade: 'Prod Blocagem Repack',
        quantidade_produzida: 30,
        tempo_horas: 4
      }
    ],
    kpis_atingidos: ['Ressuprimento']
  };
  
  try {
    const response2 = await fetch(`${baseUrl}/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(teste2)
    });
    
    const result2 = await response2.json();
    
    if (result2.data) {
      console.log('✅ Resultado do Teste 2:');
      console.log(`   Valor Bruto Atividades: R$ ${result2.data.valorBrutoAtividades?.toFixed(2) || 'N/A'}`);
      console.log(`   Subtotal Atividades (50%): R$ ${result2.data.subtotalAtividades.toFixed(2)}`);
      console.log(`   Bonus KPIs: R$ ${result2.data.bonusKpis.toFixed(2)}`);
      console.log(`   Total Final: R$ ${result2.data.remuneracaoTotal.toFixed(2)}`);
      console.log(`   Detalhes: ${result2.data.atividadesDetalhes?.join(', ') || 'N/A'}`);
      
      // Validação básica
      const kpisEsperado = 3.00; // 1 KPI * R$ 3,00
      const kpisCorreto = Math.abs(result2.data.bonusKpis - kpisEsperado) < 0.01;
      
      if (kpisCorreto) {
        console.log('✅ KPIs calculados corretamente!');
      } else {
        console.log('❌ Erro no cálculo dos KPIs!');
      }
    } else {
      console.log('❌ Erro no Teste 2:', result2.error);
    }
  } catch (error) {
    console.log('❌ Erro de conexão no Teste 2:', error.message);
  }
  
  // Teste 3: Sem KPIs (apenas atividades)
  console.log('\n📋 Teste 3: Apenas atividades (sem KPIs)');
  const teste3 = {
    funcao: 'Ajudante de Armazém',
    turno: 'Noite',
    nome_atividade: 'Prod Amarração',
    quantidade_produzida: 200,
    tempo_horas: 8,
    kpis_atingidos: []
  };
  
  try {
    const response3 = await fetch(`${baseUrl}/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(teste3)
    });
    
    const result3 = await response3.json();
    
    if (result3.data) {
      console.log('✅ Resultado do Teste 3:');
      console.log(`   Quantidade Produzida: ${teste3.quantidade_produzida}`);
      console.log(`   Subtotal Atividades (50%): R$ ${result3.data.subtotalAtividades.toFixed(2)}`);
      console.log(`   Bonus KPIs: R$ ${result3.data.bonusKpis.toFixed(2)}`);
      console.log(`   Total Final: R$ ${result3.data.remuneracaoTotal.toFixed(2)}`);
      
      // Validação
      const kpisEsperado = 0.00; // Sem KPIs
      const kpisCorreto = Math.abs(result3.data.bonusKpis - kpisEsperado) < 0.01;
      
      if (kpisCorreto && result3.data.subtotalAtividades > 0) {
        console.log('✅ Cálculo sem KPIs funcionando corretamente!');
      } else {
        console.log('❌ Erro no cálculo sem KPIs!');
      }
    } else {
      console.log('❌ Erro no Teste 3:', result3.error);
    }
  } catch (error) {
    console.log('❌ Erro de conexão no Teste 3:', error.message);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('🎯 Resumo da Nova Lógica:');
  console.log('   • Atividades: quantidade_produzida * valor_atividade / 2');
  console.log('   • KPIs: R$ 3,00 por KPI selecionado (máximo 2)');
  console.log('   • Total: Atividades + KPIs + Extras');
  console.log('✅ Testes da nova lógica concluídos!');
}

testarNovaLogicaAtividades().catch(console.error);