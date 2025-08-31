// Script para corrigir lançamentos usando o endpoint de validação existente
const fetch = require('node-fetch');

async function fixViaValidation() {
  console.log('=== CORREÇÃO VIA ENDPOINT DE VALIDAÇÃO ===\n');
  
  try {
    // 1. Buscar lançamentos aprovados com problema
    console.log('📤 Buscando lançamentos aprovados...');
    const response = await fetch('http://localhost:8888/api/lancamentos?status=aprovado');
    
    if (!response.ok) {
      console.error('❌ Erro na API:', response.status, response.statusText);
      return;
    }
    
    const lancamentos = await response.json();
    
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
    
    // 3. Corrigir cada lançamento usando o endpoint de validação
    console.log('\n🛠️  Aplicando correções via endpoint de validação...');
    
    for (const lancamento of lancamentosProblema) {
      const tarefasValidas = lancamento.valid_tasks_count;
      const valorTarefas = parseFloat((lancamento.valid_tasks_count * 0.093).toFixed(2));
      
      console.log(`\nCorrigindo lançamento ID ${lancamento.id} - ${lancamento.user_nome}...`);
      console.log(`  Tarefas válidas: ${tarefasValidas}`);
      console.log(`  Valor tarefas: R$ ${valorTarefas}`);
      
      // Preparar dados editados
      const dadosEditados = {
        ...lancamento,
        tarefas_validas: tarefasValidas,
        valor_tarefas: valorTarefas
      };
      
      // Usar o endpoint de validação com ação 'editar'
      const validationData = {
        acao: 'editar',
        observacoes: `Correção automática: adicionado tarefas_validas (${tarefasValidas}) e valor_tarefas (R$ ${valorTarefas}) baseado em valid_tasks_count`,
        dados_editados: dadosEditados,
        admin_user_id: 1 // ID do admin
      };
      
      try {
        const validationResponse = await fetch(`http://localhost:8888/api/lancamentos/${lancamento.id}/validar`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(validationData)
        });
        
        if (validationResponse.ok) {
          const result = await validationResponse.json();
          console.log(`   ✅ ID ${lancamento.id} corrigido com sucesso`);
        } else {
          const errorData = await validationResponse.json();
          console.log(`   ❌ Erro ao corrigir ID ${lancamento.id}:`, errorData);
        }
      } catch (error) {
        console.log(`   ❌ Erro de rede ao corrigir ID ${lancamento.id}:`, error.message);
      }
      
      // Pequena pausa entre requisições
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // 4. Verificar resultados
    console.log('\n🔍 Verificando resultados...');
    const verifyResponse = await fetch('http://localhost:8888/api/lancamentos?status=aprovado');
    
    if (verifyResponse.ok) {
      const lancamentosAtualizados = await verifyResponse.json();
      
      // Verificar se ainda há problemas
      const aindaComProblema = lancamentosAtualizados.filter(l => 
        l.funcao === 'Operador de Empilhadeira' && 
        l.valid_tasks_count > 0 && 
        (l.tarefas_validas === null || l.tarefas_validas === undefined)
      );
      
      console.log(`\n📊 RESULTADO FINAL:`);
      console.log(`   Lançamentos corrigidos: ${lancamentosProblema.length - aindaComProblema.length}`);
      console.log(`   Ainda com problema: ${aindaComProblema.length}`);
      
      if (aindaComProblema.length === 0) {
        console.log('\n🎉 Todos os lançamentos foram corrigidos com sucesso!');
        
        // Mostrar alguns exemplos corrigidos
        console.log('\n✅ Exemplos de lançamentos corrigidos:');
        const corrigidos = lancamentosAtualizados.filter(l => 
          l.funcao === 'Operador de Empilhadeira' && 
          l.valid_tasks_count > 0 && 
          l.tarefas_validas !== null && 
          l.tarefas_validas !== undefined
        ).slice(0, 3);
        
        corrigidos.forEach(l => {
          console.log(`   ID ${l.id} - ${l.user_nome}: ${l.tarefas_validas} tarefas, R$ ${l.valor_tarefas}`);
        });
      } else {
        console.log('\n⚠️  Ainda há lançamentos com problema:');
        aindaComProblema.forEach(l => {
          console.log(`   ID ${l.id} - ${l.user_nome} (${l.data_lancamento})`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Erro durante a correção:', error);
  }
}

fixViaValidation();