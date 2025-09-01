// Script para limpar todos os lançamentos do usuário específico
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas!');
  process.exit(1);
}

const CPF_USUARIO = '699.895.404-20';

async function limparLancamentosUsuario() {
  console.log('🧹 LIMPEZA DE LANÇAMENTOS - USUÁRIO TESTE');
  console.log('===============================================\n');

  try {
    // 1. Buscar o usuário pelo CPF
    console.log('1. 🔍 Buscando usuário...');
    const userResponse = await fetch(`${SUPABASE_URL}/rest/v1/usuarios?cpf=eq.${CPF_USUARIO}`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!userResponse.ok) {
      throw new Error(`Erro ao buscar usuário: ${userResponse.status}`);
    }

    const users = await userResponse.json();
    if (users.length === 0) {
      console.log('❌ Usuário não encontrado!');
      return;
    }

    const user = users[0];
    console.log(`✅ Usuário encontrado: ${user.nome} (ID: ${user.id})`);

    // 2. Buscar todos os lançamentos do usuário
    console.log('\n2. 📋 Buscando lançamentos existentes...');
    const lancamentosResponse = await fetch(`${SUPABASE_URL}/rest/v1/lancamentos_produtividade?user_id=eq.${user.id}`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!lancamentosResponse.ok) {
      throw new Error(`Erro ao buscar lançamentos: ${lancamentosResponse.status}`);
    }

    const lancamentos = await lancamentosResponse.json();
    console.log(`📊 Total de lançamentos encontrados: ${lancamentos.length}`);

    if (lancamentos.length === 0) {
      console.log('✅ Nenhum lançamento para limpar!');
      return;
    }

    // 3. Mostrar resumo dos lançamentos
    console.log('\n📋 Resumo dos lançamentos:');
    const statusCount = {};
    const dateCount = {};
    
    lancamentos.forEach(l => {
      statusCount[l.status] = (statusCount[l.status] || 0) + 1;
      const date = new Date(l.data_lancamento).toLocaleDateString('pt-BR');
      dateCount[date] = (dateCount[date] || 0) + 1;
    });

    console.log('   Por status:');
    Object.entries(statusCount).forEach(([status, count]) => {
      console.log(`     - ${status}: ${count}`);
    });

    console.log('   Por data (primeiras 10):');
    Object.entries(dateCount).slice(0, 10).forEach(([date, count]) => {
      console.log(`     - ${date}: ${count}`);
    });

    // 4. Confirmar limpeza
    console.log('\n⚠️  ATENÇÃO: Esta operação irá DELETAR TODOS os lançamentos!');
    console.log('   Isso liberará todas as datas para novos testes.');
    
    // 5. Deletar todos os lançamentos
    console.log('\n3. 🗑️  Deletando lançamentos...');
    const deleteResponse = await fetch(`${SUPABASE_URL}/rest/v1/lancamentos_produtividade?user_id=eq.${user.id}`, {
      method: 'DELETE',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!deleteResponse.ok) {
      throw new Error(`Erro ao deletar lançamentos: ${deleteResponse.status}`);
    }

    console.log('✅ Lançamentos deletados com sucesso!');

    // 6. Verificar se a limpeza foi efetiva
    console.log('\n4. ✅ Verificando limpeza...');
    const verifyResponse = await fetch(`${SUPABASE_URL}/rest/v1/lancamentos_produtividade?user_id=eq.${user.id}`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const remainingLancamentos = await verifyResponse.json();
    console.log(`📊 Lançamentos restantes: ${remainingLancamentos.length}`);

    // 7. Testar uma data específica
    console.log('\n5. 🧪 Testando disponibilidade da data 19/08/2025...');
    const testDate = '2025-08-19';
    const checkLimitResponse = await fetch('http://localhost:8888/api/kpis/check-limit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user_id: user.id,
        data_lancamento: testDate
      })
    });

    if (checkLimitResponse.ok) {
      const limitResult = await checkLimitResponse.json();
      console.log(`✅ Check-limit para ${testDate}: ${limitResult.available ? 'DISPONÍVEL' : 'BLOQUEADO'}`);
      if (!limitResult.available) {
        console.log(`   Motivo: ${limitResult.message}`);
      }
    } else {
      console.log(`❌ Erro ao testar check-limit: ${checkLimitResponse.status}`);
    }

    console.log('\n🎯 LIMPEZA CONCLUÍDA!');
    console.log('===============================================');
    console.log('✅ Todos os lançamentos foram removidos');
    console.log('✅ Datas estão disponíveis para novos testes');
    console.log('✅ Sistema pronto para testes limpos');

  } catch (error) {
    console.error('❌ Erro durante a limpeza:', error.message);
    process.exit(1);
  }
}

// Executar a limpeza
limparLancamentosUsuario();