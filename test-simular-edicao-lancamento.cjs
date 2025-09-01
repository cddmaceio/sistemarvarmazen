// Configuração da API
const API_BASE = 'http://localhost:8888';

// Função para simular edição de lançamento e testar duplicação
async function simularEdicaoLancamento() {
  const { default: fetch } = await import('node-fetch');
  console.log('🔍 Simulando edição de lançamento para testar duplicação...');
  
  try {
    // 1. Buscar o usuário específico
    console.log('\n1. Buscando usuário 699.895.404-20...');
    const responseUsers = await fetch(`${API_BASE}/api/usuarios`);
    const users = await responseUsers.json();
    
    const targetUser = users.find(user => user.cpf === '699.895.404-20');
    
    if (!targetUser) {
      console.log('❌ Usuário 699.895.404-20 não encontrado');
      return;
    }
    
    console.log(`✅ Usuário encontrado: ${targetUser.nome} (ID: ${targetUser.id})`);
    
    // 2. Buscar lançamentos aprovados do usuário
    console.log('\n2. Buscando lançamentos aprovados...');
    const responseLancamentos = await fetch(`${API_BASE}/api/lancamentos?user_id=${targetUser.id}&status=aprovado`);
    const lancamentos = await responseLancamentos.json();
    
    console.log(`📊 Total de lançamentos aprovados: ${lancamentos.length}`);
    
    if (lancamentos.length === 0) {
      console.log('⚠️ Nenhum lançamento aprovado encontrado para este usuário');
      return;
    }
    
    // 3. Pegar o primeiro lançamento para simular edição
    const lancamentoParaEditar = lancamentos[0];
    console.log(`\n3. Lançamento selecionado para edição:`);
    console.log(`   ID: ${lancamentoParaEditar.id}`);
    console.log(`   Data: ${lancamentoParaEditar.data_lancamento}`);
    console.log(`   Valor atual: R$ ${(lancamentoParaEditar.remuneracao_total || 0).toFixed(2)}`);
    
    // 4. Simular edição do lançamento
    console.log('\n4. Simulando edição do lançamento...');
    
    const dadosEdicao = {
      id: lancamentoParaEditar.id,
      user_id: targetUser.id,
      data_lancamento: lancamentoParaEditar.data_lancamento,
      turno: lancamentoParaEditar.turno,
      atividades: [
        {
          nome_atividade: 'Prod Repack',
          quantidade: 150, // Alterando quantidade
          valor_unitario: 0.12,
          subtotal: 18.00 // Novo valor
        }
      ],
      kpis: [],
      observacoes: 'Lançamento editado para teste de duplicação',
      editado_por_admin: 'Admin Teste',
      status_edicao: 'editado_admin'
    };
    
    try {
      const responseEdicao = await fetch(`${API_BASE}/api/lancamentos/${lancamentoParaEditar.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dadosEdicao)
      });
      
      if (responseEdicao.ok) {
        const resultadoEdicao = await responseEdicao.json();
        console.log('✅ Lançamento editado com sucesso!');
        console.log(`   Novo valor: R$ ${(resultadoEdicao.remuneracao_total || 18.00).toFixed(2)}`);
      } else {
        const erro = await responseEdicao.text();
        console.log('❌ Erro ao editar lançamento:', erro);
        return;
      }
    } catch (error) {
      console.log('❌ Erro na requisição de edição:', error.message);
      return;
    }
    
    // 5. Aguardar um pouco e buscar lançamentos novamente
    console.log('\n5. Aguardando e buscando lançamentos atualizados...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const responseLancamentosAtualizados = await fetch(`${API_BASE}/api/lancamentos?user_id=${targetUser.id}&status=aprovado`);
    const lancamentosAtualizados = await responseLancamentosAtualizados.json();
    
    console.log(`📊 Total de lançamentos após edição: ${lancamentosAtualizados.length}`);
    
    // 6. Analisar duplicações por data após edição
    console.log('\n6. Analisando duplicações por data após edição...');
    const lancamentosPorData = {};
    const lancamentosEditados = [];
    
    lancamentosAtualizados.forEach(lancamento => {
      const dataLancamento = lancamento.data_lancamento.split('T')[0];
      
      if (!lancamentosPorData[dataLancamento]) {
        lancamentosPorData[dataLancamento] = [];
      }
      
      lancamentosPorData[dataLancamento].push(lancamento);
      
      // Verificar se foi editado
      if (lancamento.status_edicao === 'editado_admin') {
        lancamentosEditados.push({
          id: lancamento.id,
          data: dataLancamento,
          editado_por: lancamento.editado_por_admin,
          data_edicao: lancamento.data_edicao,
          valor_final: lancamento.remuneracao_total
        });
      }
    });
    
    // 7. Verificar duplicações
    let duplicacoesEncontradas = false;
    
    Object.keys(lancamentosPorData).forEach(data => {
      const lancamentosNaData = lancamentosPorData[data];
      
      if (lancamentosNaData.length > 1) {
        duplicacoesEncontradas = true;
        console.log(`\n❌ DUPLICAÇÃO ENCONTRADA na data ${data}:`);
        
        lancamentosNaData.forEach((lancamento, index) => {
          console.log(`   ${index + 1}. ID: ${lancamento.id}`);
          console.log(`      Status: ${lancamento.status}`);
          console.log(`      Status Edição: ${lancamento.status_edicao || 'original'}`);
          console.log(`      Valor: R$ ${(lancamento.remuneracao_total || 0).toFixed(2)}`);
          console.log(`      Criado em: ${lancamento.created_at}`);
          console.log(`      Editado por: ${lancamento.editado_por_admin || 'N/A'}`);
        });
      }
    });
    
    if (!duplicacoesEncontradas) {
      console.log('✅ Nenhuma duplicação encontrada no banco após edição');
    }
    
    // 8. Mostrar lançamentos editados
    if (lancamentosEditados.length > 0) {
      console.log('\n8. Lançamentos editados encontrados:');
      lancamentosEditados.forEach(lancamento => {
        console.log(`\n📝 Lançamento editado:`);
        console.log(`   Data: ${lancamento.data}`);
        console.log(`   ID: ${lancamento.id}`);
        console.log(`   Editado por: ${lancamento.editado_por}`);
        console.log(`   Valor final: R$ ${(lancamento.valor_final || 0).toFixed(2)}`);
      });
    }
    
    // 9. Simular processamento do frontend com lançamento editado
    console.log('\n9. Simulando processamento do frontend com lançamento editado...');
    
    // Simular a lógica atual do DashboardCollaborator
    const historicoCompleto = [];
    
    // Filtrar apenas lançamentos únicos por ID
    const lancamentosUnicos = lancamentosAtualizados.filter((item, index, arr) => {
      return arr.findIndex(t => t.id === item.id) === index && item.status === 'aprovado';
    });
    
    console.log(`📊 Lançamentos únicos após filtro: ${lancamentosUnicos.length}`);
    
    lancamentosUnicos.forEach(item => {
      const dataFormatada = formatDateSafe(item.data_lancamento);
      
      let nomeAtividadePrincipal = 'Lançamento RV';
      if (item.tarefas_validas && item.tarefas_validas > 0) {
        nomeAtividadePrincipal = 'Operador de Empilhadeira';
      } else if (item.nome_atividade) {
        nomeAtividadePrincipal = item.nome_atividade;
      }
      
      const valorFinalLancamento = (item.subtotal_atividades || item.valor_tarefas || 0) + (item.bonus_kpis || 0);
      
      historicoCompleto.push({
        data: dataFormatada,
        valor: valorFinalLancamento,
        atividade: nomeAtividadePrincipal,
        turno: item.turno,
        aprovadoPor: item.aprovado_por_nome || item.aprovado_por || 'Sistema',
        status_edicao: item.status_edicao,
        editado_por_admin: item.editado_por_admin,
        data_edicao: item.data_edicao,
        id_original: item.id
      });
    });
    
    console.log(`\n📋 Histórico completo gerado: ${historicoCompleto.length} entradas`);
    
    // 10. Verificar se lançamentos editados aparecem corretamente
    const entradasEditadas = historicoCompleto.filter(entrada => entrada.status_edicao === 'editado_admin');
    
    console.log('\n10. RESULTADO DO TESTE:');
    console.log(`   📊 Total de lançamentos no banco: ${lancamentosAtualizados.length}`);
    console.log(`   📝 Lançamentos editados no banco: ${lancamentosEditados.length}`);
    console.log(`   📋 Entradas no histórico: ${historicoCompleto.length}`);
    console.log(`   ✏️ Entradas editadas no histórico: ${entradasEditadas.length}`);
    console.log(`   ❌ Duplicações no banco: ${duplicacoesEncontradas ? 'SIM' : 'NÃO'}`);
    
    if (entradasEditadas.length > 0) {
      console.log('\n📝 Entradas editadas no histórico:');
      entradasEditadas.forEach((entrada, index) => {
        console.log(`   ${index + 1}. ${entrada.data} - ${entrada.atividade} - R$ ${entrada.valor.toFixed(2)}`);
        console.log(`      ✏️ Editado por: ${entrada.editado_por_admin}`);
        console.log(`      🆔 ID original: ${entrada.id_original}`);
      });
    }
    
    console.log('\n🎯 Teste de simulação concluído!');
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
  }
}

// Função auxiliar para formatar data
function formatDateSafe(dateString) {
  if (!dateString) return '';
  
  const dateOnly = dateString.split('T')[0];
  const [year, month, day] = dateOnly.split('-');
  
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  return date.toLocaleDateString('pt-BR');
}

// Executar o teste
simularEdicaoLancamento();