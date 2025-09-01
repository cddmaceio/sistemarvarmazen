const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://qcqkfipckcnydsjjdral.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjcWtmaXBja2NueWRzampkcmFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2Mjc3MzcsImV4cCI6MjA3MTIwMzczN30.5Bq-1-TyOugW1-NrkDj_37lCYDvKJNiaRC6vFoWqXZk';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Função para formatar data de forma segura
function formatDateSafe(dateString) {
  if (!dateString) return '';
  
  try {
    const dateOnly = dateString.split('T')[0];
    const [year, month, day] = dateOnly.split('-');
    return `${day}/${month}/${year}`;
  } catch (error) {
    console.error('Erro ao formatar data:', error);
    return dateString;
  }
}

async function testarCorrecaoDuplicacao() {
  try {
    console.log('🔍 Testando correção da duplicação no histórico...');
    
    // 1. Buscar usuário pelo CPF
    const CPF_USUARIO = '699.895.404-20';
    const { data: usuarios, error: userError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('cpf', CPF_USUARIO);
    
    if (userError) {
      console.error('❌ Erro ao buscar usuário:', userError);
      return;
    }
    
    if (!usuarios || usuarios.length === 0) {
      console.error('❌ Usuário não encontrado!');
      return;
    }
    
    const usuario = usuarios[0];
    console.log('✅ Usuário encontrado:', usuario.nome);
    
    console.log('🔍 ID do usuário:', usuario.id);
    
    // 2. Buscar lançamentos aprovados
    const { data: lancamentos, error: lancamentosError } = await supabase
      .from('lancamentos_produtividade')
      .select('*')
      .eq('user_id', usuario.id)
      .eq('status', 'aprovado')
      .order('data_lancamento', { ascending: false });
    
    if (lancamentosError) {
      console.error('❌ Erro ao buscar lançamentos:', lancamentosError);
      return;
    }
    
    console.log(`📊 Total de lançamentos aprovados: ${lancamentos.length}`);
    
    // 3. Simular a lógica ATUAL do DashboardCollaborator (com problema)
    console.log('\n🔄 Simulando lógica ATUAL (com duplicação)...');
    
    const historicoAtual = [];
    
    // Filtrar lançamentos únicos por ID (lógica atual)
    const lancamentosUnicos = lancamentos.filter((item, index, arr) => {
      return arr.findIndex(t => t.id === item.id) === index && item.status === 'aprovado';
    });
    
    console.log(`📋 Lançamentos únicos por ID: ${lancamentosUnicos.length}`);
    
    // Processar cada lançamento (simulando a lógica atual)
    lancamentosUnicos.forEach(item => {
      const dataFormatada = formatDateSafe(item.data_lancamento);
      
      // Para Operador de Empilhadeira, adicionar ao histórico
      if (usuarios.funcao === 'Operador de Empilhadeira') {
        const valorFinalLancamento = (item.subtotal_atividades || item.valor_tarefas || 0) + (item.bonus_kpis || 0);
        
        historicoAtual.push({
          data: dataFormatada,
          valor: valorFinalLancamento,
          atividade: 'Operador de Empilhadeira',
          turno: item.turno,
          aprovadoPor: item.aprovado_por_nome || item.aprovado_por || 'Sistema',
          status_edicao: item.status_edicao,
          editado_por_admin: item.editado_por_admin,
          data_edicao: item.data_edicao,
          id_original: item.id
        });
      }
    });
    
    console.log(`📈 Histórico atual gerado: ${historicoAtual.length} entradas`);
    
    // 4. Verificar duplicações por data
    console.log('\n🔍 Verificando duplicações por data...');
    const lancamentosPorData = {};
    
    historicoAtual.forEach(item => {
      if (!lancamentosPorData[item.data]) {
        lancamentosPorData[item.data] = [];
      }
      lancamentosPorData[item.data].push(item);
    });
    
    let duplicacoesEncontradas = false;
    Object.keys(lancamentosPorData).forEach(data => {
      const itensData = lancamentosPorData[data];
      if (itensData.length > 1) {
        duplicacoesEncontradas = true;
        console.log(`⚠️ DUPLICAÇÃO ENCONTRADA - Data: ${data}`);
        console.log(`   Quantidade de entradas: ${itensData.length}`);
        itensData.forEach((item, index) => {
          console.log(`   ${index + 1}. ID: ${item.id_original}, Status Edição: ${item.status_edicao || 'original'}`);
        });
      }
    });
    
    if (!duplicacoesEncontradas) {
      console.log('✅ Nenhuma duplicação encontrada na lógica atual');
    }
    
    // 5. Implementar lógica CORRIGIDA
    console.log('\n🔧 Implementando lógica CORRIGIDA...');
    
    const historicoCorrigido = [];
    const datasProcessadas = new Set();
    
    // Agrupar lançamentos por data
    const lancamentosPorDataCorrigido = {};
    lancamentosUnicos.forEach(item => {
      const dataFormatada = formatDateSafe(item.data_lancamento);
      if (!lancamentosPorDataCorrigido[dataFormatada]) {
        lancamentosPorDataCorrigido[dataFormatada] = [];
      }
      lancamentosPorDataCorrigido[dataFormatada].push(item);
    });
    
    // Para cada data, escolher o lançamento mais relevante
    Object.keys(lancamentosPorDataCorrigido).forEach(data => {
      const lancamentosData = lancamentosPorDataCorrigido[data];
      
      // Priorizar lançamentos editados
      let lancamentoEscolhido = lancamentosData.find(l => l.status_edicao === 'editado_admin');
      
      // Se não há editado, pegar o mais recente
      if (!lancamentoEscolhido) {
        lancamentoEscolhido = lancamentosData.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0];
      }
      
      const valorFinalLancamento = (lancamentoEscolhido.subtotal_atividades || lancamentoEscolhido.valor_tarefas || 0) + (lancamentoEscolhido.bonus_kpis || 0);
      
      historicoCorrigido.push({
        data: data,
        valor: valorFinalLancamento,
        atividade: 'Operador de Empilhadeira',
        turno: lancamentoEscolhido.turno,
        aprovadoPor: lancamentoEscolhido.aprovado_por_nome || lancamentoEscolhido.aprovado_por || 'Sistema',
        status_edicao: lancamentoEscolhido.status_edicao,
        editado_por_admin: lancamentoEscolhido.editado_por_admin,
        data_edicao: lancamentoEscolhido.data_edicao,
        id_original: lancamentoEscolhido.id
      });
    });
    
    console.log(`📈 Histórico corrigido gerado: ${historicoCorrigido.length} entradas`);
    
    // 6. Comparar resultados
    console.log('\n📊 COMPARAÇÃO DE RESULTADOS:');
    console.log(`   Lógica atual: ${historicoAtual.length} entradas`);
    console.log(`   Lógica corrigida: ${historicoCorrigido.length} entradas`);
    console.log(`   Diferença: ${historicoAtual.length - historicoCorrigido.length} entradas removidas`);
    
    // 7. Mostrar detalhes das correções
    if (historicoAtual.length !== historicoCorrigido.length) {
      console.log('\n🔧 CORREÇÕES APLICADAS:');
      
      const datasAtual = new Set(historicoAtual.map(h => h.data));
      const datasCorrigido = new Set(historicoCorrigido.map(h => h.data));
      
      datasAtual.forEach(data => {
        const itensAtual = historicoAtual.filter(h => h.data === data);
        const itensCorrigido = historicoCorrigido.filter(h => h.data === data);
        
        if (itensAtual.length > itensCorrigido.length) {
          console.log(`   📅 ${data}: ${itensAtual.length} → ${itensCorrigido.length} entradas`);
          if (itensCorrigido.length > 0) {
            const itemEscolhido = itensCorrigido[0];
            console.log(`      ✅ Mantido: ID ${itemEscolhido.id_original} (${itemEscolhido.status_edicao || 'original'})`);
          }
        }
      });
    }
    
    console.log('\n✅ Teste de correção concluído!');
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

// Executar o teste
testarCorrecaoDuplicacao();