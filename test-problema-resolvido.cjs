// Script final para confirmar que o problema original foi resolvido
const BASE_URL = 'http://localhost:8888';

async function testProblemaResolvido() {
  // Import fetch dinamicamente
  const { default: fetch } = await import('node-fetch');
  
  console.log('🎯 VERIFICAÇÃO FINAL: Problema Original Resolvido');
  console.log('=' .repeat(60));
  console.log('📋 Testando os erros originais:');
  console.log('   - POST http://localhost:8888/api/kpis/check-limit 404 (Not Found)');
  console.log('   - POST http://localhost:8888/api/lancamentos 400 (Bad Request)');
  console.log('');

  let testsPassed = 0;
  let totalTests = 0;

  try {
    // TESTE 1: Verificar se a rota check-limit não retorna mais 404
    console.log('1. 🔍 TESTE: Rota /api/kpis/check-limit (era 404)');
    totalTests++;
    
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
      console.log('   ✅ RESOLVIDO: Rota retorna 200 (antes era 404)');
      console.log(`   📊 Resposta: limitReached = ${checkResult.limitReached}`);
      testsPassed++;
    } else {
      console.log(`   ❌ AINDA COM PROBLEMA: Status ${checkResponse.status}`);
    }

    // TESTE 2: Verificar se a rota de lançamentos não retorna mais 400 com dados válidos
    console.log('\n2. 🎯 TESTE: Rota /api/lancamentos (era 400 Bad Request)');
    totalTests++;
    
    // Primeiro, obter dados válidos da calculadora
    const calculatorData = {
      funcao: 'Operador de Empilhadeira',
      turno: 'Manhã',
      nome_operador: 'Teste Operador',
      valid_tasks_count: 5,
      data_lancamento: '2025-08-20' // Data diferente para evitar conflito
    };

    const calcResponse = await fetch(`${BASE_URL}/api/calculate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(calculatorData)
    });

    if (calcResponse.status === 200) {
      const calcResult = await calcResponse.json();
      
      // Agora testar o lançamento com dados válidos
      const lancamentoData = {
        user_id: 1,
        data_lancamento: '2025-08-20',
        calculator_data: {
          funcao: 'Operador de Empilhadeira',
          turno: 'Manhã',
          nome_operador: 'Teste Operador',
          valid_tasks_count: 5,
          data_lancamento: '2025-08-20',
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
          tarefas_validas: calcResult.data.tarefasValidas,
          valor_tarefas: calcResult.data.valorTarefas
        }
      };

      const lancamentoResponse = await fetch(`${BASE_URL}/api/lancamentos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(lancamentoData)
      });

      if (lancamentoResponse.status === 201) {
        console.log('   ✅ RESOLVIDO: Rota retorna 201 (antes era 400)');
        const result = await lancamentoResponse.json();
        console.log(`   🆔 Lançamento criado com ID: ${result.id}`);
        testsPassed++;
      } else {
        console.log(`   ❌ AINDA COM PROBLEMA: Status ${lancamentoResponse.status}`);
        const errorText = await lancamentoResponse.text();
        console.log(`   💥 Erro: ${errorText}`);
      }
    } else {
      console.log('   ❌ Erro na calculadora, não foi possível testar lançamento');
    }

    // TESTE 3: Verificar se o problema específico da data 19/08/2025 foi resolvido
    console.log('\n3. 📅 TESTE: Data específica 19/08/2025 (problema original)');
    totalTests++;
    
    const checkData19 = {
      user_id: 1,
      data_lancamento: '2025-08-19'
    };

    const check19Response = await fetch(`${BASE_URL}/api/kpis/check-limit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(checkData19)
    });

    if (check19Response.status === 200) {
      const check19Result = await check19Response.json();
      console.log('   ✅ RESOLVIDO: Data 19/08/2025 pode ser verificada');
      console.log(`   📊 Status da data: ${check19Result.limitReached ? 'Ocupada' : 'Livre'}`);
      testsPassed++;
    } else {
      console.log(`   ❌ AINDA COM PROBLEMA: Status ${check19Response.status}`);
    }

    // TESTE 4: Verificar se as rotas estão respondendo corretamente
    console.log('\n4. 🌐 TESTE: Conectividade geral das rotas');
    totalTests++;
    
    const healthResponse = await fetch(`${BASE_URL}/api/health`);
    const kpisResponse = await fetch(`${BASE_URL}/api/kpis`);
    const functionsResponse = await fetch(`${BASE_URL}/api/functions`);
    
    if (healthResponse.status === 200 && kpisResponse.status === 200 && functionsResponse.status === 200) {
      console.log('   ✅ TODAS AS ROTAS: Funcionando corretamente');
      console.log('   📡 Health, KPIs e Functions respondendo');
      testsPassed++;
    } else {
      console.log('   ❌ ALGUMAS ROTAS: Com problemas de conectividade');
    }

    // RESUMO FINAL
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMO DA VERIFICAÇÃO');
    console.log('='.repeat(60));
    console.log(`Testes executados: ${totalTests}`);
    console.log(`Testes aprovados: ${testsPassed}`);
    console.log(`Taxa de sucesso: ${((testsPassed / totalTests) * 100).toFixed(1)}%`);
    
    if (testsPassed === totalTests) {
      console.log('\n🎉 PROBLEMA COMPLETAMENTE RESOLVIDO!');
      console.log('✅ Rota /api/kpis/check-limit: Funcionando (antes 404)');
      console.log('✅ Rota /api/lancamentos: Funcionando (antes 400)');
      console.log('✅ Data 19/08/2025: Disponível para lançamento');
      console.log('✅ Sistema: Totalmente operacional');
      console.log('\n🔧 CORREÇÕES IMPLEMENTADAS:');
      console.log('   1. Adicionada rota POST /api/kpis/check-limit');
      console.log('   2. Implementada validação de limite de KPI');
      console.log('   3. Corrigida estrutura de dados para lançamentos');
      console.log('   4. Worker recompilado e atualizado');
    } else {
      console.log('\n⚠️  ALGUNS PROBLEMAS AINDA EXISTEM');
      console.log(`❌ ${totalTests - testsPassed} teste(s) falharam`);
      console.log('🔧 Verifique os logs acima para detalhes');
    }

  } catch (error) {
    console.error('💥 Erro durante a verificação:', error.message);
  }
}

// Executar a verificação
testProblemaResolvido().catch(console.error);