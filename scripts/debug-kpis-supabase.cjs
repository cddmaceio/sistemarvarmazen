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

async function debugKPIsSupabase() {
  console.log('🐛 DEBUG: INVESTIGANDO PROBLEMA COM KPIs');
  console.log('=' .repeat(50));
  
  try {
    // 1. Primeiro, vamos testar a rota básica /kpis
    console.log('\n1. 📊 Testando rota básica /kpis:');
    const allKpisResponse = await makeRequest('/kpis');
    console.log(`Status: ${allKpisResponse.status}`);
    
    if (allKpisResponse.status === 200) {
      const allKpis = allKpisResponse.data.kpisAtingidos || allKpisResponse.data;
      console.log(`Total de KPIs retornados: ${Array.isArray(allKpis) ? allKpis.length : 'Não é array'}`);
      console.log(`Dados: ${JSON.stringify(allKpis, null, 2)}`);
    } else {
      console.log(`❌ Erro: ${JSON.stringify(allKpisResponse.data, null, 2)}`);
    }
    
    // 2. Testar rota /functions
    console.log('\n2. 🏢 Testando rota /functions:');
    const functionsResponse = await makeRequest('/functions');
    console.log(`Status: ${functionsResponse.status}`);
    
    if (functionsResponse.status === 200) {
      console.log(`Funções: ${JSON.stringify(functionsResponse.data, null, 2)}`);
    } else {
      console.log(`❌ Erro: ${JSON.stringify(functionsResponse.data, null, 2)}`);
    }
    
    // 3. Testar casos específicos com debug
    console.log('\n3. 🔍 Testando casos específicos com parâmetros exatos do banco:');
    
    const testCases = [
      {
        name: 'Caso 1: Ajudante de Armazém + Geral',
        funcao: 'Ajudante de Armazém',
        turno: 'Geral',
        expected: 'EFC'
      },
      {
        name: 'Caso 2: Operador de Empilhadeira + Geral', 
        funcao: 'Operador de Empilhadeira',
        turno: 'Geral',
        expected: 'TMA'
      },
      {
        name: 'Caso 3: Ajudante de Armazém + Manhã',
        funcao: 'Ajudante de Armazém',
        turno: 'Manhã',
        expected: 'EFC (Geral) + Ressuprimento (Manhã)'
      }
    ];
    
    for (const testCase of testCases) {
      console.log(`\n   ${testCase.name}:`);
      console.log(`   Função: "${testCase.funcao}"`);
      console.log(`   Turno: "${testCase.turno}"`);
      console.log(`   Esperado: ${testCase.expected}`);
      
      const encodedFuncao = encodeURIComponent(testCase.funcao);
      const encodedTurno = encodeURIComponent(testCase.turno);
      
      const response = await makeRequest(`/kpis/available?funcao=${encodedFuncao}&turno=${encodedTurno}`);
      console.log(`   Status: ${response.status}`);
      console.log(`   Resposta completa: ${JSON.stringify(response.data, null, 2)}`);
    }
    
    // 4. Testar sem parâmetros para verificar validação
    console.log('\n4. ❌ Testando validação (sem parâmetros):');
    const noParamsResponse = await makeRequest('/kpis/available');
    console.log(`Status: ${noParamsResponse.status} (deveria ser 400)`);
    console.log(`Resposta: ${JSON.stringify(noParamsResponse.data, null, 2)}`);
    
    // 5. Testar com apenas um parâmetro
    console.log('\n5. ❌ Testando validação (só função):');
    const onlyFuncaoResponse = await makeRequest('/kpis/available?funcao=Ajudante de Armazém');
    console.log(`Status: ${onlyFuncaoResponse.status} (deveria ser 400)`);
    console.log(`Resposta: ${JSON.stringify(onlyFuncaoResponse.data, null, 2)}`);
    
    // 6. Verificar se há problema com encoding
    console.log('\n6. 🔤 Testando diferentes encodings:');
    const encodingTests = [
      {
        name: 'URL Encoded',
        funcao: encodeURIComponent('Ajudante de Armazém'),
        turno: encodeURIComponent('Geral')
      },
      {
        name: 'Sem encoding (pode dar problema)',
        funcao: 'Ajudante de Armazém',
        turno: 'Geral'
      }
    ];
    
    for (const test of encodingTests) {
      console.log(`\n   ${test.name}:`);
      const response = await makeRequest(`/kpis/available?funcao=${test.funcao}&turno=${test.turno}`);
      console.log(`   Status: ${response.status}`);
      console.log(`   KPIs: ${JSON.stringify(response.data, null, 2)}`);
    }
    
    console.log('\n🔍 RESUMO DO DEBUG:');
    console.log('- Se /kpis retorna dados, o Supabase está funcionando');
    console.log('- Se /kpis/available retorna arrays vazios, há problema no filtro');
    console.log('- Se validação não funciona, há problema na lógica de parâmetros');
    console.log('- Verificar se os nomes das funções/turnos estão exatamente iguais no banco');
    
  } catch (error) {
    console.error('❌ Erro durante o debug:', error.message);
  }
}

// Executar debug
debugKPIsSupabase();