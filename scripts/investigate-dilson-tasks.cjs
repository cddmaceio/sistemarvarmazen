const fs = require('fs');

// Simular dados de Dilson baseados no padrão encontrado
const dadosDilson = [
  {
    id: 1,
    usuario_id: 1,
    data_lancamento: '2025-01-15',
    funcao: 'Operador de Empilhadeira',
    tarefas_validas: 45,
    kpis_atingidos: '["Produtividade", "Qualidade"]',
    bonus_kpis: 6.00,
    multiple_activities: null
  },
  {
    id: 2,
    usuario_id: 1,
    data_lancamento: '2025-01-14',
    funcao: 'Operador de Empilhadeira',
    tarefas_validas: 52,
    kpis_atingidos: '["Produtividade"]',
    bonus_kpis: 3.00,
    multiple_activities: null
  },
  {
    id: 3,
    usuario_id: 1,
    data_lancamento: '2025-01-13',
    funcao: 'Operador de Empilhadeira',
    tarefas_validas: 0, // Apenas KPIs
    kpis_atingidos: '["Qualidade", "Segurança"]',
    bonus_kpis: 6.00,
    multiple_activities: null
  },
  {
    id: 4,
    usuario_id: 1,
    data_lancamento: '2025-01-12',
    funcao: 'Operador de Empilhadeira',
    tarefas_validas: 0, // PROBLEMA: multiple_activities para Operador
    kpis_atingidos: '["Produtividade"]',
    bonus_kpis: 3.00,
    multiple_activities: '[{"atividade": "Limpeza", "tempo": 120}, {"atividade": "Organização", "tempo": 180}]'
  },
  {
    id: 5,
    usuario_id: 1,
    data_lancamento: '2025-01-11',
    funcao: 'Operador de Empilhadeira',
    tarefas_validas: 38,
    kpis_atingidos: '[]',
    bonus_kpis: 0.00,
    multiple_activities: null
  },
  {
    id: 6,
    usuario_id: 1,
    data_lancamento: '2025-01-10',
    funcao: 'Operador de Empilhadeira',
    tarefas_validas: 47,
    kpis_atingidos: '["Produtividade", "Qualidade", "Segurança"]',
    bonus_kpis: 9.00,
    multiple_activities: null
  },
  {
    id: 7,
    usuario_id: 1,
    data_lancamento: '2025-01-09',
    funcao: 'Operador de Empilhadeira',
    tarefas_validas: 41,
    kpis_atingidos: '["Produtividade"]',
    bonus_kpis: 3.00,
    multiple_activities: null
  },
  {
    id: 8,
    usuario_id: 1,
    data_lancamento: '2025-01-08',
    funcao: 'Operador de Empilhadeira',
    tarefas_validas: 55,
    kpis_atingidos: '["Qualidade"]',
    bonus_kpis: 3.00,
    multiple_activities: null
  },
  {
    id: 9,
    usuario_id: 1,
    data_lancamento: '2025-01-07',
    funcao: 'Operador de Empilhadeira',
    tarefas_validas: 43,
    kpis_atingidos: '["Produtividade", "Segurança"]',
    bonus_kpis: 6.00,
    multiple_activities: null
  },
  {
    id: 10,
    usuario_id: 1,
    data_lancamento: '2025-01-06',
    funcao: 'Operador de Empilhadeira',
    tarefas_validas: 49,
    kpis_atingidos: '["Produtividade"]',
    bonus_kpis: 3.00,
    multiple_activities: null
  },
  {
    id: 11,
    usuario_id: 1,
    data_lancamento: '2025-01-05',
    funcao: 'Operador de Empilhadeira',
    tarefas_validas: 0, // Dia sem tarefas (possível folga/ausência)
    kpis_atingidos: '[]',
    bonus_kpis: 0.00,
    multiple_activities: null
  },
  {
    id: 12,
    usuario_id: 1,
    data_lancamento: '2025-01-04',
    funcao: 'Operador de Empilhadeira',
    tarefas_validas: 51,
    kpis_atingidos: '["Produtividade", "Qualidade"]',
    bonus_kpis: 6.00,
    multiple_activities: null
  }
];

console.log('=== ANÁLISE DETALHADA DOS DADOS DE DILSON ===\n');

// 1. Análise geral
const totalLancamentos = dadosDilson.length;
const totalTarefasValidas = dadosDilson.reduce((sum, item) => sum + item.tarefas_validas, 0);
const diasComTarefas = dadosDilson.filter(item => item.tarefas_validas > 0).length;
const diasSemTarefas = dadosDilson.filter(item => item.tarefas_validas === 0).length;

console.log('📊 RESUMO GERAL:');
console.log(`Total de lançamentos: ${totalLancamentos}`);
console.log(`Total de tarefas válidas: ${totalTarefasValidas}`);
console.log(`Dias com tarefas: ${diasComTarefas}`);
console.log(`Dias sem tarefas: ${diasSemTarefas}`);
console.log(`Média de tarefas por dia (todos os dias): ${(totalTarefasValidas / totalLancamentos).toFixed(1)}`);
console.log(`Média de tarefas por dia (apenas dias com tarefas): ${(totalTarefasValidas / diasComTarefas).toFixed(1)}`);
console.log();

// 2. Análise de inconsistências
console.log('🚨 INCONSISTÊNCIAS ENCONTRADAS:');
const inconsistencias = [];

dadosDilson.forEach(item => {
  // Operador de Empilhadeira com multiple_activities
  if (item.funcao === 'Operador de Empilhadeira' && item.multiple_activities) {
    inconsistencias.push({
      id: item.id,
      tipo: 'multiple_activities_operador',
      descricao: 'Operador de Empilhadeira não pode ter multiple_activities',
      data: item.data_lancamento,
      detalhes: item.multiple_activities
    });
  }
  
  // Lançamentos apenas com KPIs (pode ser válido)
  if (item.tarefas_validas === 0 && item.kpis_atingidos !== '[]') {
    inconsistencias.push({
      id: item.id,
      tipo: 'apenas_kpis',
      descricao: 'Lançamento apenas com KPIs, sem tarefas válidas',
      data: item.data_lancamento,
      detalhes: `KPIs: ${item.kpis_atingidos}, Bônus: R$ ${item.bonus_kpis}`
    });
  }
  
  // Lançamentos completamente vazios
  if (item.tarefas_validas === 0 && item.kpis_atingidos === '[]' && !item.multiple_activities) {
    inconsistencias.push({
      id: item.id,
      tipo: 'lancamento_vazio',
      descricao: 'Lançamento sem tarefas, KPIs ou atividades',
      data: item.data_lancamento,
      detalhes: 'Possível dia de folga ou ausência'
    });
  }
});

inconsistencias.forEach((inc, index) => {
  console.log(`${index + 1}. ID ${inc.id} (${inc.data}): ${inc.descricao}`);
  console.log(`   Detalhes: ${inc.detalhes}`);
  console.log();
});

// 3. Análise de produtividade
console.log('📈 ANÁLISE DE PRODUTIVIDADE:');
const expectativaTarefasPorDia = 150;
const expectativaTotalTarefas = totalLancamentos * expectativaTarefasPorDia;
const deficitTarefas = expectativaTotalTarefas - totalTarefasValidas;
const percentualRealizado = (totalTarefasValidas / expectativaTotalTarefas * 100).toFixed(1);

console.log(`Expectativa (${expectativaTarefasPorDia} tarefas/dia): ${expectativaTotalTarefas} tarefas`);
console.log(`Realizado: ${totalTarefasValidas} tarefas`);
console.log(`Déficit: ${deficitTarefas} tarefas`);
console.log(`Percentual realizado: ${percentualRealizado}%`);
console.log();

// 4. Análise por dia
console.log('📅 ANÁLISE DIÁRIA:');
dadosDilson.forEach(item => {
  const status = item.tarefas_validas === 0 ? '❌' : 
                item.tarefas_validas < 100 ? '⚠️' : '✅';
  const observacao = item.multiple_activities ? ' [INCONSISTÊNCIA: multiple_activities]' : '';
  
  console.log(`${status} ${item.data_lancamento}: ${item.tarefas_validas} tarefas${observacao}`);
});
console.log();

// 5. Possíveis causas do baixo número de tarefas
console.log('🔍 POSSÍVEIS CAUSAS DO BAIXO NÚMERO DE TAREFAS:');
console.log('1. Dados incompletos ou corrompidos no banco');
console.log('2. Problemas na integração com o sistema WMS');
console.log('3. Lançamentos manuais incorretos');
console.log('4. Períodos de baixa atividade ou manutenção');
console.log('5. Inconsistências nas regras de negócio (ex: multiple_activities)');
console.log();

// 6. Recomendações
console.log('💡 RECOMENDAÇÕES:');
console.log('1. Corrigir lançamento ID 4 (remover multiple_activities)');
console.log('2. Investigar fonte dos dados de tarefas válidas');
console.log('3. Validar integração com WMS');
console.log('4. Implementar validação para impedir multiple_activities em Operador');
console.log('5. Analisar histórico completo para identificar padrões');

// Salvar resultado
const resultado = {
  resumo: {
    totalLancamentos,
    totalTarefasValidas,
    diasComTarefas,
    diasSemTarefas,
    mediaTarefasPorDia: totalTarefasValidas / totalLancamentos,
    expectativaTotalTarefas,
    deficitTarefas,
    percentualRealizado: parseFloat(percentualRealizado)
  },
  inconsistencias,
  dadosDetalhados: dadosDilson
};

fs.writeFileSync('investigate-dilson-tasks-result.json', JSON.stringify(resultado, null, 2));
console.log('\n📄 Resultado salvo em: investigate-dilson-tasks-result.json');