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
    nome: 'Test User Gemini',
    cpf: `123.456.789-${Math.floor(Math.random() * 100)}`, // CPF aleatório para evitar duplicatas
    data_nascimento: '1995-01-01',
    funcao: 'Testador',
    turno: 'Tarde',
  };

  const { data, error } = await supabase
    .from('usuarios')
    .insert(newUser)
    .select()
    .single();

  if (error) {
    console.error('Error creating user:', error);
    return;
  }

  console.log('✅ User created successfully:');
  console.log(data);
  return data;
}

createUser();