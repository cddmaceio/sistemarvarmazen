require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugApiFrontend() {
  console.log('🔍 DEBUG - API Frontend vs Banco de Dados');
  console.log('=' .repeat(60));
  
  try {
    // 1. Verificar usuário específico
    console.log('\n1️⃣ Verificando usuário CPF 699.895.404-20...');
    const { data: usuario, error: userError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('cpf', '699.895.404-20')
      .single();
    
    if (userError || !usuario) {
      console.log('❌ Usuário não encontrado!');
      return;
    }
    
    console.log(`✅ Usuário: ${usuario.nome} (ID: ${usuario.id})`);
    
    // 2. Simular exatamente a chamada que o frontend faz
    console.log('\n2️⃣ Simulando chamada do frontend...');
    console.log(`🌐 Chamada: /api/lancamentos?user_id=${usuario.id}&status=aprovado`);
    
    // Simular a query que a API faz
    const { data: lancamentosAprovados, error: lancError } = await supabase
      .from('lancamentos_produtividade')
      .select('*')
      .eq('user_id', usuario.id)
      .eq('status', 'aprovado');
    
    if (lancError) {
      console.error('❌ Erro ao buscar lançamentos aprovados:', lancError);
      return;
    }
    
    console.log(`📊 Lançamentos aprovados encontrados: ${lancamentosAprovados?.length || 0}`);
    
    if (lancamentosAprovados && lancamentosAprovados.length > 0) {
      console.log('\n❌ PROBLEMA IDENTIFICADO: Ainda há lançamentos aprovados!');
      console.log('\n📋 DETALHES DOS LANÇAMENTOS:');
      lancamentosAprovados.forEach((lanc, idx) => {
        console.log(`   ${idx + 1}. ID: ${lanc.id}`);
        console.log(`      Data: ${lanc.data_lancamento}`);
        console.log(`      Status: ${lanc.status}`);
        console.log(`      Remuneração: R$ ${lanc.remuneracao_total}`);
        console.log(`      Atividade: ${lanc.nome_atividade}`);
        console.log(`      ---`);
      });
      
      // Verificar se são lançamentos antigos ou novos
      console.log('\n📅 ANÁLISE TEMPORAL:');
      const agora = new Date();
      lancamentosAprovados.forEach((lanc, idx) => {
        const dataLanc = new Date(lanc.data_lancamento);
        const diffDias = Math.floor((agora.getTime() - dataLanc.getTime()) / (1000 * 60 * 60 * 24));
        console.log(`   ${idx + 1}. ${lanc.data_lancamento} (${diffDias} dias atrás)`);
      });
      
    } else {
      console.log('✅ Nenhum lançamento aprovado encontrado (correto)');
    }
    
    // 3. Verificar todos os status para este usuário
    console.log('\n3️⃣ Verificando todos os lançamentos (qualquer status)...');
    const { data: todosLancamentos, error: todosError } = await supabase
      .from('lancamentos_produtividade')
      .select('*')
      .eq('user_id', usuario.id);
    
    if (todosError) {
      console.error('❌ Erro ao buscar todos os lançamentos:', todosError);
      return;
    }
    
    console.log(`📊 Total de lançamentos (todos os status): ${todosLancamentos?.length || 0}`);
    
    if (todosLancamentos && todosLancamentos.length > 0) {
      const statusCount = {};
      todosLancamentos.forEach(lanc => {
        statusCount[lanc.status] = (statusCount[lanc.status] || 0) + 1;
      });
      
      console.log('\n📊 Contagem por status:');
      Object.keys(statusCount).forEach(status => {
        console.log(`   ${status}: ${statusCount[status]}`);
      });
    }
    
    // 4. Verificar se há cache ou dados em outras tabelas
    console.log('\n4️⃣ Verificando possíveis fontes de cache...');
    
    // Verificar atividades_produtividade
    const { data: atividades, error: ativError } = await supabase
      .from('atividades_produtividade')
      .select('*')
      .eq('user_id', usuario.id);
    
    console.log(`📊 Registros em atividades_produtividade: ${atividades?.length || 0}`);
    
    // Verificar kpis_produtividade
    const { data: kpis, error: kpisError } = await supabase
      .from('kpis_produtividade')
      .select('*')
      .eq('user_id', usuario.id);
    
    console.log(`📊 Registros em kpis_produtividade: ${kpis?.length || 0}`);
    
    // 5. Testar a API real via HTTP
    console.log('\n5️⃣ Testando API real via HTTP...');
    
    try {
      // Simular uma chamada HTTP real
      const apiUrl = `http://localhost:5173/api/lancamentos?user_id=${usuario.id}&status=aprovado`;
      console.log(`🌐 Testando: ${apiUrl}`);
      
      const response = await fetch(apiUrl);
      
      if (response.ok) {
        const apiData = await response.json();
        console.log(`📊 API retornou: ${apiData?.length || 0} lançamentos`);
        
        if (apiData && apiData.length > 0) {
          console.log('\n❌ CONFIRMADO: API está retornando dados!');
          console.log('\n📋 PRIMEIROS 3 REGISTROS DA API:');
          apiData.slice(0, 3).forEach((item, idx) => {
            console.log(`   ${idx + 1}. ID: ${item.id}, Data: ${item.data_lancamento}, Valor: R$ ${item.remuneracao_total}`);
          });
        } else {
          console.log('✅ API retornou array vazio (correto)');
        }
      } else {
        console.log(`❌ Erro na API: ${response.status} ${response.statusText}`);
      }
    } catch (fetchError) {
      console.log('⚠️  Não foi possível testar a API via HTTP (servidor pode estar offline)');
      console.log('   Isso é normal se o servidor não estiver rodando');
    }
    
    // 6. Resultado final
    console.log('\n6️⃣ DIAGNÓSTICO FINAL:');
    
    if (lancamentosAprovados && lancamentosAprovados.length > 0) {
      console.log('\n🚨 PROBLEMA CONFIRMADO:');
      console.log('   ❌ Banco de dados ainda contém lançamentos aprovados');
      console.log('   ❌ Frontend está correto ao mostrar os dados');
      console.log('   ❌ A limpeza anterior não foi completa');
      
      console.log('\n🔧 AÇÃO NECESSÁRIA:');
      console.log('   1. Deletar todos os lançamentos restantes');
      console.log('   2. Verificar se há triggers ou procedures que recriam dados');
      console.log('   3. Confirmar que não há cache no Supabase');
      
    } else {
      console.log('\n✅ BANCO LIMPO:');
      console.log('   ✅ Nenhum lançamento aprovado no banco');
      console.log('   ❓ Frontend pode estar usando cache local');
      console.log('   ❓ Ou há problema na API/worker');
    }
    
  } catch (error) {
    console.error('❌ Erro durante o debug:', error);
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log('🏁 Debug da API frontend concluído!');
}

// Executar debug
debugApiFrontend().catch(console.error);