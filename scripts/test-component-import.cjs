// Script para testar se o componente ProductivityDashboard pode ser importado
const fs = require('fs');
const path = require('path');

console.log('🔍 Testando importação do componente ProductivityDashboard...');

// Verificar se todos os arquivos necessários existem
const filesToCheck = [
  'src/components/ProductivityDashboard.tsx',
  'src/components/Card.tsx',
  'src/components/UserMenu.tsx',
  'src/hooks/useAuth.tsx'
];

const missingFiles = [];
filesToCheck.forEach(file => {
  const fullPath = path.join(__dirname, '..', file);
  if (!fs.existsSync(fullPath)) {
    missingFiles.push(file);
  }
});

if (missingFiles.length > 0) {
  console.log('❌ Arquivos necessários não encontrados:');
  missingFiles.forEach(file => console.log(`   - ${file}`));
} else {
  console.log('✅ Todos os arquivos necessários encontrados');
}

// Verificar imports no ProductivityDashboard
const dashboardPath = path.join(__dirname, '..', 'src', 'components', 'ProductivityDashboard.tsx');
const content = fs.readFileSync(dashboardPath, 'utf8');

console.log('\n🔍 Verificando imports...');

const imports = [
  { name: 'React', pattern: /import React/ },
  { name: 'useState, useEffect', pattern: /import.*useState.*useEffect/ },
  { name: 'Card components', pattern: /import.*Card.*from.*Card/ },
  { name: 'Icons', pattern: /import.*from.*lucide-react/ },
  { name: 'UserMenu', pattern: /import.*UserMenu/ },
  { name: 'XLSX', pattern: /import.*XLSX/ }
];

imports.forEach(({ name, pattern }) => {
  const found = pattern.test(content);
  console.log(`${found ? '✅' : '❌'} ${name}`);
});

// Verificar se há problemas de sintaxe TypeScript óbvios
console.log('\n🔍 Verificando sintaxe TypeScript...');

const syntaxChecks = [
  { name: 'Interfaces definidas', check: content.includes('interface') },
  { name: 'Tipos useState corretos', check: !content.includes('useState<>') },
  { name: 'Export default presente', check: content.includes('export default ProductivityDashboard') },
  { name: 'Função principal definida', check: content.includes('const ProductivityDashboard') || content.includes('function ProductivityDashboard') },
  { name: 'Return statement presente', check: content.includes('return (') }
];

syntaxChecks.forEach(({ name, check }) => {
  console.log(`${check ? '✅' : '❌'} ${name}`);
});

// Verificar se há console.errors ou problemas óbvios
console.log('\n🔍 Verificando possíveis problemas de runtime...');

const runtimeChecks = [
  { name: 'Sem console.error', check: !content.includes('console.error') },
  { name: 'Sem throw new Error', check: !content.includes('throw new Error') },
  { name: 'useEffect com dependências', check: content.includes('useEffect(') && content.includes('], [') },
  { name: 'Event handlers definidos', check: content.includes('onClick') || content.includes('onChange') }
];

runtimeChecks.forEach(({ name, check }) => {
  console.log(`${check ? '✅' : '❌'} ${name}`);
});

// Verificar especificamente a lógica de abas
console.log('\n🔍 Verificando lógica de abas...');

const tabChecks = [
  { name: 'Estado activeTab definido', check: content.includes("useState<string>('resumo')") || content.includes("useState('resumo')") },
  { name: 'Função setActiveTab usada', check: content.includes('setActiveTab') },
  { name: 'Navegação de abas presente', check: content.includes("onClick={() => setActiveTab('individual')") },
  { name: 'Renderização condicional individual', check: content.includes("activeTab === 'individual'") },
  { name: 'Botão aba individual presente', check: content.includes('Relatório Individual') }
];

tabChecks.forEach(({ name, check }) => {
  console.log(`${check ? '✅' : '❌'} ${name}`);
});

// Verificar se há problemas específicos na seção individual
console.log('\n🔍 Analisando seção individual detalhadamente...');

const individualSectionMatch = content.match(/(activeTab === 'individual'[\s\S]*?)(?=\}\s*<\/div>\s*\);|$)/g);

if (individualSectionMatch && individualSectionMatch[0]) {
  const section = individualSectionMatch[0];
  
  const individualChecks = [
    { name: 'Filtro de colaborador', check: section.includes('selectedColaborador') },
    { name: 'Filtro de mês/ano', check: section.includes('selectedMesAnoIndividual') },
    { name: 'Botão gerar relatório', check: section.includes('loadIndividualReport') },
    { name: 'Dados do relatório', check: section.includes('individualReportData') },
    { name: 'Loading state', check: section.includes('individualLoading') },
    { name: 'Renderização condicional', check: section.includes('individualReportData &&') }
  ];
  
  individualChecks.forEach(({ name, check }) => {
    console.log(`${check ? '✅' : '❌'} ${name}`);
  });
  
  // Verificar se há problemas de JSX na seção
  const jsxIssues = [];
  
  if (section.includes('<>') && !section.includes('</>')) {
    jsxIssues.push('Fragment não fechado');
  }
  
  if (section.includes('className="') && !section.includes('"')) {
    jsxIssues.push('Atributo className malformado');
  }
  
  if (jsxIssues.length > 0) {
    console.log('\n🚨 Problemas JSX na seção individual:');
    jsxIssues.forEach(issue => console.log(`❌ ${issue}`));
  } else {
    console.log('\n✅ Nenhum problema JSX óbvio na seção individual');
  }
  
} else {
  console.log('❌ Seção individual não encontrada ou malformada');
}

// Verificar se o problema pode estar no CSS ou styling
console.log('\n🔍 Verificando possíveis problemas de CSS/styling...');

const stylingChecks = [
  { name: 'Classes Tailwind presentes', check: content.includes('className=') },
  { name: 'Sem display:none inline', check: !content.includes('display: none') && !content.includes('display:none') },
  { name: 'Sem visibility:hidden', check: !content.includes('visibility: hidden') && !content.includes('visibility:hidden') }
];

stylingChecks.forEach(({ name, check }) => {
  console.log(`${check ? '✅' : '❌'} ${name}`);
});

console.log('\n🏁 Análise de importação concluída.');
console.log('\n💡 Próximos passos sugeridos:');
console.log('1. Verificar se há erros no console do navegador');
console.log('2. Verificar se o estado inicial activeTab está correto');
console.log('3. Verificar se há problemas de CSS que estão ocultando a aba');
console.log('4. Testar a funcionalidade de troca de abas manualmente');