const fs = require('fs');
const path = require('path');

console.log('🔍 Analisando estrutura das pastas netlify...');

const rootDir = path.join(__dirname, '..');
const netlifyDir = path.join(rootDir, 'netlify');

// Verificar se as pastas existem
const functionsSrc = path.join(netlifyDir, 'functions-src');
const functionsBuild = path.join(netlifyDir, 'functions-build');

console.log('\n📁 Estrutura encontrada:');
console.log(`   📂 netlify/`);

if (fs.existsSync(functionsSrc)) {
    console.log(`   ├── 📂 functions-src/ (código fonte TypeScript)`);
    const srcFiles = fs.readdirSync(functionsSrc);
    srcFiles.forEach(file => {
        console.log(`   │   ├── ${file}`);
    });
} else {
    console.log(`   ├── ❌ functions-src/ (não encontrada)`);
}

if (fs.existsSync(functionsBuild)) {
    console.log(`   └── 📂 functions-build/ (código compilado JavaScript)`);
    const buildFiles = fs.readdirSync(functionsBuild);
    buildFiles.forEach(file => {
        console.log(`       ├── ${file}`);
    });
} else {
    console.log(`   └── ❌ functions-build/ (não encontrada)`);
}

// Analisar configurações
console.log('\n⚙️  Análise de configurações:');

// Verificar package.json
const packageJsonPath = path.join(rootDir, 'package.json');
if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    console.log('\n📦 Scripts do package.json:');
    
    if (packageJson.scripts) {
        Object.entries(packageJson.scripts).forEach(([name, script]) => {
            if (name.includes('build') || name.includes('function')) {
                console.log(`   - ${name}: ${script}`);
            }
        });
    }
}

// Verificar tsconfig das funções
const tsconfigPath = path.join(functionsSrc, 'tsconfig.json');
if (fs.existsSync(tsconfigPath)) {
    const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
    console.log('\n🔧 Configuração TypeScript (functions-src/tsconfig.json):');
    console.log(`   - outDir: ${tsconfig.compilerOptions?.outDir || 'não definido'}`);
    console.log(`   - rootDir: ${tsconfig.compilerOptions?.rootDir || 'não definido'}`);
    console.log(`   - target: ${tsconfig.compilerOptions?.target || 'não definido'}`);
    console.log(`   - module: ${tsconfig.compilerOptions?.module || 'não definido'}`);
}

// Verificar netlify.toml
const netlifyTomlPath = path.join(rootDir, 'netlify.toml');
if (fs.existsSync(netlifyTomlPath)) {
    const netlifyToml = fs.readFileSync(netlifyTomlPath, 'utf8');
    console.log('\n🌐 Configuração Netlify (netlify.toml):');
    
    // Extrair comando de build
    const buildMatch = netlifyToml.match(/command\s*=\s*"([^"]+)"/g);
    if (buildMatch) {
        buildMatch.forEach(match => {
            console.log(`   - ${match}`);
        });
    }
    
    // Verificar redirects para funções
    if (netlifyToml.includes('/api/*')) {
        console.log('   - Redirect configurado: /api/* → /.netlify/functions/api');
    }
}

// Comparar arquivos entre src e build
console.log('\n🔄 Comparação entre functions-src e functions-build:');

if (fs.existsSync(functionsSrc) && fs.existsSync(functionsBuild)) {
    const srcFiles = fs.readdirSync(functionsSrc).filter(f => f.endsWith('.ts'));
    const buildFiles = fs.readdirSync(functionsBuild).filter(f => f.endsWith('.js'));
    
    console.log(`   - Arquivos .ts em functions-src: ${srcFiles.length}`);
    console.log(`   - Arquivos .js em functions-build: ${buildFiles.length}`);
    
    srcFiles.forEach(srcFile => {
        const jsFile = srcFile.replace('.ts', '.js');
        if (buildFiles.includes(jsFile)) {
            const srcPath = path.join(functionsSrc, srcFile);
            const buildPath = path.join(functionsBuild, jsFile);
            const srcStats = fs.statSync(srcPath);
            const buildStats = fs.statSync(buildPath);
            
            console.log(`   ✅ ${srcFile} → ${jsFile}`);
            console.log(`      - Fonte: ${srcStats.mtime.toLocaleString('pt-BR')}`);
            console.log(`      - Build: ${buildStats.mtime.toLocaleString('pt-BR')}`);
            
            if (srcStats.mtime > buildStats.mtime) {
                console.log(`      ⚠️  ATENÇÃO: Fonte mais recente que o build!`);
            }
        } else {
            console.log(`   ❌ ${srcFile} não tem correspondente em functions-build`);
        }
    });
}

// Explicação do propósito
console.log('\n💡 Explicação da estrutura:');
console.log('\n🎯 Por que existem 2 pastas netlify?');
console.log('\n   📂 functions-src/');
console.log('   ├── Contém o código fonte em TypeScript');
console.log('   ├── Arquivos .ts que você edita e desenvolve');
console.log('   ├── Configuração tsconfig.json específica');
console.log('   └── Não é executado diretamente pelo Netlify');
console.log('\n   📂 functions-build/');
console.log('   ├── Contém o código compilado em JavaScript');
console.log('   ├── Arquivos .js gerados automaticamente');
console.log('   ├── É o que o Netlify realmente executa');
console.log('   └── Gerado pelo comando "npm run build:functions"');

console.log('\n🔄 Fluxo de desenvolvimento:');
console.log('   1. Você edita arquivos em functions-src/');
console.log('   2. Executa "npm run build:functions"');
console.log('   3. TypeScript compila .ts → .js em functions-build/');
console.log('   4. Netlify usa os arquivos de functions-build/');

console.log('\n✅ Conclusão:');
console.log('   - NÃO são pastas duplicadas');
console.log('   - São parte do processo de build TypeScript → JavaScript');
console.log('   - functions-src = desenvolvimento');
console.log('   - functions-build = produção');
console.log('   - Ambas são necessárias para o funcionamento correto');

console.log('\n🧹 Recomendações:');
console.log('   - Manter ambas as pastas');
console.log('   - Adicionar functions-build/ ao .gitignore (se não estiver)');
console.log('   - Sempre editar apenas em functions-src/');
console.log('   - Executar build antes de deploy');

console.log('\n🎉 Análise da estrutura netlify concluída!');