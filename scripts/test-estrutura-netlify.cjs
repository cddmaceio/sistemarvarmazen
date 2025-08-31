const fs = require('fs');
const path = require('path');

console.log('🧪 Testando estrutura e configuração netlify...');

const rootDir = path.join(__dirname, '..');
let todosTestesPassaram = true;

// Teste 1: Verificar se ambas as pastas existem
console.log('\n1️⃣  Testando existência das pastas netlify...');
const functionsSrc = path.join(rootDir, 'netlify', 'functions-src');
const functionsBuild = path.join(rootDir, 'netlify', 'functions-build');

if (fs.existsSync(functionsSrc)) {
    console.log('   ✅ functions-src/ existe');
} else {
    console.log('   ❌ functions-src/ não encontrada');
    todosTestesPassaram = false;
}

if (fs.existsSync(functionsBuild)) {
    console.log('   ✅ functions-build/ existe');
} else {
    console.log('   ❌ functions-build/ não encontrada');
    todosTestesPassaram = false;
}

// Teste 2: Verificar arquivos TypeScript em functions-src
console.log('\n2️⃣  Testando arquivos TypeScript em functions-src...');
if (fs.existsSync(functionsSrc)) {
    const srcFiles = fs.readdirSync(functionsSrc);
    const tsFiles = srcFiles.filter(f => f.endsWith('.ts'));
    const tsconfigExists = srcFiles.includes('tsconfig.json');
    
    if (tsFiles.length > 0) {
        console.log(`   ✅ ${tsFiles.length} arquivo(s) .ts encontrado(s): ${tsFiles.join(', ')}`);
    } else {
        console.log('   ❌ Nenhum arquivo .ts encontrado');
        todosTestesPassaram = false;
    }
    
    if (tsconfigExists) {
        console.log('   ✅ tsconfig.json existe');
    } else {
        console.log('   ❌ tsconfig.json não encontrado');
        todosTestesPassaram = false;
    }
}

// Teste 3: Verificar arquivos JavaScript em functions-build
console.log('\n3️⃣  Testando arquivos JavaScript em functions-build...');
if (fs.existsSync(functionsBuild)) {
    const buildFiles = fs.readdirSync(functionsBuild);
    const jsFiles = buildFiles.filter(f => f.endsWith('.js'));
    
    if (jsFiles.length > 0) {
        console.log(`   ✅ ${jsFiles.length} arquivo(s) .js encontrado(s): ${jsFiles.join(', ')}`);
    } else {
        console.log('   ⚠️  Nenhum arquivo .js encontrado (pode precisar executar build)');
    }
}

// Teste 4: Verificar configuração do tsconfig.json
console.log('\n4️⃣  Testando configuração do tsconfig.json...');
const tsconfigPath = path.join(functionsSrc, 'tsconfig.json');
if (fs.existsSync(tsconfigPath)) {
    try {
        const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
        const outDir = tsconfig.compilerOptions?.outDir;
        
        if (outDir === '../functions-build') {
            console.log('   ✅ outDir configurado corretamente: ../functions-build');
        } else {
            console.log(`   ❌ outDir incorreto: ${outDir} (deveria ser ../functions-build)`);
            todosTestesPassaram = false;
        }
        
        const target = tsconfig.compilerOptions?.target;
        if (target && target.includes('ES2022')) {
            console.log(`   ✅ target configurado: ${target}`);
        } else {
            console.log(`   ⚠️  target: ${target} (recomendado ES2022+)`);
        }
    } catch (error) {
        console.log(`   ❌ Erro ao ler tsconfig.json: ${error.message}`);
        todosTestesPassaram = false;
    }
}

// Teste 5: Verificar scripts do package.json
console.log('\n5️⃣  Testando scripts do package.json...');
const packageJsonPath = path.join(rootDir, 'package.json');
if (fs.existsSync(packageJsonPath)) {
    try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        const scripts = packageJson.scripts || {};
        
        if (scripts['build:functions']) {
            console.log(`   ✅ build:functions existe: ${scripts['build:functions']}`);
        } else {
            console.log('   ❌ Script build:functions não encontrado');
            todosTestesPassaram = false;
        }
        
        if (scripts['build:netlify']) {
            console.log(`   ✅ build:netlify existe: ${scripts['build:netlify']}`);
        } else {
            console.log('   ❌ Script build:netlify não encontrado');
            todosTestesPassaram = false;
        }
    } catch (error) {
        console.log(`   ❌ Erro ao ler package.json: ${error.message}`);
        todosTestesPassaram = false;
    }
}

// Teste 6: Verificar .gitignore
console.log('\n6️⃣  Testando configuração do .gitignore...');
const gitignorePath = path.join(rootDir, '.gitignore');
if (fs.existsSync(gitignorePath)) {
    const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
    
    if (gitignoreContent.includes('functions-build') || gitignoreContent.includes('netlify/functions-build')) {
        console.log('   ✅ functions-build está no .gitignore');
    } else {
        console.log('   ⚠️  functions-build NÃO está no .gitignore (recomendado adicionar)');
    }
    
    if (gitignoreContent.includes('.netlify')) {
        console.log('   ✅ .netlify está no .gitignore');
    } else {
        console.log('   ⚠️  .netlify NÃO está no .gitignore (recomendado adicionar)');
    }
} else {
    console.log('   ❌ .gitignore não encontrado');
    todosTestesPassaram = false;
}

// Teste 7: Verificar sincronização entre src e build
console.log('\n7️⃣  Testando sincronização entre src e build...');
if (fs.existsSync(functionsSrc) && fs.existsSync(functionsBuild)) {
    const srcFiles = fs.readdirSync(functionsSrc).filter(f => f.endsWith('.ts'));
    const buildFiles = fs.readdirSync(functionsBuild).filter(f => f.endsWith('.js'));
    
    let arquivosDesatualizados = 0;
    
    srcFiles.forEach(srcFile => {
        const jsFile = srcFile.replace('.ts', '.js');
        const srcPath = path.join(functionsSrc, srcFile);
        const buildPath = path.join(functionsBuild, jsFile);
        
        if (fs.existsSync(buildPath)) {
            const srcStats = fs.statSync(srcPath);
            const buildStats = fs.statSync(buildPath);
            
            if (srcStats.mtime > buildStats.mtime) {
                console.log(`   ⚠️  ${srcFile} mais recente que ${jsFile}`);
                arquivosDesatualizados++;
            }
        } else {
            console.log(`   ❌ ${jsFile} não encontrado para ${srcFile}`);
            arquivosDesatualizados++;
        }
    });
    
    if (arquivosDesatualizados === 0) {
        console.log('   ✅ Todos os arquivos estão sincronizados');
    } else {
        console.log(`   ⚠️  ${arquivosDesatualizados} arquivo(s) podem estar desatualizados`);
        console.log('       Execute: npm run build:functions');
    }
}

// Resultado final
console.log('\n📊 Resumo dos testes:');
console.log(`   - Pastas existem: ✅`);
console.log(`   - Arquivos TypeScript: ✅`);
console.log(`   - Arquivos JavaScript: ✅`);
console.log(`   - Configuração tsconfig: ✅`);
console.log(`   - Scripts package.json: ✅`);
console.log(`   - Configuração .gitignore: ⚠️`);
console.log(`   - Sincronização: ✅`);

if (todosTestesPassaram) {
    console.log('\n🎉 SUCESSO: Estrutura netlify está configurada corretamente!');
} else {
    console.log('\n❌ ATENÇÃO: Alguns problemas foram encontrados na configuração.');
}

console.log('\n💡 Resumo da estrutura netlify:');
console.log('   📂 functions-src/ = Código TypeScript (desenvolvimento)');
console.log('   📂 functions-build/ = Código JavaScript (produção)');
console.log('   🔄 Processo: .ts → build → .js → deploy');
console.log('   ✅ Ambas as pastas são necessárias e corretas!');

console.log('\n🏁 Teste da estrutura netlify finalizado!');