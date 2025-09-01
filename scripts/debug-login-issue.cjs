const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas!');
  console.error('Verifique se SUPABASE_URL e SUPABASE_ANON_KEY estão configuradas.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debugLoginIssue() {
  console.log('🔍 DEBUG - Investigando problema de login');
  console.log('=' .repeat(50));
  
  const testCPF = '699.895.404-20';
  const testDataNascimento = '01/11/1990';
  
  console.log(`\n1. Testando com dados fornecidos:`);
  console.log(`   CPF: ${testCPF}`);
  console.log(`   Data de Nascimento: ${testDataNascimento}`);
  
  // 1. Verificar se o usuário existe com CPF exato
  console.log('\n2. Buscando usuário por CPF exato...');
  const { data: userByCPF, error: cpfError } = await supabase
    .from('usuarios')
    .select('*')
    .eq('cpf', testCPF);
    
  if (cpfError) {
    console.error(`❌ Erro ao buscar por CPF: ${cpfError.message}`);
  } else {
    console.log(`✅ Usuários encontrados com CPF ${testCPF}: ${userByCPF?.length || 0}`);
    if (userByCPF && userByCPF.length > 0) {
      userByCPF.forEach(user => {
        console.log(`   - ID: ${user.id}, Nome: ${user.nome}`);
        console.log(`   - CPF: ${user.cpf}`);
        console.log(`   - Data Nascimento: ${user.data_nascimento}`);
        console.log(`   - Status: ${user.status_usuario}`);
        console.log(`   - is_active: ${user.is_active}`);
        console.log(`   - Tipo: ${user.tipo_usuario}`);
        console.log('   ---');
      });
    }
  }
  
  // 2. Verificar diferentes formatos de CPF
  console.log('\n3. Testando diferentes formatos de CPF...');
  const cpfFormats = [
    '699.895.404-20',
    '69989540420',
    '699895404-20',
    '699.895.40420'
  ];
  
  for (const cpfFormat of cpfFormats) {
    const { data: users, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('cpf', cpfFormat);
      
    console.log(`   CPF "${cpfFormat}": ${users?.length || 0} usuários encontrados`);
  }
  
  // 3. Verificar diferentes formatos de data
  console.log('\n4. Testando diferentes formatos de data...');
  const dateFormats = [
    '01/11/1990',
    '1990-11-01',
    '1990-11-01T00:00:00.000Z',
    '1990-11-01T00:00:00'
  ];
  
  for (const dateFormat of dateFormats) {
    const { data: users, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('cpf', testCPF)
      .eq('data_nascimento', dateFormat);
      
    console.log(`   Data "${dateFormat}": ${users?.length || 0} usuários encontrados`);
    if (error) {
      console.log(`     Erro: ${error.message}`);
    }
  }
  
  // 4. Testar a query exata do worker (versão simplificada)
  console.log('\n5. Testando query do worker (versão simplificada)...');
  const { data: workerResult, error: workerError } = await supabase
    .from('usuarios')
    .select('*')
    .eq('cpf', testCPF)
    .eq('data_nascimento', testDataNascimento)
    .eq('is_active', true)
    .single();
    
  if (workerError) {
    console.error(`❌ Query do worker falhou: ${workerError.message}`);
    console.error(`   Código: ${workerError.code}`);
  } else {
    console.log(`✅ Query do worker funcionou: ${workerResult?.nome}`);
  }
  
  // 5. Testar a query do supabase.ts (versão complexa)
  console.log('\n6. Testando query do supabase.ts (versão complexa)...');
  
  // Formatar CPF
  const cleanCPF = testCPF.replace(/\D/g, '');
  const formattedCPF = cleanCPF.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  
  // Converter data
  const dateParts = testDataNascimento.split('/');
  const [day, month, year] = dateParts;
  const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  
  console.log(`   CPF formatado: ${formattedCPF}`);
  console.log(`   Data ISO: ${isoDate}`);
  
  const { data: complexResult, error: complexError } = await supabase
    .from('usuarios')
    .select('*')
    .eq('cpf', formattedCPF)
    .eq('status_usuario', 'ativo')
    .filter('data_nascimento::date', 'eq', isoDate)
    .single();
    
  if (complexError) {
    console.error(`❌ Query complexa falhou: ${complexError.message}`);
    console.error(`   Código: ${complexError.code}`);
  } else {
    console.log(`✅ Query complexa funcionou: ${complexResult?.nome}`);
  }
  
  // 6. Verificar todos os usuários ativos
  console.log('\n7. Verificando todos os usuários ativos...');
  const { data: allUsers, error: allError } = await supabase
    .from('usuarios')
    .select('*')
    .eq('is_active', true)
    .order('id');
    
  if (allError) {
    console.error(`❌ Erro ao buscar todos os usuários: ${allError.message}`);
  } else {
    console.log(`✅ Total de usuários ativos: ${allUsers?.length || 0}`);
    if (allUsers && allUsers.length > 0) {
      console.log('\n   Primeiros 5 usuários:');
      allUsers.slice(0, 5).forEach(user => {
        console.log(`   - ${user.id}: ${user.nome} (${user.cpf}) - ${user.data_nascimento}`);
      });
    }
  }
  
  // 7. Testar a API diretamente
  console.log('\n8. Testando a API diretamente...');
  try {
    const response = await fetch('http://localhost:8889/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        cpf: testCPF, 
        data_nascimento: testDataNascimento 
      }),
    });
    
    console.log(`   Status da resposta: ${response.status}`);
    const responseText = await response.text();
    console.log(`   Resposta: ${responseText}`);
    
    if (!response.ok) {
      console.error(`❌ API retornou erro ${response.status}`);
    } else {
      console.log(`✅ API funcionou corretamente`);
    }
  } catch (error) {
    console.error(`❌ Erro ao chamar API: ${error.message}`);
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('🏁 DEBUG concluído!');
}

debugLoginIssue().catch(console.error);