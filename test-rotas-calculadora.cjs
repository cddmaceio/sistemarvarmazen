// Usar import dinâmico para node-fetch

const BASE_URL = 'http://localhost:8888';

const routes = [
  { path: '/api/health', description: 'Health check' },
  { path: '/api/kpis', description: 'Lista de KPIs' },
  { path: '/api/functions', description: 'Lista de funções' },
  { path: '/api/kpis/available?funcao=Operador&turno=Manhã', description: 'KPIs disponíveis' },
  { path: '/api/lancamentos/pendentes', description: 'Lançamentos pendentes' },
  { path: '/api/lancamentos', description: 'Lista de lançamentos' },
  { path: '/api/activity-names', description: 'Nomes das atividades' }
];

async function testRoute(route, fetch) {
  try {
    console.log(`\nTestando: ${route.description}`);
    console.log(`URL: ${BASE_URL}${route.path}`);
    
    const response = await fetch(`${BASE_URL}${route.path}`);
    const status = response.status;
    
    console.log(`Status: ${status}`);
    
    if (status === 200) {
      const data = await response.text();
      const preview = data.length > 200 ? data.substring(0, 200) + '...' : data;
      console.log(`Resposta: ${preview}`);
      return true;
    } else {
      const errorText = await response.text();
      console.log(`Erro: ${errorText}`);
      return false;
    }
  } catch (error) {
    console.log(`Erro de conexão: ${error.message}`);
    return false;
  }
}

async function testAllRoutes() {
  console.log('=== TESTE DAS ROTAS DA CALCULADORA ===\n');
  
  // Importar fetch dinamicamente
  const { default: fetch } = await import('node-fetch');
  
  let successCount = 0;
  const totalRoutes = routes.length;
  
  for (const route of routes) {
    const success = await testRoute(route, fetch);
    if (success) {
      successCount++;
    }
    
    // Aguardar um pouco entre as requisições
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n=== RESUMO ===');
  console.log(`Rotas testadas: ${totalRoutes}`);
  console.log(`Rotas funcionando: ${successCount}`);
  console.log(`Rotas com erro: ${totalRoutes - successCount}`);
  console.log(`Taxa de sucesso: ${((successCount / totalRoutes) * 100).toFixed(1)}%`);
  
  if (successCount === totalRoutes) {
    console.log('\n✅ Todas as rotas estão funcionando!');
    process.exit(0);
  } else {
    console.log('\n❌ Algumas rotas apresentaram problemas.');
    process.exit(1);
  }
}

testAllRoutes().catch(error => {
  console.error('Erro durante os testes:', error);
  process.exit(1);
});