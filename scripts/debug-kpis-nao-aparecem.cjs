const fs = require('fs');
const path = require('path');

console.log('🔍 DEBUG: KPIs não aparecem para seleção');
console.log('==========================================\n');

let testsRun = 0;
let testsPassed = 0;

function runTest(description, condition) {
  testsRun++;
  const status = condition ? '✅' : '❌';
  console.log(`${status} ${description}`);
  if (condition) testsPassed++;
  return condition;
}

// 1. Analisar o problema dos logs
console.log('1. 📊 ANÁLISE DOS LOGS DO CONSOLE');
console.log('=================================');

console.log('   🔍 Log da API mostra:');
console.log('   - response: {kpisAtingidos: Array(2)}');
console.log('   - kpisData: []');
console.log('   - count: 0');
console.log('');
console.log('   ❗ PROBLEMA IDENTIFICADO:');
console.log('   - A API retorna os KPIs em response.kpisAtingidos');
console.log('   - Mas o hook processa apenas response como array');
console.log('   - Resultado: kpisData fica vazio');

// 2. Verificar o hook useAvailableKPIs
console.log('\n2. 🪝 VERIFICAÇÃO DO HOOK useAvailableKPIs');
console.log('==========================================');

const useApiPath = path.join(__dirname, 'src', 'hooks', 'useApi.ts');
if (fs.existsSync(useApiPath)) {
  const useApiContent = fs.readFileSync(useApiPath, 'utf8');
  
  // Encontrar a função fetchAvailableKPIs
  const hookMatch = useApiContent.match(/export function useAvailableKPIs\(\)[\s\S]*?return \{ kpis, loading, error, fetchAvailableKPIs \};/);
  
  if (hookMatch) {
    const hookContent = hookMatch[0];
    
    runTest('Hook processa response como array direto', 
      hookContent.includes('Array.isArray(data) ? data : []'));
    
    runTest('Hook NÃO processa response.kpisAtingidos', 
      !hookContent.includes('data.kpisAtingidos'));
    
    console.log('\n   📋 CÓDIGO ATUAL DO HOOK:');
    const lines = hookContent.split('\n');
    lines.forEach((line, index) => {
      if (line.includes('const kpisData') || line.includes('Array.isArray')) {
        console.log(`   ${index + 1}: ${line.trim()}`);
      }
    });
  }
} else {
  console.log('❌ Arquivo useApi.ts não encontrado');
}

// 3. Verificar a API backend
console.log('\n3. 🔌 VERIFICAÇÃO DA API BACKEND');
console.log('=================================');

const kpisRoutePath = path.join(__dirname, 'src', 'worker', 'routes', 'kpis.ts');
if (fs.existsSync(kpisRoutePath)) {
  const kpisContent = fs.readFileSync(kpisRoutePath, 'utf8');
  
  // Encontrar o endpoint /kpis/available
  const availableMatch = kpisContent.match(/\/kpis\/available[\s\S]*?return c\.json\([^)]+\);/);
  
  if (availableMatch) {
    const endpointContent = availableMatch[0];
    
    runTest('API retorna c.json(kpis)', 
      endpointContent.includes('return c.json(kpis'));
    
    runTest('API NÃO retorna objeto com kpisAtingidos', 
      !endpointContent.includes('kpisAtingidos'));
    
    console.log('\n   📋 CÓDIGO ATUAL DA API:');
    const lines = endpointContent.split('\n');
    lines.forEach((line, index) => {
      if (line.includes('return c.json')) {
        console.log(`   ${index + 1}: ${line.trim()}`);
      }
    });
  }
} else {
  console.log('❌ Arquivo kpis.ts não encontrado');
}

// 4. Verificar se há outro endpoint ou processamento
console.log('\n4. 🔍 BUSCA POR OUTROS ENDPOINTS OU PROCESSAMENTOS');
console.log('==================================================');

// Buscar por kpisAtingidos em todo o projeto
const searchDirs = [
  path.join(__dirname, 'src'),
  path.join(__dirname, 'netlify', 'functions-src'),
  path.join(__dirname, 'netlify', 'functions-build')
];

let foundKpisAtingidos = false;
searchDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    const searchInDir = (dirPath) => {
      const items = fs.readdirSync(dirPath);
      items.forEach(item => {
        const itemPath = path.join(dirPath, item);
        const stat = fs.statSync(itemPath);
        
        if (stat.isDirectory()) {
          searchInDir(itemPath);
        } else if (item.endsWith('.ts') || item.endsWith('.js')) {
          const content = fs.readFileSync(itemPath, 'utf8');
          if (content.includes('kpisAtingidos')) {
            console.log(`   📁 Encontrado 'kpisAtingidos' em: ${itemPath}`);
            foundKpisAtingidos = true;
            
            // Mostrar contexto
            const lines = content.split('\n');
            lines.forEach((line, index) => {
              if (line.includes('kpisAtingidos')) {
                console.log(`      Linha ${index + 1}: ${line.trim()}`);
              }
            });
          }
        }
      });
    };
    
    try {
      searchInDir(dir);
    } catch (err) {
      // Ignorar erros de acesso
    }
  }
});

if (!foundKpisAtingidos) {
  console.log('   ❌ Nenhuma referência a "kpisAtingidos" encontrada no código');
}

// 5. Análise do problema
console.log('\n5. 🚨 ANÁLISE DO PROBLEMA');
console.log('==========================');

console.log('   📊 SITUAÇÃO ATUAL:');
console.log('   1. API retorna: {kpisAtingidos: Array(2)}');
console.log('   2. Hook espera: Array direto');
console.log('   3. Resultado: kpisData = []');
console.log('');
console.log('   🔧 POSSÍVEIS CAUSAS:');
console.log('   A) API mudou formato de retorno');
console.log('   B) Hook não foi atualizado para novo formato');
console.log('   C) Há inconsistência entre frontend e backend');

// 6. Soluções propostas
console.log('\n6. 💡 SOLUÇÕES PROPOSTAS');
console.log('=========================');

console.log('   🔧 OPÇÃO 1: Corrigir o hook para processar response.kpisAtingidos');
console.log('   - Alterar: Array.isArray(data) ? data : []');
console.log('   - Para: Array.isArray(data.kpisAtingidos) ? data.kpisAtingidos : []');
console.log('');
console.log('   🔧 OPÇÃO 2: Corrigir a API para retornar array direto');
console.log('   - Alterar: return c.json({kpisAtingidos: kpis})');
console.log('   - Para: return c.json(kpis)');
console.log('');
console.log('   ✅ RECOMENDAÇÃO: Opção 1 (corrigir hook)');
console.log('   - Mantém compatibilidade com outros usos da API');
console.log('   - Alinha com o formato atual da resposta');

// 7. Resumo
console.log('\n7. 📊 RESUMO DOS TESTES');
console.log('=======================');

const successRate = ((testsPassed / testsRun) * 100).toFixed(1);
console.log(`   Total de testes: ${testsRun}`);
console.log(`   Testes aprovados: ${testsPassed}`);
console.log(`   Testes falharam: ${testsRun - testsPassed}`);
console.log(`   Taxa de sucesso: ${successRate}%`);

console.log('\n🎯 PRÓXIMO PASSO:');
console.log('   Corrigir o hook useAvailableKPIs para processar data.kpisAtingidos');

console.log('\n✅ DEBUG COMPLETO!');
console.log('===================');