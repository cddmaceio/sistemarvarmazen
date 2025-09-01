async function simularEdicaoReal() {
  try {
    console.log('🔍 Simulando edição real de lançamento...');
    
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
    
    // 3. Verificar duplicações por data ANTES da edição
    console.log('\n📅 Análise de duplicações ANTES da edição:');
    const lancamentosPorData = {};
    lancamentos.forEach(lanc => {
      const data = lanc.data_lancamento;
      if (!lancamentosPorData[data]) {
        lancamentosPorData[data] = [];
      }
      lancamentosPorData[data].push(lanc);
    });
    
    let duplicacoesAntes = 0;
    Object.keys(lancamentosPorData).forEach(data => {
      const lancamentosData = lancamentosPorData[data];
      if (lancamentosData.length > 1) {
        duplicacoesAntes++;
        console.log(`  ⚠️ ${data}: ${lancamentosData.length} lançamentos`);
        lancamentosData.forEach((lanc, index) => {
          console.log(`    ${index + 1}. ID: ${lanc.id}, Status Edição: ${lanc.status_edicao}`);
        });
      }
    });
    
    console.log(`\n📊 Total de datas com duplicação ANTES: ${duplicacoesAntes}`);
    
    // 4. Selecionar um lançamento para editar (primeiro da lista)
    const lancamentoParaEditar = lancamentos[0];
    console.log(`\n✏️ Selecionado para edição: ID ${lancamentoParaEditar.id}, Data: ${lancamentoParaEditar.data_lancamento}`);
    
    // 5. Simular edição do lançamento
    console.log('\n🔄 Simulando edição do lançamento...');
    const dadosEdicao = {
      tarefas_validas: (lancamentoParaEditar.tarefas_validas || 0) + 5,
      valor_tarefas: (lancamentoParaEditar.valor_tarefas || 0) + 100,
      subtotal_atividades: (lancamentoParaEditar.subtotal_atividades || 0) + 100,
      status_edicao: 'editado_admin',
      editado_por_admin: 'Admin Teste',
      data_edicao: new Date().toISOString(),
      observacoes_edicao: 'Teste de edição para verificar duplicação'
    };
    
    console.log('📝 Dados da edição:', dadosEdicao);
    
    // 6. Fazer a edição via API
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
    
    const lancamentoEditado = await edicaoResponse.json();
    console.log('✅ Lançamento editado com sucesso!');
    console.log('  Status Edição:', lancamentoEditado.status_edicao);
    console.log('  Editado por:', lancamentoEditado.editado_por_admin);
    
    // 7. Buscar lançamentos novamente APÓS a edição
    console.log('\n🔍 Verificando dados APÓS a edição...');
    const lancamentosAposResponse = await fetch(`http://localhost:8888/api/lancamentos?usuario_id=${usuario.id}&status=aprovado`);
    const lancamentosApos = await lancamentosAposResponse.json();
    
    console.log(`📊 Total de lançamentos aprovados APÓS edição: ${lancamentosApos.length}`);
    
    // 8. Verificar duplicações por data APÓS a edição
    console.log('\n📅 Análise de duplicações APÓS a edição:');
    const lancamentosPorDataApos = {};
    lancamentosApos.forEach(lanc => {
      const data = lanc.data_lancamento;
      if (!lancamentosPorDataApos[data]) {
        lancamentosPorDataApos[data] = [];
      }
      lancamentosPorDataApos[data].push(lanc);
    });
    
    let duplicacoesDepois = 0;
    Object.keys(lancamentosPorDataApos).forEach(data => {
      const lancamentosData = lancamentosPorDataApos[data];
      if (lancamentosData.length > 1) {
        duplicacoesDepois++;
        console.log(`  ⚠️ ${data}: ${lancamentosData.length} lançamentos`);
        lancamentosData.forEach((lanc, index) => {
          console.log(`    ${index + 1}. ID: ${lanc.id}, Status Edição: ${lanc.status_edicao}`);
        });
      }
    });
    
    console.log(`\n📊 Total de datas com duplicação APÓS: ${duplicacoesDepois}`);
    
    // 9. Verificar se a edição criou nova duplicação
    if (duplicacoesDepois > duplicacoesAntes) {
      console.log('\n🚨 PROBLEMA DETECTADO: A edição criou nova duplicação!');
    } else {
      console.log('\n✅ A edição não criou nova duplicação.');
    }
    
    // 10. Simular processamento do frontend (como no DashboardCollaborator.tsx)
    console.log('\n🔄 Simulando processamento do frontend...');
    
    // Filtrar lançamentos únicos por data (como no frontend)
    const lancamentosUnicos = lancamentosApos.filter((lancamento, index, array) => {
      return array.findIndex(l => l.data_lancamento === lancamento.data_lancamento) === index;
    });
    
    console.log(`📋 Lançamentos únicos após filtro frontend: ${lancamentosUnicos.length}`);
    
    // Verificar se o lançamento editado está no resultado final
    const lancamentoEditadoNoResultado = lancamentosUnicos.find(l => l.id === lancamentoParaEditar.id);
    
    if (lancamentoEditadoNoResultado) {
      console.log('✅ Lançamento editado aparece no resultado final');
      console.log(`  Status: ${lancamentoEditadoNoResultado.status_edicao}`);
      console.log(`  Editado por: ${lancamentoEditadoNoResultado.editado_por_admin}`);
    } else {
      console.log('❌ Lançamento editado NÃO aparece no resultado final!');
      
      // Verificar qual lançamento da mesma data foi selecionado
      const dataEditada = lancamentoParaEditar.data_lancamento;
      const lancamentoSelecionado = lancamentosUnicos.find(l => l.data_lancamento === dataEditada);
      
      if (lancamentoSelecionado) {
        console.log(`  Lançamento selecionado para ${dataEditada}:`);
        console.log(`    ID: ${lancamentoSelecionado.id}`);
        console.log(`    Status: ${lancamentoSelecionado.status_edicao}`);
        console.log(`    Editado por: ${lancamentoSelecionado.editado_por_admin || 'N/A'}`);
      }
    }
    
    // 11. Reverter a edição para não afetar outros testes
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
    console.error('❌ Erro durante a simulação:', error.message);
  }
}

simularEdicaoReal();