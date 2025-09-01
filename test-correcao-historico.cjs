// Script para testar se a correção do histórico funcionou

const axios = require('axios');

const formatDateSafe = (dateString) => {
  if (!dateString) return '';
  
  const dateOnly = dateString.split('T')[0];
  const [year, month, day] = dateOnly.split('-');
  
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  return date.toLocaleDateString('pt-BR');
};

async function testarCorrecaoHistorico() {
  try {
    console.log('🔍 Testando correção do histórico...');
    
    // Buscar lançamentos aprovados do usuário
    const response = await axios.get('http://localhost:8888/api/lancamentos?user_id=3&status=aprovado');
    const lancamentos = response.data;
    
    console.log(`📊 Total de lançamentos aprovados: ${lancamentos.length}`);
    
    // Filtrar por agosto de 2025
    const lancamentosAgosto = lancamentos.filter(item => {
      const dataFormatada = formatDateSafe(item.data_lancamento);
      const [dia, mes, ano] = dataFormatada.split('/');
      return parseInt(mes) === 8 && parseInt(ano) === 2025;
    });
    
    console.log(`📅 Lançamentos de agosto/2025: ${lancamentosAgosto.length}`);
    
    // Simular o processamento do histórico
    const historicoCompleto = [];
    
    lancamentosAgosto.forEach(item => {
      const dataFormatada = formatDateSafe(item.data_lancamento);
      
      console.log(`\n📋 Processando lançamento ID ${item.id}:`);
      console.log(`  Data: ${item.data_lancamento} -> ${dataFormatada}`);
      console.log(`  Multiple activities: ${item.multiple_activities}`);
      
      if (item.multiple_activities) {
        try {
          const atividades = JSON.parse(item.multiple_activities);
          console.log(`  Atividades encontradas: ${atividades.length}`);
          
          atividades.forEach((activity, index) => {
            const valorAtividade = parseFloat(activity.valor || '0');
            console.log(`    ${index + 1}. ${activity.nome_atividade}: R$ ${valorAtividade}`);
            
            historicoCompleto.push({
              data: dataFormatada,
              valor: valorAtividade,
              atividade: activity.nome_atividade,
              turno: item.turno,
              aprovadoPor: 'Sistema',
              id_original: item.id
            });
          });
        } catch (e) {
          console.log(`  ❌ Erro ao processar multiple_activities: ${e.message}`);
        }
      } else {
        console.log(`  ⚠️ Sem multiple_activities`);
      }
    });
    
    console.log(`\n📊 HISTÓRICO COMPLETO GERADO:`);
    console.log(`Total de itens: ${historicoCompleto.length}`);
    
    historicoCompleto.forEach((item, index) => {
      console.log(`${index + 1}. ${item.data} - ${item.atividade}: R$ ${item.valor} (ID: ${item.id_original})`);
    });
    
    // Agrupar por data
    const agrupado = {};
    historicoCompleto.forEach(item => {
      if (!agrupado[item.data]) {
        agrupado[item.data] = [];
      }
      agrupado[item.data].push(item);
    });
    
    console.log(`\n📅 AGRUPAMENTO POR DATA:`);
    Object.keys(agrupado).sort().forEach(data => {
      console.log(`${data}: ${agrupado[data].length} item(s)`);
      agrupado[data].forEach(item => {
        console.log(`  - ${item.atividade}: R$ ${item.valor}`);
      });
    });
    
    // Verificar se o problema foi corrigido
    const totalItens = historicoCompleto.length;
    const datasUnicas = Object.keys(agrupado).length;
    
    console.log(`\n✅ RESULTADO DO TESTE:`);
    console.log(`- Total de itens no histórico: ${totalItens}`);
    console.log(`- Datas únicas: ${datasUnicas}`);
    console.log(`- Esperado: 5 itens (2 para 04/08, 2 para 02/08, 1 para 01/08)`);
    
    if (totalItens === 5 && datasUnicas === 3) {
      console.log(`🎉 CORREÇÃO FUNCIONOU! O histórico agora mostra todos os itens corretamente.`);
    } else {
      console.log(`❌ PROBLEMA AINDA EXISTE. Verificar processamento.`);
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

testarCorrecaoHistorico();