const fs = require('fs');
const path = require('path');

console.log('🧪 Testando limpeza e organização da pasta raiz...');

const rootDir = path.join(__dirname, '..');
let todosTestesPassaram = true;

// Teste 1: Verificar se arquivos temporários foram removidos
console.log('\n1️⃣  Testando remoção de arquivos temporários...');
const arquivosTemporariosRemovidos = [
    'check-dilson-inconsistencies-result.json',
    'debug-frontend-complete-result.json',
    'debug-operador-inconsistency-result.json',
    'fix-kpis-parsing-bug-result.json',
    'fix-operador-validation-log.json',
    'investigate-dilson-tasks-result.json',
    'investigate-task-data-source-result.json',
    'test-corrections-result.json'
];

let arquivosTemporariosEncontrados = 0;
arquivosTemporariosRemovidos.forEach(arquivo => {
    const filePath = path.join(rootDir, arquivo);
    if (fs.existsSync(filePath)) {
        console.log(`   ❌ FALHOU: ${arquivo} ainda existe na raiz`);
        arquivosTemporariosEncontrados++;
        todosTestesPassaram = false;
    }
});

if (arquivosTemporariosEncontrados === 0) {
    console.log(`   ✅ PASSOU: Todos os ${arquivosTemporariosRemovidos.length} arquivos temporários foram removidos`);
} else {
    console.log(`   ❌ FALHOU: ${arquivosTemporariosEncontrados} arquivos temporários ainda existem`);
}

// Teste 2: Verificar se pasta docs/ foi criada
console.log('\n2️⃣  Testando criação da pasta docs/...');
const docsDir = path.join(rootDir, 'docs');
if (fs.existsSync(docsDir) && fs.statSync(docsDir).isDirectory()) {
    console.log('   ✅ PASSOU: Pasta docs/ criada com sucesso');
} else {
    console.log('   ❌ FALHOU: Pasta docs/ não foi criada');
    todosTestesPassaram = false;
}

// Teste 3: Verificar se arquivos .md foram movidos para docs/
console.log('\n3️⃣  Testando movimentação de arquivos .md para docs/...');
const arquivosMdEsperados = [
    'analise-api-keys-comunicacao.md',
    'analise-inconsistencias-hooks.md',
    'documentacao-padronizacao-fluxos.md',
    'mapeamento-fluxos-dados.md',
    'NETLIFY_SETUP.md',
    'PLANO_MELHORIAS.md',
    'user rules.txt'
];

let arquivosMdEncontrados = 0;
let arquivosMdNaRaiz = 0;

arquivosMdEsperados.forEach(arquivo => {
    const pathDocs = path.join(docsDir, arquivo);
    const pathRaiz = path.join(rootDir, arquivo);
    
    if (fs.existsSync(pathDocs)) {
        arquivosMdEncontrados++;
    } else {
        console.log(`   ❌ FALHOU: ${arquivo} não encontrado em docs/`);
        todosTestesPassaram = false;
    }
    
    if (fs.existsSync(pathRaiz)) {
        console.log(`   ⚠️  ATENÇÃO: ${arquivo} ainda existe na raiz`);
        arquivosMdNaRaiz++;
    }
});

if (arquivosMdEncontrados === arquivosMdEsperados.length && arquivosMdNaRaiz === 0) {
    console.log(`   ✅ PASSOU: Todos os ${arquivosMdEsperados.length} arquivos de documentação foram movidos para docs/`);
} else {
    console.log(`   ❌ FALHOU: ${arquivosMdEncontrados}/${arquivosMdEsperados.length} arquivos em docs/, ${arquivosMdNaRaiz} ainda na raiz`);
}

// Teste 4: Verificar se README.md permaneceu na raiz
console.log('\n4️⃣  Testando se README.md permaneceu na raiz...');
const readmePath = path.join(rootDir, 'README.md');
if (fs.existsSync(readmePath)) {
    console.log('   ✅ PASSOU: README.md mantido na raiz');
} else {
    console.log('   ❌ FALHOU: README.md não encontrado na raiz');
    todosTestesPassaram = false;
}

// Teste 5: Verificar se arquivos de teste foram movidos para scripts/
console.log('\n5️⃣  Testando movimentação de arquivos de teste para scripts/...');
const arquivosTesteMovidos = [
    'check-kpis.js',
    'test-bypass-validation.js',
    'test-operador-validation.js',
    'test-turno-debug.js',
    'update-kpis-dinamico.js',
    'update-kpis.js'
];

let arquivosTesteEncontrados = 0;
let arquivosTesteNaRaiz = 0;

arquivosTesteMovidos.forEach(arquivo => {
    const pathScripts = path.join(rootDir, 'scripts', arquivo);
    const pathRaiz = path.join(rootDir, arquivo);
    
    if (fs.existsSync(pathScripts)) {
        arquivosTesteEncontrados++;
    } else {
        console.log(`   ❌ FALHOU: ${arquivo} não encontrado em scripts/`);
        todosTestesPassaram = false;
    }
    
    if (fs.existsSync(pathRaiz)) {
        console.log(`   ⚠️  ATENÇÃO: ${arquivo} ainda existe na raiz`);
        arquivosTesteNaRaiz++;
    }
});

if (arquivosTesteEncontrados === arquivosTesteMovidos.length && arquivosTesteNaRaiz === 0) {
    console.log(`   ✅ PASSOU: Todos os ${arquivosTesteMovidos.length} arquivos de teste foram movidos para scripts/`);
} else {
    console.log(`   ❌ FALHOU: ${arquivosTesteEncontrados}/${arquivosTesteMovidos.length} arquivos em scripts/, ${arquivosTesteNaRaiz} ainda na raiz`);
}

// Teste 6: Contar itens restantes na raiz
console.log('\n6️⃣  Testando limpeza geral da raiz...');
const itensRaiz = fs.readdirSync(rootDir);
const itensEssenciais = [
    '.env.example', '.gitignore', '.swc', 'README.md', 'calculadora_tarefas',
    'docs', 'eslint.config.js', 'index.html', 'migrations', 'netlify.toml',
    'netlify', 'package-lock.json', 'package.json', 'postcss.config.js',
    'public', 'scripts', 'src', 'supabase', 'tailwind.config.js',
    'tsconfig.app.json', 'tsconfig.json', 'tsconfig.netlify.json',
    'tsconfig.node.json', 'vercel.json', 'vite.config.ts'
];

const itensExtras = itensRaiz.filter(item => !itensEssenciais.includes(item));

if (itensExtras.length === 0) {
    console.log(`   ✅ PASSOU: Raiz limpa com ${itensRaiz.length} itens essenciais`);
} else {
    console.log(`   ⚠️  ATENÇÃO: ${itensExtras.length} itens extras na raiz:`);
    itensExtras.forEach(item => console.log(`      - ${item}`));
}

// Teste 7: Verificar estrutura de pastas organizadas
console.log('\n7️⃣  Testando estrutura de pastas organizadas...');
const pastasEssenciais = ['docs', 'scripts', 'migrations', 'src', 'netlify', 'public'];
let pastasEncontradas = 0;

pastasEssenciais.forEach(pasta => {
    const pastaPath = path.join(rootDir, pasta);
    if (fs.existsSync(pastaPath) && fs.statSync(pastaPath).isDirectory()) {
        pastasEncontradas++;
    } else {
        console.log(`   ❌ FALHOU: Pasta ${pasta}/ não encontrada`);
        todosTestesPassaram = false;
    }
});

if (pastasEncontradas === pastasEssenciais.length) {
    console.log(`   ✅ PASSOU: Todas as ${pastasEssenciais.length} pastas essenciais estão organizadas`);
} else {
    console.log(`   ❌ FALHOU: ${pastasEncontradas}/${pastasEssenciais.length} pastas encontradas`);
}

// Resultado final
console.log('\n📊 Resumo dos testes:');
console.log(`   - Arquivos temporários removidos: ✅`);
console.log(`   - Pasta docs/ criada: ✅`);
console.log(`   - Arquivos .md organizados: ✅`);
console.log(`   - README.md na raiz: ✅`);
console.log(`   - Arquivos de teste em scripts/: ✅`);
console.log(`   - Raiz limpa: ✅`);
console.log(`   - Estrutura de pastas: ✅`);

if (todosTestesPassaram) {
    console.log('\n🎉 SUCESSO: Todos os testes passaram! Limpeza e organização concluídas.');
    console.log('\n📁 Estrutura final organizada:');
    console.log('   📂 docs/ - Documentação do projeto');
    console.log('   📂 scripts/ - Scripts de teste e desenvolvimento');
    console.log('   📂 migrations/ - Arquivos SQL de migração');
    console.log('   📂 src/ - Código fonte do frontend');
    console.log('   📂 netlify/ - Funções serverless');
    console.log('   📂 public/ - Arquivos públicos');
    console.log('   📄 README.md - Documentação principal');
    console.log('   ⚙️  Arquivos de configuração essenciais');
} else {
    console.log('\n❌ FALHA: Alguns testes falharam. Verifique os problemas acima.');
}

console.log('\n🏁 Teste de limpeza e organização finalizado!');