const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function debugFrontendConditions() {
  console.log('🔍 VERIFICANDO CONDIÇÕES DO FRONTEND PARA HISTÓRICO COMPLETO');
  console.log('=' .repeat(70));

  try {
    // Buscar lançamentos de Dilson em agosto
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

    console.log(`📊 Total de lançamentos aprovados: ${lancamentos.length}`);
    console.log('');

    let historicoCompleto = [];
    let contadorTarefasValidas = 0;
    let contadorKpis = 0;
    let contadorSemCondicoes = 0;

    lancamentos.forEach((item, index) => {
      console.log(`📋 Lançamento ${index + 1} - ID: ${item.id}`);
      console.log(`   📅 Data: ${item.data_lancamento}`);
      console.log(`   💰 Remuneração: R$ ${item.remuneracao_total}`);
      console.log(`   🎯 KPIs (raw): ${item.kpis_atingidos}`);
      console.log(`   💵 Bonus KPIs: R$ ${item.bonus_kpis}`);
      console.log(`   ✅ Tarefas Válidas: ${item.tarefas_validas}`);
      console.log(`   📊 Subtotal Atividades: R$ ${item.subtotal_atividades}`);
      
      // Parse KPIs
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
      
      // Verificar condições do frontend
      const temTarefasValidas = item.tarefas_validas && item.tarefas_validas > 0;
      const temKpis = kpisArray.length > 0 && (item.bonus_kpis || 0) > 0;
      
      console.log(`   🔍 Condições:`);
      console.log(`      ✅ Tem tarefas válidas (${item.tarefas_validas} > 0): ${temTarefasValidas ? 'SIM' : 'NÃO'}`);
      console.log(`      🎯 Tem KPIs (${kpisArray.length} > 0 && R$ ${item.bonus_kpis} > 0): ${temKpis ? 'SIM' : 'NÃO'}`);
      
      let adicionadoAoHistorico = false;
      
      // Simular lógica do frontend
      if (temTarefasValidas) {
        historicoCompleto.push({
          id: item.id,
          tipo: 'Tarefas Válidas',
          valor: item.remuneracao_total,
          data: item.data_lancamento
        });
        contadorTarefasValidas++;
        adicionadoAoHistorico = true;
        console.log(`      ➕ Adicionado ao histórico como 'Tarefas Válidas'`);
      }
      
      if (temKpis) {
        historicoCompleto.push({
          id: item.id,
          tipo: 'KPIs Atingidos',
          valor: item.bonus_kpis,
          data: item.data_lancamento
        });
        contadorKpis++;
        adicionadoAoHistorico = true;
        console.log(`      ➕ Adicionado ao histórico como 'KPIs Atingidos'`);
      }
      
      if (!adicionadoAoHistorico) {
        contadorSemCondicoes++;
        console.log(`      ❌ NÃO adicionado ao histórico (não atende condições)`);
      }
      
      console.log('');
    });

    console.log('=' .repeat(70));
    console.log('📊 RESUMO DAS CONDIÇÕES:');
    console.log(`✅ Lançamentos com tarefas válidas: ${contadorTarefasValidas}`);
    console.log(`🎯 Lançamentos com KPIs: ${contadorKpis}`);
    console.log(`❌ Lançamentos sem condições: ${contadorSemCondicoes}`);
    console.log(`📋 Total no histórico completo: ${historicoCompleto.length}`);
    console.log('');
    
    console.log('🔍 COMPARAÇÃO COM DASHBOARD:');
    console.log('Dashboard mostra: 12 lançamentos');
    console.log(`Simulação mostra: ${historicoCompleto.length} lançamentos`);
    
    if (historicoCompleto.length === 12) {
      console.log('✅ MATCH! As condições explicam os 12 lançamentos exibidos.');
    } else {
      console.log(`❌ MISMATCH! Esperado 12, encontrado ${historicoCompleto.length}`);
    }
    
    // Calcular totais baseados no histórico
    let totalKpis = 0;
    let totalBonusKpis = 0;
    let totalTarefasValidas = 0;
    
    lancamentos.forEach((item) => {
      let kpisArray = [];
      if (item.kpis_atingidos) {
        try {
          if (typeof item.kpis_atingidos === 'string') {
            kpisArray = JSON.parse(item.kpis_atingidos);
          } else if (Array.isArray(item.kpis_atingidos)) {
            kpisArray = item.kpis_atingidos;
          }
        } catch (e) {}
      }
      
      // Só contar se atende as condições do frontend
      const temTarefasValidas = item.tarefas_validas && item.tarefas_validas > 0;
      const temKpis = kpisArray.length > 0 && (item.bonus_kpis || 0) > 0;
      
      if (temTarefasValidas) {
        totalTarefasValidas += parseInt(item.tarefas_validas || 0);
      }
      
      if (temKpis) {
        totalKpis += kpisArray.length;
        totalBonusKpis += parseFloat(item.bonus_kpis || 0);
      }
    });
    
    console.log('');
    console.log('📊 TOTAIS CALCULADOS COM AS CONDIÇÕES:');
    console.log(`🎯 Total KPIs: ${totalKpis}`);
    console.log(`💰 Total Bonus KPIs: R$ ${totalBonusKpis.toFixed(2)}`);
    console.log(`✅ Total Tarefas Válidas: ${totalTarefasValidas}`);
    console.log('');
    console.log('📊 COMPARAÇÃO COM DASHBOARD:');
    console.log('Dashboard: 21 KPIs = R$ 63,00, 1793 Tarefas');
    console.log(`Simulação: ${totalKpis} KPIs = R$ ${totalBonusKpis.toFixed(2)}, ${totalTarefasValidas} Tarefas`);

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

debugFrontendConditions();