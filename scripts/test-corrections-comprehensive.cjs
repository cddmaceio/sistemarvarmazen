#!/usr/bin/env node

// Script para testar as correções implementadas após limpar os dados
// Este script simula diferentes cenários de lançamentos para validar as correções

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

// Dados de teste para diferentes cenários
const testScenarios = [
  {
    name: 'Operador de Empilhadeira - Cenário 1',
    data: {
      user_id: 4, // ALMIR VICTOR ALENCAR DA ROCHA - Operador de Empilhadeira
      data_lancamento: '2025-01-15',
      calculator_data: {
        funcao: 'Operador de Empilhadeira',
        turno: 'Manhã',
        nome_operador: 'ALMIR VICTOR ALENCAR DA ROCHA',
        valid_tasks_count: 120,
        input_adicional: 0
      },
      calculator_result: {
        tarefas_validas: 120,
        valor_tarefas: 240.00,
        subtotalAtividades: 240.00,
        kpisAtingidos: 2,
        bonusKpis: 11.52,
        remuneracaoTotal: 251.52
      }
    }
  },
  {
    name: 'Operador de Empilhadeira - Cenário 2',
    data: {
      user_id: 8, // ERIVALDO FERREIRA DA SILVA - Operador de Empilhadeira
      data_lancamento: '2025-01-15',
      calculator_data: {
        funcao: 'Operador de Empilhadeira',
        turno: 'Tarde',
        nome_operador: 'ERIVALDO FERREIRA DA SILVA',
        valid_tasks_count: 85,
        input_adicional: 0
      },
      calculator_result: {
        tarefas_validas: 85,
        valor_tarefas: 170.00,
        subtotalAtividades: 170.00,
        kpisAtingidos: 1,
        bonusKpis: 5.76,
        remuneracaoTotal: 175.76
      }
    }
  },
  {
    name: 'Auxiliar de Armazém - Cenário 1',
    data: {
      user_id: 2, // Artur Ryan - Ajudante de Armazém
      data_lancamento: '2025-01-15',
      calculator_data: {
        funcao: 'Ajudante de Armazém',
        turno: 'Manhã',
        nome_atividade: 'Separação',
        quantidade_produzida: 100,
        tempo_horas: 8,
        input_adicional: 0
      },
      calculator_result: {
        subtotalAtividades: 150.00,
        kpisAtingidos: 3,
        bonusKpis: 17.28,
        remuneracaoTotal: 167.28
      }
    }
  }
];

async function testCorrections() {
  console.log('🧪 INICIANDO TESTES DAS CORREÇÕES\n');
  
  try {
    // 1. Verificar se a tabela está limpa
    console.log('1️⃣ Verificando estado inicial da tabela...');
    const { data: initialData, error: initialError } = await supabase
      .from('lancamentos_produtividade')
      .select('*');
    
    if (initialError) {
      console.error('❌ Erro ao verificar tabela:', initialError);
      return;
    }
    
    console.log(`📊 Registros existentes: ${initialData.length}\n`);
    
    // 2. Criar lançamentos de teste
    console.log('2️⃣ Criando lançamentos de teste...');
    const createdIds = [];
    
    for (const scenario of testScenarios) {
      console.log(`   📝 Criando: ${scenario.name}`);
      
      const response = await fetch('http://localhost:8888/api/lancamentos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(scenario.data)
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`   📋 Resposta da API:`, JSON.stringify(result, null, 2));
        if (result && result.data && result.data.id) {
          createdIds.push(result.data.id);
          console.log(`   ✅ Criado com ID: ${result.data.id}`);
        } else if (result && result.id) {
          createdIds.push(result.id);
          console.log(`   ✅ Criado com ID: ${result.id}`);
        } else {
          console.log(`   ⚠️  Lançamento criado mas ID não encontrado na resposta`);
        }
      } else {
        const error = await response.text();
        console.log(`   ❌ Erro: ${error}`);
      }
    }
    
    console.log(`\n📊 Total de lançamentos criados: ${createdIds.length}\n`);
    
    // 3. Verificar se os dados foram salvos corretamente
    console.log('3️⃣ Verificando dados salvos...');
    
    for (const id of createdIds) {
      const { data: lancamento, error } = await supabase
        .from('lancamentos_produtividade')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        console.log(`❌ Erro ao buscar lançamento ${id}:`, error);
        continue;
      }
      
      console.log(`\n📋 Lançamento ID ${id}:`);
      console.log(`   👤 Usuário: ${lancamento.user_nome}`);
      console.log(`   💼 Cargo: ${lancamento.cargo}`);
      console.log(`   📅 Data: ${lancamento.data_lancamento}`);
      console.log(`   🔢 Valid Tasks Count: ${lancamento.valid_tasks_count}`);
      console.log(`   ✅ Tarefas Válidas: ${lancamento.tarefas_validas}`);
      console.log(`   💰 Valor Tarefas: R$ ${lancamento.valor_tarefas}`);
      console.log(`   📊 Subtotal Atividades: R$ ${lancamento.subtotal_atividades}`);
      console.log(`   🎯 KPIs Atingidos: ${lancamento.kpis_atingidos}`);
      console.log(`   🎁 Bônus KPIs: R$ ${lancamento.bonus_kpis}`);
      console.log(`   💵 Remuneração Total: R$ ${lancamento.remuneracao_total}`);
      console.log(`   📝 Status: ${lancamento.status}`);
      
      // Validações específicas
      if (lancamento.cargo === 'Operador de Empilhadeira') {
        if (lancamento.valid_tasks_count === null) {
          console.log(`   ⚠️  PROBLEMA: valid_tasks_count é null para Operador de Empilhadeira`);
        } else {
          console.log(`   ✅ valid_tasks_count correto: ${lancamento.valid_tasks_count}`);
        }
        
        if (lancamento.tarefas_validas === null) {
          console.log(`   ⚠️  PROBLEMA: tarefas_validas é null para Operador de Empilhadeira`);
        } else {
          console.log(`   ✅ tarefas_validas correto: ${lancamento.tarefas_validas}`);
        }
        
        if (lancamento.valor_tarefas === null) {
          console.log(`   ⚠️  PROBLEMA: valor_tarefas é null para Operador de Empilhadeira`);
        } else {
          console.log(`   ✅ valor_tarefas correto: R$ ${lancamento.valor_tarefas}`);
        }
      }
    }
    
    // 4. Resumo final
    console.log('\n🎯 RESUMO DOS TESTES:');
    console.log(`   📊 Lançamentos criados: ${createdIds.length}`);
    console.log(`   ✅ Testes concluídos com sucesso!`);
    
    // 5. Opção de limpeza
    console.log('\n🧹 Para limpar os dados de teste, execute:');
    console.log('   DELETE FROM lancamentos_produtividade WHERE id IN (' + createdIds.join(', ') + ');');
    
  } catch (error) {
    console.error('❌ Erro durante os testes:', error);
  }
}

// Executar os testes
testCorrections();