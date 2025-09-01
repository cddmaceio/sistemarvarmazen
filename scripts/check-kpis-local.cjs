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

async function checkKPIsLocal() {
  console.log('🔍 VERIFICANDO KPIs NO SERVIDOR LOCAL');
  console.log('=' .repeat(50));
  
  try {
    // 1. Health check
    console.log('\n1. Health Check:');
    const healthResponse = await makeRequest('/health');
    console.log(`Status: ${healthResponse.status}`);
    console.log(`Resposta: ${JSON.stringify(healthResponse.data, null, 2)}`);
    
    if (healthResponse.status !== 200) {
      console.log('❌ Servidor local não está respondendo corretamente');
      return;
    }
    
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
    
    // 3. Buscar funções disponíveis
    console.log('\n3. Buscando funções disponíveis:');
    const functionsResponse = await makeRequest('/functions');
    console.log(`Status: ${functionsResponse.status}`);
    
    if (functionsResponse.status === 200 && functionsResponse.data) {
      console.log(`Funções disponíveis: ${Array.isArray(functionsResponse.data) ? functionsResponse.data.length : 0}`);
      if (Array.isArray(functionsResponse.data) && functionsResponse.data.length > 0) {
        console.log('\n📋 Funções encontradas:');
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
    
    // 4. Buscar KPIs disponíveis para função e turno específicos
    console.log('\n4. Buscando KPIs disponíveis para "Ajudante de Armazém" e "Manhã":');
    const kpisAvailableResponse = await makeRequest('/kpis/available?funcao=Ajudante de Armazém&turno=Manhã');
    console.log(`Status: ${kpisAvailableResponse.status}`);
    
    if (kpisAvailableResponse.status === 200 && kpisAvailableResponse.data) {
      const availableKpis = kpisAvailableResponse.data.kpisAtingidos || kpisAvailableResponse.data;
      console.log(`KPIs disponíveis para Ajudante de Armazém (Manhã): ${Array.isArray(availableKpis) ? availableKpis.length : 0}`);
      if (Array.isArray(availableKpis) && availableKpis.length > 0) {
        console.log('\n🎯 KPIs específicos para esta combinação:');
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
    
    // 5. Testar outras combinações de função e turno
    console.log('\n5. Testando outras combinações:');
    const testCombinations = [
      { funcao: 'Ajudante de Armazém', turno: 'Tarde' },
      { funcao: 'Ajudante de Armazém', turno: 'Noite' },
      { funcao: 'Operador de Empilhadeira', turno: 'Manhã' },
      { funcao: 'Conferente', turno: 'Manhã' }
    ];
    
    for (const combo of testCombinations) {
      console.log(`\n   🔍 Testando: ${combo.funcao} - ${combo.turno}`);
      const testResponse = await makeRequest(`/kpis/available?funcao=${encodeURIComponent(combo.funcao)}&turno=${encodeURIComponent(combo.turno)}`);
      console.log(`   Status: ${testResponse.status}`);
      
      if (testResponse.status === 200 && testResponse.data) {
        const testKpis = testResponse.data.kpisAtingidos || testResponse.data;
        console.log(`   KPIs encontrados: ${Array.isArray(testKpis) ? testKpis.length : 0}`);
        if (Array.isArray(testKpis) && testKpis.length > 0) {
          console.log(`   📋 Nomes: ${testKpis.join(', ')}`);
        }
      } else {
        console.log(`   ❌ Erro: ${JSON.stringify(testResponse.data, null, 2)}`);
      }
    }
    
    // 6. Verificar se há dados brutos no banco
    console.log('\n6. 🗃️  VERIFICAÇÃO DIRETA NO BANCO:');
    console.log('Vamos verificar se existem dados de KPI no banco de dados...');
    
    // Simular uma consulta SQL para verificar dados
    console.log('\n   📊 Estrutura esperada da tabela kpis:');
    console.log('   - id (integer)');
    console.log('   - nome_kpi (text)');
    console.log('   - funcao_kpi (text)');
    console.log('   - turno_kpi (text)');
    console.log('   - valor_kpi (numeric)');
    console.log('   - tipo_kpi (text)');
    console.log('   - meta_minima (numeric)');
    console.log('   - meta_maxima (numeric)');
    
  } catch (error) {
    console.error('❌ Erro durante a verificação:', error.message);
  }
}

// Executar verificação
checkKPIsLocal();