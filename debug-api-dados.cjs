async function debugApiDados() {
  try {
    console.log('🔍 Debugando dados da API...');
    
    // Importar fetch dinamicamente
    const { default: fetch } = await import('node-fetch');
    
    // 1. Buscar usuário específico
    console.log('\n📋 Buscando usuários...');
    const usuarioResponse = await fetch('http://localhost:8888/api/usuarios');
    const usuarios = await usuarioResponse.json();
    const usuario = usuarios.find(u => u.cpf === '699.895.404-20');
    
    if (!usuario) {
      console.log('❌ Usuário não encontrado');
      return;
    }
    
    console.log('✅ Usuário encontrado:');
    console.log('  ID:', usuario.id);
    console.log('  Nome:', usuario.nome);
    console.log('  CPF:', usuario.cpf);
    console.log('  Função:', usuario.funcao);
    
    // 2. Buscar lançamentos
    console.log('\n📊 Buscando lançamentos...');
    const lancamentosResponse = await fetch(`http://localhost:8888/api/lancamentos?usuario_id=${usuario.id}`);
    const lancamentos = await lancamentosResponse.json();
    
    console.log(`Total de lançamentos: ${lancamentos.length}`);
    
    if (lancamentos.length > 0) {
      console.log('\n🔍 Estrutura do primeiro lançamento:');
      const primeiro = lancamentos[0];
      console.log('  ID:', primeiro.id);
      console.log('  Data Lançamento:', primeiro.data_lancamento);
      console.log('  Status:', primeiro.status);
      console.log('  Status Edição:', primeiro.status_edicao);
      console.log('  Editado por Admin:', primeiro.editado_por_admin);
      console.log('  Data Edição:', primeiro.data_edicao);
      console.log('  Aprovado por:', primeiro.aprovado_por);
      console.log('  Todas as propriedades:', Object.keys(primeiro));
    }
    
    // 3. Filtrar apenas aprovados
    const aprovados = lancamentos.filter(l => l.status === 'aprovado');
    console.log(`\n✅ Lançamentos aprovados: ${aprovados.length}`);
    
    if (aprovados.length > 0) {
      console.log('\n📅 Datas dos lançamentos aprovados:');
      aprovados.forEach((lanc, index) => {
        console.log(`  ${index + 1}. ID: ${lanc.id}, Data: ${lanc.data_lancamento}, Status Edição: ${lanc.status_edicao || 'N/A'}`);
      });
    }
    
    // 4. Verificar lançamentos editados
    const editados = lancamentos.filter(l => l.status_edicao === 'editado_admin');
    console.log(`\n✏️ Lançamentos editados: ${editados.length}`);
    
    if (editados.length > 0) {
      editados.forEach((lanc, index) => {
        console.log(`  ${index + 1}. ID: ${lanc.id}, Data: ${lanc.data_lancamento}, Editado por: ${lanc.editado_por_admin}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erro durante o debug:', error.message);
  }
}

debugApiDados();