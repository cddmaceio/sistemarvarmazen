// Script simples para testar a aba individual do dashboard
console.log('🔍 Testando aba individual do Dashboard...');

// Função para fazer uma requisição HTTP simples
async function testDashboard() {
  try {
    console.log('🌐 Verificando se o servidor está rodando...');
    
    // Usar fetch nativo do Node.js (disponível a partir do Node 18)
    const response = await fetch('http://localhost:8888');
    
    if (!response.ok) {
      throw new Error(`Servidor retornou status ${response.status}`);
    }
    
    console.log('✅ Servidor está rodando em http://localhost:8888');
    
    // Tentar acessar a página do dashboard
    console.log('🔍 Testando acesso ao dashboard de produtividade...');
    
    const dashboardResponse = await fetch('http://localhost:8888/admin/produtividade');
    
    if (dashboardResponse.ok) {
      console.log('✅ Dashboard acessível');
      
      const html = await dashboardResponse.text();
      
      // Verificar se o conteúdo esperado está presente
      const checks = {
        'Contém "Dashboard de Produtividade"': html.includes('Dashboard de Produtividade'),
        'Contém "Resumo Geral"': html.includes('Resumo Geral'),
        'Contém "Relatório Individual"': html.includes('Relatório Individual'),
        'Contém navegação de abas': html.includes('activeTab'),
        'Contém componente ProductivityDashboard': html.includes('ProductivityDashboard') || html.includes('dashboard-produtividade'),
        'Sem erros de JavaScript visíveis': !html.includes('SyntaxError') && !html.includes('Unexpected token')
      };
      
      console.log('\n📊 Verificações do conteúdo:');
      Object.entries(checks).forEach(([check, result]) => {
        console.log(`${result ? '✅' : '❌'} ${check}`);
      });
      
      // Se alguma verificação falhou, mostrar mais detalhes
      const failedChecks = Object.entries(checks).filter(([_, result]) => !result);
      
      if (failedChecks.length > 0) {
        console.log('\n🚨 Problemas encontrados:');
        failedChecks.forEach(([check]) => {
          console.log(`❌ ${check}`);
        });
        
        // Verificar se é um problema de roteamento
        if (!checks['Contém componente ProductivityDashboard']) {
          console.log('\n💡 Possível problema de roteamento. Verificando rotas disponíveis...');
          
          // Tentar outras rotas comuns
          const routes = ['/', '/dashboard', '/produtividade'];
          
          for (const route of routes) {
            try {
              const routeResponse = await fetch(`http://localhost:8888${route}`);
              if (routeResponse.ok) {
                const routeHtml = await routeResponse.text();
                if (routeHtml.includes('Dashboard de Produtividade') || routeHtml.includes('ProductivityDashboard')) {
                  console.log(`✅ Dashboard encontrado na rota: ${route}`);
                }
              }
            } catch (e) {
              // Ignorar erros de rota
            }
          }
        }
      } else {
        console.log('\n🎉 Todos os checks passaram! A aba individual deveria estar funcionando.');
        console.log('💡 Se a aba não está aparecendo, pode ser um problema de CSS ou JavaScript no frontend.');
      }
      
    } else {
      console.log(`❌ Dashboard não acessível. Status: ${dashboardResponse.status}`);
      
      if (dashboardResponse.status === 404) {
        console.log('💡 Rota não encontrada. Verifique se a rota está configurada corretamente.');
      }
    }
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
    
    if (error.message.includes('ECONNREFUSED') || error.message.includes('fetch failed')) {
      console.log('💡 Servidor não está rodando. Execute: npm run dev');
    }
  }
}

// Executar o teste
testDashboard().then(() => {
  console.log('\n🏁 Teste concluído.');
}).catch(error => {
  console.error('❌ Erro fatal:', error.message);
});