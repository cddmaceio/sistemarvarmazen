// Script para identificar e corrigir o problema de formatação de data

const formatDateSafe = (dateString) => {
  if (!dateString) return '';
  
  // Se a data contém timezone (Z ou +/-), extrair apenas a parte da data
  const dateOnly = dateString.split('T')[0];
  const [year, month, day] = dateOnly.split('-');
  
  // Criar data local sem conversão de timezone
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  return date.toLocaleDateString('pt-BR');
};

// Simular os dados exatos dos logs
const dadosReais = [
  {
    id: 88,
    data_lancamento: '2025-08-04',
    nome_atividade: 'Prod Repack',
    remuneracao_total: 15,
    status: 'aprovado',
    turno: 'Manhã',
    kpis_atingidos: '["Ressuprimento","EFC"]',
    multiple_activities: '[{"nome_atividade":"Prod Repack","valor":3.25},{"nome_atividade":"Prod Devolução","valor":3.25}]'
  },
  {
    id: 87,
    data_lancamento: '2025-08-02',
    nome_atividade: 'Prod Repack',
    remuneracao_total: 12.5,
    status: 'aprovado',
    turno: 'Manhã',
    kpis_atingidos: '["Ressuprimento","EFC"]',
    multiple_activities: '[{"nome_atividade":"Prod Repack","valor":3.25},{"nome_atividade":"Prod Devolução","valor":3.25}]'
  },
  {
    id: 84,
    data_lancamento: '2025-08-01',
    nome_atividade: 'Prod Repack',
    remuneracao_total: 12.75,
    status: 'aprovado',
    turno: 'Manhã',
    kpis_atingidos: '["Ressuprimento","EFC"]',
    multiple_activities: '[{"nome_atividade":"Prod Repack","valor":9}]'
  }
];

console.log('🔍 TESTE: Formatação de datas dos dados reais:');
dadosReais.forEach(item => {
  const dataFormatada = formatDateSafe(item.data_lancamento);
  console.log(`ID ${item.id}: ${item.data_lancamento} -> ${dataFormatada}`);
});

console.log('\n🔍 TESTE: Processamento de multiple_activities:');

const historicoCompleto = [];

dadosReais.forEach(item => {
  const dataFormatada = formatDateSafe(item.data_lancamento);
  
  console.log(`\n📋 Processando item ID ${item.id}:`);
  console.log(`  Data original: ${item.data_lancamento}`);
  console.log(`  Data formatada: ${dataFormatada}`);
  
  // Simular o processamento de multiple_activities
  if (item.multiple_activities) {
    try {
      const atividades = JSON.parse(item.multiple_activities);
      console.log(`  Multiple activities:`, atividades);
      
      atividades.forEach((atividade, index) => {
        console.log(`    Atividade ${index + 1}: ${atividade.nome_atividade} - Valor: ${atividade.valor}`);
        
        historicoCompleto.push({
          data: dataFormatada,
          valor: atividade.valor,
          atividade: atividade.nome_atividade,
          turno: item.turno,
          aprovadoPor: 'Sistema',
          id_original: item.id
        });
      });
    } catch (e) {
      console.log(`  Erro ao processar multiple_activities:`, e.message);
    }
  }
});

console.log('\n📊 HISTÓRICO COMPLETO GERADO:');
historicoCompleto.forEach((item, index) => {
  console.log(`${index + 1}. Data: ${item.data}, Atividade: ${item.atividade}, Valor: ${item.valor}, ID Original: ${item.id_original}`);
});

console.log('\n🔍 TESTE: Agrupamento por data:');
const agrupado = {};
historicoCompleto.forEach(item => {
  if (!agrupado[item.data]) {
    agrupado[item.data] = [];
  }
  agrupado[item.data].push(item);
});

Object.keys(agrupado).forEach(data => {
  console.log(`${data}: ${agrupado[data].length} item(s)`);
  agrupado[data].forEach(item => {
    console.log(`  - ${item.atividade}: R$ ${item.valor} (ID Original: ${item.id_original})`);
  });
});

console.log('\n✅ Teste concluído!');