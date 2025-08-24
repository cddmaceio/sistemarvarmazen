
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
  console.log(`${index + 1}. ${test.name}`);
  console.log('   Input:', JSON.stringify(test.input, null, 2));
  console.log('   Resultado esperado:', test.expected);
  console.log();
});

console.log('💡 Para testar, envie esses dados para a API e verifique se:');
console.log('   - Operador com multiple_activities retorna erro 400');
console.log('   - Operador com valid_tasks_count funciona normalmente');
console.log('   - Ajudante com multiple_activities funciona normalmente');
