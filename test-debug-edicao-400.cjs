async function testEditLancamento() {
  const { default: fetch } = await import('node-fetch');
  const BASE_URL = 'http://localhost:8888';
  
  try {
    console.log('🔍 Testando erro 400 na edição de lançamento...');
    
    // 1. Buscar um lançamento existente para editar
    console.log('\n1. Buscando lançamentos pendentes...');
    const lancamentosResponse = await fetch(`${BASE_URL}/api/lancamentos/pendentes`);
    
    if (!lancamentosResponse.ok) {
      console.log('❌ Erro ao buscar lançamentos:', lancamentosResponse.status);
      return;
    }
    
    const lancamentos = await lancamentosResponse.json();
    console.log(`📊 Total de lançamentos pendentes: ${lancamentos.length}`);
    
    if (lancamentos.length === 0) {
      console.log('❌ Nenhum lançamento pendente encontrado');
      return;
    }
    
    const lancamento = lancamentos[0];
    console.log(`\n📋 Lançamento selecionado: ID ${lancamento.id}`);
    console.log(`   Usuário: ${lancamento.user_nome}`);
    console.log(`   Função: ${lancamento.funcao}`);
    console.log(`   Turno: ${lancamento.turno}`);
    console.log(`   Data: ${lancamento.data_lancamento}`);
    
    // 2. Preparar dados de edição baseados no lançamento existente
    console.log('\n2. Preparando dados de edição...');
    
    // Dados do calculador (calculator_data)
    const calculator_data = {
      funcao: lancamento.funcao,
      turno: lancamento.turno, // Manter o turno original
      nome_atividade: lancamento.nome_atividade || 'Prod Amarração',
      quantidade_produzida: 30,
      tempo_horas: 2,
      input_adicional: 0,
      kpis_atingidos: ['Ressuprimento', 'EFC'],
      data_lancamento: lancamento.data_lancamento
    };
    
    // Resultado do calculador (calculator_result)
    const calculator_result = {
      subtotalAtividades: 15.0,
      bonusKpis: 6.0,
      remuneracaoTotal: 21.0,
      kpisAtingidos: ['Ressuprimento', 'EFC'],
      produtividadeAlcancada: 15.0,
      nivelAtingido: 'Nível 3',
      unidadeMedida: 'plt/h',
      atividadesDetalhes: ['Prod Amarração: 30 plt/h em 2h (Nível 3 (10 plt/h))']
      // Omitindo tarefasValidas, valorTarefas e valorBrutoAtividades pois são null
    };
    
    const requestBody = {
      calculator_data,
      calculator_result,
      editado_por_admin: '1', // ID do admin
      observacoes: 'Teste de edição para debug do erro 400'
    };
    
    console.log('\n📤 Dados que serão enviados:');
    console.log('calculator_data:', JSON.stringify(calculator_data, null, 2));
    console.log('calculator_result:', JSON.stringify(calculator_result, null, 2));
    
    // 3. Tentar fazer a edição
    console.log('\n3. Fazendo requisição de edição...');
    const editResponse = await fetch(`${BASE_URL}/api/lancamentos/${lancamento.id}/edit`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    
    console.log(`📡 Status da resposta: ${editResponse.status}`);
    console.log(`📡 Status OK: ${editResponse.ok}`);
    
    if (!editResponse.ok) {
      console.log('\n❌ ERRO 400 - Detalhes:');
      const errorText = await editResponse.text();
      console.log('Resposta do servidor:', errorText);
      
      try {
        const errorJson = JSON.parse(errorText);
        console.log('Erro parseado:', JSON.stringify(errorJson, null, 2));
      } catch (e) {
        console.log('Erro não é JSON válido');
      }
    } else {
      const result = await editResponse.json();
      console.log('\n✅ Edição realizada com sucesso!');
      console.log('Resultado:', JSON.stringify(result, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
  }
}

// Executar o teste
testEditLancamento();