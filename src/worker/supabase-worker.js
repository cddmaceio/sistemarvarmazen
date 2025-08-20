import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { ActivitySchema, KPISchema, CalculatorInputSchema, UserSchema, LoginSchema, CreateLancamentoSchema, KPILimitCheckSchema } from "../shared/types.js";
import { cors } from 'hono/cors';
import { createClient } from '@supabase/supabase-js';

const app = new Hono();

app.use('*', cors());

// Helper function to get Supabase client
const getSupabase = (env) => {
  console.log('🔧 Supabase configurado:', !!createClient);
  console.log('🔧 Env vars:', { 
    SUPABASE_URL: !!env.SUPABASE_URL, 
    SUPABASE_ANON_KEY: !!env.SUPABASE_ANON_KEY 
  });
  console.log('🔧 URL completa:', env.SUPABASE_URL);
  console.log('🔧 Key (primeiros 20 chars):', env.SUPABASE_ANON_KEY?.substring(0, 20));
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
};

// Authentication endpoints
app.post('/api/auth/login', zValidator('json', LoginSchema), async (c) => {
  const supabase = getSupabase(c.env);
  const { cpf, data_nascimento } = c.req.valid('json');
  
  const { data: user, error } = await supabase
    .from('usuarios')
    .select('*')
    .eq('cpf', cpf)
    .eq('data_nascimento', data_nascimento)
    .eq('is_active', true)
    .single();
  
  if (error || !user) {
    return c.json({ message: 'CPF ou data de nascimento incorretos' }, 401);
  }
  
  return c.json(user);
});

app.post('/api/auth/logout', async (c) => {
  return c.json({ success: true, message: 'Logged out successfully' });
});

// User management endpoints
app.get('/api/usuarios', async (c) => {
  const supabase = getSupabase(c.env);
  const { data: users, error } = await supabase
    .from('usuarios')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    return c.json({ error: error.message }, 500);
  }
  
  return c.json(users || []);
});

app.post('/api/usuarios', zValidator('json', UserSchema), async (c) => {
  const supabase = getSupabase(c.env);
  const data = c.req.valid('json');
  
  const { data: user, error } = await supabase
    .from('usuarios')
    .insert({
      cpf: data.cpf,
      data_nascimento: data.data_nascimento,
      nome: data.nome,
      role: data.role,
      is_active: data.is_active
    })
    .select()
    .single();
  
  if (error) {
    return c.json({ error: error.message }, 500);
  }
  
  return c.json(user);
});

app.put('/api/usuarios/:id', zValidator('json', UserSchema.partial()), async (c) => {
  const supabase = getSupabase(c.env);
  const id = parseInt(c.req.param('id'));
  const data = c.req.valid('json');
  
  const { data: user, error } = await supabase
    .from('usuarios')
    .update({
      ...data,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    return c.json({ error: error.message }, 500);
  }
  
  return c.json(user);
});

app.delete('/api/usuarios/:id', async (c) => {
  const supabase = getSupabase(c.env);
  const id = parseInt(c.req.param('id'));
  
  const { error } = await supabase
    .from('usuarios')
    .delete()
    .eq('id', id);
  
  if (error) {
    return c.json({ error: error.message }, 500);
  }
  
  return c.json({ success: true });
});

// Activities endpoints
app.get('/api/activities', async (c) => {
  const supabase = getSupabase(c.env);
  const { data: activities, error } = await supabase
    .from('activities')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    return c.json({ error: error.message }, 500);
  }
  
  return c.json(activities || []);
});

app.get('/api/activity-names', async (c) => {
  const supabase = getSupabase(c.env);
  const { data: activities, error } = await supabase
    .from('activities')
    .select('nome_atividade')
    .order('nome_atividade');
  
  if (error) {
    return c.json({ error: error.message }, 500);
  }
  
  return c.json(activities?.map(a => a.nome_atividade) || []);
});

app.post('/api/activities', zValidator('json', ActivitySchema), async (c) => {
  const supabase = getSupabase(c.env);
  const data = c.req.valid('json');
  
  const { data: activity, error } = await supabase
    .from('activities')
    .insert(data)
    .select()
    .single();
  
  if (error) {
    return c.json({ error: error.message }, 500);
  }
  
  return c.json(activity);
});

app.put('/api/activities/:id', zValidator('json', ActivitySchema.partial()), async (c) => {
  const supabase = getSupabase(c.env);
  const id = parseInt(c.req.param('id'));
  const data = c.req.valid('json');
  
  const { data: activity, error } = await supabase
    .from('activities')
    .update({
      ...data,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    return c.json({ error: error.message }, 500);
  }
  
  return c.json(activity);
});

app.delete('/api/activities/:id', async (c) => {
  const supabase = getSupabase(c.env);
  const id = parseInt(c.req.param('id'));
  
  const { error } = await supabase
    .from('activities')
    .delete()
    .eq('id', id);
  
  if (error) {
    return c.json({ error: error.message }, 500);
  }
  
  return c.json({ success: true });
});

// KPIs endpoints
app.get('/api/kpis', async (c) => {
  const supabase = getSupabase(c.env);
  const { data: kpis, error } = await supabase
    .from('kpis')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    return c.json({ error: error.message }, 500);
  }
  
  return c.json(kpis || []);
});

app.get('/api/functions', async (c) => {
  const supabase = getSupabase(c.env);
  const { data: kpis, error } = await supabase
    .from('kpis')
    .select('funcao_kpi')
    .order('funcao_kpi');
  
  if (error) {
    return c.json({ error: error.message }, 500);
  }
  
  const uniqueFunctions = [...new Set(kpis?.map(k => k.funcao_kpi) || [])];
  return c.json(uniqueFunctions);
});

app.post('/api/kpis', zValidator('json', KPISchema), async (c) => {
  const supabase = getSupabase(c.env);
  const data = c.req.valid('json');
  
  const { data: kpi, error } = await supabase
    .from('kpis')
    .insert(data)
    .select()
    .single();
  
  if (error) {
    return c.json({ error: error.message }, 500);
  }
  
  return c.json(kpi);
});

app.put('/api/kpis/:id', zValidator('json', KPISchema.partial()), async (c) => {
  const supabase = getSupabase(c.env);
  const id = parseInt(c.req.param('id'));
  const data = c.req.valid('json');
  
  const { data: kpi, error } = await supabase
    .from('kpis')
    .update({
      ...data,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    return c.json({ error: error.message }, 500);
  }
  
  return c.json(kpi);
});

app.delete('/api/kpis/:id', async (c) => {
  const supabase = getSupabase(c.env);
  const id = parseInt(c.req.param('id'));
  
  const { error } = await supabase
    .from('kpis')
    .delete()
    .eq('id', id);
  
  if (error) {
    return c.json({ error: error.message }, 500);
  }
  
  return c.json({ success: true });
});

// KPI available endpoint
app.get('/api/kpis/available', async (c) => {
  const supabase = getSupabase(c.env);
  const funcao = c.req.query('funcao');
  const turno = c.req.query('turno');
  
  if (!funcao || !turno) {
    return c.json({ error: 'Função e turno são obrigatórios' }, 400);
  }
  
  const { data: kpis, error } = await supabase
    .from('kpis')
    .select('*')
    .eq('funcao_kpi', funcao)
    .in('turno_kpi', [turno, 'Geral'])
    .eq('status_ativo', true)
    .order('created_at', { ascending: false })
    .limit(2);
  
  if (error) {
    return c.json({ error: error.message }, 500);
  }
  
  return c.json(kpis || []);
});

// Check KPI daily limit for user
app.post('/api/kpis/check-limit', zValidator('json', KPILimitCheckSchema), async (c) => {
  try {
    const supabase = getSupabase(c.env);
    const { user_id, data_lancamento } = c.req.valid('json');
    
    console.log('KPI Check - user_id:', user_id, 'data_lancamento:', data_lancamento);
    
    // Count KPI launches for the user on the specific date
    const { count, error } = await supabase
      .from('lancamentos_produtividade')
      .select('*', { count: 'exact', head: true })
      .eq('usuario_id', user_id)
      .eq('data_lancamento', data_lancamento);
    
    if (error) {
      console.error('Supabase error:', error);
      return c.json({ error: error.message }, 500);
    }
    
    const total = count || 0;
    const canLaunch = total < 1;
    const remaining = Math.max(0, 1 - total);
    
    console.log('KPI Check result - count:', total, 'canLaunch:', canLaunch);
    
    return c.json({
      can_launch: canLaunch,
      current_count: total,
      remaining_launches: remaining,
      daily_limit: 1
    });
  } catch (err) {
    console.error('KPI Check error:', err);
    return c.json({ error: 'Internal server error', details: err.message }, 500);
  }
});

// Lançamentos endpoints
app.get('/api/lancamentos', async (c) => {
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

app.post('/api/lancamentos', async (c) => {
  try {
    // Manual validation to catch errors
    const body = await c.req.json();
    console.log('Raw body received:', JSON.stringify(body, null, 2));
    
    const validationResult = CreateLancamentoSchema.safeParse(body);
    if (!validationResult.success) {
      console.error('Validation error:', validationResult.error.issues);
      return c.json({ error: 'Validation failed', details: validationResult.error.issues }, 400);
    }
    
    const data = validationResult.data;
    console.log('Validated data:', JSON.stringify(data, null, 2));
    
    const supabase = getSupabase(c.env);
    
    // Get user data for the lancamento
    const { data: userData, error: userError } = await supabase
      .from('usuarios')
      .select('id, nome, cpf')
      .eq('id', data.user_id)
      .single();
    
    if (userError) {
      console.error('User fetch error:', userError);
      return c.json({ error: 'User not found' }, 404);
    }
    
    // Map frontend data to database columns
    const dbData = {
      data_lancamento: data.data_lancamento,
      turno: data.calculator_data.turno,
      quantidade: data.calculator_data.quantidade_produzida || 0,
      usuario_id: data.user_id,
      user_id: data.user_id,
      user_nome: userData.nome,
      user_cpf: userData.cpf,
      funcao: data.calculator_data.funcao,
      nome_atividade: data.calculator_data.nome_atividade,
      quantidade_produzida: data.calculator_data.quantidade_produzida || 0,
      tempo_horas: data.calculator_data.tempo_horas || 0,
      input_adicional: data.calculator_data.input_adicional || 0,
      multiple_activities: data.calculator_data.multiple_activities ? JSON.stringify(data.calculator_data.multiple_activities) : null,
      nome_operador: data.calculator_data.nome_operador || null,
      valid_tasks_count: data.calculator_data.valid_tasks_count || null,
      kpis_atingidos: data.calculator_data.kpis_atingidos ? JSON.stringify(data.calculator_data.kpis_atingidos) : null,
      subtotal_atividades: data.calculator_result.subtotal_atividades || 0,
      bonus_kpis: data.calculator_result.bonus_kpis || 0,
      remuneracao_total: data.calculator_result.remuneracao_total || 0,
      produtividade_alcancada: data.calculator_result.produtividade_alcancada || null,
      nivel_atingido: data.calculator_result.nivel_atingido || null,
      unidade_medida: data.calculator_result.unidade_medida || null,
      atividades_detalhes: data.calculator_result.atividades_detalhes ? JSON.stringify(data.calculator_result.atividades_detalhes) : null,
      tarefas_validas: data.calculator_result.tarefas_validas || null,
      valor_tarefas: data.calculator_result.valor_tarefas || null,
      observacoes: `Atividade: ${data.calculator_data.nome_atividade || 'N/A'}, Função: ${data.calculator_data.funcao}, Tempo: ${data.calculator_data.tempo_horas}h, Remuneração: R$ ${data.calculator_result.remuneracao_total}`,
      status: 'pendente'
    };
    
    console.log('Mapped database data:', JSON.stringify(dbData, null, 2));
    
    const { data: lancamento, error } = await supabase
      .from('lancamentos_produtividade')
      .insert(dbData)
      .select()
      .single();
    
    if (error) {
      console.error('Supabase error:', error);
      return c.json({ error: error.message }, 500);
    }
    
    return c.json(lancamento);
  } catch (err) {
    console.error('Lançamento creation error:', err);
    return c.json({ error: 'Internal server error', details: err.message }, 500);
  }
});

app.put('/api/lancamentos/:id', async (c) => {
  const supabase = getSupabase(c.env);
  const id = parseInt(c.req.param('id'));
  const data = await c.req.json();
  
  const { data: lancamento, error } = await supabase
    .from('lancamentos_produtividade')
    .update({
      ...data,
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

app.delete('/api/lancamentos/:id', async (c) => {
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

// Calculator endpoint
app.post('/api/calculator', async (c) => {
  console.log('Calculator endpoint called');
  
  try {
    const rawBody = await c.req.text();
    console.log('Raw request body:', rawBody);
    
    const parsedBody = JSON.parse(rawBody);
    console.log('Parsed body:', parsedBody);
    
    // Validate manually to get better error messages
    console.log('Schema validation for:', JSON.stringify(parsedBody));
    console.log('Schema definition:', JSON.stringify(CalculatorInputSchema.shape));
    
    const validationResult = CalculatorInputSchema.safeParse(parsedBody);
    if (!validationResult.success) {
      console.log('Validation failed:', JSON.stringify(validationResult.error.format()));
      return c.json({ error: 'Validation failed', details: validationResult.error.format() }, 400);
    }
    
    const input = validationResult.data;
    console.log('Validated input:', input);
    
    const supabase = getSupabase(c.env);
    
    // Get activities and KPIs from Supabase
    const [activitiesResult, kpisResult] = await Promise.all([
    supabase.from('activities').select('*'),
    supabase.from('kpis').select('*').eq('funcao_kpi', input.funcao).eq('turno_kpi', input.turno)
  ]);
  
  if (activitiesResult.error || kpisResult.error) {
    return c.json({ error: 'Erro ao buscar dados' }, 500);
  }
  
  const activities = activitiesResult.data || [];
  const kpis = kpisResult.data || [];
  
  // Calculate productivity (same logic as before)
  let subtotalAtividades = 0;
  let produtividadeAlcancada = 0;
  let nivelAtingido = "Nenhum";
  let unidadeMedida = "";
  let atividadesDetalhes = [];
  let tarefasValidas = 0;
  let valorTarefas = 0;
  
  if (input.multiple_activities && input.multiple_activities.length > 0) {
    for (const selectedActivity of input.multiple_activities) {
      const activity = activities.find(a => a.nome_atividade === selectedActivity.nome_atividade);
      if (activity && selectedActivity.quantidade_produzida > 0) {
        const quantidade = selectedActivity.quantidade_produzida;
        const valor = activity.valor_atividade * quantidade;
        subtotalAtividades += valor;
        
        const produtividade = (quantidade / selectedActivity.tempo_horas) * 60;
        
        let nivel = "Nenhum";
        if (produtividade >= activity.produtividade_minima * 1.5) {
          nivel = "Excelente";
        } else if (produtividade >= activity.produtividade_minima * 1.2) {
          nivel = "Bom";
        } else if (produtividade >= activity.produtividade_minima) {
          nivel = "Satisfatório";
        }
        
        atividadesDetalhes.push({
          nome_atividade: activity.nome_atividade,
          quantidade,
          tempo_horas: selectedActivity.tempo_horas,
          valor,
          produtividade: Math.round(produtividade * 100) / 100,
          nivel
        });
        
        if (nivel !== "Nenhum") {
          tarefasValidas++;
          valorTarefas += valor;
        }
        
        produtividadeAlcancada = Math.max(produtividadeAlcancada, produtividade);
        if (nivel !== "Nenhum" && (nivelAtingido === "Nenhum" || 
            (nivel === "Excelente" && nivelAtingido !== "Excelente") ||
            (nivel === "Bom" && nivelAtingido === "Satisfatório"))) {
          nivelAtingido = nivel;
          unidadeMedida = activity.unidade_medida;
        }
      }
    }
  }
  
  // Calculate KPI bonus
  let bonusKpis = 0;
  let kpisAtingidos = [];
  
  if (input.kpis_atingidos && input.kpis_atingidos.length > 0) {
    for (const kpiName of input.kpis_atingidos) {
      const kpi = kpis.find(k => k.nome_kpi === kpiName);
      if (kpi) {
        bonusKpis += kpi.peso_kpi;
        kpisAtingidos.push(kpiName);
      }
    }
  }
  
  const remuneracaoTotal = subtotalAtividades + bonusKpis + (input.input_adicional || 0);
  
  return c.json({
    subtotalAtividades,
    bonusKpis,
    remuneracaoTotal,
    produtividadeAlcancada: Math.round(produtividadeAlcancada * 100) / 100,
    nivelAtingido,
    unidadeMedida,
    atividadesDetalhes,
    tarefasValidas,
    valorTarefas,
    kpisAtingidos
  });
  
  } catch (error) {
    console.error('Calculator error:', error);
    return c.json({ error: 'Internal server error', details: error.message }, 500);
  }
});

// Endpoint de teste para debug
app.get('/api/test-db', async (c) => {
  const supabase = getSupabase(c.env);
  console.log('🧪 Teste de conexão com DB');
  
  try {
    const { data, error, count } = await supabase
      .from('lancamentos_produtividade')
      .select('*', { count: 'exact' });
    
    console.log('🧪 Resultado do teste:', { 
      count, 
      error, 
      dataLength: data?.length,
      firstRecord: data?.[0]
    });
    
    return c.json({ 
      success: true, 
      count, 
      error, 
      dataLength: data?.length,
      firstRecord: data?.[0]
    });
  } catch (err) {
    console.error('🧪 Erro no teste:', err);
    return c.json({ error: err.message }, 500);
  }
});

// Histórico de aprovações endpoint
app.get('/api/historico-aprovacoes', async (c) => {
  const supabase = getSupabase(c.env);
  console.log('🔧 Supabase configurado (historico):', !!supabase);
  console.log('🔧 Env vars (historico):', { 
    SUPABASE_URL: !!c.env.SUPABASE_URL, 
    SUPABASE_ANON_KEY: !!c.env.SUPABASE_ANON_KEY 
  });
  const colaborador = c.req.query('colaborador');
  const admin = c.req.query('admin');
  const editado = c.req.query('editado');
  
  console.log('🔍 Iniciando busca no historico-aprovacoes');
  console.log('Filtros recebidos:', { colaborador, admin, editado });
  
  // Buscar todos os lançamentos aprovados
  let query = supabase
    .from('lancamentos_produtividade')
    .select('*')
    .eq('status', 'aprovado');
  
  const { data: lancamentos, error } = await query;
  
  console.log('Resultado da consulta:', { count: lancamentos?.length || 0, error });
  
  if (error) {
    console.error('Erro na consulta:', error);
    return c.json({ error: error.message }, 500);
  }
  
  if (!lancamentos || lancamentos.length === 0) {
    console.log('Nenhum lançamento aprovado encontrado');
    return c.json([]);
  }
  
  // Aplicar filtros manualmente
  let filteredData = lancamentos;
  
  if (colaborador) {
    filteredData = filteredData.filter(item => 
      item.colaborador_nome?.toLowerCase().includes(colaborador.toLowerCase())
    );
  }
  
  if (admin) {
    filteredData = filteredData.filter(item => 
      item.aprovado_por?.toLowerCase().includes(admin.toLowerCase())
    );
  }
  
  if (editado === 'true') {
    filteredData = filteredData.filter(item => item.editado_por_admin);
  } else if (editado === 'false') {
    filteredData = filteredData.filter(item => !item.editado_por_admin);
  }
  
  // Mapear para o formato esperado pelo frontend
  const mappedData = filteredData.map(item => ({
    id: item.id,
    colaborador_nome: item.colaborador_nome,
    colaborador_cpf: item.colaborador_cpf,
    data_lancamento: item.data_lancamento,
    data_aprovacao: item.data_aprovacao || item.updated_at,
    aprovado_por: item.aprovado_por || 'Sistema',
    editado: !!item.editado_por_admin,
    editado_por: item.editado_por_admin,
    funcao: item.funcao,
    turno: item.turno,
    pontuacao_total: item.pontuacao_total,
    remuneracao_total: item.remuneracao_total || 0,
    status: item.status
  }));
  
  // Ordenar por data de aprovação (mais recente primeiro)
  mappedData.sort((a, b) => new Date(b.data_aprovacao) - new Date(a.data_aprovacao));
  
  console.log('Dados filtrados e mapeados:', { count: mappedData.length });
  
  return c.json(mappedData);
});

// Export preview endpoint
app.post('/api/export-preview', async (c) => {
  const supabase = getSupabase(c.env);
  const filtros = await c.req.json();
  
  try {
    let query = supabase.from('historico_lancamentos_aprovados').select('*');
    
    if (filtros.dataInicio) {
      query = query.gte('data_lancamento', filtros.dataInicio);
    }
    
    if (filtros.dataFim) {
      query = query.lte('data_lancamento', filtros.dataFim);
    }
    
    if (filtros.colaborador) {
      query = query.ilike('colaborador_nome', `%${filtros.colaborador}%`);
    }
    
    // Filtro por função removido - coluna colaborador_funcao não existe na tabela
    // if (filtros.funcao && filtros.funcao !== 'todas') {
    //   query = query.eq('colaborador_funcao', filtros.funcao);
    // }
    
    const { data: dados, error } = await query.order('data_lancamento', { ascending: false });
    
    if (error) {
      return c.json({ error: error.message }, 500);
    }
    
    const totalRegistros = dados?.length || 0;
    const totalRemuneracao = dados?.reduce((sum, item) => sum + (item.remuneracao_total || 0), 0) || 0;
    
    return c.json({
      dados: dados || [],
      totalRegistros,
      totalRemuneracao,
      filtros
    });
    
  } catch (error) {
    console.error('Erro no preview de exportação:', error);
    return c.json({ error: 'Erro ao gerar preview dos dados' }, 500);
  }
});

// Export data endpoint
app.post('/api/export-data', async (c) => {
  const supabase = getSupabase(c.env);
  const body = await c.req.json();
  const { filtros, formato, admin_id, admin_nome } = body;
  
  try {
    // Get export data using same logic as preview
    let query = supabase.from('historico_lancamentos_aprovados').select('*');
    
    if (filtros.dataInicio) {
      query = query.gte('data_lancamento', filtros.dataInicio);
    }
    
    if (filtros.dataFim) {
      query = query.lte('data_lancamento', filtros.dataFim);
    }
    
    if (filtros.colaborador) {
      query = query.ilike('colaborador_nome', `%${filtros.colaborador}%`);
    }
    
    // Filtro por função removido - coluna colaborador_funcao não existe na tabela
    // if (filtros.funcao && filtros.funcao !== 'todas') {
    //   query = query.eq('colaborador_funcao', filtros.funcao);
    // }
    
    const { data: dados, error } = await query.order('data_lancamento', { ascending: false });
    
    if (error) {
      return c.json({ error: error.message }, 500);
    }
    
    // Log the export
    const { error: logError } = await supabase
      .from('log_exportacoes')
      .insert({
        admin_id,
        admin_nome,
        filtros_aplicados: JSON.stringify(filtros),
        total_registros: dados?.length || 0,
        formato_exportacao: formato,
        data_exportacao: new Date().toISOString()
      });
    
    if (logError) {
      console.error('Erro ao registrar log de exportação:', logError);
    }
    
    // Generate CSV (simplified version)
    if (formato === 'csv') {
      const csvContent = generateCSV(dados || [], admin_nome);
      return new Response(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="exportacao_dados.csv"'
        }
      });
    }
    
    return c.json({ message: 'Formato não suportado ainda' }, 400);
    
  } catch (error) {
    console.error('Erro na exportação:', error);
    return c.json({ error: 'Erro ao exportar dados' }, 500);
  }
});

// Export logs endpoint
app.get('/api/export-logs', async (c) => {
  const supabase = getSupabase(c.env);
  
  try {
    const { data: logs, error } = await supabase
      .from('log_exportacoes')
      .select('*')
      .order('data_exportacao', { ascending: false })
      .limit(50);
    
    if (error) {
      return c.json({ error: error.message }, 500);
    }
    
    return c.json(logs || []);
    
  } catch (error) {
    console.error('Erro ao buscar logs de exportação:', error);
    return c.json({ error: 'Erro ao carregar logs' }, 500);
  }
});

// Validation endpoint for lancamentos
app.post('/api/lancamentos/:id/validar', async (c) => {
  console.log('🔍 Endpoint de validação chamado');
  const supabase = getSupabase(c.env);
  console.log('🔧 Supabase configurado:', !!supabase);
  console.log('🔧 Env vars:', { 
    SUPABASE_URL: !!c.env.SUPABASE_URL, 
    SUPABASE_ANON_KEY: !!c.env.SUPABASE_ANON_KEY 
  });
  const id = parseInt(c.req.param('id'));
  console.log('📋 ID recebido:', id);
  const body = await c.req.json();
  console.log('📋 Body recebido:', body);
  const { acao, observacoes, dados_editados } = body;
  
  try {
    // Test basic connection first
    console.log('🧪 Testando conexão básica com Supabase...');
    const { data: testData, error: testError } = await supabase
      .from('lancamentos_produtividade')
      .select('id')
      .limit(1);
    
    console.log('🧪 Teste de conexão:', { 
      hasData: !!testData, 
      dataLength: testData?.length, 
      error: testError 
    });
    
    // Get the original lancamento
    console.log('🔍 Buscando lançamento com ID:', id);
    const { data: originalLancamento, error: fetchError } = await supabase
      .from('lancamentos_produtividade')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    
    console.log('📋 Resultado da busca:', { 
      data: originalLancamento ? 'encontrado' : 'não encontrado', 
      error: fetchError,
      errorDetails: fetchError ? JSON.stringify(fetchError) : null
    });
    
    if (fetchError || !originalLancamento) {
      return c.json({ error: 'Lançamento não encontrado' }, 404);
    }
    
    // Get current admin user
    console.log('🔍 Buscando usuário admin...');
    const { data: adminUser, error: adminError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('tipo_usuario', 'administrador')
      .limit(1)
      .single();
    
    console.log('👤 Resultado busca admin:', {
      hasUser: !!adminUser,
      error: adminError,
      errorDetails: adminError ? JSON.stringify(adminError) : null
    });
    
    if (adminError || !adminUser) {
      return c.json({ error: 'Usuário admin não encontrado' }, 401);
    }
    
    let newStatus = 'pendente';
    let isEdited = false;
    let recalculatedData = null;
    
    if (acao === 'aprovar') {
      newStatus = 'aprovado';
    } else if (acao === 'reprovar') {
      newStatus = 'reprovado';
    } else if (acao === 'editar') {
      newStatus = 'aprovado'; // Auto-approve after edit
      isEdited = true;
      
      if (dados_editados) {
        // Recalculate with edited data using the calculator endpoint
        try {
          const calcResponse = await fetch(`${c.req.url.split('/api')[0]}/api/calculator`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados_editados),
          });
          
          if (calcResponse.ok) {
            const responseText = await calcResponse.text();
            try {
              recalculatedData = JSON.parse(responseText);
            } catch (parseError) {
              console.error('Error parsing calculation response:', responseText);
              return c.json({ error: 'Erro ao recalcular dados editados' }, 500);
            }
          } else {
            console.error('Calculation request failed:', calcResponse.status);
            return c.json({ error: 'Erro na requisição de recálculo' }, 500);
          }
        } catch (fetchError) {
          console.error('Error fetching calculation:', fetchError);
          return c.json({ error: 'Erro ao conectar com o serviço de cálculo' }, 500);
        }
      }
    }
    
    // Backup original values if editing
    const originalValues = isEdited ? JSON.stringify({
      nome_atividade: originalLancamento.nome_atividade,
      quantidade_produzida: originalLancamento.quantidade_produzida,
      tempo_horas: originalLancamento.tempo_horas,
      input_adicional: originalLancamento.input_adicional,
      multiple_activities: originalLancamento.multiple_activities,
      nome_operador: originalLancamento.nome_operador,
      valid_tasks_count: originalLancamento.valid_tasks_count,
      kpis_atingidos: originalLancamento.kpis_atingidos,
      subtotal_atividades: originalLancamento.subtotal_atividades,
      bonus_kpis: originalLancamento.bonus_kpis,
      remuneracao_total: originalLancamento.remuneracao_total,
      produtividade_alcancada: originalLancamento.produtividade_alcancada,
      nivel_atingido: originalLancamento.nivel_atingido,
      atividades_detalhes: originalLancamento.atividades_detalhes,
      tarefas_validas: originalLancamento.tarefas_validas,
      valor_tarefas: originalLancamento.valor_tarefas
    }) : null;
    
    // Update original lancamento
    let updateData = {
      status: newStatus,
      observacoes: observacoes || null,
      updated_at: new Date().toISOString()
    };
    
    if (isEdited && recalculatedData && dados_editados) {
      updateData = {
        ...updateData,
        editado_por_admin: adminUser.nome,
        data_edicao: new Date().toISOString(),
        valores_originais: originalValues,
        status_edicao: 'editado_admin',
        observacoes_edicao: observacoes || null,
        nome_atividade: dados_editados.nome_atividade || null,
        quantidade_produzida: dados_editados.quantidade_produzida || null,
        tempo_horas: dados_editados.tempo_horas || null,
        input_adicional: dados_editados.input_adicional || 0,
        multiple_activities: dados_editados.multiple_activities ? JSON.stringify(dados_editados.multiple_activities) : null,
        nome_operador: dados_editados.nome_operador || null,
        valid_tasks_count: dados_editados.valid_tasks_count || null,
        kpis_atingidos: dados_editados.kpis_atingidos ? JSON.stringify(dados_editados.kpis_atingidos) : null,
        subtotal_atividades: recalculatedData.subtotal_atividades,
        bonus_kpis: recalculatedData.bonus_kpis,
        remuneracao_total: recalculatedData.remuneracao_total,
        produtividade_alcancada: recalculatedData.produtividade_alcancada || null,
        nivel_atingido: recalculatedData.nivel_atingido || null,
        unidade_medida: recalculatedData.unidade_medida || null,
        atividades_detalhes: recalculatedData.atividades_detalhes ? JSON.stringify(recalculatedData.atividades_detalhes) : null,
        tarefas_validas: recalculatedData.tarefas_validas || null,
        valor_tarefas: recalculatedData.valor_tarefas || null
      };
    }
    
    const { data: updatedLancamento, error: updateError } = await supabase
      .from('lancamentos_produtividade')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (updateError) {
      console.error('Failed to update lancamento:', updateError);
      return c.json({ error: 'Erro ao atualizar lançamento' }, 500);
    }
    
    // Create revision record
    try {
      const { error: revisionError } = await supabase
        .from('lancamentos_produtividade_revisado')
        .insert({
          lancamento_original_id: originalLancamento.id,
          admin_user_id: adminUser.id,
          admin_nome: adminUser.nome,
          user_id: originalLancamento.user_id,
          user_nome: originalLancamento.user_nome,
          user_cpf: originalLancamento.user_cpf,
          data_lancamento: originalLancamento.data_lancamento,
          funcao: originalLancamento.funcao,
          turno: originalLancamento.turno,
          nome_atividade: originalLancamento.nome_atividade,
          quantidade_produzida: originalLancamento.quantidade_produzida,
          tempo_horas: originalLancamento.tempo_horas,
          input_adicional: originalLancamento.input_adicional,
          multiple_activities: originalLancamento.multiple_activities,
          nome_operador: originalLancamento.nome_operador,
          valid_tasks_count: originalLancamento.valid_tasks_count,
          kpis_atingidos: originalLancamento.kpis_atingidos,
          subtotal_atividades: originalLancamento.subtotal_atividades,
          bonus_kpis: originalLancamento.bonus_kpis,
          remuneracao_total: originalLancamento.remuneracao_total,
          produtividade_alcancada: originalLancamento.produtividade_alcancada,
          nivel_atingido: originalLancamento.nivel_atingido,
          unidade_medida: originalLancamento.unidade_medida,
          atividades_detalhes: originalLancamento.atividades_detalhes,
          tarefas_validas: originalLancamento.tarefas_validas,
          valor_tarefas: originalLancamento.valor_tarefas,
          acao_admin: acao,
          observacoes_admin: observacoes || null,
          alteracoes_feitas: isEdited ? originalValues : null
        });
      
      if (revisionError) {
        console.error('Failed to create revision record:', revisionError);
        // Not a critical error, continue processing
      }
    } catch (revisionError) {
      console.error('Error creating revision record:', revisionError);
      // Not a critical error, continue processing
    }
    
    // If approved, add to history table
    if (newStatus === 'aprovado') {
      console.log('🔄 Tentando inserir no histórico de aprovações...');
      try {
        const historyData = {
          lancamento_id: updatedLancamento.id,
          colaborador_id: updatedLancamento.user_id,
          colaborador_nome: updatedLancamento.user_nome,
          colaborador_cpf: updatedLancamento.user_cpf,
          quantidade: updatedLancamento.quantidade || 0,
          data_lancamento: updatedLancamento.data_lancamento,
          turno: updatedLancamento.turno,
          data_aprovacao: new Date().toISOString(),
          aprovado_por: adminUser.id,
          editado: isEdited,
          editado_por: isEdited ? adminUser.id : null,
          dados_finais: JSON.stringify(updatedLancamento),
          observacoes: observacoes || null,
          remuneracao_total: updatedLancamento.remuneracao_total
        };
        
        console.log('📋 Dados para inserção no histórico:', historyData);
        
        const { data: historyResult, error: historyError } = await supabase
          .from('historico_lancamentos_aprovados')
          .insert(historyData)
          .select();
        
        if (historyError) {
          console.error('❌ Erro ao criar registro no histórico:', historyError);
          console.error('❌ Detalhes do erro:', JSON.stringify(historyError, null, 2));
        } else {
          console.log('✅ Registro criado no histórico com sucesso:', historyResult);
        }
      } catch (historyError) {
        console.error('❌ Exceção ao criar registro no histórico:', historyError);
      }
    }
    
    return c.json(updatedLancamento);
    
  } catch (error) {
    console.error('Error in validation endpoint:', error);
    return c.json({ 
      error: 'Erro interno do servidor durante validação',
      details: error.message 
    }, 500);
  }
});

// Helper function to generate CSV
function generateCSV(dados, adminNome) {
  const headers = [
    'Data Lançamento',
    'Colaborador',
    'CPF',
    'Função',
    'Remuneração Total',
    'Aprovado Por',
    'Data Aprovação',
    'Editado'
  ];
  
  let csv = headers.join(',') + '\n';
  
  dados.forEach(item => {
    const row = [
      item.data_lancamento || '',
      item.colaborador_nome || '',
      item.colaborador_cpf || '',
      item.remuneracao_total || 0,
      item.aprovado_por || '',
      item.data_aprovacao || '',
      item.editado ? 'Sim' : 'Não'
    ];
    csv += row.map(field => `"${field}"`).join(',') + '\n';
  });
  
  csv += `\n\nExportado por: ${adminNome}\n`;
  csv += `Data da exportação: ${new Date().toLocaleString('pt-BR')}\n`;
  
  return csv;
}

// Calculator endpoint
app.post('/api/calculate', zValidator('json', CalculatorInputSchema), async (c) => {
  console.log('Calculate endpoint called');
  try {
    const rawBody = await c.req.text();
    console.log('Raw request body:', rawBody);
    
    const parsedBody = JSON.parse(rawBody);
    console.log('Parsed body:', parsedBody);
    
    // Validate manually to get better error messages
    console.log('Schema validation for:', JSON.stringify(parsedBody));
    console.log('Schema definition:', JSON.stringify(CalculatorInputSchema.shape));
    
    const validationResult = CalculatorInputSchema.safeParse(parsedBody);
    if (!validationResult.success) {
      console.log('Validation failed:', JSON.stringify(validationResult.error.format()));
      return c.json({ error: 'Validation failed', details: validationResult.error.format() }, 400);
    }
    
    const input = validationResult.data;
    console.log('Validated input:', input);
    
    const supabase = getSupabase(c.env);
    const { 
      nome_atividade, 
      funcao, 
      turno, 
      quantidade_produzida, 
      tempo_horas, 
      input_adicional, 
      kpis_atingidos,
      multiple_activities,
      valid_tasks_count
    } = input;
  
  let subtotal_atividades = 0;
  let atividades_detalhes = [];
  let produtividade_alcancada;
  let nivel_atingido;
  let unidade_medida;
  let tarefas_validas;
  let valor_tarefas;

  // Handle multiple activities for Ajudantes de Armazém
  if (funcao === 'Ajudante de Armazém' && multiple_activities && multiple_activities.length > 0) {
    console.log('🔍 Processing multiple activities for Ajudante de Armazém');
    for (const activity of multiple_activities) {
      const produtividade = activity.quantidade_produzida / activity.tempo_horas;
      console.log(`📊 Activity: ${activity.nome_atividade}, Produtividade: ${produtividade}`);
      
      // Get activities for this activity name, ordered by produtividade_minima descending
      const { data: activities, error } = await supabase
        .from('activities')
        .select('*')
        .eq('nome_atividade', activity.nome_atividade)
        .order('produtividade_minima', { ascending: false });
      
      console.log(`🔍 Found ${activities?.length || 0} activities for "${activity.nome_atividade}"`);
      if (activities && activities.length > 0) {
        console.log('📋 Available activities:', activities.map(a => `${a.nome_atividade} - ${a.nivel_atividade}`));
      }
      
      if (error) {
        return c.json({ error: error.message }, 500);
      }
      
      if (activities && activities.length > 0) {
        // Find the appropriate level based on productivity
        let selectedActivity = null;
        for (const act of activities) {
          if (produtividade >= act.produtividade_minima) {
            selectedActivity = act;
            break;
          }
        }
        
        // If no level achieved, use the lowest level
        if (!selectedActivity) {
          selectedActivity = activities[activities.length - 1];
        }
        
        // Calculate value for this activity (applying 50% rule: atividades/2)
        const valor_bruto = activity.quantidade_produzida * selectedActivity.valor_atividade;
        const valor_final = valor_bruto / 2;
        subtotal_atividades += valor_final;
        
        atividades_detalhes.push({
          nome: activity.nome_atividade,
          produtividade: produtividade,
          nivel: selectedActivity.nivel_atividade,
          valor_total: valor_final,
          unidade: selectedActivity.unidade_medida || 'unidades'
        });
      }
    }
  }
  // Handle valid tasks for Operador de Empilhadeira
  else if (funcao === 'Operador de Empilhadeira' && valid_tasks_count !== undefined) {
    tarefas_validas = valid_tasks_count;
    valor_tarefas = valid_tasks_count * 0.093; // R$ 0,093 per valid task
    subtotal_atividades = valor_tarefas / 2; // Apply 50% rule
  }
  // Handle single activity for other functions
  else if (nome_atividade && quantidade_produzida && tempo_horas) {
    // Calculate productivity (quantity per hour)
    produtividade_alcancada = quantidade_produzida / tempo_horas;
    
    // Get activities for this activity name, ordered by produtividade_minima descending
    const { data: activities, error } = await supabase
      .from('activities')
      .select('*')
      .eq('nome_atividade', nome_atividade)
      .order('produtividade_minima', { ascending: false });
    
    if (error) {
      return c.json({ error: error.message }, 500);
    }
    
    if (!activities || activities.length === 0) {
      return c.json({ error: 'Atividade não encontrada' }, 404);
    }
    
    // Find the appropriate level based on productivity
    let selectedActivity = null;
    for (const activity of activities) {
      if (produtividade_alcancada >= activity.produtividade_minima) {
        selectedActivity = activity;
        break;
      }
    }
    
    // If no level achieved, use the lowest level
    if (!selectedActivity) {
      selectedActivity = activities[activities.length - 1];
    }
    
    // Calculate subtotal from activities (applying 50% rule: atividades/2)
    const valor_bruto_atividades = quantidade_produzida * selectedActivity.valor_atividade;
    subtotal_atividades = valor_bruto_atividades / 2;
    
    nivel_atingido = selectedActivity.nivel_atividade;
    unidade_medida = selectedActivity.unidade_medida;
  }
  
  // Get applicable KPIs and calculate bonus
  let bonus_kpis = 0;
  const kpis_atingidos_resultado = [];
  
  if (kpis_atingidos && kpis_atingidos.length > 0) {
    const { data: kpis, error } = await supabase
      .from('kpis')
      .select('*')
      .eq('funcao_kpi', funcao)
      .in('turno_kpi', [turno, 'Geral'])
      .in('nome_kpi', kpis_atingidos);
    
    if (error) {
      return c.json({ error: error.message }, 500);
    }
    
    for (const kpi of kpis || []) {
      bonus_kpis += kpi.peso_kpi;
      kpis_atingidos_resultado.push(kpi.nome_kpi);
    }
  }
  
  // Final calculation: atividades/2 + kpi1 + kpi2 + extras
  const atividades_extras = input_adicional || 0;
  const remuneracao_total = subtotal_atividades + bonus_kpis + atividades_extras;
  
  const result = {
    subtotal_atividades,
    bonus_kpis,
    remuneracao_total,
    kpis_atingidos: kpis_atingidos_resultado,
  };

  // Add optional fields only if they exist
  if (produtividade_alcancada !== undefined) result.produtividade_alcancada = produtividade_alcancada;
  if (nivel_atingido !== undefined) result.nivel_atingido = nivel_atingido;
  if (unidade_medida !== undefined) result.unidade_medida = unidade_medida;
  if (atividades_detalhes.length > 0) result.atividades_detalhes = atividades_detalhes;
  if (tarefas_validas !== undefined) result.tarefas_validas = tarefas_validas;
  if (valor_tarefas !== undefined) result.valor_tarefas = valor_tarefas;
  
  return c.json(result);
  } catch (error) {
    console.error('Error in calculate endpoint:', error);
    return c.json({ error: 'Internal server error', message: error.message }, 500);
  }
});

// Health check
app.get('/api/health', async (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default app;