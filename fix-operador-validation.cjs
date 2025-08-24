const fs = require('fs');

console.log('=== CORREÇÃO DA VALIDAÇÃO PARA OPERADOR DE EMPILHADEIRA ===\n');

// Ler o arquivo da API atual
const apiPath = './netlify/functions-build/api.js';
let apiContent = fs.readFileSync(apiPath, 'utf8');

console.log('📄 Lendo arquivo da API...');
console.log(`Tamanho do arquivo: ${apiContent.length} caracteres`);

// Encontrar onde adicionar a validação
const searchPattern = 'Handle multiple activities';
const insertionPoint = apiContent.indexOf('// Handle multiple activities');

if (insertionPoint === -1) {
  console.log('❌ Não foi possível encontrar o ponto de inserção na API');
  process.exit(1);
}

console.log(`✅ Ponto de inserção encontrado na posição: ${insertionPoint}`);

// Código de validação a ser inserido
const validationCode = `
          // VALIDAÇÃO: Operador de Empilhadeira não pode ter multiple_activities
          if (input.funcao === 'Operador de Empilhadeira' && input.multiple_activities && input.multiple_activities.length > 0) {
            console.log('❌ ERRO: Operador de Empilhadeira não pode ter multiple_activities');
            console.log('Dados recebidos:', {
              funcao: input.funcao,
              multiple_activities: input.multiple_activities,
              valid_tasks_count: input.valid_tasks_count
            });
            return c.json({ 
              error: 'Operador de Empilhadeira não pode ter múltiplas atividades. Use valid_tasks_count para tarefas válidas.',
              details: {
                funcao_recebida: input.funcao,
                multiple_activities_recebidas: input.multiple_activities.length,
                solucao: 'Para Operador de Empilhadeira, use o campo valid_tasks_count em vez de multiple_activities'
              }
            }, 400);
          }

          // `;

// Inserir a validação antes do processamento de multiple_activities
const beforeMultipleActivities = apiContent.substring(0, insertionPoint);
const afterMultipleActivities = apiContent.substring(insertionPoint);

const newApiContent = beforeMultipleActivities + validationCode + afterMultipleActivities;

console.log('\n🔧 APLICANDO CORREÇÃO...');
console.log('Adicionando validação para impedir multiple_activities em Operador de Empilhadeira');

// Salvar o arquivo corrigido
fs.writeFileSync(apiPath, newApiContent);

console.log('✅ Arquivo da API atualizado com sucesso!');
console.log(`Novo tamanho do arquivo: ${newApiContent.length} caracteres`);

// Verificar se a correção foi aplicada
const verification = newApiContent.includes('Operador de Empilhadeira não pode ter multiple_activities');
console.log(`Verificação da correção: ${verification ? '✅ Aplicada' : '❌ Falhou'}`);

// Criar um script de teste para validar a correção
const testScript = `
// Script de teste para validar a correção
const testCases = [
  {
    name: 'Operador com multiple_activities (deve falhar)',
    input: {
      funcao: 'Operador de Empilhadeira',
      multiple_activities: [
        { nome_atividade: 'Limpeza', valor: 10 },
        { nome_atividade: 'Organização', valor: 15 }
      ]
    },
    expected: 'error'
  },
  {
    name: 'Operador com valid_tasks_count (deve funcionar)',
    input: {
      funcao: 'Operador de Empilhadeira',
      valid_tasks_count: 150
    },
    expected: 'success'
  },
  {
    name: 'Ajudante com multiple_activities (deve funcionar)',
    input: {
      funcao: 'Ajudante',
      multiple_activities: [
        { nome_atividade: 'Limpeza', valor: 10 }
      ]
    },
    expected: 'success'
  }
];

console.log('=== CASOS DE TESTE PARA VALIDAÇÃO ===');
testCases.forEach((test, index) => {
  console.log(\`\${index + 1}. \${test.name}\`);
  console.log('   Input:', JSON.stringify(test.input, null, 2));
  console.log('   Resultado esperado:', test.expected);
  console.log();
});

console.log('💡 Para testar, envie esses dados para a API e verifique se:');
console.log('   - Operador com multiple_activities retorna erro 400');
console.log('   - Operador com valid_tasks_count funciona normalmente');
console.log('   - Ajudante com multiple_activities funciona normalmente');
`;

fs.writeFileSync('test-operador-validation.js', testScript);
console.log('\n📋 Script de teste criado: test-operador-validation.js');

// Resumo da correção
console.log('\n=== RESUMO DA CORREÇÃO ===');
console.log('✅ Validação adicionada na API');
console.log('✅ Operador de Empilhadeira não pode mais ter multiple_activities');
console.log('✅ Erro 400 será retornado com mensagem explicativa');
console.log('✅ Script de teste criado para validar a correção');
console.log('\n🚀 A API agora está protegida contra essa inconsistência!');

// Salvar log da correção
const logCorrection = {
  timestamp: new Date().toISOString(),
  action: 'fix-operador-validation',
  description: 'Adicionada validação para impedir multiple_activities em Operador de Empilhadeira',
  files_modified: ['netlify/functions-build/api.js'],
  files_created: ['test-operador-validation.js'],
  validation_added: {
    condition: 'input.funcao === "Operador de Empilhadeira" && input.multiple_activities && input.multiple_activities.length > 0',
    response: 'HTTP 400 - Error message explaining the issue',
    solution: 'Use valid_tasks_count instead of multiple_activities for Operador de Empilhadeira'
  }
};

fs.writeFileSync('fix-operador-validation-log.json', JSON.stringify(logCorrection, null, 2));
console.log('📄 Log da correção salvo em: fix-operador-validation-log.json');