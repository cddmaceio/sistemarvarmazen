async function analisarFiltroFrontend() {
  try {
    console.log('🔍 Analisando filtro do frontend em detalhes...');
    
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
    
    console.log('✅ Usuário encontrado:', usuario.nome, '- Função:', usuario.funcao);
    
    // 2. Buscar lançamentos aprovados
    const lancamentosResponse = await fetch(`http://localhost:8888/api/lancamentos?usuario_id=${usuario.id}&status=aprovado`);
    const lancamentos = await lancamentosResponse.json();
    
    console.log(`\n📊 Total de lançamentos aprovados: ${lancamentos.length}`);
    
    // 3. Analisar duplicações em detalhes
    console.log('\n📅 Análise detalhada de duplicações:');
    const lancamentosPorData = {};
    
    lancamentos.forEach(lanc => {
      const data = lanc.data_lancamento;
      if (!lancamentosPorData[data]) {
        lancamentosPorData[data] = [];
      }
      lancamentosPorData[data].push(lanc);
    });
    
    // Mostrar todas as datas e seus lançamentos
    Object.keys(lancamentosPorData).sort().forEach(data => {
      const lancamentosData = lancamentosPorData[data];
      console.log(`\n📅 ${data}: ${lancamentosData.length} lançamento(s)`);
      
      lancamentosData.forEach((lanc, index) => {
        console.log(`  ${index + 1}. ID: ${lanc.id}`);
        console.log(`     Status Edição: ${lanc.status_edicao}`);
        console.log(`     Editado por: ${lanc.editado_por_admin || 'N/A'}`);
        console.log(`     Tarefas Válidas: ${lanc.tarefas_validas || 0}`);
        console.log(`     Valor Tarefas: ${lanc.valor_tarefas || 0}`);
        console.log(`     Subtotal: ${lanc.subtotal_atividades || 0}`);
        console.log(`     Criado em: ${lanc.created_at}`);
        console.log(`     ---`);
      });
    });
    
    // 4. Simular o filtro do frontend (findIndex)
    console.log('\n🔄 Simulando filtro do frontend (findIndex):');
    
    const lancamentosUnicos = lancamentos.filter((lancamento, index, array) => {
      const primeiroIndex = array.findIndex(l => l.data_lancamento === lancamento.data_lancamento);
      const ehPrimeiro = primeiroIndex === index;
      
      if (!ehPrimeiro) {
        console.log(`  ❌ Removido: ID ${lancamento.id} (${lancamento.data_lancamento}) - Primeiro é ID ${array[primeiroIndex].id}`);
      }
      
      return ehPrimeiro;
    });
    
    console.log(`\n📋 Resultado do filtro: ${lancamentosUnicos.length} lançamentos únicos`);
    
    // 5. Mostrar quais lançamentos foram selecionados
    console.log('\n✅ Lançamentos selecionados pelo filtro:');
    lancamentosUnicos.forEach((lanc, index) => {
      console.log(`  ${index + 1}. ID: ${lanc.id}, Data: ${lanc.data_lancamento}`);
      console.log(`     Status Edição: ${lanc.status_edicao}`);
      console.log(`     Editado por: ${lanc.editado_por_admin || 'N/A'}`);
      console.log(`     Criado em: ${lanc.created_at}`);
    });
    
    // 6. Verificar se há lançamentos editados que foram removidos
    console.log('\n🔍 Verificando lançamentos editados removidos pelo filtro:');
    
    const lancamentosEditados = lancamentos.filter(l => l.status_edicao === 'editado_admin');
    const editadosRemovidos = lancamentosEditados.filter(editado => {
      return !lancamentosUnicos.find(unico => unico.id === editado.id);
    });
    
    if (editadosRemovidos.length > 0) {
      console.log(`🚨 PROBLEMA: ${editadosRemovidos.length} lançamentos editados foram removidos pelo filtro!`);
      editadosRemovidos.forEach((lanc, index) => {
        console.log(`  ${index + 1}. ID: ${lanc.id}, Data: ${lanc.data_lancamento}`);
        console.log(`     Editado por: ${lanc.editado_por_admin}`);
        console.log(`     Data edição: ${lanc.data_edicao}`);
        
        // Verificar qual lançamento foi selecionado no lugar
        const selecionado = lancamentosUnicos.find(u => u.data_lancamento === lanc.data_lancamento);
        if (selecionado) {
          console.log(`     Selecionado no lugar: ID ${selecionado.id} (${selecionado.status_edicao})`);
        }
      });
    } else {
      console.log('✅ Nenhum lançamento editado foi removido pelo filtro.');
    }
    
    // 7. Simular a lógica correta (priorizar editados)
    console.log('\n🔧 Simulando filtro CORRIGIDO (priorizar editados):');
    
    const lancamentosUnicosCorrigidos = [];
    const datasProcessadas = new Set();
    
    // Primeiro, adicionar todos os lançamentos editados
    lancamentos
      .filter(l => l.status_edicao === 'editado_admin')
      .forEach(lanc => {
        if (!datasProcessadas.has(lanc.data_lancamento)) {
          lancamentosUnicosCorrigidos.push(lanc);
          datasProcessadas.add(lanc.data_lancamento);
          console.log(`  ✅ Adicionado editado: ID ${lanc.id} (${lanc.data_lancamento})`);
        }
      });
    
    // Depois, adicionar lançamentos originais para datas não processadas
    lancamentos
      .filter(l => l.status_edicao !== 'editado_admin')
      .forEach(lanc => {
        if (!datasProcessadas.has(lanc.data_lancamento)) {
          lancamentosUnicosCorrigidos.push(lanc);
          datasProcessadas.add(lanc.data_lancamento);
          console.log(`  ✅ Adicionado original: ID ${lanc.id} (${lanc.data_lancamento})`);
        }
      });
    
    console.log(`\n📋 Resultado do filtro CORRIGIDO: ${lancamentosUnicosCorrigidos.length} lançamentos únicos`);
    
    // 8. Comparar resultados
    console.log('\n📊 Comparação de resultados:');
    console.log(`  Filtro atual: ${lancamentosUnicos.length} lançamentos`);
    console.log(`  Filtro corrigido: ${lancamentosUnicosCorrigidos.length} lançamentos`);
    
    if (lancamentosUnicos.length !== lancamentosUnicosCorrigidos.length) {
      console.log('🚨 DIFERENÇA DETECTADA!');
    } else {
      console.log('✅ Mesmo número de lançamentos.');
    }
    
    // Verificar diferenças específicas
    const diferencas = [];
    Object.keys(lancamentosPorData).forEach(data => {
      const atualSelecionado = lancamentosUnicos.find(l => l.data_lancamento === data);
      const corrigidoSelecionado = lancamentosUnicosCorrigidos.find(l => l.data_lancamento === data);
      
      if (atualSelecionado && corrigidoSelecionado && atualSelecionado.id !== corrigidoSelecionado.id) {
        diferencas.push({
          data,
          atual: atualSelecionado,
          corrigido: corrigidoSelecionado
        });
      }
    });
    
    if (diferencas.length > 0) {
      console.log('\n🔄 Diferenças específicas encontradas:');
      diferencas.forEach((diff, index) => {
        console.log(`  ${index + 1}. Data: ${diff.data}`);
        console.log(`     Atual: ID ${diff.atual.id} (${diff.atual.status_edicao})`);
        console.log(`     Corrigido: ID ${diff.corrigido.id} (${diff.corrigido.status_edicao})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erro durante a análise:', error.message);
  }
}

analisarFiltroFrontend();