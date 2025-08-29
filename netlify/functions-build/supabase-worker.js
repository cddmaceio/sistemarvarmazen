import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { ActivitySchema, KPISchema, CalculatorInputSchema, UserSchema, LoginSchema, CreateLancamentoSchema } from "../../src/shared/types";
import { cors } from 'hono/cors';
import { createClient } from '@supabase/supabase-js';
import { createApiLogger, createDbLogger } from './debug';
const app = new Hono();
const apiLogger = createApiLogger();
const dbLogger = createDbLogger();
app.use('*', cors());
// Middleware para log de todas as requisições
app.use('*', async (c, next) => {
    const startTime = Date.now();
    const method = c.req.method;
    const url = c.req.url;
    apiLogger.info(`${method} ${url} - Request started`);
    await next();
    const duration = Date.now() - startTime;
    const status = c.res.status;
    apiLogger.info(`${method} ${url} - Response ${status} (${duration}ms)`);
});
// Helper function to get Supabase client
const getSupabase = (env) => {
    return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
};
// Authentication endpoints
app.post('/api/auth/login', zValidator('json', LoginSchema), async (c) => {
    const supabase = getSupabase(c.env);
    const { cpf, data_nascimento } = c.req.valid('json');
    apiLogger.debug('Login attempt', { cpf: cpf.substring(0, 3) + '***', data_nascimento });
    const { data: user, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('cpf', cpf)
        .eq('data_nascimento', data_nascimento)
        .eq('is_active', true)
        .single();
    if (error) {
        dbLogger.error('Login database error', { error: error.message, code: error.code });
        return c.json({ message: 'CPF ou data de nascimento incorretos' }, 401);
    }
    if (!user) {
        apiLogger.warn('Login failed - user not found', { cpf: cpf.substring(0, 3) + '***' });
        return c.json({ message: 'CPF ou data de nascimento incorretos' }, 401);
    }
    apiLogger.info('Login successful', { userId: user.id, nome: user.nome });
    return c.json(user);
});
app.post('/api/auth/logout', async (c) => {
    return c.json({ success: true, message: 'Logged out successfully' });
});
// User management endpoints
app.get('/api/usuarios', async (c) => {
    const supabase = getSupabase(c.env);
    apiLogger.debug('Fetching all users');
    const { data: users, error } = await supabase
        .from('usuarios')
        .select('*')
        .order('created_at', { ascending: false });
    if (error) {
        dbLogger.error('Error fetching users', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
        });
        return c.json({ error: error.message }, 500);
    }
    apiLogger.debug('Users fetched successfully', { count: users?.length || 0 });
    return c.json(users || []);
});
app.post('/api/usuarios', zValidator('json', UserSchema), async (c) => {
    const supabase = getSupabase(c.env);
    const data = c.req.valid('json');
    apiLogger.debug('Creating new user', {
        nome: data.nome,
        cpf: data.cpf?.substring(0, 3) + '***',
        tipo_usuario: data.tipo_usuario
    });
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
        dbLogger.error('Error creating user', {
            error: error.message,
            code: error.code,
            details: error.details
        });
        return c.json({ error: error.message }, 500);
    }
    apiLogger.info('User created successfully', { userId: user.id, nome: user.nome });
    return c.json(user);
});
app.put('/api/usuarios/:id', zValidator('json', UserSchema.partial()), async (c) => {
    const supabase = getSupabase(c.env);
    const id = parseInt(c.req.param('id'));
    const data = c.req.valid('json');
    apiLogger.debug('Updating user', {
        userId: id,
        fields: Object.keys(data)
    });
    // Create a mutable copy of the data to clean
    const dataToUpdate = { ...data };
    // List of fields that should be converted to null if they are empty strings
    const fieldsToNullify = [
        'data_admissao',
        'data_nascimento',
        'email',
        'telefone',
        'observacoes',
    ];
    fieldsToNullify.forEach((field) => {
        if (dataToUpdate[field] === '') {
            apiLogger.debug(`Field '${field}' is an empty string, converting to null.`, { userId: id });
            dataToUpdate[field] = null;
        }
    });
    dbLogger.debug('Executing user update query with cleaned data', {
        userId: id,
        cleanData: { ...dataToUpdate, updated_at: 'ISO_STRING' }
    });
    const { data: user, error } = await supabase
        .from('usuarios')
        .update({
        ...dataToUpdate,
        updated_at: new Date().toISOString()
    })
        .eq('id', id)
        .select()
        .single();
    if (error) {
        dbLogger.error('Error updating user', {
            userId: id,
            error: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint,
            originalData: data,
            cleanData: dataToUpdate
        });
        return c.json({ error: error.message }, 500);
    }
    apiLogger.info('User updated successfully', { userId: id, nome: user?.nome });
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
    const funcaoMap = {
        'Ajudante de Armazém': 'Ajudante de ArmazÃ©m',
        'Operador de Empilhadeira': 'Operador de Empilhadeira',
        'Conferente': 'Conferente',
        'Líder de Turno': 'LÃ­der de Turno'
    };
    const turnoMap = {
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
    const status = c.req.query('status');
    
    let query = supabase
        .from('lancamentos_produtividade')
        .select('*')
        .order('created_at', { ascending: false });
    
    if (userId) {
        query = query.eq('user_id', parseInt(userId));
    }
    
    if (status) {
        query = query.eq('status', status);
    }
    
    const { data: lancamentos, error } = await query;
    if (error) {
        return c.json({ error: error.message }, 500);
    }
    return c.json(lancamentos || []);
});

// Endpoint para buscar todos os lançamentos (incluindo pendentes e reprovados)
app.get('/api/lancamentos/todos', async (c) => {
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
const normalizeString = (str) => {
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
        // Função para calcular valor dinâmico dos KPIs baseado no mês
        function calcularDiasUteisMes(year, month) {
            const diasUteis = [];
            const ultimoDia = new Date(year, month, 0).getDate();
            for (let dia = 1; dia <= ultimoDia; dia++) {
                const data = new Date(year, month - 1, dia);
                const diaSemana = data.getDay(); // 0 = domingo, 1 = segunda, ..., 6 = sábado
                // Incluir segunda (1) a sábado (6), excluir domingo (0)
                if (diaSemana >= 1 && diaSemana <= 6) {
                    diasUteis.push(dia);
                }
            }
            return diasUteis.length;
        }
        function calcularValorKpiDinamico(year, month, orcamentoMensal = 150.00, maxKpisPorDia = 2) {
            const diasUteis = calcularDiasUteisMes(year, month);
            const totalKpisMes = diasUteis * maxKpisPorDia;
            const valorPorKpi = orcamentoMensal / totalKpisMes;
            // Arredondar para 2 casas decimais
            return Math.round(valorPorKpi * 100) / 100;
        }
        // Handle KPIs with normalized data
        console.log("Processing KPIs:", input.kpis_atingidos);
        console.log("Available KPIs from query:", kpis);
        // Calcular valor dinâmico baseado no mês atual
        const dataLancamento = new Date();
        const anoLancamento = dataLancamento.getFullYear();
        const mesLancamento = dataLancamento.getMonth() + 1;
        const valorKpiDinamico = calcularValorKpiDinamico(anoLancamento, mesLancamento);
        const diasUteis = calcularDiasUteisMes(anoLancamento, mesLancamento);
        console.log('📅 Cálculo Dinâmico de KPIs:');
        console.log(`- Data atual: ${dataLancamento.toISOString()}`);
        console.log(`- Mês/Ano: ${mesLancamento}/${anoLancamento}`);
        console.log(`- Dias úteis no mês: ${diasUteis}`);
        console.log(`- Valor dinâmico por KPI: R$ ${valorKpiDinamico}`);
        if (input.kpis_atingidos && input.kpis_atingidos.length > 0 && kpis && kpis.length > 0) {
            for (const kpiName of input.kpis_atingidos) {
                const matchingKpi = kpis.find(k => k.nome_kpi === kpiName);
                if (matchingKpi) {
                    // Usar valor dinâmico para Operador de Empilhadeira, valor fixo para outras funções
                    const valorKpi = input.funcao === 'Operador de Empilhadeira' ? valorKpiDinamico : (parseFloat(matchingKpi.peso_kpi) || 0);
                    bonusKpis += valorKpi;
                    kpisAtingidos.push(matchingKpi.nome_kpi);
                    console.log(`Added KPI: ${matchingKpi.nome_kpi}, Weight: R$ ${valorKpi} (${input.funcao === 'Operador de Empilhadeira' ? 'dinâmico' : 'fixo'})`);
                }
                else {
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
    }
    catch (error) {
        return c.json({ error: 'Calculation failed' }, 500);
    }
});
// Health check
// Endpoint para dados de produtividade
app.get('/api/productivity-data', async (c) => {
    const supabase = getSupabase(c.env);
    apiLogger.debug('Fetching productivity data');
    
    try {
        // Buscar lançamentos aprovados com dados de produtividade
        const { data: lancamentos, error } = await supabase
            .from('lancamentos_produtividade')
            .select('*')
            .eq('status', 'aprovado')
            .order('data_lancamento', { ascending: false });
        
        if (error) {
            dbLogger.error('Error fetching productivity data', { error: error.message });
            return c.json({ success: false, error: error.message }, 500);
        }
        
        if (!lancamentos || lancamentos.length === 0) {
            return c.json({ success: true, data: [] });
        }
        
        // Agregar dados por turno e função
        const productivityData = [];
        const groupedData = {};
        
        lancamentos.forEach(lancamento => {
            const key = `${lancamento.turno}-${lancamento.funcao}`;
            if (!groupedData[key]) {
                groupedData[key] = {
                    turno: lancamento.turno,
                    funcao: lancamento.funcao,
                    produtividades: [],
                    colaboradores: new Set(),
                    meta: 85 // Meta padrão
                };
            }
            
            if (lancamento.produtividade_alcancada) {
                groupedData[key].produtividades.push(lancamento.produtividade_alcancada);
            }
            groupedData[key].colaboradores.add(lancamento.user_id);
        });
        
        // Calcular médias e eficiência
        Object.values(groupedData).forEach(group => {
            const produtividadeMedia = group.produtividades.length > 0 
                ? group.produtividades.reduce((a, b) => a + b, 0) / group.produtividades.length
                : 0;
            
            productivityData.push({
                turno: group.turno,
                funcao: group.funcao,
                produtividade: Math.round(produtividadeMedia),
                meta: group.meta,
                colaboradores: group.colaboradores.size,
                eficiencia: Math.round((produtividadeMedia / group.meta) * 100)
            });
        });
        
        apiLogger.info('Productivity data fetched successfully', { count: productivityData.length });
        return c.json({ success: true, data: productivityData });
        
    } catch (error) {
        apiLogger.error('Error in productivity-data endpoint', { error: error.message });
        return c.json({ success: false, error: 'Erro interno do servidor' }, 500);
    }
});

// Endpoint para ganhos mensais por colaborador
app.get('/api/monthly-earnings', async (c) => {
    const supabase = getSupabase(c.env);
    const funcao = c.req.query('funcao');
    const mesAno = c.req.query('mesAno');
    
    apiLogger.debug('Fetching monthly earnings', { funcao, mesAno });
    
    try {
        let query = supabase
            .from('lancamentos_produtividade')
            .select('*')
            .eq('status', 'aprovado')
            .order('data_lancamento', { ascending: false });
        
        // Filtrar por função se especificado
        if (funcao && funcao !== 'todas') {
            query = query.eq('funcao', funcao);
        }
        
        // Filtrar por mês/ano se especificado
        if (mesAno && mesAno !== 'todos') {
            const [ano, mes] = mesAno.split('-');
            const startDate = `${ano}-${mes.padStart(2, '0')}-01`;
            const endDate = new Date(parseInt(ano), parseInt(mes), 0).toISOString().split('T')[0];
            query = query.gte('data_lancamento', startDate).lte('data_lancamento', endDate);
        }
        
        const { data: lancamentos, error } = await query;
        
        if (error) {
            dbLogger.error('Error fetching monthly earnings', { error: error.message });
            return c.json({ success: false, error: error.message }, 500);
        }
        
        if (!lancamentos || lancamentos.length === 0) {
            return c.json({ success: true, data: [] });
        }
        
        // Agrupar por colaborador
        const colaboradoresMap = {};
        
        lancamentos.forEach(lancamento => {
            const userId = lancamento.user_id;
            if (!colaboradoresMap[userId]) {
                colaboradoresMap[userId] = {
                    id: userId,
                    nome: lancamento.user_nome,
                    cpf: lancamento.user_cpf,
                    funcao: lancamento.funcao,
                    ganhoTotal: 0,
                    totalLancamentos: 0,
                    detalhes: []
                };
            }
            
            colaboradoresMap[userId].ganhoTotal += lancamento.remuneracao_total || 0;
            colaboradoresMap[userId].totalLancamentos += 1;
            colaboradoresMap[userId].detalhes.push({
                data: lancamento.data_lancamento,
                atividade: lancamento.nome_atividade || 'N/A',
                turno: lancamento.turno,
                remuneracao: lancamento.remuneracao_total || 0,
                produtividade: lancamento.produtividade_alcancada || 0,
                bonusKpis: lancamento.bonus_kpis || 0
            });
        });
        
        // Calcular média de ganho por lançamento
        const monthlyEarningsData = Object.values(colaboradoresMap).map(colaborador => ({
            ...colaborador,
            mediaGanho: colaborador.totalLancamentos > 0 
                ? colaborador.ganhoTotal / colaborador.totalLancamentos 
                : 0
        }));
        
        apiLogger.info('Monthly earnings data fetched successfully', { count: monthlyEarningsData.length });
        return c.json({ success: true, data: monthlyEarningsData });
        
    } catch (error) {
        apiLogger.error('Error in monthly-earnings endpoint', { error: error.message });
        return c.json({ success: false, error: 'Erro interno do servidor' }, 500);
    }
});

// Endpoint para validação de lançamentos
app.post('/api/lancamentos/:id/validar', async (c) => {
    const supabase = getSupabase(c.env);
    const lancamentoId = parseInt(c.req.param('id'));
    const body = await c.req.json();
    const { acao, observacoes, admin_user_id } = body;
    
    apiLogger.debug('Validating lancamento', { lancamentoId, acao, admin_user_id });
    
    if (!['aprovar', 'reprovar'].includes(acao)) {
        return c.json({ error: 'Ação inválida. Use "aprovar" ou "reprovar"' }, 400);
    }
    
    try {
        // Buscar o lançamento
        const { data: lancamento, error: fetchError } = await supabase
            .from('lancamentos_produtividade')
            .select('*')
            .eq('id', lancamentoId)
            .single();
        
        if (fetchError || !lancamento) {
            dbLogger.error('Lancamento not found', { lancamentoId, error: fetchError?.message });
            return c.json({ error: 'Lançamento não encontrado' }, 404);
        }
        
        if (lancamento.status !== 'pendente') {
            return c.json({ error: 'Lançamento já foi processado' }, 400);
        }
        
        // Buscar dados do admin
        let adminNome = 'Sistema';
        if (admin_user_id) {
            const { data: admin } = await supabase
                .from('usuarios')
                .select('nome')
                .eq('id', admin_user_id)
                .single();
            if (admin) adminNome = admin.nome;
        }
        
        // Atualizar status do lançamento
        const { data: updatedLancamento, error: updateError } = await supabase
            .from('lancamentos_produtividade')
            .update({
                status: acao === 'aprovar' ? 'aprovado' : 'reprovado',
                observacoes: observacoes,
                updated_at: new Date().toISOString()
            })
            .eq('id', lancamentoId)
            .select()
            .single();
        
        if (updateError) {
            dbLogger.error('Error updating lancamento status', { 
                lancamentoId, 
                error: updateError.message 
            });
            return c.json({ error: 'Erro ao atualizar status do lançamento' }, 500);
        }
        
        // Registrar no histórico de aprovações (se aprovado)
        if (acao === 'aprovar') {
            const { error: historyError } = await supabase
                .from('historico_lancamentos_aprovados')
                .insert({
                    lancamento_id: lancamentoId,
                    colaborador_id: lancamento.user_id,
                    colaborador_nome: lancamento.user_nome,
                    colaborador_cpf: lancamento.user_cpf,
                    data_lancamento: lancamento.data_lancamento,
                    data_aprovacao: new Date().toISOString(),
                    aprovado_por: adminNome,
                    editado: false,
                    dados_finais: JSON.stringify(lancamento),
                    observacoes: observacoes,
                    remuneracao_total: lancamento.remuneracao_total || 0
                });
            
            if (historyError) {
                dbLogger.warn('Error saving approval history', { 
                    lancamentoId, 
                    error: historyError.message 
                });
                // Não falha a operação por erro no histórico
            }
        }
        
        apiLogger.info('Lancamento validation completed', { 
            lancamentoId, 
            acao, 
            adminNome 
        });
        
        return c.json({ 
            success: true, 
            message: `Lançamento ${acao === 'aprovar' ? 'aprovado' : 'reprovado'} com sucesso`,
            status: acao === 'aprovar' ? 'aprovado' : 'reprovado'
        });
        
    } catch (error) {
        apiLogger.error('Error in lancamento validation', { 
            lancamentoId, 
            error: error.message 
        });
        return c.json({ error: 'Erro interno do servidor' }, 500);
    }
});

app.get('/api/health', async (c) => {
    return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});
export default app;
