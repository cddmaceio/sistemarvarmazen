const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function debugFrontendFilter() {
  console.log('🔍 SIMULANDO FILTRO DO FRONTEND');
  console.log('=' .repeat(60));

  try {
    // Buscar todos os lançamentos de Dilson
    const { data: lancamentos, error } = await supabase
      .from('lancamentos_produtividade')
      .select(`
        *,
        usuarios!lancamentos_produtividade_usuario_id_fkey(nome, funcao)
      `)
      .eq('usuarios.nome', 'Dilson Arlindo')
      .eq('status', 'aprovado')
      .order('data_lancamento', { ascending: true });

    if (error) {
      console.error('❌ Erro na consulta:', error);
      return;
    }

    console.log(`📊 Total de lançamentos aprovados no banco: ${lancamentos.length}`);
    console.log('');

    // Simular o filtro do frontend
    const mesAtual = new Date(); // Janeiro 2025
    console.log(`📅 Mês atual do frontend: ${mesAtual.getMonth() + 1}/${mesAtual.getFullYear()}`);
    console.log('');

    const dadosUsuario = lancamentos.filter((item) => {
      // Usar a mesma lógica do frontend
      const dateOnly = item.data_lancamento.split('T')[0];
      const [year, month, day] = dateOnly.split('-');
      const dataLancamento = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      
      const mesLancamento = dataLancamento.getMonth();
      const anoLancamento = dataLancamento.getFullYear();
      
      const passaFiltro = mesLancamento === mesAtual.getMonth() && anoLancamento === mesAtual.getFullYear();
      
      console.log(`📋 ID: ${item.id}, Data: ${item.data_lancamento}`);
      console.log(`   📅 Data parseada: ${dataLancamento.toLocaleDateString()}`);
      console.log(`   🗓️ Mês/Ano: ${mesLancamento + 1}/${anoLancamento}`);
      console.log(`   ✅ Passa filtro: ${passaFiltro ? 'SIM' : 'NÃO'}`);
      console.log('');
      
      return passaFiltro;
    });

    console.log('=' .repeat(60));
    console.log(`📊 RESULTADO DO FILTRO:`);
    console.log(`🔍 Lançamentos que passaram no filtro: ${dadosUsuario.length}`);
    console.log(`❌ Lançamentos filtrados: ${lancamentos.length - dadosUsuario.length}`);
    console.log('');
    
    if (dadosUsuario.length === 0) {
      console.log('⚠️ PROBLEMA IDENTIFICADO:');
      console.log('O frontend está filtrando por Janeiro/2025, mas os lançamentos são de Agosto/2025!');
      console.log('');
      console.log('🔧 SOLUÇÃO:');
      console.log('1. Alterar o mês atual no frontend para Agosto/2025, OU');
      console.log('2. Remover/ajustar o filtro de mês no frontend');
    } else {
      console.log('✅ Filtro funcionando corretamente');
      
      // Calcular totais dos dados filtrados
      let totalKpis = 0;
      let totalBonusKpis = 0;
      let totalTarefasValidas = 0;
      let totalRemuneracao = 0;

      dadosUsuario.forEach((item) => {
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
        
        totalKpis += kpisArray.length;
        totalBonusKpis += parseFloat(item.bonus_kpis || 0);
        totalTarefasValidas += parseInt(item.tarefas_validas || 0);
        totalRemuneracao += parseFloat(item.remuneracao_total || 0);
      });
      
      console.log('📊 TOTAIS DOS DADOS FILTRADOS:');
      console.log(`🎯 Total KPIs: ${totalKpis}`);
      console.log(`💰 Total Bonus KPIs: R$ ${totalBonusKpis.toFixed(2)}`);
      console.log(`✅ Total Tarefas Válidas: ${totalTarefasValidas}`);
      console.log(`💵 Total Remuneração: R$ ${totalRemuneracao.toFixed(2)}`);
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

debugFrontendFilter();