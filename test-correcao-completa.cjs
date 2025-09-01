const BASE_URL = 'http://localhost:8888';
const USER_ID = 3; // CPF: 699.895.404-20

async function testarCorrecaoCompleta() {
  const { default: fetch } = await import('node-fetch');
  console.log('🔧 TESTE DE CORREÇÃO COMPLETA - Sistema RV Armazém');
  console.log('=' .repeat(60));
  
  try {
    // 1. TESTE: Lançamento original com atividades múltiplas
    console.log('\n1️⃣ TESTE: Lançamento original com atividades múltiplas');
    console.log('-'.repeat(50));
    
    const calculatorData = {
      funcao: 'Ajudante de Armazém',
      turno: 'Manhã',
      multiple_activities: [
        {
          nome_atividade: 'Prod Repack',
          quantidade_produzida: 100,
          tempo_horas: 5
        },
        {
          nome_atividade: 'Prod Devolução',
          quantidade_produzida: 300,
          tempo_horas: 3
        }
      ],
      kpis_atingidos: [],
      data_lancamento: '2025-08-06'
    };
    
    console.log('📊 Dados da calculadora:', JSON.stringify(calculatorData, null, 2));
    
    // Testar calculadora
    const calcResponse = await fetch(`${BASE_URL}/api/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(calculatorData)
    });
    
    if (calcResponse.status !== 200) {
      console.log('❌ Erro na calculadora:', calcResponse.status);
      const errorText = await calcResponse.text();
      console.log('💥 Erro:', errorText);
      return;
    }
    
    const calcResult = await calcResponse.json();
    console.log('✅ Calculadora OK!');
    console.log('💰 Resultado:', {
      subtotalAtividades: calcResult.data.subtotalAtividades,
      bonusKpis: calcResult.data.bonusKpis,
      remuneracaoTotal: calcResult.data.remuneracaoTotal,
      valorBrutoAtividades: calcResult.data.valorBrutoAtividades,
      atividadesDetalhes: calcResult.data.atividadesDetalhes
    });
    
    // Testar lançamento
    const lancamentoData = {
      user_id: USER_ID,
      data_lancamento: '2025-08-06',
      calculator_data: calculatorData,
      calculator_result: {
        subtotalAtividades: calcResult.data.subtotalAtividades,
        bonusKpis: calcResult.data.bonusKpis,
        remuneracaoTotal: calcResult.data.remuneracaoTotal,
        kpisAtingidos: calcResult.data.kpisAtingidos || [],
        produtividade_alcancada: calcResult.data.produtividadeAlcancada,
        nivel_atingido: calcResult.data.nivelAtingido,
        unidade_medida: calcResult.data.unidadeMedida,
        atividades_detalhes: calcResult.data.atividadesDetalhes || [],
        valor_bruto_atividades: calcResult.data.valorBrutoAtividades,
        tarefas_validas: calcResult.data.tarefasValidas,
        valor_tarefas: calcResult.data.valorTarefas
      }
    };
    
    const lancResponse = await fetch(`${BASE_URL}/api/lancamentos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(lancamentoData)
    });
    
    if (lancResponse.status !== 200 && lancResponse.status !== 201) {
      console.log('❌ Erro no lançamento:', lancResponse.status);
      const errorText = await lancResponse.text();
      console.log('💥 Erro:', errorText);
      return;
    }
    
    const lancResult = await lancResponse.json();
    console.log('✅ Lançamento criado! Resposta:', lancResult);
    const novoLancamentoId = lancResult.id || (lancResult.data && lancResult.data.id);
    console.log('🆔 ID do lançamento:', novoLancamentoId);
    
    // 2. TESTE: Verificar dados salvos no banco
    console.log('\n2️⃣ TESTE: Verificação dos dados salvos no banco');
    console.log('-'.repeat(50));
    
    const getResponse = await fetch(`${BASE_URL}/api/lancamentos/${novoLancamentoId}`);
    if (getResponse.status === 200) {
      const savedData = await getResponse.json();
      console.log('📋 Dados salvos no banco:');
      console.log('🔹 multiple_activities:', savedData.data.multiple_activities);
      console.log('🔹 subtotal_atividades:', savedData.data.subtotal_atividades);
      console.log('🔹 valor_bruto_atividades:', savedData.data.valor_bruto_atividades);
      console.log('🔹 atividades_detalhes:', savedData.data.atividades_detalhes);
      console.log('🔹 kpis_atingidos:', savedData.data.kpis_atingidos);
      console.log('🔹 tarefas_validas:', savedData.data.tarefas_validas);
      console.log('🔹 valor_tarefas:', savedData.data.valor_tarefas);
      
      // Verificar se multiple_activities foi salvo corretamente
      if (savedData.data.multiple_activities) {
        try {
          const parsedActivities = JSON.parse(savedData.data.multiple_activities);
          console.log('✅ multiple_activities parseado:', parsedActivities);
          if (parsedActivities.length === 2) {
            console.log('✅ Número correto de atividades salvas!');
          } else {
            console.log('❌ Número incorreto de atividades:', parsedActivities.length);
          }
        } catch (e) {
          console.log('❌ Erro ao parsear multiple_activities:', e.message);
        }
      } else {
        console.log('❌ multiple_activities não foi salvo!');
      }
    }
    
    // 3. TESTE: Edição do lançamento
    console.log('\n3️⃣ TESTE: Edição do lançamento (botão editar)');
    console.log('-'.repeat(50));
    
    const editData = {
      calculator_data: {
        funcao: 'Ajudante de Armazém',
        turno: 'Tarde',
        multiple_activities: [
          {
            nome_atividade: 'Prod Repack',
            quantidade_produzida: 120,
            tempo_horas: 4
          },
          {
            nome_atividade: 'Conferência',
            quantidade_produzida: 200,
            tempo_horas: 2
          }
        ],
        kpis_atingidos: [],
        data_lancamento: '2025-08-06'
      },
      calculator_result: {
        subtotalAtividades: 8.5,
        bonusKpis: 3.0,
        remuneracaoTotal: 11.5,
        kpisAtingidos: ['Ressuprimento'],
        valor_bruto_atividades: 17.0
      },
      observacoes: 'Teste de edição com atividades múltiplas',
      editado_por_admin: 'admin-test'
    };
    
    const editResponse = await fetch(`${BASE_URL}/api/lancamentos/${novoLancamentoId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editData)
    });
    
    if (editResponse.status === 200) {
      const editResult = await editResponse.json();
      console.log('✅ Lançamento editado com sucesso!');
      
      // Verificar dados após edição
      const getEditedResponse = await fetch(`${BASE_URL}/api/lancamentos/${novoLancamentoId}`);
      if (getEditedResponse.status === 200) {
        const editedData = await getEditedResponse.json();
        console.log('📋 Dados após edição:');
        console.log('🔹 multiple_activities:', editedData.data.multiple_activities);
        console.log('🔹 turno:', editedData.data.turno);
        console.log('🔹 observacoes:', editedData.data.observacoes);
        
        if (editedData.data.multiple_activities) {
          try {
            const parsedEditedActivities = JSON.parse(editedData.data.multiple_activities);
            console.log('✅ multiple_activities editado:', parsedEditedActivities);
            if (parsedEditedActivities.length === 2 && parsedEditedActivities[0].quantidade_produzida === 120) {
              console.log('✅ Edição de atividades múltiplas funcionando!');
            } else {
              console.log('❌ Edição não aplicada corretamente');
            }
          } catch (e) {
            console.log('❌ Erro ao parsear multiple_activities editado:', e.message);
          }
        }
      }
    } else {
      console.log('❌ Erro na edição:', editResponse.status);
      const errorText = await editResponse.text();
      console.log('💥 Erro:', errorText);
    }
    
    // 4. TESTE: Operador de Empilhadeira (verificar tarefas_validas)
    console.log('\n4️⃣ TESTE: Operador de Empilhadeira (tarefas_validas)');
    console.log('-'.repeat(50));
    
    const empilhadeiraData = {
      funcao: 'Operador de Empilhadeira',
      turno: 'Manhã',
      nome_operador: 'Teste Operador',
      valid_tasks_count: 10,
      kpis_atingidos: [],
      data_lancamento: '2025-08-06'
    };
    
    const calcEmpResponse = await fetch(`${BASE_URL}/api/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(empilhadeiraData)
    });
    
    if (calcEmpResponse.status === 200) {
      const calcEmpResult = await calcEmpResponse.json();
      console.log('✅ Calculadora Empilhadeira OK!');
      console.log('🔹 tarefasValidas:', calcEmpResult.data.tarefasValidas);
      console.log('🔹 valorTarefas:', calcEmpResult.data.valorTarefas);
      console.log('🔹 subtotalAtividades:', calcEmpResult.data.subtotalAtividades);
      
      if (calcEmpResult.data.tarefasValidas !== undefined && calcEmpResult.data.valorTarefas !== undefined) {
        console.log('✅ Campos tarefas_validas e valor_tarefas sendo calculados!');
      } else {
        console.log('❌ Campos tarefas_validas ou valor_tarefas estão undefined');
      }
    }
    
    console.log('\n🎉 TESTE COMPLETO FINALIZADO!');
    console.log('=' .repeat(60));
    
  } catch (error) {
    console.error('💥 Erro geral:', error.message);
    console.error(error.stack);
  }
}

testarCorrecaoCompleta().catch(console.error);