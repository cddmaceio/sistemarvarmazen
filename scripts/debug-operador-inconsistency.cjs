const fs = require('fs');

// Simular dados reais de Dilson em agosto de 2025
const dadosUsuario = [
  // Lançamentos normais com tarefas válidas
  {
    id: 1,
    user_cpf: '12345678901',
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
    funcao: 'Operador de Empilhadeira'
  },
  {
    id: 2,
    user_cpf: '12345678901',
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
    funcao: 'Operador de Empilhadeira'
  },
  // PROBLEMA: Operador de Empilhadeira com apenas KPIs (sem tarefas válidas)
  {
    id: 3,
    user_cpf: '12345678901',
    data_lancamento: '2025-08-03',
    remuneracao_total: 9.00,
    nome_atividade: '', // Sem atividade específica
    kpis_atingidos: '["Pontualidade", "Produtividade", "Eficiência"]',
    tarefas_validas: 0, // SEM TAREFAS VÁLIDAS!
    valor_tarefas: 0,
    bonus_kpis: 9.00,
    subtotal_atividades: 0,
    turno: 'Manhã',
    aprovado_por_nome: 'Admin',
    funcao: 'Operador de Empilhadeira' // INCONSISTÊNCIA!
  },
  // PROBLEMA: Operador de Empilhadeira com atividade de Ajudante
  {
    id: 4,
    user_cpf: '12345678901',
    data_lancamento: '2025-08-04',
    remuneracao_total: 15.00,
    nome_atividade: 'Limpeza e Organização', // Atividade típica de Ajudante
    multiple_activities: '[{"nome_atividade": "Limpeza e Organização", "valor": 12.00}, {"nome_atividade": "Organização de Estoque", "valor": 3.00}]',
    kpis_atingidos: '["Pontualidade"]',
    tarefas_validas: 0, // SEM TAREFAS VÁLIDAS!
    valor_tarefas: 0,
    bonus_kpis: 3.00,
    subtotal_atividades: 12.00,
    turno: 'Tarde',
    aprovado_por_nome: 'Admin',
    funcao: 'Operador de Empilhadeira' // INCONSISTÊNCIA!
  },
  // Mais alguns lançamentos normais
  {
    id: 5,
    user_cpf: '12345678901',
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
    funcao: 'Operador de Empilhadeira'
  }
];

// Adicionar mais 7 lançamentos normais para totalizar 12
for (let i = 6; i <= 12; i++) {
  const dia = String(i + 5).padStart(2, '0');
  dadosUsuario.push({
    id: i,
    user_cpf: '12345678901',
    data_lancamento: `2025-08-${dia}`,
    remuneracao_total: Math.round((Math.random() * 20 + 10) * 100) / 100,
    nome_atividade: ['Separação de Pedidos', 'Carregamento', 'Movimentação de Pallets'][Math.floor(Math.random() * 3)],
    kpis_atingidos: Math.random() > 0.3 ? '["Pontualidade", "Produtividade"]' : '[]',
    tarefas_validas: Math.floor(Math.random() * 80 + 20),
    valor_tarefas: Math.round((Math.random() * 40 + 10) * 100) / 100,
    bonus_kpis: Math.random() > 0.3 ? Math.round((Math.random() * 10 + 2) * 100) / 100 : 0,
    subtotal_atividades: Math.round((Math.random() * 50 + 15) * 100) / 100,
    turno: ['Manhã', 'Tarde'][Math.floor(Math.random() * 2)],
    aprovado_por_nome: 'Admin',
    funcao: 'Operador de Empilhadeira'
  });
}

console.log('=== ANÁLISE DE INCONSISTÊNCIAS - OPERADOR DE EMPILHADEIRA ===');
console.log(`Total de lançamentos: ${dadosUsuario.length}`);

// Função para formatar data
function formatDateSafe(dateString) {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  } catch {
    return dateString;
  }
}

// Analisar cada lançamento para identificar inconsistências
const inconsistencias = [];
const historicoCompleto = [];
const userFunction = 'Operador de Empilhadeira';

console.log('\n=== ANÁLISE DETALHADA POR LANÇAMENTO ===');

dadosUsuario.forEach((item, index) => {
  console.log(`\n--- Lançamento ${index + 1} (ID: ${item.id}) ---`);
  console.log(`Data: ${item.data_lancamento}`);
  console.log(`Função: ${item.funcao}`);
  console.log(`Nome Atividade: "${item.nome_atividade}"`);
  console.log(`Tarefas Válidas: ${item.tarefas_validas}`);
  console.log(`KPIs: ${item.kpis_atingidos}`);
  console.log(`Multiple Activities: ${item.multiple_activities || 'null'}`);
  
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
  
  // Verificar inconsistências para Operador de Empilhadeira
  if (userFunction === 'Operador de Empilhadeira') {
    let temInconsistencia = false;
    let motivoInconsistencia = [];
    
    // 1. Operador com multiple_activities (típico de Ajudante)
    if (dados.multiple_activities && Array.isArray(dados.multiple_activities)) {
      temInconsistencia = true;
      motivoInconsistencia.push('Operador de Empilhadeira com multiple_activities (típico de Ajudante)');
    }
    
    // 2. Operador sem tarefas válidas mas com atividade específica
    if ((!dados.tarefas_validas || dados.tarefas_validas === 0) && dados.nome_atividade && dados.nome_atividade.trim() !== '') {
      temInconsistencia = true;
      motivoInconsistencia.push('Operador com atividade específica mas sem tarefas válidas');
    }
    
    // 3. Operador apenas com KPIs (sem tarefas válidas)
    if ((!dados.tarefas_validas || dados.tarefas_validas === 0) && dados.kpis_atingidos && dados.kpis_atingidos !== '[]') {
      temInconsistencia = true;
      motivoInconsistencia.push('Operador apenas com KPIs, sem tarefas válidas');
    }
    
    if (temInconsistencia) {
      inconsistencias.push({
        id: item.id,
        data: item.data_lancamento,
        motivos: motivoInconsistencia,
        dados: dados
      });
      console.log(`❌ INCONSISTÊNCIA DETECTADA:`);
      motivoInconsistencia.forEach(motivo => {
        console.log(`   - ${motivo}`);
      });
    } else {
      console.log(`✅ Lançamento consistente`);
    }
    
    // Simular criação do histórico (como no frontend)
    let adicionadoAoHistorico = false;
    
    // Adicionar "Tarefas Válidas" se houver
    if (dados.tarefas_validas && dados.tarefas_validas > 0) {
      historicoCompleto.push({
        data: dataFormatada,
        valor: item.remuneracao_total,
        atividade: 'Tarefas Válidas',
        turno: item.turno,
        aprovadoPor: item.aprovado_por_nome || 'Sistema',
        origem: `Lançamento ${item.id}`
      });
      adicionadoAoHistorico = true;
      console.log(`   → Adicionado ao histórico: Tarefas Válidas`);
    }
    
    // Adicionar "KPIs Atingidos" se houver
    let kpisArray = [];
    try {
      if (dados.kpis_atingidos && typeof dados.kpis_atingidos === 'string') {
        kpisArray = JSON.parse(dados.kpis_atingidos);
      } else if (Array.isArray(dados.kpis_atingidos)) {
        kpisArray = dados.kpis_atingidos;
      }
    } catch (e) {
      kpisArray = [];
    }
    
    if (kpisArray && Array.isArray(kpisArray) && kpisArray.length > 0 && (dados.bonus_kpis || 0) > 0) {
      historicoCompleto.push({
        data: dataFormatada,
        valor: dados.bonus_kpis || 0,
        atividade: 'KPIs Atingidos',
        turno: item.turno,
        aprovadoPor: item.aprovado_por_nome || 'Sistema',
        origem: `Lançamento ${item.id}`
      });
      adicionadoAoHistorico = true;
      console.log(`   → Adicionado ao histórico: KPIs Atingidos`);
    }
    
    if (!adicionadoAoHistorico) {
      console.log(`   → NÃO adicionado ao histórico (não atende condições)`);
    }
  }
});

console.log('\n=== RESUMO DAS INCONSISTÊNCIAS ===');
if (inconsistencias.length > 0) {
  console.log(`❌ ${inconsistencias.length} inconsistências encontradas:`);
  inconsistencias.forEach((inc, index) => {
    console.log(`\n${index + 1}. Lançamento ID ${inc.id} (${inc.data}):`);
    inc.motivos.forEach(motivo => {
      console.log(`   - ${motivo}`);
    });
  });
} else {
  console.log(`✅ Nenhuma inconsistência encontrada`);
}

console.log('\n=== IMPACTO NO HISTÓRICO ===');
console.log(`Total de itens no histórico: ${historicoCompleto.length}`);
console.log(`Lançamentos originais: ${dadosUsuario.length}`);
console.log(`Diferença: ${dadosUsuario.length - historicoCompleto.length} lançamentos não geraram histórico`);

// Agrupar histórico por origem
const historicoPorOrigem = {};
historicoCompleto.forEach(item => {
  if (!historicoPorOrigem[item.origem]) {
    historicoPorOrigem[item.origem] = [];
  }
  historicoPorOrigem[item.origem].push(item.atividade);
});

console.log('\n=== HISTÓRICO POR LANÇAMENTO ===');
Object.keys(historicoPorOrigem).forEach(origem => {
  console.log(`${origem}: ${historicoPorOrigem[origem].join(', ')}`);
});

// Verificar se algum lançamento não gerou histórico
const lancamentosSemHistorico = dadosUsuario.filter(item => {
  const origem = `Lançamento ${item.id}`;
  return !historicoPorOrigem[origem];
});

if (lancamentosSemHistorico.length > 0) {
  console.log('\n=== LANÇAMENTOS SEM HISTÓRICO ===');
  lancamentosSemHistorico.forEach(item => {
    console.log(`❌ Lançamento ${item.id} (${item.data_lancamento}) não gerou histórico`);
    console.log(`   Tarefas válidas: ${item.tarefas_validas}`);
    console.log(`   KPIs: ${item.kpis_atingidos}`);
    console.log(`   Bônus KPIs: ${item.bonus_kpis}`);
  });
}

console.log('\n=== CONCLUSÃO ===');
if (inconsistencias.length > 0) {
  console.log(`❌ Encontradas ${inconsistencias.length} inconsistências que podem estar causando a discrepância`);
  console.log(`   Essas inconsistências fazem com que alguns lançamentos não sejam exibidos corretamente no dashboard`);
} else {
  console.log(`✅ Não foram encontradas inconsistências óbvias`);
}

// Salvar resultado
const resultado = {
  totalLancamentos: dadosUsuario.length,
  totalHistorico: historicoCompleto.length,
  inconsistencias: inconsistencias,
  lancamentosSemHistorico: lancamentosSemHistorico.map(item => ({
    id: item.id,
    data: item.data_lancamento,
    tarefas_validas: item.tarefas_validas,
    kpis_atingidos: item.kpis_atingidos,
    bonus_kpis: item.bonus_kpis
  }))
};

fs.writeFileSync('debug-operador-inconsistency-result.json', JSON.stringify(resultado, null, 2));
console.log('\n📄 Resultado salvo em debug-operador-inconsistency-result.json');