const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 Testando refatoração do Dashboard de Ganhos Mensais...');

// Verificar se o arquivo foi modificado corretamente
const dashboardPath = path.join(__dirname, 'src', 'components', 'ProductivityDashboard.tsx');

if (!fs.existsSync(dashboardPath)) {
  console.error('❌ Arquivo ProductivityDashboard.tsx não encontrado!');
  process.exit(1);
}

const dashboardContent = fs.readFileSync(dashboardPath, 'utf8');

// Verificações da refatoração
const checks = [
  {
    name: 'Importação do XLSX',
    test: () => dashboardContent.includes("import * as XLSX from 'xlsx';"),
    description: 'Verifica se a biblioteca XLSX foi importada'
  },
  {
    name: 'Interface MonthlyEarningsData atualizada',
    test: () => dashboardContent.includes('valorKpi: number;') && 
                dashboardContent.includes('valorAtividade: number;') &&
                dashboardContent.includes('valorTarefas: number;') &&
                dashboardContent.includes('valorFinal: number;') &&
                dashboardContent.includes('percentualMeta: number;'),
    description: 'Verifica se a interface foi atualizada com os novos campos'
  },
  {
    name: 'Meta fixa de R$ 300',
    test: () => dashboardContent.includes('const META_VALOR = 300;'),
    description: 'Verifica se a meta fixa foi definida'
  },
  {
    name: 'Função de exportação XLSX',
    test: () => dashboardContent.includes('const exportToXLSX = () =>') &&
                dashboardContent.includes('XLSX.writeFile(workbook, fileName);'),
    description: 'Verifica se a função de exportação foi implementada'
  },
  {
    name: 'Título atualizado',
    test: () => dashboardContent.includes('Ganhos Mensais por Colaborador'),
    description: 'Verifica se o título foi atualizado'
  },
  {
    name: 'Tabela com campos corretos',
    test: () => dashboardContent.includes('Valor KPI') &&
                dashboardContent.includes('Valor Atividade') &&
                dashboardContent.includes('Valor Tarefas') &&
                dashboardContent.includes('Valor Final') &&
                dashboardContent.includes('% da Meta'),
    description: 'Verifica se a tabela possui os campos solicitados'
  },
  {
    name: 'Botão de exportação',
    test: () => dashboardContent.includes('Exportar XLSX') &&
                dashboardContent.includes('onClick={exportToXLSX}'),
    description: 'Verifica se o botão de exportação foi adicionado'
  },
  {
    name: 'Filtros mantidos',
    test: () => dashboardContent.includes('selectedFuncao') &&
                dashboardContent.includes('selectedMesAno') &&
                dashboardContent.includes('funcoesDisponiveis'),
    description: 'Verifica se os filtros foram mantidos'
  },
  {
    name: 'Processamento de dados',
    test: () => dashboardContent.includes('const processedData = result.data.map') &&
                dashboardContent.includes('const valorFinal = valorKpi + valorAtividade + valorTarefas;') &&
                dashboardContent.includes('const percentualMeta = (valorFinal / META_VALOR) * 100;'),
    description: 'Verifica se o processamento dos dados foi implementado'
  },
  {
    name: 'Remoção de código desnecessário',
    test: () => !dashboardContent.includes('BarChart') &&
                !dashboardContent.includes('PieChart') &&
                !dashboardContent.includes('AreaChart') &&
                !dashboardContent.includes('ProductivityData'),
    description: 'Verifica se o código de gráficos foi removido'
  }
];

let passedTests = 0;
let totalTests = checks.length;

console.log('\n📋 Executando verificações...');

checks.forEach((check, index) => {
  const passed = check.test();
  const status = passed ? '✅' : '❌';
  console.log(`${status} ${index + 1}. ${check.name}: ${check.description}`);
  
  if (passed) {
    passedTests++;
  } else {
    console.log(`   ⚠️  Falha: ${check.name}`);
  }
});

console.log('\n📊 Resultado dos testes:');
console.log(`✅ Testes aprovados: ${passedTests}/${totalTests}`);
console.log(`❌ Testes falharam: ${totalTests - passedTests}/${totalTests}`);

if (passedTests === totalTests) {
  console.log('\n🎉 Todos os testes passaram! A refatoração foi implementada com sucesso.');
  console.log('\n📝 Resumo da refatoração:');
  console.log('   • Dashboard focado apenas em Ganhos Mensais por Colaborador');
  console.log('   • Tabela com campos: Nome, Função, Valor KPI, Valor Atividade, Valor Tarefas, Valor Final, % da Meta');
  console.log('   • Meta fixa de R$ 300,00');
  console.log('   • Filtros por Função e Mês/Ano mantidos');
  console.log('   • Funcionalidade de exportação XLSX implementada');
  console.log('   • Código de gráficos removido para simplificar o componente');
} else {
  console.log('\n⚠️  Alguns testes falharam. Verifique a implementação.');
  process.exit(1);
}

// Verificar se a aplicação compila
console.log('\n🔨 Verificando se a aplicação compila...');
try {
  execSync('npm run build', { stdio: 'pipe', cwd: __dirname });
  console.log('✅ Aplicação compila sem erros!');
} catch (error) {
  console.log('❌ Erro na compilação:');
  console.log(error.stdout?.toString() || '');
  console.log(error.stderr?.toString() || '');
  process.exit(1);
}

console.log('\n🎯 Teste concluído com sucesso!');
console.log('\n📋 Próximos passos sugeridos:');
console.log('   1. Testar a aplicação no navegador');
console.log('   2. Verificar se os dados são carregados corretamente');
console.log('   3. Testar a funcionalidade de exportação XLSX');
console.log('   4. Validar os filtros por função e mês/ano');