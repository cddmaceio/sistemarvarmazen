async function testEditLancamento() {
  const { default: fetch } = await import('node-fetch');
  console.log('🔧 TESTE DEBUG EDIÇÃO - SIMULANDO FRONTEND');
  console.log('==================================================');
  
  try {
    // 1. Primeiro, vamos buscar um lançamento pendente para editar
    console.log('\n1️⃣ Buscando lançamento pendente...');
    const lancamentosResponse = await fetch('http://localhost:8888/api/lancamentos/pendentes', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!lancamentosResponse.ok) {
      throw new Error(`Erro ao buscar lançamentos: ${lancamentosResponse.status}`);
    }
    
    const lancamentosData = await lancamentosResponse.json();
    const lancamento = lancamentosData.data?.[0];
    
    if (!lancamento) {
      console.log('❌ Nenhum lançamento pendente encontrado');
      return;
    }
    
    console.log('✅ Lançamento encontrado:', {
      id: lancamento.id,
      user_nome: lancamento.user_nome,
      funcao: lancamento.funcao,
      turno: lancamento.turno
    });
    
    // 2. Simular os dados que o frontend enviaria para a calculadora
    console.log('\n2️⃣ Simulando cálculo como o frontend faz...');
    
    const calculatorInput = {
      funcao: lancamento.funcao,
      turno: lancamento.turno,
      nome_atividade: lancamento.nome_atividade,
      quantidade_produzida: lancamento.quantidade_produzida,
      tempo_horas: lancamento.tempo_horas,
      input_adicional: lancamento.input_adicional || 0,
      kpis_atingidos: lancamento.kpis_atingidos ? JSON.parse(lancamento.kpis_atingidos) : [],
      multiple_activities: lancamento.multiple_activities ? JSON.parse(lancamento.multiple_activities) : undefined,
      nome_operador: lancamento.nome_operador,
      valid_tasks_count: lancamento.valid_tasks_count,
      data_lancamento: lancamento.data_lancamento
    };
    
    console.log('📤 Dados para calculadora:', JSON.stringify(calculatorInput, null, 2));
    
    // 3. Chamar a calculadora
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
    
    // 4. Verificar se há campos null no resultado
    console.log('\n3️⃣ Verificando campos null no resultado...');
    const result = calcResult.data;
    const nullFields = [];
    
    Object.keys(result).forEach(key => {
      if (result[key] === null) {
        nullFields.push(key);
      }
    });
    
    if (nullFields.length > 0) {
      console.log('⚠️ Campos null encontrados:', nullFields);
    } else {
      console.log('✅ Nenhum campo null encontrado');
    }
    
    // 5. Simular a requisição de edição exatamente como o frontend faz
    console.log('\n4️⃣ Simulando requisição de edição...');
    
    const editData = {
      calculator_data: calculatorInput,
      calculator_result: result,
      editado_por_admin: '1', // ID do admin
      observacoes: 'Teste de edição'
    };
    
    console.log('📤 Dados de edição:', JSON.stringify(editData, null, 2));
    
    const editResponse = await fetch(`http://localhost:8888/api/lancamentos/${lancamento.id}/edit`, {
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

testEditLancamento();