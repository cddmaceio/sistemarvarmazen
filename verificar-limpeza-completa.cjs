// Script para verificar se a limpeza foi efetiva e as datas estão disponíveis
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas!');
  process.exit(1);
}

const CPF_USUARIO = '699.895.404-20';

async function verificarLimpeza() {
  console.log('🔍 VERIFICAÇÃO PÓS-LIMPEZA');
  console.log('===============================\n');

  try {
    // 1. Buscar o usuário
    console.log('1. 👤 Verificando usuário...');
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

    // 2. Verificar se não há lançamentos
    console.log('\n2. 📋 Verificando lançamentos no banco...');
    const lancamentosResponse = await fetch(`${SUPABASE_URL}/rest/v1/lancamentos_produtividade?user_id=eq.${user.id}`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const lancamentos = await lancamentosResponse.json();
    console.log(`📊 Lançamentos encontrados: ${lancamentos.length}`);
    
    if (lancamentos.length === 0) {
      console.log('✅ Banco limpo - nenhum lançamento encontrado!');
    } else {
      console.log('❌ Ainda existem lançamentos:');
      lancamentos.forEach(l => {
        const date = new Date(l.data_lancamento).toLocaleDateString('pt-BR');
        console.log(`   - ID ${l.id}: ${date} (${l.status})`);
      });
    }

    // 3. Testar várias datas com check-limit
    console.log('\n3. 🧪 Testando disponibilidade de datas...');
    const datasParaTestar = [
      '2025-08-19',
      '2025-08-20',
      '2025-08-21',
      '2025-08-25',
      '2025-09-01'
    ];

    for (const data of datasParaTestar) {
      try {
        const checkResponse = await fetch('http://localhost:8888/api/kpis/check-limit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            user_id: user.id,
            data_lancamento: data
          })
        });

        if (checkResponse.ok) {
          const result = await checkResponse.json();
          const dataFormatada = new Date(data).toLocaleDateString('pt-BR');
          const status = result.available ? '✅ DISPONÍVEL' : '❌ BLOQUEADO';
          console.log(`   ${dataFormatada}: ${status}`);
          
          if (!result.available && result.message) {
            console.log(`      Motivo: ${result.message}`);
          }
        } else {
          console.log(`   ${data}: ❌ Erro na verificação (${checkResponse.status})`);
        }
      } catch (error) {
        console.log(`   ${data}: ❌ Erro: ${error.message}`);
      }
    }

    // 4. Testar criação de um novo lançamento
    console.log('\n4. 🧪 Testando criação de novo lançamento...');
    
    // Primeiro, buscar atividades e KPIs
    const activitiesResponse = await fetch('http://localhost:8888/api/activities', {
      headers: { 'Content-Type': 'application/json' }
    });
    const activities = await activitiesResponse.json();
    
    const kpisResponse = await fetch('http://localhost:8888/api/kpis', {
      headers: { 'Content-Type': 'application/json' }
    });
    const kpis = await kpisResponse.json();

    if (activities.length > 0 && kpis.length > 0) {
      // Testar calculadora
      const calculatorData = {
        funcao: user.funcao,
        turno: 'Manhã',
        multiple_activities: [{
          activity_id: activities[0].id,
          quantidade: 100
        }],
        nome_operador: user.nome,
        kpis_atingidos: [kpis[0].nome, kpis[1]?.nome].filter(Boolean)
      };

      const calcResponse = await fetch('http://localhost:8888/api/calculator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(calculatorData)
      });

      if (calcResponse.ok) {
        const calcResult = await calcResponse.json();
        console.log('✅ Calculadora funcionando');
        console.log(`   Total calculado: R$ ${calcResult.total || 'N/A'}`);

        // Tentar criar lançamento
        const lancamentoData = {
          user_id: user.id,
          data_lancamento: '2025-08-19',
          calculator_data: calculatorData,
          calculator_result: calcResult
        };

        const lancamentoResponse = await fetch('http://localhost:8888/api/lancamentos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(lancamentoData)
        });

        if (lancamentoResponse.ok) {
          const novoLancamento = await lancamentoResponse.json();
          console.log('✅ Novo lançamento criado com sucesso!');
          console.log(`   ID: ${novoLancamento.id}`);
          console.log(`   Status: ${novoLancamento.status}`);
        } else {
          const error = await lancamentoResponse.text();
          console.log(`❌ Erro ao criar lançamento: ${lancamentoResponse.status}`);
          console.log(`   Detalhes: ${error}`);
        }
      } else {
        console.log('❌ Erro na calculadora');
      }
    } else {
      console.log('❌ Não foi possível obter atividades ou KPIs para teste');
    }

    console.log('\n🎯 VERIFICAÇÃO CONCLUÍDA!');
    console.log('===============================');
    
  } catch (error) {
    console.error('❌ Erro durante verificação:', error.message);
  }
}

// Executar verificação
verificarLimpeza();