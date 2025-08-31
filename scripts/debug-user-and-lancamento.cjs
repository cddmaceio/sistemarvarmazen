const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL or Anon Key not found. Make sure to have a .env.local file with SUPABASE_URL and SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createUser() {
  console.log('Attempting to create a new user...');
  
  const newUser = {
    nome: 'Test User Gemini Debug',
    cpf: `987.654.321-${Math.floor(Math.random() * 100)}`, // CPF aleatório para evitar duplicatas
    data_nascimento: '1990-01-01',
    funcao: 'Debugger',
    turno: 'Noite',
  };

  const { data, error } = await supabase
    .from('usuarios')
    .insert(newUser)
    .select()
    .single();

  if (error) {
    console.error('Error creating user:', error);
    return null;
  }

  console.log('✅ User created successfully:');
  console.log(data);
  return data;
}

async function testLancamento(user) {
    if (!user || !user.id) {
        console.error('❌ Invalid user provided for test.');
        return;
    }
  console.log(`=== TESTING LANÇAMENTO FOR NEW USER: ${user.id} ===`);

  const url = 'http://localhost:8888/api/lancamentos';

  const payload = {
    data_lancamento: '2025-01-25',
    user_id: user.id,
    calculator_data: {
      funcao: 'Operador de Empilhadeira',
      turno: 'Manhã',
      nome_atividade: 'Paletização',
      quantidade_produzida: 150,
      tempo_horas: 8,
    },
    calculator_result: {
      subtotalAtividades: 150.0,
      bonusKpis: 0,
      remuneracaoTotal: 150.0,
      kpisAtingidos: [],
      produtividade_alcancada: 18.75,
      nivel_atingido: 'Nível 4',
      unidade_medida: 'paletes/hora',
    },
  };

  console.log('Payload a ser enviado:');
  console.log(JSON.stringify(payload, null, 2));

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    console.log(`POST Response status: ${response.status}`);

    const responseBody = await response.json();
    console.log('POST Response body:', JSON.stringify(responseBody, null, 2));

    if (response.status === 201) {
      console.log('✅ Lançamento criado com sucesso!');
    } else {
      console.log(`❌ Falha ao criar lançamento para o usuário ${user.id}.`);
    }
  } catch (error) {
    console.error('Error during fetch:', error);
  }
}

async function main() {
    const newUser = await createUser();
    if (newUser) {
        // Adicionando uma pequena pausa para garantir que o banco de dados tenha tempo de sincronizar
        console.log('Waiting 2 seconds for DB sync...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        await testLancamento(newUser);
    }
}

main();