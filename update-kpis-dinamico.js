import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = 'https://qcqkfipckcnydsjjdral.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjcWtmaXBja2NueWRzampkcmFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2Mjc3MzcsImV4cCI6MjA3MTIwMzczN30.5Bq-1-TyOugW1-NrkDj_37lCYDvKJNiaRC6vFoWqXZk';

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Calcula o número de dias úteis (segunda a sábado) em um mês específico
 */
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

/**
 * Calcula o valor dinâmico por KPI baseado no orçamento mensal fixo
 */
function calcularValorKpiDinamico(year, month, orcamentoMensal = 150.00, maxKpisPorDia = 2) {
  const diasUteis = calcularDiasUteisMes(year, month);
  const totalKpisMes = diasUteis * maxKpisPorDia;
  const valorPorKpi = orcamentoMensal / totalKpisMes;
  
  // Arredondar para 2 casas decimais
  return Math.round(valorPorKpi * 100) / 100;
}

/**
 * Calcula informações completas sobre KPIs para um mês específico
 */
function calcularInfoKpiMes(year, month, orcamentoMensal = 150.00, maxKpisPorDia = 2) {
  const diasUteis = calcularDiasUteisMes(year, month);
  const totalKpisMes = diasUteis * maxKpisPorDia;
  const valorPorKpi = calcularValorKpiDinamico(year, month, orcamentoMensal, maxKpisPorDia);
  const totalRealMes = totalKpisMes * valorPorKpi;
  
  return {
    diasUteis,
    totalKpisMes,
    valorPorKpi,
    totalRealMes,
    orcamentoMensal,
    maxKpisPorDia,
    mes: month,
    ano: year
  };
}

async function updateKPIsDinamico() {
  try {
    console.log('🔄 Atualizando valores dos KPIs dinamicamente...');
    
    // Calcular para o mês atual
    const agora = new Date();
    const anoAtual = agora.getFullYear();
    const mesAtual = agora.getMonth() + 1;
    
    const infoMesAtual = calcularInfoKpiMes(anoAtual, mesAtual);
    
    console.log('\n📊 Informações do Mês Atual:');
    console.log(`📅 Mês/Ano: ${mesAtual}/${anoAtual}`);
    console.log(`📋 Dias úteis: ${infoMesAtual.diasUteis}`);
    console.log(`🎯 Total KPIs no mês: ${infoMesAtual.totalKpisMes}`);
    console.log(`💰 Valor por KPI: R$ ${infoMesAtual.valorPorKpi}`);
    console.log(`💵 Total real do mês: R$ ${infoMesAtual.totalRealMes}`);
    console.log(`🏦 Orçamento mensal: R$ ${infoMesAtual.orcamentoMensal}`);
    
    // Mostrar exemplos de outros meses
    console.log('\n📈 Comparação com outros meses:');
    
    const exemplos = [
      { mes: 2, ano: 2025, nome: 'Fevereiro 2025' },
      { mes: 8, ano: 2025, nome: 'Agosto 2025' },
      { mes: 12, ano: 2024, nome: 'Dezembro 2024' }
    ];
    
    exemplos.forEach(({ mes, ano, nome }) => {
      const info = calcularInfoKpiMes(ano, mes);
      console.log(`${nome}: ${info.diasUteis} dias úteis → R$ ${info.valorPorKpi}/KPI (${info.totalKpisMes} KPIs = R$ ${info.totalRealMes})`);
    });
    
    // Atualizar no banco de dados
    console.log('\n🔄 Atualizando banco de dados...');
    
    const { data, error } = await supabase
      .from('kpis')
      .update({ 
        peso_kpi: infoMesAtual.valorPorKpi,
        updated_at: new Date().toISOString()
      })
      .eq('funcao_kpi', 'Operador de Empilhadeira')
      .select();

    if (error) {
      console.error('❌ Erro ao atualizar KPIs:', error);
      return;
    }

    console.log(`✅ ${data.length} KPIs atualizados com sucesso!`);
    
    // Verificar os valores atualizados
    const { data: kpis, error: fetchError } = await supabase
      .from('kpis')
      .select('nome_kpi, peso_kpi, turno_kpi, funcao_kpi')
      .eq('funcao_kpi', 'Operador de Empilhadeira')
      .order('turno_kpi')
      .order('nome_kpi');

    if (fetchError) {
      console.error('❌ Erro ao buscar KPIs:', fetchError);
      return;
    }

    console.log('\n📊 KPIs atualizados para Operador de Empilhadeira:');
    kpis.forEach((kpi, index) => {
      console.log(`${index + 1}. ${kpi.nome_kpi} - ${kpi.turno_kpi}`);
      console.log(`   Peso: R$ ${kpi.peso_kpi}`);
      console.log('');
    });

    console.log('\n🎯 Resumo da Atualização:');
    console.log(`• Valor por KPI: R$ ${infoMesAtual.valorPorKpi}`);
    console.log(`• Máximo por dia: R$ ${(infoMesAtual.valorPorKpi * 2).toFixed(2)} (2 KPIs)`);
    console.log(`• Máximo mensal: R$ ${infoMesAtual.totalRealMes} (${infoMesAtual.totalKpisMes} KPIs)`);
    console.log(`• Orçamento respeitado: R$ ${infoMesAtual.orcamentoMensal}`);
    
  } catch (error) {
    console.error('💥 Erro geral:', error.message);
  }
}

// Executar atualização
updateKPIsDinamico();