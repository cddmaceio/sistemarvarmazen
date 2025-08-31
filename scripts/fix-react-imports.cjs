const fs = require('fs');
const path = require('path');
const glob = require('glob');

function fixReactImports() {
  console.log('🔧 Iniciando correção de imports do React...');
  
  // Encontrar todos os arquivos .tsx e .ts na pasta src
  const files = glob.sync('src/**/*.{tsx,ts}', { cwd: __dirname });
  
  let fixedCount = 0;
  
  files.forEach(file => {
    const filePath = path.join(__dirname, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Verificar se o arquivo usa hooks do React mas não importa React explicitamente
    const usesReactHooks = /import.*\{.*(?:useState|useEffect|useContext|createContext|ReactNode).*\}.*from 'react'/.test(content);
    const hasReactImport = /import React/.test(content);
    
    if (usesReactHooks && !hasReactImport) {
      // Substituir a linha de import para incluir React
      const newContent = content.replace(
        /import\s*\{([^}]+)\}\s*from\s*'react';/,
        'import React, {$1} from \'react\';'
      );
      
      if (newContent !== originalContent) {
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log(`✅ Corrigido: ${filePath}`);
        fixedCount++;
      }
    }
  });
  
  console.log(`\n✨ Correção concluída! ${fixedCount} arquivos foram corrigidos.`);
  console.log('🚀 Reinicie o servidor de desenvolvimento para aplicar as mudanças.');
}

fixReactImports();