const fs = require('fs');
const path = require('path');

console.log('🔍 DIAGNÓSTICO COMPLETO DO PROJETO - Sistema RV Armazém');
console.log('='.repeat(60));

const rootDir = path.join(__dirname, '..');
let problemasEncontrados = [];
let sugestoesCorrecao = [];

// 1. VERIFICAR ESTRUTURA DE PASTAS NETLIFY
console.log('\n1️⃣  ESTRUTURA DE PASTAS NETLIFY');
console.log('-'.repeat(40));

const estruturaNetlify = {
  'netlify/functions-src': 'Código TypeScript das funções',
  'netlify/functions': 'Arquivos JavaScript compilados (atual)',
  'netlify/functions-build': 'Arquivos JavaScript compilados (esperado pelo netlify.toml)'
};

Object.entries(estruturaNetlify).forEach(([pasta, descricao]) => {
  const caminhoCompleto = path.join(rootDir, pasta);
  const existe = fs.existsSync(caminhoCompleto);
  
  console.log(`   ${existe ? '✅' : '❌'} ${pasta} - ${descricao}`);
  
  if (!existe && pasta === 'netlify/functions-build') {
    problemasEncontrados.push('Pasta netlify/functions-build não existe (esperada pelo netlify.toml)');
    sugestoesCorrecao.push('Criar pasta netlify/functions-build ou ajustar netlify.toml');
  }
  
  if (existe && pasta !== 'netlify/functions-build') {
    const arquivos = fs.readdirSync(caminhoCompleto);
    console.log(`      Arquivos: ${arquivos.join(', ')}`);
  }
});

// 2. VERIFICAR CONFIGURAÇÃO NETLIFY.TOML
console.log('\n2️⃣  CONFIGURAÇÃO NETLIFY.TOML');
console.log('-'.repeat(40));

const netlifyTomlPath = path.join(rootDir, 'netlify.toml');
if (fs.existsSync(netlifyTomlPath)) {
  const netlifyContent = fs.readFileSync(netlifyTomlPath, 'utf8');
  
  // Verificar diretório de funções
  const functionsMatch = netlifyContent.match(/directory\s*=\s*"([^"]+)"/i);
  const functionsDir = functionsMatch ? functionsMatch[1] : null;
  
  console.log(`   📁 Diretório de funções configurado: ${functionsDir}`);
  
  if (functionsDir === 'netlify/functions-build') {
    if (!fs.existsSync(path.join(rootDir, functionsDir))) {
      console.log('   ❌ Diretório configurado não existe!');
      problemasEncontrados.push('netlify.toml aponta para netlify/functions-build que não existe');
    } else {
      console.log('   ✅ Diretório configurado existe');
    }
  } else {
    console.log('   ⚠️  Diretório não é o padrão esperado');
  }
  
  // Verificar porta de desenvolvimento
  const portMatch = netlifyContent.match(/port\s*=\s*(\d+)/i);
  const port = portMatch ? portMatch[1] : null;
  console.log(`   🌐 Porta configurada: ${port}`);
  
  if (port !== '8888') {
    problemasEncontrados.push(`Porta configurada (${port}) diferente da esperada (8888)`);
  }
  
} else {
  console.log('   ❌ netlify.toml não encontrado!');
  problemasEncontrados.push('Arquivo netlify.toml não encontrado');
}

// 3. VERIFICAR SCRIPTS DO PACKAGE.JSON
console.log('\n3️⃣  SCRIPTS DO PACKAGE.JSON');
console.log('-'.repeat(40));

const packageJsonPath = path.join(rootDir, 'package.json');
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const scripts = packageJson.scripts || {};
  
  const scriptsEsperados = {
    'dev': 'netlify dev',
    'build:functions': 'tsc -p netlify/functions-src/tsconfig.json',
    'build:worker': 'esbuild src/worker/supabase-worker.ts --bundle --outfile=src/worker/supabase-worker.js --format=esm --platform=browser',
    'build:netlify': 'npm run build:worker && npm run build:functions && npm run build'
  };
  
  Object.entries(scriptsEsperados).forEach(([script, comandoEsperado]) => {
    const comandoAtual = scripts[script];
    const existe = !!comandoAtual;
    
    console.log(`   ${existe ? '✅' : '❌'} ${script}: ${comandoAtual || 'NÃO ENCONTRADO'}`);
    
    if (!existe) {
      problemasEncontrados.push(`Script '${script}' não encontrado no package.json`);
      sugestoesCorrecao.push(`Adicionar script: "${script}": "${comandoEsperado}"`);
    } else if (comandoAtual !== comandoEsperado) {
      console.log(`      ⚠️  Esperado: ${comandoEsperado}`);
    }
  });
} else {
  console.log('   ❌ package.json não encontrado!');
  problemasEncontrados.push('Arquivo package.json não encontrado');
}

// 4. VERIFICAR TSCONFIG DAS FUNÇÕES
console.log('\n4️⃣  CONFIGURAÇÃO TYPESCRIPT DAS FUNÇÕES');
console.log('-'.repeat(40));

const tsconfigFunctionsPath = path.join(rootDir, 'netlify', 'functions-src', 'tsconfig.json');
if (fs.existsSync(tsconfigFunctionsPath)) {
  const tsconfig = JSON.parse(fs.readFileSync(tsconfigFunctionsPath, 'utf8'));
  const outDir = tsconfig.compilerOptions?.outDir;
  
  console.log(`   📁 outDir configurado: ${outDir}`);
  
  if (outDir === '../functions') {
    console.log('   ⚠️  outDir aponta para ../functions (atual)');
    console.log('   💡 netlify.toml espera ../functions-build');
    problemasEncontrados.push('Inconsistência: tsconfig.json gera em ../functions, mas netlify.toml espera ../functions-build');
    sugestoesCorrecao.push('Alterar outDir para "../functions-build" ou ajustar netlify.toml');
  } else if (outDir === '../functions-build') {
    console.log('   ✅ outDir consistente com netlify.toml');
  } else {
    console.log(`   ❌ outDir inesperado: ${outDir}`);
  }
} else {
  console.log('   ❌ tsconfig.json das funções não encontrado!');
  problemasEncontrados.push('tsconfig.json das funções netlify não encontrado');
}

// 5. VERIFICAR ARQUIVOS DE API
console.log('\n5️⃣  ARQUIVOS DE API');
console.log('-'.repeat(40));

const apiPaths = {
  'netlify/functions-src/api.ts': 'Código fonte TypeScript',
  'netlify/functions/api.js': 'Compilado atual',
  'netlify/functions-build/api.js': 'Compilado esperado'
};

Object.entries(apiPaths).forEach(([arquivo, descricao]) => {
  const caminhoCompleto = path.join(rootDir, arquivo);
  const existe = fs.existsSync(caminhoCompleto);
  
  console.log(`   ${existe ? '✅' : '❌'} ${arquivo} - ${descricao}`);
  
  if (existe) {
    const stats = fs.statSync(caminhoCompleto);
    console.log(`      Última modificação: ${stats.mtime.toLocaleString()}`);
  }
});

// 6. VERIFICAR VARIÁVEIS DE AMBIENTE
console.log('\n6️⃣  VARIÁVEIS DE AMBIENTE');
console.log('-'.repeat(40));

const envLocalPath = path.join(rootDir, '.env.local');
if (fs.existsSync(envLocalPath)) {
  console.log('   ✅ .env.local encontrado');
  
  const envContent = fs.readFileSync(envLocalPath, 'utf8');
  const variaveis = {
    'SUPABASE_URL': 'Backend (Netlify Functions)',
    'SUPABASE_ANON_KEY': 'Backend (Netlify Functions)',
    'VITE_SUPABASE_URL': 'Frontend (Vite)',
    'VITE_SUPABASE_ANON_KEY': 'Frontend (Vite)'
  };
  
  Object.entries(variaveis).forEach(([variavel, uso]) => {
    const temVariavel = envContent.includes(`${variavel}=`);
    console.log(`   ${temVariavel ? '✅' : '❌'} ${variavel} - ${uso}`);
    
    if (!temVariavel) {
      problemasEncontrados.push(`Variável ${variavel} não encontrada no .env.local`);
    }
  });
} else {
  console.log('   ❌ .env.local não encontrado!');
  problemasEncontrados.push('Arquivo .env.local não encontrado');
  sugestoesCorrecao.push('Criar .env.local baseado no .env.example');
}

// 7. VERIFICAR WORKER SUPABASE
console.log('\n7️⃣  WORKER SUPABASE');
console.log('-'.repeat(40));

const workerPaths = {
  'src/worker/supabase-worker.ts': 'Código fonte TypeScript',
  'src/worker/supabase-worker.js': 'Compilado JavaScript'
};

Object.entries(workerPaths).forEach(([arquivo, descricao]) => {
  const caminhoCompleto = path.join(rootDir, arquivo);
  const existe = fs.existsSync(caminhoCompleto);
  
  console.log(`   ${existe ? '✅' : '❌'} ${arquivo} - ${descricao}`);
  
  if (!existe && arquivo.endsWith('.js')) {
    problemasEncontrados.push('Worker JavaScript não encontrado - execute npm run build:worker');
    sugestoesCorrecao.push('Executar: npm run build:worker');
  }
});

// 8. RESUMO DOS PROBLEMAS
console.log('\n📊 RESUMO DOS PROBLEMAS ENCONTRADOS');
console.log('='.repeat(60));

if (problemasEncontrados.length === 0) {
  console.log('🎉 PARABÉNS! Nenhum problema crítico encontrado!');
} else {
  console.log(`❌ ${problemasEncontrados.length} problema(s) encontrado(s):\n`);
  
  problemasEncontrados.forEach((problema, index) => {
    console.log(`   ${index + 1}. ${problema}`);
  });
}

// 9. SUGESTÕES DE CORREÇÃO
if (sugestoesCorrecao.length > 0) {
  console.log('\n💡 SUGESTÕES DE CORREÇÃO');
  console.log('='.repeat(60));
  
  sugestoesCorrecao.forEach((sugestao, index) => {
    console.log(`   ${index + 1}. ${sugestao}`);
  });
}

// 10. PRÓXIMOS PASSOS RECOMENDADOS
console.log('\n🚀 PRÓXIMOS PASSOS RECOMENDADOS');
console.log('='.repeat(60));

const passos = [
  'Corrigir inconsistências na configuração netlify.toml',
  'Executar npm run build:functions para gerar arquivos compilados',
  'Executar npm run build:worker para compilar o worker',
  'Testar npm run dev na porta 8888',
  'Verificar se as rotas da API respondem corretamente'
];

passos.forEach((passo, index) => {
  console.log(`   ${index + 1}. ${passo}`);
});

console.log('\n🏁 DIAGNÓSTICO COMPLETO FINALIZADO!');
console.log('='.repeat(60));

// Retornar código de saída baseado nos problemas
if (problemasEncontrados.length > 0) {
  process.exit(1);
} else {
  process.exit(0);
}