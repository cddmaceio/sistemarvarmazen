async function criarLancamentoParaTeste() {
  const { default: fetch } = await import('node-fetch');
  console.log('🔧 CRIANDO LANÇAMENTO PARA TESTE DE EDIÇÃO');
  console.log('==================================================');
  
  try {
    // 1. Vamos pular o login e testar direto a edição
    console.log('\n1️⃣ Pulando login - testando direto...');
    const loginData = { token: 'fake-token', user: { nome: 'Teste' } };
    console.log('✅ Usando dados de teste');
    
    // 2. Criar dados para a calculadora
    console.log('\n2️⃣ Preparando dados para calculadora...');
    const calculatorInput = {
      funcao: 'Ajudante de Armazém',
      turno: 'Manhã',
      multiple_activities: [
        {
          nome_atividade: 'Prod Amarração',
          quantidade_produzida: 30,
          tempo_horas: 3
        }
      ],
      kpis_atingidos: ['Ressuprimento', 'EFC'],
      data_lancamento: '2025-01-15'
    };
    
    console.log('📤 Dados para calculadora:', JSON.stringify(calculatorInput, null, 2));
    
    // 3. Chamar a calculadora
    console.log('\n3️⃣ Calculando...');
    const calcResponse = await fetch('http://localhost:8888/api/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(calculatorInput)
    });
    
    if (!calcResponse.ok) {
      const errorText = await calcResponse.text();
      throw new Error(`Erro na calculadora: ${calcResponse.status} - ${errorText}`);
    }
    
    const calcResult = await calcResponse.json();
    console.log('✅ Resultado da calculadora:', JSON.stringify(calcResult, null, 2));
    
    // 4. Vamos simular um lançamento existente
    console.log('\n4️⃣ Simulando lançamento existente...');
    const createResult = {
      data: {
        id: 100, // ID fictício
        user_nome: 'Teste Usuario',
        remuneracao_total: calcResult.data.remuneracaoTotal,
        status: 'pendente'
      }
    };
    console.log('✅ Usando lançamento simulado:', {
      id: createResult.data.id,
      user_nome: createResult.data.user_nome,
      remuneracao_total: createResult.data.remuneracao_total,
      status: createResult.data.status
    });
    
    // 5. Agora vamos tentar editar este lançamento
    console.log('\n5️⃣ Testando edição do lançamento...');
    
    // Modificar um pouco os dados para a edição
    const editedCalculatorInput = {
      ...calculatorInput,
      multiple_activities: [
        {
          nome_atividade: 'Prod Amarração',
          quantidade_produzida: 35, // Mudança aqui
          tempo_horas: 3
        }
      ]
    };
    
    // Recalcular
    const editCalcResponse = await fetch('http://localhost:8888/api/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editedCalculatorInput)
    });
    
    if (!editCalcResponse.ok) {
      const errorText = await editCalcResponse.text();
      throw new Error(`Erro na recalculação: ${editCalcResponse.status} - ${errorText}`);
    }
    
    const editCalcResult = await editCalcResponse.json();
    console.log('✅ Novo resultado calculado:', JSON.stringify(editCalcResult, null, 2));
    
    // 6. Tentar editar o lançamento
    const editData = {
      calculator_data: editedCalculatorInput,
      calculator_result: editCalcResult.data,
      editado_por_admin: '1',
      observacoes: 'Teste de edição'
    };
    
    console.log('📤 Dados de edição:', JSON.stringify(editData, null, 2));
    
    const editResponse = await fetch(`http://localhost:8888/api/lancamentos/${createResult.data.id}/edit`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editData)
    });
    
    console.log('📡 Status da edição:', editResponse.status);
    
    if (!editResponse.ok) {
      const errorText = await editResponse.text();
      console.log('❌ Erro na edição:', errorText);
      
      // Tentar parsear como JSON para ver detalhes
      try {
        const errorJson = JSON.parse(errorText);
        console.log('📋 Detalhes do erro:', JSON.stringify(errorJson, null, 2));
      } catch (e) {
        console.log('📋 Erro não é JSON válido');
      }
    } else {
      const editResult = await editResponse.json();
      console.log('✅ Edição bem-sucedida:', JSON.stringify(editResult, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

criarLancamentoParaTeste();