const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function debugApiResponse() {
  console.log('🔍 VERIFICANDO RESPOSTA DA API PARA DILSON ARLINDO');
  console.log('=' .repeat(60));

  try {
    // Simular a mesma query que o frontend faz
    const { data: lancamentos, error } = await supabase
      .from('lancamentos_produtividade')
      .select(`
        *,
        usuarios!lancamentos_produtividade_usuario_id_fkey(nome, funcao)
      `)
      .eq('usuarios.nome', 'Dilson Arlindo')
      .eq('status', 'aprovado')
      .gte('data_lancamento', '2025-08-01')
      .lte('data_lancamento', '2025-08-31')
      .order('data_lancamento', { ascending: true });

    if (error) {
      console.error('❌ Erro na consulta:', error);
      return;
    }

    console.log(`📊 Total de lançamentos retornados pela API: ${lancamentos.length}`);
    console.log('');

    let totalKpis = 0;
    let totalBonusKpis = 0;
    let totalTarefasValidas = 0;
    let totalRemuneracao = 0;

    lancamentos.forEach((item, index) => {
      console.log(`📋 Lançamento ${index + 1} - ID: ${item.id}`);
      console.log(`   📅 Data: ${item.data_lancamento}`);
      console.log(`   💰 Remuneração: R$ ${item.remuneracao_total}`);
      console.log(`   🎯 KPIs (raw): ${item.kpis_atingidos}`);
      console.log(`   💵 Bonus KPIs: R$ ${item.bonus_kpis}`);
      console.log(`   ✅ Tarefas Válidas: ${item.tarefas_validas}`);
      console.log(`   📊 Subtotal Atividades: R$ ${item.subtotal_atividades}`);
      
      // Contar KPIs como o frontend faz
      let kpisArray = [];
      if (item.kpis_atingidos) {
        try {
          if (typeof item.kpis_atingidos === 'string') {
            kpisArray = JSON.parse(item.kpis_atingidos);
          } else if (Array.isArray(item.kpis_atingidos)) {
            kpisArray = item.kpis_atingidos;
          }
        } catch (e) {
          console.log(`   ⚠️ Erro ao parsear KPIs: ${e.message}`);
        }
      }
      
      const kpisCount = kpisArray.length;
      console.log(`   🔢 KPIs contados: ${kpisCount}`);
      
      totalKpis += kpisCount;
      totalBonusKpis += parseFloat(item.bonus_kpis || 0);
      totalTarefasValidas += parseInt(item.tarefas_validas || 0);
      totalRemuneracao += parseFloat(item.remuneracao_total || 0);
      
      console.log('');
    });

    console.log('=' .repeat(60));
    console.log('📊 TOTAIS CALCULADOS PELA API:');
    console.log(`🎯 Total KPIs: ${totalKpis}`);
    console.log(`💰 Total Bonus KPIs: R$ ${totalBonusKpis.toFixed(2)}`);
    console.log(`✅ Total Tarefas Válidas: ${totalTarefasValidas}`);
    console.log(`💵 Total Remuneração: R$ ${totalRemuneracao.toFixed(2)}`);
    console.log('');
    
    console.log('📊 COMPARAÇÃO COM DASHBOARD:');
    console.log('Dashboard mostra:');
    console.log('- 21 KPIs = R$ 63,00');
    console.log('- 1793 Tarefas Válidas = R$ 83,37');
    console.log('- Total = R$ 146,37');
    console.log('');
    console.log('API retorna:');
    console.log(`- ${totalKpis} KPIs = R$ ${totalBonusKpis.toFixed(2)}`);
    console.log(`- ${totalTarefasValidas} Tarefas Válidas`);
    console.log(`- Total Remuneração = R$ ${totalRemuneracao.toFixed(2)}`);
    console.log('');
    
    // Verificar se há diferenças
    const kpiDiff = totalKpis - 21;
    const bonusDiff = totalBonusKpis - 63.00;
    const tarefasDiff = totalTarefasValidas - 1793;
    
    console.log('🔍 DIFERENÇAS IDENTIFICADAS:');
    console.log(`KPIs: ${kpiDiff > 0 ? '+' : ''}${kpiDiff}`);
    console.log(`Bonus KPIs: R$ ${bonusDiff > 0 ? '+' : ''}${bonusDiff.toFixed(2)}`);
    console.log(`Tarefas: ${tarefasDiff > 0 ? '+' : ''}${tarefasDiff}`);
    
    if (kpiDiff !== 0 || bonusDiff !== 0 || tarefasDiff !== 0) {
      console.log('');
      console.log('❌ CONFIRMADO: Há discrepância entre API e Dashboard!');
      console.log('🔧 Necessário investigar o processamento no frontend.');
    } else {
      console.log('');
      console.log('✅ API e Dashboard estão sincronizados.');
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

debugApiResponse();