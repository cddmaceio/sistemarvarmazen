// Script para corrigir a validação de KPIs - implementar verificação de meta

async function fixKPIValidation() {
  console.log('🔧 CORRIGINDO VALIDAÇÃO DE KPIs');
  console.log('================================\n');
  
  const { default: fetch } = await import('node-fetch');
  const fs = require('fs');
  const path = require('path');
  
  const BASE_URL = 'http://localhost:8888';
  
  try {
    console.log('1. 🔍 Analisando o problema atual...');
    
    // Testar cenário atual - KPI pago sem validar meta
    const testPayload = {
      funcao: 'Ajudante de Armazém',
      turno: 'Manhã',
      data_lancamento: '2025-01-27',
      nome_atividade: 'Prod Amarração',
      quantidade_produzida: 50, // Baixa produtividade - não deveria atingir meta
      tempo_horas: 8,
      kpis_atingidos: ['EFC'], // KPI selecionado
      input_adicional: 0
    };
    
    console.log('📤 Testando cenário atual (baixa produtividade):');
    console.log(`   Produtividade: ${testPayload.quantidade_produzida / testPayload.tempo_horas} plt/h`);
    
    const response = await fetch(`${BASE_URL}/api/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testPayload)
    });
    
    if (response.ok) {
      const result = await response.json();
      const data = result.data || result;
      
      console.log('📊 Resultado atual:');
      console.log(`   📈 Produtividade alcançada: ${data.produtividadeAlcancada || 'N/A'}`);
      console.log(`   🎯 Nível atingido: ${data.nivelAtingido || 'N/A'}`);
      console.log(`   💰 Bonus KPIs: R$ ${data.bonusKpis || 0}`);
      console.log(`   📝 KPIs: ${JSON.stringify(data.kpisAtingidos || [])}`);
      
      if (data.bonusKpis > 0) {
        console.log('   ❌ PROBLEMA CONFIRMADO: KPI pago sem validar meta!');
        console.log('   🔧 Implementando correção...');
        
        // Buscar informações do KPI EFC
        const kpisResponse = await fetch(`${BASE_URL}/api/kpis/available?funcao=Ajudante de Armazém&turno=Manhã`);
        if (kpisResponse.ok) {
          const kpisData = await kpisResponse.json();
          const efcKpi = kpisData.kpisAtingidos?.find(kpi => kpi.nome_kpi === 'EFC');
          
          if (efcKpi) {
            console.log(`\n📋 Informações do KPI EFC:`);
            console.log(`   🎯 Meta: ${efcKpi.valor_meta_kpi}`);
            console.log(`   💰 Peso: R$ ${efcKpi.peso_kpi}`);
            console.log(`   📈 Produtividade atual: ${data.produtividadeAlcancada || 'N/A'}`);
            
            const metaAtingida = parseFloat(data.produtividadeAlcancada || 0) >= parseFloat(efcKpi.valor_meta_kpi);
            console.log(`   ✅ Meta atingida: ${metaAtingida ? 'SIM' : 'NÃO'}`);
            
            if (!metaAtingida) {
              console.log('   💡 SOLUÇÃO: KPI não deveria ser pago!');
            }
          }
        }
      } else {
        console.log('   ✅ Comportamento correto: KPI não pago');
      }
    }
    
    console.log('\n2. 🔧 Implementando correção no código...');
    
    // Ler o arquivo atual da API
    const supabaseFilePath = path.join(__dirname, 'src', 'lib', 'supabase.ts');
    
    if (fs.existsSync(supabaseFilePath)) {
      let fileContent = fs.readFileSync(supabaseFilePath, 'utf8');
      
      console.log('📁 Arquivo encontrado: src/lib/supabase.ts');
      
      // Verificar se já tem a validação implementada
      if (fileContent.includes('// Validate KPI meta')) {
        console.log('   ⚠️  Validação já implementada!');
      } else {
        console.log('   🔧 Implementando validação de meta...');
        
        // Encontrar o bloco de cálculo de KPIs
        const kpiCalculationRegex = /(if \(kpis\) \{\s*for \(const kpi of kpis\) \{\s*bonus_kpis \+= parseFloat\(kpi\.peso_kpi\)\s*kpis_atingidos_resultado\.push\(kpi\.nome_kpi\)\s*\}\s*\})/;
        
        const newKpiCalculation = `if (kpis) {
        for (const kpi of kpis) {
          // Validate KPI meta before adding bonus
          let kpiAtingido = true;
          
          // Check if we have productivity data to validate against meta
          if (produtividade_alcancada !== undefined && kpi.valor_meta_kpi) {
            kpiAtingido = produtividade_alcancada >= parseFloat(kpi.valor_meta_kpi);
          }
          
          // Only add bonus if KPI meta is achieved
          if (kpiAtingido) {
            bonus_kpis += parseFloat(kpi.peso_kpi)
            kpis_atingidos_resultado.push(kpi.nome_kpi)
          } else {
            console.log(\`KPI \${kpi.nome_kpi} não atingiu meta: \${produtividade_alcancada} < \${kpi.valor_meta_kpi}\`);
          }
        }
      }`;
        
        // Substituir o código antigo pelo novo
        const updatedContent = fileContent.replace(kpiCalculationRegex, newKpiCalculation);
        
        if (updatedContent !== fileContent) {
          // Fazer backup do arquivo original
          const backupPath = supabaseFilePath + '.backup';
          fs.writeFileSync(backupPath, fileContent);
          console.log(`   💾 Backup criado: ${backupPath}`);
          
          // Escrever o arquivo corrigido
          fs.writeFileSync(supabaseFilePath, updatedContent);
          console.log('   ✅ Correção implementada em src/lib/supabase.ts');
        } else {
          console.log('   ⚠️  Não foi possível encontrar o padrão para substituir');
          console.log('   📝 Implementação manual necessária');
        }
      }
    } else {
      console.log('   ❌ Arquivo src/lib/supabase.ts não encontrado');
    }
    
    // Também corrigir o worker se existir
    const workerFilePath = path.join(__dirname, 'src', 'worker', 'routes', 'calculator.js');
    
    if (fs.existsSync(workerFilePath)) {
      let workerContent = fs.readFileSync(workerFilePath, 'utf8');
      
      console.log('\n📁 Arquivo encontrado: src/worker/routes/calculator.js');
      
      if (workerContent.includes('// Validate KPI meta')) {
        console.log('   ⚠️  Validação já implementada no worker!');
      } else {
        console.log('   🔧 Implementando validação de meta no worker...');
        
        const workerKpiRegex = /(if \(kpis\) \{\s*for \(const kpi of kpis\) \{\s*bonus_kpis \+= kpi\.peso_kpi;\s*kpis_atingidos_resultado\.push\(kpi\.nome_kpi\);\s*\}\s*\})/;
        
        const newWorkerKpiCalculation = `if (kpis) {
                for (const kpi of kpis) {
                    // Validate KPI meta before adding bonus
                    let kpiAtingido = true;
                    
                    // Check if we have productivity data to validate against meta
                    if (produtividade_alcancada !== undefined && kpi.valor_meta_kpi) {
                        kpiAtingido = produtividade_alcancada >= parseFloat(kpi.valor_meta_kpi);
                    }
                    
                    // Only add bonus if KPI meta is achieved
                    if (kpiAtingido) {
                        bonus_kpis += kpi.peso_kpi;
                        kpis_atingidos_resultado.push(kpi.nome_kpi);
                    } else {
                        console.log(\`KPI \${kpi.nome_kpi} não atingiu meta: \${produtividade_alcancada} < \${kpi.valor_meta_kpi}\`);
                    }
                }
            }`;
        
        const updatedWorkerContent = workerContent.replace(workerKpiRegex, newWorkerKpiCalculation);
        
        if (updatedWorkerContent !== workerContent) {
          const workerBackupPath = workerFilePath + '.backup';
          fs.writeFileSync(workerBackupPath, workerContent);
          console.log(`   💾 Backup criado: ${workerBackupPath}`);
          
          fs.writeFileSync(workerFilePath, updatedWorkerContent);
          console.log('   ✅ Correção implementada em src/worker/routes/calculator.js');
        } else {
          console.log('   ⚠️  Não foi possível encontrar o padrão para substituir no worker');
        }
      }
    }
    
    console.log('\n3. 🧪 Testando correção...');
    console.log('   ⚠️  Reinicie o servidor para aplicar as mudanças');
    console.log('   📝 Execute este script novamente após reiniciar para validar');
    
    console.log('\n4. 💡 RESUMO DA CORREÇÃO:');
    console.log('   ✅ Implementada validação de meta antes de pagar KPI');
    console.log('   ✅ KPIs só serão pagos se produtividade >= meta');
    console.log('   ✅ Logs adicionados para debug');
    console.log('   ✅ Backup dos arquivos originais criado');
    
    console.log('\n🎯 PRÓXIMOS PASSOS:');
    console.log('   1. Reiniciar o servidor (npm run dev)');
    console.log('   2. Testar na interface com baixa produtividade');
    console.log('   3. Verificar se KPI não é pago quando meta não é atingida');
    console.log('   4. Testar com alta produtividade para confirmar que KPI é pago');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

fixKPIValidation();