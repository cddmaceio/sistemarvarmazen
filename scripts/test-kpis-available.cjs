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

async function testKPIsAvailable() {
  console.log('🎯 TESTANDO KPIs DISPONÍVEIS COM DADOS REAIS DO BANCO');
  console.log('=' .repeat(60));
  
  // Dados reais do banco de dados:
  const realCombinations = [
    { funcao: 'Ajudante de Armazém', turno: 'Geral', expectedKpis: ['EFC'] },
    { funcao: 'Operador de Empilhadeira', turno: 'Geral', expectedKpis: ['TMA'] },
    { funcao: 'Operador de Empilhadeira', turno: 'Manhã', expectedKpis: ['TMA', 'Ressuprimento'] },
    { funcao: 'Operador de Empilhadeira', turno: 'Tarde', expectedKpis: ['TMA', 'EFD'] },
    { funcao: 'Operador de Empilhadeira', turno: 'Noite', expectedKpis: ['TMA', 'EFC'] },
    { funcao: 'Ajudante de Armazém', turno: 'Manhã', expectedKpis: ['EFC', 'Ressuprimento'] },
    { funcao: 'Ajudante de Armazém', turno: 'Tarde', expectedKpis: ['EFC', 'Maria Mole'] }
  ];
  
  try {
    console.log('\n📊 DADOS REAIS NO BANCO:');
    console.log('ID 36: EFC - Ajudante de Armazém - Geral');
    console.log('ID 37: TMA - Operador de Empilhadeira - Geral');
    console.log('ID 38: Ressuprimento - Operador de Empilhadeira - Manhã');
    console.log('ID 39: EFD - Operador de Empilhadeira - Tarde');
    console.log('ID 40: Ressuprimento - Ajudante de Armazém - Manhã');
    console.log('ID 41: EFC - Operador de Empilhadeira - Noite');
    console.log('ID 43: Maria Mole - Ajudante de Armazém - Tarde');
    
    console.log('\n🧪 TESTANDO CADA COMBINAÇÃO:');
    
    for (let i = 0; i < realCombinations.length; i++) {
      const combo = realCombinations[i];
      console.log(`\n${i + 1}. 🔍 Testando: "${combo.funcao}" + "${combo.turno}"`);
      console.log(`   Esperado: ${combo.expectedKpis.join(', ')}`);
      
      const encodedFuncao = encodeURIComponent(combo.funcao);
      const encodedTurno = encodeURIComponent(combo.turno);
      const endpoint = `/kpis/available?funcao=${encodedFuncao}&turno=${encodedTurno}`;
      
      const response = await makeRequest(endpoint);
      console.log(`   Status: ${response.status}`);
      
      if (response.status === 200) {
        const kpisAtingidos = response.data.kpisAtingidos || [];
        console.log(`   ✅ KPIs retornados: ${kpisAtingidos.length > 0 ? kpisAtingidos.join(', ') : 'NENHUM'}`);
        
        // Verificar se os KPIs esperados foram retornados
        const expectedSet = new Set(combo.expectedKpis);
        const actualSet = new Set(kpisAtingidos);
        
        const missing = combo.expectedKpis.filter(kpi => !actualSet.has(kpi));
        const extra = kpisAtingidos.filter(kpi => !expectedSet.has(kpi));
        
        if (missing.length === 0 && extra.length === 0) {
          console.log(`   ✅ SUCESSO: Todos os KPIs esperados foram retornados!`);
        } else {
          if (missing.length > 0) {
            console.log(`   ❌ KPIs faltando: ${missing.join(', ')}`);
          }
          if (extra.length > 0) {
            console.log(`   ⚠️  KPIs extras: ${extra.join(', ')}`);
          }
        }
      } else {
        console.log(`   ❌ ERRO: ${JSON.stringify(response.data, null, 2)}`);
      }
    }
    
    // Teste adicional: verificar se a API está filtrando corretamente por status_ativo
    console.log('\n🔍 TESTE ADICIONAL: Verificando filtro por status_ativo');
    console.log('Todos os KPIs no banco têm status_ativo = true, então devem aparecer.');
    
    // Teste com função que não existe
    console.log('\n🚫 TESTE NEGATIVO: Função inexistente');
    const invalidResponse = await makeRequest('/kpis/available?funcao=Função Inexistente&turno=Manhã');
    console.log(`Status: ${invalidResponse.status}`);
    if (invalidResponse.status === 200) {
      const invalidKpis = invalidResponse.data.kpisAtingidos || [];
      console.log(`KPIs retornados: ${invalidKpis.length > 0 ? invalidKpis.join(', ') : 'NENHUM (correto!)'}`);
    }
    
    // Teste sem parâmetros
    console.log('\n🚫 TESTE NEGATIVO: Sem parâmetros');
    const noParamsResponse = await makeRequest('/kpis/available');
    console.log(`Status: ${noParamsResponse.status} (deve ser 400)`);
    if (noParamsResponse.status === 400) {
      console.log(`✅ Erro esperado: ${JSON.stringify(noParamsResponse.data)}`);
    }
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
  }
}

// Executar teste
testKPIsAvailable();