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

async function debugFrontendCalculation() {
  try {
    console.log('=== DEBUG: CÁLCULO DO FRONTEND ===\n');
    
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
    
    // Simular a lógica do frontend para operadores de empilhadeira
    let totalKpisAtingidos = 0;
    let valorTotalKpis = 0;
    let totalTarefasValidas = 0;
    let valorTotalTarefas = 0;
    
    // Calcular valor dinâmico para agosto 2025
    const valorKpiDinamico = calcularValorKpiDinamico(2025, 8);
    const diasUteis = calcularDiasUteisMes(2025, 8);
    
    console.log('📅 Informações do Mês (Agosto 2025):');
    console.log(`- Dias úteis: ${diasUteis}`);
    console.log(`- Valor dinâmico por KPI: R$ ${valorKpiDinamico}`);
    console.log(`- Orçamento mensal KPIs: R$ 150,00`);
    console.log('');
    
    console.log('=== PROCESSAMENTO POR LANÇAMENTO ===\n');
    
    lancamentos.forEach((item, index) => {
      console.log(`📋 Lançamento ${index + 1} - ID: ${item.id} | Data: ${item.data_lancamento}`);
      console.log(`   💰 Remuneração Total: R$ ${item.remuneracao_total}`);
      
      // Processar KPIs
      if (item.kpis_atingidos && Array.isArray(item.kpis_atingidos) && item.kpis_atingidos.length > 0) {
        const kpisCount = item.kpis_atingidos.length;
        const valorKpisLancamento = kpisCount * valorKpiDinamico;
        
        totalKpisAtingidos += kpisCount;
        valorTotalKpis += valorKpisLancamento;
        
        console.log(`   🎯 KPIs: ${item.kpis_atingidos.join(', ')} (${kpisCount} KPIs)`);
        console.log(`   💵 Valor KPIs: ${kpisCount} × R$ ${valorKpiDinamico} = R$ ${valorKpisLancamento.toFixed(2)}`);
      }
      
      // Processar Tarefas Válidas
      if (item.tarefas_validas && item.tarefas_validas > 0) {
        const tarefasCount = item.tarefas_validas;
        // Valor por tarefa baseado no valor fixo do frontend: R$ 0,093
        const valorPorTarefa = 0.093;
        const valorTarefasLancamento = tarefasCount * valorPorTarefa;
        
        totalTarefasValidas += tarefasCount;
        valorTotalTarefas += valorTarefasLancamento;
        
        console.log(`   📋 Tarefas Válidas: ${tarefasCount} tarefas`);
        console.log(`   💵 Valor Tarefas: ${tarefasCount} × R$ ${valorPorTarefa} = R$ ${valorTarefasLancamento.toFixed(2)}`);
        
        // Verificar se o valor calculado bate com subtotal_atividades
        if (item.subtotal_atividades) {
          console.log(`   ⚖️  Subtotal Atividades (banco): R$ ${item.subtotal_atividades}`);
          const diferenca = Math.abs(valorTarefasLancamento - parseFloat(item.subtotal_atividades));
          if (diferenca > 0.01) {
            console.log(`   ⚠️  DIFERENÇA: R$ ${diferenca.toFixed(2)}`);
          }
        }
      }
      
      console.log('');
    });
    
    console.log('=== TOTAIS CALCULADOS (SIMULANDO FRONTEND) ===\n');
    console.log(`🎯 Total KPIs Atingidos: ${totalKpisAtingidos}`);
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
    console.log('Cálculo simulado mostra:');
    console.log(`- ${totalKpisAtingidos} KPIs = R$ ${valorTotalKpis.toFixed(2)}`);
    console.log(`- ${totalTarefasValidas} Tarefas Válidas = R$ ${valorTotalTarefas.toFixed(2)}`);
    console.log(`- Total Simulado = R$ ${(valorTotalKpis + valorTotalTarefas).toFixed(2)}`);
    
    // Verificar se há discrepâncias
    const diferencaKpis = Math.abs(valorTotalKpis - 63.00);
    const diferencaTarefas = Math.abs(valorTotalTarefas - 83.37);
    const diferencaTotal = Math.abs((valorTotalKpis + valorTotalTarefas) - 146.37);
    
    console.log('\n=== ANÁLISE DE DISCREPÂNCIAS ===');
    console.log(`Diferença KPIs: R$ ${diferencaKpis.toFixed(2)}`);
    console.log(`Diferença Tarefas: R$ ${diferencaTarefas.toFixed(2)}`);
    console.log(`Diferença Total: R$ ${diferencaTotal.toFixed(2)}`);
    
    if (diferencaTotal > 0.01) {
      console.log('\n🚨 PROBLEMA IDENTIFICADO!');
      console.log('Há discrepância entre o cálculo simulado e os valores do dashboard.');
      console.log('Possíveis causas:');
      console.log('1. Frontend está usando lógica de cálculo diferente');
      console.log('2. Há dados adicionais não considerados na simulação');
      console.log('3. Cache ou dados desatualizados no frontend');
      console.log('4. Valores fixos hardcoded no frontend');
    } else {
      console.log('\n✅ CÁLCULO CORRETO!');
      console.log('O cálculo simulado bate com os valores do dashboard.');
    }
    
  } catch (error) {
    console.error('❌ Erro na análise:', error);
  }
}

debugFrontendCalculation();