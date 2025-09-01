async function criarEdicaoEVerificar() {
  try {
    console.log('🔍 Criando edição real e verificando duplicação...');
    
    // Importar fetch dinamicamente
    const { default: fetch } = await import('node-fetch');
    
    // 1. Buscar usuário específico
    const usuarioResponse = await fetch('http://localhost:8888/api/usuarios');
    const usuarios = await usuarioResponse.json();
    const usuario = usuarios.find(u => u.cpf === '699.895.404-20');
    
    if (!usuario) {
      console.log('❌ Usuário não encontrado');
      return;
    }
    
    console.log('✅ Usuário encontrado:', usuario.nome);
    
    // 2. Buscar lançamentos aprovados
    const lancamentosResponse = await fetch(`http://localhost:8888/api/lancamentos?usuario_id=${usuario.id}&status=aprovado`);
    const lancamentos = await lancamentosResponse.json();
    
    console.log(`📊 Total de lançamentos aprovados: ${lancamentos.length}`);
    
    // 3. Encontrar uma data com múltiplos lançamentos
    const lancamentosPorData = {};
    lancamentos.forEach(lanc => {
      const data = lanc.data_lancamento;
      if (!lancamentosPorData[data]) {
        lancamentosPorData[data] = [];
      }
      lancamentosPorData[data].push(lanc);
    });
    
    // Encontrar data com duplicação
    let dataComDuplicacao = null;
    let lancamentosDataDuplicacao = [];
    
    Object.keys(lancamentosPorData).forEach(data => {
      if (lancamentosPorData[data].length > 1 && !dataComDuplicacao) {
        dataComDuplicacao = data;
        lancamentosDataDuplicacao = lancamentosPorData[data];
      }
    });
    
    if (!dataComDuplicacao) {
      console.log('❌ Não foi encontrada data com duplicação para testar');
      return;
    }
    
    console.log(`\n📅 Data com duplicação encontrada: ${dataComDuplicacao}`);
    console.log(`📊 Lançamentos nesta data: ${lancamentosDataDuplicacao.length}`);
    
    lancamentosDataDuplicacao.forEach((lanc, index) => {
      console.log(`  ${index + 1}. ID: ${lanc.id}, Status: ${lanc.status_edicao}, Criado: ${lanc.created_at}`);
    });
    
    // 4. Selecionar o segundo lançamento para editar (para não afetar o primeiro)
    const lancamentoParaEditar = lancamentosDataDuplicacao[1];
    console.log(`\n✏️ Selecionado para edição: ID ${lancamentoParaEditar.id}`);
    
    // 5. Fazer a edição via API
    console.log('\n🔄 Editando lançamento...');
    const dadosEdicao = {
      tarefas_validas: (lancamentoParaEditar.tarefas_validas || 0) + 10,
      valor_tarefas: (lancamentoParaEditar.valor_tarefas || 0) + 200,
      subtotal_atividades: (lancamentoParaEditar.subtotal_atividades || 0) + 200,
      status_edicao: 'editado_admin',
      editado_por_admin: 'Admin Teste Duplicação',
      data_edicao: new Date().toISOString(),
      observacoes_edicao: 'Teste para verificar duplicação no histórico'
    };
    
    const edicaoResponse = await fetch(`http://localhost:8888/api/lancamentos/${lancamentoParaEditar.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(dadosEdicao)
    });
    
    if (!edicaoResponse.ok) {
      const errorText = await edicaoResponse.text();
      console.log('❌ Erro na edição:', edicaoResponse.status, errorText);
      return;
    }
    
    console.log('✅ Lançamento editado com sucesso!');
    
    // 6. Buscar lançamentos novamente
    const lancamentosAtualizadosResponse = await fetch(`http://localhost:8888/api/lancamentos?usuario_id=${usuario.id}&status=aprovado`);
    const lancamentosAtualizados = await lancamentosAtualizadosResponse.json();
    
    console.log(`\n📊 Total de lançamentos após edição: ${lancamentosAtualizados.length}`);
    
    // 7. Verificar a data específica após edição
    const lancamentosDataAposEdicao = lancamentosAtualizados.filter(l => l.data_lancamento === dataComDuplicacao);
    console.log(`\n📅 Lançamentos em ${dataComDuplicacao} após edição: ${lancamentosDataAposEdicao.length}`);
    
    lancamentosDataAposEdicao.forEach((lanc, index) => {
      console.log(`  ${index + 1}. ID: ${lanc.id}`);
      console.log(`     Status: ${lanc.status_edicao}`);
      console.log(`     Editado por: ${lanc.editado_por_admin || 'N/A'}`);
      console.log(`     Tarefas: ${lanc.tarefas_validas || 0}`);
      console.log(`     Valor: ${lanc.valor_tarefas || 0}`);
      console.log(`     ---`);
    });
    
    // 8. Simular filtro atual do frontend
    console.log('\n🔄 Simulando filtro ATUAL do frontend:');
    const lancamentosUnicosAtual = lancamentosAtualizados.filter((lancamento, index, array) => {
      return array.findIndex(l => l.data_lancamento === lancamento.data_lancamento) === index;
    });
    
    const selecionadoAtual = lancamentosUnicosAtual.find(l => l.data_lancamento === dataComDuplicacao);
    console.log(`  Selecionado: ID ${selecionadoAtual.id}, Status: ${selecionadoAtual.status_edicao}`);
    
    // 9. Simular filtro CORRIGIDO (priorizar editados)
    console.log('\n🔧 Simulando filtro CORRIGIDO (priorizar editados):');
    
    // Agrupar por data
    const porDataCorrigido = {};
    lancamentosAtualizados.forEach(lanc => {
      const data = lanc.data_lancamento;
      if (!porDataCorrigido[data]) {
        porDataCorrigido[data] = [];
      }
      porDataCorrigido[data].push(lanc);
    });
    
    // Para cada data, priorizar editados
    const lancamentosUnicosCorrigido = [];
    Object.keys(porDataCorrigido).forEach(data => {
      const lancamentosData = porDataCorrigido[data];
      
      // Procurar primeiro por editados
      let selecionado = lancamentosData.find(l => l.status_edicao === 'editado_admin');
      
      // Se não houver editado, pegar o primeiro
      if (!selecionado) {
        selecionado = lancamentosData[0];
      }
      
      lancamentosUnicosCorrigido.push(selecionado);
    });
    
    const selecionadoCorrigido = lancamentosUnicosCorrigido.find(l => l.data_lancamento === dataComDuplicacao);
    console.log(`  Selecionado: ID ${selecionadoCorrigido.id}, Status: ${selecionadoCorrigido.status_edicao}`);
    
    // 10. Comparar resultados
    console.log('\n📊 Comparação:');
    if (selecionadoAtual.id !== selecionadoCorrigido.id) {
      console.log('🚨 PROBLEMA DETECTADO!');
      console.log(`  Filtro atual selecionou: ID ${selecionadoAtual.id} (${selecionadoAtual.status_edicao})`);
      console.log(`  Filtro corrigido selecionou: ID ${selecionadoCorrigido.id} (${selecionadoCorrigido.status_edicao})`);
      
      if (selecionadoAtual.status_edicao === 'original' && selecionadoCorrigido.status_edicao === 'editado_admin') {
        console.log('\n💡 CAUSA: O filtro atual não prioriza lançamentos editados!');
        console.log('   Resultado: Lançamentos editados podem não aparecer no histórico.');
      }
    } else {
      console.log('✅ Ambos os filtros selecionaram o mesmo lançamento.');
    }
    
    // 11. Reverter edição
    console.log('\n🔄 Revertendo edição...');
    const reversaoResponse = await fetch(`http://localhost:8888/api/lancamentos/${lancamentoParaEditar.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tarefas_validas: lancamentoParaEditar.tarefas_validas,
        valor_tarefas: lancamentoParaEditar.valor_tarefas,
        subtotal_atividades: lancamentoParaEditar.subtotal_atividades,
        status_edicao: 'original',
        editado_por_admin: null,
        data_edicao: null,
        observacoes_edicao: null
      })
    });
    
    if (reversaoResponse.ok) {
      console.log('✅ Edição revertida com sucesso!');
    } else {
      console.log('⚠️ Erro ao reverter edição');
    }
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
  }
}

criarEdicaoEVerificar();