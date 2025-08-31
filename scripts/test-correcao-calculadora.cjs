const fs = require('fs');
const path = require('path');

console.log('🧪 TESTE: Correção da Calculadora - KPIs');
console.log('=========================================\n');

let testsRun = 0;
let testsPassed = 0;

function runTest(description, condition) {
  testsRun++;
  const status = condition ? '✅' : '❌';
  console.log(`${status} ${description}`);
  if (condition) testsPassed++;
  return condition;
}

// 1. Verificar se as correções foram aplicadas no Home.tsx
console.log('1. 🏠 VERIFICAÇÃO DAS CORREÇÕES NO Home.tsx');
console.log('=============================================');

const homePath = path.join(__dirname, 'src', 'pages', 'Home.tsx');
if (fs.existsSync(homePath)) {
  const homeContent = fs.readFileSync(homePath, 'utf8');
  
  // Verificar import do useAvailableKPIs
  runTest('Import do useAvailableKPIs adicionado', 
    homeContent.includes('useAvailableKPIs') && 
    homeContent.includes('import { useActivityNames, useFunctions, useCalculator, useAvailableKPIs }'));
  
  // Verificar se o hook está sendo usado
  runTest('Hook useAvailableKPIs sendo usado', 
    homeContent.includes('const { kpis: availableKPIs, loading: kpisLoading, fetchAvailableKPIs } = useAvailableKPIs()'));
  
  // Verificar se a função duplicada foi removida
  runTest('Função fetchAvailableKPIs duplicada removida', 
    !homeContent.includes('const fetchAvailableKPIs = async (funcao: string, turno: string)'));
  
  // Verificar se as keys foram corrigidas
  runTest('Keys do React corrigidas com index', 
    homeContent.includes('key={`${kpi.nome_kpi || \'kpi\'}-${kpi.turno_kpi || \'turno\'}-${index}`}'));
  
  // Verificar se não há mais processamento incorreto de dados
  runTest('Processamento incorreto de dados removido', 
    !homeContent.includes('data.kpisAtingidos || data || []'));
  
  console.log('\n   📊 ANÁLISE DETALHADA:');
  
  // Verificar se ainda há useState para availableKPIs
  const hasOldState = homeContent.includes('useState<KPIType[]>([]);');
  console.log(`   📋 Estado local removido: ${!hasOldState ? '✅' : '❌'}`);
  
  // Verificar se o useEffect ainda chama a função correta
  const useEffectMatch = homeContent.match(/useEffect\(\(\) => \{[\s\S]*?\}, \[formData\.funcao, formData\.turno\]\);/);
  if (useEffectMatch) {
    const effectContent = useEffectMatch[0];
    const callsHook = effectContent.includes('fetchAvailableKPIs(formData.funcao, formData.turno)');
    console.log(`   📋 useEffect chama hook corretamente: ${callsHook ? '✅' : '❌'}`);
  }
  
} else {
  console.log('❌ Arquivo Home.tsx não encontrado');
}

// 2. Verificar se o hook useAvailableKPIs existe
console.log('\n2. 🪝 VERIFICAÇÃO DO HOOK useAvailableKPIs');
console.log('==========================================');

const useApiPath = path.join(__dirname, 'src', 'hooks', 'useApi.ts');
if (fs.existsSync(useApiPath)) {
  const useApiContent = fs.readFileSync(useApiPath, 'utf8');
  
  runTest('Hook useAvailableKPIs existe', 
    useApiContent.includes('export function useAvailableKPIs'));
  
  runTest('Hook retorna kpis, loading, error, fetchAvailableKPIs', 
    useApiContent.includes('return { kpis, loading, error, fetchAvailableKPIs }'));
  
  runTest('Hook usa endpoint correto', 
    useApiContent.includes('/kpis/available'));
  
  runTest('Hook processa array corretamente', 
    useApiContent.includes('Array.isArray(data) ? data : []'));
  
} else {
  console.log('❌ Arquivo useApi.ts não encontrado');
}

// 3. Verificar estrutura de dados esperada
console.log('\n3. 📊 VERIFICAÇÃO DA ESTRUTURA DE DADOS');
console.log('=======================================');

const typesPath = path.join(__dirname, 'src', 'shared', 'types.ts');
if (fs.existsSync(typesPath)) {
  const typesContent = fs.readFileSync(typesPath, 'utf8');
  
  runTest('Tipo KPIType definido', 
    typesContent.includes('KPIType'));
  
  runTest('Campos nome_kpi e turno_kpi existem', 
    typesContent.includes('nome_kpi') && typesContent.includes('turno_kpi'));
  
} else {
  console.log('❌ Arquivo types.ts não encontrado');
}

// 4. Verificar API backend
console.log('\n4. 🔌 VERIFICAÇÃO DA API BACKEND');
console.log('=================================');

const kpisRoutePath = path.join(__dirname, 'src', 'worker', 'routes', 'kpis.ts');
if (fs.existsSync(kpisRoutePath)) {
  const kpisContent = fs.readFileSync(kpisRoutePath, 'utf8');
  
  runTest('Endpoint /kpis/available existe', 
    kpisContent.includes('/kpis/available'));
  
  runTest('API retorna array direto', 
    kpisContent.includes('return c.json(kpis || [])'));
  
  runTest('API valida parâmetros funcao e turno', 
    kpisContent.includes('funcao') && kpisContent.includes('turno'));
  
} else {
  console.log('❌ Arquivo kpis.ts não encontrado');
}

// 5. Simular teste de integração
console.log('\n5. 🔄 SIMULAÇÃO DE FLUXO COMPLETO');
console.log('==================================');

console.log('   📋 Fluxo esperado:');
console.log('   1. Usuário seleciona função e turno');
console.log('   2. useEffect detecta mudança');
console.log('   3. Hook useAvailableKPIs.fetchAvailableKPIs() é chamado');
console.log('   4. API /kpis/available retorna array de KPIs');
console.log('   5. Hook atualiza estado kpis');
console.log('   6. Componente renderiza KPIs com keys únicas');
console.log('   7. Usuário pode selecionar KPIs');

// Verificar se todos os componentes estão alinhados
if (fs.existsSync(homePath) && fs.existsSync(useApiPath) && fs.existsSync(kpisRoutePath)) {
  const homeContent = fs.readFileSync(homePath, 'utf8');
  const useApiContent = fs.readFileSync(useApiPath, 'utf8');
  const kpisContent = fs.readFileSync(kpisRoutePath, 'utf8');
  
  const homeUsesHook = homeContent.includes('useAvailableKPIs()');
  const hookExists = useApiContent.includes('export function useAvailableKPIs');
  const apiExists = kpisContent.includes('/kpis/available');
  
  runTest('Integração completa configurada', homeUsesHook && hookExists && apiExists);
}

// 6. Verificar problemas conhecidos resolvidos
console.log('\n6. 🚨 PROBLEMAS CONHECIDOS RESOLVIDOS');
console.log('======================================');

if (fs.existsSync(homePath)) {
  const homeContent = fs.readFileSync(homePath, 'utf8');
  
  runTest('Keys duplicadas resolvidas', 
    !homeContent.includes('key={`undefined-undefined`}') && 
    homeContent.includes('index'));
  
  runTest('Função duplicada removida', 
    !homeContent.includes('const fetchAvailableKPIs = async'));
  
  runTest('Processamento de dados correto', 
    !homeContent.includes('data.kpisAtingidos || data || []'));
  
  runTest('Hook usado em vez de fetch manual', 
    homeContent.includes('useAvailableKPIs()'));
}

// 7. Resumo e próximos passos
console.log('\n7. 📊 RESUMO DOS TESTES');
console.log('=======================');

const successRate = ((testsPassed / testsRun) * 100).toFixed(1);
console.log(`   Total de testes: ${testsRun}`);
console.log(`   Testes aprovados: ${testsPassed}`);
console.log(`   Testes falharam: ${testsRun - testsPassed}`);
console.log(`   Taxa de sucesso: ${successRate}%`);

if (testsPassed === testsRun) {
  console.log('\n🎉 EXCELENTE! Todas as correções foram aplicadas com sucesso!');
  console.log('\n📋 PRÓXIMOS PASSOS:');
  console.log('   1. ✅ Testar a aplicação no navegador');
  console.log('   2. ✅ Verificar se os KPIs carregam corretamente');
  console.log('   3. ✅ Verificar se não há mais erros de keys duplicadas');
  console.log('   4. ✅ Testar seleção de KPIs');
  console.log('   5. ✅ Testar cálculo de produtividade');
} else {
  console.log('\n⚠️  ATENÇÃO! Algumas correções podem não ter sido aplicadas corretamente.');
  console.log('\n🔧 AÇÕES NECESSÁRIAS:');
  console.log('   1. 🔍 Revisar os testes que falharam');
  console.log('   2. 🔧 Aplicar as correções pendentes');
  console.log('   3. 🧪 Executar este teste novamente');
}

console.log('\n✅ TESTE DE CORREÇÃO COMPLETO!');
console.log('===============================');
console.log('Verifique os resultados acima e proceda conforme recomendado.');