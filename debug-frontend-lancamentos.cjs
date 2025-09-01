async function debugFrontendLancamentos() {
  const { default: fetch } = await import('node-fetch');
  console.log('🔍 DEBUG: Verificando dados do frontend para lançamentos');
  console.log('=' .repeat(60));
  
  const userId = 3; // Ronier Teste
  const baseUrl = 'http://localhost:5173';
  
  try {
    // 1. Testar rota de lançamentos aprovados (usada pelo dashboard)
    console.log('\n📋 1. Testando rota de lançamentos aprovados:');
    console.log(`GET /api/lancamentos?user_id=${userId}&status=aprovado`);
    
    const responseAprovados = await fetch(`${baseUrl}/api/lancamentos?user_id=${userId}&status=aprovado`);
    
    if (!responseAprovados.ok) {
      console.log('❌ Erro na resposta:', responseAprovados.status, responseAprovados.statusText);
      return;
    }
    
    const lancamentosAprovados = await responseAprovados.json();
    console.log(`✅ Encontrados ${lancamentosAprovados.length} lançamentos aprovados`);
    
    // Mostrar detalhes de cada lançamento
    lancamentosAprovados.forEach((lancamento, index) => {
      console.log(`\n📄 Lançamento ${index + 1}:`);
      console.log(`   ID: ${lancamento.id}`);
      console.log(`   Data: ${lancamento.data_lancamento}`);
      console.log(`   Status: ${lancamento.status}`);
      console.log(`   Remuneração Total: R$ ${lancamento.remuneracao_total}`);
      console.log(`   Editado por Admin: ${lancamento.editado_por_admin || 'Não'}`);
      console.log(`   Created At: ${lancamento.created_at}`);
    });
    
    // 2. Filtrar por agosto de 2025
    console.log('\n📅 2. Filtrando por agosto de 2025:');
    const agostoDados = lancamentosAprovados.filter(item => {
      const dateOnly = item.data_lancamento.split('T')[0];
      const [year, month, day] = dateOnly.split('-');
      const dataLancamento = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      
      const mesLancamento = dataLancamento.getMonth(); // 0-11
      const anoLancamento = dataLancamento.getFullYear();
      
      return mesLancamento === 7 && anoLancamento === 2025; // Agosto = 7
    });
    
    console.log(`✅ Encontrados ${agostoDados.length} lançamentos em agosto de 2025`);
    
    agostoDados.forEach((lancamento, index) => {
      console.log(`\n📄 Lançamento Agosto ${index + 1}:`);
      console.log(`   ID: ${lancamento.id}`);
      console.log(`   Data: ${lancamento.data_lancamento}`);
      console.log(`   Data formatada: ${lancamento.data_lancamento.split('T')[0]}`);
      console.log(`   Status: ${lancamento.status}`);
      console.log(`   Remuneração Total: R$ ${lancamento.remuneracao_total}`);
    });
    
    // 3. Verificar duplicações por ID
    console.log('\n🔍 3. Verificando duplicações por ID:');
    const idsUnicos = new Set();
    const duplicados = [];
    
    agostoDados.forEach(lancamento => {
      if (idsUnicos.has(lancamento.id)) {
        duplicados.push(lancamento.id);
      } else {
        idsUnicos.add(lancamento.id);
      }
    });
    
    if (duplicados.length > 0) {
      console.log(`⚠️ Encontradas duplicações nos IDs: ${duplicados.join(', ')}`);
    } else {
      console.log('✅ Nenhuma duplicação por ID encontrada');
    }
    
    // 4. Verificar duplicações por data
    console.log('\n📅 4. Verificando duplicações por data:');
    const dataCount = {};
    
    agostoDados.forEach(lancamento => {
      const data = lancamento.data_lancamento.split('T')[0];
      dataCount[data] = (dataCount[data] || 0) + 1;
    });
    
    console.log('Contagem por data:');
    Object.entries(dataCount).forEach(([data, count]) => {
      console.log(`   ${data}: ${count} lançamento(s)`);
      if (count > 1) {
        console.log(`   ⚠️ Data ${data} tem ${count} lançamentos!`);
        
        // Mostrar detalhes dos lançamentos duplicados
        const lancamentosDaData = agostoDados.filter(l => l.data_lancamento.split('T')[0] === data);
        lancamentosDaData.forEach((l, i) => {
          console.log(`      ${i + 1}. ID: ${l.id}, Editado: ${l.editado_por_admin || 'Não'}, Created: ${l.created_at}`);
        });
      }
    });
    
    // 5. Simular processamento de duplicação (como no frontend)
    console.log('\n🔄 5. Simulando processamento de duplicação:');
    
    const historicoAgrupado = agostoDados.reduce((grupos, item) => {
      const data = item.data_lancamento.split('T')[0];
      if (!grupos[data]) {
        grupos[data] = [];
      }
      grupos[data].push(item);
      return grupos;
    }, {});
    
    console.log('Histórico agrupado por data:', Object.keys(historicoAgrupado).map(data => `${data}: ${historicoAgrupado[data].length}`));
    
    const historicoFinal = [];
    
    Object.keys(historicoAgrupado).forEach(data => {
      const lancamentosDaData = historicoAgrupado[data];
      console.log(`\n📋 Processando data ${data}: ${lancamentosDaData.length} lançamentos`);
      
      if (lancamentosDaData.length === 1) {
        console.log(`✅ Data ${data}: apenas 1 lançamento, mantendo`);
        historicoFinal.push(lancamentosDaData[0]);
      } else {
        console.log(`🔄 Data ${data}: ${lancamentosDaData.length} lançamentos, verificando duplicações`);
        
        // Priorizar lançamento editado por admin
        const editadoPorAdmin = lancamentosDaData.find(item => item.editado_por_admin);
        
        if (editadoPorAdmin) {
          console.log(`👑 Data ${data}: encontrado lançamento editado por admin (ID: ${editadoPorAdmin.id}), priorizando`);
          historicoFinal.push(editadoPorAdmin);
        } else {
          // Manter o mais recente
          const maisRecente = lancamentosDaData.sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )[0];
          console.log(`🕒 Data ${data}: mantendo o mais recente (ID: ${maisRecente.id})`);
          historicoFinal.push(maisRecente);
        }
      }
    });
    
    console.log(`\n✅ Histórico final processado: ${historicoFinal.length} lançamentos`);
    
    historicoFinal.forEach((lancamento, index) => {
      console.log(`   ${index + 1}. Data: ${lancamento.data_lancamento.split('T')[0]}, ID: ${lancamento.id}, Valor: R$ ${lancamento.remuneracao_total}`);
    });
    
    // 6. Calcular ganho total
    const ganhoTotal = historicoFinal.reduce((sum, item) => sum + (item.remuneracao_total || 0), 0);
    console.log(`\n💰 Ganho total calculado: R$ ${ganhoTotal.toFixed(2)}`);
    
    // 7. Verificar especificamente o lançamento de 04/08/2025
    console.log('\n🎯 6. Verificando lançamento específico de 04/08/2025:');
    const lancamento04Agosto = agostoDados.find(l => l.data_lancamento.split('T')[0] === '2025-08-04');
    
    if (lancamento04Agosto) {
      console.log('✅ Lançamento de 04/08/2025 encontrado:');
      console.log(`   ID: ${lancamento04Agosto.id}`);
      console.log(`   Status: ${lancamento04Agosto.status}`);
      console.log(`   Remuneração: R$ ${lancamento04Agosto.remuneracao_total}`);
      console.log(`   Editado por Admin: ${lancamento04Agosto.editado_por_admin || 'Não'}`);
      
      // Verificar se está no histórico final
      const noHistoricoFinal = historicoFinal.find(l => l.id === lancamento04Agosto.id);
      if (noHistoricoFinal) {
        console.log('✅ Lançamento de 04/08/2025 está no histórico final');
      } else {
        console.log('❌ Lançamento de 04/08/2025 NÃO está no histórico final');
      }
    } else {
      console.log('❌ Lançamento de 04/08/2025 NÃO encontrado');
    }
    
  } catch (error) {
    console.error('❌ Erro durante o debug:', error.message);
  }
}

debugFrontendLancamentos();