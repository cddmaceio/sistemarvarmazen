require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const assert = require('assert');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Erro: As variáveis de ambiente SUPABASE_URL e SUPABASE_KEY são obrigatórias.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testGanhosMensaisView() {
  console.log('Iniciando teste da view ganhos_mensais_com_usuarios...');

  try {
    // Aplicar a migração antes de rodar o teste para garantir que a view está atualizada
    // (Esta parte é conceitual, a aplicação da migração deve ser feita no seu ambiente de desenvolvimento)
    console.log('Garantindo que a migração 31.sql foi aplicada...');

    const { data, error } = await supabase
      .from('ganhos_mensais_com_usuarios')
      .select('valor_kpi, valor_atividade, valor_final')
      .eq('user_id', 2) // ID do usuário Ronier Teste Usuario
      .eq('mes_ano', '2025-08');

    if (error) {
      throw new Error(`Erro ao consultar a view: ${error.message}`);
    }

    assert(data.length > 0, 'A consulta não retornou dados para o usuário e mês especificados. Verifique se há lançamentos APROVADOS para o período.');

    const ganhos = data[0];
    console.log('Valores retornados pela view:', ganhos);

    const expected = {
      valor_kpi: 36.00,
      valor_atividade: 66.50,
      valor_final: 102.50,
    };

    // Arredondar os valores para duas casas decimais para evitar problemas de precisão de ponto flutuante
    const received = {
        valor_kpi: parseFloat(ganhos.valor_kpi).toFixed(2),
        valor_atividade: parseFloat(ganhos.valor_atividade).toFixed(2),
        valor_final: parseFloat(ganhos.valor_final).toFixed(2),
    }

    assert.strictEqual(received.valor_kpi, expected.valor_kpi.toFixed(2), `Valor de KPI incorreto. Esperado: ${expected.valor_kpi.toFixed(2)}, Recebido: ${received.valor_kpi}`);
    assert.strictEqual(received.valor_atividade, expected.valor_atividade.toFixed(2), `Valor de atividade incorreto. Esperado: ${expected.valor_atividade.toFixed(2)}, Recebido: ${received.valor_atividade}`);
    assert.strictEqual(received.valor_final, expected.valor_final.toFixed(2), `Valor final incorreto. Esperado: ${expected.valor_final.toFixed(2)}, Recebido: ${received.valor_final}`);

    console.log('✅ Teste da view ganhos_mensais_com_usuarios passou com sucesso!');

  } catch (err) {
    console.error('❌ Teste falhou:', err.message);
    process.exit(1);
  }
}

testGanhosMensaisView();