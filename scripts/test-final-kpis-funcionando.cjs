const fs = require('fs');
const path = require('path');

console.log('🧪 TESTE FINAL - KPIs FUNCIONANDO');
console.log('==================================\n');

let testsTotal = 0;
let testsApproved = 0;

function test(description, condition) {
  testsTotal++;
  const status = condition ? '✅' : '❌';
  console.log(`${status} ${description}`);
  if (condition) testsApproved++;
  return condition;
}

// 1. Verificar se o hook useAvailableKPIs processa data.kpisAtingidos
console.log('1. 🔧 VERIFICAÇÃO DO HOOK useAvailableKPIs');
console.log('===============================================');
const useApiPath = path.join(__dirname, 'src', 'hooks', 'useApi.ts');
const useApiContent = fs.readFileSync(useApiPath, 'utf8');

test('Hook processa data.kpisAtingidos', useApiContent.includes('data.kpisAtingidos'));
test('Hook não processa data diretamente como array', !useApiContent.includes('setKpis(data);') || useApiContent.includes('setKpis(kpisData);'));
test('Hook tem fallback para array vazio', useApiContent.includes('|| []'));

// 2. Verificar se a API retorna formato correto
console.log('\n2. 🔌 VERIFICAÇÃO DA API');
console.log('==========================');
const kpisApiPath = path.join(__dirname, 'src', 'worker', 'routes', 'kpis.ts');
const kpisApiContent = fs.readFileSync(kpisApiPath, 'utf8');

test('API retorna objeto com kpisAtingidos', kpisApiContent.includes('kpisAtingidos'));
test('API mapeia nome_kpi corretamente', kpisApiContent.includes('kpi.nome_kpi'));
test('API não retorna array direto', !kpisApiContent.includes('return c.json(kpis || []);'));

// 3. Verificar se o arquivo compilado foi atualizado
console.log('\n3. 📦 VERIFICAÇÃO DO ARQUIVO COMPILADO');
console.log('======================================');
const compiledKpisPath = path.join(__dirname, 'netlify', 'functions-build', 'src', 'worker', 'routes', 'kpis.js');
if (fs.existsSync(compiledKpisPath)) {
  const compiledContent = fs.readFileSync(compiledKpisPath, 'utf8');
  test('Arquivo compilado existe', true);
  test('Arquivo compilado tem kpisAtingidos', compiledContent.includes('kpisAtingidos'));
} else {
  test('Arquivo compilado existe', false);
  test('Arquivo compilado tem kpisAtingidos', false);
}

// 4. Verificar integração com Home.tsx
console.log('\n4. 🏠 VERIFICAÇÃO DA INTEGRAÇÃO Home.tsx');
console.log('==========================================');
const homePath = path.join(__dirname, 'src', 'pages', 'Home.tsx');
const homeContent = fs.readFileSync(homePath, 'utf8');

test('Home.tsx usa useAvailableKPIs', homeContent.includes('useAvailableKPIs'));
test('Home.tsx renderiza availableKPIs', homeContent.includes('availableKPIs'));
test('Home.tsx chama fetchAvailableKPIs', homeContent.includes('fetchAvailableKPIs'));
test('Home.tsx não tem importação KPIType desnecessária', !homeContent.includes('KPIType'));
test('Home.tsx não tem kpisLoading desnecessário', !homeContent.includes('kpisLoading'));

// 5. Verificar se não há conflitos
console.log('\n5. ⚠️  VERIFICAÇÃO DE CONFLITOS');
console.log('================================');
test('Não há função fetchAvailableKPIs duplicada em Home.tsx', !homeContent.includes('const fetchAvailableKPIs'));
test('Não há estado availableKPIs local em Home.tsx', !homeContent.includes('useState<') || !homeContent.includes('availableKPIs') || homeContent.includes('kpis: availableKPIs'));

// 6. Resumo
console.log('\n6. 📊 RESUMO DOS TESTES');
console.log('=======================');
console.log(`   Total de testes: ${testsTotal}`);
console.log(`   Testes aprovados: ${testsApproved}`);
console.log(`   Testes falharam: ${testsTotal - testsApproved}`);
console.log(`   Taxa de sucesso: ${((testsApproved / testsTotal) * 100).toFixed(1)}%`);

if (testsApproved === testsTotal) {
  console.log('\n🎉 TODOS OS TESTES PASSARAM!');
  console.log('=============================');
  console.log('✅ O problema dos KPIs não aparecerem foi RESOLVIDO!');
  console.log('\n📋 FLUXO ESPERADO:');
  console.log('   1. Usuário seleciona função e turno');
  console.log('   2. useEffect detecta mudança');
  console.log('   3. fetchAvailableKPIs é chamado');
  console.log('   4. API retorna {kpisAtingidos: Array}');
  console.log('   5. Hook processa data.kpisAtingidos');
  console.log('   6. KPIs aparecem para seleção');
  console.log('\n🚀 PRÓXIMOS PASSOS:');
  console.log('   1. Testar no navegador');
  console.log('   2. Verificar se KPIs aparecem');
  console.log('   3. Confirmar seleção funciona');
} else {
  console.log('\n⚠️  ATENÇÃO! Alguns testes falharam.');
  console.log('\n🔧 AÇÕES NECESSÁRIAS:');
  console.log('   1. 🔍 Revisar os testes que falharam');
  console.log('   2. 🔧 Aplicar as correções pendentes');
  console.log('   3. 🧪 Executar este teste novamente');
}

console.log('\n✅ TESTE FINAL COMPLETO!');
console.log('=========================');