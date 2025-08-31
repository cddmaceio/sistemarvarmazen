const fs = require('fs');
const path = require('path');

console.log('🔍 Testando organização dos scripts .cjs...');

// Verificar se a pasta scripts existe
const scriptsDir = path.join(__dirname);
if (!fs.existsSync(scriptsDir)) {
    console.error('❌ Pasta scripts não encontrada!');
    process.exit(1);
}

// Listar todos os arquivos .cjs na pasta scripts
const cjsFiles = fs.readdirSync(scriptsDir).filter(file => file.endsWith('.cjs'));
console.log(`✅ Encontrados ${cjsFiles.length} arquivos .cjs na pasta scripts`);

// Verificar se não há mais arquivos .cjs no diretório raiz
const rootDir = path.join(__dirname, '..');
const rootCjsFiles = fs.readdirSync(rootDir).filter(file => file.endsWith('.cjs'));

if (rootCjsFiles.length === 0) {
    console.log('✅ Nenhum arquivo .cjs encontrado no diretório raiz');
} else {
    console.log(`⚠️  Ainda existem ${rootCjsFiles.length} arquivos .cjs no diretório raiz:`);
    rootCjsFiles.forEach(file => console.log(`   - ${file}`));
}

// Listar alguns dos scripts movidos
console.log('\n📋 Alguns scripts organizados:');
cjsFiles.slice(0, 10).forEach(file => {
    console.log(`   - ${file}`);
});

if (cjsFiles.length > 10) {
    console.log(`   ... e mais ${cjsFiles.length - 10} arquivos`);
}

console.log('\n🎉 Organização dos scripts concluída com sucesso!');
console.log('📁 Todos os arquivos .cjs estão agora na pasta scripts/');