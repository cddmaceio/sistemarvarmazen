const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeDilsonBreakdown() {
  try {
    console.log('=== ANÁLISE DETALHADA DOS LANÇAMENTOS DO DILSON ===\n');
    
    // Buscar todos os lançamentos aprovados do Dilson Arlindo em agosto 2025
    const { data: lancamentos, error: lancamentosError } = await supabase
      .from('lancamentos_produtividade')
      .select('*')
      .eq('user_id', 6)
      .eq('status', 'aprovado')
      .gte('data_lancamento', '2025-08-01')
      .lt('data_lancamento', '2025-09-01')
      .order('data_lancamento', { ascending: true });
    
    if (lancamentosError) {
      console.error('Erro ao buscar lançamentos:', lancamentosError);
      return;
    }
    
    console.log(`Total de lançamentos aprovados: ${lancamentos.length}`);
    console.log(`Soma total: R$ ${lancamentos.reduce((sum, l) => sum + parseFloat(l.remuneracao_total || 0), 0).toFixed(2)}\n`);
    
    // Analisar cada lançamento individualmente
    let totalKpis = 0;
    let valorKpis = 0;
    let totalTarefasValidas = 0;
    let valorTarefasValidas = 0;
    let lancamentosSemCategoria = [];
    
    console.log('=== DETALHAMENTO POR LANÇAMENTO ===\n');
    
    for (const lancamento of lancamentos) {
      console.log(`📋 Lançamento ID: ${lancamento.id} | Data: ${lancamento.data_lancamento} | Valor: R$ ${lancamento.remuneracao_total}`);
      
      // Verificar se tem KPIs relacionados
      if (lancamento.kpis_atingidos && lancamento.kpis_atingidos > 0) {
        console.log(`   🎯 KPIs: ${lancamento.kpis_atingidos} (R$ ${lancamento.valor_kpis || 0})`);
        totalKpis += parseInt(lancamento.kpis_atingidos || 0);
        valorKpis += parseFloat(lancamento.valor_kpis || 0);
      }
      
      // Verificar se tem tarefas válidas
      if (lancamento.tarefas_validas && lancamento.tarefas_validas > 0) {
        console.log(`   ✅ Tarefas Válidas: ${lancamento.tarefas_validas} (R$ ${lancamento.valor_tarefas_validas || 0})`);
        totalTarefasValidas += parseInt(lancamento.tarefas_validas || 0);
        valorTarefasValidas += parseFloat(lancamento.valor_tarefas_validas || 0);
      }
      
      // Verificar se não tem nem KPIs nem tarefas válidas
      if ((!lancamento.kpis_atingidos || lancamento.kpis_atingidos === 0) && 
          (!lancamento.tarefas_validas || lancamento.tarefas_validas === 0)) {
        console.log(`   ⚠️  SEM CATEGORIA DEFINIDA!`);
        lancamentosSemCategoria.push(lancamento);
      }
      
      // Verificar campos extras
      console.log(`   📊 Campos: kpis_atingidos=${lancamento.kpis_atingidos}, valor_kpis=${lancamento.valor_kpis}, tarefas_validas=${lancamento.tarefas_validas}, valor_tarefas_validas=${lancamento.valor_tarefas_validas}`);
      
      console.log('');
    }
    
    console.log('=== RESUMO CONSOLIDADO ===\n');
    console.log(`🎯 Total KPIs: ${totalKpis} (R$ ${valorKpis.toFixed(2)})`);
    console.log(`✅ Total Tarefas Válidas: ${totalTarefasValidas} (R$ ${valorTarefasValidas.toFixed(2)})`);
    console.log(`💰 Soma KPIs + Tarefas: R$ ${(valorKpis + valorTarefasValidas).toFixed(2)}`);
    console.log(`💰 Soma total lançamentos: R$ ${lancamentos.reduce((sum, l) => sum + parseFloat(l.remuneracao_total || 0), 0).toFixed(2)}`);
    
    const diferenca = lancamentos.reduce((sum, l) => sum + parseFloat(l.remuneracao_total || 0), 0) - (valorKpis + valorTarefasValidas);
    console.log(`⚖️  Diferença: R$ ${diferenca.toFixed(2)}`);
    
    if (lancamentosSemCategoria.length > 0) {
      console.log(`\n⚠️  LANÇAMENTOS SEM CATEGORIA (${lancamentosSemCategoria.length}):`);
      lancamentosSemCategoria.forEach(l => {
        console.log(`   - ID: ${l.id}, Data: ${l.data_lancamento}, Valor: R$ ${l.remuneracao_total}`);
      });
    }
    
    // Verificar se os valores do dashboard batem
    console.log('\n=== COMPARAÇÃO COM DASHBOARD ===');
    console.log('Dashboard mostra:');
    console.log('- 21 KPIs = R$ 63,00');
    console.log('- 1793 Tarefas Válidas = R$ 83,37');
    console.log('- Total Dashboard = R$ 146,37');
    console.log('');
    console.log('Banco de dados mostra:');
    console.log(`- ${totalKpis} KPIs = R$ ${valorKpis.toFixed(2)}`);
    console.log(`- ${totalTarefasValidas} Tarefas Válidas = R$ ${valorTarefasValidas.toFixed(2)}`);
    console.log(`- Total Banco = R$ ${(valorKpis + valorTarefasValidas).toFixed(2)}`);
    
    if (Math.abs(diferenca) > 0.01) {
      console.log('\n🚨 PROBLEMA IDENTIFICADO!');
      console.log('Há uma discrepância entre a soma dos componentes (KPIs + Tarefas) e o valor total dos lançamentos.');
      console.log('Isso pode indicar:');
      console.log('1. Lançamentos com valores que não estão categorizados corretamente');
      console.log('2. Campos valor_kpis ou valor_tarefas_validas não estão sendo preenchidos');
      console.log('3. Lógica de cálculo incorreta no frontend ou backend');
    }
    
  } catch (error) {
    console.error('❌ Erro na análise:', error);
  }
}

analyzeDilsonBreakdown();