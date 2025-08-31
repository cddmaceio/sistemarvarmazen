const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugCalculatorKPIs() {
  console.log('🔍 DIAGNÓSTICO DA CALCULADORA DE KPIs\n');
  
  try {
    // 1. Verificar se existem KPIs no banco
    console.log('1. Verificando KPIs no banco de dados...');
    const { data: allKpis, error: kpisError } = await supabase
      .from('kpis')
      .select('*')
      .order('nome_kpi');
    
    if (kpisError) {
      console.error('❌ Erro ao buscar KPIs:', kpisError.message);
      return;
    }
    
    console.log(`✅ Total de KPIs encontrados: ${allKpis?.length || 0}`);
    
    if (allKpis && allKpis.length > 0) {
      console.log('\n📋 KPIs disponíveis:');
      allKpis.forEach(kpi => {
        console.log(`   - ${kpi.nome_kpi} (${kpi.funcao_kpi} - ${kpi.turno_kpi})`);
      });
    }
    
    // 2. Verificar usuários e suas funções
    console.log('\n2. Verificando usuários e suas funções...');
    const { data: users, error: usersError } = await supabase
      .from('usuarios')
      .select('id, nome, funcao, turno, tipo_usuario')
      .limit(5);
    
    if (usersError) {
      console.error('❌ Erro ao buscar usuários:', usersError.message);
    } else {
      console.log(`✅ Usuários encontrados: ${users?.length || 0}`);
      if (users && users.length > 0) {
        console.log('\n👥 Exemplos de usuários:');
        users.forEach(user => {
          console.log(`   - ${user.nome} (${user.funcao} - ${user.turno || 'Sem turno'})`);
        });
      }
    }
    
    // 3. Testar busca de KPIs por função e turno
    console.log('\n3. Testando busca de KPIs por função e turno...');
    
    const testCases = [
      { funcao: 'Ajudante de Armazém', turno: 'Manhã' },
      { funcao: 'Operador de Empilhadeira', turno: 'Tarde' },
      { funcao: 'Conferente', turno: 'Noite' },
      { funcao: 'Ajudante de Armazém', turno: 'Manha' }, // Teste sem acento
    ];
    
    for (const testCase of testCases) {
      console.log(`\n   Testando: ${testCase.funcao} - ${testCase.turno}`);
      
      const { data: availableKpis, error: availableError } = await supabase
        .from('kpis')
        .select('*')
        .eq('funcao_kpi', testCase.funcao)
        .in('turno_kpi', [testCase.turno, 'Geral']);
      
      if (availableError) {
        console.error(`   ❌ Erro: ${availableError.message}`);
      } else {
        console.log(`   ✅ KPIs encontrados: ${availableKpis?.length || 0}`);
        if (availableKpis && availableKpis.length > 0) {
          availableKpis.forEach(kpi => {
            console.log(`      - ${kpi.nome_kpi} (${kpi.turno_kpi})`);
          });
        }
      }
    }
    
    // 4. Verificar estrutura da tabela KPIs
    console.log('\n4. Verificando estrutura da tabela KPIs...');
    if (allKpis && allKpis.length > 0) {
      const firstKpi = allKpis[0];
      console.log('\n📊 Estrutura do primeiro KPI:');
      Object.keys(firstKpi).forEach(key => {
        console.log(`   ${key}: ${typeof firstKpi[key]} = ${firstKpi[key]}`);
      });
    }
    
    // 5. Verificar funções únicas
    console.log('\n5. Verificando funções únicas nos KPIs...');
    const uniqueFunctions = [...new Set(allKpis?.map(k => k.funcao_kpi) || [])];
    console.log('\n🔧 Funções únicas encontradas:');
    uniqueFunctions.forEach(func => {
      console.log(`   - ${func}`);
    });
    
    // 6. Verificar turnos únicos
    console.log('\n6. Verificando turnos únicos nos KPIs...');
    const uniqueShifts = [...new Set(allKpis?.map(k => k.turno_kpi) || [])];
    console.log('\n⏰ Turnos únicos encontrados:');
    uniqueShifts.forEach(shift => {
      console.log(`   - ${shift}`);
    });
    
    // 7. Testar endpoint da API (simulação)
    console.log('\n7. Simulando chamada da API /api/kpis/available...');
    
    const testApiCall = async (funcao, turno) => {
      console.log(`\n   Simulando: GET /api/kpis/available?funcao=${encodeURIComponent(funcao)}&turno=${encodeURIComponent(turno)}`);
      
      // Simular a lógica do endpoint
      const dbFuncao = funcao;
      const dbTurno = turno === 'Manha' ? 'Manhã' : turno;
      
      const { data: kpis, error } = await supabase
        .from('kpis')
        .select('*')
        .eq('funcao_kpi', dbFuncao)
        .in('turno_kpi', [dbTurno, 'Geral']);
      
      if (error) {
        console.error(`   ❌ Erro na simulação: ${error.message}`);
      } else {
        console.log(`   ✅ Resultado: ${kpis?.length || 0} KPIs`);
        if (kpis && kpis.length > 0) {
          kpis.forEach(kpi => {
            console.log(`      - ${kpi.nome_kpi}`);
          });
        }
      }
    };
    
    await testApiCall('Ajudante de Armazém', 'Manhã');
    await testApiCall('Operador de Empilhadeira', 'Tarde');
    
    // 8. Verificar encoding/decoding
    console.log('\n8. Verificando encoding/decoding...');
    
    // Verificar se o arquivo de encoding existe
    const encodingPath = path.join(__dirname, 'src', 'shared', 'utils', 'encoding.ts');
    if (fs.existsSync(encodingPath)) {
      console.log('✅ Arquivo de encoding encontrado');
      
      // Ler o conteúdo do arquivo
      const encodingContent = fs.readFileSync(encodingPath, 'utf8');
      
      // Verificar se contém as constantes necessárias
      if (encodingContent.includes('FUNCAO_DB_TO_UI')) {
        console.log('✅ FUNCAO_DB_TO_UI encontrado');
      } else {
        console.log('❌ FUNCAO_DB_TO_UI não encontrado');
      }
      
      if (encodingContent.includes('TURNO_UI_TO_DB')) {
        console.log('✅ TURNO_UI_TO_DB encontrado');
      } else {
        console.log('❌ TURNO_UI_TO_DB não encontrado');
      }
    } else {
      console.log('❌ Arquivo de encoding não encontrado');
    }
    
    console.log('\n🎯 RESUMO DO DIAGNÓSTICO:');
    console.log('================================');
    console.log(`Total de KPIs: ${allKpis?.length || 0}`);
    console.log(`Funções únicas: ${uniqueFunctions.length}`);
    console.log(`Turnos únicos: ${uniqueShifts.length}`);
    console.log(`Usuários encontrados: ${users?.length || 0}`);
    
    if (allKpis && allKpis.length === 0) {
      console.log('\n⚠️  PROBLEMA IDENTIFICADO: Não há KPIs cadastrados no banco de dados!');
      console.log('   Solução: Cadastrar KPIs através da interface de administração.');
    }
    
    if (uniqueFunctions.length === 0) {
      console.log('\n⚠️  PROBLEMA IDENTIFICADO: Não há funções cadastradas nos KPIs!');
    }
    
  } catch (error) {
    console.error('❌ Erro durante o diagnóstico:', error.message);
  }
}

debugCalculatorKPIs();