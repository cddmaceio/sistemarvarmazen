const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://qcqkfipckcnydsjjdral.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjcWtmaXBja2NueWRzampkcmFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2Mjc3MzcsImV4cCI6MjA3MTIwMzczN30.5Bq-1-TyOugW1-NrkDj_37lCYDvKJNiaRC6vFoWqXZk'
);

async function fixTurnoEncoding() {
  try {
    console.log('Conectado ao Supabase');

    // Verificar valores únicos atuais na coluna turno da tabela usuarios
    console.log('\n=== VALORES ÚNICOS NA TABELA USUARIOS ===');
    const { data: usuariosData, error: usuariosError } = await supabase
      .from('usuarios')
      .select('turno')
      .not('turno', 'is', null);
    
    if (usuariosError) {
      console.error('Erro ao buscar dados de usuarios:', usuariosError);
      return;
    }
    
    const uniqueUsuariosTurnos = [...new Set(usuariosData.map(u => u.turno))];
    console.log('Turnos únicos na tabela usuarios:', uniqueUsuariosTurnos);

    // Verificar valores únicos atuais na coluna turno da tabela lancamentos_produtividade
    console.log('\n=== VALORES ÚNICOS NA TABELA LANCAMENTOS_PRODUTIVIDADE ===');
    const { data: lancamentosData, error: lancamentosError } = await supabase
      .from('lancamentos_produtividade')
      .select('turno')
      .not('turno', 'is', null);
    
    if (lancamentosError) {
      console.error('Erro ao buscar dados de lancamentos:', lancamentosError);
      return;
    }
    
    const uniqueLancamentosTurnos = [...new Set(lancamentosData.map(l => l.turno))];
    console.log('Turnos únicos na tabela lancamentos_produtividade:', uniqueLancamentosTurnos);

    // Corrigir variações de 'manhã' na tabela usuarios
    console.log('\n=== CORRIGINDO TURNOS NA TABELA USUARIOS ===');
    
    // Buscar todos os usuários com turnos que precisam ser corrigidos
    const { data: usuariosToUpdate } = await supabase
      .from('usuarios')
      .select('id, turno')
      .not('turno', 'is', null);
    
    let usuariosManhaCount = 0;
    for (const usuario of usuariosToUpdate) {
      const turnoLower = usuario.turno.toLowerCase().trim();
      if (turnoLower.includes('man') || turnoLower.includes('anh')) {
        await supabase
          .from('usuarios')
          .update({ turno: 'Manhã' })
          .eq('id', usuario.id);
        usuariosManhaCount++;
      }
    }
    console.log(`Registros de manhã atualizados na tabela usuarios: ${usuariosManhaCount}`);

    let usuariosTardeCount = 0;
    let usuariosNoiteCount = 0;
    let usuariosGeralCount = 0;
    
    for (const usuario of usuariosToUpdate) {
      const turnoLower = usuario.turno.toLowerCase().trim();
      if (turnoLower.includes('tard') || turnoLower.includes('ard')) {
        await supabase
          .from('usuarios')
          .update({ turno: 'Tarde' })
          .eq('id', usuario.id);
        usuariosTardeCount++;
      } else if (turnoLower.includes('noit') || turnoLower.includes('oit')) {
        await supabase
          .from('usuarios')
          .update({ turno: 'Noite' })
          .eq('id', usuario.id);
        usuariosNoiteCount++;
      } else if (turnoLower.includes('gera') || turnoLower.includes('era')) {
        await supabase
          .from('usuarios')
          .update({ turno: 'Geral' })
          .eq('id', usuario.id);
        usuariosGeralCount++;
      }
    }
    
    console.log(`Registros de tarde atualizados na tabela usuarios: ${usuariosTardeCount}`);
    console.log(`Registros de noite atualizados na tabela usuarios: ${usuariosNoiteCount}`);
    console.log(`Registros de geral atualizados na tabela usuarios: ${usuariosGeralCount}`);

    // Corrigir variações na tabela lancamentos_produtividade
    console.log('\n=== CORRIGINDO TURNOS NA TABELA LANCAMENTOS_PRODUTIVIDADE ===');
    
    // Buscar todos os lançamentos com turnos que precisam ser corrigidos
    const { data: lancamentosToUpdate } = await supabase
      .from('lancamentos_produtividade')
      .select('id, turno')
      .not('turno', 'is', null);
    
    let lancamentosManhaCount = 0;
    let lancamentosTardeCount = 0;
    let lancamentosNoiteCount = 0;
    let lancamentosGeralCount = 0;
    
    for (const lancamento of lancamentosToUpdate) {
      const turnoLower = lancamento.turno.toLowerCase().trim();
      if (turnoLower.includes('man') || turnoLower.includes('anh')) {
        await supabase
          .from('lancamentos_produtividade')
          .update({ turno: 'Manhã' })
          .eq('id', lancamento.id);
        lancamentosManhaCount++;
      } else if (turnoLower.includes('tard') || turnoLower.includes('ard')) {
        await supabase
          .from('lancamentos_produtividade')
          .update({ turno: 'Tarde' })
          .eq('id', lancamento.id);
        lancamentosTardeCount++;
      } else if (turnoLower.includes('noit') || turnoLower.includes('oit')) {
        await supabase
          .from('lancamentos_produtividade')
          .update({ turno: 'Noite' })
          .eq('id', lancamento.id);
        lancamentosNoiteCount++;
      } else if (turnoLower.includes('gera') || turnoLower.includes('era')) {
        await supabase
          .from('lancamentos_produtividade')
          .update({ turno: 'Geral' })
          .eq('id', lancamento.id);
        lancamentosGeralCount++;
      }
    }
    
    console.log(`Registros de manhã atualizados na tabela lancamentos: ${lancamentosManhaCount}`);
    console.log(`Registros de tarde atualizados na tabela lancamentos: ${lancamentosTardeCount}`);
    console.log(`Registros de noite atualizados na tabela lancamentos: ${lancamentosNoiteCount}`);
    console.log(`Registros de geral atualizados na tabela lancamentos: ${lancamentosGeralCount}`);

    // Verificar os resultados após a correção
    console.log('\n=== RESULTADOS APÓS CORREÇÃO ===');
    
    const { data: finalUsuarios } = await supabase
      .from('usuarios')
      .select('turno')
      .not('turno', 'is', null);
    
    const { data: finalLancamentos } = await supabase
      .from('lancamentos_produtividade')
      .select('turno')
      .not('turno', 'is', null);
    
    const usuariosTurnoCounts = {};
    finalUsuarios.forEach(u => {
      usuariosTurnoCounts[u.turno] = (usuariosTurnoCounts[u.turno] || 0) + 1;
    });
    
    const lancamentosTurnoCounts = {};
    finalLancamentos.forEach(l => {
      lancamentosTurnoCounts[l.turno] = (lancamentosTurnoCounts[l.turno] || 0) + 1;
    });
    
    console.log('Contagem de turnos na tabela usuarios:', usuariosTurnoCounts);
    console.log('Contagem de turnos na tabela lancamentos_produtividade:', lancamentosTurnoCounts);

    // Verificar se ainda existem valores não padronizados
    console.log('\n=== VALORES NÃO PADRONIZADOS RESTANTES ===');
    
    const standardTurnos = ['Manhã', 'Tarde', 'Noite', 'Geral'];
    
    const nonStandardUsuarios = finalUsuarios.filter(u => !standardTurnos.includes(u.turno));
    const nonStandardLancamentos = finalLancamentos.filter(l => !standardTurnos.includes(l.turno));
    
    if (nonStandardUsuarios.length > 0 || nonStandardLancamentos.length > 0) {
      console.log('Valores não padronizados em usuarios:', [...new Set(nonStandardUsuarios.map(u => u.turno))]);
      console.log('Valores não padronizados em lancamentos:', [...new Set(nonStandardLancamentos.map(l => l.turno))]);
    } else {
      console.log('✅ Todos os turnos foram padronizados com sucesso!');
    }

  } catch (error) {
    console.error('Erro ao executar script:', error);
  } finally {
    console.log('\nScript finalizado.');
  }
}

fixTurnoEncoding();