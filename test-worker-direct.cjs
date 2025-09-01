const { createServer } = require('http');
const path = require('path');

async function testWorker() {
  try {
    console.log('Testando carregamento do worker...');
    
    // Tentar carregar o worker
    const workerPath = path.join(__dirname, 'src', 'worker', 'supabase-worker.js');
    console.log('Caminho do worker:', workerPath);
    
    const worker = require(workerPath);
    console.log('Worker carregado:', !!worker);
    console.log('Worker default:', !!worker.default);
    
    if (worker.default) {
      console.log('Testando rota /api/health...');
      
      // Criar um servidor simples para testar
      const server = createServer(async (req, res) => {
        try {
          const url = new URL(req.url, 'http://localhost:3000');
          const request = new Request(url.toString(), {
            method: req.method,
            headers: req.headers
          });
          
          const env = {
            SUPABASE_URL: process.env.SUPABASE_URL || 'test',
            SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || 'test'
          };
          
          const response = await worker.default.fetch(request, env);
          const text = await response.text();
          
          res.writeHead(response.status, Object.fromEntries(response.headers.entries()));
          res.end(text);
        } catch (error) {
          console.error('Erro no servidor:', error);
          res.writeHead(500);
          res.end(JSON.stringify({ error: error.message }));
        }
      });
      
      server.listen(3001, () => {
        console.log('Servidor de teste rodando na porta 3001');
        console.log('Teste: http://localhost:3001/api/health');
        
        // Fazer uma requisição de teste
        setTimeout(async () => {
          try {
            const fetch = (await import('node-fetch')).default;
            const response = await fetch('http://localhost:3001/api/health');
            const data = await response.text();
            console.log('Resposta do teste:', response.status, data);
          } catch (error) {
            console.error('Erro no teste:', error.message);
          } finally {
            server.close();
            process.exit(0);
          }
        }, 1000);
      });
    }
  } catch (error) {
    console.error('Erro ao carregar worker:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testWorker();