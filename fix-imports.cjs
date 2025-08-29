const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Função para corrigir imports em um arquivo
function fixImportsInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Substituir @/react-app/components/ por @/components/
    content = content.replace(/@\/react-app\/components\//g, '@/components/');
    
    // Substituir @/react-app/lib/ por @/lib-react/
    content = content.replace(/@\/react-app\/lib\//g, '@/lib-react/');
    
    // Substituir @/react-app/hooks/ por @/hooks/
    content = content.replace(/@\/react-app\/hooks\//g, '@/hooks/');
    
    // Substituir @/react-app/pages/ por @/pages/
    content = content.replace(/@\/react-app\/pages\//g, '@/pages/');
    
    // Se houve mudanças, salvar o arquivo
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Corrigido: ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`❌ Erro ao processar ${filePath}:`, error.message);
    return false;
  }
}

// Função para encontrar todos os arquivos TypeScript/JavaScript
function findFiles(dir, extensions = ['.tsx', '.ts', '.jsx', '.js']) {
  let files = [];
  
  try {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        files = files.concat(findFiles(fullPath, extensions));
      } else if (stat.isFile() && extensions.some(ext => item.endsWith(ext))) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    console.error(`❌ Erro ao ler diretório ${dir}:`, error.message);
  }
  
  return files;
}

// Executar correção
console.log('🔧 Iniciando correção de imports...');

const srcDir = path.join(__dirname, 'src');
const files = findFiles(srcDir);

let fixedCount = 0;
for (const file of files) {
  if (fixImportsInFile(file)) {
    fixedCount++;
  }
}

console.log(`\n✨ Correção concluída! ${fixedCount} arquivos foram corrigidos.`);
console.log('🚀 Reinicie o servidor de desenvolvimento para aplicar as mudanças.');