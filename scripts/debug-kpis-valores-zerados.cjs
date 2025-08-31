const fs = require('fs');
const path = require('path');

console.log('🔍 DEBUG - KPIs COM VALORES ZERADOS');
console.log('====================================\n');

let testsTotal = 0;
let testsApproved = 0;

function test(description, condition) {
  testsTotal++;
  const status = condition ? '✅' : '❌';
  console.log(`${status} ${description}`);
  if (condition) testsApproved++;
  return condition;
}

// 1. Verificar se o useEffect está sendo chamado corretamente
console.log('1. 🔄 VERIFICAÇÃO DO useEffect');
console.log('==============================');
const homePath = path.join(__dirname, 'src', 'pages', 'Home.tsx');
const homeContent = fs.readFileSync(homePath, 'utf8');

test('useEffect monitora selectedFunction', homeContent.includes('selectedFunction'));
test('useEffect monitora selectedShift', homeContent.includes('selectedShift'));
test('useEffect chama fetchAvailableKPIs', homeContent.includes('fetchAvailableKPIs'));
test('useEffect tem dependências corretas', homeContent.includes('[selectedFunction, selectedShift]'));

// 2. Verificar se a API está recebendo parâmetros corretos
console.log('\n2. 🔌 VERIFICAÇÃO DA API BACKEND');
console.log('=================================');
const kpisApiPath = path.join(__dirname, 'src', 'worker', 'routes', 'kpis.ts');
const kpisApiContent = fs.readFileSync(kpisApiPath, 'utf8');

test('API verifica parâmetros funcao e turno', kpisApiContent.includes('funcao') && kpisApiContent.includes('turno'));
test('API retorna erro se parâmetros faltam', kpisApiContent.includes('Função e turno são obrigatórios'));
test('API faz query no Supabase', kpisApiContent.includes('supabase') && kpisApiContent.includes('from(\'kpis\')'));
test('API filtra por funcao_kpi', kpisApiContent.includes('eq(\'funcao_kpi\', dbFuncao)'));
test('API filtra por turno_kpi', kpisApiContent.includes('in(\'turno_kpi\', [dbTurno, \'Geral\'])'));

// 3. Verificar mapeamento de encoding
console.log('\n3. 🔄 VERIFICAÇÃO DE ENCODING');
console.log('==============================');
test('API mapeia turno Manha para Manhã', kpisApiContent.includes('Manha') && kpisApiContent.includes('Manhã'));
test('API usa dbFuncao corretamente', kpisApiContent.includes('dbFuncao = funcao'));

// 4. Verificar se há dados na tabela kpis
console.log('\n4. 📊 VERIFICAÇÃO DE DADOS');
console.log('===========================');
const kpisDataPath = path.join(__dirname, 'kpis_data.sql');
if (fs.existsSync(kpisDataPath)) {
  const kpisData = fs.readFileSync(kpisDataPath, 'utf8');
  test('Arquivo kpis_data.sql existe', true);
  test('Dados contêm Ajudante de Armazém', kpisData.includes('Ajudante de Armazém'));
  test('Dados contêm turno Manhã', kpisData.includes('Manhã'));
  test('Dados contêm turno Geral', kpisData.includes('Geral'));
} else {
  test('Arquivo kpis_data.sql existe', false);
  test('Dados contêm Ajudante de Armazém', false);
  test('Dados contêm turno Manhã', false);
  test('Dados contêm turno Geral', false);
}

// 5. Verificar se o hook está processando resposta corretamente
console.log('\n5. 🔧 VERIFICAÇÃO DO HOOK');
console.log('==========================');
const useApiPath = path.join(__dirname, 'src', 'hooks', 'useApi.ts');
const useApiContent = fs.readFileSync(useApiPath, 'utf8');

test('Hook processa data.kpisAtingidos', useApiContent.includes('data.kpisAtingidos'));
test('Hook tem log de debug', useApiContent.includes('console.log'));
test('Hook atualiza estado kpis', useApiContent.includes('setKpis'));
test('Hook trata erros', useApiContent.includes('catch'));

// 6. Verificar se há problemas de encoding nos parâmetros
console.log('\n6. 🔤 VERIFICAÇÃO DE ENCODING DE PARÂMETROS');
console.log('=============================================');
const encodingPath = path.join(__dirname, 'src', 'shared', 'utils', 'encoding.ts');
if (fs.existsSync(encodingPath)) {
  const encodingContent = fs.readFileSync(encodingPath, 'utf8');
  test('Arquivo encoding.ts existe', true);
  test('FUNCAO_DB_TO_UI está definido', encodingContent.includes('FUNCAO_DB_TO_UI'));
  test('TURNO_UI_TO_DB está definido', encodingContent.includes('TURNO_UI_TO_DB'));
} else {
  test('Arquivo encoding.ts existe', false);
  test('FUNCAO_DB_TO_UI está definido', false);
  test('TURNO_UI_TO_DB está definido', false);
}

// 7. Verificar se os valores estão sendo passados corretamente
console.log('\n7. 📤 VERIFICAÇÃO DE PASSAGEM DE PARÂMETROS');
console.log('=============================================');
test('Home.tsx usa selectedFunction no useEffect', homeContent.includes('selectedFunction') && homeContent.includes('useEffect'));
test('Home.tsx usa selectedShift no useEffect', homeContent.includes('selectedShift') && homeContent.includes('useEffect'));
test('fetchAvailableKPIs recebe 2 parâmetros', homeContent.includes('fetchAvailableKPIs(selectedFunction, selectedShift)'));

// 8. Resumo e diagnóstico
console.log('\n8. 📊 RESUMO DOS TESTES');
console.log('=======================');
console.log(`   Total de testes: ${testsTotal}`);
console.log(`   Testes aprovados: ${testsApproved}`);
console.log(`   Testes falharam: ${testsTotal - testsApproved}`);
console.log(`   Taxa de sucesso: ${((testsApproved / testsTotal) * 100).toFixed(1)}%`);

console.log('\n🔍 POSSÍVEIS CAUSAS DOS VALORES ZERADOS:');
console.log('=========================================');
console.log('1. 📝 Parâmetros não estão sendo enviados corretamente');
console.log('2. 🔤 Problema de encoding (Manha vs Manhã)');
console.log('3. 📊 Dados não existem na tabela kpis para a combinação função/turno');
console.log('4. 🔌 API não está filtrando corretamente');
console.log('5. 🔧 Hook não está processando a resposta');
console.log('6. ⚡ useEffect não está sendo disparado');

console.log('\n🚀 PRÓXIMOS PASSOS PARA DEBUG:');
console.log('===============================');
console.log('1. 🔍 Verificar logs do console no navegador');
console.log('2. 🔌 Testar API diretamente com parâmetros');
console.log('3. 📊 Verificar dados na tabela kpis');
console.log('4. 🔤 Confirmar encoding dos parâmetros');

console.log('\n✅ DEBUG COMPLETO!');
console.log('===================');