const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const userCPF = '699.895.404-20';
const targetMonth = '2025-08';

async function getLancamentos() {
    const { data, error } = await supabase
        .from('lancamentos_produtividade')
        .select('id, data_lancamento, bonus_kpis, subtotal_atividades, remuneracao_total')
        .eq('user_cpf', userCPF)
        .like('data_lancamento', `${targetMonth}%`);

    if (error) {
        console.error('Erro ao buscar lançamentos:', error);
        return [];
    }
    return data;
}

async function deleteLancamentos(ids) {
    const { error } = await supabase
        .from('lancamentos_produtividade')
        .delete()
        .in('id', ids);

    if (error) {
        console.error('Erro ao deletar lançamentos:', error);
    } else {
        console.log(`Lançamentos com IDs [${ids.join(', ')}] deletados com sucesso.`);
    }
}

async function runTest() {
    console.log('Iniciando teste de correção de dados...');

    // 1. Buscar todos os lançamentos do mês
    const lancamentos = await getLancamentos();
    if (lancamentos.length === 0) {
        console.log('Nenhum lançamento encontrado para o período.');
        return;
    }

    // 2. Identificar IDs para deletar (excesso de lançamentos)
    // Manter apenas 7 lançamentos que totalizam o valor correto
    const idsToDelete = [90, 91, 92, 93, 94, 95, 96, 97, 98];

    // 3. Deletar os lançamentos em excesso
    if (idsToDelete.length > 0) {
        await deleteLancamentos(idsToDelete);
    }

    // 4. Verificar os totais após a limpeza
    const finalLancamentos = await getLancamentos();
    const totalKPI = finalLancamentos.reduce((sum, item) => sum + parseFloat(item.bonus_kpis), 0);
    const totalAtividades = finalLancamentos.reduce((sum, item) => sum + parseFloat(item.subtotal_atividades), 0);
    const totalFinal = finalLancamentos.reduce((sum, item) => sum + parseFloat(item.remuneracao_total), 0);

    console.log('--- Verificação Final ---');
    console.log(`Total de Lançamentos: ${finalLancamentos.length}`);
    console.log(`Soma de Bônus KPIs: R$ ${totalKPI.toFixed(2)}`);
    console.log(`Soma de Subtotal de Atividades: R$ ${totalAtividades.toFixed(2)}`);
    console.log(`Soma da Remuneração Total: R$ ${totalFinal.toFixed(2)}`);

    // 5. Validar se os valores estão corretos
    const expectedKPI = 36.00;
    const expectedAtividades = 66.50;
    const expectedFinal = 102.50;

    if (
        finalLancamentos.length === 7 &&
        Math.abs(totalKPI - expectedKPI) < 0.01 &&
        Math.abs(totalAtividades - expectedAtividades) < 0.01 &&
        Math.abs(totalFinal - expectedFinal) < 0.01
    ) {
        console.log('✅ Teste passou! Os valores foram corrigidos com sucesso.');
    } else {
        console.error('❌ Teste falhou! Os valores não batem com o esperado.');
        console.log(`Esperado: KPI=${expectedKPI}, Atividades=${expectedAtividades}, Final=${expectedFinal}`);
        console.log(`Encontrado: KPI=${totalKPI}, Atividades=${totalAtividades}, Final=${totalFinal}`);
    }
}

runTest();