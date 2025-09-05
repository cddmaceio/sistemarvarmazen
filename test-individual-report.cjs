const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testIndividualReport() {
  console.log('🔍 TESTE DO RELATÓRIO INDIVIDUAL - SETEMBRO 2025\n');
  
  const cpfTeste = '109.625.114-04';
  const mesAno = '2025-09'; // Setembro 2025 (onde estão os dados)
  
  try {
    // 1. Buscar colaborador
    console.log(`👤 Buscando colaborador com CPF: ${cpfTeste}`);
    const { data: colaborador, error: colaboradorError } = await supabase
      .from('usuarios')
      .select('id, nome, cpf, funcao')
      .eq('cpf', cpfTeste)
      .eq('status_usuario', 'ativo')
      .single();

    if (colaboradorError || !colaborador) {
      console.error('❌ Colaborador não encontrado:', colaboradorError);
      return;
    }
    
    console.log(`✅ Colaborador encontrado: ${colaborador.nome} (ID: ${colaborador.id})\n`);
    
    // 2. Definir período de setembro 2025
    const [year, month] = mesAno.split('-');
    const startDate = `${year}-${month}-01`;
    const nextMonth = parseInt(month) === 12 ? 1 : parseInt(month) + 1;
    const nextYear = parseInt(month) === 12 ? parseInt(year) + 1 : parseInt(year);
    const endDate = `${nextYear}-${nextMonth.toString().padStart(2, '0')}-01`;
    
    console.log(`📅 Período de busca: ${startDate} até ${endDate}\n`);
    
    // 3. Buscar lançamentos do período
    const { data: lancamentos, error: lancamentosError } = await supabase
      .from('lancamentos_produtividade')
      .select(`
        id,
        data_lancamento,
        turno,
        nome_atividade,
        quantidade_produzida,
        tempo_horas,
        multiple_activities,
        atividades_detalhes,
        kpis_atingidos,
        remuneracao_total,
        subtotal_atividades,
        bonus_kpis,
        status,
        observacoes,
        created_at
      `)
      .eq('user_id', colaborador.id)
      .gte('data_lancamento', startDate)
      .lt('data_lancamento', endDate)
      .order('data_lancamento', { ascending: true });
      
    if (lancamentosError) {
      console.error('❌ Erro ao buscar lançamentos:', lancamentosError);
      return;
    }
    
    console.log(`📋 Total de lançamentos encontrados: ${lancamentos?.length || 0}\n`);
    
    if (!lancamentos || lancamentos.length === 0) {
      console.log('⚠️ Nenhum lançamento encontrado para o período especificado.');
      return;
    }
    
    // 4. Analisar cada lançamento detalhadamente
    let totalKpisAtingidos = 0;
    let valorTotalKpis = 0;
    
    console.log('=== ANÁLISE DETALHADA DOS LANÇAMENTOS ===\n');
    
    lancamentos.forEach((lancamento, index) => {
      console.log(`📋 Lançamento ${index + 1}:`);
      console.log(`   📅 Data: ${lancamento.data_lancamento}`);
      console.log(`   🕐 Turno: ${lancamento.turno}`);
      console.log(`   📊 Status: ${lancamento.status}`);
      console.log(`   💰 Remuneração Total: R$ ${(lancamento.remuneracao_total || 0).toFixed(2)}`);
      console.log(`   💵 Bonus KPIs (banco): R$ ${(lancamento.bonus_kpis || 0).toFixed(2)}`);
      
      // Analisar KPIs em detalhes
      if (lancamento.kpis_atingidos) {
        try {
          const kpis = typeof lancamento.kpis_atingidos === 'string' 
            ? JSON.parse(lancamento.kpis_atingidos) 
            : lancamento.kpis_atingidos;
            
          console.log(`   🎯 KPIs raw data:`, JSON.stringify(kpis, null, 2));
            
          if (Array.isArray(kpis)) {
            const kpisAtingidos = kpis.filter(kpi => kpi.atingido === true);
            const quantidadeKpis = kpisAtingidos.length;
            
            totalKpisAtingidos += quantidadeKpis;
            valorTotalKpis += (lancamento.bonus_kpis || 0);
            
            console.log(`   📊 Total KPIs no array: ${kpis.length}`);
            console.log(`   ✅ KPIs atingidos: ${quantidadeKpis}`);
            
            if (quantidadeKpis > 0) {
              console.log(`   📝 Nomes dos KPIs atingidos:`);
              kpisAtingidos.forEach((kpi, i) => {
                console.log(`      ${i + 1}. ${kpi.nome} - Valor: ${kpi.valor} - Atingido: ${kpi.atingido}`);
              });
            }
            
            // Verificar se há KPIs não atingidos
            const kpisNaoAtingidos = kpis.filter(kpi => kpi.atingido === false);
            if (kpisNaoAtingidos.length > 0) {
              console.log(`   ❌ KPIs NÃO atingidos: ${kpisNaoAtingidos.length}`);
              kpisNaoAtingidos.forEach((kpi, i) => {
                console.log(`      ${i + 1}. ${kpi.nome} - Valor: ${kpi.valor} - Atingido: ${kpi.atingido}`);
              });
            }
          } else {
            console.log(`   ⚠️ KPIs não é um array válido:`, typeof kpis);
          }
        } catch (e) {
          console.log(`   ❌ Erro ao processar KPIs: ${e.message}`);
          console.log(`   📄 Dados brutos:`, lancamento.kpis_atingidos);
        }
      } else {
        console.log(`   🎯 Nenhum KPI registrado`);
      }
      
      console.log('');
    });
    
    // 5. Resumo final
    console.log('=== RESUMO FINAL ===\n');
    console.log(`🎯 Total de KPIs atingidos: ${totalKpisAtingidos}`);
    console.log(`💰 Valor total dos KPIs: R$ ${valorTotalKpis.toFixed(2)}`);
    
    // 6. Verificar se há discrepância
    const valorEsperadoPorKpi = 3.00; // R$ 3,00 por KPI
    const valorEsperado = totalKpisAtingidos * valorEsperadoPorKpi;
    
    console.log(`\n🔍 ANÁLISE:`);
    console.log(`   Valor esperado (${totalKpisAtingidos} × R$ 3,00): R$ ${valorEsperado.toFixed(2)}`);
    console.log(`   Valor real (soma bonus_kpis): R$ ${valorTotalKpis.toFixed(2)}`);
    
    if (Math.abs(valorTotalKpis - valorEsperado) < 0.01) {
      console.log(`   ✅ Valores batem!`);
    } else {
      console.log(`   ❌ Discrepância de R$ ${Math.abs(valorTotalKpis - valorEsperado).toFixed(2)}`);
    }
    
    // 7. Simular como o frontend deveria calcular
    console.log(`\n🖥️ SIMULAÇÃO DO FRONTEND:`);
    
    lancamentos.forEach((lancamento, index) => {
      if (lancamento.kpis_atingidos) {
        try {
          const kpis = typeof lancamento.kpis_atingidos === 'string' 
            ? JSON.parse(lancamento.kpis_atingidos) 
            : lancamento.kpis_atingidos;
            
          if (Array.isArray(kpis)) {
            const kpisAtingidosArray = kpis.filter(kpi => kpi.atingido);
            const kpisAtingidos = kpisAtingidosArray.map(kpi => kpi.nome).join(', ') || 'Nenhum';
            const quantidadeKpisAtingidos = kpisAtingidosArray.length;
            const valorKpisAtingidos = kpisAtingidosArray.reduce((sum, kpi) => sum + (kpi.bonus || 0), 0);
            
            console.log(`   Lançamento ${index + 1} (${lancamento.data_lancamento}):`);
            console.log(`      KPIs Atingidos: ${kpisAtingidos}`);
            console.log(`      Quantidade: ${quantidadeKpisAtingidos}`);
            console.log(`      Valor calculado pelo frontend: R$ ${valorKpisAtingidos.toFixed(2)}`);
            console.log(`      Valor do banco (bonus_kpis): R$ ${(lancamento.bonus_kpis || 0).toFixed(2)}`);
          }
        } catch (e) {
          console.log(`   Erro no lançamento ${index + 1}: ${e.message}`);
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testIndividualReport().then(() => {
  console.log('\n✅ Teste concluído!');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erro no teste:', error);
  process.exit(1);
});