// Teste final da lógica de cálculo corrigida

async function testarLogicaFinalCorrigida() {
  const { default: fetch } = await import('node-fetch');
  
  console.log('🧪 Teste Final da Lógica de Cálculo Corrigida');
  console.log('=' .repeat(60));

  const testes = [
    {
      nome: 'Teste 1: Atividade única + 2 KPIs',
      dados: {
        funcao: 'Ajudante de Armazém',
        turno: 'Manha',
        nome_atividade: 'Prod Amarração',
        quantidade_produzida: 100,
        tempo_horas: 8,
        kpis_atingidos: ['Ressuprimento', 'EFC']
      },
      esperado: {
        subtotalAtividades: 12, // 100 * 0.240 / 2 = 12
        bonusKpis: 6, // 2 KPIs * R$ 3,00 = 6
        remuneracaoTotal: 18 // 12 + 6 = 18
      }
    },
    {
      nome: 'Teste 2: Atividade única + 1 KPI',
      dados: {
        funcao: 'Ajudante de Armazém',
        turno: 'Manha',
        nome_atividade: 'Prod Amarração',
        quantidade_produzida: 80,
        tempo_horas: 8,
        kpis_atingidos: ['Ressuprimento']
      },
      esperado: {
        subtotalAtividades: 8, // 80 * 0.20 / 2 = 8 (Nível 1 - 10 plt/h)
        bonusKpis: 3, // 1 KPI * R$ 3,00 = 3
        remuneracaoTotal: 11 // 8 + 3 = 11
      }
    },
    {
      nome: 'Teste 3: Atividade única sem KPIs',
      dados: {
        funcao: 'Ajudante de Armazém',
        turno: 'Manha',
        nome_atividade: 'Prod Amarração',
        quantidade_produzida: 200,
        tempo_horas: 8,
        kpis_atingidos: []
      },
      esperado: {
        subtotalAtividades: 50, // 200 * 0.500 / 2 = 50 (Nível 5)
        bonusKpis: 0, // 0 KPIs = 0
        remuneracaoTotal: 50 // 50 + 0 = 50
      }
    }
  ];

  let testesPassaram = 0;
  let totalTestes = testes.length;

  for (const teste of testes) {
    console.log(`\n📋 ${teste.nome}`);
    console.log('📤 Dados enviados:', JSON.stringify(teste.dados, null, 2));

    try {
      const response = await fetch('http://localhost:8888/.netlify/functions/api/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(teste.dados)
      });

      if (response.ok) {
        const result = await response.json();
        const data = result.data;

        console.log('📥 Resultado obtido:');
        console.log(`   Subtotal Atividades: R$ ${data.subtotalAtividades.toFixed(2)}`);
        console.log(`   Bonus KPIs: R$ ${data.bonusKpis.toFixed(2)}`);
        console.log(`   Remuneração Total: R$ ${data.remuneracaoTotal.toFixed(2)}`);

        // Validação
        const subtotalCorreto = Math.abs(data.subtotalAtividades - teste.esperado.subtotalAtividades) < 0.01;
        const kpisCorreto = Math.abs(data.bonusKpis - teste.esperado.bonusKpis) < 0.01;
        const totalCorreto = Math.abs(data.remuneracaoTotal - teste.esperado.remuneracaoTotal) < 0.01;

        if (subtotalCorreto && kpisCorreto && totalCorreto) {
          console.log('✅ TESTE PASSOU - Todos os cálculos estão corretos!');
          testesPassaram++;
        } else {
          console.log('❌ TESTE FALHOU:');
          if (!subtotalCorreto) {
            console.log(`   Subtotal esperado: R$ ${teste.esperado.subtotalAtividades}, obtido: R$ ${data.subtotalAtividades}`);
          }
          if (!kpisCorreto) {
            console.log(`   KPIs esperado: R$ ${teste.esperado.bonusKpis}, obtido: R$ ${data.bonusKpis}`);
          }
          if (!totalCorreto) {
            console.log(`   Total esperado: R$ ${teste.esperado.remuneracaoTotal}, obtido: R$ ${data.remuneracaoTotal}`);
          }
        }

        console.log('🔍 Detalhes adicionais:');
        if (data.produtividadeAlcancada) {
          console.log(`   Produtividade: ${data.produtividadeAlcancada} ${data.unidadeMedida}`);
        }
        if (data.nivelAtingido) {
          console.log(`   Nível: ${data.nivelAtingido}`);
        }
        if (data.atividadesDetalhes) {
          console.log(`   Detalhes: ${data.atividadesDetalhes.join(', ')}`);
        }

      } else {
        console.log(`❌ Erro na requisição: ${response.status}`);
        const errorText = await response.text();
        console.log(`   Resposta: ${errorText}`);
      }

    } catch (error) {
      console.log(`❌ Erro na requisição: ${error.message}`);
    }
  }

  console.log('\n' + '=' .repeat(60));
  console.log('🎯 RESUMO DOS TESTES:');
  console.log(`   Testes que passaram: ${testesPassaram}/${totalTestes}`);
  
  if (testesPassaram === totalTestes) {
    console.log('✅ TODOS OS TESTES PASSARAM!');
    console.log('🎉 A lógica de cálculo está funcionando corretamente!');
    console.log('\n📋 Fórmula implementada:');
    console.log('   • Atividades: quantidade_produzida * valor_atividade / 2');
    console.log('   • KPIs: R$ 3,00 por KPI selecionado (máximo 2)');
    console.log('   • Total: Atividades + KPIs + Extras');
  } else {
    console.log('❌ ALGUNS TESTES FALHARAM!');
    console.log('🔧 Verifique os cálculos e corrija os problemas identificados.');
  }
}

testarLogicaFinalCorrigida().catch(console.error);