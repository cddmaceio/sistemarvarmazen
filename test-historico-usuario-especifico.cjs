// Configuração da API
const API_BASE = 'http://localhost:8888';

// Função para testar a duplicação no histórico para usuário específico
async function testarHistoricoUsuarioEspecifico() {
  const { default: fetch } = await import('node-fetch');
  console.log('🔍 Testando duplicação no histórico para usuário 699.895.404-20...');
  
  try {
    // 1. Buscar o usuário específico
    console.log('\n1. Buscando usuário 699.895.404-20...');
    const responseUsers = await fetch(`${API_BASE}/api/usuarios`);
    const users = await responseUsers.json();
    
    const targetUser = users.find(user => user.cpf === '699.895.404-20');
    
    if (!targetUser) {
      console.log('❌ Usuário 699.895.404-20 não encontrado');
      console.log('📋 Usuários disponíveis:');
      users.slice(0, 5).forEach(user => {
        console.log(`   - ${user.nome} (CPF: ${user.cpf})`);
      });
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
    
    // 3. Analisar duplicações por data
    console.log('\n3. Analisando duplicações por data...');
    const lancamentosPorData = {};
    const lancamentosEditados = [];
    
    lancamentos.forEach(lancamento => {
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
          valor_original: lancamento.valor_bruto_atividades,
          valor_final: lancamento.remuneracao_total
        });
      }
    });
    
    // 4. Identificar duplicações no banco
    console.log('\n4. Identificando duplicações no banco de dados...');
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
          console.log(`      Data edição: ${lancamento.data_edicao || 'N/A'}`);
        });
      }
    });
    
    if (!duplicacoesEncontradas) {
      console.log('✅ Nenhuma duplicação encontrada no banco de dados');
    }
    
    // 5. Mostrar lançamentos editados
    if (lancamentosEditados.length > 0) {
      console.log('\n5. Lançamentos editados encontrados:');
      lancamentosEditados.forEach(lancamento => {
        console.log(`\n📝 Lançamento editado:`);
        console.log(`   Data: ${lancamento.data}`);
        console.log(`   ID: ${lancamento.id}`);
        console.log(`   Editado por: ${lancamento.editado_por}`);
        console.log(`   Data da edição: ${lancamento.data_edicao}`);
        console.log(`   Valor final: R$ ${(lancamento.valor_final || 0).toFixed(2)}`);
      });
    } else {
      console.log('\n5. Nenhum lançamento editado encontrado.');
    }
    
    // 6. Simular o processamento do frontend (como no DashboardCollaborator)
    console.log('\n6. Simulando processamento do frontend...');
    
    // Filtrar apenas lançamentos únicos por data (simulando a lógica atual)
    const lancamentosUnicos = [];
    const datasProcessadas = new Set();
    
    // Ordenar por data para processar em ordem
    const lancamentosOrdenados = lancamentos.sort((a, b) => 
      new Date(a.data_lancamento) - new Date(b.data_lancamento)
    );
    
    lancamentosOrdenados.forEach(item => {
      const dataLancamento = item.data_lancamento.split('T')[0];
      
      // Se já processamos esta data, pular (simulando o problema atual)
      if (!datasProcessadas.has(dataLancamento)) {
        datasProcessadas.add(dataLancamento);
        lancamentosUnicos.push(item);
      }
    });
    
    console.log(`📊 Lançamentos únicos após filtro por data: ${lancamentosUnicos.length}`);
    
    // Criar histórico como no frontend
    const historicoCompleto = [];
    
    lancamentosUnicos.forEach(item => {
      const dataFormatada = formatDateSafe(item.data_lancamento);
      
      // Determinar o nome da atividade principal
      let nomeAtividadePrincipal = 'Lançamento RV';
      if (item.tarefas_validas && item.tarefas_validas > 0) {
        nomeAtividadePrincipal = 'Operador de Empilhadeira';
      } else if (item.nome_atividade) {
        nomeAtividadePrincipal = item.nome_atividade;
      }
      
      // Calcular o valor final corretamente
      const valorFinalLancamento = (item.subtotal_atividades || item.valor_tarefas || 0) + (item.bonus_kpis || 0);
      
      historicoCompleto.push({
        data: dataFormatada,
        valor: valorFinalLancamento,
        atividade: nomeAtividadePrincipal,
        turno: item.turno,
        aprovadoPor: item.aprovado_por_nome || item.aprovado_por || 'Sistema',
        kpis_atingidos: item.kpis_atingidos,
        tarefas_validas: item.tarefas_validas,
        valor_tarefas: item.valor_tarefas,
        bonus_kpis: item.bonus_kpis,
        subtotal_atividades: item.subtotal_atividades,
        valor_bruto_atividades: item.valor_bruto_atividades,
        status_edicao: item.status_edicao,
        editado_por_admin: item.editado_por_admin,
        data_edicao: item.data_edicao,
        id_original: item.id
      });
    });
    
    console.log(`\n📋 Histórico completo gerado: ${historicoCompleto.length} entradas`);
    
    // 7. Verificar se há lançamentos editados que não aparecem no histórico
    console.log('\n7. Verificando lançamentos editados perdidos...');
    
    const datasNoHistorico = new Set(historicoCompleto.map(h => {
      // Converter data formatada de volta para formato YYYY-MM-DD
      const [dia, mes, ano] = h.data.split('/');
      return `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
    }));
    
    const lancamentosEditadosPerdidos = lancamentosEditados.filter(editado => 
      !datasNoHistorico.has(editado.data)
    );
    
    if (lancamentosEditadosPerdidos.length > 0) {
      console.log(`\n❌ PROBLEMA IDENTIFICADO: ${lancamentosEditadosPerdidos.length} lançamentos editados não aparecem no histórico!`);
      lancamentosEditadosPerdidos.forEach(perdido => {
        console.log(`   - Data: ${perdido.data}, ID: ${perdido.id}`);
      });
    } else {
      console.log('✅ Todos os lançamentos editados aparecem no histórico');
    }
    
    // 8. Mostrar resumo final
    console.log('\n8. RESUMO FINAL:');
    console.log(`   📊 Total de lançamentos no banco: ${lancamentos.length}`);
    console.log(`   📝 Lançamentos editados: ${lancamentosEditados.length}`);
    console.log(`   📋 Entradas no histórico: ${historicoCompleto.length}`);
    console.log(`   ❌ Duplicações no banco: ${duplicacoesEncontradas ? 'SIM' : 'NÃO'}`);
    console.log(`   🔍 Lançamentos editados perdidos: ${lancamentosEditadosPerdidos.length}`);
    
    if (historicoCompleto.length > 0) {
      console.log('\n📋 Primeiras 3 entradas do histórico:');
      historicoCompleto.slice(0, 3).forEach((entrada, index) => {
        console.log(`   ${index + 1}. ${entrada.data} - ${entrada.atividade} - R$ ${entrada.valor.toFixed(2)}`);
        if (entrada.status_edicao === 'editado_admin') {
          console.log(`      ✏️ Editado por: ${entrada.editado_por_admin}`);
        }
      });
    }
    
    console.log('\n🎯 Teste concluído!');
    
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
testarHistoricoUsuarioEspecifico();