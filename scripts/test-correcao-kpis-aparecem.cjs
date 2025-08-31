const fs = require('fs');
const path = require('path');

console.log('🧪 TESTE: Correção - KPIs Aparecem para Seleção');
console.log('===============================================\n');

let testsRun = 0;
let testsPassed = 0;

function runTest(description, condition) {
  testsRun++;
  const status = condition ? '✅' : '❌';
  console.log(`${status} ${description}`);
  if (condition) testsPassed++;
  return condition;
}

// 1. Verificar se a correção foi aplicada no hook
console.log('1. 🪝 VERIFICAÇÃO DA CORREÇÃO NO HOOK');
console.log('====================================');

const useApiPath = path.join(__dirname, 'src', 'hooks', 'useApi.ts');
if (fs.existsSync(useApiPath)) {
  const useApiContent = fs.readFileSync(useApiPath, 'utf8');
  
  runTest('Hook processa data.kpisAtingidos', 
    useApiContent.includes('Array.isArray(data.kpisAtingidos) ? data.kpisAtingidos : []'));
  
  runTest('Comentário atualizado corretamente', 
    useApiContent.includes('// A API retorna os KPIs no campo \'kpisAtingidos\''));
  
  runTest('Código antigo removido', 
    !useApiContent.includes('Array.isArray(data) ? data : []'));
  
  runTest('Comentário antigo removido', 
    !useApiContent.includes('// A API retorna os KPIs diretamente, não em um campo \'kpisAtingidos\''));
  
  console.log('\n   📊 ANÁLISE DO CÓDIGO CORRIGIDO:');
  
  // Encontrar a função fetchAvailableKPIs
  const hookMatch = useApiContent.match(/const kpisData = Array\.isArray\(data\.kpisAtingidos\)[\s\S]*?;/);
  if (hookMatch) {
    console.log(`   ✅ Linha corrigida: ${hookMatch[0].trim()}`);
  }
  
} else {
  console.log('❌ Arquivo useApi.ts não encontrado');
}

// 2. Verificar se a API está retornando o formato correto
console.log('\n2. 🔌 VERIFICAÇÃO DO FORMATO DA API');
console.log('===================================');

const kpisRoutePath = path.join(__dirname, 'src', 'worker', 'routes', 'kpis.ts');
if (fs.existsSync(kpisRoutePath)) {
  const kpisContent = fs.readFileSync(kpisRoutePath, 'utf8');
  
  runTest('API retorna objeto com kpisAtingidos', 
    kpisContent.includes('return c.json({ kpisAtingidos:'));
  
  console.log('\n   📊 FORMATO DA RESPOSTA DA API:');
  const lines = kpisContent.split('\n');
  lines.forEach((line, index) => {
    if (line.includes('return c.json({ kpisAtingidos:')) {
      console.log(`   Linha ${index + 1}: ${line.trim()}`);
    }
  });
  
} else {
  console.log('❌ Arquivo kpis.ts não encontrado');
}

// 3. Simular o fluxo de dados
console.log('\n3. 🔄 SIMULAÇÃO DO FLUXO DE DADOS');
console.log('==================================');

console.log('   📋 Fluxo esperado após correção:');
console.log('   1. Usuário seleciona função: "Ajudante de Armazém"');
console.log('   2. Usuário seleciona turno: "Manhã"');
console.log('   3. useEffect detecta mudança');
console.log('   4. fetchAvailableKPIs("Ajudante de Armazém", "Manhã") é chamado');
console.log('   5. API /kpis/available retorna: {kpisAtingidos: Array(2)}');
console.log('   6. Hook processa: data.kpisAtingidos');
console.log('   7. kpisData = Array(2) (não mais vazio)');
console.log('   8. Componente renderiza 2 KPIs para seleção');
console.log('   9. Usuário pode selecionar KPIs');

// 4. Verificar logs esperados
console.log('\n4. 📊 LOGS ESPERADOS APÓS CORREÇÃO');
console.log('===================================');

console.log('   🔍 Log anterior (PROBLEMA):');
console.log('   - response: {kpisAtingidos: Array(2)}');
console.log('   - kpisData: []');
console.log('   - count: 0');
console.log('');
console.log('   ✅ Log esperado (CORRIGIDO):');
console.log('   - response: {kpisAtingidos: Array(2)}');
console.log('   - kpisData: Array(2)');
console.log('   - count: 2');

// 5. Verificar integração com Home.tsx
console.log('\n5. 🏠 VERIFICAÇÃO DA INTEGRAÇÃO COM Home.tsx');
console.log('==============================================');

const homePath = path.join(__dirname, 'src', 'pages', 'Home.tsx');
if (fs.existsSync(homePath)) {
  const homeContent = fs.readFileSync(homePath, 'utf8');
  
  runTest('Home.tsx usa hook useAvailableKPIs', 
    homeContent.includes('const { kpis: availableKPIs, loading: kpisLoading, fetchAvailableKPIs } = useAvailableKPIs()'));
  
  runTest('Home.tsx renderiza availableKPIs', 
    homeContent.includes('availableKPIs.map'));
  
  runTest('Keys únicas implementadas', 
    homeContent.includes('key={`${kpi.nome_kpi || \'kpi\'}-${kpi.turno_kpi || \'turno\'}-${index}`}'));
  
  // Verificar se o useEffect está correto
  const useEffectMatch = homeContent.match(/useEffect\(\(\) => \{[\s\S]*?\}, \[formData\.funcao, formData\.turno\]\);/);
  if (useEffectMatch) {
    const effectContent = useEffectMatch[0];
    runTest('useEffect chama fetchAvailableKPIs corretamente', 
      effectContent.includes('fetchAvailableKPIs(formData.funcao, formData.turno)'));
  }
  
} else {
  console.log('❌ Arquivo Home.tsx não encontrado');
}

// 6. Verificar se não há conflitos
console.log('\n6. ⚠️  VERIFICAÇÃO DE CONFLITOS');
console.log('================================');

if (fs.existsSync(useApiPath)) {
  const useApiContent = fs.readFileSync(useApiPath, 'utf8');
  
  runTest('Não há processamento duplo de dados', 
    !useApiContent.includes('data.kpisAtingidos || data'));
  
  runTest('Não há fallback incorreto', 
    !useApiContent.includes('data || []'));
  
  runTest('Apenas um processamento de kpisData', 
    (useApiContent.match(/const kpisData =/g) || []).length === 1);
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
  console.log('\n🎉 EXCELENTE! Correção aplicada com sucesso!');
  console.log('\n📋 PRÓXIMOS PASSOS:');
  console.log('   1. ✅ Recarregar a aplicação no navegador');
  console.log('   2. ✅ Selecionar função: "Ajudante de Armazém"');
  console.log('   3. ✅ Selecionar turno: "Manhã"');
  console.log('   4. ✅ Verificar se os KPIs aparecem para seleção');
  console.log('   5. ✅ Verificar logs no console (count deve ser > 0)');
  console.log('   6. ✅ Testar seleção de KPIs');
  console.log('   7. ✅ Testar cálculo com KPIs selecionados');
} else {
  console.log('\n⚠️  ATENÇÃO! Algumas verificações falharam.');
  console.log('\n🔧 AÇÕES NECESSÁRIAS:');
  console.log('   1. 🔍 Revisar os testes que falharam');
  console.log('   2. 🔧 Aplicar as correções pendentes');
  console.log('   3. 🧪 Executar este teste novamente');
}

console.log('\n✅ TESTE DE CORREÇÃO COMPLETO!');
console.log('===============================');
console.log('A correção deve resolver o problema dos KPIs não aparecerem.');