const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyDataIntegrity() {
  try {
    console.log('\n=== VERIFICAÇÃO DE INTEGRIDADE DOS DADOS ===\n');

    // Verificar se há dados de teste específicos que somam R$ 157,78
    console.log('\n--- VERIFICANDO DADOS DE TESTE QUE SOMAM R$ 157,78 ---');
    const { data: testData, error: testError } = await supabase
      .from('lancamentos_produtividade')
      .select('*')
      .eq('status', 'aprovado')
      .order('created_at', { ascending: false });

    if (testError) {
      console.error('Erro ao buscar dados de teste:', testError);
    } else {
      console.log(`Total de lançamentos aprovados encontrados: ${testData?.length || 0}`);
      
      if (testData && testData.length > 0) {
        console.log('\nDetalhes dos lançamentos aprovados:');
        let totalSum = 0;
        testData.forEach((lancamento, index) => {
          console.log(`${index + 1}. ID: ${lancamento.id}, User: ${lancamento.user_id}, Data: ${lancamento.data_lancamento}, Valor: R$ ${lancamento.remuneracao_total}`);
          totalSum += parseFloat(lancamento.remuneracao_total || 0);
        });
        console.log(`\nSoma total de todos os lançamentos aprovados: R$ ${totalSum.toFixed(2)}`);
        
        // Verificar se algum subconjunto soma R$ 157,78
        console.log('\n--- VERIFICANDO COMBINAÇÕES QUE SOMAM R$ 157,78 ---');
        const targetValue = 157.78;
        const values = testData.map(l => parseFloat(l.remuneracao_total || 0));
        
        // Verificar se há exatamente 12 lançamentos que somam 157.78
        if (testData.length >= 12) {
          const first12 = values.slice(0, 12);
          const sum12 = first12.reduce((sum, val) => sum + val, 0);
          console.log(`Soma dos primeiros 12 lançamentos: R$ ${sum12.toFixed(2)}`);
          
          if (Math.abs(sum12 - targetValue) < 0.01) {
            console.log('✅ ENCONTRADO! Os primeiros 12 lançamentos somam exatamente R$ 157,78');
            console.log('Valores individuais:', first12.map(v => `R$ ${v.toFixed(2)}`).join(', '));
          }
        }
      }
    }

    console.log('🔍 Verificando integridade dos dados...');
    
    // Primeiro, buscar todos os usuários para identificar IDs
    const { data: usuarios, error: errorUsuarios } = await supabase
      .from('usuarios')
      .select('id, nome, cpf, funcao')
      .order('id');

    if (errorUsuarios) {
      console.error('❌ Erro ao buscar usuários:', errorUsuarios);
      return;
    }

    console.log('\n👥 Usuários cadastrados:');
    usuarios.forEach(user => {
      console.log(`  ID: ${user.id}, Nome: ${user.nome}, CPF: ${user.cpf}, Função: ${user.funcao}`);
    });
    
    // Buscar TODOS os lançamentos sem filtro de status
    const { data: todosLancamentos, error: errorTodos } = await supabase
      .from('lancamentos_produtividade')
      .select('*')
      .gte('data_lancamento', '2025-08-01')
      .lt('data_lancamento', '2025-09-01')
      .order('data_lancamento', { ascending: true });

    if (errorTodos) {
      console.error('❌ Erro ao buscar todos os lançamentos:', errorTodos);
      return;
    }

    console.log(`\n📊 Total de lançamentos em agosto 2025 (todos): ${todosLancamentos.length}`);
    
    // Agrupar por status
    const porStatus = {};
    todosLancamentos.forEach(l => {
      if (!porStatus[l.status]) {
        porStatus[l.status] = [];
      }
      porStatus[l.status].push(l);
    });
    
    console.log('\n📋 Lançamentos por status:');
    Object.keys(porStatus).forEach(status => {
      console.log(`  ${status}: ${porStatus[status].length} lançamentos`);
    });
    
    // Buscar apenas os aprovados
    const { data: lancamentos, error } = await supabase
      .from('lancamentos_produtividade')
      .select('*')
      .gte('data_lancamento', '2025-08-01')
      .lt('data_lancamento', '2025-09-01')
      .eq('status', 'aprovado')
      .order('data_lancamento', { ascending: true });

    if (error) {
      console.error('❌ Erro ao buscar lançamentos:', error);
      return;
    }

    console.log(`\n📊 Total de lançamentos aprovados em agosto 2025: ${lancamentos.length}`);
    
    // Verificar duplicatas por ID
    const ids = lancamentos.map(l => l.id);
    const idsUnicos = [...new Set(ids)];
    
    if (ids.length !== idsUnicos.length) {
      console.log('⚠️  DUPLICATAS ENCONTRADAS!');
      const duplicatas = ids.filter((id, index) => ids.indexOf(id) !== index);
      console.log('IDs duplicados:', duplicatas);
    } else {
      console.log('✅ Nenhuma duplicata por ID encontrada');
    }
    
    // Verificar duplicatas por data + usuário
    const combinacoes = lancamentos.map(l => `${l.data_lancamento}_${l.user_id}`);
    const combinacoesUnicas = [...new Set(combinacoes)];
    
    if (combinacoes.length !== combinacoesUnicas.length) {
      console.log('⚠️  DUPLICATAS POR DATA+USUÁRIO ENCONTRADAS!');
      const duplicatasCombinacao = combinacoes.filter((combo, index) => combinacoes.indexOf(combo) !== index);
      console.log('Combinações duplicadas:', duplicatasCombinacao);
    } else {
      console.log('✅ Nenhuma duplicata por data+usuário encontrada');
    }
    
    // Agrupar por usuário
    const porUsuario = {};
    lancamentos.forEach(l => {
      if (!porUsuario[l.user_id]) {
        porUsuario[l.user_id] = [];
      }
      porUsuario[l.user_id].push(l);
    });
    
    console.log('\n👥 Lançamentos por usuário:');
    Object.keys(porUsuario).forEach(userId => {
      const userLancamentos = porUsuario[userId];
      const total = userLancamentos.reduce((sum, l) => sum + (l.remuneracao_total || 0), 0);
      const usuario = usuarios.find(u => u.id == userId);
      const nomeUsuario = usuario ? `${usuario.nome} (${usuario.funcao})` : `ID ${userId}`;
      console.log(`${nomeUsuario}: ${userLancamentos.length} lançamentos, Total: R$ ${total.toFixed(2)}`);
      
      // Mostrar detalhes se for o usuário com problema
      if (Math.abs(total - 157.78) < 0.01) {
        console.log('\n🎯 USUÁRIO COM VALOR R$ 157,78 ENCONTRADO!');
        console.log('Detalhes dos lançamentos:');
        userLancamentos.forEach((l, index) => {
          console.log(`  ${index + 1}. ID: ${l.id}, Data: ${l.data_lancamento}, Valor: R$ ${l.remuneracao_total}`);
          console.log(`     Subtotal: R$ ${l.subtotal_atividades}, Bônus: R$ ${l.bonus_kpis}, Adicional: R$ ${l.input_adicional}`);
        });
        
        // Verificar se há padrões suspeitos
        const datas = userLancamentos.map(l => l.data_lancamento);
        const datasUnicas = [...new Set(datas)];
        if (datas.length !== datasUnicas.length) {
          console.log('⚠️  MÚLTIPLOS LANÇAMENTOS NA MESMA DATA!');
          const datasDuplicadas = datas.filter((data, index) => datas.indexOf(data) !== index);
          console.log('Datas com múltiplos lançamentos:', [...new Set(datasDuplicadas)]);
        }
      }
    });
    
    // Buscar lançamentos de cada operador de empilhadeira especificamente
    console.log('\n🔍 Verificando lançamentos por operador de empilhadeira:');
    const operadores = usuarios.filter(u => u.funcao === 'Operador de Empilhadeira');
    
    for (const operador of operadores) {
      const { data: lancamentosOperador, error: errorOperador } = await supabase
        .from('lancamentos_produtividade')
        .select('*')
        .eq('user_id', operador.id)
        .gte('data_lancamento', '2025-08-01')
        .lt('data_lancamento', '2025-09-01')
        .order('data_lancamento', { ascending: true });
        
      if (errorOperador) {
        console.log(`❌ Erro ao buscar lançamentos do operador ${operador.nome}:`, errorOperador);
        continue;
      }
      
      const totalOperador = lancamentosOperador.reduce((sum, l) => sum + (l.remuneracao_total || 0), 0);
      console.log(`\n${operador.nome} (ID: ${operador.id}):`);
      console.log(`  Total de lançamentos: ${lancamentosOperador.length}`);
      console.log(`  Total ganho: R$ ${totalOperador.toFixed(2)}`);
      
      if (Math.abs(totalOperador - 157.78) < 0.01) {
        console.log('  🎯 ESTE É O USUÁRIO COM R$ 157,78!');
        console.log('  Detalhes dos lançamentos:');
        lancamentosOperador.forEach((l, index) => {
          console.log(`    ${index + 1}. ID: ${l.id}, Data: ${l.data_lancamento}, Status: ${l.status}`);
          console.log(`       Remuneração: R$ ${l.remuneracao_total}, Subtotal: R$ ${l.subtotal_atividades}`);
          console.log(`       Bônus: R$ ${l.bonus_kpis}, Adicional: R$ ${l.input_adicional}`);
        });
      }
    }
    
    // Verificar valores suspeitos
    console.log('\n🔍 Análise de valores:');
    const valores = lancamentos.map(l => l.remuneracao_total).filter(v => v > 0);
    const valorMin = Math.min(...valores);
    const valorMax = Math.max(...valores);
    const valorMedio = valores.reduce((sum, v) => sum + v, 0) / valores.length;
    
    console.log(`Valor mínimo: R$ ${valorMin.toFixed(2)}`);
    console.log(`Valor máximo: R$ ${valorMax.toFixed(2)}`);
    console.log(`Valor médio: R$ ${valorMedio.toFixed(2)}`);
    
    // Valores muito altos ou baixos
    const valoresAltos = valores.filter(v => v > valorMedio * 2);
    const valoresBaixos = valores.filter(v => v < valorMedio * 0.5);
    
    if (valoresAltos.length > 0) {
      console.log(`⚠️  ${valoresAltos.length} valores acima de 2x a média:`, valoresAltos.map(v => `R$ ${v.toFixed(2)}`));
    }
    
    if (valoresBaixos.length > 0) {
      console.log(`⚠️  ${valoresBaixos.length} valores abaixo de 0.5x a média:`, valoresBaixos.map(v => `R$ ${v.toFixed(2)}`));
    }
    
  } catch (error) {
    console.error('❌ Erro na verificação:', error);
  }
}

verifyDataIntegrity();