async function debugApisFrontend() {
  const { default: fetch } = await import('node-fetch');
  console.log('🔍 DEBUG: Testando todas as APIs que o frontend chama');
  console.log('=' .repeat(60));
  
  const userId = 3; // Ronier Teste
  const baseUrl = 'http://localhost:5173';
  
  try {
    // 1. Testar API de lançamentos aprovados (principal)
    console.log('\n📋 1. Testando /api/lancamentos?user_id=3&status=aprovado:');
    const response1 = await fetch(`${baseUrl}/api/lancamentos?user_id=${userId}&status=aprovado`);
    const aprovados = await response1.json();
    
    console.log(`Status: ${response1.status}`);
    console.log(`Total: ${aprovados.length} lançamentos`);
    
    aprovados.forEach((item, index) => {
      console.log(`   ${index + 1}. ID: ${item.id}, Data: ${item.data_lancamento}, Status: ${item.status}, Valor: R$ ${(item.subtotal_atividades || item.valor_tarefas || 0) + (item.bonus_kpis || 0)}`);
    });
    
    // 2. Testar API de todos os lançamentos
    console.log('\n📋 2. Testando /api/lancamentos/todos?user_id=3:');
    const response2 = await fetch(`${baseUrl}/api/lancamentos/todos?user_id=${userId}`);
    const todos = await response2.json();
    
    console.log(`Status: ${response2.status}`);
    console.log(`Total: ${todos.length} lançamentos`);
    
    todos.forEach((item, index) => {
      console.log(`   ${index + 1}. ID: ${item.id}, Data: ${item.data_lancamento}, Status: ${item.status}`);
    });
    
    // 3. Testar API de usuário
    console.log('\n👤 3. Testando /api/users/profile?cpf=699.895.404-20:');
    const response3 = await fetch(`${baseUrl}/api/users/profile?cpf=699.895.404-20`);
    const user = await response3.json();
    
    console.log(`Status: ${response3.status}`);
    if (user.id) {
      console.log(`Usuário encontrado: ID ${user.id}, Nome: ${user.nome}`);
    } else {
      console.log('Usuário não encontrado ou erro');
    }
    
    // 4. Verificar se há diferença entre as APIs
    console.log('\n🔍 4. Comparando resultados:');
    
    const aprovadosIds = aprovados.map(item => item.id).sort();
    const todosAprovados = todos.filter(item => item.status === 'aprovado').map(item => item.id).sort();
    
    console.log(`IDs dos aprovados (API principal): [${aprovadosIds.join(', ')}]`);
    console.log(`IDs dos aprovados (API todos): [${todosAprovados.join(', ')}]`);
    
    if (JSON.stringify(aprovadosIds) === JSON.stringify(todosAprovados)) {
      console.log('✅ APIs retornam os mesmos lançamentos aprovados');
    } else {
      console.log('❌ APIs retornam lançamentos diferentes!');
    }
    
    // 5. Verificar especificamente o lançamento de 04/08/2025
    console.log('\n🎯 5. Verificando lançamento de 04/08/2025:');
    
    const lancamento04 = aprovados.find(item => item.data_lancamento.startsWith('2025-08-04'));
    
    if (lancamento04) {
      console.log('✅ Lançamento de 04/08/2025 encontrado na API!');
      console.log(`   ID: ${lancamento04.id}`);
      console.log(`   Data completa: ${lancamento04.data_lancamento}`);
      console.log(`   Status: ${lancamento04.status}`);
      console.log(`   Editado por admin: ${lancamento04.editado_por_admin}`);
      console.log(`   Valor total: R$ ${(lancamento04.subtotal_atividades || lancamento04.valor_tarefas || 0) + (lancamento04.bonus_kpis || 0)}`);
    } else {
      console.log('❌ Lançamento de 04/08/2025 NÃO encontrado na API!');
    }
    
    // 6. Testar formatação de data
    console.log('\n📅 6. Testando formatação de datas:');
    
    aprovados.forEach((item, index) => {
      const dateOnly = item.data_lancamento.split('T')[0];
      const [year, month, day] = dateOnly.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      const formatted = date.toLocaleDateString('pt-BR');
      
      console.log(`   ${index + 1}. ${item.data_lancamento} -> ${formatted}`);
    });
    
    // 7. Verificar se o servidor está respondendo corretamente
    console.log('\n🌐 7. Verificando status do servidor:');
    
    const healthResponse = await fetch(`${baseUrl}/api/health`).catch(() => null);
    if (healthResponse) {
      console.log(`✅ Servidor respondendo: ${healthResponse.status}`);
    } else {
      console.log('❌ Servidor não está respondendo');
    }
    
  } catch (error) {
    console.error('❌ Erro durante o teste das APIs:', error.message);
  }
}

debugApisFrontend();