const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function debugMonthFilter() {
  console.log('🔍 VERIFICANDO FILTRO DE MÊS DO FRONTEND');
  console.log('=' .repeat(70));

  try {
    // Simular o mesAtual do frontend (inicializado com new Date())
    const mesAtual = new Date(); // Janeiro 2025
    console.log(`📅 mesAtual (frontend): ${mesAtual.toLocaleDateString('pt-BR')}`);
    console.log(`📅 Mês: ${mesAtual.getMonth()} (${mesAtual.getMonth() + 1})`);
    console.log(`📅 Ano: ${mesAtual.getFullYear()}`);
    console.log('');

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

    console.log(`📊 Total de lançamentos de Dilson: ${lancamentos.length}`);
    console.log('');

    // Simular o filtro do frontend
    const dadosUsuario = lancamentos.filter((item) => {
      // Usar a mesma lógica da formatDateSafe para evitar problemas de timezone
      const dateOnly = item.data_lancamento.split('T')[0];
      const [year, month, day] = dateOnly.split('-');
      const dataLancamento = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      
      const mesLancamento = dataLancamento.getMonth();
      const anoLancamento = dataLancamento.getFullYear();
      
      const passaFiltro = mesLancamento === mesAtual.getMonth() && anoLancamento === mesAtual.getFullYear();
      
      console.log(`📋 Lançamento ID ${item.id}:`);
      console.log(`   📅 Data: ${item.data_lancamento}`);
      console.log(`   📅 Data processada: ${dataLancamento.toLocaleDateString('pt-BR')}`);
      console.log(`   📅 Mês: ${mesLancamento} (${mesLancamento + 1})`);
      console.log(`   📅 Ano: ${anoLancamento}`);
      console.log(`   ✅ Passa filtro: ${passaFiltro ? 'SIM' : 'NÃO'}`);
      console.log('');
      
      return passaFiltro;
    });

    console.log('=' .repeat(70));
    console.log('📊 RESULTADO DO FILTRO:');
    console.log(`✅ Lançamentos que passam no filtro: ${dadosUsuario.length}`);
    console.log(`❌ Lançamentos filtrados: ${lancamentos.length - dadosUsuario.length}`);
    console.log('');
    
    console.log('🔍 COMPARAÇÃO COM DASHBOARD:');
    console.log('Dashboard mostra: 12 lançamentos');
    console.log(`Filtro simula: ${dadosUsuario.length} lançamentos`);
    
    if (dadosUsuario.length === 12) {
      console.log('✅ MATCH! O filtro de mês explica os 12 lançamentos.');
    } else if (dadosUsuario.length === 0) {
      console.log('❌ PROBLEMA ENCONTRADO! O filtro está removendo TODOS os lançamentos.');
      console.log('💡 SOLUÇÃO: O frontend precisa usar o mês correto (Agosto 2025) em vez de Janeiro 2025.');
    } else {
      console.log(`❌ MISMATCH! Esperado 12, encontrado ${dadosUsuario.length}`);
    }
    
    // Verificar qual mês deveria ser usado
    const mesesComLancamentos = new Set();
    lancamentos.forEach(item => {
      const dateOnly = item.data_lancamento.split('T')[0];
      const [year, month, day] = dateOnly.split('-');
      const dataLancamento = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      mesesComLancamentos.add(`${dataLancamento.getFullYear()}-${String(dataLancamento.getMonth() + 1).padStart(2, '0')}`);
    });
    
    console.log('');
    console.log('📅 MESES COM LANÇAMENTOS:');
    Array.from(mesesComLancamentos).sort().forEach(mes => {
      console.log(`   📅 ${mes}`);
    });
    
    // Testar com Agosto 2025
    console.log('');
    console.log('🧪 TESTANDO COM AGOSTO 2025:');
    const mesCorreto = new Date(2025, 7, 1); // Agosto 2025
    const dadosAgosto = lancamentos.filter((item) => {
      const dateOnly = item.data_lancamento.split('T')[0];
      const [year, month, day] = dateOnly.split('-');
      const dataLancamento = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      
      const mesLancamento = dataLancamento.getMonth();
      const anoLancamento = dataLancamento.getFullYear();
      
      return mesLancamento === mesCorreto.getMonth() && anoLancamento === mesCorreto.getFullYear();
    });
    
    console.log(`✅ Lançamentos em Agosto 2025: ${dadosAgosto.length}`);
    
    if (dadosAgosto.length === 12) {
      console.log('✅ PERFEITO! Com Agosto 2025 temos exatamente 12 lançamentos.');
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

debugMonthFilter();