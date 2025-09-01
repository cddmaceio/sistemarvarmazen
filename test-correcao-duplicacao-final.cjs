const BASE_URL = 'http://localhost:8888';
const USER_CPF = '699.895.404-20';
const USER_BIRTH_DATE = '01/11/1990';

async function testCorrecaoDuplicacao() {
  const { default: fetch } = await import('node-fetch');
  console.log('🔍 Testando correção de duplicação no histórico...');
  
  try {
    // 1. Buscar usuário
    const userResponse = await fetch(`${BASE_URL}/api/usuarios`);
    
    if (!userResponse.ok) {
      const errorText = await userResponse.text();
      throw new Error(`Erro HTTP ${userResponse.status}: ${errorText}`);
    }
    
    const usuarios = await userResponse.json();
    const usuario = usuarios.find(u => u.cpf === USER_CPF);
    
    if (!usuario) {
      throw new Error('Usuário não encontrado');
    }
    
    const userId = usuario.id;
    console.log(`✅ Usuário encontrado: ${usuario.nome}`);
    
    // 2. Buscar lançamentos aprovados
    const lancamentosResponse = await fetch(`${BASE_URL}/api/lancamentos?user_id=${userId}&status=aprovado`);
    
    if (!lancamentosResponse.ok) {
      const errorText = await lancamentosResponse.text();
      throw new Error(`Erro HTTP ${lancamentosResponse.status}: ${errorText}`);
    }
    
    const lancamentos = await lancamentosResponse.json();
    console.log('📝 Resposta dos lançamentos:', JSON.stringify(lancamentos).substring(0, 200));
    
    if (!Array.isArray(lancamentos)) {
      throw new Error(`Erro: resposta não é um array: ${JSON.stringify(lancamentos)}`);
    }
    console.log(`📊 Total de lançamentos aprovados: ${lancamentos.length}`);
    
    // 3. Encontrar uma data com múltiplos lançamentos
    const lancamentosPorData = {};
    lancamentos.forEach(l => {
      const data = l.data_lancamento;
      if (!lancamentosPorData[data]) {
        lancamentosPorData[data] = [];
      }
      lancamentosPorData[data].push(l);
    });
    
    const datasComMultiplos = Object.entries(lancamentosPorData)
      .filter(([data, lancamentos]) => lancamentos.length > 1)
      .sort(([a], [b]) => b.localeCompare(a)); // Mais recentes primeiro
    
    if (datasComMultiplos.length === 0) {
      console.log('❌ Nenhuma data com múltiplos lançamentos encontrada');
      return;
    }
    
    const [dataEscolhida, lancamentosDaData] = datasComMultiplos[0];
    console.log(`🎯 Testando com data: ${dataEscolhida} (${lancamentosDaData.length} lançamentos)`);
    
    // 4. Simular filtro ANTES da edição
    console.log('\n🔍 Estado ANTES da edição:');
    const lancamentosUnicos = [];
    const datasProcessadas = new Set();
    
    // Ordenar por data (mais recente primeiro) e depois por ID (mais recente primeiro)
    const lancamentosOrdenados = [...lancamentos].sort((a, b) => {
      const dataCompare = b.data_lancamento.localeCompare(a.data_lancamento);
      if (dataCompare !== 0) return dataCompare;
      return b.id - a.id;
    });
    
    lancamentosOrdenados.forEach(lancamento => {
      if (!datasProcessadas.has(lancamento.data_lancamento)) {
        lancamentosUnicos.push(lancamento);
        datasProcessadas.add(lancamento.data_lancamento);
      }
    });
    
    console.log(`   Lançamentos únicos (filtro atual): ${lancamentosUnicos.length}`);
    const lancamentoAntes = lancamentosUnicos.find(l => l.data_lancamento === dataEscolhida);
    console.log(`   Lançamento selecionado para ${dataEscolhida}: ID ${lancamentoAntes.id} (status_edicao: ${lancamentoAntes.status_edicao})`);
    
    // 5. Editar um lançamento diferente do selecionado
    const lancamentoParaEditar = lancamentosDaData.find(l => l.id !== lancamentoAntes.id);
    if (!lancamentoParaEditar) {
      console.log('❌ Não foi possível encontrar um lançamento diferente para editar');
      return;
    }
    
    console.log(`\n✏️ Editando lançamento ID ${lancamentoParaEditar.id}...`);
    
    const dadosEdicao = {
      status_edicao: 'editado_admin',
      editado_por_admin: 'Admin Teste',
      data_edicao: new Date().toISOString(),
      tarefas_validas: lancamentoParaEditar.tarefas_validas + 1,
      valor_tarefas: (lancamentoParaEditar.valor_tarefas || 0) + 10,
      subtotal_atividades: (lancamentoParaEditar.subtotal_atividades || 0) + 10,
      remuneracao_total: (lancamentoParaEditar.remuneracao_total || 0) + 10,
      observacoes: 'Teste de correção de duplicação'
    };
    
    const editResponse = await fetch(`${BASE_URL}/api/lancamentos/${lancamentoParaEditar.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dadosEdicao)
    });
    
    const editResult = await editResponse.json();
    if (!editResult.success) {
      throw new Error(`Erro ao editar lançamento: ${editResult.error}`);
    }
    
    console.log('✅ Lançamento editado com sucesso');
    
    // 6. Buscar lançamentos novamente APÓS a edição
    const lancamentosResponse2 = await fetch(`${BASE_URL}/api/lancamentos?user_id=${userId}&status=aprovado`);
    const lancamentosData2 = await lancamentosResponse2.json();
    const lancamentosAposEdicao = lancamentosData2.data;
    
    console.log(`\n🔍 Estado APÓS a edição:`);
    console.log(`📊 Total de lançamentos aprovados: ${lancamentosAposEdicao.length}`);
    
    // 7. Simular filtro APÓS a edição com lógica CORRIGIDA
    const lancamentosUnicosCorrigidos = [];
    const datasProcessadasCorrigidas = new Set();
    
    // Ordenar priorizando lançamentos editados
    const lancamentosOrdenadosCorrigidos = [...lancamentosAposEdicao].sort((a, b) => {
      const dataCompare = b.data_lancamento.localeCompare(a.data_lancamento);
      if (dataCompare !== 0) return dataCompare;
      
      // Para a mesma data, priorizar lançamentos editados
      const aEditado = a.status_edicao === 'editado_admin';
      const bEditado = b.status_edicao === 'editado_admin';
      
      if (aEditado && !bEditado) return -1;
      if (!aEditado && bEditado) return 1;
      
      // Se ambos têm o mesmo status de edição, ordenar por ID (mais recente primeiro)
      return b.id - a.id;
    });
    
    lancamentosOrdenadosCorrigidos.forEach(lancamento => {
      if (!datasProcessadasCorrigidas.has(lancamento.data_lancamento)) {
        lancamentosUnicosCorrigidos.push(lancamento);
        datasProcessadasCorrigidas.add(lancamento.data_lancamento);
      }
    });
    
    console.log(`   Lançamentos únicos (filtro corrigido): ${lancamentosUnicosCorrigidos.length}`);
    const lancamentoDepois = lancamentosUnicosCorrigidos.find(l => l.data_lancamento === dataEscolhida);
    console.log(`   Lançamento selecionado para ${dataEscolhida}: ID ${lancamentoDepois.id} (status_edicao: ${lancamentoDepois.status_edicao})`);
    
    // 8. Verificar se a correção funcionou
    console.log('\n🎯 Resultado da correção:');
    if (lancamentoDepois.status_edicao === 'editado_admin') {
      console.log('✅ SUCESSO: O lançamento editado foi corretamente priorizado!');
      console.log(`   Antes: ID ${lancamentoAntes.id} (${lancamentoAntes.status_edicao})`);
      console.log(`   Depois: ID ${lancamentoDepois.id} (${lancamentoDepois.status_edicao})`);
    } else {
      console.log('❌ PROBLEMA: O lançamento editado não foi priorizado');
      console.log(`   Esperado: ID ${lancamentoParaEditar.id} (editado_admin)`);
      console.log(`   Obtido: ID ${lancamentoDepois.id} (${lancamentoDepois.status_edicao})`);
    }
    
    // 9. Reverter a edição
    console.log('\n🔄 Revertendo edição...');
    const revertData = {
      status_edicao: 'original',
      editado_por_admin: null,
      data_edicao: null,
      tarefas_validas: lancamentoParaEditar.tarefas_validas,
      valor_tarefas: lancamentoParaEditar.valor_tarefas,
      subtotal_atividades: lancamentoParaEditar.subtotal_atividades,
      remuneracao_total: lancamentoParaEditar.remuneracao_total,
      observacoes: lancamentoParaEditar.observacoes
    };
    
    const revertResponse = await fetch(`${BASE_URL}/api/lancamentos/${lancamentoParaEditar.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(revertData)
    });
    
    const revertResult = await revertResponse.json();
    if (revertResult.success) {
      console.log('✅ Edição revertida com sucesso');
    } else {
      console.log('⚠️ Erro ao reverter edição:', revertResult.error);
    }
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
  }
}

testCorrecaoDuplicacao();