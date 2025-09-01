#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

console.log('🧹 Limpando arquivos .js duplicados no worker...');
console.log('============================================================');

const routesDir = path.join(__dirname, 'src', 'worker', 'routes');

// Lista de arquivos .js que têm equivalentes .ts
const jsFiles = [
  'activities.js',
  'auth.js', 
  'kpis.js',
  'lancamentos.js',
  'users.js',
  'wms-tasks.js'
];

let removedCount = 0;

jsFiles.forEach(jsFile => {
  const jsPath = path.join(routesDir, jsFile);
  const tsFile = jsFile.replace('.js', '.ts');
  const tsPath = path.join(routesDir, tsFile);
  
  // Verifica se ambos os arquivos existem
  if (fs.existsSync(jsPath) && fs.existsSync(tsPath)) {
    try {
      fs.unlinkSync(jsPath);
      console.log(`✅ Removido: ${jsFile} (existe ${tsFile})`);
      removedCount++;
    } catch (error) {
      console.log(`❌ Erro ao remover ${jsFile}: ${error.message}`);
    }
  } else if (fs.existsSync(jsPath)) {
    console.log(`⚠️  Mantido: ${jsFile} (não existe ${tsFile})`);
  } else {
    console.log(`ℹ️  Não encontrado: ${jsFile}`);
  }
});

console.log('============================================================');
console.log(`📊 RESUMO: ${removedCount} arquivos .js duplicados removidos`);
console.log('🎯 Agora apenas arquivos .ts serão a fonte da verdade!');
console.log('💡 Use "npm run build:worker" para recompilar quando necessário');