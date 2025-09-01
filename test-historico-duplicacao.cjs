// Configuração da API
const API_BASE = 'http://localhost:8888';

// Função para testar a duplicação no histórico
async function testarHistoricoDuplicacao() {
  const { default: fetch } = await import('node-fetch');
  console.log('🔍 Testando duplicação no histórico de lançamentos...');
  
  try {
    // 1. Buscar um usuário específico para teste
    console.log('\n1. Buscando usuários...');
    const responseUsers = await fetch(`${API_BASE}/api/usuarios`);
    const users = await responseUsers.json();
    
    if (!users || users.length === 0) {
      console.log('❌ Nenhum usuário encontrado');
      return;
    }
    
    // Pegar o primeiro usuário
    const testUser = users[0];
    console.log(`✅ Usuário de teste: ${testUser.nome} (ID: ${testUser.id})`);
    
    // 2. Buscar lançamentos aprovados do usuário
    console.log('\n2. Buscando lançamentos aprovados...');
    const responseLancamentos = await fetch(`${API_BASE}/api/lancamentos?user_id=${testUser.id}&status=aprovado`);
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
    
    // 4. Identificar duplicações
    console.log('\n4. Identificando duplicações...');
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
    }
    
    // 6. Simular o processamento do frontend
    console.log('\n6. Simulando processamento do frontend...');
    
    // Filtrar apenas lançamentos únicos por ID (como deveria ser feito)
    const lancamentosUnicos = lancamentos.filter((item, index, arr) => {
      return arr.findIndex(t => t.id === item.id) === index && item.status === 'aprovado';
    });
    
    console.log(`📊 Lançamentos únicos após filtro: ${lancamentosUnicos.length}`);
    
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
        data_edicao: item.data_edicao
      });
    });
    
    console.log(`\n📋 Histórico completo gerado: ${historicoCompleto.length} entradas`);
    
    // Verificar duplicações no histórico
    const historicosPorData = {};
    historicoCompleto.forEach(item => {
      if (!historicosPorData[item.data]) {
        historicosPorData[item.data] = [];
      }
      historicosPorData[item.data].push(item);
    });
    
    let duplicacoesHistorico = false;
    Object.keys(historicosPorData).forEach(data => {
      if (historicosPorData[data].length > 1) {
        duplicacoesHistorico = true;
        console.log(`\n❌ DUPLICAÇÃO NO HISTÓRICO na data ${data}: ${historicosPorData[data].length} entradas`);
      }
    });
    
    if (!duplicacoesHistorico) {
      console.log('✅ Nenhuma duplicação encontrada no histórico processado');
    }
    
    console.log('\n🎯 Teste concluído!');
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
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
testarHistoricoDuplicacao();