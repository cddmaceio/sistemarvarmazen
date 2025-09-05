// Script para verificar balanceamento de chaves no ProductivityDashboard
const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando balanceamento de chaves...');

const dashboardPath = path.join(__dirname, '..', 'src', 'components', 'ProductivityDashboard.tsx');

try {
  const content = fs.readFileSync(dashboardPath, 'utf8');
  const lines = content.split('\n');
  
  let braceStack = [];
  let parenStack = [];
  let bracketStack = [];
  let issues = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;
    
    // Ignorar comentários e strings
    let cleanLine = line.replace(/\/\/.*$/, '').replace(/\/\*[\s\S]*?\*\//g, '');
    
    // Remover strings para evitar falsos positivos
    cleanLine = cleanLine.replace(/["'`][^"'`]*["'`]/g, '');
    
    for (let j = 0; j < cleanLine.length; j++) {
      const char = cleanLine[j];
      
      switch (char) {
        case '{':
          braceStack.push({ line: lineNum, col: j + 1, char });
          break;
        case '}':
          if (braceStack.length === 0) {
            issues.push(`Linha ${lineNum}: Chave de fechamento '}' sem abertura correspondente`);
          } else {
            braceStack.pop();
          }
          break;
        case '(':
          parenStack.push({ line: lineNum, col: j + 1, char });
          break;
        case ')':
          if (parenStack.length === 0) {
            issues.push(`Linha ${lineNum}: Parêntese de fechamento ')' sem abertura correspondente`);
          } else {
            parenStack.pop();
          }
          break;
        case '[':
          bracketStack.push({ line: lineNum, col: j + 1, char });
          break;
        case ']':
          if (bracketStack.length === 0) {
            issues.push(`Linha ${lineNum}: Colchete de fechamento ']' sem abertura correspondente`);
          } else {
            bracketStack.pop();
          }
          break;
      }
    }
  }
  
  // Verificar se há chaves não fechadas
  if (braceStack.length > 0) {
    braceStack.forEach(brace => {
      issues.push(`Linha ${brace.line}: Chave de abertura '{' não fechada`);
    });
  }
  
  if (parenStack.length > 0) {
    parenStack.forEach(paren => {
      issues.push(`Linha ${paren.line}: Parêntese de abertura '(' não fechado`);
    });
  }
  
  if (bracketStack.length > 0) {
    bracketStack.forEach(bracket => {
      issues.push(`Linha ${bracket.line}: Colchete de abertura '[' não fechado`);
    });
  }
  
  console.log('\n📊 Resultado da análise:');
  console.log(`Total de linhas: ${lines.length}`);
  console.log(`Chaves abertas encontradas: ${content.match(/\{/g)?.length || 0}`);
  console.log(`Chaves fechadas encontradas: ${content.match(/\}/g)?.length || 0}`);
  console.log(`Parênteses abertos encontrados: ${content.match(/\(/g)?.length || 0}`);
  console.log(`Parênteses fechados encontrados: ${content.match(/\)/g)?.length || 0}`);
  
  if (issues.length === 0) {
    console.log('\n✅ Nenhum problema de balanceamento encontrado!');
  } else {
    console.log('\n🚨 Problemas encontrados:');
    issues.forEach(issue => {
      console.log(`❌ ${issue}`);
    });
    
    // Mostrar as linhas problemáticas
    console.log('\n📝 Linhas com possíveis problemas:');
    const problemLines = new Set();
    issues.forEach(issue => {
      const lineMatch = issue.match(/Linha (\d+)/);
      if (lineMatch) {
        problemLines.add(parseInt(lineMatch[1]));
      }
    });
    
    Array.from(problemLines).sort((a, b) => a - b).forEach(lineNum => {
      const line = lines[lineNum - 1];
      console.log(`${lineNum.toString().padStart(3)}: ${line}`);
    });
  }
  
  // Verificar especificamente a seção individual
  console.log('\n🔍 Verificando seção individual especificamente...');
  
  const individualMatch = content.match(/(activeTab === 'individual'[\s\S]*?)(?=\}\s*<\/div>\s*\);\s*};|$)/g);
  
  if (individualMatch && individualMatch[0]) {
    const individualSection = individualMatch[0];
    const individualBraces = (individualSection.match(/\{/g) || []).length;
    const individualCloseBraces = (individualSection.match(/\}/g) || []).length;
    
    console.log(`Chaves abertas na seção individual: ${individualBraces}`);
    console.log(`Chaves fechadas na seção individual: ${individualCloseBraces}`);
    
    if (individualBraces !== individualCloseBraces) {
      console.log('❌ Seção individual tem chaves desbalanceadas');
      console.log(`Diferença: ${individualBraces - individualCloseBraces}`);
    } else {
      console.log('✅ Seção individual tem chaves balanceadas');
    }
  }
  
} catch (error) {
  console.error('❌ Erro ao analisar o arquivo:', error.message);
}

console.log('\n🏁 Verificação concluída.');