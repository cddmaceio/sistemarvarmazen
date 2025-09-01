const axios = require('axios');

// Configuração da API
const API_BASE_URL = 'http://localhost:8888/.netlify/functions/api';

async function testKPIFixValidation() {
  console.log('🧪 Testando correção da validação de KPIs...');
  console.log('=' .repeat(60));

  try {
    // Cenário 1: Teste com baixa produtividade (meta não atingida)
    console.log('\n📊 Cenário 1: Baixa produtividade - Meta NÃO atingida');
    console.log('-'.repeat(50));
    
    const testData = {
      funcao: 'Ajudante de Armazém',
      turno: 'Manhã',
      data_inicio: '2024-01-15T06:00:00.000Z',
      data_fim: '2024-01-15T14:00:00.000Z',
      atividades: [
        {
          atividade: 'Separação',
          quantidade: 50,
          tempo_gasto: 8
        }
      ],
      kpis_atingidos: ['EFC']
    };

    console.log('Dados enviados:', JSON.stringify(testData, null, 2));
    
    const response = await axios.post(`${API_BASE_URL}/calculate`, testData);
    const result = response.data;
    
    console.log('\n📈 Resultado do cálculo:');
    console.log(`Produtividade alcançada: ${result.produtividade_alcancada} plt/h`);
    console.log(`Valor bruto atividades: R$ ${result.valor_bruto_atividades}`);
    console.log(`Bonus KPIs: R$ ${result.bonus_kpis}`);
    console.log(`Total estimado: R$ ${result.total_estimado}`);
    
    // Verificar se a correção foi aplicada
    if (result.bonus_kpis === 0) {
      console.log('\n✅ CORREÇÃO APLICADA COM SUCESSO!');
      console.log('   O KPI não foi pago porque a meta não foi atingida.');
    } else {
      console.log('\n❌ CORREÇÃO NÃO APLICADA!');
      console.log(`   O KPI ainda está sendo pago (R$ ${result.bonus_kpis}) mesmo sem atingir a meta.`);
    }

    // Cenário 2: Teste com alta produtividade (meta atingida)
    console.log('\n\n📊 Cenário 2: Alta produtividade - Meta ATINGIDA');
    console.log('-'.repeat(50));
    
    const testDataAlta = {
      funcao: 'Ajudante de Armazém',
      turno: 'Manhã',
      data_inicio: '2024-01-15T06:00:00.000Z',
      data_fim: '2024-01-15T14:00:00.000Z',
      atividades: [
        {
          atividade: 'Separação',
          quantidade: 850,
          tempo_gasto: 8
        }
      ],
      kpis_atingidos: ['EFC']
    };

    console.log('Dados enviados:', JSON.stringify(testDataAlta, null, 2));
    
    const responseAlta = await axios.post(`${API_BASE_URL}/calculate`, testDataAlta);
    const resultAlta = responseAlta.data;
    
    console.log('\n📈 Resultado do cálculo:');
    console.log(`Produtividade alcançada: ${resultAlta.produtividade_alcancada} plt/h`);
    console.log(`Valor bruto atividades: R$ ${resultAlta.valor_bruto_atividades}`);
    console.log(`Bonus KPIs: R$ ${resultAlta.bonus_kpis}`);
    console.log(`Total estimado: R$ ${resultAlta.total_estimado}`);
    
    // Verificar se o KPI é pago quando a meta é atingida
    if (resultAlta.bonus_kpis > 0) {
      console.log('\n✅ VALIDAÇÃO CORRETA!');
      console.log('   O KPI foi pago porque a meta foi atingida.');
    } else {
      console.log('\n❌ PROBLEMA NA VALIDAÇÃO!');
      console.log('   O KPI não foi pago mesmo atingindo a meta.');
    }

    // Cenário 3: Teste sem KPIs selecionados
    console.log('\n\n📊 Cenário 3: Sem KPIs selecionados');
    console.log('-'.repeat(50));
    
    const testDataSemKPI = {
      funcao: 'Ajudante de Armazém',
      turno: 'Manhã',
      data_inicio: '2024-01-15T06:00:00.000Z',
      data_fim: '2024-01-15T14:00:00.000Z',
      atividades: [
        {
          atividade: 'Separação',
          quantidade: 50,
          tempo_gasto: 8
        }
      ],
      kpis_atingidos: []
    };

    const responseSemKPI = await axios.post(`${API_BASE_URL}/calculate`, testDataSemKPI);
    const resultSemKPI = responseSemKPI.data;
    
    console.log(`Bonus KPIs: R$ ${resultSemKPI.bonus_kpis}`);
    
    if (resultSemKPI.bonus_kpis === 0) {
      console.log('✅ Correto: Sem KPIs selecionados = R$ 0,00');
    } else {
      console.log('❌ Erro: Deveria ser R$ 0,00 sem KPIs selecionados');
    }

    // Resumo final
    console.log('\n\n🎯 RESUMO DOS TESTES');
    console.log('=' .repeat(60));
    
    const cenario1OK = result.bonus_kpis === 0;
    const cenario2OK = resultAlta.bonus_kpis > 0;
    const cenario3OK = resultSemKPI.bonus_kpis === 0;
    
    console.log(`Cenário 1 (Meta não atingida): ${cenario1OK ? '✅ PASSOU' : '❌ FALHOU'}`);
    console.log(`Cenário 2 (Meta atingida): ${cenario2OK ? '✅ PASSOU' : '❌ FALHOU'}`);
    console.log(`Cenário 3 (Sem KPIs): ${cenario3OK ? '✅ PASSOU' : '❌ FALHOU'}`);
    
    if (cenario1OK && cenario2OK && cenario3OK) {
      console.log('\n🎉 TODOS OS TESTES PASSARAM!');
      console.log('   A correção da validação de KPIs foi aplicada com sucesso.');
    } else {
      console.log('\n⚠️  ALGUNS TESTES FALHARAM!');
      console.log('   A correção pode não ter sido aplicada corretamente.');
    }

  } catch (error) {
    console.error('❌ Erro ao testar a correção:', error.message);
    if (error.response) {
      console.error('Resposta da API:', error.response.data);
    }
  }
}

// Executar o teste
testKPIFixValidation();