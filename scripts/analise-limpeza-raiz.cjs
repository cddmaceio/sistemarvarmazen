const fs = require('fs');
const path = require('path');

console.log('🔍 Análise detalhada da pasta raiz do projeto...');

const rootDir = path.join(__dirname, '..');
const items = fs.readdirSync(rootDir, { withFileTypes: true });

// Categorizar arquivos
const categories = {
    essential: [],
    config: [],
    documentation: [],
    temporary: [],
    test: [],
    build: [],
    unnecessary: [],
    folders: []
};

items.forEach(item => {
    const name = item.name;
    
    if (item.isDirectory()) {
        categories.folders.push(name);
        return;
    }
    
    // Arquivos essenciais do projeto
    if (['package.json', 'package-lock.json', 'index.html', '.gitignore', '.env.example'].includes(name)) {
        categories.essential.push(name);
    }
    // Arquivos de configuração
    else if (name.includes('config') || name.includes('tsconfig') || name.endsWith('.toml') || name.endsWith('.json') && !name.includes('result')) {
        categories.config.push(name);
    }
    // Documentação
    else if (name.endsWith('.md') || name.endsWith('.txt')) {
        categories.documentation.push(name);
    }
    // Arquivos de resultado/temporários
    else if (name.includes('result.json') || name.includes('log.json')) {
        categories.temporary.push(name);
    }
    // Arquivos de teste
    else if (name.startsWith('test-') || name.includes('debug') || name.includes('check-')) {
        categories.test.push(name);
    }
    // Arquivos de build/desenvolvimento
    else if (name.includes('update-') || name.endsWith('.js') && !name.includes('config')) {
        categories.build.push(name);
    }
    // Outros
    else {
        categories.unnecessary.push(name);
    }
});

console.log('\n📋 Categorização dos arquivos:');
console.log(`\n✅ Arquivos essenciais (${categories.essential.length}):`);
categories.essential.forEach(file => console.log(`   - ${file}`));

console.log(`\n⚙️  Arquivos de configuração (${categories.config.length}):`);
categories.config.forEach(file => console.log(`   - ${file}`));

console.log(`\n📚 Documentação (${categories.documentation.length}):`);
categories.documentation.forEach(file => console.log(`   - ${file}`));

console.log(`\n🗂️  Pastas (${categories.folders.length}):`);
categories.folders.forEach(folder => console.log(`   - ${folder}/`));

console.log(`\n🧪 Arquivos de teste/debug (${categories.test.length}):`);
categories.test.forEach(file => console.log(`   - ${file}`));

console.log(`\n🔧 Arquivos de build/desenvolvimento (${categories.build.length}):`);
categories.build.forEach(file => console.log(`   - ${file}`));

console.log(`\n🗑️  Arquivos temporários/resultado (${categories.temporary.length}):`);
categories.temporary.forEach(file => console.log(`   - ${file}`));

if (categories.unnecessary.length > 0) {
    console.log(`\n❓ Outros arquivos (${categories.unnecessary.length}):`);
    categories.unnecessary.forEach(file => console.log(`   - ${file}`));
}

// Recomendações
console.log('\n🎯 Recomendações de limpeza:');

if (categories.temporary.length > 0) {
    console.log('\n1. 🗑️  REMOVER - Arquivos temporários/resultado:');
    categories.temporary.forEach(file => console.log(`   - ${file} (arquivo de resultado temporário)`));
}

if (categories.test.length > 0) {
    console.log('\n2. 📦 MOVER - Arquivos de teste para pasta scripts:');
    categories.test.forEach(file => console.log(`   - ${file} (já deveria estar em scripts/)`));
}

if (categories.documentation.length > 0) {
    console.log('\n3. 📚 ORGANIZAR - Criar pasta docs/ para documentação:');
    categories.documentation.forEach(file => console.log(`   - ${file}`));
}

if (categories.build.length > 0) {
    console.log('\n4. 🔧 AVALIAR - Arquivos de build/desenvolvimento:');
    categories.build.forEach(file => {
        const filePath = path.join(rootDir, file);
        const stats = fs.statSync(filePath);
        const lastModified = stats.mtime.toLocaleDateString('pt-BR');
        console.log(`   - ${file} (modificado em ${lastModified})`);
    });
}

console.log('\n📊 Resumo da análise:');
console.log(`   - Total de itens: ${items.length}`);
console.log(`   - Arquivos essenciais: ${categories.essential.length}`);
console.log(`   - Arquivos de configuração: ${categories.config.length}`);
console.log(`   - Documentação: ${categories.documentation.length}`);
console.log(`   - Pastas: ${categories.folders.length}`);
console.log(`   - Arquivos para remover: ${categories.temporary.length}`);
console.log(`   - Arquivos para mover: ${categories.test.length}`);

console.log('\n🎉 Análise concluída!');