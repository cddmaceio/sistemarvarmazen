const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key';
const supabase = createClient(supabaseUrl, supabaseKey);

async function debugUserData() {
  try {
    console.log('=== DEBUGGING USER DATA ===');
    
    // Buscar todos os lançamentos aprovados do usuário
    const { data: lancamentos, error } = await supabase
      .from('lancamentos_produtividade')
      .select('*')
      .eq('status', 'aprovado')
      .order('data_lancamento', { ascending: false });
    
    if (error) {
      console.error('Erro ao buscar lançamentos:', error);
      return;
    }
    
    console.log(`Total de lançamentos aprovados: ${lancamentos.length}`);
    
    // Filtrar por mês atual (Janeiro 2025)
    const mesAtual = new Date();
    const lancamentosJaneiro = lancamentos.filter(item => {
      const dataLancamento = new Date(item.data_lancamento);
      return dataLancamento.getMonth() === 0 && dataLancamento.getFullYear() === 2025;
    });
    
    console.log(`Lançamentos de Janeiro 2025: ${lancamentosJaneiro.length}`);
    
    // Calcular ganho total
    let ganhoTotal = 0;
    console.log('\n=== DETALHES DOS LANÇAMENTOS ===');
    
    lancamentosJaneiro.forEach((item, index) => {
      console.log(`\nLançamento ${index + 1}:`);
      console.log(`- ID: ${item.id}`);
      console.log(`- Data: ${item.data_lancamento}`);
      console.log(`- Usuário: ${item.user_nome} (${item.user_cpf})`);
      console.log(`- Função: ${item.funcao}`);
      console.log(`- Atividade: ${item.nome_atividade}`);
      console.log(`- Subtotal Atividades: R$ ${item.subtotal_atividades}`);
      console.log(`- Bonus KPIs: R$ ${item.bonus_kpis}`);
      console.log(`- Input Adicional: R$ ${item.input_adicional}`);
      console.log(`- Remuneração Total: R$ ${item.remuneracao_total}`);
      console.log(`- Status: ${item.status}`);
      
      ganhoTotal += item.remuneracao_total;
    });
    
    console.log(`\n=== RESULTADO FINAL ===`);
    console.log(`Ganho Total Calculado: R$ ${ganhoTotal.toFixed(2)}`);
    console.log(`Valor esperado no frontend: R$ 146.37`);
    console.log(`Valor incorreto mostrado: R$ 157.78`);
    
    // Verificar se há duplicatas
    const idsUnicos = new Set(lancamentosJaneiro.map(item => item.id));
    console.log(`\nIDs únicos: ${idsUnicos.size}`);
    console.log(`Total de registros: ${lancamentosJaneiro.length}`);
    
    if (idsUnicos.size !== lancamentosJaneiro.length) {
      console.log('⚠️  ATENÇÃO: Há registros duplicados!');
    }
    
  } catch (error) {
    console.error('Erro no debug:', error);
  }
}

// Executar o debug
debugUserData();