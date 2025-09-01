// Script para debugar por que o check-limit ainda está bloqueando após limpeza
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas!');
  process.exit(1);
}

const CPF_USUARIO = '699.895.404-20';

async function debugCheckLimit() {
  console.log('🔍 DEBUG CHECK-LIMIT PÓS-LIMPEZA');
  console.log('=====================================\n');

  try {
    // 1. Buscar o usuário
    console.log('1. 👤 Buscando usuário...');
    const userResponse = await fetch(`${SUPABASE_URL}/rest/v1/usuarios?cpf=eq.${CPF_USUARIO}`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const users = await userResponse.json();
    const user = users[0];
    console.log(`✅ Usuário: ${user.nome} (ID: ${user.id})`);

    // 2. Verificar lançamentos diretamente no banco
    console.log('\n2. 🔍 Verificando lançamentos no banco (todas as consultas possíveis)...');
    
    // Consulta 1: Por user_id
    const lancamentos1 = await fetch(`${SUPABASE_URL}/rest/v1/lancamentos_produtividade?user_id=eq.${user.id}`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    const result1 = await lancamentos1.json();
    console.log(`   Por user_id (${user.id}): ${result1.length} lançamentos`);

    // Consulta 2: Por data específica
    const dataTest = '2025-08-19';
    const lancamentos2 = await fetch(`${SUPABASE_URL}/rest/v1/lancamentos_produtividade?data_lancamento=eq.${dataTest}`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    const result2 = await lancamentos2.json();
    console.log(`   Por data (${dataTest}): ${result2.length} lançamentos`);

    // Consulta 3: Combinação user_id + data
    const lancamentos3 = await fetch(`${SUPABASE_URL}/rest/v1/lancamentos_produtividade?user_id=eq.${user.id}&data_lancamento=eq.${dataTest}`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    const result3 = await lancamentos3.json();
    console.log(`   Por user_id + data: ${result3.length} lançamentos`);

    // Consulta 4: Todos os lançamentos (limitado)
    const lancamentos4 = await fetch(`${SUPABASE_URL}/rest/v1/lancamentos_produtividade?limit=10`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    const result4 = await lancamentos4.json();
    console.log(`   Todos (limitado a 10): ${result4.length} lançamentos`);
    
    if (result4.length > 0) {
      console.log('   Primeiros lançamentos encontrados:');
      result4.slice(0, 3).forEach(l => {
        const date = new Date(l.data_lancamento).toLocaleDateString('pt-BR');
        console.log(`     - ID ${l.id}: User ${l.user_id}, ${date}, ${l.status}`);
      });
    }

    // 3. Testar as rotas da API
    console.log('\n3. 🧪 Testando rotas da API...');
    
    // Testar rota de atividades
    console.log('   3.1. Testando /api/activities...');
    try {
      const activitiesResponse = await fetch('http://localhost:8888/api/activities', {
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (activitiesResponse.ok) {
        const activities = await activitiesResponse.json();
        console.log(`   ✅ Atividades: ${activities.length} encontradas`);
        if (activities.length > 0) {
          console.log(`      Primeira: ${activities[0].nome || activities[0].name || 'Nome não definido'}`);
        }
      } else {
        console.log(`   ❌ Erro: ${activitiesResponse.status}`);
        const errorText = await activitiesResponse.text();
        console.log(`      Detalhes: ${errorText.substring(0, 200)}`);
      }
    } catch (error) {
      console.log(`   ❌ Erro de conexão: ${error.message}`);
    }

    // Testar rota de KPIs
    console.log('   3.2. Testando /api/kpis...');
    try {
      const kpisResponse = await fetch('http://localhost:8888/api/kpis', {
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (kpisResponse.ok) {
        const kpis = await kpisResponse.json();
        console.log(`   ✅ KPIs: ${kpis.length} encontrados`);
        if (kpis.length > 0) {
          console.log(`      Primeiro: ${kpis[0].nome || kpis[0].name || 'Nome não definido'}`);
        }
      } else {
        console.log(`   ❌ Erro: ${kpisResponse.status}`);
        const errorText = await kpisResponse.text();
        console.log(`      Detalhes: ${errorText.substring(0, 200)}`);
      }
    } catch (error) {
      console.log(`   ❌ Erro de conexão: ${error.message}`);
    }

    // 4. Testar check-limit com detalhes
    console.log('\n4. 🔍 Analisando check-limit detalhadamente...');
    try {
      const checkResponse = await fetch('http://localhost:8888/api/kpis/check-limit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: user.id,
          data_lancamento: dataTest
        })
      });

      console.log(`   Status da resposta: ${checkResponse.status}`);
      
      if (checkResponse.ok) {
        const result = await checkResponse.json();
        console.log('   Resposta completa:', JSON.stringify(result, null, 2));
      } else {
        const errorText = await checkResponse.text();
        console.log(`   Erro: ${errorText}`);
      }
    } catch (error) {
      console.log(`   ❌ Erro de conexão: ${error.message}`);
    }

    // 5. Verificar se o servidor está rodando
    console.log('\n5. 🌐 Verificando status do servidor...');
    try {
      const healthResponse = await fetch('http://localhost:8888/api/health', {
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (healthResponse.ok) {
        const health = await healthResponse.json();
        console.log('   ✅ Servidor funcionando');
        console.log('   Status:', JSON.stringify(health, null, 2));
      } else {
        console.log(`   ❌ Health check falhou: ${healthResponse.status}`);
      }
    } catch (error) {
      console.log(`   ❌ Servidor não responde: ${error.message}`);
    }

    console.log('\n🎯 DEBUG CONCLUÍDO!');
    console.log('=====================================');
    
  } catch (error) {
    console.error('❌ Erro durante debug:', error.message);
  }
}

// Executar debug
debugCheckLimit();