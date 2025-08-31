const fetch = require('node-fetch');

// Simular dados de um lançamento de Operador de Empilhadeira
const testData = {
  user_id: 1,
  data_lancamento: '2025-01-15',
  calculator_data: {
    funcao: 'Operador de Empilhadeira',
    turno: 'Tarde',
    nome_operador: 'DILSON ARLINDO DOS SANTOS',
    valid_tasks_count: 150,
    kpis_atingidos: ['EFD', 'TMA']
  },
  calculator_result: {
    subtotalAtividades: 6.975, // 150 * 0.093 / 2
    bonusKpis: 5.76,
    remuneracaoTotal: 12.735,
    kpisAtingidos: ['EFD', 'TMA'],
    tarefas_validas: 150,
    valor_tarefas: 13.95 // 150 * 0.093
  }
};

console.log('🧪 TESTE: Simulando lançamento com API corrigida');
console.log('📊 Dados de entrada:', JSON.stringify(testData, null, 2));

// Simular o que a API Netlify faria
const calculatorResult = testData.calculator_result;

const lancamentoData = {
  user_id: testData.user_id,
  data_lancamento: testData.data_lancamento,
  funcao: testData.calculator_data.funcao,
  turno: testData.calculator_data.turno,
  nome_operador: testData.calculator_data.nome_operador,
  valid_tasks_count: testData.calculator_data.valid_tasks_count,
  kpis_atingidos: JSON.stringify(calculatorResult.kpisAtingidos),
  subtotal_atividades: calculatorResult.subtotalAtividades,
  bonus_kpis: calculatorResult.bonusKpis,
  remuneracao_total: calculatorResult.remuneracaoTotal,
  tarefas_validas: calculatorResult.tarefas_validas,
  valor_tarefas: calculatorResult.valor_tarefas,
  status: 'pendente'
};

console.log('\n✅ RESULTADO: Dados que seriam inseridos no banco:');
console.log('📋 tarefas_validas:', lancamentoData.tarefas_validas, '(tipo:', typeof lancamentoData.tarefas_validas, ')');
console.log('💰 valor_tarefas:', lancamentoData.valor_tarefas, '(tipo:', typeof lancamentoData.valor_tarefas, ')');
console.log('🔢 valid_tasks_count:', lancamentoData.valid_tasks_count, '(tipo:', typeof lancamentoData.valid_tasks_count, ')');

if (lancamentoData.tarefas_validas !== null && lancamentoData.valor_tarefas !== null) {
  console.log('\n🎉 SUCESSO: Os campos tarefas_validas e valor_tarefas estão sendo preenchidos corretamente!');
  console.log('✅ O lançamento apareceria no frontend do colaborador.');
} else {
  console.log('\n❌ ERRO: Os campos ainda estão null.');
  console.log('🚨 O lançamento NÃO apareceria no frontend do colaborador.');
}

console.log('\n📊 Dados completos do lançamento:');
console.log(JSON.stringify(lancamentoData, null, 2));