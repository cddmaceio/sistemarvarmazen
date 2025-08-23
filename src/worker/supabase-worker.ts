import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { ActivitySchema, KPISchema, CalculatorInputSchema, UserSchema, LoginSchema, CreateLancamentoSchema } from "../shared/types";
import { cors } from 'hono/cors';
import { createClient } from '@supabase/supabase-js';

// Supabase Environment type
type Env = {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
};

const app = new Hono<{ Bindings: Env }>();

app.use('*', cors());

// Helper function to get Supabase client
const getSupabase = (env: Env) => {
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
      tipo_usuario: data.tipo_usuario,
      status_usuario: data.status_usuario,
      funcao: data.funcao
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
    .update({ is_active: false, updated_at: new Date().toISOString() })
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
    .order('nome_atividade', { ascending: true });
  
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
    .order('nome_atividade', { ascending: true });
  
  if (error) {
    return c.json({ error: error.message }, 500);
  }
  
  const uniqueNames = [...new Set(activities?.map(a => a.nome_atividade) || [])];
  return c.json(uniqueNames);
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
    .order('nome_kpi', { ascending: true });
  
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
    .order('funcao_kpi', { ascending: true });
  
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
  
  // Apply encoding mapping like in worker function
  const funcaoMap: { [key: string]: string } = {
    'Ajudante de Armazém': 'Ajudante de ArmazÃ©m',
    'Operador de Empilhadeira': 'Operador de Empilhadeira',
    'Conferente': 'Conferente',
    'Líder de Turno': 'LÃ­der de Turno'
  };
  
  const turnoMap: { [key: string]: string } = {
    'Manha': 'ManhÃ£',
    'Tarde': 'Tarde',
    'Noite': 'Noite'
  };
  
  const dbFuncao = funcaoMap[funcao] || funcao;
  const dbTurno = turnoMap[turno] || turno;
  
  console.log(`Searching for KPIs with funcao: ${dbFuncao}, turno: [${dbTurno}, 'Geral']`);
  
  // Try two separate queries and combine results
  const { data: kpis1, error: error1 } = await supabase
    .from('kpis')
    .select('*')
    .eq('funcao_kpi', dbFuncao)
    .eq('turno_kpi', dbTurno)
    .eq('status_ativo', true);
    
  const { data: kpis2, error: error2 } = await supabase
    .from('kpis')
    .select('*')
    .eq('funcao_kpi', dbFuncao)
    .eq('turno_kpi', 'Geral')
    .eq('status_ativo', true);
    
  const kpis = [...(kpis1 || []), ...(kpis2 || [])];
  const error = error1 || error2;
  
  console.log(`KPI query result:`, { data: kpis, error, count: kpis?.length || 0 });
  console.log(`Query 1 (${dbTurno}):`, kpis1?.length || 0, 'results');
  console.log(`Query 2 (Geral):`, kpis2?.length || 0, 'results');
  
  if (error) {
    console.error('Error fetching available KPIs:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    });
    return c.json({ error: error.message }, 500);
  }
  
  return c.json({ kpisAtingidos: kpis || [] });
});

// Lançamentos endpoints
app.get('/api/lancamentos', async (c) => {
  const supabase = getSupabase(c.env);
  const userId = c.req.query('user_id');
  
  let query = supabase
    .from('lancamentos_produtividade')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (userId) {
    query = query.eq('user_id', parseInt(userId));
  }
  
  const { data: lancamentos, error } = await query;
  
  if (error) {
    return c.json({ error: error.message }, 500);
  }
  
  return c.json(lancamentos || []);
});

app.post('/api/lancamentos', zValidator('json', CreateLancamentoSchema), async (c) => {
  const supabase = getSupabase(c.env);
  const data = c.req.valid('json');
  
  const { data: lancamento, error } = await supabase
    .from('lancamentos_produtividade')
    .insert(data)
    .select()
    .single();
  
  if (error) {
    return c.json({ error: error.message }, 500);
  }
  
  return c.json(lancamento);
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

// Helper function to normalize strings (remove accents)
const normalizeString = (str: string): string => {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ç/g, 'c')
    .replace(/Ç/g, 'C');
};

// Calculator endpoint
app.post('/api/calculator', zValidator('json', CalculatorInputSchema), async (c) => {
  console.log('🚀 CALCULATOR FUNCTION STARTED 🚀');
  const supabase = getSupabase(c.env);
  const input = c.req.valid('json');
  
  try {
    console.log('Calculator endpoint called');
    console.log('=== CALCULATOR DEBUG START ===');
    console.log('Input received:', JSON.stringify(input, null, 2));
    console.log('🔥 UNIQUE DEBUG MARKER 12345 🔥');
    // Normalize input strings
    const normalizedFuncao = normalizeString(input.funcao);
    const normalizedTurno = normalizeString(input.turno);
    
    console.log('Original input:', { funcao: input.funcao, turno: input.turno });
    console.log('Normalized input:', { funcao: normalizedFuncao, turno: normalizedTurno });
    
    // Activities will be fetched as needed during calculation
    
    // Get KPIs for calculation - search with original strings (database has encoding issues)
    // Map input to database values
    const dbFuncao = input.funcao === 'Ajudante de Armazém' ? 'Ajudante de ArmazÃ©m' : input.funcao;
    const dbTurno = input.turno === 'Manha' ? 'ManhÃ£' : input.turno;
    
    console.log('Database search values:', { dbFuncao, dbTurno });
    console.log('Searching for KPIs with:', { funcao_kpi: dbFuncao, turno_kpi_in: [dbTurno, 'Geral'] });
    
    // Use two separate queries and combine results
    const { data: kpis1, error: kpisError1 } = await supabase
      .from('kpis')
      .select('*')
      .eq('funcao_kpi', dbFuncao)
      .eq('turno_kpi', dbTurno)
      .eq('status_ativo', true);
      
    const { data: kpis2, error: kpisError2 } = await supabase
      .from('kpis')
      .select('*')
      .eq('funcao_kpi', dbFuncao)
      .eq('turno_kpi', 'Geral')
      .eq('status_ativo', true);
      
    const kpis = [...(kpis1 || []), ...(kpis2 || [])];
    const kpisError = kpisError1 || kpisError2;
      
    console.log('KPI query result:', { data: kpis, error: kpisError, count: kpis?.length || 0 });
    console.log(`Query 1 (${dbTurno}):`, kpis1?.length || 0, 'results');
    console.log(`Query 2 (Geral):`, kpis2?.length || 0, 'results');
    
    if (kpisError) {
      return c.json({ error: kpisError.message }, 500);
    }
    
    console.log('Found KPIs:', kpis);
    
    // Calculate productivity (complete logic)
    let subtotalAtividades = 0;
    let bonusKpis = 0;
    let kpisAtingidos = [];
    let atividadesDetalhes = [];
    let produtividadeAlcancada = 0;
    let nivelAtingido = "Nenhum";
    let unidadeMedida = "";
    let tarefasValidas = 0;
    let valorTarefas = 0;

    // Handle multiple activities
    console.log("Using updated multiple_activities logic with input:", input);
    if (input.multiple_activities && input.multiple_activities.length > 0) {
      for (const act of input.multiple_activities) {
        console.log(`Processing activity: ${act.nome_atividade}`);
        const { data: activityData, error } = await supabase
          .from('activities')
          .select('*')
          .eq('nome_atividade', act.nome_atividade)
          .order('produtividade_minima', { ascending: false });

        console.log(`Query result for ${act.nome_atividade}:`, { error, dataLength: activityData?.length });
        if (error) {
          console.error(`Error querying activity ${act.nome_atividade}:`, error);
          continue;
        }
        if (!activityData || activityData.length === 0) {
          console.log(`No data found for activity: ${act.nome_atividade}`);
          continue;
        }

        console.log(`Found ${activityData.length} records for ${act.nome_atividade}:`, activityData);
        const produtividade = act.quantidade_produzida / act.tempo_horas;
        console.log(`Calculated productivity: ${produtividade} for ${act.nome_atividade}`);
        
        let selectedActivity = null;
        for (const a of activityData) {
          console.log(`Checking level: ${a.nivel_atividade}, min productivity: ${a.produtividade_minima}`);
          if (produtividade >= a.produtividade_minima) {
            selectedActivity = a;
            console.log(`Selected activity level: ${a.nivel_atividade}`);
            break;
          }
        }
        if (!selectedActivity) {
          selectedActivity = activityData[activityData.length - 1];
          console.log(`No level achieved, using lowest level: ${selectedActivity.nivel_atividade}`);
        }

        const valor = selectedActivity.valor_atividade * act.quantidade_produzida;
        subtotalAtividades += valor / 2; // Aplicar regra de 50%

        atividadesDetalhes.push({
          nome_atividade: act.nome_atividade,
          quantidade_produzida: act.quantidade_produzida,
          tempo_horas: act.tempo_horas,
          valor,
          produtividade: Math.round(produtividade * 100) / 100,
          nivel: selectedActivity.nivel_atividade
        });

        tarefasValidas++;
        valorTarefas += valor;
        produtividadeAlcancada = Math.max(produtividadeAlcancada, produtividade);
        nivelAtingido = selectedActivity.nivel_atividade; // Atualizar com o nível mais recente ou lógica desejada
        unidadeMedida = selectedActivity.unidade_medida;
      }
    }

    // Handle KPIs with normalized data
    console.log("Processing KPIs:", input.kpis_atingidos);
    console.log("Available KPIs from query:", kpis);
    
    if (input.kpis_atingidos && input.kpis_atingidos.length > 0 && kpis && kpis.length > 0) {
      for (const kpiName of input.kpis_atingidos) {
        const matchingKpi = kpis.find(k => k.nome_kpi === kpiName);
        if (matchingKpi) {
          bonusKpis += parseFloat(matchingKpi.peso_kpi) || 0;
          kpisAtingidos.push(matchingKpi.nome_kpi);
          console.log(`Added KPI: ${matchingKpi.nome_kpi}, Weight: ${matchingKpi.peso_kpi}`);
        } else {
          console.log(`KPI not found: ${kpiName}`);
        }
      }
    }
    
    console.log('Final bonusKpis:', bonusKpis);
    console.log('Final kpisAtingidos:', kpisAtingidos);

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
    return c.json({ error: 'Calculation failed' }, 500);
  }
});

// Health check
app.get('/api/health', async (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default app;