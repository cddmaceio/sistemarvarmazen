const axios = require('axios');

// Configuração da API
const API_BASE_URL = 'http://localhost:8888/.netlify/functions/api';

async function testarLogicaCorrigida() {
    console.log('🧪 Testando lógica de cálculo corrigida...');
    console.log('=' .repeat(60));

    try {
        // Teste 1: 1 KPI selecionado + atividade
        console.log('\n📋 Teste 1: 1 KPI + atividade');
        const teste1 = {
            nome_atividade: 'Prod Retorno',
            funcao: 'Operador de Empilhadeira',
            turno: 'Manhã',
            quantidade_produzida: 150,
            tempo_horas: 8,
            input_adicional: 0,
            kpis_atingidos: ['EFC']
        };
        
        const response1 = await axios.post(`${API_BASE_URL}/calculate`, teste1);
        const result1 = response1.data.data;
        
        console.log(`Subtotal atividades: R$ ${result1.subtotalAtividades.toFixed(2)}`);
        console.log(`Bonus KPIs: R$ ${result1.bonusKpis.toFixed(2)} (esperado: R$ 3,00)`);
        console.log(`50% das atividades: R$ ${(result1.subtotalAtividades * 0.5).toFixed(2)}`);
        console.log(`Remuneração total: R$ ${result1.remuneracaoTotal.toFixed(2)}`);
        console.log(`KPIs atingidos: ${result1.kpisAtingidos.join(', ')}`);
        
        // Verificação
        const esperado1 = result1.bonusKpis + (result1.subtotalAtividades * 0.5);
        const correto1 = Math.abs(result1.remuneracaoTotal - esperado1) < 0.01;
        console.log(`✅ Fórmula correta: ${correto1 ? 'SIM' : 'NÃO'}`);
        console.log(`✅ KPI vale R$ 3,00: ${result1.bonusKpis === 3.00 ? 'SIM' : 'NÃO'}`);

        // Teste 2: 2 KPIs selecionados + atividade
        console.log('\n📋 Teste 2: 2 KPIs + atividade');
        const teste2 = {
            nome_atividade: 'Prod Retorno',
            funcao: 'Operador de Empilhadeira',
            turno: 'Manhã',
            quantidade_produzida: 200,
            tempo_horas: 8,
            input_adicional: 0,
            kpis_atingidos: ['EFC', 'TMA']
        };
        
        const response2 = await axios.post(`${API_BASE_URL}/calculate`, teste2);
        const result2 = response2.data.data;
        
        console.log(`Subtotal atividades: R$ ${result2.subtotalAtividades.toFixed(2)}`);
        console.log(`Bonus KPIs: R$ ${result2.bonusKpis.toFixed(2)} (esperado: R$ 6,00)`);
        console.log(`50% das atividades: R$ ${(result2.subtotalAtividades * 0.5).toFixed(2)}`);
        console.log(`Remuneração total: R$ ${result2.remuneracaoTotal.toFixed(2)}`);
        console.log(`KPIs atingidos: ${result2.kpisAtingidos.join(', ')}`);
        
        // Verificação
        const esperado2 = result2.bonusKpis + (result2.subtotalAtividades * 0.5);
        const correto2 = Math.abs(result2.remuneracaoTotal - esperado2) < 0.01;
        console.log(`✅ Fórmula correta: ${correto2 ? 'SIM' : 'NÃO'}`);
        console.log(`✅ 2 KPIs valem R$ 6,00: ${result2.bonusKpis === 6.00 ? 'SIM' : 'NÃO'}`);

        // Teste 3: 3 KPIs selecionados (deve limitar a 2)
        console.log('\n📋 Teste 3: 3 KPIs (limite máximo 2)');
        const teste3 = {
            nome_atividade: 'Prod Retorno',
            funcao: 'Operador de Empilhadeira',
            turno: 'Manhã',
            quantidade_produzida: 100,
            tempo_horas: 8,
            input_adicional: 0,
            kpis_atingidos: ['EFC', 'TMA', 'EFD']
        };
        
        const response3 = await axios.post(`${API_BASE_URL}/calculate`, teste3);
        const result3 = response3.data.data;
        
        console.log(`Subtotal atividades: R$ ${result3.subtotalAtividades.toFixed(2)}`);
        console.log(`Bonus KPIs: R$ ${result3.bonusKpis.toFixed(2)} (esperado: R$ 6,00 - máximo 2 KPIs)`);
        console.log(`50% das atividades: R$ ${(result3.subtotalAtividades * 0.5).toFixed(2)}`);
        console.log(`Remuneração total: R$ ${result3.remuneracaoTotal.toFixed(2)}`);
        console.log(`KPIs atingidos: ${result3.kpisAtingidos.join(', ')} (máximo 2)`);
        
        // Verificação
        const esperado3 = result3.bonusKpis + (result3.subtotalAtividades * 0.5);
        const correto3 = Math.abs(result3.remuneracaoTotal - esperado3) < 0.01;
        console.log(`✅ Fórmula correta: ${correto3 ? 'SIM' : 'NÃO'}`);
        console.log(`✅ Limitou a 2 KPIs: ${result3.bonusKpis === 6.00 && result3.kpisAtingidos.length === 2 ? 'SIM' : 'NÃO'}`);

        // Teste 4: Sem KPIs, apenas atividade
        console.log('\n📋 Teste 4: Sem KPIs, apenas atividade');
        const teste4 = {
            nome_atividade: 'Prod Retorno',
            funcao: 'Operador de Empilhadeira',
            turno: 'Manhã',
            quantidade_produzida: 120,
            tempo_horas: 8,
            input_adicional: 0,
            kpis_atingidos: []
        };
        
        const response4 = await axios.post(`${API_BASE_URL}/calculate`, teste4);
        const result4 = response4.data.data;
        
        console.log(`Subtotal atividades: R$ ${result4.subtotalAtividades.toFixed(2)}`);
        console.log(`Bonus KPIs: R$ ${result4.bonusKpis.toFixed(2)} (esperado: R$ 0,00)`);
        console.log(`50% das atividades: R$ ${(result4.subtotalAtividades * 0.5).toFixed(2)}`);
        console.log(`Remuneração total: R$ ${result4.remuneracaoTotal.toFixed(2)}`);
        
        // Verificação
        const esperado4 = result4.bonusKpis + (result4.subtotalAtividades * 0.5);
        const correto4 = Math.abs(result4.remuneracaoTotal - esperado4) < 0.01;
        console.log(`✅ Fórmula correta: ${correto4 ? 'SIM' : 'NÃO'}`);
        console.log(`✅ Sem KPIs = R$ 0,00: ${result4.bonusKpis === 0.00 ? 'SIM' : 'NÃO'}`);

        // Resumo final
        console.log('\n' + '=' .repeat(60));
        console.log('📊 RESUMO DOS TESTES:');
        console.log(`✅ Teste 1 (1 KPI): ${correto1 && result1.bonusKpis === 3.00 ? 'PASSOU' : 'FALHOU'}`);
        console.log(`✅ Teste 2 (2 KPIs): ${correto2 && result2.bonusKpis === 6.00 ? 'PASSOU' : 'FALHOU'}`);
        console.log(`✅ Teste 3 (limite 2 KPIs): ${correto3 && result3.bonusKpis === 6.00 && result3.kpisAtingidos.length === 2 ? 'PASSOU' : 'FALHOU'}`);
        console.log(`✅ Teste 4 (sem KPIs): ${correto4 && result4.bonusKpis === 0.00 ? 'PASSOU' : 'FALHOU'}`);
        
        const todosPassed = correto1 && result1.bonusKpis === 3.00 && 
                           correto2 && result2.bonusKpis === 6.00 && 
                           correto3 && result3.bonusKpis === 6.00 && result3.kpisAtingidos.length === 2 &&
                           correto4 && result4.bonusKpis === 0.00;
        
        console.log('\n🎯 RESULTADO FINAL:');
        console.log(`${todosPassed ? '✅ TODOS OS TESTES PASSARAM!' : '❌ ALGUNS TESTES FALHARAM!'}`);
        console.log('\n📝 Lógica implementada:');
        console.log('   • Cada KPI selecionado vale R$ 3,00');
        console.log('   • Máximo de 2 KPIs por cálculo');
        console.log('   • Fórmula final: KPIs + 50% das atividades + extras');
        
    } catch (error) {
        console.error('❌ Erro durante o teste:', error.message);
        if (error.response) {
            console.error('Resposta da API:', error.response.data);
        }
    }
}

// Executar o teste
testarLogicaCorrigida();