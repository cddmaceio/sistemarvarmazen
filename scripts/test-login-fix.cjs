const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testLoginFix() {
  console.log('🧪 TESTE - Verificando se o login foi corrigido');
  console.log('=' .repeat(50));
  
  const testCPF = '699.895.404-20';
  const testDataNascimento = '01/11/1990';
  
  console.log(`\n1. Dados de teste:`);
  console.log(`   CPF: ${testCPF}`);
  console.log(`   Data de Nascimento: ${testDataNascimento}`);
  
  // 1. Testar query corrigida diretamente no banco
  console.log('\n2. Testando query corrigida no banco...');
  const { data: user, error } = await supabase
    .from('usuarios')
    .select('*')
    .eq('cpf', testCPF)
    .eq('data_nascimento', '1990-11-01')
    .eq('status_usuario', 'ativo')
    .single();
    
  if (error) {
    console.error(`❌ Query falhou: ${error.message}`);
    return;
  } else {
    console.log(`✅ Query funcionou: ${user?.nome}`);
    console.log(`   ID: ${user.id}`);
    console.log(`   CPF: ${user.cpf}`);
    console.log(`   Status: ${user.status_usuario}`);
    console.log(`   Tipo: ${user.tipo_usuario}`);
  }
  
  // 2. Testar a API após a correção
  console.log('\n3. Testando a API após correção...');
  
  // Aguardar um pouco para garantir que o servidor foi reiniciado
  console.log('   Aguardando 2 segundos para o servidor processar as mudanças...');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  try {
    const response = await fetch('http://localhost:8888/api/auth/login', {
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
    
    if (!response.ok) {
      console.error(`❌ API ainda retorna erro ${response.status}`);
      console.error(`   Resposta: ${responseText}`);
      
      // Tentar com data no formato ISO
      console.log('\n4. Tentando com data no formato ISO...');
      const responseISO = await fetch('http://localhost:8888/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          cpf: testCPF, 
          data_nascimento: '1990-11-01'
        }),
      });
      
      console.log(`   Status da resposta ISO: ${responseISO.status}`);
      const responseISOText = await responseISO.text();
      
      if (!responseISO.ok) {
        console.error(`❌ API ainda falha com formato ISO: ${responseISOText}`);
      } else {
        console.log(`✅ API funciona com formato ISO!`);
        const userData = JSON.parse(responseISOText);
        console.log(`   Usuário logado: ${userData.nome}`);
      }
    } else {
      console.log(`✅ API funcionou corretamente!`);
      const userData = JSON.parse(responseText);
      console.log(`   Usuário logado: ${userData.nome}`);
    }
  } catch (error) {
    console.error(`❌ Erro ao chamar API: ${error.message}`);
  }
  
  // 3. Verificar se há outros problemas de formato de data
  console.log('\n5. Verificando formatos de data aceitos...');
  const dateFormats = [
    { format: 'DD/MM/YYYY', value: '01/11/1990' },
    { format: 'YYYY-MM-DD', value: '1990-11-01' },
    { format: 'MM/DD/YYYY', value: '11/01/1990' }
  ];
  
  for (const dateTest of dateFormats) {
    try {
      const response = await fetch('http://localhost:8888/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          cpf: testCPF, 
          data_nascimento: dateTest.value
        }),
      });
      
      if (response.ok) {
        console.log(`   ✅ ${dateTest.format} (${dateTest.value}): FUNCIONA`);
      } else {
        console.log(`   ❌ ${dateTest.format} (${dateTest.value}): FALHA`);
      }
    } catch (error) {
      console.log(`   ❌ ${dateTest.format} (${dateTest.value}): ERRO - ${error.message}`);
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('🏁 TESTE concluído!');
  console.log('\n💡 RECOMENDAÇÕES:');
  console.log('   1. Se a API ainda falha, reinicie o servidor Netlify');
  console.log('   2. Verifique se o formato de data está sendo convertido corretamente');
  console.log('   3. Considere padronizar o formato de data na API');
}

testLoginFix().catch(console.error);