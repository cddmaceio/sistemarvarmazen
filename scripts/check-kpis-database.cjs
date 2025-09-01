const https = require('https');

// Configuração da API
const API_BASE = 'https://sistema-rv-armazem-novo.netlify.app/.netlify/functions/api';

async function makeRequest(endpoint) {
  return new Promise((resolve, reject) => {
    const url = `${API_BASE}${endpoint}`;
    console.log(`\n🔍 Fazendo requisição para: ${url}`);
    
    https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (error) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

async function checkKPIs() {
  console.log('🔍 VERIFICANDO KPIs NO BANCO DE DADOS');
  console.log('=' .repeat(50));
  
  try {
    // 1. Health check
    console.log('\n1. Health Check:');
    const healthResponse = await makeRequest('/health');
    console.log(`Status: ${healthResponse.status}`);
    console.log(`Resposta: ${JSON.stringify(healthResponse.data, null, 2)}`);
    
    // 2. Buscar todos os KPIs
    console.log('\n2. Buscando todos os KPIs:');
    const kpisResponse = await makeRequest('/kpis');
    console.log(`Status: ${kpisResponse.status}`);
    
    if (kpisResponse.status === 200 && kpisResponse.data) {
      // A API retorna { kpisAtingidos: [...] }
      const kpisData = kpisResponse.data.kpisAtingidos || kpisResponse.data;
      console.log(`Total de KPIs encontrados: ${Array.isArray(kpisData) ? kpisData.length : 0}`);
      
      if (Array.isArray(kpisData) && kpisData.length > 0) {
        console.log('\n📊 KPIs disponíveis (nomes):');
        kpisData.forEach((kpiName, index) => {
          console.log(`   ${index + 1}. ${kpiName}`);
        });
      } else {
        console.log('❌ Nenhum KPI encontrado no banco de dados');
        console.log('Estrutura da resposta:', JSON.stringify(kpisResponse.data, null, 2));
      }
    } else {
      console.log(`❌ Erro ao buscar KPIs: ${JSON.stringify(kpisResponse.data, null, 2)}`);
    }
    
    // 3. Buscar KPIs disponíveis para função e turno específicos
    console.log('\n3. Buscando KPIs disponíveis para "Ajudante de Armazém" e "Manhã":');
    const kpisAvailableResponse = await makeRequest('/kpis/available?funcao=Ajudante de Armazém&turno=Manhã');
    console.log(`Status: ${kpisAvailableResponse.status}`);
    
    if (kpisAvailableResponse.status === 200 && kpisAvailableResponse.data) {
      const availableKpis = kpisAvailableResponse.data.kpisAtingidos || kpisAvailableResponse.data;
      console.log(`KPIs disponíveis para Ajudante de Armazém (Manhã): ${Array.isArray(availableKpis) ? availableKpis.length : 0}`);
      if (Array.isArray(availableKpis) && availableKpis.length > 0) {
        availableKpis.forEach((kpiName, index) => {
          console.log(`   ${index + 1}. ${kpiName}`);
        });
      } else {
        console.log('❌ Nenhum KPI disponível para esta combinação');
        console.log('Resposta completa:', JSON.stringify(kpisAvailableResponse.data, null, 2));
      }
    } else {
      console.log(`❌ Erro: ${JSON.stringify(kpisAvailableResponse.data, null, 2)}`);
    }
    
    // 4. Buscar funções disponíveis
    console.log('\n4. Buscando funções disponíveis:');
    const functionsResponse = await makeRequest('/functions');
    console.log(`Status: ${functionsResponse.status}`);
    
    if (functionsResponse.status === 200 && functionsResponse.data) {
      console.log(`Funções disponíveis: ${Array.isArray(functionsResponse.data) ? functionsResponse.data.length : 0}`);
      if (Array.isArray(functionsResponse.data) && functionsResponse.data.length > 0) {
        functionsResponse.data.forEach((funcao, index) => {
          console.log(`   ${index + 1}. ${funcao}`);
        });
      } else {
        console.log('❌ Nenhuma função encontrada');
        console.log('Resposta:', JSON.stringify(functionsResponse.data, null, 2));
      }
    } else {
      console.log(`❌ Erro: ${JSON.stringify(functionsResponse.data, null, 2)}`);
    }
    
    // 5. Testar outras combinações de função e turno
    console.log('\n5. Testando outras combinações:');
    const testCombinations = [
      { funcao: 'Operador de Empilhadeira', turno: 'Tarde' },
      { funcao: 'Conferente', turno: 'Noite' },
      { funcao: 'Ajudante de Armazém', turno: 'Tarde' }
    ];
    
    for (const combo of testCombinations) {
      console.log(`\n   Testando: ${combo.funcao} - ${combo.turno}`);
      const testResponse = await makeRequest(`/kpis/available?funcao=${encodeURIComponent(combo.funcao)}&turno=${encodeURIComponent(combo.turno)}`);
      console.log(`   Status: ${testResponse.status}`);
      
      if (testResponse.status === 200 && testResponse.data) {
        const testKpis = testResponse.data.kpisAtingidos || testResponse.data;
        console.log(`   KPIs encontrados: ${Array.isArray(testKpis) ? testKpis.length : 0}`);
        if (Array.isArray(testKpis) && testKpis.length > 0) {
          console.log(`   Nomes: ${testKpis.join(', ')}`);
        }
      } else {
        console.log(`   Erro: ${JSON.stringify(testResponse.data, null, 2)}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro durante a verificação:', error.message);
  }
}

// Executar verificação
checkKPIs();