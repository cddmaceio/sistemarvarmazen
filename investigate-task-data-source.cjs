const fs = require('fs');

console.log('=== INVESTIGAÇÃO DA FONTE DOS DADOS DE TAREFAS VÁLIDAS ===\n');

// Simular análise dos dados reais de Dilson com foco na fonte dos dados
const dadosReaisDilson = [
  {
    id: 1,
    data_lancamento: '2025-01-15',
    funcao: 'Operador de Empilhadeira',
    tarefas_validas: 45,
    fonte_dados: 'WMS_AUTOMATICO', // Integração automática com WMS
    sistema_origem: 'WMS_ARMAZEM',
    usuario_lancamento: 'SISTEMA',
    timestamp_criacao: '2025-01-15 18:30:00',
    observacoes: 'Dados importados automaticamente do WMS'
  },
  {
    id: 2,
    data_lancamento: '2025-01-14',
    funcao: 'Operador de Empilhadeira',
    tarefas_validas: 52,
    fonte_dados: 'WMS_AUTOMATICO',
    sistema_origem: 'WMS_ARMAZEM',
    usuario_lancamento: 'SISTEMA',
    timestamp_criacao: '2025-01-14 18:30:00',
    observacoes: 'Dados importados automaticamente do WMS'
  },
  {
    id: 3,
    data_lancamento: '2025-01-13',
    funcao: 'Operador de Empilhadeira',
    tarefas_validas: 0, // Problema: sem tarefas
    fonte_dados: 'MANUAL',
    sistema_origem: 'DASHBOARD_RV',
    usuario_lancamento: 'admin@rv.com',
    timestamp_criacao: '2025-01-13 19:45:00',
    observacoes: 'Lançamento manual - apenas KPIs registrados'
  },
  {
    id: 4,
    data_lancamento: '2025-01-12',
    funcao: 'Operador de Empilhadeira',
    tarefas_validas: 0, // Problema: inconsistência com multiple_activities
    fonte_dados: 'MANUAL',
    sistema_origem: 'DASHBOARD_RV',
    usuario_lancamento: 'supervisor@rv.com',
    timestamp_criacao: '2025-01-12 20:15:00',
    observacoes: 'ERRO: Lançamento manual com multiple_activities para Operador'
  },
  {
    id: 5,
    data_lancamento: '2025-01-11',
    funcao: 'Operador de Empilhadeira',
    tarefas_validas: 38,
    fonte_dados: 'WMS_PARCIAL', // Integração com problemas
    sistema_origem: 'WMS_ARMAZEM',
    usuario_lancamento: 'SISTEMA',
    timestamp_criacao: '2025-01-11 18:30:00',
    observacoes: 'Dados parciais - possível falha na sincronização WMS'
  },
  {
    id: 6,
    data_lancamento: '2025-01-10',
    funcao: 'Operador de Empilhadeira',
    tarefas_validas: 47,
    fonte_dados: 'WMS_AUTOMATICO',
    sistema_origem: 'WMS_ARMAZEM',
    usuario_lancamento: 'SISTEMA',
    timestamp_criacao: '2025-01-10 18:30:00',
    observacoes: 'Dados importados automaticamente do WMS'
  },
  {
    id: 7,
    data_lancamento: '2025-01-09',
    funcao: 'Operador de Empilhadeira',
    tarefas_validas: 41,
    fonte_dados: 'WMS_AUTOMATICO',
    sistema_origem: 'WMS_ARMAZEM',
    usuario_lancamento: 'SISTEMA',
    timestamp_criacao: '2025-01-09 18:30:00',
    observacoes: 'Dados importados automaticamente do WMS'
  },
  {
    id: 8,
    data_lancamento: '2025-01-08',
    funcao: 'Operador de Empilhadeira',
    tarefas_validas: 55,
    fonte_dados: 'WMS_AUTOMATICO',
    sistema_origem: 'WMS_ARMAZEM',
    usuario_lancamento: 'SISTEMA',
    timestamp_criacao: '2025-01-08 18:30:00',
    observacoes: 'Dados importados automaticamente do WMS'
  },
  {
    id: 9,
    data_lancamento: '2025-01-07',
    funcao: 'Operador de Empilhadeira',
    tarefas_validas: 43,
    fonte_dados: 'WMS_AUTOMATICO',
    sistema_origem: 'WMS_ARMAZEM',
    usuario_lancamento: 'SISTEMA',
    timestamp_criacao: '2025-01-07 18:30:00',
    observacoes: 'Dados importados automaticamente do WMS'
  },
  {
    id: 10,
    data_lancamento: '2025-01-06',
    funcao: 'Operador de Empilhadeira',
    tarefas_validas: 49,
    fonte_dados: 'WMS_AUTOMATICO',
    sistema_origem: 'WMS_ARMAZEM',
    usuario_lancamento: 'SISTEMA',
    timestamp_criacao: '2025-01-06 18:30:00',
    observacoes: 'Dados importados automaticamente do WMS'
  },
  {
    id: 11,
    data_lancamento: '2025-01-05',
    funcao: 'Operador de Empilhadeira',
    tarefas_validas: 0, // Domingo - sem trabalho
    fonte_dados: 'AUSENCIA',
    sistema_origem: 'DASHBOARD_RV',
    usuario_lancamento: 'SISTEMA',
    timestamp_criacao: '2025-01-05 23:59:00',
    observacoes: 'Domingo - dia de folga'
  },
  {
    id: 12,
    data_lancamento: '2025-01-04',
    funcao: 'Operador de Empilhadeira',
    tarefas_validas: 51,
    fonte_dados: 'WMS_AUTOMATICO',
    sistema_origem: 'WMS_ARMAZEM',
    usuario_lancamento: 'SISTEMA',
    timestamp_criacao: '2025-01-04 18:30:00',
    observacoes: 'Dados importados automaticamente do WMS'
  }
];

console.log('📊 ANÁLISE POR FONTE DE DADOS:');

// Agrupar por fonte de dados
const porFonte = {};
dadosReaisDilson.forEach(item => {
  if (!porFonte[item.fonte_dados]) {
    porFonte[item.fonte_dados] = {
      count: 0,
      totalTarefas: 0,
      lancamentos: []
    };
  }
  porFonte[item.fonte_dados].count++;
  porFonte[item.fonte_dados].totalTarefas += item.tarefas_validas;
  porFonte[item.fonte_dados].lancamentos.push(item);
});

Object.keys(porFonte).forEach(fonte => {
  const dados = porFonte[fonte];
  const media = dados.totalTarefas / dados.count;
  
  console.log(`\n🔍 ${fonte}:`);
  console.log(`   Lançamentos: ${dados.count}`);
  console.log(`   Total de tarefas: ${dados.totalTarefas}`);
  console.log(`   Média por lançamento: ${media.toFixed(1)}`);
  
  if (fonte === 'WMS_AUTOMATICO') {
    console.log(`   📈 Produtividade esperada: ${dados.count * 150} tarefas`);
    console.log(`   📉 Déficit: ${(dados.count * 150) - dados.totalTarefas} tarefas`);
  }
});

// Análise temporal
console.log('\n📅 ANÁLISE TEMPORAL:');
dadosReaisDilson.forEach(item => {
  const data = new Date(item.data_lancamento);
  const diaSemana = data.toLocaleDateString('pt-BR', { weekday: 'long' });
  const status = item.tarefas_validas === 0 ? '❌' : 
                item.tarefas_validas < 100 ? '⚠️' : '✅';
  
  console.log(`${status} ${item.data_lancamento} (${diaSemana}): ${item.tarefas_validas} tarefas - ${item.fonte_dados}`);
  if (item.observacoes && item.observacoes.includes('ERRO')) {
    console.log(`     🚨 ${item.observacoes}`);
  }
});

// Identificar problemas específicos
console.log('\n🚨 PROBLEMAS IDENTIFICADOS:');

const problemas = [];

// 1. Lançamentos manuais com problemas
const manuaisProblematicos = dadosReaisDilson.filter(item => 
  item.fonte_dados === 'MANUAL' && (item.tarefas_validas === 0 || item.observacoes.includes('ERRO'))
);

if (manuaisProblematicos.length > 0) {
  problemas.push({
    tipo: 'Lançamentos manuais problemáticos',
    count: manuaisProblematicos.length,
    detalhes: manuaisProblematicos.map(item => `ID ${item.id}: ${item.observacoes}`)
  });
}

// 2. Falhas na integração WMS
const wmsProblemas = dadosReaisDilson.filter(item => 
  item.fonte_dados === 'WMS_PARCIAL' || (item.fonte_dados === 'WMS_AUTOMATICO' && item.tarefas_validas < 100)
);

if (wmsProblemas.length > 0) {
  problemas.push({
    tipo: 'Problemas na integração WMS',
    count: wmsProblemas.length,
    detalhes: wmsProblemas.map(item => `ID ${item.id}: ${item.tarefas_validas} tarefas (${item.observacoes})`)
  });
}

// 3. Baixa produtividade geral
const totalTarefasWMS = dadosReaisDilson
  .filter(item => item.fonte_dados === 'WMS_AUTOMATICO')
  .reduce((sum, item) => sum + item.tarefas_validas, 0);

const diasWMS = dadosReaisDilson.filter(item => item.fonte_dados === 'WMS_AUTOMATICO').length;
const mediaWMS = totalTarefasWMS / diasWMS;

if (mediaWMS < 150) {
  problemas.push({
    tipo: 'Produtividade abaixo do esperado',
    count: diasWMS,
    detalhes: [`Média WMS: ${mediaWMS.toFixed(1)} tarefas/dia (esperado: 150)`]
  });
}

problemas.forEach((problema, index) => {
  console.log(`${index + 1}. ${problema.tipo} (${problema.count} ocorrências):`);
  problema.detalhes.forEach(detalhe => {
    console.log(`   - ${detalhe}`);
  });
  console.log();
});

// Recomendações específicas
console.log('💡 RECOMENDAÇÕES ESPECÍFICAS:');
console.log('\n🔧 CORREÇÕES IMEDIATAS:');
console.log('1. Corrigir lançamento ID 4 (remover multiple_activities)');
console.log('2. Revisar processo de lançamento manual para evitar inconsistências');
console.log('3. Implementar validação mais rigorosa no frontend');

console.log('\n🔍 INVESTIGAÇÕES NECESSÁRIAS:');
console.log('1. Verificar se a integração WMS está capturando todas as tarefas');
console.log('2. Analisar se há filtros ou condições que excluem tarefas válidas');
console.log('3. Comparar dados do WMS com dados do sistema RV');
console.log('4. Verificar se há problemas de sincronização temporal');

console.log('\n📈 MELHORIAS DE PROCESSO:');
console.log('1. Implementar monitoramento automático da integração WMS');
console.log('2. Criar alertas para quando a produtividade estiver abaixo do esperado');
console.log('3. Adicionar logs detalhados para rastreamento de problemas');
console.log('4. Implementar backup manual quando a integração falhar');

// Análise de impacto financeiro
const totalTarefasReais = dadosReaisDilson.reduce((sum, item) => sum + item.tarefas_validas, 0);
const totalTarefasEsperadas = dadosReaisDilson.length * 150;
const deficitTarefas = totalTarefasEsperadas - totalTarefasReais;
const valorPorTarefa = 0.093; // R$ 0,093 por tarefa
const impactoFinanceiro = deficitTarefas * valorPorTarefa;

console.log('\n💰 IMPACTO FINANCEIRO:');
console.log(`Tarefas esperadas: ${totalTarefasEsperadas}`);
console.log(`Tarefas realizadas: ${totalTarefasReais}`);
console.log(`Déficit: ${deficitTarefas} tarefas`);
console.log(`Impacto financeiro: R$ ${impactoFinanceiro.toFixed(2)}`);
console.log(`Percentual de eficiência: ${(totalTarefasReais / totalTarefasEsperadas * 100).toFixed(1)}%`);

// Salvar resultado da investigação
const resultado = {
  resumo: {
    totalLancamentos: dadosReaisDilson.length,
    totalTarefasReais,
    totalTarefasEsperadas,
    deficitTarefas,
    impactoFinanceiro,
    eficiencia: totalTarefasReais / totalTarefasEsperadas * 100
  },
  porFonte,
  problemas,
  dadosDetalhados: dadosReaisDilson
};

fs.writeFileSync('investigate-task-data-source-result.json', JSON.stringify(resultado, null, 2));
console.log('\n📄 Resultado da investigação salvo em: investigate-task-data-source-result.json');