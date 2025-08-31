const fs = require('fs');
const path = require('path');

console.log('🔧 Melhorando .gitignore para estrutura netlify...');

const rootDir = path.join(__dirname, '..');
const gitignorePath = path.join(rootDir, '.gitignore');

if (!fs.existsSync(gitignorePath)) {
    console.log('❌ .gitignore não encontrado!');
    process.exit(1);
}

// Ler conteúdo atual
let gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
console.log('📖 Lendo .gitignore atual...');

// Entradas para adicionar
const entradas = [
    '# Netlify build outputs',
    'netlify/functions-build/',
    '.netlify/'
];

let adicionadas = [];
let jaExistentes = [];

// Verificar quais entradas já existem
entradas.forEach(entrada => {
    if (entrada.startsWith('#')) {
        // Comentários sempre podem ser adicionados
        return;
    }
    
    if (gitignoreContent.includes(entrada) || 
        gitignoreContent.includes(entrada.replace('/', '')) ||
        gitignoreContent.includes('functions-build') ||
        gitignoreContent.includes('.netlify')) {
        jaExistentes.push(entrada);
    }
});

// Verificar se precisa adicionar seção netlify
const precisaAdicionar = !gitignoreContent.includes('functions-build') && 
                        !gitignoreContent.includes('netlify/functions-build');

if (precisaAdicionar) {
    console.log('\n➕ Adicionando entradas netlify ao .gitignore...');
    
    // Adicionar seção netlify
    const secaoNetlify = `\n# Netlify build outputs\nnetlify/functions-build/\n`;
    
    gitignoreContent += secaoNetlify;
    adicionadas.push('netlify/functions-build/');
    
    // Escrever arquivo atualizado
    fs.writeFileSync(gitignorePath, gitignoreContent);
    
    console.log('✅ Entradas adicionadas:');
    adicionadas.forEach(entrada => {
        console.log(`   - ${entrada}`);
    });
} else {
    console.log('\n✅ .gitignore já contém configurações adequadas para netlify');
}

if (jaExistentes.length > 0) {
    console.log('\n📋 Entradas já existentes:');
    jaExistentes.forEach(entrada => {
        console.log(`   - ${entrada}`);
    });
}

// Verificar resultado final
console.log('\n🔍 Verificando resultado final...');
const gitignoreFinal = fs.readFileSync(gitignorePath, 'utf8');

if (gitignoreFinal.includes('functions-build') || gitignoreFinal.includes('netlify/functions-build')) {
    console.log('✅ functions-build está no .gitignore');
} else {
    console.log('❌ functions-build ainda não está no .gitignore');
}

if (gitignoreFinal.includes('.netlify')) {
    console.log('✅ .netlify está no .gitignore');
} else {
    console.log('❌ .netlify ainda não está no .gitignore');
}

console.log('\n💡 Explicação das entradas:');
console.log('   📂 netlify/functions-build/ = Arquivos JavaScript compilados');
console.log('   📂 .netlify/ = Cache e arquivos temporários do Netlify CLI');
console.log('   🎯 Motivo: Evitar commit de arquivos gerados automaticamente');

console.log('\n🎉 Melhoria do .gitignore concluída!');