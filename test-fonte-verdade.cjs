#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

console.log('🔍 Analisando Fonte da Verdade no Netlify Dev...');
console.log('============================================================');

// 1. Verificar configuração do netlify.toml
console.log('📋 1. CONFIGURAÇÃO NETLIFY.TOML:');
const netlifyToml = fs.readFileSync('netlify.toml', 'utf8');
const buildCommand = netlifyToml.match(/command = "([^"]+)"/)?.[1];
console.log(`   Build command: ${buildCommand}`);

// 2. Verificar o que o api.ts importa
console.log('\n📋 2. IMPORTAÇÃO NO API.TS:');
const apiTs = fs.readFileSync('netlify/functions-src/api.ts', 'utf8');
const importMatch = apiTs.match(/import\('([^']+)'\)/);
if (importMatch) {
  const importPath = importMatch[1];
  console.log(`   Importa: ${importPath}`);
  
  // Verificar se o arquivo existe
  const fullPath = path.resolve(importPath);
  const exists = fs.existsSync(fullPath);
  console.log(`   Arquivo existe: ${exists ? '✅' : '❌'}`);
  
  if (exists) {
    const stats = fs.statSync(fullPath);
    console.log(`   Última modificação: ${stats.mtime.toLocaleString('pt-BR')}`);
    console.log(`   Tamanho: ${(stats.size / 1024).toFixed(2)} KB`);
  }
}

// 3. Verificar arquivos TypeScript vs JavaScript
console.log('\n📋 3. COMPARAÇÃO DE ARQUIVOS:');
const workerTs = 'src/worker/supabase-worker.ts';
const workerJs = 'src/worker/supabase-worker.js';

if (fs.existsSync(workerTs)) {
  const tsStats = fs.statSync(workerTs);
  console.log(`   📄 ${workerTs}:`);
  console.log(`      Modificado: ${tsStats.mtime.toLocaleString('pt-BR')}`);
  console.log(`      Tamanho: ${(tsStats.size / 1024).toFixed(2)} KB`);
}

if (fs.existsSync(workerJs)) {
  const jsStats = fs.statSync(workerJs);
  console.log(`   📄 ${workerJs}:`);
  console.log(`      Modificado: ${jsStats.mtime.toLocaleString('pt-BR')}`);
  console.log(`      Tamanho: ${(jsStats.size / 1024).toFixed(2)} KB`);
}

// 4. Verificar package.json scripts
console.log('\n📋 4. SCRIPTS DO PACKAGE.JSON:');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
console.log(`   dev: ${packageJson.scripts.dev}`);
console.log(`   build:worker: ${packageJson.scripts['build:worker']}`);
console.log(`   build:netlify: ${packageJson.scripts['build:netlify']}`);

// 5. Conclusão
console.log('\n============================================================');
console.log('🎯 FONTE DA VERDADE NO NETLIFY DEV:');
console.log('');
console.log('1. 📝 DESENVOLVIMENTO:');
console.log('   • Edite: src/worker/supabase-worker.ts e src/worker/routes/*.ts');
console.log('   • Compile: npm run build:worker');
console.log('   • Resultado: src/worker/supabase-worker.js (USADO PELO NETLIFY)');
console.log('');
console.log('2. 🔄 FLUXO NETLIFY DEV:');
console.log('   • netlify.toml → api.ts → supabase-worker.js');
console.log('   • O arquivo .js é a fonte da verdade em RUNTIME');
console.log('   • O arquivo .ts é a fonte da verdade para DESENVOLVIMENTO');
console.log('');
console.log('3. ⚠️  IMPORTANTE:');
console.log('   • Netlify dev usa o arquivo .js compilado');
console.log('   • Mudanças em .ts só aparecem após build:worker');
console.log('   • Sempre recompile após editar arquivos TypeScript');