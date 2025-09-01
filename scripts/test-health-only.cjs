const http = require('http');

// Configuração da API local
const API_BASE = 'http://localhost:5173/.netlify/functions/api';

async function makeRequest(endpoint) {
  return new Promise((resolve, reject) => {
    const url = `${API_BASE}${endpoint}`;
    console.log(`\n🔍 Fazendo requisição para: ${url}`);
    
    http.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`Status: ${res.statusCode}`);
        console.log(`Content-Type: ${res.headers['content-type']}`);
        console.log(`Tamanho da resposta: ${data.length} caracteres`);
        
        if (res.headers['content-type']?.includes('application/json')) {
          try {
            const jsonData = JSON.parse(data);
            resolve({ status: res.statusCode, data: jsonData, isJson: true });
          } catch (error) {
            resolve({ status: res.statusCode, data: data, isJson: false, parseError: error.message });
          }
        } else {
          // Se não é JSON, mostrar apenas o início da resposta
          const preview = data.length > 200 ? data.substring(0, 200) + '...' : data;
          resolve({ status: res.statusCode, data: preview, isJson: false });
        }
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

async function testHealthOnly() {
  console.log('🏥 TESTANDO APENAS HEALTH CHECK');
  console.log('=' .repeat(40));
  
  try {
    // Testar health check
    console.log('\n1. 🔍 Testando /api/health:');
    const healthResponse = await makeRequest('/health');
    console.log(`Status: ${healthResponse.status}`);
    console.log(`É JSON: ${healthResponse.isJson}`);
    
    if (healthResponse.isJson) {
      console.log(`✅ Resposta JSON: ${JSON.stringify(healthResponse.data, null, 2)}`);
    } else {
      console.log(`❌ Resposta não é JSON:`);
      console.log(healthResponse.data);
    }
    
    // Testar diferentes variações da URL
    console.log('\n2. 🔍 Testando variações da URL:');
    
    const urlVariations = [
      '/health',
      '/api/health',
      '/',
      '/api/',
      '/api/kpis',
      '/kpis'
    ];
    
    for (const url of urlVariations) {
      console.log(`\n   Testando: ${url}`);
      const response = await makeRequest(url);
      console.log(`   Status: ${response.status}, JSON: ${response.isJson}`);
      
      if (response.isJson && response.data) {
        console.log(`   ✅ JSON: ${JSON.stringify(response.data)}`);
      } else if (!response.isJson) {
        console.log(`   ❌ HTML/Texto retornado`);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
  }
}

// Executar teste
testHealthOnly();