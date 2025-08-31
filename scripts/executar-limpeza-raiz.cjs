const fs = require('fs');
const path = require('path');

console.log('🧹 Executando limpeza da pasta raiz...');

const rootDir = path.join(__dirname, '..');

// 1. Remover arquivos temporários/resultado
const arquivosTemporarios = [
    'check-dilson-inconsistencies-result.json',
    'debug-frontend-complete-result.json',
    'debug-operador-inconsistency-result.json',
    'fix-kpis-parsing-bug-result.json',
    'fix-operador-validation-log.json',
    'investigate-dilson-tasks-result.json',
    'investigate-task-data-source-result.json',
    'test-corrections-result.json'
];

console.log('\n🗑️  Removendo arquivos temporários...');
let removidos = 0;
arquivosTemporarios.forEach(arquivo => {
    const filePath = path.join(rootDir, arquivo);
    if (fs.existsSync(filePath)) {
        try {
            fs.unlinkSync(filePath);
            console.log(`   ✅ Removido: ${arquivo}`);
            removidos++;
        } catch (error) {
            console.log(`   ❌ Erro ao remover ${arquivo}: ${error.message}`);
        }
    } else {
        console.log(`   ⚠️  Arquivo não encontrado: ${arquivo}`);
    }
});

// 2. Mover arquivos de teste para scripts/
const arquivosTeste = [
    'check-kpis.js',
    'test-bypass-validation.js',
    'test-operador-validation.js',
    'test-turno-debug.js',
    'update-kpis-dinamico.js',
    'update-kpis.js'
];

console.log('\n📦 Movendo arquivos de teste/desenvolvimento para scripts/...');
let movidos = 0;
arquivosTeste.forEach(arquivo => {
    const origem = path.join(rootDir, arquivo);
    const destino = path.join(rootDir, 'scripts', arquivo);
    
    if (fs.existsSync(origem)) {
        try {
            fs.renameSync(origem, destino);
            console.log(`   ✅ Movido: ${arquivo} → scripts/`);
            movidos++;
        } catch (error) {
            console.log(`   ❌ Erro ao mover ${arquivo}: ${error.message}`);
        }
    } else {
        console.log(`   ⚠️  Arquivo não encontrado: ${arquivo}`);
    }
});

// 3. Criar pasta docs/ se não existir
const docsDir = path.join(rootDir, 'docs');
if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir);
    console.log('\n📁 Pasta docs/ criada');
} else {
    console.log('\n📁 Pasta docs/ já existe');
}

// 4. Mover arquivos de documentação para docs/
const arquivosDocumentacao = [
    'analise-api-keys-comunicacao.md',
    'analise-inconsistencias-hooks.md',
    'documentacao-padronizacao-fluxos.md',
    'mapeamento-fluxos-dados.md',
    'NETLIFY_SETUP.md',
    'PLANO_MELHORIAS.md',
    'user rules.txt'
];

console.log('\n📚 Movendo documentação para docs/...');
let docsMovidos = 0;
arquivosDocumentacao.forEach(arquivo => {
    const origem = path.join(rootDir, arquivo);
    const destino = path.join(docsDir, arquivo);
    
    if (fs.existsSync(origem)) {
        try {
            fs.renameSync(origem, destino);
            console.log(`   ✅ Movido: ${arquivo} → docs/`);
            docsMovidos++;
        } catch (error) {
            console.log(`   ❌ Erro ao mover ${arquivo}: ${error.message}`);
        }
    } else {
        console.log(`   ⚠️  Arquivo não encontrado: ${arquivo}`);
    }
});

// 5. Verificar se calculadora_tarefas é arquivo ou pasta
const calculadoraPath = path.join(rootDir, 'calculadora_tarefas');
if (fs.existsSync(calculadoraPath)) {
    const stats = fs.statSync(calculadoraPath);
    if (stats.isFile()) {
        console.log('\n🔍 Analisando calculadora_tarefas...');
        try {
            const content = fs.readFileSync(calculadoraPath, 'utf8');
            if (content.trim().length === 0 || content.includes('temp') || content.includes('test')) {
                fs.unlinkSync(calculadoraPath);
                console.log('   ✅ Removido: calculadora_tarefas (arquivo temporário)');
                removidos++;
            } else {
                console.log('   ⚠️  calculadora_tarefas mantido (contém dados)');
            }
        } catch (error) {
            console.log(`   ❌ Erro ao analisar calculadora_tarefas: ${error.message}`);
        }
    } else {
        console.log('   ℹ️  calculadora_tarefas é uma pasta (mantida)');
    }
}

console.log('\n📊 Resumo da limpeza:');
console.log(`   - Arquivos temporários removidos: ${removidos}`);
console.log(`   - Arquivos movidos para scripts/: ${movidos}`);
console.log(`   - Documentos movidos para docs/: ${docsMovidos}`);
console.log(`   - Pasta docs/ criada: ${!fs.existsSync(docsDir) ? 'Não' : 'Sim'}`);

console.log('\n🎉 Limpeza da pasta raiz concluída!');
console.log('\n📋 Estrutura final recomendada:');
console.log('   📁 docs/ - Toda a documentação');
console.log('   📁 scripts/ - Scripts de teste e desenvolvimento');
console.log('   📁 migrations/ - Arquivos SQL');
console.log('   📁 src/ - Código fonte frontend');
console.log('   📁 netlify/ - Funções backend');
console.log('   📄 README.md - Documentação principal (mantido na raiz)');
console.log('   ⚙️  Arquivos de configuração essenciais');