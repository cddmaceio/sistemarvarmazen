const fs = require('fs');

// Simular dados de Dilson em agosto de 2025
const dadosUsuario = [
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
  {
    id: 3,
    user_cpf: '12345678901',
    data_lancamento: '2025-08-03',
    remuneracao_total: 18.75,
    nome_atividade: 'Organização',
    kpis_atingidos: '["Pontualidade", "Produtividade", "Eficiência"]',
    tarefas_validas: 60,
    valor_tarefas: 30.00,
    bonus_kpis: 9.00,
    subtotal_atividades: 39.00,
    turno: 'Manhã',
    aprovado_por_nome: 'Admin',
    funcao: 'Operador de Empilhadeira'
  }
];

// Adicionar mais 36 lançamentos para simular os 39 totais
for (let i = 4; i <= 39; i++) {
  const dia = String(i).padStart(2, '0');
  dadosUsuario.push({
    id: i,
    user_cpf: '12345678901',
    data_lancamento: `2025-08-${dia}`,
    remuneracao_total: Math.round((Math.random() * 20 + 10) * 100) / 100,
    nome_atividade: ['Separação de Pedidos', 'Carregamento', 'Organização'][Math.floor(Math.random() * 3)],
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

console.log('=== SIMULAÇÃO COMPLETA DO FRONTEND ===');
console.log(`Total de lançamentos: ${dadosUsuario.length}`);

// Simular filtro de mês (agosto de 2025)
const mesAtual = new Date('2025-08-15'); // Simular que estamos em agosto
const dadosFiltrados = dadosUsuario.filter(item => {
  const dataLancamento = new Date(item.data_lancamento);
  return dataLancamento.getMonth() === mesAtual.getMonth() &&
         dataLancamento.getFullYear() === mesAtual.getFullYear();
});

console.log(`Após filtro de mês: ${dadosFiltrados.length}`);

// Simular filtro de lançamentos únicos (como no frontend)
const lancamentosUnicos = dadosFiltrados.filter((item, index, array) => {
  return array.findIndex(i => i.id === item.id) === index;
});

console.log(`Após filtro de únicos: ${lancamentosUnicos.length}`);

// Função para formatar data (como no frontend)
function formatDateSafe(dateString) {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  } catch {
    return dateString;
  }
}

// Simular criação do histórico completo (como no DashboardCollaborator.tsx)
const historicoCompleto = [];
const userFunction = 'Operador de Empilhadeira';

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
    // Adicionar ao histórico completo baseado no tipo de lançamento
    if (dados.tarefas_validas && dados.tarefas_validas > 0) {
      historicoCompleto.push({
        data: dataFormatada,
        valor: item.remuneracao_total,
        atividade: 'Tarefas Válidas',
        turno: item.turno,
        aprovadoPor: item.aprovado_por_nome || item.aprovado_por || 'Sistema',
        kpis_atingidos: item.kpis_atingidos,
        tarefas_validas: item.tarefas_validas,
        valor_tarefas: item.valor_tarefas,
        bonus_kpis: item.bonus_kpis,
        subtotal_atividades: item.subtotal_atividades
      });
    }
    
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
        aprovadoPor: item.aprovado_por_nome || item.aprovado_por || 'Sistema',
        kpis_atingidos: item.kpis_atingidos,
        tarefas_validas: item.tarefas_validas,
        valor_tarefas: item.valor_tarefas,
        bonus_kpis: item.bonus_kpis,
        subtotal_atividades: item.subtotal_atividades
      });
    }
  }
});

console.log(`\nHistórico completo criado: ${historicoCompleto.length} itens`);

// Simular ordenação (como no frontend)
const historicoOrdenado = historicoCompleto.sort((a, b) => {
  const dateA = new Date(a.data.split('/').reverse().join('-'));
  const dateB = new Date(b.data.split('/').reverse().join('-'));
  return dateB.getTime() - dateA.getTime();
});

console.log(`Após ordenação: ${historicoOrdenado.length} itens`);

// Verificar se há duplicatas por data
const datasCounts = {};
historicoOrdenado.forEach(item => {
  const key = `${item.data}-${item.atividade}`;
  datasCounts[key] = (datasCounts[key] || 0) + 1;
});

console.log('\n=== ANÁLISE DE DUPLICATAS ===');
const duplicatas = Object.entries(datasCounts).filter(([key, count]) => count > 1);
if (duplicatas.length > 0) {
  console.log('Duplicatas encontradas:');
  duplicatas.forEach(([key, count]) => {
    console.log(`  ${key}: ${count} ocorrências`);
  });
} else {
  console.log('Nenhuma duplicata encontrada');
}

// Simular agrupamento por data (se houver)
const agrupadoPorData = {};
historicoOrdenado.forEach(item => {
  if (!agrupadoPorData[item.data]) {
    agrupadoPorData[item.data] = [];
  }
  agrupadoPorData[item.data].push(item);
});

console.log('\n=== AGRUPAMENTO POR DATA ===');
const datasUnicas = Object.keys(agrupadoPorData);
console.log(`Datas únicas: ${datasUnicas.length}`);
datasUnicas.slice(0, 5).forEach(data => {
  console.log(`  ${data}: ${agrupadoPorData[data].length} itens`);
});

// Verificar se há alguma limitação implícita
console.log('\n=== VERIFICAÇÃO FINAL ===');
console.log(`Lançamentos originais: ${dadosUsuario.length}`);
console.log(`Após filtro de mês: ${dadosFiltrados.length}`);
console.log(`Após filtro de únicos: ${lancamentosUnicos.length}`);
console.log(`Histórico completo: ${historicoCompleto.length}`);
console.log(`Após ordenação: ${historicoOrdenado.length}`);

// Simular os primeiros 12 itens (como aparece no dashboard)
const primeiros12 = historicoOrdenado.slice(0, 12);
console.log(`\nPrimeiros 12 itens (simulando limitação):`);
primeiros12.forEach((item, index) => {
  console.log(`  ${index + 1}. ${item.data} - ${item.atividade} - R$ ${item.valor.toFixed(2)}`);
});

console.log('\n=== CONCLUSÃO ===');
if (historicoOrdenado.length === 12) {
  console.log('✅ O histórico tem exatamente 12 itens - coincide com o dashboard');
} else if (historicoOrdenado.length > 12) {
  console.log(`❌ O histórico tem ${historicoOrdenado.length} itens, mas o dashboard mostra apenas 12`);
  console.log('   Possível causa: limitação não identificada no frontend ou problema de renderização');
} else {
  console.log(`❌ O histórico tem apenas ${historicoOrdenado.length} itens, menos que os 12 do dashboard`);
}

// Salvar resultado em arquivo para análise
const resultado = {
  lancamentosOriginais: dadosUsuario.length,
  aposFiltroPorMes: dadosFiltrados.length,
  aposFiltroPorUnicos: lancamentosUnicos.length,
  historicoCompleto: historicoCompleto.length,
  aposOrdenacao: historicoOrdenado.length,
  primeiros12: primeiros12.map(item => ({
    data: item.data,
    atividade: item.atividade,
    valor: item.valor
  }))
};

fs.writeFileSync('debug-frontend-complete-result.json', JSON.stringify(resultado, null, 2));
console.log('\n📄 Resultado salvo em debug-frontend-complete-result.json');