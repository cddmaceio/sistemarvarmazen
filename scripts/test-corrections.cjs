const fs = require('fs');

console.log('=== TESTE DAS CORREÇÕES - DASHBOARD DILSON ===');

// Simular dados reais de Dilson (12 lançamentos de agosto)
const dadosDilson = [
  {
    id: 1,
    user_cpf: '12345678901',
    user_nome: 'Dilson',
    data_lancamento: '2025-08-01',
    remuneracao_total: 15.50,
    nome_atividade: 'Separação de Pedidos',
    kpis_atingidos: '["Pontualidade", "Produtividade"]',
    tarefas_validas: 50,
    valor_tarefas: 25.00,
    bonus_kpis: 6.00,
    subtotal_atividades: 31.00,
    turno: 'Manhã',
    aprovado_por_nome: 'Admin',
    funcao: 'Operador de Empilhadeira',
    status: 'aprovado'
  },
  {
    id: 2,
    user_cpf: '12345678901',
    user_nome: 'Dilson',
    data_lancamento: '2025-08-02',
    remuneracao_total: 12.30,
    nome_atividade: 'Carregamento',
    kpis_atingidos: '["Eficiência"]',
    tarefas_validas: 40,
    valor_tarefas: 20.00,
    bonus_kpis: 3.00,
    subtotal_atividades: 23.00,
    turno: 'Tarde',
    aprovado_por_nome: 'Admin',
    funcao: 'Operador de Empilhadeira',
    status: 'aprovado'
  },
  {
    id: 3,
    user_cpf: '12345678901',
    user_nome: 'Dilson',
    data_lancamento: '2025-08-03',
    remuneracao_total: 9.00,
    nome_atividade: null,
    kpis_atingidos: '["Pontualidade", "Produtividade", "Eficiência"]',
    tarefas_validas: null,
    valor_tarefas: null,
    bonus_kpis: 9.00,
    subtotal_atividades: null,
    turno: 'Manhã',
    aprovado_por_nome: 'Admin',
    funcao: 'Operador de Empilhadeira',
    status: 'aprovado'
  },
  {
    id: 4,
    user_cpf: '12345678901',
    user_nome: 'Dilson',
    data_lancamento: '2025-08-04',
    remuneracao_total: 15.00,
    nome_atividade: 'Limpeza e Organização',
    multiple_activities: '[{"nome_atividade": "Limpeza e Organização", "valor": 12.00}]',
    kpis_atingidos: '["Pontualidade"]',
    tarefas_validas: null,
    valor_tarefas: null,
    bonus_kpis: 3.00,
    subtotal_atividades: 12.00,
    turno: 'Tarde',
    aprovado_por_nome: 'Admin',
    funcao: 'Operador de Empilhadeira',
    status: 'aprovado'
  },
  {
    id: 5,
    user_cpf: '12345678901',
    user_nome: 'Dilson',
    data_lancamento: '2025-08-05',
    remuneracao_total: 18.75,
    nome_atividade: 'Movimentação de Pallets',
    kpis_atingidos: '["Produtividade"]',
    tarefas_validas: 60,
    valor_tarefas: 30.00,
    bonus_kpis: 3.00,
    subtotal_atividades: 33.00,
    turno: 'Manhã',
    aprovado_por_nome: 'Admin',
    funcao: 'Operador de Empilhadeira',
    status: 'aprovado'
  },
  {
    id: 6,
    user_cpf: '12345678901',
    user_nome: 'Dilson',
    data_lancamento: '2025-08-06',
    remuneracao_total: 14.20,
    nome_atividade: 'Separação de Pedidos',
    kpis_atingidos: '["Pontualidade"]',
    tarefas_validas: 45,
    valor_tarefas: 22.50,
    bonus_kpis: 3.00,
    subtotal_atividades: 25.50,
    turno: 'Tarde',
    aprovado_por_nome: 'Admin',
    funcao: 'Operador de Empilhadeira',
    status: 'aprovado'
  },
  {
    id: 7,
    user_cpf: '12345678901',
    user_nome: 'Dilson',
    data_lancamento: '2025-08-07',
    remuneracao_total: 16.80,
    nome_atividade: 'Carregamento',
    kpis_atingidos: '["Eficiência", "Produtividade"]',
    tarefas_validas: 55,
    valor_tarefas: 27.50,
    bonus_kpis: 6.00,
    subtotal_atividades: 33.50,
    turno: 'Manhã',
    aprovado_por_nome: 'Admin',
    funcao: 'Operador de Empilhadeira',
    status: 'aprovado'
  },
  {
    id: 8,
    user_cpf: '12345678901',
    user_nome: 'Dilson',
    data_lancamento: '2025-08-08',
    remuneracao_total: 13.50,
    nome_atividade: 'Movimentação de Pallets',
    kpis_atingidos: '[]',
    tarefas_validas: 45,
    valor_tarefas: 22.50,
    bonus_kpis: 0,
    subtotal_atividades: 22.50,
    turno: 'Tarde',
    aprovado_por_nome: 'Admin',
    funcao: 'Operador de Empilhadeira',
    status: 'aprovado'
  },
  {
    id: 9,
    user_cpf: '12345678901',
    user_nome: 'Dilson',
    data_lancamento: '2025-08-09',
    remuneracao_total: 17.25,
    nome_atividade: 'Separação de Pedidos',
    kpis_atingidos: '["Pontualidade", "Produtividade"]',
    tarefas_validas: 50,
    valor_tarefas: 25.00,
    bonus_kpis: 6.00,
    subtotal_atividades: 31.00,
    turno: 'Manhã',
    aprovado_por_nome: 'Admin',
    funcao: 'Operador de Empilhadeira',
    status: 'aprovado'
  },
  {
    id: 10,
    user_cpf: '12345678901',
    user_nome: 'Dilson',
    data_lancamento: '2025-08-10',
    remuneracao_total: 19.50,
    nome_atividade: 'Carregamento',
    kpis_atingidos: '["Eficiência"]',
    tarefas_validas: 65,
    valor_tarefas: 32.50,
    bonus_kpis: 3.00,
    subtotal_atividades: 35.50,
    turno: 'Tarde',
    aprovado_por_nome: 'Admin',
    funcao: 'Operador de Empilhadeira',
    status: 'aprovado'
  },
  {
    id: 11,
    user_cpf: '12345678901',
    user_nome: 'Dilson',
    data_lancamento: '2025-08-11',
    remuneracao_total: 15.75,
    nome_atividade: 'Movimentação de Pallets',
    kpis_atingidos: '["Produtividade"]',
    tarefas_validas: 52,
    valor_tarefas: 26.00,
    bonus_kpis: 3.00,
    subtotal_atividades: 29.00,
    turno: 'Manhã',
    aprovado_por_nome: 'Admin',
    funcao: 'Operador de Empilhadeira',
    status: 'aprovado'
  },
  {
    id: 12,
    user_cpf: '12345678901',
    user_nome: 'Dilson',
    data_lancamento: '2025-08-12',
    remuneracao_total: 14.80,
    nome_atividade: 'Separação de Pedidos',
    kpis_atingidos: '["Pontualidade"]',
    tarefas_validas: 48,
    valor_tarefas: 24.00,
    bonus_kpis: 3.00,
    subtotal_atividades: 27.00,
    turno: 'Tarde',
    aprovado_por_nome: 'Admin',
    funcao: 'Operador de Empilhadeira',
    status: 'aprovado'
  }
];

// Função para formatar data
function formatDateSafe(dateString) {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  } catch {
    return dateString;
  }
}

// Simular filtro de mês (janeiro 2025 - data atual do sistema)
const mesAtual = new Date(); // Data atual do sistema
const dadosUsuario = dadosDilson.filter(item => {
  const dataLancamento = new Date(item.data_lancamento);
  const mesLancamento = dataLancamento.getMonth();
  const anoLancamento = dataLancamento.getFullYear();
  return mesLancamento === mesAtual.getMonth() && anoLancamento === mesAtual.getFullYear();
});

console.log(`📊 Total de lançamentos filtrados por mês: ${dadosUsuario.length}`);

// Simular filtro de lançamentos únicos
const lancamentosUnicos = dadosUsuario.filter((item, index, arr) => {
  return arr.findIndex(t => t.id === item.id) === index && item.status === 'aprovado';
});

console.log(`📋 Lançamentos únicos aprovados: ${lancamentosUnicos.length}`);

// Calcular ganho total
const userFunction = 'Operador de Empilhadeira';
let ganhoTotal = 0;

if (userFunction === 'Operador de Empilhadeira') {
  ganhoTotal = lancamentosUnicos.reduce((sum, item) => {
    return sum + (item.remuneracao_total || 0);
  }, 0);
}

console.log(`💰 Ganho total: R$ ${ganhoTotal.toFixed(2)}`);

// Criar histórico completo COM AS CORREÇÕES
const historicoCompleto = [];

lancamentosUnicos.forEach(item => {
  const dados = {
    nome_atividade: item.nome_atividade,
    multiple_activities: item.multiple_activities ? JSON.parse(item.multiple_activities) : null,
    funcao: item.funcao,
    kpis_atingidos: item.kpis_atingidos,
    tarefas_validas: item.tarefas_validas,
    valor_tarefas: item.valor_tarefas,
    bonus_kpis: item.bonus_kpis,
    subtotal_atividades: item.subtotal_atividades
  };
  
  const dataFormatada = formatDateSafe(item.data_lancamento);
  
  if (userFunction === 'Operador de Empilhadeira') {
    // Adicionar "Tarefas Válidas" se houver
    if (dados.tarefas_validas && dados.tarefas_validas > 0) {
      historicoCompleto.push({
        data: dataFormatada,
        valor: item.remuneracao_total,
        atividade: 'Tarefas Válidas',
        turno: item.turno,
        aprovadoPor: item.aprovado_por_nome || 'Sistema',
        kpis_atingidos: item.kpis_atingidos,
        tarefas_validas: item.tarefas_validas,
        valor_tarefas: item.valor_tarefas,
        bonus_kpis: item.bonus_kpis,
        subtotal_atividades: item.subtotal_atividades
      });
    }
    
    // CÓDIGO CORRIGIDO: Parse dos KPIs
    let kpisArrayHistorico = [];
    try {
      if (dados.kpis_atingidos && typeof dados.kpis_atingidos === 'string') {
        kpisArrayHistorico = JSON.parse(dados.kpis_atingidos);
      } else if (Array.isArray(dados.kpis_atingidos)) {
        kpisArrayHistorico = dados.kpis_atingidos;
      }
    } catch (e) {
      kpisArrayHistorico = [];
    }
    
    // Adicionar "KPIs Atingidos" se houver
    if (kpisArrayHistorico && Array.isArray(kpisArrayHistorico) && kpisArrayHistorico.length > 0 && (dados.bonus_kpis || 0) > 0) {
      historicoCompleto.push({
        data: dataFormatada,
        valor: dados.bonus_kpis || 0,
        atividade: 'KPIs Atingidos',
        turno: item.turno,
        aprovadoPor: item.aprovado_por_nome || 'Sistema',
        kpis_atingidos: item.kpis_atingidos,
        tarefas_validas: item.tarefas_validas,
        valor_tarefas: item.valor_tarefas,
        bonus_kpis: item.bonus_kpis,
        subtotal_atividades: item.subtotal_atividades
      });
    }
  }
});

// Ordenar histórico por data
const historicoOrdenado = historicoCompleto.sort((a, b) => {
  const dateA = new Date(a.data.split('/').reverse().join('-'));
  const dateB = new Date(b.data.split('/').reverse().join('-'));
  return dateB.getTime() - dateA.getTime();
});

console.log(`\n📋 Total no histórico completo: ${historicoOrdenado.length}`);

// Calcular totais corrigidos
let totalKpis = 0;
let totalBonusKpis = 0;
let totalTarefasValidas = 0;
let totalValorTarefas = 0;

historicoOrdenado.forEach(item => {
  if (item.kpis_atingidos) {
    let kpisArray = [];
    try {
      if (typeof item.kpis_atingidos === 'string') {
        kpisArray = JSON.parse(item.kpis_atingidos);
      } else if (Array.isArray(item.kpis_atingidos)) {
        kpisArray = item.kpis_atingidos;
      }
    } catch (e) {
      kpisArray = [];
    }
    totalKpis += kpisArray.length;
  }
  
  totalBonusKpis += item.bonus_kpis || 0;
  totalTarefasValidas += item.tarefas_validas || 0;
  totalValorTarefas += item.valor_tarefas || 0;
});

console.log('\n=== RESULTADOS APÓS CORREÇÕES ===');
console.log(`🎯 Total KPIs: ${totalKpis} (R$ ${totalBonusKpis.toFixed(2)})`);
console.log(`📋 Total Tarefas Válidas: ${totalTarefasValidas}`);
console.log(`💰 Valor Total das Tarefas: R$ ${totalValorTarefas.toFixed(2)}`);
console.log(`💵 Ganho Total: R$ ${ganhoTotal.toFixed(2)}`);

console.log('\n=== COMPARAÇÃO ===');
console.log('ANTES (Dashboard bugado):');
console.log('  - 21 KPIs (R$ 63,00)');
console.log('  - 1793 tarefas válidas');
console.log('  - 12 lançamentos no histórico');
console.log('');
console.log('DEPOIS (Corrigido):');
console.log(`  - ${totalKpis} KPIs (R$ ${totalBonusKpis.toFixed(2)})`);
console.log(`  - ${totalTarefasValidas} tarefas válidas`);
console.log(`  - ${historicoOrdenado.length} lançamentos no histórico`);

// Analisar cada lançamento
console.log('\n=== ANÁLISE DETALHADA DOS LANÇAMENTOS ===');
lancamentosUnicos.forEach((item, index) => {
  console.log(`\n--- Lançamento ${index + 1} (ID: ${item.id}) ---`);
  console.log(`Data: ${item.data_lancamento}`);
  console.log(`Atividade: ${item.nome_atividade || 'null'}`);
  console.log(`Tarefas Válidas: ${item.tarefas_validas || 'null'}`);
  console.log(`KPIs: ${item.kpis_atingidos}`);
  console.log(`Bonus KPIs: R$ ${(item.bonus_kpis || 0).toFixed(2)}`);
  console.log(`Remuneração Total: R$ ${(item.remuneracao_total || 0).toFixed(2)}`);
  
  // Verificar se será adicionado ao histórico
  let adicionadoTarefas = false;
  let adicionadoKpis = false;
  
  if (item.tarefas_validas && item.tarefas_validas > 0) {
    adicionadoTarefas = true;
  }
  
  let kpisArray = [];
  try {
    if (item.kpis_atingidos && typeof item.kpis_atingidos === 'string') {
      kpisArray = JSON.parse(item.kpis_atingidos);
    }
  } catch (e) {
    kpisArray = [];
  }
  
  if (kpisArray.length > 0 && (item.bonus_kpis || 0) > 0) {
    adicionadoKpis = true;
  }
  
  console.log(`Histórico - Tarefas: ${adicionadoTarefas ? '✅' : '❌'}`);
  console.log(`Histórico - KPIs: ${adicionadoKpis ? '✅' : '❌'}`);
});

// Salvar resultado
const resultado = {
  totalLancamentos: dadosUsuario.length,
  lancamentosUnicos: lancamentosUnicos.length,
  historicoCompleto: historicoOrdenado.length,
  ganhoTotal: ganhoTotal,
  totais: {
    kpis: totalKpis,
    bonusKpis: totalBonusKpis,
    tarefasValidas: totalTarefasValidas,
    valorTarefas: totalValorTarefas
  },
  correcaoAplicada: true,
  bugCorrigido: 'Parsing de KPIs de string JSON para Array'
};

fs.writeFileSync('test-corrections-result.json', JSON.stringify(resultado, null, 2));
console.log('\n📄 Resultado salvo em test-corrections-result.json');

if (historicoOrdenado.length > 12) {
  console.log('\n✅ SUCESSO! A correção aumentou o número de lançamentos no histórico.');
  console.log('   Agora os KPIs estão sendo processados corretamente.');
} else {
  console.log('\n⚠️ O número de lançamentos ainda está em 12. Pode haver outros problemas.');
}

console.log('\n🎯 PRÓXIMOS PASSOS:');
console.log('   1. Testar o dashboard no navegador');
console.log('   2. Verificar se os valores estão corretos');
console.log('   3. Confirmar se o histórico mostra todos os lançamentos');