import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = 'https://qcqkfipckcnydsjjdral.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjcWtmaXBja2NueWRzampkcmFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2Mjc3MzcsImV4cCI6MjA3MTIwMzczN30.5Bq-1-TyOugW1-NrkDj_37lCYDvKJNiaRC6vFoWqXZk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateKPIs() {
  try {
    console.log('🔄 Atualizando valores dos KPIs para Operador de Empilhadeira...');
    
    // Atualizar todos os KPIs para Operador de Empilhadeira
    const { data, error } = await supabase
      .from('kpis')
      .update({ 
        peso_kpi: 2.88,
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

    // Calcular total mensal (52 KPIs)
    const totalMensal = kpis.length > 0 ? 52 * kpis[0].peso_kpi : 0;
    console.log(`💰 Total mensal máximo (52 KPIs): R$ ${totalMensal.toFixed(2)}`);
    
  } catch (error) {
    console.error('💥 Erro geral:', error.message);
  }
}

// Executar atualização
updateKPIs();