// Script para testar o debug do turno no endpoint de lançamentos

const testLancamento = async () => {
  const testData = {
    user_id: 17, // ID válido do banco
    data_lancamento: '2024-01-20',
    calculator_data: {
      funcao: 'Ajudante de Armazém',
      turno: 'Manha', // Valor convertido pelo frontend
      nome_atividade: 'Prod Amarração',
      quantidade_produzida: 30,
      tempo_horas: 3,
      input_adicional: 0,
      kpis_atingidos: ['EFC', 'Ressuprimento']
    },
    calculator_result: {
      subtotalAtividades: 3,
      bonusKpis: 6,
      remuneracaoTotal: 9,
      kpisAtingidos: ['EFC', 'Ressuprimento'], // Campo obrigatório
      produtividade_alcancada: 10,
      nivel_atingido: 'Nível 1',
      unidade_medida: 'plt/h',
      atividades_detalhes: [{
        nome: 'Prod Amarração',
        produtividade: 10,
        nivel: 'Nível 1',
        valor_total: 3,
        unidade: 'plt/h'
      }],
      tarefas_validas: 0,
      valor_tarefas: 0,
      valor_bruto_atividades: 6
    }
  };

  try {
    console.log('🧪 Testando lançamento com dados:', testData);
    
    const response = await fetch('http://localhost:3000/api/lancamentos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });

    const result = await response.text();
    console.log('📊 Status:', response.status);
    console.log('📋 Response:', result);
    
    if (!response.ok) {
      console.error('❌ Erro na requisição:', result);
    } else {
      console.log('✅ Lançamento criado com sucesso!');
    }
  } catch (error) {
    console.error('❌ Erro ao testar:', error);
  }
};

// Executar o teste
testLancamento();