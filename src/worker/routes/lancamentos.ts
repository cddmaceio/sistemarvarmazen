import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { CreateLancamentoSchema } from '../../shared/types';
import { getSupabase, Env } from '../utils';

const lancamentoRoutes = new Hono<{ Bindings: Env }>();

// GET /api/lancamentos
lancamentoRoutes.get('/lancamentos', async (c) => {
  const supabase = getSupabase(c.env);
  
  const { data: lancamentos, error } = await supabase
    .from('lancamentos_produtividade')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return c.json({ error: error.message }, 500);
  }

  return c.json(lancamentos || []);
});

// POST /api/lancamentos
lancamentoRoutes.post('/lancamentos', zValidator('json', CreateLancamentoSchema), async (c) => {
  console.log('SUPABASE_URL from env:', c.env.SUPABASE_URL);
  const supabase = getSupabase(c.env);
  const data = c.req.valid('json');
  const { user_id, data_lancamento, calculator_data, calculator_result } = data;

  // DEBUG: Log received data
  console.log('🔍 LANCAMENTOS DEBUG - Received data:', {
    user_id,
    data_lancamento,
    calculator_data_turno: calculator_data?.turno,
    calculator_data_keys: Object.keys(calculator_data || {}),
    full_calculator_data: calculator_data
  });
  
  // SIMPLE DEBUG TEST
  console.log('=== SIMPLE DEBUG TEST ===');
  console.log('Calculator data turno:', calculator_data.turno);
  console.log('=== END SIMPLE DEBUG TEST ===');

  // 1. Fetch user data
  const { data: userData, error: userError } = await supabase
    .from('usuarios')
    .select('nome, cpf, funcao, turno')
    .eq('id', user_id)
    .single();

  if (userError || !userData) {
    console.error('Error fetching user data:', userError);
    return c.json({ error: 'Usuário não encontrado ou erro ao buscar dados do usuário' }, 404);
  }

  // DEBUG: Log user data
  console.log('🔍 LANCAMENTOS DEBUG - User data:', {
    userData_turno: userData.turno,
    userData_full: userData
  });

  // 2. Check daily KPI limit
  if (calculator_data.kpis_atingidos && calculator_data.kpis_atingidos.length > 0) {
    const { data: existingLancamentos, error: countError } = await supabase
      .from('lancamentos_produtividade')
      .select('id')
      .eq('user_id', user_id)
      .eq('data_lancamento', data_lancamento)
      .neq('status', 'rejeitado');

    if (countError) {
      console.error('Error checking existing lancamentos:', countError);
      return c.json({ error: 'Erro ao verificar lançamentos existentes' }, 500);
    }

    const currentCount = existingLancamentos?.length || 0;
    const dailyLimit = 1; // Maximum 1 KPI launch per day

    if (currentCount >= dailyLimit) {
      return c.json({
        error: 'Limite diário de KPIs atingido',
        message: `Você já atingiu o limite de ${dailyLimit} lançamento(s) de KPI por dia.`,
        current_count: currentCount,
        daily_limit: dailyLimit
      }, 400);
    }
  }

  // 3. Prepare the data for insertion
  const extractedTurno = calculator_data.turno || userData.turno;
  
  // DEBUG: Log turno extraction
  console.log('🔍 LANCAMENTOS DEBUG - Turno extraction:', {
    calculator_data_turno: calculator_data.turno,
    userData_turno: userData.turno,
    extractedTurno: extractedTurno,
    turno_type: typeof extractedTurno,
    turno_is_null: extractedTurno === null,
    turno_is_undefined: extractedTurno === undefined,
    turno_is_empty_string: false // extractedTurno can't be empty string due to type constraints
  });
  
  const newLancamento = {
    user_id,
    user_nome: userData.nome,
    user_cpf: userData.cpf,
    data_lancamento,
    funcao: calculator_data.funcao || userData.funcao,
    turno: extractedTurno,
    
    // Calculator input data
    nome_atividade: calculator_data.nome_atividade,
    quantidade_produzida: calculator_data.quantidade_produzida,
    tempo_horas: calculator_data.tempo_horas,
    input_adicional: calculator_data.input_adicional,
    multiple_activities: calculator_data.multiple_activities ? JSON.stringify(calculator_data.multiple_activities) : undefined,
    nome_operador: calculator_data.nome_operador,
    valid_tasks_count: calculator_data.valid_tasks_count,
    kpis_atingidos: calculator_data.kpis_atingidos ? JSON.stringify(calculator_data.kpis_atingidos) : undefined,
    
    // Calculator results
    subtotal_atividades: calculator_result.subtotalAtividades,
    bonus_kpis: calculator_result.bonusKpis,
    remuneracao_total: calculator_result.remuneracaoTotal,
    produtividade_alcancada: calculator_result.produtividade_alcancada,
    nivel_atingido: calculator_result.nivel_atingido,
    unidade_medida: calculator_result.unidade_medida,
    atividades_detalhes: calculator_result.atividades_detalhes ? JSON.stringify(calculator_result.atividades_detalhes) : undefined,
    tarefas_validas: calculator_result.tarefas_validas,
    valor_tarefas: calculator_result.valor_tarefas,
    valor_bruto_atividades: calculator_result.valor_bruto_atividades,
    
    // Default status
    status: 'pendente',
    status_edicao: 'original',
    
    // Timestamps
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  // DEBUG: Log final object before insertion
  console.log('🔍 LANCAMENTOS DEBUG - Final object before insertion:', {
    turno_value: newLancamento.turno,
    turno_type: typeof newLancamento.turno,
    turno_is_null: newLancamento.turno === null,
    turno_is_undefined: newLancamento.turno === undefined,
    turno_is_empty_string: false, // newLancamento.turno can't be empty string due to type constraints
    full_object_keys: Object.keys(newLancamento)
  });
  
  // Log the object to be inserted for debugging
  console.log('Inserting new lancamento:', JSON.stringify(newLancamento, null, 2));

  // 4. Insert the new lancamento
  const { data: lancamento, error } = await supabase
    .from('lancamentos_produtividade')
    .insert(newLancamento)
    .select()
    .single();

  if (error) {
    console.error('Error inserting lancamento:', error);
    return c.json({
      error: 'Erro ao inserir lançamento: ' + error.message,
      debug_info: {
        received_data: data,
        calculator_data_full: calculator_data,
        userData_full: userData,
        turno_value: newLancamento.turno,
        turno_type: typeof newLancamento.turno,
        calculator_data_turno: calculator_data?.turno,
        userData_turno: userData?.turno,
        extractedTurno: extractedTurno,
        newLancamento_keys: Object.keys(newLancamento),
        all_turno_sources: {
          from_calculator_data: calculator_data?.turno,
          from_user_data: userData?.turno,
          final_extracted: extractedTurno,
          in_new_lancamento: newLancamento.turno
        }
      }
    }, 500);
  }

  return c.json(lancamento, 201);
});

// PUT /api/lancamentos/:id
lancamentoRoutes.put('/lancamentos/:id', async (c) => {
  const supabase = getSupabase(c.env);
  const id = parseInt(c.req.param('id'));
  const { status, observacoes } = await c.req.json();

  const { data: lancamento, error } = await supabase
    .from('lancamentos_produtividade')
    .update({
      status,
      observacoes,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return c.json({ error: error.message }, 500);
  }

  return c.json(lancamento);
});

// DELETE /api/lancamentos/:id
lancamentoRoutes.delete('/lancamentos/:id', async (c) => {
  const supabase = getSupabase(c.env);
  const id = parseInt(c.req.param('id'));

  const { error } = await supabase
    .from('lancamentos_produtividade')
    .delete()
    .eq('id', id);

  if (error) {
    return c.json({ error: error.message }, 500);
  }

  return c.json({ success: true });
});

// GET /api/export-preview
lancamentoRoutes.get('/export-preview', async (c) => {
  const supabase = getSupabase(c.env);
  
  const { data: lancamentos, error } = await supabase
    .from('lancamentos_produtividade')
    .select('*')
    .eq('status', 'aprovado')
    .order('data_lancamento', { ascending: true });

  if (error) {
    return c.json({ error: error.message }, 500);
  }

  return c.json(lancamentos || []);
});

export default lancamentoRoutes;