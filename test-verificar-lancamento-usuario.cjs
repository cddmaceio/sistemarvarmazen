// Script para verificar lançamentos do usuário CPF 699.895.404-20 na data 19/08/2025
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verificarLancamentoUsuario() {
  console.log('🔍 VERIFICAÇÃO: Lançamentos do usuário CPF 699.895.404-20');
  console.log('=' .repeat(70));
  
  const cpfUsuario = '699.895.404-20';
  const dataLancamento = '2025-08-19';
  
  try {
    // 1. Primeiro, encontrar o usuário pelo CPF
    console.log('\n1. 👤 Buscando usuário pelo CPF...');
    const { data: usuarios, error: errorUsuario } = await supabase
      .from('usuarios')
      .select('*')
      .eq('cpf', cpfUsuario);
    
    if (errorUsuario) {
      console.error('❌ Erro ao buscar usuário:', errorUsuario);
      return;
    }
    
    if (!usuarios || usuarios.length === 0) {
      console.log('❌ Usuário não encontrado com CPF:', cpfUsuario);
      
      // Tentar buscar com diferentes formatos de CPF
      console.log('\n🔄 Tentando diferentes formatos de CPF...');
      const cpfSemFormatacao = cpfUsuario.replace(/[.-]/g, '');
      
      const { data: usuariosSemFormatacao, error: errorSemFormatacao } = await supabase
        .from('usuarios')
        .select('*')
        .eq('cpf', cpfSemFormatacao);
      
      if (usuariosSemFormatacao && usuariosSemFormatacao.length > 0) {
        console.log('✅ Usuário encontrado com CPF sem formatação:', cpfSemFormatacao);
        usuarios.push(...usuariosSemFormatacao);
      } else {
        console.log('❌ Usuário não encontrado em nenhum formato');
        return;
      }
    }
    
    const usuario = usuarios[0];
    console.log('✅ Usuário encontrado:');
    console.log(`   - ID: ${usuario.id}`);
    console.log(`   - Nome: ${usuario.nome}`);
    console.log(`   - CPF: ${usuario.cpf}`);
    console.log(`   - Data Nascimento: ${usuario.data_nascimento}`);
    console.log(`   - Status: ${usuario.status_usuario || 'N/A'}`);
    console.log(`   - Ativo: ${usuario.is_active}`);
    console.log(`   - Função: ${usuario.funcao}`);
    
    // 2. Buscar todos os lançamentos deste usuário para a data específica
    console.log('\n2. 📋 Buscando lançamentos para a data 19/08/2025...');
    const { data: lancamentos, error: errorLancamentos } = await supabase
      .from('lancamentos_produtividade')
      .select('*')
      .eq('user_id', usuario.id)
      .eq('data_lancamento', dataLancamento)
      .order('created_at', { ascending: false });
    
    if (errorLancamentos) {
      console.error('❌ Erro ao buscar lançamentos:', errorLancamentos);
      return;
    }
    
    console.log(`📊 Total de lançamentos encontrados: ${lancamentos.length}`);
    
    if (lancamentos.length === 0) {
      console.log('✅ Nenhum lançamento encontrado para esta data!');
      console.log('✅ A data 19/08/2025 está LIVRE para lançamento!');
    } else {
      console.log('\n📋 Detalhes dos lançamentos encontrados:');
      lancamentos.forEach((lancamento, index) => {
        console.log(`\n   Lançamento ${index + 1}:`);
        console.log(`   - ID: ${lancamento.id}`);
        console.log(`   - Status: ${lancamento.status}`);
        console.log(`   - Data Lançamento: ${lancamento.data_lancamento}`);
        console.log(`   - Usuário: ${lancamento.user_nome} (${lancamento.user_cpf})`);
        console.log(`   - Função: ${lancamento.funcao}`);
        console.log(`   - Atividade: ${lancamento.nome_atividade}`);
        console.log(`   - KPI: ${lancamento.nome_kpi}`);
        console.log(`   - Remuneração: R$ ${lancamento.remuneracao_total}`);
        console.log(`   - Criado em: ${lancamento.created_at}`);
        console.log(`   - Atualizado em: ${lancamento.updated_at}`);
        
        if (lancamento.aprovado_por) {
          console.log(`   - Aprovado por: ${lancamento.aprovado_por_nome} (ID: ${lancamento.aprovado_por})`);
          console.log(`   - Data aprovação: ${lancamento.data_aprovacao}`);
        }
        
        if (lancamento.reprovado_por) {
          console.log(`   - Reprovado por: ${lancamento.reprovado_por_nome} (ID: ${lancamento.reprovado_por})`);
          console.log(`   - Data reprovação: ${lancamento.data_reprovacao}`);
          console.log(`   - Motivo reprovação: ${lancamento.motivo_reprovacao}`);
        }
      });
      
      // Verificar status dos lançamentos
      const statusCount = {};
      lancamentos.forEach(l => {
        statusCount[l.status] = (statusCount[l.status] || 0) + 1;
      });
      
      console.log('\n📊 Resumo por status:');
      Object.keys(statusCount).forEach(status => {
        console.log(`   - ${status}: ${statusCount[status]} lançamento(s)`);
      });
      
      // Verificar se há lançamentos não reprovados
      const naoReprovados = lancamentos.filter(l => l.status !== 'reprovado');
      if (naoReprovados.length > 0) {
        console.log('\n⚠️  ATENÇÃO: Existem lançamentos NÃO REPROVADOS para esta data!');
        console.log('   Isso pode estar causando o conflito no calendário.');
      } else {
        console.log('\n✅ Todos os lançamentos estão REPROVADOS.');
        console.log('   A data deveria estar livre no calendário.');
      }
    }
    
    // 3. Testar a rota check-limit para este usuário e data
    console.log('\n3. 🔍 Testando rota check-limit...');
    try {
      const { default: fetch } = await import('node-fetch');
      
      const checkResponse = await fetch('http://localhost:8888/api/kpis/check-limit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: usuario.id,
          data_lancamento: dataLancamento
        })
      });
      
      if (checkResponse.ok) {
        const checkResult = await checkResponse.json();
        console.log('✅ Rota check-limit respondeu:');
        console.log(`   - Limite atingido: ${checkResult.limitReached}`);
        console.log(`   - Mensagem: ${checkResult.message || 'N/A'}`);
        
        if (checkResult.limitReached) {
          console.log('\n⚠️  A rota check-limit indica que JÁ EXISTE lançamento!');
        } else {
          console.log('\n✅ A rota check-limit indica que a data está LIVRE!');
        }
      } else {
        console.log(`❌ Erro na rota check-limit: ${checkResponse.status}`);
        const errorText = await checkResponse.text();
        console.log(`   Resposta: ${errorText}`);
      }
    } catch (fetchError) {
      console.log('❌ Erro ao testar rota check-limit:', fetchError.message);
      console.log('   (Verifique se o servidor está rodando)');
    }
    
    // 4. Buscar lançamentos em todo o mês de agosto para contexto
    console.log('\n4. 📅 Contexto: Lançamentos do usuário em agosto 2025...');
    const { data: lancamentosAgosto, error: errorAgosto } = await supabase
      .from('lancamentos_produtividade')
      .select('data_lancamento, status, nome_atividade, remuneracao_total')
      .eq('user_id', usuario.id)
      .gte('data_lancamento', '2025-08-01')
      .lt('data_lancamento', '2025-09-01')
      .order('data_lancamento', { ascending: true });
    
    if (lancamentosAgosto && lancamentosAgosto.length > 0) {
      console.log(`📊 Total de lançamentos em agosto: ${lancamentosAgosto.length}`);
      
      const porStatus = {};
      lancamentosAgosto.forEach(l => {
        porStatus[l.status] = (porStatus[l.status] || 0) + 1;
      });
      
      console.log('📋 Resumo por status em agosto:');
      Object.keys(porStatus).forEach(status => {
        console.log(`   - ${status}: ${porStatus[status]} lançamento(s)`);
      });
      
      // Mostrar algumas datas próximas
      const datasProximas = lancamentosAgosto
        .filter(l => l.data_lancamento >= '2025-08-15' && l.data_lancamento <= '2025-08-25')
        .slice(0, 5);
      
      if (datasProximas.length > 0) {
        console.log('\n📅 Lançamentos próximos à data 19/08:');
        datasProximas.forEach(l => {
          console.log(`   - ${l.data_lancamento}: ${l.status} - ${l.nome_atividade} (R$ ${l.remuneracao_total})`);
        });
      }
    } else {
      console.log('📊 Nenhum lançamento encontrado em agosto 2025');
    }
    
    console.log('\n🎯 CONCLUSÃO:');
    console.log('=' .repeat(50));
    
    if (lancamentos.length === 0) {
      console.log('✅ A data 19/08/2025 está COMPLETAMENTE LIVRE');
      console.log('✅ Não há conflitos no banco de dados');
      console.log('💡 Se o calendário mostra ocupado, pode ser um problema de cache ou frontend');
    } else {
      const naoReprovados = lancamentos.filter(l => l.status !== 'reprovado');
      if (naoReprovados.length > 0) {
        console.log('⚠️  Existem lançamentos ATIVOS para esta data');
        console.log('⚠️  Isso explica por que o sistema indica conflito');
        console.log('💡 Para liberar a data, os lançamentos precisam ser reprovados ou removidos');
      } else {
        console.log('🤔 Todos os lançamentos estão reprovados, mas ainda existem registros');
        console.log('💡 A lógica do check-limit pode estar considerando lançamentos reprovados');
        console.log('💡 Verifique a implementação da rota check-limit');
      }
    }
    
  } catch (error) {
    console.error('💥 Erro durante a verificação:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Executar a verificação
verificarLancamentoUsuario().catch(console.error);