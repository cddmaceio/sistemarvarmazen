// Script para verificar dados de lançamentos aprovados
const fetch = require('node-fetch');

async function checkApprovedData() {
  console.log('=== VERIFICAÇÃO DE DADOS APROVADOS ===\n');
  
  try {
    // Buscar lançamentos aprovados
    console.log('📤 Buscando lançamentos aprovados...');
    const response = await fetch('http://localhost:8888/api/lancamentos?status=aprovado');
    
    if (!response.ok) {
      console.error('❌ Erro na API:', response.status, response.statusText);
      return;
    }
    
    const lancamentos = await response.json();
    console.log(`✅ Total de lançamentos aprovados: ${lancamentos.length}\n`);
    
    if (lancamentos.length === 0) {
      console.log('⚠️  Nenhum lançamento aprovado encontrado');
      return;
    }
    
    // Analisar cada lançamento
    lancamentos.forEach((lancamento, index) => {
      console.log(`📋 Lançamento ${index + 1}:`);
      console.log(`   ID: ${lancamento.id}`);
      console.log(`   Usuário: ${lancamento.user_nome}`);
      console.log(`   Data: ${lancamento.data_lancamento}`);
      console.log(`   Função: ${lancamento.funcao}`);
      console.log(`   Valid Tasks Count: ${lancamento.valid_tasks_count || 'null'}`);
      console.log(`   Tarefas Válidas: ${lancamento.tarefas_validas || 'null'}`);
      console.log(`   Valor Tarefas: R$ ${lancamento.valor_tarefas || 'null'}`);
      console.log(`   Subtotal Atividades: R$ ${lancamento.subtotal_atividades || 'null'}`);
      console.log(`   Bônus KPIs: R$ ${lancamento.bonus_kpis || 'null'}`);
      console.log(`   Remuneração Total: R$ ${lancamento.remuneracao_total || 'null'}`);
      console.log(`   Status: ${lancamento.status}`);
      console.log(`   KPIs Atingidos: ${lancamento.kpis_atingidos || 'null'}`);
      console.log('');
    });
    
    // Verificar inconsistências
    const operadoresEmpilhadeira = lancamentos.filter(l => l.funcao === 'Operador de Empilhadeira');
    const semTarefasValidas = operadoresEmpilhadeira.filter(l => !l.tarefas_validas);
    
    console.log('🔍 ANÁLISE DE INCONSISTÊNCIAS:');
    console.log(`   Total de Operadores de Empilhadeira: ${operadoresEmpilhadeira.length}`);
    console.log(`   Sem campo tarefas_validas: ${semTarefasValidas.length}`);
    
    if (semTarefasValidas.length > 0) {
      console.log('\n⚠️  LANÇAMENTOS SEM TAREFAS VÁLIDAS:');
      semTarefasValidas.forEach(l => {
        console.log(`   ID ${l.id} - ${l.user_nome} (${l.data_lancamento})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

checkApprovedData();