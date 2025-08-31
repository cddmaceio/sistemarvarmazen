const https = require('https');
const http = require('http');

console.log('🔍 TESTE DA API /kpis/available');
console.log('=====================================\n');

// Função para fazer requisição HTTP
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const module = urlObj.protocol === 'https:' ? https : http;
    
    const req = module.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    
    req.on('error', (err) => {
      reject(err);
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function testAPI() {
  const baseUrl = 'http://localhost:8888/.netlify/functions/api';
  
  console.log('🌐 Testando API local:', baseUrl);
  console.log();
  
  // Teste 1: Sem parâmetros
  console.log('📋 TESTE 1: Requisição sem parâmetros');
  console.log('=========================================');
  try {
    const response1 = await makeRequest(`${baseUrl}/kpis/available`);
    console.log('Status:', response1.status);
    console.log('Resposta:', JSON.stringify(response1.data, null, 2));
    console.log();
  } catch (error) {
    console.log('❌ Erro:', error.message);
    console.log();
  }
  
  // Teste 2: Com parâmetros válidos
  console.log('📋 TESTE 2: Com função e turno válidos');
  console.log('=======================================');
  try {
    const response2 = await makeRequest(`${baseUrl}/kpis/available?funcao=Ajudante%20de%20Armaz%C3%A9m&turno=Manh%C3%A3`);
    console.log('Status:', response2.status);
    console.log('Resposta:', JSON.stringify(response2.data, null, 2));
    console.log();
  } catch (error) {
    console.log('❌ Erro:', error.message);
    console.log();
  }
  
  // Teste 3: Com diferentes encodings
  console.log('📋 TESTE 3: Testando diferentes encodings');
  console.log('==========================================');
  const testCases = [
    { funcao: 'Ajudante de Armazém', turno: 'Manhã' },
    { funcao: 'ajudante_armazem', turno: 'manha' },
    { funcao: 'Ajudante%20de%20Armaz%C3%A9m', turno: 'Manh%C3%A3' },
    { funcao: 'Operador', turno: 'Tarde' },
    { funcao: 'Supervisor', turno: 'Noite' }
  ];
  
  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`\n🔸 Teste 3.${i + 1}: funcao=${testCase.funcao}, turno=${testCase.turno}`);
    try {
      const encodedFuncao = encodeURIComponent(testCase.funcao);
      const encodedTurno = encodeURIComponent(testCase.turno);
      const response = await makeRequest(`${baseUrl}/kpis/available?funcao=${encodedFuncao}&turno=${encodedTurno}`);
      console.log('   Status:', response.status);
      console.log('   Resposta:', JSON.stringify(response.data, null, 2));
    } catch (error) {
      console.log('   ❌ Erro:', error.message);
    }
  }
  
  console.log('\n✅ TESTE DA API COMPLETO!');
  console.log('===========================');
}

// Executar teste
testAPI().catch(console.error);