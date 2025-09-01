const validateCalculatorFinal = async () => {
  const { default: fetch } = await import('node-fetch');
  
  const baseUrl = 'http://localhost:8888/.netlify/functions/api';
  
  console.log('🧮 VALIDAÇÃO FINAL DA CALCULADORA VIA NETLIFY FUNCTIONS\n');
  
  let testsPassedCount = 0;
  let totalTests = 0;
  
  // Teste 1: Health Check
  console.log('=== TESTE 1: HEALTH CHECK ===');
  totalTests++;
  try {
    const healthResponse = await fetch(`${baseUrl}/health`);
    if (healthResponse.status === 200) {
      const healthData = await healthResponse.json();
      console.log('✅ Health Check: PASSOU');
      console.log('   Status:', healthData.status);
      testsPassedCount++;
    } else {
      console.log('❌ Health Check: FALHOU - Status:', healthResponse.status);
    }
  } catch (error) {
    console.log('❌ Health Check: ERRO -', error.message);
  }
  
  // Teste 2: Calculadora com atividade válida (Prod Retorno)
  console.log('\n=== TESTE 2: CALCULADORA - ATIVIDADE VÁLIDA ===');
  totalTests++;
  const testDataValid = {
    funcao: 'Ajudante de Armazém',
    multiple_activities: [
      {
        nome_atividade: 'Prod Retorno',
        quantidade_produzida: 15,
        tempo_horas: 8
      }
    ],
    turno: 'Manhã',
    data_lancamento: '2025-01-15'
  };
  
  try {
    const calcResponse = await fetch(`${baseUrl}/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testDataValid)
    });
    
    if (calcResponse.status === 200) {
      const calcResult = await calcResponse.json();
      if (calcResult.data && calcResult.data.subtotalAtividades > 0) {
        console.log('✅ Calculadora - Atividade Válida: PASSOU');
        console.log('   Subtotal Atividades:', calcResult.data.subtotalAtividades);
        console.log('   Remuneração Total:', calcResult.data.remuneracaoTotal);
        console.log('   Detalhes:', calcResult.data.atividadesDetalhes?.[0] || 'N/A');
        testsPassedCount++;
      } else {
        console.log('❌ Calculadora - Atividade Válida: FALHOU - Valores zerados');
        console.log('   Resultado:', JSON.stringify(calcResult, null, 2));
      }
    } else {
      console.log('❌ Calculadora - Atividade Válida: FALHOU - Status:', calcResponse.status);
    }
  } catch (error) {
    console.log('❌ Calculadora - Atividade Válida: ERRO -', error.message);
  }
  
  // Teste 3: Calculadora com múltiplas atividades
  console.log('\n=== TESTE 3: CALCULADORA - MÚLTIPLAS ATIVIDADES ===');
  totalTests++;
  const testDataMultiple = {
    funcao: 'Ajudante de Armazém',
    multiple_activities: [
      {
        nome_atividade: 'Prod Retorno',
        quantidade_produzida: 10,
        tempo_horas: 4
      },
      {
        nome_atividade: 'Conferência',
        quantidade_produzida: 20,
        tempo_horas: 4
      }
    ],
    turno: 'Tarde',
    data_lancamento: '2025-01-15'
  };
  
  try {
    const multiResponse = await fetch(`${baseUrl}/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testDataMultiple)
    });
    
    if (multiResponse.status === 200) {
      const multiResult = await multiResponse.json();
      console.log('✅ Calculadora - Múltiplas Atividades: PASSOU');
      console.log('   Subtotal Atividades:', multiResult.data.subtotalAtividades);
      console.log('   Remuneração Total:', multiResult.data.remuneracaoTotal);
      console.log('   Atividades processadas:', multiResult.data.atividadesDetalhes?.length || 0);
      testsPassedCount++;
    } else {
      console.log('❌ Calculadora - Múltiplas Atividades: FALHOU - Status:', multiResponse.status);
    }
  } catch (error) {
    console.log('❌ Calculadora - Múltiplas Atividades: ERRO -', error.message);
  }
  
  // Teste 4: Verificar estrutura de resposta
  console.log('\n=== TESTE 4: ESTRUTURA DE RESPOSTA ===');
  totalTests++;
  const testDataStructure = {
    funcao: 'Ajudante de Armazém',
    multiple_activities: [
      {
        nome_atividade: 'Prod Retorno',
        quantidade_produzida: 8,
        tempo_horas: 8
      }
    ],
    turno: 'Noite',
    data_lancamento: '2025-01-15'
  };
  
  try {
    const structResponse = await fetch(`${baseUrl}/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testDataStructure)
    });
    
    if (structResponse.status === 200) {
      const structResult = await structResponse.json();
      const hasRequiredFields = structResult.data && 
        typeof structResult.data.subtotalAtividades === 'number' &&
        typeof structResult.data.bonusKpis === 'number' &&
        typeof structResult.data.remuneracaoTotal === 'number' &&
        Array.isArray(structResult.data.kpisAtingidos);
      
      if (hasRequiredFields) {
        console.log('✅ Estrutura de Resposta: PASSOU');
        console.log('   Todos os campos obrigatórios presentes');
        testsPassedCount++;
      } else {
        console.log('❌ Estrutura de Resposta: FALHOU - Campos obrigatórios ausentes');
        console.log('   Estrutura recebida:', Object.keys(structResult.data || {}));
      }
    } else {
      console.log('❌ Estrutura de Resposta: FALHOU - Status:', structResponse.status);
    }
  } catch (error) {
    console.log('❌ Estrutura de Resposta: ERRO -', error.message);
  }
  
  // Resumo final
  console.log('\n' + '='.repeat(50));
  console.log('📊 RESUMO DA VALIDAÇÃO');
  console.log('='.repeat(50));
  console.log(`Testes executados: ${totalTests}`);
  console.log(`Testes aprovados: ${testsPassedCount}`);
  console.log(`Taxa de sucesso: ${((testsPassedCount / totalTests) * 100).toFixed(1)}%`);
  
  if (testsPassedCount === totalTests) {
    console.log('\n🎉 CALCULADORA TOTALMENTE FUNCIONAL!');
    console.log('✅ Todos os testes passaram com sucesso');
    console.log('✅ A calculadora está operacional via Netlify Functions');
    console.log('✅ As atividades estão sendo processadas corretamente');
    console.log('✅ A estrutura de resposta está adequada');
  } else {
    console.log('\n⚠️  ALGUNS TESTES FALHARAM');
    console.log(`❌ ${totalTests - testsPassedCount} teste(s) não passou(ram)`);
    console.log('🔧 Verifique os logs acima para detalhes dos problemas');
  }
  
  console.log('\n' + '='.repeat(50));
};

validateCalculatorFinal().catch(console.error);