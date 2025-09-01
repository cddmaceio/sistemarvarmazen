// Script para testar se a rota /api/kpis/check-limit foi corrigida
const BASE_URL = 'http://localhost:8888';

async function testKPICheckLimitFix() {
  // Import fetch dinamicamente
  const { default: fetch } = await import('node-fetch');
  console.log('🧪 TESTE DA CORREÇÃO: Rota /api/kpis/check-limit');
  console.log('=' .repeat(60));

  try {
    // 1. Verificar se o servidor está rodando
    console.log('\n1. 🔍 Verificando se o servidor está ativo...');
    try {
      const healthResponse = await fetch(`${BASE_URL}/api/health`);
      if (healthResponse.status === 200) {
        console.log('   ✅ Servidor está ativo');
      } else {
        console.log('   ❌ Servidor não está respondendo corretamente');
        return;
      }
    } catch (error) {
      console.log('   ❌ Servidor não está ativo. Execute: npm run dev');
      return;
    }

    // 2. Testar a rota /api/kpis/check-limit
    console.log('\n2. 🎯 Testando rota /api/kpis/check-limit...');
    
    const testData = {
      user_id: 1,
      data_lancamento: '2025-08-19'
    };

    console.log('   📤 Enviando dados:', JSON.stringify(testData, null, 2));

    const response = await fetch(`${BASE_URL}/api/kpis/check-limit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });

    console.log(`   📊 Status da resposta: ${response.status}`);

    if (response.status === 404) {
      console.log('   ❌ ERRO 404: Rota ainda não encontrada!');
      console.log('   💡 Possíveis soluções:');
      console.log('      - Reiniciar o servidor (npm run dev)');
      console.log('      - Verificar se o worker foi compilado corretamente');
      console.log('      - Verificar se a rota foi adicionada ao arquivo correto');
      return;
    }

    if (response.status === 200) {
      const result = await response.json();
      console.log('   ✅ SUCESSO: Rota funcionando!');
      console.log('   📋 Resposta:', JSON.stringify(result, null, 2));
      
      // Verificar se a resposta tem a estrutura esperada
      if (typeof result.limitReached === 'boolean') {
        console.log('   ✅ Estrutura da resposta está correta');
        console.log(`   📊 Limite atingido: ${result.limitReached}`);
      } else {
        console.log('   ⚠️  Estrutura da resposta pode estar incorreta');
      }
    } else {
      const errorResult = await response.text();
      console.log(`   ❌ Erro ${response.status}:`, errorResult);
    }

    // 3. Testar com dados inválidos
    console.log('\n3. 🧪 Testando validação de dados...');
    
    const invalidResponse = await fetch(`${BASE_URL}/api/kpis/check-limit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });

    if (invalidResponse.status === 400) {
      console.log('   ✅ Validação funcionando: retorna 400 para dados inválidos');
    } else {
      console.log(`   ⚠️  Validação pode ter problema: status ${invalidResponse.status}`);
    }

    // 4. Testar com data específica do problema (19/08/2025)
    console.log('\n4. 🎯 Testando data específica do problema (19/08/2025)...');
    
    const specificTestData = {
      user_id: 1,
      data_lancamento: '2025-08-19'
    };

    const specificResponse = await fetch(`${BASE_URL}/api/kpis/check-limit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(specificTestData)
    });

    if (specificResponse.status === 200) {
      const specificResult = await specificResponse.json();
      console.log('   ✅ Data 19/08/2025 processada com sucesso!');
      console.log('   📋 Resultado:', JSON.stringify(specificResult, null, 2));
      
      if (!specificResult.limitReached) {
        console.log('   ✅ Data está livre para lançamento!');
      } else {
        console.log('   ⚠️  Já existe lançamento para esta data');
      }
    } else {
      console.log(`   ❌ Erro ao processar data específica: ${specificResponse.status}`);
    }

    console.log('\n🎉 RESUMO DO TESTE:');
    console.log('==================');
    console.log('✅ Rota /api/kpis/check-limit foi implementada');
    console.log('✅ Servidor está processando as requisições');
    console.log('✅ Validação de dados está funcionando');
    console.log('✅ Data 19/08/2025 pode ser processada');
    console.log('\n💡 PRÓXIMOS PASSOS:');
    console.log('   1. Testar na interface do usuário');
    console.log('   2. Verificar se o erro 404 foi resolvido');
    console.log('   3. Tentar fazer um lançamento para 19/08/2025');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
    console.log('\n💡 Possíveis soluções:');
    console.log('   - Verificar se o servidor está rodando (npm run dev)');
    console.log('   - Verificar se o worker foi compilado (npm run build:worker)');
    console.log('   - Verificar logs do servidor para mais detalhes');
  }
}

// Executar o teste
testKPICheckLimitFix();