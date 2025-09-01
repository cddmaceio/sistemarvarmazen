async function debugFrontendProcessamento() {
  const { default: fetch } = await import('node-fetch');
  console.log('🔍 DEBUG: Simulando processamento completo do frontend');
  console.log('=' .repeat(60));
  
  const userId = 3; // Ronier Teste
  const baseUrl = 'http://localhost:5173';
  
  try {
    // 1. Buscar dados como o frontend faz
    console.log('\n📋 1. Buscando lançamentos aprovados:');
    const response = await fetch(`${baseUrl}/api/lancamentos?user_id=${userId}&status=aprovado`);
    const historico = await response.json();
    
    console.log(`✅ Encontrados ${historico.length} lançamentos aprovados`);
    
    // 2. Filtrar por agosto de 2025 (como no frontend)
    console.log('\n📅 2. Filtrando por agosto de 2025:');
    const mesAtual = new Date(2025, 7, 1); // Agosto de 2025
    
    const dadosUsuario = historico.filter((item) => {
      const dateOnly = item.data_lancamento.split('T')[0];
      const [year, month, day] = dateOnly.split('-');
      const dataLancamento = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      
      const mesLancamento = dataLancamento.getMonth();
      const anoLancamento = dataLancamento.getFullYear();
      
      return mesLancamento === mesAtual.getMonth() && anoLancamento === mesAtual.getFullYear();
    });
    
    console.log(`✅ Dados filtrados para agosto: ${dadosUsuario.length} lançamentos`);
    
    // 3. Simular formatDateSafe
    const formatDateSafe = (dateString) => {
      try {
        const dateOnly = dateString.split('T')[0];
        const [year, month, day] = dateOnly.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        return date.toLocaleDateString('pt-BR');
      } catch (error) {
        console.error('Erro ao formatar data:', dateString, error);
        return dateString;
      }
    };
    
    // 4. Simular criação do histórico completo (como no frontend)
    console.log('\n🔄 3. Criando histórico completo:');
    const historicoCompleto = [];
    
    dadosUsuario.forEach((item, index) => {
      if (item.status !== 'aprovado') {
        console.log(`⚠️ Item ${index + 1}: status não aprovado (${item.status}), pulando`);
        return;
      }
      
      const dataFormatada = formatDateSafe(item.data_lancamento);
      console.log(`📄 Item ${index + 1}: ID ${item.id}, Data: ${item.data_lancamento} -> ${dataFormatada}`);
      
      // Simular lógica do operador de empilhadeira
      const userFunction = 'Operador de Empilhadeira';
      
      if (userFunction === 'Operador de Empilhadeira') {
        let nomeAtividadePrincipal = 'Lançamento RV';
        if (item.tarefas_validas && item.tarefas_validas > 0) {
          nomeAtividadePrincipal = 'Operador de Empilhadeira';
        }
        
        const valorFinalLancamento = (item.subtotal_atividades || item.valor_tarefas || 0) + (item.bonus_kpis || 0);
        
        console.log(`   Atividade: ${nomeAtividadePrincipal}`);
        console.log(`   Valor: R$ ${valorFinalLancamento}`);
        console.log(`   Editado por Admin: ${item.editado_por_admin || 'Não'}`);
        
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
          id_original: item.id,
          created_at: item.created_at
        });
      }
    });
    
    console.log(`\n✅ Histórico completo criado: ${historicoCompleto.length} itens`);
    
    // 5. Simular processarHistoricoSemDuplicacao
    console.log('\n🔍 4. Processando histórico sem duplicação:');
    
    const processarHistoricoSemDuplicacao = (historico) => {
      console.log('🔍 Processando histórico sem duplicação:', historico.length, 'itens');
      
      // Agrupar por data
      const historicoAgrupado = historico.reduce((grupos, item) => {
        const data = item.data;
        if (!grupos[data]) {
          grupos[data] = [];
        }
        grupos[data].push(item);
        return grupos;
      }, {});
    
      console.log('📅 Histórico agrupado por data:', Object.keys(historicoAgrupado).map(data => `${data}: ${historicoAgrupado[data].length}`));
    
      // Para cada data, manter apenas um lançamento
      const historicoFinal = [];
      
      Object.keys(historicoAgrupado).forEach(data => {
        const lancamentosDaData = historicoAgrupado[data];
        console.log(`\n📋 Processando data ${data}:`, lancamentosDaData.length, 'lançamentos');
        
        if (lancamentosDaData.length === 1) {
          console.log(`✅ Data ${data}: apenas 1 lançamento, mantendo`);
          historicoFinal.push(lancamentosDaData[0]);
        } else {
          console.log(`🔄 Data ${data}: ${lancamentosDaData.length} lançamentos, verificando duplicações`);
          
          // Mostrar detalhes dos lançamentos
          lancamentosDaData.forEach((l, i) => {
            console.log(`   ${i + 1}. ID: ${l.id_original}, Editado: ${l.editado_por_admin || 'Não'}, Created: ${l.created_at}, Valor: R$ ${l.valor}`);
          });
          
          // Priorizar lançamento editado por admin
          const editadoPorAdmin = lancamentosDaData.find(item => item.editado_por_admin);
          
          if (editadoPorAdmin) {
            console.log(`👑 Data ${data}: encontrado lançamento editado por admin (ID: ${editadoPorAdmin.id_original}), priorizando`);
            historicoFinal.push(editadoPorAdmin);
          } else {
            console.log(`🕐 Data ${data}: nenhum editado por admin, pegando o mais recente`);
            const maisRecente = lancamentosDaData.sort((a, b) => {
              if (a.created_at && b.created_at) {
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
              }
              if (a.id_original && b.id_original) {
                return b.id_original - a.id_original;
              }
              return 0;
            })[0];
            
            console.log(`📌 Data ${data}: selecionado lançamento mais recente (ID: ${maisRecente.id_original})`);
            historicoFinal.push(maisRecente);
          }
        }
      });
      
      console.log('\n✨ Histórico final processado:', historicoFinal.length, 'itens');
      return historicoFinal;
    };
    
    const historicoFinal = processarHistoricoSemDuplicacao(historicoCompleto);
    
    // 6. Mostrar resultado final
    console.log('\n📊 5. Resultado final:');
    console.log(`Total de lançamentos no histórico final: ${historicoFinal.length}`);
    
    historicoFinal.forEach((lancamento, index) => {
      console.log(`\n📄 Lançamento Final ${index + 1}:`);
      console.log(`   Data: ${lancamento.data}`);
      console.log(`   ID Original: ${lancamento.id_original}`);
      console.log(`   Valor: R$ ${lancamento.valor}`);
      console.log(`   Atividade: ${lancamento.atividade}`);
      console.log(`   Editado por Admin: ${lancamento.editado_por_admin || 'Não'}`);
    });
    
    // 7. Verificar especificamente 04/08/2025
    console.log('\n🎯 6. Verificando lançamento de 04/08/2025:');
    const data04Agosto = new Date(2025, 7, 4).toLocaleDateString('pt-BR');
    console.log(`Data formatada esperada: ${data04Agosto}`);
    
    const lancamento04 = historicoFinal.find(l => l.data === data04Agosto);
    
    if (lancamento04) {
      console.log('✅ Lançamento de 04/08/2025 encontrado no histórico final!');
      console.log(`   ID: ${lancamento04.id_original}`);
      console.log(`   Valor: R$ ${lancamento04.valor}`);
    } else {
      console.log('❌ Lançamento de 04/08/2025 NÃO encontrado no histórico final!');
      
      // Verificar se estava no histórico completo
      const noHistoricoCompleto = historicoCompleto.find(l => l.data === data04Agosto);
      if (noHistoricoCompleto) {
        console.log('⚠️ Mas estava no histórico completo antes do processamento');
        console.log(`   ID: ${noHistoricoCompleto.id_original}`);
        console.log(`   Valor: R$ ${noHistoricoCompleto.valor}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro durante o debug:', error.message);
  }
}

debugFrontendProcessamento();