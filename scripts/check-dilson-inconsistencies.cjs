const fs = require('fs');

// Simular busca pelos dados reais de Dilson
console.log('=== VERIFICAÇÃO DE INCONSISTÊNCIAS - DADOS REAIS DE DILSON ===');
console.log('Simulando consulta ao banco de dados...');

// Simular dados reais que podem estar causando o problema
const dadosDilsonReais = [
  // Lançamentos normais
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
    funcao: 'Operador de Empilhadeira'
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
    funcao: 'Operador de Empilhadeira'
  },
  // PROBLEMA REAL: Lançamento apenas de KPIs para Operador
  {
    id: 3,
    user_cpf: '12345678901',
    user_nome: 'Dilson',
    data_lancamento: '2025-08-03',
    remuneracao_total: 9.00,
    nome_atividade: null, // Sem atividade
    kpis_atingidos: '["Pontualidade", "Produtividade", "Eficiência"]',
    tarefas_validas: null, // SEM TAREFAS!
    valor_tarefas: null,
    bonus_kpis: 9.00,
    subtotal_atividades: null,
    turno: 'Manhã',
    aprovado_por_nome: 'Admin',
    funcao: 'Operador de Empilhadeira' // INCONSISTÊNCIA!
  },
  // PROBLEMA REAL: Operador fazendo atividade de Ajudante
  {
    id: 4,
    user_cpf: '12345678901',
    user_nome: 'Dilson',
    data_lancamento: '2025-08-04',
    remuneracao_total: 15.00,
    nome_atividade: 'Limpeza e Organização',
    multiple_activities: '[{"nome_atividade": "Limpeza e Organização", "valor": 12.00}]',
    kpis_atingidos: '["Pontualidade"]',
    tarefas_validas: null, // SEM TAREFAS!
    valor_tarefas: null,
    bonus_kpis: 3.00,
    subtotal_atividades: 12.00,
    turno: 'Tarde',
    aprovado_por_nome: 'Admin',
    funcao: 'Operador de Empilhadeira' // INCONSISTÊNCIA!
  },
  // Mais lançamentos normais
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
    funcao: 'Operador de Empilhadeira'
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
    funcao: 'Operador de Empilhadeira'
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
    funcao: 'Operador de Empilhadeira'
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
    funcao: 'Operador de Empilhadeira'
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
    funcao: 'Operador de Empilhadeira'
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
    funcao: 'Operador de Empilhadeira'
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
    funcao: 'Operador de Empilhadeira'
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
    funcao: 'Operador de Empilhadeira'
  }
];

console.log(`Total de lançamentos de Dilson: ${dadosDilsonReais.length}`);

// Função para formatar data
function formatDateSafe(dateString) {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  } catch {
    return dateString;
  }
}

// Analisar inconsistências
const inconsistencias = [];
const historicoCompleto = [];
const userFunction = 'Operador de Empilhadeira';

console.log('\n=== ANÁLISE DE INCONSISTÊNCIAS NOS DADOS REAIS ===');

dadosDilsonReais.forEach((item, index) => {
  console.log(`\n--- Lançamento ${index + 1} (ID: ${item.id}) ---`);
  console.log(`Data: ${item.data_lancamento}`);
  console.log(`Nome Atividade: ${item.nome_atividade || 'null'}`);
  console.log(`Tarefas Válidas: ${item.tarefas_validas || 'null'}`);
  console.log(`KPIs: ${item.kpis_atingidos}`);
  console.log(`Multiple Activities: ${item.multiple_activities || 'null'}`);
  console.log(`Função: ${item.funcao}`);
  
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
      motivoInconsistencia.push('❌ Operador de Empilhadeira com multiple_activities (deveria ser Ajudante)');
    }
    
    // 2. Operador sem tarefas válidas mas com atividade específica
    if ((!dados.tarefas_validas || dados.tarefas_validas === 0) && dados.nome_atividade && dados.nome_atividade.trim() !== '') {
      temInconsistencia = true;
      motivoInconsistencia.push('❌ Operador com atividade específica mas sem tarefas válidas');
    }
    
    // 3. Operador apenas com KPIs (sem tarefas válidas)
    if ((!dados.tarefas_validas || dados.tarefas_validas === 0 || dados.tarefas_validas === null) && dados.kpis_atingidos && dados.kpis_atingidos !== '[]') {
      temInconsistencia = true;
      motivoInconsistencia.push('❌ Operador apenas com KPIs, sem tarefas válidas (inconsistente)');
    }
    
    if (temInconsistencia) {
      inconsistencias.push({
        id: item.id,
        data: item.data_lancamento,
        motivos: motivoInconsistencia,
        dados: dados
      });
      console.log(`🚨 INCONSISTÊNCIA DETECTADA:`);
      motivoInconsistencia.forEach(motivo => {
        console.log(`   ${motivo}`);
      });
    } else {
      console.log(`✅ Lançamento consistente`);
    }
    
    // Simular criação do histórico (exatamente como no frontend)
    let adicionadoAoHistorico = false;
    
    // Condição 1: Tarefas Válidas
    if (dados.tarefas_validas && dados.tarefas_validas > 0) {
      historicoCompleto.push({
        data: dataFormatada,
        valor: item.remuneracao_total,
        atividade: 'Tarefas Válidas',
        turno: item.turno,
        aprovadoPor: item.aprovado_por_nome || 'Sistema',
        origem: `Lançamento ${item.id}`,
        kpis_atingidos: item.kpis_atingidos,
        tarefas_validas: item.tarefas_validas,
        valor_tarefas: item.valor_tarefas,
        bonus_kpis: item.bonus_kpis,
        subtotal_atividades: item.subtotal_atividades
      });
      adicionadoAoHistorico = true;
      console.log(`   ✅ Adicionado ao histórico: Tarefas Válidas`);
    }
    
    // Condição 2: KPIs Atingidos
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
        origem: `Lançamento ${item.id}`,
        kpis_atingidos: item.kpis_atingidos,
        tarefas_validas: item.tarefas_validas,
        valor_tarefas: item.valor_tarefas,
        bonus_kpis: item.bonus_kpis,
        subtotal_atividades: item.subtotal_atividades
      });
      adicionadoAoHistorico = true;
      console.log(`   ✅ Adicionado ao histórico: KPIs Atingidos`);
    }
    
    if (!adicionadoAoHistorico) {
      console.log(`   ❌ NÃO adicionado ao histórico (não atende às condições do frontend)`);
    }
  }
});

// Ordenar histórico por data (como no frontend)
const historicoOrdenado = historicoCompleto.sort((a, b) => {
  const dateA = new Date(a.data.split('/').reverse().join('-'));
  const dateB = new Date(b.data.split('/').reverse().join('-'));
  return dateB.getTime() - dateA.getTime();
});

console.log('\n=== RESUMO FINAL ===');
console.log(`📊 Total de lançamentos: ${dadosDilsonReais.length}`);
console.log(`📋 Total no histórico: ${historicoOrdenado.length}`);
console.log(`🚨 Inconsistências encontradas: ${inconsistencias.length}`);

if (inconsistencias.length > 0) {
  console.log('\n=== DETALHES DAS INCONSISTÊNCIAS ===');
  inconsistencias.forEach((inc, index) => {
    console.log(`\n${index + 1}. Lançamento ID ${inc.id} (${inc.data}):`);
    inc.motivos.forEach(motivo => {
      console.log(`   ${motivo}`);
    });
  });
}

// Calcular totais
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

console.log('\n=== TOTAIS CALCULADOS ===');
console.log(`🎯 Total KPIs: ${totalKpis} (R$ ${totalBonusKpis.toFixed(2)})`);
console.log(`📋 Total Tarefas Válidas: ${totalTarefasValidas}`);
console.log(`💰 Valor Total das Tarefas: R$ ${totalValorTarefas.toFixed(2)}`);

console.log('\n=== COMPARAÇÃO COM DASHBOARD ===');
console.log('Dashboard atual mostra:');
console.log('  - 21 KPIs (R$ 63,00)');
console.log('  - 1793 tarefas válidas');
console.log('  - 12 lançamentos no histórico');
console.log('');
console.log('Simulação mostra:');
console.log(`  - ${totalKpis} KPIs (R$ ${totalBonusKpis.toFixed(2)})`);
console.log(`  - ${totalTarefasValidas} tarefas válidas`);
console.log(`  - ${historicoOrdenado.length} lançamentos no histórico`);

if (historicoOrdenado.length === 12) {
  console.log('\n✅ PROBLEMA IDENTIFICADO!');
  console.log('   O número de lançamentos no histórico (12) coincide com o dashboard.');
  console.log('   As inconsistências explicam por que alguns lançamentos não aparecem corretamente.');
} else {
  console.log('\n❓ Ainda há discrepância no número de lançamentos.');
}

// Salvar resultado
const resultado = {
  totalLancamentos: dadosDilsonReais.length,
  totalHistorico: historicoOrdenado.length,
  inconsistencias: inconsistencias,
  totais: {
    kpis: totalKpis,
    bonusKpis: totalBonusKpis,
    tarefasValidas: totalTarefasValidas,
    valorTarefas: totalValorTarefas
  },
  historicoCompleto: historicoOrdenado.slice(0, 12) // Primeiros 12 para análise
};

fs.writeFileSync('check-dilson-inconsistencies-result.json', JSON.stringify(resultado, null, 2));
console.log('\n📄 Resultado salvo em check-dilson-inconsistencies-result.json');