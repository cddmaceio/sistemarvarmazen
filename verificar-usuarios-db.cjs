// Script para verificar usuários no banco de dados
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verificarUsuarios() {
  console.log('🔍 VERIFICANDO USUÁRIOS NO BANCO DE DADOS');
  console.log('=' .repeat(50));
  
  try {
    // 1. Verificar todos os usuários
    console.log('\n1️⃣ Buscando todos os usuários...');
    const { data: todosUsuarios, error: errorTodos } = await supabase
      .from('usuarios')
      .select('*');
    
    if (errorTodos) {
      console.log('❌ Erro ao buscar usuários:', errorTodos.message);
      return;
    }
    
    console.log(`✅ Total de usuários encontrados: ${todosUsuarios?.length || 0}`);
    
    if (todosUsuarios && todosUsuarios.length > 0) {
      console.log('\n📋 Estrutura da tabela usuarios:');
      console.log('Colunas:', Object.keys(todosUsuarios[0]).join(', '));
      
      console.log('\n👥 Lista de usuários:');
      todosUsuarios.forEach((user, index) => {
        console.log(`${index + 1}. ${user.nome}`);
        console.log(`   - CPF: ${user.cpf}`);
        console.log(`   - Função: ${user.funcao || 'N/A'}`);
        console.log(`   - Turno: ${user.turno || 'N/A'}`);
        console.log(`   - Role: ${user.role || 'N/A'}`);
        console.log(`   - Tipo: ${user.tipo_usuario || 'N/A'}`);
        console.log(`   - Ativo: ${user.is_active}`);
        console.log(`   - Status: ${user.status_usuario || 'N/A'}`);
        console.log('');
      });
      
      // 2. Verificar colaboradores especificamente
      console.log('\n2️⃣ Buscando colaboradores ativos...');
      
      // Tentar diferentes formas de identificar colaboradores
      const filtrosColaborador = [
        { campo: 'tipo_usuario', valor: 'colaborador' },
        { campo: 'role', valor: 'user' },
        { campo: 'is_active', valor: true }
      ];
      
      for (const filtro of filtrosColaborador) {
        const { data: colaboradores, error } = await supabase
          .from('usuarios')
          .select('*')
          .eq(filtro.campo, filtro.valor);
        
        if (!error && colaboradores) {
          console.log(`   - Por ${filtro.campo} = ${filtro.valor}: ${colaboradores.length} usuários`);
          if (colaboradores.length > 0) {
            colaboradores.slice(0, 3).forEach(user => {
              console.log(`     * ${user.nome} (${user.funcao || 'sem função'})`);
            });
          }
        }
      }
      
      // 3. Verificar administradores
      console.log('\n3️⃣ Buscando administradores...');
      
      const filtrosAdmin = [
        { campo: 'tipo_usuario', valor: 'administrador' },
        { campo: 'tipo_usuario', valor: 'admin' },
        { campo: 'role', valor: 'admin' }
      ];
      
      for (const filtro of filtrosAdmin) {
        const { data: admins, error } = await supabase
          .from('usuarios')
          .select('*')
          .eq(filtro.campo, filtro.valor);
        
        if (!error && admins) {
          console.log(`   - Por ${filtro.campo} = ${filtro.valor}: ${admins.length} usuários`);
          if (admins.length > 0) {
            admins.forEach(user => {
              console.log(`     * ${user.nome} (${user.funcao || 'sem função'})`);
            });
          }
        }
      }
      
      // 4. Verificar por função
      console.log('\n4️⃣ Agrupando por função...');
      const funcoes = {};
      todosUsuarios.forEach(user => {
        const funcao = user.funcao || 'Sem função';
        if (!funcoes[funcao]) {
          funcoes[funcao] = [];
        }
        funcoes[funcao].push(user.nome);
      });
      
      Object.entries(funcoes).forEach(([funcao, usuarios]) => {
        console.log(`   - ${funcao}: ${usuarios.length} usuários`);
        usuarios.forEach(nome => console.log(`     * ${nome}`));
      });
      
    } else {
      console.log('❌ Nenhum usuário encontrado na tabela');
    }
    
  } catch (error) {
    console.error('💥 Erro durante a verificação:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Executar a verificação
verificarUsuarios().catch(console.error);