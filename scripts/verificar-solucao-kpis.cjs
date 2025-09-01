// Script para verificar se o problema dos KPIs foi resolvido
// Usando fetch nativo do Node.js 18+

const BASE_URL = 'http://localhost:8889/.netlify/functions/api';

async function verificarSolucao() {
  console.log('🔍 Verificando se o problema dos KPIs foi resolvido\n');

  try {
    // 1. Verificar se a API está respondendo corretamente
    console.log('1. ✅ Testando conectividade da API...');
    const healthResponse = await fetch(`${BASE_URL}/health`);
    if (healthResponse.status === 200) {
      console.log('   ✅ API está respondendo corretamente');
    } else {
      console.log('   ❌ API não está respondendo');
      return;
    }

    // 2. Verificar se os KPIs estão sendo retornados
    console.log('\n2. ✅ Testando retorno de KPIs...');
    const kpisResponse = await fetch(`${BASE_URL}/kpis`);
    const kpisData = await kpisResponse.json();
    console.log(`   ✅ Total de KPIs retornados: ${kpisData.length}`);
    console.log(`   ✅ KPIs: ${kpisData.join(', ')}`);

    // 3. Verificar se as funções estão sendo retornadas
    console.log('\n3. ✅ Testando retorno de funções...');
    const functionsResponse = await fetch(`${BASE_URL}/functions`);
    const functionsData = await functionsResponse.json();
    console.log(`   ✅ Funções disponíveis: ${functionsData.join(', ')}`);

    // 4. Verificar KPIs específicos por função e turno
    console.log('\n4. ✅ Testando KPIs específicos por função e turno...');
    
    const testCases = [
      { funcao: 'Operador de Empilhadeira', turno: 'Manhã', esperado: ['TMA', 'Ressuprimento'] },
      { funcao: 'Operador de Empilhadeira', turno: 'Tarde', esperado: ['TMA', 'EFD'] },
      { funcao: 'Operador de Empilhadeira', turno: 'Noite', esperado: ['TMA', 'EFC'] },
      { funcao: 'Ajudante de Armazém', turno: 'Manhã', esperado: ['Ressuprimento', 'EFC'] },
      { funcao: 'Ajudante de Armazém', turno: 'Tarde', esperado: ['EFC', 'Maria Mole'] }
    ];

    let todosOsTestesPassaram = true;

    for (const testCase of testCases) {
      const url = `${BASE_URL}/kpis/available?funcao=${encodeURIComponent(testCase.funcao)}&turno=${encodeURIComponent(testCase.turno)}`;
      const response = await fetch(url);
      const data = await response.json();
      
      const kpisRetornados = data.kpisAtingidos || [];
      const kpisEsperados = testCase.esperado;
      
      const todosKpisPresentes = kpisEsperados.every(kpi => kpisRetornados.includes(kpi));
      
      if (todosKpisPresentes && kpisRetornados.length === kpisEsperados.length) {
        console.log(`   ✅ ${testCase.funcao} - ${testCase.turno}: ${kpisRetornados.join(', ')}`);
      } else {
        console.log(`   ❌ ${testCase.funcao} - ${testCase.turno}: Esperado [${kpisEsperados.join(', ')}], Recebido [${kpisRetornados.join(', ')}]`);
        todosOsTestesPassaram = false;
      }
    }

    // 5. Verificar validação de parâmetros
    console.log('\n5. ✅ Testando validação de parâmetros...');
    const noParamsResponse = await fetch(`${BASE_URL}/kpis/available`);
    if (noParamsResponse.status === 400) {
      console.log('   ✅ Validação de parâmetros funcionando corretamente');
    } else {
      console.log('   ❌ Validação de parâmetros não está funcionando');
      todosOsTestesPassaram = false;
    }

    // Resultado final
    console.log('\n' + '='.repeat(60));
    if (todosOsTestesPassaram) {
      console.log('🎉 PROBLEMA RESOLVIDO! Todos os testes passaram.');
      console.log('\n📋 Resumo da solução:');
      console.log('   • O problema era que o servidor estava rodando na porta 5173 (Vite)');
      console.log('   • As funções Netlify precisavam rodar na porta 8889 (Netlify Dev)');
      console.log('   • A pasta functions-build já existia com as funções compiladas');
      console.log('   • Agora a API está respondendo corretamente em http://localhost:8889/.netlify/functions/api');
      console.log('\n🔧 Comandos para reproduzir a solução:');
      console.log('   1. npm run build:functions  # Compilar as funções');
      console.log('   2. netlify dev --port 8889   # Rodar o servidor Netlify');
      console.log('   3. Usar http://localhost:8889/.netlify/functions/api como base URL');
    } else {
      console.log('❌ AINDA HÁ PROBLEMAS. Alguns testes falharam.');
    }
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Erro durante a verificação:', error.message);
  }
}

verificarSolucao();