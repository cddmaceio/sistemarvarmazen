const fs = require('fs');
const path = require('path');

console.log('🔍 Testando organização dos arquivos .sql...');

// Verificar se a pasta migrations existe
const migrationsDir = path.join(__dirname, '..', 'migrations');
if (!fs.existsSync(migrationsDir)) {
    console.error('❌ Pasta migrations não encontrada!');
    process.exit(1);
}

// Listar todos os arquivos .sql na pasta migrations
const sqlFiles = fs.readdirSync(migrationsDir).filter(file => file.endsWith('.sql'));
console.log(`✅ Encontrados ${sqlFiles.length} arquivos .sql na pasta migrations`);

// Verificar se não há mais arquivos .sql no diretório raiz
const rootDir = path.join(__dirname, '..');
const rootSqlFiles = fs.readdirSync(rootDir).filter(file => file.endsWith('.sql'));

if (rootSqlFiles.length === 0) {
    console.log('✅ Nenhum arquivo .sql encontrado no diretório raiz');
} else {
    console.log(`⚠️  Ainda existem ${rootSqlFiles.length} arquivos .sql no diretório raiz:`);
    rootSqlFiles.forEach(file => console.log(`   - ${file}`));
}

// Categorizar os arquivos SQL
const migrationFiles = sqlFiles.filter(file => /^\d+\.sql$/.test(file));
const dataFiles = sqlFiles.filter(file => file.includes('_data.sql'));
const fixFiles = sqlFiles.filter(file => file.includes('fix-'));
const otherFiles = sqlFiles.filter(file => 
    !migrationFiles.includes(file) && 
    !dataFiles.includes(file) && 
    !fixFiles.includes(file)
);

console.log('\n📋 Categorização dos arquivos SQL:');
console.log(`   📄 Migrations numeradas: ${migrationFiles.length} arquivos`);
console.log(`   📊 Arquivos de dados: ${dataFiles.length} arquivos`);
console.log(`   🔧 Arquivos de correção: ${fixFiles.length} arquivos`);
console.log(`   📁 Outros arquivos: ${otherFiles.length} arquivos`);

// Mostrar alguns exemplos de cada categoria
if (migrationFiles.length > 0) {
    console.log('\n🔢 Migrations numeradas:');
    migrationFiles.slice(0, 5).forEach(file => console.log(`   - ${file}`));
    if (migrationFiles.length > 5) {
        console.log(`   ... e mais ${migrationFiles.length - 5} arquivos`);
    }
}

if (dataFiles.length > 0) {
    console.log('\n📊 Arquivos de dados:');
    dataFiles.forEach(file => console.log(`   - ${file}`));
}

if (fixFiles.length > 0) {
    console.log('\n🔧 Arquivos de correção:');
    fixFiles.slice(0, 5).forEach(file => console.log(`   - ${file}`));
    if (fixFiles.length > 5) {
        console.log(`   ... e mais ${fixFiles.length - 5} arquivos`);
    }
}

console.log('\n🎉 Organização dos arquivos SQL concluída com sucesso!');
console.log('📁 Todos os arquivos .sql estão agora na pasta migrations/');