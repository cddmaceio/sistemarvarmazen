// Script para corrigir lançamentos antigos sem tarefas_validas e valor_tarefas
const fetch = require('node-fetch');

async function fixMissingTarefasValidas() {
  console.log('=== CORREÇÃO DE LANÇAMENTOS SEM TAREFAS VÁLIDAS ===\n');
  
  try {
    // 1. Buscar todos os lançamentos aprovados
    console.log('📤 Buscando lançamentos aprovados...');
    const response = await fetch('http://localhost:8888/api/lancamentos?status=aprovado');
    
    if (!response.ok) {
      console.error('❌ Erro na API:', response.status, response.statusText);
      return;
    }
    
    const lancamentos = await response.json();
    console.log(`✅ Total de lançamentos aprovados: ${lancamentos.length}\n`);
    
    // 2. Filtrar lançamentos de Operador de Empilhadeira sem tarefas_validas
    const lancamentosProblema = lancamentos.filter(l => 
      l.funcao === 'Operador de Empilhadeira' && 
      l.valid_tasks_count > 0 && 
      (l.tarefas_validas === null || l.tarefas_validas === undefined)
    );
    
    console.log(`🔍 Lançamentos com problema encontrados: ${lancamentosProblema.length}`);
    
    if (lancamentosProblema.length === 0) {
      console.log('✅ Nenhum lançamento precisa de correção!');
      return;
    }
    
    // 3. Mostrar lançamentos que serão corrigidos
    console.log('\n📋 Lançamentos que serão corrigidos:');
    lancamentosProblema.forEach(l => {
      const expectedTarefasValidas = l.valid_tasks_count;
      const expectedValorTarefas = (l.valid_tasks_count * 0.093).toFixed(2);
      
      console.log(`   ID ${l.id} - ${l.user_nome} (${l.data_lancamento})`);
      console.log(`     Valid Tasks Count: ${l.valid_tasks_count}`);
      console.log(`     Tarefas Válidas atual: ${l.tarefas_validas}`);
      console.log(`     Valor Tarefas atual: ${l.valor_tarefas}`);
      console.log(`     Será corrigido para: ${expectedTarefasValidas} tarefas, R$ ${expectedValorTarefas}`);
      console.log('');
    });
    
    // 4. Aplicar correções via API
    console.log('🛠️  Aplicando correções...');
    
    for (const lancamento of lancamentosProblema) {
      const tarefasValidas = lancamento.valid_tasks_count;
      const valorTarefas = parseFloat((lancamento.valid_tasks_count * 0.093).toFixed(2));
      
      console.log(`Corrigindo lançamento ID ${lancamento.id}...`);
      
      // Preparar dados para atualização
      const updateData = {
        id: lancamento.id,
        tarefas_validas: tarefasValidas,
        valor_tarefas: valorTarefas
      };
      
      try {
        // Fazer requisição PUT para atualizar o lançamento
        const updateResponse = await fetch(`http://localhost:8888/api/lancamentos/${lancamento.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updateData)
        });
        
        if (updateResponse.ok) {
          console.log(`   ✅ ID ${lancamento.id} corrigido com sucesso`);
        } else {
          const errorData = await updateResponse.json();
          console.log(`   ❌ Erro ao corrigir ID ${lancamento.id}:`, errorData);
        }
      } catch (error) {
        console.log(`   ❌ Erro de rede ao corrigir ID ${lancamento.id}:`, error.message);
      }
      
      // Pequena pausa entre requisições
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // 5. Verificar resultados
    console.log('\n🔍 Verificando resultados...');
    const verifyResponse = await fetch('http://localhost:8888/api/lancamentos?status=aprovado');
    
    if (verifyResponse.ok) {
      const lancamentosAtualizados = await verifyResponse.json();
      const lancamentosCorrigidos = lancamentosAtualizados.filter(l => 
        l.funcao === 'Operador de Empilhadeira' && 
        l.valid_tasks_count > 0 && 
        l.tarefas_validas !== null && 
        l.tarefas_validas !== undefined
      );
      
      console.log(`✅ Lançamentos corrigidos: ${lancamentosCorrigidos.length}`);
      
      // Verificar se ainda há problemas
      const aindaComProblema = lancamentosAtualizados.filter(l => 
        l.funcao === 'Operador de Empilhadeira' && 
        l.valid_tasks_count > 0 && 
        (l.tarefas_validas === null || l.tarefas_validas === undefined)
      );
      
      if (aindaComProblema.length === 0) {
        console.log('🎉 Todos os lançamentos foram corrigidos com sucesso!');
      } else {
        console.log(`⚠️  Ainda há ${aindaComProblema.length} lançamentos com problema`);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro durante a correção:', error);
  }
}

fixMissingTarefasValidas();