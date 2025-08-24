const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Função para calcular dias úteis (segunda a sábado)
function calcularDiasUteisMes(year, month) {
  const diasUteis = [];
  const ultimoDia = new Date(year, month, 0).getDate();
  
  for (let dia = 1; dia <= ultimoDia; dia++) {
    const data = new Date(year, month - 1, dia);
    const diaSemana = data.getDay(); // 0 = domingo, 1 = segunda, ..., 6 = sábado
    
    // Incluir segunda (1) a sábado (6), excluir domingo (0)
    if (diaSemana >= 1 && diaSemana <= 6) {
      diasUteis.push(dia);
    }
  }
  
  return diasUteis.length;
}

// Função para calcular valor dinâmico dos KPIs
function calcularValorKpiDinamico(year, month, orcamentoMensal = 150.00, maxKpisPorDia = 2) {
  const diasUteis = calcularDiasUteisMes(year, month);
  const totalKpisMes = diasUteis * maxKpisPorDia;
  const valorPorKpi = orcamentoMensal / totalKpisMes;
  
  // Arredondar para 2 casas decimais
  return Math.round(valorPorKpi * 100) / 100;
}

async function countKpisCorrectly() {
  try {
    console.log('=== CONTAGEM CORRETA DE KPIs ===\n');
    
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
    
    console.log(`📋 Total de lançamentos aprovados: ${lancamentos.length}\n`);
    
    // Calcular valor dinâmico para agosto 2025
    const valorKpiDinamico = calcularValorKpiDinamico(2025, 8);
    const diasUteis = calcularDiasUteisMes(2025, 8);
    
    console.log('📅 Informações do Mês (Agosto 2025):');
    console.log(`- Dias úteis: ${diasUteis}`);
    console.log(`- Valor dinâmico por KPI: R$ ${valorKpiDinamico}`);
    console.log(`- Orçamento mensal KPIs: R$ 150,00`);
    console.log('');
    
    let totalKpisContados = 0;
    let valorTotalKpis = 0;
    let totalTarefasValidas = 0;
    let valorTotalTarefas = 0;
    
    console.log('=== CONTAGEM DETALHADA ===\n');
    
    lancamentos.forEach((item, index) => {
      console.log(`📋 Lançamento ${index + 1} - ID: ${item.id} | Data: ${item.data_lancamento}`);
      
      // Contar KPIs corretamente
      if (item.kpis_atingidos && Array.isArray(item.kpis_atingidos)) {
        const kpisCount = item.kpis_atingidos.length;
        const valorKpisLancamento = kpisCount * valorKpiDinamico;
        
        totalKpisContados += kpisCount;
        valorTotalKpis += valorKpisLancamento;
        
        console.log(`   🎯 KPIs: [${item.kpis_atingidos.join(', ')}] = ${kpisCount} KPIs`);
        console.log(`   💵 Valor KPIs: ${kpisCount} × R$ ${valorKpiDinamico} = R$ ${valorKpisLancamento.toFixed(2)}`);
      } else {
        console.log(`   🎯 KPIs: Nenhum`);
      }
      
      // Contar tarefas válidas
      if (item.tarefas_validas && item.tarefas_validas > 0) {
        const tarefasCount = item.tarefas_validas;
        // Usar o valor real do banco (subtotal_atividades) em vez do cálculo fixo
        const valorTarefasReal = parseFloat(item.subtotal_atividades || 0);
        
        totalTarefasValidas += tarefasCount;
        valorTotalTarefas += valorTarefasReal;
        
        console.log(`   📋 Tarefas: ${tarefasCount} tarefas`);
        console.log(`   💵 Valor Tarefas (banco): R$ ${valorTarefasReal.toFixed(2)}`);
      } else {
        console.log(`   📋 Tarefas: Nenhuma`);
      }
      
      console.log('');
    });
    
    console.log('=== TOTAIS REAIS ===\n');
    console.log(`🎯 Total KPIs Contados: ${totalKpisContados}`);
    console.log(`💰 Valor Total KPIs: R$ ${valorTotalKpis.toFixed(2)}`);
    console.log(`📋 Total Tarefas Válidas: ${totalTarefasValidas}`);
    console.log(`💰 Valor Total Tarefas: R$ ${valorTotalTarefas.toFixed(2)}`);
    console.log(`💰 TOTAL GERAL: R$ ${(valorTotalKpis + valorTotalTarefas).toFixed(2)}`);
    
    console.log('\n=== COMPARAÇÃO COM DASHBOARD ===');
    console.log('Dashboard mostra:');
    console.log('- 21 KPIs = R$ 63,00');
    console.log('- 1793 Tarefas Válidas = R$ 83,37');
    console.log('- Total Dashboard = R$ 146,37');
    console.log('');
    console.log('Contagem real mostra:');
    console.log(`- ${totalKpisContados} KPIs = R$ ${valorTotalKpis.toFixed(2)}`);
    console.log(`- ${totalTarefasValidas} Tarefas Válidas = R$ ${valorTotalTarefas.toFixed(2)}`);
    console.log(`- Total Real = R$ ${(valorTotalKpis + valorTotalTarefas).toFixed(2)}`);
    
    // Análise das discrepâncias
    console.log('\n=== ANÁLISE FINAL ===');
    
    if (totalKpisContados !== 21) {
      console.log(`⚠️  DISCREPÂNCIA KPIs: Dashboard mostra 21, banco tem ${totalKpisContados}`);
      console.log('   Possível causa: Frontend está contando KPIs de forma diferente ou há cache');
    }
    
    if (totalTarefasValidas !== 1793) {
      console.log(`⚠️  DISCREPÂNCIA TAREFAS: Dashboard mostra 1793, banco tem ${totalTarefasValidas}`);
      console.log('   Possível causa: Frontend está somando tarefas de forma diferente');
    }
    
    const diferencaValorTotal = Math.abs((valorTotalKpis + valorTotalTarefas) - 146.37);
    if (diferencaValorTotal > 0.01) {
      console.log(`⚠️  DISCREPÂNCIA VALOR: Dashboard mostra R$ 146,37, cálculo real R$ ${(valorTotalKpis + valorTotalTarefas).toFixed(2)}`);
      console.log(`   Diferença: R$ ${diferencaValorTotal.toFixed(2)}`);
    }
    
    // Verificar se o total real bate com R$ 157,78
    const somaLancamentos = lancamentos.reduce((sum, l) => sum + parseFloat(l.remuneracao_total || 0), 0);
    console.log(`\n💰 Soma total dos lançamentos: R$ ${somaLancamentos.toFixed(2)}`);
    console.log(`💰 Soma KPIs + Tarefas: R$ ${(valorTotalKpis + valorTotalTarefas).toFixed(2)}`);
    console.log(`⚖️  Diferença: R$ ${(somaLancamentos - (valorTotalKpis + valorTotalTarefas)).toFixed(2)}`);
    
    if (Math.abs(somaLancamentos - 157.78) < 0.01) {
      console.log('\n✅ CONFIRMADO: A soma dos lançamentos (R$ 157,78) está correta!');
      console.log('🔍 O problema está na forma como o frontend está calculando/exibindo os componentes.');
    }
    
  } catch (error) {
    console.error('❌ Erro na análise:', error);
  }
}

countKpisCorrectly();