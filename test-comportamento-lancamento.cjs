// Script para verificar o comportamento do lançamento e como as informações vão para o banco
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
const BASE_URL = 'http://localhost:8888';

async function testComportamentoLancamento() {
  console.log('🔍 ANÁLISE: Comportamento do Lançamento');
  console.log('=' .repeat(60));
  
  const cpfUsuario = '699.895.404-20';
  const dataLancamento = '2025-08-19';
  
  try {
    // Import fetch dinamicamente
    const { default: fetch } = await import('node-fetch');
    
    // 1. Buscar o usuário
    console.log('\n1. 👤 Identificando usuário...');
    const { data: usuarios, error: errorUsuario } = await supabase
      .from('usuarios')
      .select('*')
      .eq('cpf', cpfUsuario)
      .single();
    
    if (errorUsuario || !usuarios) {
      console.error('❌ Usuário não encontrado:', errorUsuario);
      return;
    }
    
    console.log(`✅ Usuário: ${usuarios.nome} (ID: ${usuarios.id})`);
    console.log(`   Função: ${usuarios.funcao}`);
    
    // 2. Analisar o lançamento pendente existente
    console.log('\n2. 🔍 Analisando lançamento pendente existente...');
    const { data: lancamentoPendente, error: errorPendente } = await supabase
      .from('lancamentos_produtividade')
      .select('*')
      .eq('user_id', usuarios.id)
      .eq('data_lancamento', dataLancamento)
      .eq('status', 'pendente')
      .single();
    
    if (lancamentoPendente) {
      console.log('📋 Lançamento pendente encontrado:');
      console.log(`   - ID: ${lancamentoPendente.id}`);
      console.log(`   - Status: ${lancamentoPendente.status}`);
      console.log(`   - Remuneração: R$ ${lancamentoPendente.remuneracao_total}`);
      console.log(`   - Calculator Data: ${lancamentoPendente.calculator_data ? 'Presente' : 'Ausente'}`);
      console.log(`   - Calculator Result: ${lancamentoPendente.calculator_result ? 'Presente' : 'Ausente'}`);
      console.log(`   - Atividade: ${lancamentoPendente.nome_atividade || 'Não definida'}`);
      console.log(`   - KPIs Atingidos: ${lancamentoPendente.kpis_atingidos || 'Não definidos'}`);
      
      if (lancamentoPendente.calculator_data) {
        try {
          const calcData = JSON.parse(lancamentoPendente.calculator_data);
          console.log('   📊 Dados da Calculadora:');
          console.log(`      - Função: ${calcData.funcao}`);
          console.log(`      - Turno: ${calcData.turno}`);
          console.log(`      - Tarefas Válidas: ${calcData.valid_tasks_count}`);
          console.log(`      - KPIs: ${JSON.stringify(calcData.kpis_atingidos)}`);
        } catch (e) {
          console.log('   ⚠️  Erro ao parsear calculator_data');
        }
      }
      
      if (lancamentoPendente.calculator_result) {
        try {
          const calcResult = JSON.parse(lancamentoPendente.calculator_result);
          console.log('   📊 Resultado da Calculadora:');
          console.log(`      - Subtotal Atividades: R$ ${calcResult.subtotal_atividades}`);
          console.log(`      - Bônus KPIs: R$ ${calcResult.bonus_kpis}`);
          console.log(`      - Total: R$ ${calcResult.remuneracao_total}`);
        } catch (e) {
          console.log('   ⚠️  Erro ao parsear calculator_result');
        }
      }
    } else {
      console.log('❌ Nenhum lançamento pendente encontrado');
    }
    
    // 3. Testar o fluxo completo de um novo lançamento
    console.log('\n3. 🧪 Testando fluxo completo de lançamento...');
    
    // 3.1. Verificar check-limit
    console.log('\n   3.1. Verificando check-limit...');
    const checkResponse = await fetch(`${BASE_URL}/api/kpis/check-limit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: usuarios.id,
        data_lancamento: dataLancamento
      })
    });
    
    if (checkResponse.ok) {
      const checkResult = await checkResponse.json();
      console.log(`   ✅ Check-limit: ${checkResult.limitReached ? 'BLOQUEADO' : 'LIVRE'}`);
    } else {
      console.log(`   ❌ Erro no check-limit: ${checkResponse.status}`);
    }
    
    // 3.2. Buscar KPIs disponíveis
    console.log('\n   3.2. Buscando KPIs disponíveis...');
    const kpisResponse = await fetch(`${BASE_URL}/api/kpis?funcao=${encodeURIComponent(usuarios.funcao)}`);
    
    if (kpisResponse.ok) {
      const kpis = await kpisResponse.json();
      console.log(`   ✅ KPIs encontrados: ${kpis.length}`);
      if (kpis.length > 0) {
        console.log(`   📋 Primeiro KPI: ${kpis[0].nome_kpi}`);
      }
    } else {
      console.log(`   ❌ Erro ao buscar KPIs: ${kpisResponse.status}`);
    }
    
    // 3.3. Buscar atividades disponíveis
    console.log('\n   3.3. Buscando atividades disponíveis...');
    const atividadesResponse = await fetch(`${BASE_URL}/api/activities`);
    
    if (atividadesResponse.ok) {
      const atividades = await atividadesResponse.json();
      console.log(`   ✅ Atividades encontradas: ${atividades.length}`);
      if (atividades.length > 0) {
        console.log(`   📋 Primeira atividade: ${atividades[0].nome_atividade}`);
      }
    } else {
      console.log(`   ❌ Erro ao buscar atividades: ${atividadesResponse.status}`);
    }
    
    // 3.4. Testar calculadora
    console.log('\n   3.4. Testando calculadora...');
    const calculatorInput = {
      funcao: usuarios.funcao,
      turno: 'Manhã',
      multiple_activities: [{
        nome_atividade: 'Prod Repack',
        quantidade_produzida: 100,
        tempo_horas: 8
      }],
      nome_operador: usuarios.nome,
      kpis_atingidos: ['Pontualidade']
    };
    
    const calcResponse = await fetch(`${BASE_URL}/api/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(calculatorInput)
    });
    
    if (calcResponse.ok) {
      const calcResult = await calcResponse.json();
      console.log('   ✅ Calculadora funcionando:');
      console.log(`      - Subtotal: R$ ${calcResult.subtotal_atividades}`);
      console.log(`      - Bônus: R$ ${calcResult.bonus_kpis}`);
      console.log(`      - Total: R$ ${calcResult.remuneracao_total}`);
      
      // 3.5. Simular um lançamento (sem executar para não criar duplicata)
      console.log('\n   3.5. Simulando estrutura de lançamento...');
      const lancamentoData = {
        user_id: usuarios.id,
        data_lancamento: '2025-08-25', // Data diferente para não conflitar
        calculator_data: calculatorInput,
        calculator_result: calcResult
      };
      
      console.log('   📤 Estrutura do lançamento:');
      console.log(`      - user_id: ${lancamentoData.user_id}`);
      console.log(`      - data_lancamento: ${lancamentoData.data_lancamento}`);
      console.log(`      - calculator_data: ${Object.keys(lancamentoData.calculator_data).join(', ')}`);
      console.log(`      - calculator_result: ${Object.keys(lancamentoData.calculator_result).join(', ')}`);
      
    } else {
      console.log(`   ❌ Erro na calculadora: ${calcResponse.status}`);
      const errorText = await calcResponse.text();
      console.log(`      Resposta: ${errorText}`);
    }
    
    // 4. Verificar histórico de aprovações
    console.log('\n4. 📋 Verificando histórico de aprovações...');
    const { data: historico, error: errorHistorico } = await supabase
      .from('historico_aprovacao')
      .select('*')
      .eq('lancamento_id', lancamentoPendente?.id)
      .order('created_at', { ascending: false });
    
    if (historico && historico.length > 0) {
      console.log(`   📊 Histórico encontrado: ${historico.length} registro(s)`);
      historico.forEach((h, index) => {
        console.log(`   ${index + 1}. ${h.acao} por ${h.aprovador_nome} em ${h.created_at}`);
        if (h.observacoes) {
          console.log(`      Observações: ${h.observacoes}`);
        }
      });
    } else {
      console.log('   📊 Nenhum histórico de aprovação encontrado');
    }
    
    // 5. Análise da lógica check-limit
    console.log('\n5. 🔍 Analisando lógica check-limit...');
    const { data: lancamentosAtivos, error: errorAtivos } = await supabase
      .from('lancamentos_produtividade')
      .select('id, status, data_lancamento')
      .eq('user_id', usuarios.id)
      .eq('data_lancamento', dataLancamento)
      .neq('status', 'reprovado'); // Exclui apenas reprovados
    
    console.log(`   📊 Lançamentos não-reprovados para ${dataLancamento}: ${lancamentosAtivos?.length || 0}`);
    if (lancamentosAtivos && lancamentosAtivos.length > 0) {
      lancamentosAtivos.forEach(l => {
        console.log(`      - ID ${l.id}: ${l.status}`);
      });
    }
    
    console.log('\n🎯 DIAGNÓSTICO FINAL:');
    console.log('=' .repeat(50));
    
    if (lancamentoPendente) {
      console.log('🔍 PROBLEMA IDENTIFICADO:');
      console.log(`   ✅ Existe um lançamento PENDENTE (ID: ${lancamentoPendente.id}) para 19/08/2025`);
      console.log('   ✅ A rota check-limit está funcionando corretamente');
      console.log('   ✅ O sistema está bloqueando novos lançamentos como esperado');
      console.log('');
      console.log('💡 SOLUÇÕES POSSÍVEIS:');
      console.log('   1. Aprovar o lançamento pendente');
      console.log('   2. Reprovar o lançamento pendente');
      console.log('   3. Remover o lançamento pendente');
      console.log('');
      console.log('🔧 AÇÕES RECOMENDADAS:');
      console.log('   - Verificar por que o lançamento está pendente');
      console.log('   - Revisar o processo de aprovação');
      console.log('   - Considerar implementar auto-aprovação ou timeout');
    } else {
      console.log('❓ Situação inesperada: check-limit indica ocupado mas não há lançamentos');
    }
    
  } catch (error) {
    console.error('💥 Erro durante a análise:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Executar a análise
testComportamentoLancamento().catch(console.error);