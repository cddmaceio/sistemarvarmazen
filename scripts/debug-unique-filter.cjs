const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function debugUniqueFilter() {
  console.log('🔍 VERIFICANDO FILTRO DE LANÇAMENTOS ÚNICOS');
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

    console.log(`📊 Total de lançamentos aprovados em agosto: ${lancamentos.length}`);
    console.log('');

    // Simular o filtro de lançamentos únicos do frontend
    const lancamentosUnicos = lancamentos.filter((item, index, arr) => {
      const isUnique = arr.findIndex(t => t.id === item.id) === index && item.status === 'aprovado';
      
      if (!isUnique) {
        console.log(`🔄 Lançamento duplicado removido: ID ${item.id}`);
      }
      
      return isUnique;
    });

    console.log(`✅ Lançamentos únicos após filtro: ${lancamentosUnicos.length}`);
    console.log(`❌ Lançamentos removidos por duplicação: ${lancamentos.length - lancamentosUnicos.length}`);
    console.log('');

    // Verificar se há IDs duplicados
    const ids = lancamentos.map(item => item.id);
    const idsUnicos = [...new Set(ids)];
    
    console.log('🔍 ANÁLISE DE DUPLICAÇÃO:');
    console.log(`📊 Total de IDs: ${ids.length}`);
    console.log(`📊 IDs únicos: ${idsUnicos.length}`);
    console.log(`🔄 IDs duplicados: ${ids.length - idsUnicos.length}`);
    
    if (ids.length !== idsUnicos.length) {
      console.log('');
      console.log('🔄 IDs DUPLICADOS ENCONTRADOS:');
      const contadorIds = {};
      ids.forEach(id => {
        contadorIds[id] = (contadorIds[id] || 0) + 1;
      });
      
      Object.entries(contadorIds).forEach(([id, count]) => {
        if (count > 1) {
          console.log(`   ID ${id}: ${count} ocorrências`);
        }
      });
    } else {
      console.log('✅ Não há IDs duplicados.');
    }
    
    console.log('');
    console.log('🔍 COMPARAÇÃO COM DASHBOARD:');
    console.log('Dashboard mostra: 12 lançamentos');
    console.log(`Filtro único simula: ${lancamentosUnicos.length} lançamentos`);
    
    if (lancamentosUnicos.length === 12) {
      console.log('✅ MATCH! O filtro de únicos explica os 12 lançamentos.');
    } else {
      console.log(`❌ MISMATCH! Esperado 12, encontrado ${lancamentosUnicos.length}`);
      console.log('💡 O problema não está no filtro de únicos.');
    }
    
    // Agora vamos simular a criação do histórico completo
    console.log('');
    console.log('🔍 SIMULANDO CRIAÇÃO DO HISTÓRICO COMPLETO:');
    
    let historicoCompleto = [];
    let contadorTarefasValidas = 0;
    let contadorKpis = 0;
    
    lancamentosUnicos.forEach((item, index) => {
      console.log(`📋 Processando lançamento ${index + 1} - ID: ${item.id}`);
      
      // Parse dos dados
      let dados = {};
      if (item.dados_atividade) {
        try {
          if (typeof item.dados_atividade === 'string') {
            dados = JSON.parse(item.dados_atividade);
          } else {
            dados = item.dados_atividade;
          }
        } catch (e) {
          console.log(`   ⚠️ Erro ao parsear dados_atividade: ${e.message}`);
        }
      }
      
      // Verificar condições para histórico
      const temTarefasValidas = item.tarefas_validas && item.tarefas_validas > 0;
      const temKpis = item.kpis_atingidos && item.bonus_kpis && item.bonus_kpis > 0;
      
      console.log(`   ✅ Tem tarefas válidas: ${temTarefasValidas ? 'SIM' : 'NÃO'} (${item.tarefas_validas})`);
      console.log(`   🎯 Tem KPIs: ${temKpis ? 'SIM' : 'NÃO'} (bonus: R$ ${item.bonus_kpis})`);
      
      if (temTarefasValidas) {
        historicoCompleto.push({
          id: item.id,
          tipo: 'Tarefas Válidas',
          data: item.data_lancamento
        });
        contadorTarefasValidas++;
        console.log(`   ➕ Adicionado como 'Tarefas Válidas'`);
      }
      
      if (temKpis) {
        historicoCompleto.push({
          id: item.id,
          tipo: 'KPIs Atingidos',
          data: item.data_lancamento
        });
        contadorKpis++;
        console.log(`   ➕ Adicionado como 'KPIs Atingidos'`);
      }
      
      if (!temTarefasValidas && !temKpis) {
        console.log(`   ❌ NÃO adicionado ao histórico`);
      }
      
      console.log('');
    });
    
    console.log('=' .repeat(70));
    console.log('📊 RESULTADO FINAL:');
    console.log(`✅ Entradas com tarefas válidas: ${contadorTarefasValidas}`);
    console.log(`🎯 Entradas com KPIs: ${contadorKpis}`);
    console.log(`📋 Total no histórico completo: ${historicoCompleto.length}`);
    console.log('');
    console.log('🔍 COMPARAÇÃO COM DASHBOARD:');
    console.log('Dashboard mostra: 12 lançamentos');
    console.log(`Simulação final: ${historicoCompleto.length} lançamentos`);
    
    if (historicoCompleto.length === 12) {
      console.log('✅ PERFEITO! A simulação explica exatamente os 12 lançamentos do dashboard.');
    } else {
      console.log(`❌ AINDA HÁ DISCREPÂNCIA! Esperado 12, encontrado ${historicoCompleto.length}`);
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

debugUniqueFilter();