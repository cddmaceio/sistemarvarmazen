const fs = require('fs');
const path = require('path');

console.log('🔍 DEBUG FRONTEND - KPIs com valores zerados');
console.log('=================================================\n');

// Função para adicionar logs de debug no Home.tsx
function addDebugLogsToHome() {
  const homePath = path.join(__dirname, 'src', 'pages', 'Home.tsx');
  
  if (!fs.existsSync(homePath)) {
    console.log('❌ Arquivo Home.tsx não encontrado');
    return false;
  }
  
  let content = fs.readFileSync(homePath, 'utf8');
  
  // Verificar se já tem logs de debug
  if (content.includes('🔍 DEBUG - formData values:')) {
    console.log('✅ Logs de debug já existem no Home.tsx');
    return true;
  }
  
  // Adicionar log no useEffect que chama fetchAvailableKPIs
  const useEffectPattern = /useEffect\(\(\) => \{\s*if \(formData\.funcao && formData\.turno\) \{\s*fetchAvailableKPIs\(formData\.funcao, formData\.turno\);\s*\}\s*\}, \[formData\.funcao, formData\.turno\]\);/;
  
  const newUseEffect = `useEffect(() => {
    console.log('🔍 DEBUG - formData values:', {
      funcao: formData.funcao,
      turno: formData.turno,
      hasFunction: !!formData.funcao,
      hasTurno: !!formData.turno
    });
    
    if (formData.funcao && formData.turno) {
      console.log('🚀 DEBUG - Calling fetchAvailableKPIs with:', {
        funcao: formData.funcao,
        turno: formData.turno,
        encodedFuncao: encodeURIComponent(formData.funcao),
        encodedTurno: encodeURIComponent(formData.turno)
      });
      fetchAvailableKPIs(formData.funcao, formData.turno);
    } else {
      console.log('⚠️ DEBUG - Not calling fetchAvailableKPIs because:', {
        missingFunction: !formData.funcao,
        missingTurno: !formData.turno
      });
    }
  }, [formData.funcao, formData.turno]);`;
  
  if (useEffectPattern.test(content)) {
    content = content.replace(useEffectPattern, newUseEffect);
    fs.writeFileSync(homePath, content);
    console.log('✅ Logs de debug adicionados ao Home.tsx');
    return true;
  } else {
    console.log('❌ Padrão do useEffect não encontrado no Home.tsx');
    return false;
  }
}

// Função para adicionar logs de debug no useApi.ts
function addDebugLogsToUseApi() {
  const useApiPath = path.join(__dirname, 'src', 'hooks', 'useApi.ts');
  
  if (!fs.existsSync(useApiPath)) {
    console.log('❌ Arquivo useApi.ts não encontrado');
    return false;
  }
  
  let content = fs.readFileSync(useApiPath, 'utf8');
  
  // Verificar se já tem logs de debug
  if (content.includes('🔍 DEBUG - fetchAvailableKPIs called with:')) {
    console.log('✅ Logs de debug já existem no useApi.ts');
    return true;
  }
  
  // Adicionar log no início da função fetchAvailableKPIs
  const fetchPattern = /const fetchAvailableKPIs = async \(funcao: string, turno: string\) => \{\s*try \{/;
  
  const newFetch = `const fetchAvailableKPIs = async (funcao: string, turno: string) => {
    console.log('🔍 DEBUG - fetchAvailableKPIs called with:', {
      funcao,
      turno,
      funcaoType: typeof funcao,
      turnoType: typeof turno,
      funcaoLength: funcao?.length,
      turnoLength: turno?.length
    });
    
    try {`;
  
  if (fetchPattern.test(content)) {
    content = content.replace(fetchPattern, newFetch);
    
    // Adicionar log antes da requisição
    const urlPattern = /const response = await fetch\(`\$\{API_BASE\}\/kpis\/available\?funcao=\$\{encodeURIComponent\(funcao\)\}&turno=\$\{encodeURIComponent\(turno\)\}`\);/;
    
    const newUrl = `const url = \`\${API_BASE}/kpis/available?funcao=\${encodeURIComponent(funcao)}&turno=\${encodeURIComponent(turno)}\`;
      console.log('🌐 DEBUG - Making request to:', url);
      
      const response = await fetch(url);`;
    
    if (urlPattern.test(content)) {
      content = content.replace(urlPattern, newUrl);
    }
    
    fs.writeFileSync(useApiPath, content);
    console.log('✅ Logs de debug adicionados ao useApi.ts');
    return true;
  } else {
    console.log('❌ Padrão da função fetchAvailableKPIs não encontrado no useApi.ts');
    return false;
  }
}

// Função para verificar o estado atual dos valores
function checkCurrentValues() {
  console.log('\n📊 VERIFICAÇÃO DOS VALORES ATUAIS');
  console.log('===================================');
  
  const homePath = path.join(__dirname, 'src', 'pages', 'Home.tsx');
  
  if (!fs.existsSync(homePath)) {
    console.log('❌ Arquivo Home.tsx não encontrado');
    return;
  }
  
  const content = fs.readFileSync(homePath, 'utf8');
  
  // Verificar inicialização do formData
  const formDataMatch = content.match(/const \[formData, setFormData\] = useState<CalculatorInputType>\(\{([^}]+)\}\);/s);
  if (formDataMatch) {
    console.log('✅ Inicialização do formData encontrada:');
    console.log(formDataMatch[1].trim());
  } else {
    console.log('❌ Inicialização do formData não encontrada');
  }
  
  // Verificar useEffect que define função
  if (content.includes('handleInputChange(\'funcao\', convertedFunction)')) {
    console.log('✅ useEffect que define função encontrado');
  } else {
    console.log('❌ useEffect que define função não encontrado');
  }
  
  // Verificar useEffect que define turno
  if (content.includes('setFormData(prev => ({ ...prev, turno: userTurno')) {
    console.log('✅ useEffect que define turno encontrado');
  } else {
    console.log('❌ useEffect que define turno não encontrado');
  }
  
  // Verificar useEffect que chama fetchAvailableKPIs
  if (content.includes('fetchAvailableKPIs(formData.funcao, formData.turno)')) {
    console.log('✅ useEffect que chama fetchAvailableKPIs encontrado');
  } else {
    console.log('❌ useEffect que chama fetchAvailableKPIs não encontrado');
  }
}

// Executar verificações e adicionar logs
async function main() {
  console.log('1. 🔍 VERIFICANDO ESTADO ATUAL');
  console.log('===============================');
  checkCurrentValues();
  
  console.log('\n2. 📝 ADICIONANDO LOGS DE DEBUG');
  console.log('=================================');
  const homeSuccess = addDebugLogsToHome();
  const apiSuccess = addDebugLogsToUseApi();
  
  console.log('\n3. 📊 RESUMO');
  console.log('=============');
  console.log(`Home.tsx: ${homeSuccess ? '✅ Logs adicionados' : '❌ Falha'}`);
  console.log(`useApi.ts: ${apiSuccess ? '✅ Logs adicionados' : '❌ Falha'}`);
  
  if (homeSuccess || apiSuccess) {
    console.log('\n🔄 PRÓXIMOS PASSOS:');
    console.log('====================');
    console.log('1. Recarregue a página no navegador');
    console.log('2. Abra o DevTools (F12)');
    console.log('3. Vá para a aba Console');
    console.log('4. Selecione uma função e turno');
    console.log('5. Verifique os logs que começam com 🔍 DEBUG');
  }
  
  console.log('\n✅ SCRIPT DE DEBUG FRONTEND COMPLETO!');
  console.log('=======================================');
}

main().catch(console.error);