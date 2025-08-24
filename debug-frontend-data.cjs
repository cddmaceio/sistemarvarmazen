// Script para debugar os dados que chegam no frontend
async function debugFrontendData() {
  try {
    console.log('🔍 DEBUGANDO DADOS DO FRONTEND');
    console.log('=' .repeat(50));
    
    // 1. Buscar lançamentos aprovados da API
    console.log('\n📡 Buscando lançamentos aprovados da API...');
    const response = await fetch('http://localhost:8888/api/lancamentos');
    const lancamentosAprovados = await response.json();
    
    console.log(`\n✅ Total de lançamentos aprovados: ${lancamentosAprovados.length}`);
    
    // 2. Filtrar apenas operadores de empilhadeira
    const operadoresEmpilhadeira = lancamentosAprovados.filter(item => 
      item.funcao === 'Operador de Empilhadeira'
    );
    
    console.log(`\n🚛 Lançamentos de Operador de Empilhadeira: ${operadoresEmpilhadeira.length}`);
    
    // 3. Analisar cada lançamento em detalhes
    console.log('\n📊 ANÁLISE DETALHADA DOS LANÇAMENTOS:');
    console.log('=' .repeat(50));
    
    operadoresEmpilhadeira.forEach((item, index) => {
      console.log(`\n🔸 Lançamento ${index + 1} (ID: ${item.id})`);
      console.log(`   👤 Usuário: ${item.usuario}`);
      console.log(`   📅 Data: ${item.data_lancamento}`);
      console.log(`   🎯 Status: ${item.status}`);
      
      // Verificar campos específicos
      console.log(`   📋 tarefas_validas: ${item.tarefas_validas} (tipo: ${typeof item.tarefas_validas})`);
      console.log(`   💰 valor_tarefas: ${item.valor_tarefas} (tipo: ${typeof item.valor_tarefas})`);
      console.log(`   📊 subtotal_atividades: ${item.subtotal_atividades} (tipo: ${typeof item.subtotal_atividades})`);
      console.log(`   🎯 kpis_atingidos: ${item.kpis_atingidos} (tipo: ${typeof item.kpis_atingidos})`);
      console.log(`   💎 bonus_kpis: ${item.bonus_kpis} (tipo: ${typeof item.bonus_kpis})`);
      console.log(`   🔢 valid_tasks_count: ${item.valid_tasks_count} (tipo: ${typeof item.valid_tasks_count})`);
      
      // Simular o processamento do frontend
      console.log(`\n   🖥️  SIMULAÇÃO DO PROCESSAMENTO FRONTEND:`);
      
      // Verificar se tarefas_validas existe e é válido
      let tarefasValidasProcessadas = null;
      if (item.tarefas_validas) {
        tarefasValidasProcessadas = item.tarefas_validas;
        console.log(`   ✅ tarefasValidas será exibido: ${tarefasValidasProcessadas}`);
      } else {
        console.log(`   ❌ tarefasValidas NÃO será exibido (valor: ${item.tarefas_validas})`);
      }
      
      // Verificar KPIs
      let kpisAtingidos = [];
      try {
        if (item.kpis_atingidos && typeof item.kpis_atingidos === 'string') {
          kpisAtingidos = JSON.parse(item.kpis_atingidos);
        } else if (Array.isArray(item.kpis_atingidos)) {
          kpisAtingidos = item.kpis_atingidos;
        }
        console.log(`   🎯 KPIs processados: ${kpisAtingidos.length > 0 ? kpisAtingidos.join(', ') : 'Nenhum'}`);
      } catch (e) {
        console.log(`   ❌ Erro ao processar KPIs: ${e.message}`);
      }
      
      // Calcular valor final
      const valorAtividades = item.subtotal_atividades || item.valor_tarefas || 0;
      const valorKpis = item.bonus_kpis || 0;
      const valorFinal = valorAtividades + valorKpis;
      console.log(`   💰 Valor final calculado: R$ ${valorFinal.toFixed(2)} (${valorAtividades} + ${valorKpis})`);
      
      // Verificar se será adicionado ao histórico completo
      const seraAdicionadoHistorico = item.tarefas_validas && item.tarefas_validas > 0 && item.status === 'aprovado';
      console.log(`   📋 Será adicionado ao histórico: ${seraAdicionadoHistorico ? 'SIM' : 'NÃO'}`);
      
      console.log('   ' + '-'.repeat(40));
    });
    
    // 4. Resumo final
    console.log('\n📈 RESUMO FINAL:');
    console.log('=' .repeat(50));
    
    const comTarefasValidas = operadoresEmpilhadeira.filter(item => item.tarefas_validas && item.tarefas_validas > 0);
    const semTarefasValidas = operadoresEmpilhadeira.filter(item => !item.tarefas_validas || item.tarefas_validas === 0);
    
    console.log(`✅ Lançamentos COM tarefas_validas: ${comTarefasValidas.length}`);
    console.log(`❌ Lançamentos SEM tarefas_validas: ${semTarefasValidas.length}`);
    
    if (semTarefasValidas.length > 0) {
      console.log('\n🚨 LANÇAMENTOS PROBLEMÁTICOS:');
      semTarefasValidas.forEach(item => {
        console.log(`   - ID ${item.id} (${item.usuario}) - valid_tasks_count: ${item.valid_tasks_count}`);
      });
    }
    
    console.log('\n🎯 CONCLUSÃO:');
    if (semTarefasValidas.length > 0) {
      console.log('❌ Existem lançamentos sem tarefas_validas que não aparecerão no frontend.');
      console.log('💡 Estes lançamentos precisam ser corrigidos no banco de dados.');
    } else {
      console.log('✅ Todos os lançamentos possuem tarefas_validas e devem aparecer no frontend.');
    }
    
  } catch (error) {
    console.error('❌ Erro ao debugar dados do frontend:', error.message);
    if (error.response) {
      console.error('📄 Resposta da API:', error.response.status, error.response.statusText);
    }
  }
}

// Executar o debug
debugFrontendData();