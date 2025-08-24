const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugKpisField() {
  try {
    console.log('=== DEBUG: CAMPO KPIs_ATINGIDOS ===\n');
    
    // Buscar todos os lançamentos aprovados do Dilson Arlindo em agosto 2025
    const { data: lancamentos, error: lancamentosError } = await supabase
      .from('lancamentos_produtividade')
      .select('*')
      .eq('user_id', 6)
      .eq('status', 'aprovado')
      .gte('data_lancamento', '2025-08-01')
      .lt('data_lancamento', '2025-09-01')
      .order('data_lancamento', { ascending: true });
    
    if (lancamentosError) {
      console.error('Erro ao buscar lançamentos:', lancamentosError);
      return;
    }
    
    console.log(`📋 Total de lançamentos aprovados: ${lancamentos.length}\n`);
    
    let totalKpisContadosFrontend = 0;
    let valorTotalBonusKpis = 0;
    
    console.log('=== ANÁLISE DETALHADA DO CAMPO KPIs_ATINGIDOS ===\n');
    
    lancamentos.forEach((item, index) => {
      console.log(`📋 Lançamento ${index + 1} - ID: ${item.id} | Data: ${item.data_lancamento}`);
      console.log(`   💰 Remuneração Total: R$ ${item.remuneracao_total}`);
      console.log(`   💵 Bonus KPIs (banco): R$ ${item.bonus_kpis || 0}`);
      
      // Analisar o campo kpis_atingidos exatamente como o frontend faz
      console.log(`   🔍 Campo kpis_atingidos (raw):`, item.kpis_atingidos);
      console.log(`   🔍 Tipo do campo:`, typeof item.kpis_atingidos);
      
      let kpisArray = [];
      
      // Simular exatamente a lógica do frontend (linhas 1170-1182)
      if (typeof item.kpis_atingidos === 'string') {
        try {
          kpisArray = JSON.parse(item.kpis_atingidos);
          console.log(`   ✅ Parsed como JSON:`, kpisArray);
        } catch (e) {
          console.log(`   ❌ Erro ao fazer parse JSON:`, e.message);
          kpisArray = [];
        }
      } else if (Array.isArray(item.kpis_atingidos)) {
        kpisArray = item.kpis_atingidos;
        console.log(`   ✅ Já é array:`, kpisArray);
      } else {
        console.log(`   ⚠️  Tipo não reconhecido, usando array vazio`);
      }
      
      const kpisCount = kpisArray.length;
      totalKpisContadosFrontend += kpisCount;
      valorTotalBonusKpis += parseFloat(item.bonus_kpis || 0);
      
      console.log(`   📊 KPIs contados pelo frontend: ${kpisCount}`);
      console.log(`   📝 Array final:`, kpisArray);
      
      // Verificar se há discrepância entre o array e o valor
      if (kpisCount > 0 && (!item.bonus_kpis || item.bonus_kpis === 0)) {
        console.log(`   ⚠️  ALERTA: ${kpisCount} KPIs no array mas bonus_kpis = ${item.bonus_kpis}`);
      }
      
      if (kpisCount === 0 && item.bonus_kpis && item.bonus_kpis > 0) {
        console.log(`   ⚠️  ALERTA: 0 KPIs no array mas bonus_kpis = ${item.bonus_kpis}`);
      }
      
      console.log('');
    });
    
    console.log('=== TOTAIS CALCULADOS COMO O FRONTEND ===\n');
    console.log(`🎯 Total KPIs (contagem frontend): ${totalKpisContadosFrontend}`);
    console.log(`💰 Total Bonus KPIs (soma banco): R$ ${valorTotalBonusKpis.toFixed(2)}`);
    
    console.log('\n=== COMPARAÇÃO COM DASHBOARD ===');
    console.log('Dashboard mostra:');
    console.log('- 21 KPIs = R$ 63,00');
    console.log('');
    console.log('Análise real mostra:');
    console.log(`- ${totalKpisContadosFrontend} KPIs = R$ ${valorTotalBonusKpis.toFixed(2)}`);
    
    // Verificar se bate com os valores do dashboard
    if (totalKpisContadosFrontend === 21) {
      console.log('\n✅ MATCH: O número de KPIs bate com o dashboard!');
      if (Math.abs(valorTotalBonusKpis - 63.00) < 0.01) {
        console.log('✅ MATCH: O valor dos KPIs também bate!');
        console.log('🔍 CONCLUSÃO: Os dados estão corretos, mas há discrepância com nossa análise anterior.');
      } else {
        console.log(`❌ MISMATCH: Valor esperado R$ 63,00, encontrado R$ ${valorTotalBonusKpis.toFixed(2)}`);
      }
    } else {
      console.log(`\n❌ MISMATCH: KPIs esperados 21, encontrados ${totalKpisContadosFrontend}`);
    }
    
    // Análise adicional: verificar se há lançamentos com KPIs que não estamos vendo
    console.log('\n=== ANÁLISE ADICIONAL ===');
    
    const lancamentosComKpis = lancamentos.filter(l => {
      if (typeof l.kpis_atingidos === 'string') {
        try {
          const parsed = JSON.parse(l.kpis_atingidos);
          return Array.isArray(parsed) && parsed.length > 0;
        } catch {
          return false;
        }
      }
      return Array.isArray(l.kpis_atingidos) && l.kpis_atingidos.length > 0;
    });
    
    console.log(`📊 Lançamentos com KPIs: ${lancamentosComKpis.length} de ${lancamentos.length}`);
    
    if (lancamentosComKpis.length > 0) {
      console.log('\n🎯 Lançamentos que têm KPIs:');
      lancamentosComKpis.forEach((l, i) => {
        let kpisArray = [];
        if (typeof l.kpis_atingidos === 'string') {
          try {
            kpisArray = JSON.parse(l.kpis_atingidos);
          } catch {
            kpisArray = [];
          }
        } else if (Array.isArray(l.kpis_atingidos)) {
          kpisArray = l.kpis_atingidos;
        }
        console.log(`   ${i + 1}. ID: ${l.id}, Data: ${l.data_lancamento}, KPIs: [${kpisArray.join(', ')}], Bonus: R$ ${l.bonus_kpis || 0}`);
      });
    } else {
      console.log('\n⚠️  NENHUM lançamento tem KPIs no array!');
      console.log('🔍 Isso explica por que nossa contagem anterior deu 0 KPIs.');
    }
    
  } catch (error) {
    console.error('❌ Erro na análise:', error);
  }
}

debugKpisField();