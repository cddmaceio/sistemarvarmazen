import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = 'https://your-project.supabase.co';
const supabaseKey = 'your-anon-key';

// Função para verificar KPIs
async function checkKPIs() {
  try {
    // Criar cliente Supabase usando variáveis de ambiente ou valores padrão
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL || 'https://qcqkfipckcnydsjjdral.supabase.co',
      process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjcWtmaXBja2NueWRzampkcmFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2Mjc3MzcsImV4cCI6MjA3MTIwMzczN30.5Bq-1-TyOugW1-NrkDj_37lCYDvKJNiaRC6vFoWqXZk'
    );

    console.log('🔍 Verificando KPIs para Operador de Empilhadeira...');
    
    // Buscar KPIs para Operador de Empilhadeira
    const { data: kpis, error } = await supabase
      .from('kpis')
      .select('*')
      .eq('funcao_kpi', 'Operador de Empilhadeira');

    if (error) {
      console.error('❌ Erro ao buscar KPIs:', error);
      return;
    }

    console.log(`📊 Encontrados ${kpis.length} KPIs para Operador de Empilhadeira:`);
    
    if (kpis.length === 0) {
      console.log('⚠️ Nenhum KPI encontrado para Operador de Empilhadeira');
      console.log('💡 Criando KPIs de exemplo...');
      
      // Criar KPIs de exemplo
      const exampleKPIs = [
        {
          nome_kpi: 'Produtividade Empilhadeira',
          descricao: 'Tarefas WMS válidas executadas por hora',
          funcao_kpi: 'Operador de Empilhadeira',
          turno_kpi: 'Manhã',
          valor_meta_kpi: 10,
          peso_kpi: 0.093,
          status_ativo: true
        },
        {
          nome_kpi: 'Produtividade Empilhadeira',
          descricao: 'Tarefas WMS válidas executadas por hora',
          funcao_kpi: 'Operador de Empilhadeira',
          turno_kpi: 'Tarde',
          valor_meta_kpi: 10,
          peso_kpi: 0.093,
          status_ativo: true
        },
        {
          nome_kpi: 'Produtividade Empilhadeira',
          descricao: 'Tarefas WMS válidas executadas por hora',
          funcao_kpi: 'Operador de Empilhadeira',
          turno_kpi: 'Noite',
          valor_meta_kpi: 10,
          peso_kpi: 0.093,
          status_ativo: true
        }
      ];

      const { data: newKPIs, error: insertError } = await supabase
        .from('kpis')
        .insert(exampleKPIs)
        .select();

      if (insertError) {
        console.error('❌ Erro ao criar KPIs:', insertError);
      } else {
        console.log('✅ KPIs criados com sucesso:', newKPIs.length);
      }
    } else {
      kpis.forEach((kpi, index) => {
        console.log(`${index + 1}. ${kpi.nome_kpi} - ${kpi.turno_kpi}`);
        console.log(`   Meta: ${kpi.valor_meta_kpi}, Peso: ${kpi.peso_kpi}`);
        console.log(`   Ativo: ${kpi.status_ativo ? 'Sim' : 'Não'}`);
        console.log('');
      });
    }

  } catch (error) {
    console.error('💥 Erro geral:', error.message);
  }
}

// Executar verificação
checkKPIs();