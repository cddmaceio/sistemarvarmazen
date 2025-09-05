// Configuração de desenvolvimento para priorizar Netlify Dev
const { spawn } = require('child_process');
const path = require('path');

// Configurações do ambiente
const config = {
  netlifyPort: 8888,
  vitePort: 5178,
  functionsDir: 'netlify/functions',
  buildDir: 'dist'
};

// Função para iniciar o ambiente de desenvolvimento otimizado
function startDev() {
  console.log('🚀 Iniciando ambiente de desenvolvimento otimizado...');
  console.log(`📡 Netlify Dev: http://localhost:${config.netlifyPort}`);
  console.log(`⚡ Vite Dev: http://localhost:${config.vitePort}`);
  console.log(`🔧 Funções: ${config.functionsDir}`);
  
  // Definir variáveis de ambiente para priorizar Netlify
  process.env.NETLIFY_DEV = 'true';
  process.env.NODE_ENV = 'development';
  process.env.FUNCTIONS_PORT = config.netlifyPort;
  
  console.log('✅ Configuração aplicada - Netlify Dev priorizado');
}

// Função para verificar se as portas estão disponíveis
function checkPorts() {
  const net = require('net');
  
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(config.netlifyPort, () => {
      server.close(() => {
        console.log(`✅ Porta ${config.netlifyPort} disponível para Netlify Dev`);
        resolve(true);
      });
    });
    server.on('error', () => {
      console.log(`⚠️ Porta ${config.netlifyPort} em uso`);
      resolve(false);
    });
  });
}

module.exports = {
  config,
  startDev,
  checkPorts
};

// Se executado diretamente
if (require.main === module) {
  startDev();
}