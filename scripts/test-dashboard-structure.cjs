// Script para verificar a estrutura do componente ProductivityDashboard
const fs = require('fs');
const path = require('path');

console.log('🔍 Analisando estrutura do ProductivityDashboard...');

const dashboardPath = path.join(__dirname, '..', 'src', 'components', 'ProductivityDashboard.tsx');

try {
  const content = fs.readFileSync(dashboardPath, 'utf8');
  
  console.log('✅ Arquivo ProductivityDashboard.tsx encontrado');
  
  // Verificações estruturais
  const checks = {
    'Contém export default': content.includes('export default ProductivityDashboard'),
    'Contém useState para activeTab': content.includes('useState') && content.includes('activeTab'),
    'Contém navegação de abas': content.includes('Resumo Geral') && content.includes('Relatório Individual'),
    'Contém seção individual': content.includes('activeTab === \'individual\''),
    'Contém componente Card': content.includes('Card'),
    'Contém imports necessários': content.includes('import React') && content.includes('useState'),
    'Estrutura JSX válida': !content.includes('<<') && !content.includes('>>'),
    'Fechamento de tags correto': (() => {
      // Verificar se há tags não fechadas básicas
      const openDivs = (content.match(/<div/g) || []).length;
      const closeDivs = (content.match(/<\/div>/g) || []).length;
      const openCards = (content.match(/<Card[^>]*>/g) || []).length;
      const closeCards = (content.match(/<\/Card>/g) || []).length;
      
      return Math.abs(openDivs - closeDivs) <= 2 && Math.abs(openCards - closeCards) <= 1; // Tolerância pequena
    })()
  };
  
  console.log('\n📊 Verificações estruturais:');
  Object.entries(checks).forEach(([check, result]) => {
    console.log(`${result ? '✅' : '❌'} ${check}`);
  });
  
  // Verificar especificamente a seção de abas
  console.log('\n🔍 Analisando navegação de abas...');
  
  const tabNavigation = content.match(/activeTab === 'resumo'[\s\S]*?activeTab === 'individual'/g);
  if (tabNavigation) {
    console.log('✅ Navegação de abas encontrada');
  } else {
    console.log('❌ Navegação de abas não encontrada');
  }
  
  // Verificar a seção individual especificamente
  console.log('\n🔍 Analisando seção de Relatório Individual...');
  
  const individualSection = content.match(/activeTab === 'individual'[\s\S]*?(?=\}\s*\}\s*<\/div>|$)/g);
  if (individualSection && individualSection[0]) {
    const section = individualSection[0];
    
    const individualChecks = {
      'Contém filtros de colaborador': section.includes('selectedColaborador'),
      'Contém seleção de mês/ano': section.includes('selectedMesAnoIndividual'),
      'Contém botão gerar relatório': section.includes('Gerar Relatório') || section.includes('loadIndividualReport'),
      'Contém card de resumo': section.includes('individualReportData'),
      'Contém tabela de extrato': section.includes('Extrato Detalhado'),
      'Estrutura condicional correta': section.includes('individualReportData &&')
    };
    
    console.log('\n📋 Verificações da seção individual:');
    Object.entries(individualChecks).forEach(([check, result]) => {
      console.log(`${result ? '✅' : '❌'} ${check}`);
    });
    
    // Verificar se há problemas de sintaxe na seção individual
    const syntaxIssues = [];
    
    if (section.includes('{{')) syntaxIssues.push('Chaves duplas encontradas');
    if (section.includes('}}')) syntaxIssues.push('Fechamento de chaves duplas');
    if ((section.match(/\{/g) || []).length !== (section.match(/\}/g) || []).length) {
      syntaxIssues.push('Chaves desbalanceadas');
    }
    
    if (syntaxIssues.length > 0) {
      console.log('\n🚨 Problemas de sintaxe encontrados:');
      syntaxIssues.forEach(issue => console.log(`❌ ${issue}`));
    } else {
      console.log('\n✅ Nenhum problema de sintaxe óbvio encontrado na seção individual');
    }
    
  } else {
    console.log('❌ Seção de Relatório Individual não encontrada ou malformada');
  }
  
  // Verificar se há erros de TypeScript óbvios
  console.log('\n🔍 Verificando possíveis erros de TypeScript...');
  
  const tsIssues = [];
  
  if (content.includes('useState<') && !content.includes('React.useState')) {
    // Verificar se useState está sendo usado corretamente
    const useStateMatches = content.match(/useState<[^>]*>\([^)]*\)/g);
    if (useStateMatches) {
      useStateMatches.forEach(match => {
        if (!match.includes('(') || !match.includes(')')) {
          tsIssues.push(`useState malformado: ${match}`);
        }
      });
    }
  }
  
  if (tsIssues.length > 0) {
    console.log('🚨 Possíveis problemas de TypeScript:');
    tsIssues.forEach(issue => console.log(`❌ ${issue}`));
  } else {
    console.log('✅ Nenhum problema óbvio de TypeScript encontrado');
  }
  
  // Resumo final
  const failedChecks = Object.entries(checks).filter(([_, result]) => !result);
  
  if (failedChecks.length === 0) {
    console.log('\n🎉 Estrutura do componente parece estar correta!');
    console.log('💡 Se a aba não está aparecendo, pode ser um problema de:');
    console.log('   - Estado inicial do activeTab');
    console.log('   - CSS/styling que está ocultando a aba');
    console.log('   - Problema de renderização condicional');
    console.log('   - Erro de JavaScript em runtime');
  } else {
    console.log('\n🚨 Problemas estruturais encontrados que podem estar causando o problema:');
    failedChecks.forEach(([check]) => {
      console.log(`❌ ${check}`);
    });
  }
  
} catch (error) {
  console.error('❌ Erro ao analisar o arquivo:', error.message);
}

console.log('\n🏁 Análise concluída.');