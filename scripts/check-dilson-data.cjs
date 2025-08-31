const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDilsonData() {
  try {
    console.log('=== VERIFICANDO DADOS DO DILSON ARLINDO ===\n');
    
    // Buscar todos os lançamentos do Dilson Arlindo (ID: 6) em agosto 2025
    const { data, error } = await supabase
      .from('lancamentos_produtividade')
      .select('id, data_lancamento, status, remuneracao_total')
      .eq('user_id', 6)
      .gte('data_lancamento', '2025-08-01')
      .lt('data_lancamento', '2025-09-01')
      .order('data_lancamento', { ascending: true });
    
    if (error) {
      console.error('Erro ao buscar dados:', error);
      return;
    }
    
    console.log('Todos os lançamentos do Dilson Arlindo (ID: 6) em agosto 2025:');
    data.forEach((item, index) => {
      console.log(`${index + 1}. ID: ${item.id}, Data: ${item.data_lancamento}, Status: ${item.status}, Valor: R$ ${item.remuneracao_total}`);
    });
    
    console.log(`\nTotal: ${data.length} lançamentos`);
    
    // Filtrar apenas os aprovados
    const aprovados = data.filter(item => item.status === 'aprovado');
    console.log(`Aprovados: ${aprovados.length} lançamentos`);
    
    // Calcular soma dos aprovados
    const somaAprovados = aprovados.reduce((sum, item) => sum + parseFloat(item.remuneracao_total || 0), 0);
    console.log(`Soma dos aprovados: R$ ${somaAprovados.toFixed(2)}`);
    
    // Verificar se há algum lançamento não aprovado
    const naoAprovados = data.filter(item => item.status !== 'aprovado');
    if (naoAprovados.length > 0) {
      console.log('\n⚠️  Lançamentos NÃO aprovados:');
      naoAprovados.forEach((item, index) => {
        console.log(`${index + 1}. ID: ${item.id}, Data: ${item.data_lancamento}, Status: ${item.status}, Valor: R$ ${item.remuneracao_total}`);
      });
    }
    
    // Verificar se há exatamente 12 aprovados que somam R$ 157,78
    if (aprovados.length >= 12) {
      const primeiros12 = aprovados.slice(0, 12);
      const soma12 = primeiros12.reduce((sum, item) => sum + parseFloat(item.remuneracao_total || 0), 0);
      console.log(`\nSoma dos primeiros 12 aprovados: R$ ${soma12.toFixed(2)}`);
      
      if (Math.abs(soma12 - 157.78) < 0.01) {
        console.log('✅ CONFIRMADO! Os primeiros 12 lançamentos aprovados somam R$ 157,78');
        console.log('\nDetalhes dos 12 lançamentos que somam R$ 157,78:');
        primeiros12.forEach((item, index) => {
          console.log(`${index + 1}. ID: ${item.id}, Data: ${item.data_lancamento}, Valor: R$ ${item.remuneracao_total}`);
        });
        
        if (aprovados.length > 12) {
          console.log('\n📋 Lançamento(s) adicional(is) não incluído(s) no total R$ 157,78:');
          aprovados.slice(12).forEach((item, index) => {
            console.log(`${index + 1}. ID: ${item.id}, Data: ${item.data_lancamento}, Valor: R$ ${item.remuneracao_total}`);
          });
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Erro na verificação:', error);
  }
}

checkDilsonData();