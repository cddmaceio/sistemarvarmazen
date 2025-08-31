const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

console.log('🔍 TESTE FINAL - Verificação de KPIs com valores zerados');
console.log('========================================================\n');

// Função para fazer requisição HTTP
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const module = urlObj.protocol === 'https:' ? https : http;
    
    const req = module.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    
    req.on('error', (err) => {
      reject(err);
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

// Função para verificar se os logs de debug foram adicionados
function checkDebugLogs() {
  console.log('1. 🔍 VERIFICAÇÃO DOS LOGS DE DEBUG');
  console.log('===================================');
  
  const homePath = path.join(__dirname, 'src', 'pages', 'Home.tsx');
  const useApiPath = path.join(__dirname, 'src', 'hooks', 'useApi.ts');
  
  let homeHasLogs = false;
  let apiHasLogs = false;
  
  // Verificar Home.tsx
  if (fs.existsSync(homePath)) {
    const homeContent = fs.readFileSync(homePath, 'utf8');
    homeHasLogs = homeContent.includes('🔍 DEBUG - formData values:');
    console.log(`   Home.tsx: ${homeHasLogs ? '✅' : '❌'} Logs de debug ${homeHasLogs ? 'encontrados' : 'não encontrados'}`);
  } else {
    console.log('   Home.tsx: ❌ Arquivo não encontrado');
  }
  
  // Verificar useApi.ts
  if (fs.existsSync(useApiPath)) {
    const apiContent = fs.readFileSync(useApiPath, 'utf8');
    apiHasLogs = apiContent.includes('🔍 DEBUG - fetchAvailableKPIs called with:');
    console.log(`   useApi.ts: ${apiHasLogs ? '✅' : '❌'} Logs de debug ${apiHasLogs ? 'encontrados' : 'não encontrados'}`);
  } else {
    console.log('   useApi.ts: ❌ Arquivo não encontrado');
  }
  
  return { homeHasLogs, apiHasLogs };
}

// Função para testar a API
async function testAPI() {
  console.log('\n2. 🌐 TESTE DA API');
  console.log('===================');
  
  const baseUrl = 'http://localhost:8888/.netlify/functions/api';
  
  try {
    // Teste com parâmetros válidos
    const response = await makeRequest(`${baseUrl}/kpis/available?funcao=Ajudante%20de%20Armaz%C3%A9m&turno=Manh%C3%A3`);
    console.log(`   Status: ${response.status}`);
    
    if (response.status === 200 && response.data.kpisAtingidos) {
      console.log(`   ✅ API funcionando - ${response.data.kpisAtingidos.length} KPIs encontrados`);
      console.log(`   KPIs: ${response.data.kpisAtingidos.join(', ')}`);
      return true;
    } else {
      console.log('   ❌ API não retornou KPIs válidos');
      console.log('   Resposta:', JSON.stringify(response.data, null, 2));
      return false;
    }
  } catch (error) {
    console.log('   ❌ Erro ao testar API:', error.message);
    return false;
  }
}

// Função para verificar a estrutura do frontend
function checkFrontendStructure() {
  console.log('\n3. 🏗️ VERIFICAÇÃO DA ESTRUTURA DO FRONTEND');
  console.log('============================================');
  
  const checks = [
    {
      name: 'Home.tsx existe',
      path: 'src/pages/Home.tsx',
      check: (content) => content.includes('useAvailableKPIs')
    },
    {
      name: 'useApi.ts existe',
      path: 'src/hooks/useApi.ts',
      check: (content) => content.includes('fetchAvailableKPIs')
    },
    {
      name: 'useEffect chama fetchAvailableKPIs',
      path: 'src/pages/Home.tsx',
      check: (content) => content.includes('fetchAvailableKPIs(formData.funcao, formData.turno)')
    },
    {
      name: 'formData é inicializado corretamente',
      path: 'src/pages/Home.tsx',
      check: (content) => content.includes("funcao: '',") && content.includes("turno: 'Manhã',")
    },
    {
      name: 'useEffect define função do usuário',
      path: 'src/pages/Home.tsx',
      check: (content) => content.includes('handleInputChange(\'funcao\', convertedFunction)')
    },
    {
      name: 'useEffect define turno do usuário',
      path: 'src/pages/Home.tsx',
      check: (content) => content.includes('setFormData(prev => ({ ...prev, turno: userTurno')
    }
  ];
  
  let passedChecks = 0;
  
  checks.forEach(check => {
    const filePath = path.join(__dirname, check.path);
    
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      const passed = check.check(content);
      console.log(`   ${passed ? '✅' : '❌'} ${check.name}`);
      if (passed) passedChecks++;
    } else {
      console.log(`   ❌ ${check.name} - Arquivo não encontrado`);
    }
  });
  
  return { passedChecks, totalChecks: checks.length };
}

// Função para verificar se o servidor está rodando
async function checkServer() {
  console.log('\n4. 🖥️ VERIFICAÇÃO DO SERVIDOR');
  console.log('===============================');
  
  try {
    const response = await makeRequest('http://localhost:8888');
    console.log(`   ✅ Servidor rodando na porta 8888 (Status: ${response.status})`);
    return true;
  } catch (error) {
    console.log('   ❌ Servidor não está rodando na porta 8888');
    console.log('   Erro:', error.message);
    return false;
  }
}

// Função principal
async function main() {
  const debugLogs = checkDebugLogs();
  const serverRunning = await checkServer();
  const apiWorking = serverRunning ? await testAPI() : false;
  const frontendStructure = checkFrontendStructure();
  
  console.log('\n5. 📊 RESUMO FINAL');
  console.log('===================');
  
  const results = [
    { name: 'Logs de debug no Home.tsx', status: debugLogs.homeHasLogs },
    { name: 'Logs de debug no useApi.ts', status: debugLogs.apiHasLogs },
    { name: 'Servidor rodando', status: serverRunning },
    { name: 'API funcionando', status: apiWorking },
    { name: 'Estrutura do frontend', status: frontendStructure.passedChecks === frontendStructure.totalChecks }
  ];
  
  results.forEach(result => {
    console.log(`   ${result.status ? '✅' : '❌'} ${result.name}`);
  });
  
  const allPassed = results.every(result => result.status);
  
  console.log('\n6. 🎯 DIAGNÓSTICO');
  console.log('==================');
  
  if (allPassed) {
    console.log('   ✅ Todos os testes passaram!');
    console.log('   ✅ O problema dos KPIs com valores zerados deve estar resolvido.');
    console.log('   \n   📋 PRÓXIMOS PASSOS:');
    console.log('   1. Recarregue a página no navegador');
    console.log('   2. Abra o DevTools (F12) e vá para a aba Console');
    console.log('   3. Selecione uma função e turno');
    console.log('   4. Verifique os logs que começam com 🔍 DEBUG');
    console.log('   5. Os KPIs devem aparecer corretamente');
  } else {
    console.log('   ⚠️ Alguns testes falharam.');
    console.log('   \n   🔧 AÇÕES NECESSÁRIAS:');
    
    if (!debugLogs.homeHasLogs || !debugLogs.apiHasLogs) {
      console.log('   - Execute novamente o script debug-frontend-kpis.cjs');
    }
    
    if (!serverRunning) {
      console.log('   - Inicie o servidor com: npm run dev');
    }
    
    if (!apiWorking && serverRunning) {
      console.log('   - Verifique se as funções do Netlify foram compiladas: npm run build:functions');
    }
    
    if (frontendStructure.passedChecks !== frontendStructure.totalChecks) {
      console.log('   - Verifique a estrutura do código frontend');
    }
  }
  
  console.log('\n✅ TESTE FINAL COMPLETO!');
  console.log('==========================');
}

main().catch(console.error);