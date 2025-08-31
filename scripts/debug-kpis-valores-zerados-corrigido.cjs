const fs = require('fs');
const path = require('path');

let testsRun = 0;
let testsPassed = 0;

function test(description, condition) {
  testsRun++;
  const status = condition ? '✅' : '❌';
  console.log(`   ${status} ${description}`);
  if (condition) testsPassed++;
  return condition;
}

console.log('🔍 DEBUG: KPIs com Valores Zerados');
console.log('===================================');
console.log('Investigando por que os KPIs estão aparecendo com valores zerados');
console.log('');

// 1. Verificar se o useEffect está sendo chamado corretamente
console.log('1. 🔄 VERIFICAÇÃO DO useEffect no Home.tsx');
console.log('==========================================');
const homePath = path.join(__dirname, 'src', 'pages', 'Home.tsx');
const homeContent = fs.readFileSync(homePath, 'utf8');

test('useEffect monitora formData.funcao', homeContent.includes('formData.funcao'));
test('useEffect monitora formData.turno', homeContent.includes('formData.turno'));
test('useEffect chama fetchAvailableKPIs', homeContent.includes('fetchAvailableKPIs'));
test('useEffect tem dependências corretas', homeContent.includes('[formData.funcao, formData.turno]'));
test('fetchAvailableKPIs recebe 2 parâmetros', homeContent.includes('fetchAvailableKPIs(formData.funcao, formData.turno)'));

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
console.log('\n3. 🔄 VERIFICAÇÃO DO MAPEAMENTO DE ENCODING');
console.log('============================================');
test('API tem mapeamento FUNCAO_UI_TO_DB', kpisApiContent.includes('FUNCAO_UI_TO_DB'));
test('API tem mapeamento TURNO_UI_TO_DB', kpisApiContent.includes('TURNO_UI_TO_DB'));
test('API converte função para DB', kpisApiContent.includes('FUNCAO_UI_TO_DB[funcao]'));
test('API converte turno para DB', kpisApiContent.includes('TURNO_UI_TO_DB[turno]'));

// 4. Verificar se existem dados na tabela kpis
console.log('\n4. 📊 VERIFICAÇÃO DE DADOS ESPERADOS');
console.log('=====================================');
// Verificar se o código menciona dados específicos que deveriam existir
test('Código menciona "Ajudante de Armazém"', homeContent.includes('Ajudante de Armazém') || kpisApiContent.includes('Ajudante de Armazém'));
test('Código menciona "Manhã"', homeContent.includes('Manhã') || kpisApiContent.includes('Manhã'));
test('Código menciona "Geral"', homeContent.includes('Geral') || kpisApiContent.includes('Geral'));

// 5. Verificar se o hook useApi.ts processa a resposta corretamente
console.log('\n5. 🪝 VERIFICAÇÃO DO HOOK useAvailableKPIs');
console.log('===========================================');
const useApiPath = path.join(__dirname, 'src', 'hooks', 'useApi.ts');
const useApiContent = fs.readFileSync(useApiPath, 'utf8');

test('Hook useAvailableKPIs existe', useApiContent.includes('export function useAvailableKPIs'));
test('Hook processa data.kpisAtingidos', useApiContent.includes('data.kpisAtingidos'));
test('Hook tem fallback para array vazio', useApiContent.includes('kpisData = Array.isArray(data.kpisAtingidos) ? data.kpisAtingidos : []'));
test('Hook tem logs de debug', useApiContent.includes('console.log'));
test('Hook retorna kpis, loading, error, fetchAvailableKPIs', useApiContent.includes('return { kpis, loading, error, fetchAvailableKPIs }'));

// 6. Verificar se há logs de debug no console
console.log('\n6. 🔍 VERIFICAÇÃO DE LOGS DE DEBUG');
console.log('===================================');
test('Hook tem log de parâmetros recebidos', useApiContent.includes('funcao') && useApiContent.includes('turno'));
test('Hook tem log de resposta da API', useApiContent.includes('response:'));
test('Hook tem log de dados processados', useApiContent.includes('kpisData'));
test('Hook tem log de contagem', useApiContent.includes('count:'));

// 7. Verificar arquivo compilado
console.log('\n7. 📦 VERIFICAÇÃO DO ARQUIVO COMPILADO');
console.log('=======================================');
const compiledKpisPath = path.join(__dirname, 'netlify', 'functions-build', 'api.js');
if (fs.existsSync(compiledKpisPath)) {
  const compiledContent = fs.readFileSync(compiledKpisPath, 'utf8');
  test('Arquivo compilado existe', true);
  test('Arquivo compilado tem endpoint /kpis/available', compiledContent.includes('/kpis/available'));
  test('Arquivo compilado tem kpisAtingidos', compiledContent.includes('kpisAtingidos'));
  test('Arquivo compilado tem mapeamento de funções', compiledContent.includes('FUNCAO_UI_TO_DB') || compiledContent.includes('Ajudante'));
} else {
  test('Arquivo compilado existe', false);
  test('Arquivo compilado tem endpoint /kpis/available', false);
  test('Arquivo compilado tem kpisAtingidos', false);
  test('Arquivo compilado tem mapeamento de funções', false);
}

// 8. Resumo e possíveis causas
console.log('\n8. 📊 RESUMO DOS TESTES');
console.log('=======================');
const successRate = ((testsPassed / testsRun) * 100).toFixed(1);
console.log(`   Total de testes: ${testsRun}`);
console.log(`   Testes aprovados: ${testsPassed}`);
console.log(`   Testes falharam: ${testsRun - testsPassed}`);
console.log(`   Taxa de sucesso: ${successRate}%`);

console.log('\n🔍 POSSÍVEIS CAUSAS DOS VALORES ZERADOS:');
console.log('=========================================');
console.log('1. 📡 Parâmetros não estão sendo enviados corretamente para a API');
console.log('2. 🔄 Problemas de encoding entre UI e DB (ex: "Ajudante de Armazém" vs "ajudante_armazem")');
console.log('3. 📊 Dados não existem na tabela kpis para a combinação função/turno');
console.log('4. 🔌 API não está filtrando corretamente os dados');
console.log('5. 🪝 Hook não está processando a resposta corretamente');
console.log('6. 🔄 useEffect não está sendo disparado quando função/turno mudam');

console.log('\n🔧 PRÓXIMOS PASSOS PARA DEBUG:');
console.log('===============================');
console.log('1. 🌐 Abrir DevTools do navegador e verificar logs do console');
console.log('2. 📡 Verificar Network tab para ver requisições para /api/kpis/available');
console.log('3. 📊 Verificar se os parâmetros estão sendo enviados corretamente');
console.log('4. 🔍 Verificar resposta da API no Network tab');
console.log('5. 💾 Verificar se existem dados na tabela kpis no Supabase');
console.log('6. 🔄 Testar manualmente a API com curl ou Postman');

console.log('\n✅ SCRIPT DE DEBUG COMPLETO!');
console.log('=============================');