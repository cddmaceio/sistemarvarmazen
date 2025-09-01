const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://ixqjgfqjqjqjqjqjqjqj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4cWpnZnFqcWpxanFqcWpxanFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU2NzI4MDAsImV4cCI6MjA1MTI0ODgwMH0.abc123';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testarDuplicacaoDetalhada() {
  try {
    console.log('🔍 Testando duplicação detalhada para usuário 699.895.404-20...');
    
    // Importar fetch dinamicamente
    const { default: fetch } = await import('node-fetch');
    
    // 1. Buscar usuário específico via API local
    const usuarioResponse = await fetch('http://localhost:8888/api/usuarios');
    const usuarios = await usuarioResponse.json();
    const usuario = usuarios.find(u => u.cpf === '699.895.404-20');
    
    if (!usuario) {
      console.log('❌ Usuário não encontrado');
      return;
    }
    
    console.log('✅ Usuário encontrado:', usuario.nome, '- Função:', usuario.funcao);
    
    // 2. Buscar todos os lançamentos aprovados do usuário
    const lancamentosResponse = await fetch(`http://localhost:8888/api/lancamentos?usuario_id=${usuario.id}&status=aprovado`);
    const lancamentos = await lancamentosResponse.json();
    
    if (!lancamentos || !Array.isArray(lancamentos)) {
      console.log('❌ Erro ao buscar lançamentos ou nenhum lançamento encontrado');
      return;
    }
    
    console.log(`📊 Total de lançamentos aprovados: ${lancamentos.length}`);
    
    // 3. Agrupar lançamentos por data
    const lancamentosPorData = {};
    lancamentos.forEach(lancamento => {
      const data = lancamento.data;
      if (!lancamentosPorData[data]) {
        lancamentosPorData[data] = [];
      }
      lancamentosPorData[data].push(lancamento);
    });
    
    console.log('\n📅 Lançamentos agrupados por data:');
    Object.keys(lancamentosPorData).forEach(data => {
      const lancamentosData = lancamentosPorData[data];
      console.log(`  ${data}: ${lancamentosData.length} lançamento(s)`);
      
      if (lancamentosData.length > 1) {
        console.log('    ⚠️ MÚLTIPLOS LANÇAMENTOS NA MESMA DATA:');
        lancamentosData.forEach((lanc, index) => {
          console.log(`      ${index + 1}. ID: ${lanc.id}, Status Edição: ${lanc.status_edicao || 'N/A'}, Editado por: ${lanc.editado_por_admin || 'N/A'}`);
        });
      }
    });
    
    // 4. Simular o processamento do frontend (DashboardCollaborator.tsx)
    console.log('\n🔄 Simulando processamento do frontend...');
    
    // Filtrar lançamentos únicos aprovados (linha ~200 do DashboardCollaborator.tsx)
    const lancamentosUnicosAprovados = lancamentos.filter((lancamento, index, array) => {
      return array.findIndex(l => l.data === lancamento.data) === index;
    });
    
    console.log(`📋 Lançamentos únicos após filtro: ${lancamentosUnicosAprovados.length}`);
    
    // 5. Simular criação do histórico completo
    const historicoCompleto = [];
    
    if (usuario.funcao === 'Operador de Empilhadeira') {
      // Lógica específica para Operador de Empilhadeira
      lancamentosUnicosAprovados.forEach(lancamento => {
        historicoCompleto.push({
          data: lancamento.data,
          id: lancamento.id,
          atividade: 'Tarefas Válidas',
          tarefas_validas: lancamento.tarefas_validas,
          valor_tarefas: lancamento.valor_tarefas,
          subtotal_atividades: lancamento.subtotal_atividades,
          bonus_kpis: lancamento.bonus_kpis,
          kpis_atingidos: lancamento.kpis_atingidos,
          status_edicao: lancamento.status_edicao,
          editado_por_admin: lancamento.editado_por_admin,
          data_edicao: lancamento.data_edicao,
          aprovadoPor: lancamento.aprovado_por
        });
      });
    } else {
      // Lógica para outras funções (Ajudante de Armazém, etc.)
      const atividadesPorTipo = {};
      
      lancamentosUnicosAprovados.forEach(lancamento => {
        // Processar atividades
        if (lancamento.atividades) {
          let atividades = [];
          try {
            atividades = typeof lancamento.atividades === 'string' 
              ? JSON.parse(lancamento.atividades) 
              : lancamento.atividades;
          } catch (e) {
            console.log('⚠️ Erro ao parsear atividades:', e.message);
          }
          
          atividades.forEach(atividade => {
            const tipo = atividade.nome || atividade.atividade;
            if (!atividadesPorTipo[tipo]) {
              atividadesPorTipo[tipo] = {
                quantidade: 0,
                valor: 0,
                dias: new Set(),
                lancamentos: []
              };
            }
            
            atividadesPorTipo[tipo].quantidade += atividade.quantidade || 0;
            atividadesPorTipo[tipo].valor += atividade.valor || 0;
            atividadesPorTipo[tipo].dias.add(lancamento.data);
            atividadesPorTipo[tipo].lancamentos.push({
              data: lancamento.data,
              lancamento_id: lancamento.id,
              atividade: atividade
            });
          });
        }
        
        // Processar KPIs
        if (lancamento.kpis_atingidos && lancamento.bonus_kpis > 0) {
          const tipo = 'KPIs Atingidos';
          if (!atividadesPorTipo[tipo]) {
            atividadesPorTipo[tipo] = {
              quantidade: 0,
              valor: 0,
              dias: new Set(),
              lancamentos: []
            };
          }
          
          let kpis = [];
          try {
            kpis = typeof lancamento.kpis_atingidos === 'string' 
              ? JSON.parse(lancamento.kpis_atingidos) 
              : lancamento.kpis_atingidos;
          } catch (e) {
            console.log('⚠️ Erro ao parsear KPIs:', e.message);
          }
          
          atividadesPorTipo[tipo].quantidade += kpis.length;
          atividadesPorTipo[tipo].valor += lancamento.bonus_kpis;
          atividadesPorTipo[tipo].dias.add(lancamento.data);
          atividadesPorTipo[tipo].lancamentos.push({
            data: lancamento.data,
            lancamento_id: lancamento.id,
            kpis: kpis,
            bonus: lancamento.bonus_kpis
          });
        }
      });
      
      // Adicionar ao histórico completo
      Object.keys(atividadesPorTipo).forEach(tipo => {
        const atividade = atividadesPorTipo[tipo];
        atividade.lancamentos.forEach(lanc => {
          const lancamentoOriginal = lancamentos.find(l => l.id === lanc.lancamento_id);
          
          historicoCompleto.push({
            data: lanc.data,
            id: lanc.lancamento_id,
            atividade: tipo,
            quantidade: lanc.atividade?.quantidade || lanc.kpis?.length || 0,
            valor: lanc.atividade?.valor || lanc.bonus || 0,
            subtotal_atividades: lancamentoOriginal?.subtotal_atividades,
            bonus_kpis: lancamentoOriginal?.bonus_kpis,
            kpis_atingidos: lancamentoOriginal?.kpis_atingidos,
            status_edicao: lancamentoOriginal?.status_edicao,
            editado_por_admin: lancamentoOriginal?.editado_por_admin,
            data_edicao: lancamentoOriginal?.data_edicao,
            aprovadoPor: lancamentoOriginal?.aprovado_por
          });
        });
      });
    }
    
    // 6. Ordenar histórico por data
    historicoCompleto.sort((a, b) => new Date(b.data) - new Date(a.data));
    
    console.log(`\n📈 Histórico completo gerado: ${historicoCompleto.length} entradas`);
    
    // 7. Verificar duplicações no histórico
    const historicosPorData = {};
    historicoCompleto.forEach(item => {
      const data = item.data;
      if (!historicosPorData[data]) {
        historicosPorData[data] = [];
      }
      historicosPorData[data].push(item);
    });
    
    console.log('\n🔍 Análise de duplicações no histórico:');
    let duplicacoesEncontradas = false;
    
    Object.keys(historicosPorData).forEach(data => {
      const itens = historicosPorData[data];
      if (itens.length > 1) {
        duplicacoesEncontradas = true;
        console.log(`\n⚠️ DUPLICAÇÃO ENCONTRADA em ${data}:`);
        itens.forEach((item, index) => {
          console.log(`  ${index + 1}. ID: ${item.id}, Atividade: ${item.atividade}, Status: ${item.status_edicao || 'N/A'}`);
        });
      } else {
        console.log(`✅ ${data}: 1 entrada (OK)`);
      }
    });
    
    if (!duplicacoesEncontradas) {
      console.log('\n✅ Nenhuma duplicação encontrada no histórico gerado!');
    }
    
    // 8. Verificar lançamentos editados especificamente
    const lancamentosEditados = lancamentos.filter(l => l.status_edicao === 'editado_admin');
    console.log(`\n✏️ Lançamentos editados encontrados: ${lancamentosEditados.length}`);
    
    lancamentosEditados.forEach(lanc => {
      console.log(`  - Data: ${lanc.data}, ID: ${lanc.id}, Editado por: ${lanc.editado_por_admin}`);
      
      // Verificar se este lançamento editado aparece no histórico
      const noHistorico = historicoCompleto.filter(h => h.id === lanc.id);
      console.log(`    Aparições no histórico: ${noHistorico.length}`);
    });
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
  }
}

testarDuplicacaoDetalhada();