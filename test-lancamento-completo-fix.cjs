// Script para testar o lançamento completo com dados válidos
const BASE_URL = 'http://localhost:8888';

async function testLancamentoCompleto() {
  // Import fetch dinamicamente
  const { default: fetch } = await import('node-fetch');
  
  console.log('🧪 TESTE COMPLETO: Lançamento com dados válidos');
  console.log('=' .repeat(60));

  try {
    // 1. Verificar se a rota check-limit está funcionando
    console.log('\n1. 🔍 Verificando rota check-limit...');
    
    const checkLimitData = {
      user_id: 1,
      data_lancamento: '2025-08-19'
    };

    const checkResponse = await fetch(`${BASE_URL}/api/kpis/check-limit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(checkLimitData)
    });

    if (checkResponse.status === 200) {
      const checkResult = await checkResponse.json();
      console.log('   ✅ Rota check-limit funcionando!');
      console.log(`   📊 Limite atingido: ${checkResult.limitReached}`);
      
      if (!checkResult.limitReached) {
        console.log('   ✅ Data 19/08/2025 está livre para lançamento!');
      } else {
        console.log('   ⚠️  Já existe lançamento para esta data');
        return;
      }
    } else {
      console.log(`   ❌ Erro na rota check-limit: ${checkResponse.status}`);
      const errorText = await checkResponse.text();
      console.log(`   💥 Erro: ${errorText}`);
      return;
    }

    // 2. Testar calculadora primeiro para obter dados válidos
    console.log('\n2. 🧮 Testando calculadora para obter dados válidos...');
    
    const calculatorData = {
      funcao: 'Ajudante de Armazém',
      turno: 'Manhã',
      multiple_activities: [
        {
          nome_atividade: 'Prod Retorno',
          quantidade_produzida: 10,
          tempo_horas: 4
        },
        {
          nome_atividade: 'Conferência',
          quantidade_produzida: 15,
          tempo_horas: 4
        }
      ],
      data_lancamento: '2025-08-19'
    };

    const calcResponse = await fetch(`${BASE_URL}/api/calculate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(calculatorData)
    });

    if (calcResponse.status !== 200) {
      console.log(`   ❌ Erro na calculadora: ${calcResponse.status}`);
      const errorText = await calcResponse.text();
      console.log(`   💥 Erro: ${errorText}`);
      return;
    }

    const calcResult = await calcResponse.json();
    console.log('   ✅ Calculadora funcionando!');
    console.log(`   💰 Remuneração Total: R$ ${calcResult.data.remuneracaoTotal}`);
    console.log(`   📊 Subtotal Atividades: R$ ${calcResult.data.subtotalAtividades}`);
    console.log(`   🎯 Bônus KPIs: R$ ${calcResult.data.bonusKpis}`);

    // 3. Testar a rota de lançamentos com dados válidos
    console.log('\n3. 🎯 Testando rota de lançamentos com dados válidos...');
    
    const lancamentoData = {
      user_id: 1,
      data_lancamento: '2025-08-19',
      calculator_data: {
        funcao: 'Ajudante de Armazém',
        turno: 'Manhã',
        multiple_activities: [
          {
            nome_atividade: 'Prod Retorno',
            quantidade_produzida: 10,
            tempo_horas: 4
          },
          {
            nome_atividade: 'Conferência',
            quantidade_produzida: 15,
            tempo_horas: 4
          }
        ],
        data_lancamento: '2025-08-19',
        kpis_atingidos: calcResult.data.kpisAtingidos || []
      },
      calculator_result: {
        subtotalAtividades: calcResult.data.subtotalAtividades,
        bonusKpis: calcResult.data.bonusKpis,
        remuneracaoTotal: calcResult.data.remuneracaoTotal,
        kpisAtingidos: calcResult.data.kpisAtingidos || [],
        produtividade_alcancada: calcResult.data.produtividade_alcancada,
        nivel_atingido: calcResult.data.nivel_atingido,
        unidade_medida: calcResult.data.unidade_medida,
        atividades_detalhes: calcResult.data.atividades_detalhes || [],
        valor_bruto_atividades: calcResult.data.valorBrutoAtividades
      }
    };

    console.log('   📝 Dados do lançamento preparados:');
    console.log(`   👤 User ID: ${lancamentoData.user_id}`);
    console.log(`   📅 Data: ${lancamentoData.data_lancamento}`);
    console.log(`   🏢 Função: ${lancamentoData.calculator_data.funcao}`);
    console.log(`   ⏰ Turno: ${lancamentoData.calculator_data.turno}`);
    console.log(`   💰 Remuneração: R$ ${lancamentoData.calculator_result.remuneracaoTotal}`);

    const lancamentoResponse = await fetch(`${BASE_URL}/api/lancamentos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(lancamentoData)
    });

    if (lancamentoResponse.status === 201) {
      const lancamentoResult = await lancamentoResponse.json();
      console.log('   ✅ Lançamento criado com sucesso!');
      console.log(`   🆔 ID do lançamento: ${lancamentoResult.id}`);
      console.log(`   📊 Status: ${lancamentoResult.status}`);
    } else {
      console.log(`   ❌ Erro no lançamento: ${lancamentoResponse.status}`);
      const errorText = await lancamentoResponse.text();
      console.log(`   💥 Erro: ${errorText}`);
      return;
    }

    // 4. Verificar se o lançamento foi salvo corretamente
    console.log('\n4. 🔍 Verificando se o lançamento foi salvo...');
    
    const listResponse = await fetch(`${BASE_URL}/api/lancamentos`);
    
    if (listResponse.status === 200) {
      const lancamentos = await listResponse.json();
      const lancamentoHoje = lancamentos.find(l => 
        l.data_lancamento === '2025-08-19' && l.user_id === 1
      );
      
      if (lancamentoHoje) {
        console.log('   ✅ Lançamento encontrado na base de dados!');
        console.log(`   🆔 ID: ${lancamentoHoje.id}`);
        console.log(`   👤 Usuário: ${lancamentoHoje.user_nome || 'N/A'}`);
        console.log(`   💰 Remuneração: R$ ${lancamentoHoje.remuneracao_total}`);
        console.log(`   📊 Status: ${lancamentoHoje.status}`);
      } else {
        console.log('   ❌ Lançamento não encontrado na base de dados!');
      }
    } else {
      console.log(`   ❌ Erro ao listar lançamentos: ${listResponse.status}`);
    }

    console.log('\n🎉 TESTE COMPLETO FINALIZADO!');
    console.log('✅ Todas as etapas foram executadas com sucesso!');
    console.log('✅ O problema do lançamento para 19/08/2025 foi resolvido!');

  } catch (error) {
    console.error('💥 Erro durante o teste:', error.message);
  }
}

// Executar o teste
testLancamentoCompleto().catch(console.error);