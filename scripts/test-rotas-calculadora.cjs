// Script para testar se todas as rotas necessárias para a calculadora estão funcionando
const BASE_URL = 'http://localhost:8888/.netlify/functions/api';

async function testarRotasCalculadora() {
  console.log('🧪 TESTE DAS ROTAS DA CALCULADORA');
  console.log('=================================\n');

  const testes = [
    {
      nome: 'Health Check',
      url: `${BASE_URL}/health`,
      metodo: 'GET',
      esperado: 'status: ok'
    },
    {
      nome: 'Lista de KPIs',
      url: `${BASE_URL}/kpis`,
      metodo: 'GET',
      esperado: 'array de KPIs'
    },
    {
      nome: 'Lista de Funções',
      url: `${BASE_URL}/functions`,
      metodo: 'GET',
      esperado: 'array de funções'
    },
    {
      nome: 'KPIs Disponíveis por Função/Turno',
      url: `${BASE_URL}/kpis/available?funcao=Ajudante de Armazém&turno=Manhã`,
      metodo: 'GET',
      esperado: 'KPIs filtrados'
    },
    {
      nome: 'Lançamentos Pendentes',
      url: `${BASE_URL}/lancamentos/pendentes`,
      metodo: 'GET',
      esperado: 'array de lançamentos pendentes'
    },
    {
      nome: 'Todos os Lançamentos',
      url: `${BASE_URL}/lancamentos`,
      metodo: 'GET',
      esperado: 'array de lançamentos'
    },
    {
      nome: 'Nomes de Atividades',
      url: `${BASE_URL}/activity-names`,
      metodo: 'GET',
      esperado: 'array de atividades'
    }
  ];

  let sucessos = 0;
  let falhas = 0;

  for (const teste of testes) {
    console.log(`🔍 Testando: ${teste.nome}`);
    console.log(`   URL: ${teste.url}`);
    
    try {
      const response = await fetch(teste.url);
      const status = response.status;
      
      if (status === 200) {
        console.log(`   ✅ Status: ${status} - OK`);
        
        const data = await response.json();
        console.log(`   📊 Dados recebidos:`, typeof data === 'object' ? Object.keys(data) : data);
        
        // Verificações específicas
        if (teste.nome === 'Lista de KPIs' && data.kpisAtingidos) {
          console.log(`   📋 Total de KPIs: ${data.kpisAtingidos.length}`);
        }
        
        if (teste.nome === 'Lista de Funções' && Array.isArray(data)) {
          console.log(`   👥 Total de funções: ${data.length}`);
        }
        
        if (teste.nome === 'KPIs Disponíveis por Função/Turno' && data.kpisAtingidos) {
          console.log(`   🎯 KPIs disponíveis: ${data.kpisAtingidos.length}`);
        }
        
        if (teste.nome === 'Lançamentos Pendentes' && Array.isArray(data)) {
          console.log(`   📝 Lançamentos pendentes: ${data.length}`);
        }
        
        sucessos++;
      } else {
        console.log(`   ❌ Status: ${status} - ERRO`);
        const errorText = await response.text();
        console.log(`   💥 Erro: ${errorText}`);
        falhas++;
      }
    } catch (error) {
      console.log(`   💥 Erro de conexão: ${error.message}`);
      falhas++;
    }
    
    console.log('');
  }

  console.log('📊 RESUMO DOS TESTES');
  console.log('====================');
  console.log(`✅ Sucessos: ${sucessos}`);
  console.log(`❌ Falhas: ${falhas}`);
  console.log(`📈 Taxa de sucesso: ${((sucessos / (sucessos + falhas)) * 100).toFixed(1)}%`);
  
  if (falhas === 0) {
    console.log('\n🎉 TODOS OS TESTES PASSARAM! A calculadora deve estar funcionando corretamente.');
  } else {
    console.log('\n⚠️  ALGUNS TESTES FALHARAM. Verifique os erros acima.');
  }
}

// Executar os testes
testarRotasCalculadora().catch(console.error);