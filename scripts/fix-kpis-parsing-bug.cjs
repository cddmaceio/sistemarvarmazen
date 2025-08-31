const fs = require('fs');

console.log('=== DIAGNÓSTICO DO BUG DE PARSING DOS KPIs ===');

// Simular dados como vêm do banco (kpis_atingidos como string JSON)
const dadosDoBanco = [
  {
    id: 1,
    data_lancamento: '2025-08-01',
    kpis_atingidos: '["Pontualidade", "Produtividade"]', // STRING JSON
    bonus_kpis: 6.00,
    tarefas_validas: 50,
    funcao: 'Operador de Empilhadeira'
  },
  {
    id: 2,
    data_lancamento: '2025-08-02',
    kpis_atingidos: '["Eficiência"]', // STRING JSON
    bonus_kpis: 3.00,
    tarefas_validas: 40,
    funcao: 'Operador de Empilhadeira'
  },
  {
    id: 3,
    data_lancamento: '2025-08-03',
    kpis_atingidos: '["Pontualidade", "Produtividade", "Eficiência"]', // STRING JSON
    bonus_kpis: 9.00,
    tarefas_validas: null, // SEM TAREFAS - INCONSISTÊNCIA!
    funcao: 'Operador de Empilhadeira'
  },
  {
    id: 4,
    data_lancamento: '2025-08-04',
    kpis_atingidos: '[]', // ARRAY VAZIO COMO STRING
    bonus_kpis: 0,
    tarefas_validas: 45,
    funcao: 'Operador de Empilhadeira'
  }
];

console.log('\n=== TESTANDO CÓDIGO ATUAL (BUGADO) ===');

let historicoAtual = [];
dadosDoBanco.forEach((item, index) => {
  console.log(`\n--- Item ${index + 1} (ID: ${item.id}) ---`);
  console.log(`KPIs (raw): ${item.kpis_atingidos}`);
  console.log(`Tipo: ${typeof item.kpis_atingidos}`);
  console.log(`É Array? ${Array.isArray(item.kpis_atingidos)}`);
  
  const dados = {
    kpis_atingidos: item.kpis_atingidos, // Mantém como string
    bonus_kpis: item.bonus_kpis,
    tarefas_validas: item.tarefas_validas
  };
  
  // CÓDIGO ATUAL (BUGADO) - linha 223 do DashboardCollaborator.tsx
  if (dados.kpis_atingidos && Array.isArray(dados.kpis_atingidos) && dados.kpis_atingidos.length > 0) {
    console.log('✅ Passou na verificação Array.isArray() - ADICIONADO ao histórico');
    historicoAtual.push({
      id: item.id,
      atividade: 'KPIs Atingidos',
      valor: dados.bonus_kpis
    });
  } else {
    console.log('❌ NÃO passou na verificação Array.isArray() - NÃO ADICIONADO');
  }
  
  // CÓDIGO ATUAL (BUGADO) - linha 267 do DashboardCollaborator.tsx
  if (dados.kpis_atingidos && Array.isArray(dados.kpis_atingidos) && dados.kpis_atingidos.length > 0 && (dados.bonus_kpis || 0) > 0) {
    console.log('✅ Passou na verificação do histórico completo - ADICIONADO');
  } else {
    console.log('❌ NÃO passou na verificação do histórico completo - NÃO ADICIONADO');
  }
});

console.log(`\n📊 Histórico atual (bugado): ${historicoAtual.length} itens`);

console.log('\n=== TESTANDO CÓDIGO CORRIGIDO ===');

let historicoCorrigido = [];
dadosDoBanco.forEach((item, index) => {
  console.log(`\n--- Item ${index + 1} (ID: ${item.id}) ---`);
  
  const dados = {
    kpis_atingidos: item.kpis_atingidos,
    bonus_kpis: item.bonus_kpis,
    tarefas_validas: item.tarefas_validas
  };
  
  // CÓDIGO CORRIGIDO - Parse do JSON primeiro
  let kpisArray = [];
  try {
    if (dados.kpis_atingidos && typeof dados.kpis_atingidos === 'string') {
      kpisArray = JSON.parse(dados.kpis_atingidos);
    } else if (Array.isArray(dados.kpis_atingidos)) {
      kpisArray = dados.kpis_atingidos;
    }
  } catch (e) {
    console.log(`⚠️ Erro ao fazer parse do JSON: ${e.message}`);
    kpisArray = [];
  }
  
  console.log(`KPIs parseados: ${JSON.stringify(kpisArray)}`);
  console.log(`É Array? ${Array.isArray(kpisArray)}`);
  console.log(`Length: ${kpisArray.length}`);
  console.log(`Bonus KPIs: ${dados.bonus_kpis}`);
  
  // Verificação corrigida para atividades por tipo
  if (kpisArray && Array.isArray(kpisArray) && kpisArray.length > 0) {
    console.log('✅ Passou na verificação corrigida - ADICIONADO ao histórico');
    historicoCorrigido.push({
      id: item.id,
      atividade: 'KPIs Atingidos',
      valor: dados.bonus_kpis
    });
  } else {
    console.log('❌ NÃO passou na verificação corrigida - NÃO ADICIONADO');
  }
  
  // Verificação corrigida para histórico completo
  if (kpisArray && Array.isArray(kpisArray) && kpisArray.length > 0 && (dados.bonus_kpis || 0) > 0) {
    console.log('✅ Passou na verificação do histórico completo corrigido - ADICIONADO');
  } else {
    console.log('❌ NÃO passou na verificação do histórico completo corrigido - NÃO ADICIONADO');
  }
});

console.log(`\n📊 Histórico corrigido: ${historicoCorrigido.length} itens`);

console.log('\n=== ANÁLISE DO PROBLEMA ===');
console.log('🔍 PROBLEMA IDENTIFICADO:');
console.log('   1. Os dados vêm do banco como STRING JSON: "[\"Pontualidade\", \"Produtividade\"]"');
console.log('   2. O código verifica Array.isArray() diretamente na string');
console.log('   3. Array.isArray("[...]") retorna FALSE');
console.log('   4. Por isso, KPIs nunca são adicionados ao histórico');
console.log('');
console.log('✅ SOLUÇÃO:');
console.log('   1. Fazer JSON.parse() primeiro');
console.log('   2. Depois verificar se é Array');
console.log('   3. Tratar erros de parsing');

console.log('\n=== LOCAIS PARA CORRIGIR ===');
console.log('📁 Arquivo: src/react-app/pages/DashboardCollaborator.tsx');
console.log('📍 Linha ~223: Verificação para atividades por tipo');
console.log('📍 Linha ~267: Verificação para histórico completo');
console.log('');
console.log('🔧 Código atual (bugado):');
console.log('   if (dados.kpis_atingidos && Array.isArray(dados.kpis_atingidos) && dados.kpis_atingidos.length > 0)');
console.log('');
console.log('✅ Código corrigido:');
console.log('   let kpisArray = [];');
console.log('   try {');
console.log('     if (dados.kpis_atingidos && typeof dados.kpis_atingidos === "string") {');
console.log('       kpisArray = JSON.parse(dados.kpis_atingidos);');
console.log('     } else if (Array.isArray(dados.kpis_atingidos)) {');
console.log('       kpisArray = dados.kpis_atingidos;');
console.log('     }');
console.log('   } catch (e) {');
console.log('     kpisArray = [];');
console.log('   }');
console.log('   if (kpisArray && Array.isArray(kpisArray) && kpisArray.length > 0)');

// Salvar resultado
const resultado = {
  problema: 'KPIs vêm como string JSON do banco, mas código verifica Array.isArray() diretamente',
  impacto: 'KPIs nunca são adicionados ao histórico, causando discrepância nos dados',
  solucao: 'Fazer JSON.parse() antes de verificar se é Array',
  locaisParaCorrigir: [
    'DashboardCollaborator.tsx linha ~223',
    'DashboardCollaborator.tsx linha ~267'
  ],
  historicoAtual: historicoAtual.length,
  historicoCorrigido: historicoCorrigido.length,
  diferenca: historicoCorrigido.length - historicoAtual.length
};

fs.writeFileSync('fix-kpis-parsing-bug-result.json', JSON.stringify(resultado, null, 2));
console.log('\n📄 Resultado salvo em fix-kpis-parsing-bug-result.json');
console.log('\n🎯 CONCLUSÃO: Este é o bug principal que está causando a discrepância no dashboard!');