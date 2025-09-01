"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hono_1 = require("hono");
const zod_validator_1 = require("@hono/zod-validator");
const zod_1 = require("zod");
const types_1 = require("../../shared/types");
const utils_1 = require("../utils");
const lancamentoRoutes = new hono_1.Hono();
// GET /api/lancamentos
lancamentoRoutes.get('/lancamentos', async (c) => {
    const supabase = (0, utils_1.getSupabase)(c.env);
    // Get query parameters
    const user_id = c.req.query('user_id');
    const status = c.req.query('status');
    // Build query with filters
    let query = supabase
        .from('lancamentos_produtividade')
        .select('*');
    // Apply filters if provided
    if (user_id) {
        query = query.eq('user_id', parseInt(user_id));
    }
    if (status) {
        query = query.eq('status', status);
    }
    // Order by creation date
    query = query.order('created_at', { ascending: false });
    const { data: lancamentos, error } = await query;
    if (error) {
        return c.json({ error: error.message }, 500);
    }
    return c.json(lancamentos || []);
});
// GET /api/lancamentos/pendentes
lancamentoRoutes.get('/lancamentos/pendentes', async (c) => {
    const supabase = (0, utils_1.getSupabase)(c.env);
    const { data: lancamentos, error } = await supabase
        .from('lancamentos_produtividade')
        .select('*')
        .eq('status', 'pendente')
        .order('created_at', { ascending: false });
    if (error) {
        return c.json({ error: error.message }, 500);
    }
    return c.json(lancamentos || []);
});
// GET /api/lancamentos/todos
lancamentoRoutes.get('/lancamentos/todos', async (c) => {
    const supabase = (0, utils_1.getSupabase)(c.env);
    // Get query parameters
    const user_id = c.req.query('user_id');
    const status_filter = c.req.query('status_filter'); // Novo parâmetro para filtrar status
    // Build query with filters
    let query = supabase
        .from('lancamentos_produtividade')
        .select('*');
    // Apply user filter if provided
    if (user_id) {
        query = query.eq('user_id', parseInt(user_id));
        // Se user_id for fornecido, retornar TODOS os lançamentos por padrão
        // A menos que status_filter seja especificado
        if (status_filter === 'pending_rejected') {
            query = query.in('status', ['pendente', 'rejeitado']);
        }
        // Se não especificar status_filter, retorna todos os status
    }
    else {
        // Se não tiver user_id, manter comportamento original (apenas pendentes e rejeitados)
        query = query.in('status', ['pendente', 'rejeitado']);
    }
    // Order by creation date
    query = query.order('created_at', { ascending: false });
    const { data: lancamentos, error } = await query;
    if (error) {
        return c.json({ error: error.message }, 500);
    }
    return c.json(lancamentos || []);
});
// POST /api/lancamentos
lancamentoRoutes.post('/lancamentos', (0, zod_validator_1.zValidator)('json', types_1.CreateLancamentoSchema), async (c) => {
    console.log('SUPABASE_URL from env:', c.env.SUPABASE_URL);
    const supabase = (0, utils_1.getSupabase)(c.env);
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
    // Validação específica para Operador de Empilhadeira
    if (userData.funcao === 'Operador de Empilhadeira') {
        // Verificar se há tarefas válidas ou se é apenas KPI
        const hasValidTasks = calculator_data.valid_tasks_count && calculator_data.valid_tasks_count > 0;
        const hasKpisOnly = calculator_data.kpis_atingidos && calculator_data.kpis_atingidos.length > 0;
        // Se não tem tarefas válidas mas tem KPIs, bloquear o lançamento
        if (!hasValidTasks && hasKpisOnly) {
            return c.json({
                error: 'Lançamento não permitido',
                message: 'Operadores de empilhadeira não podem fazer lançamentos apenas com KPIs. É necessário ter pelo menos uma tarefa válida.',
                details: {
                    valid_tasks_count: calculator_data.valid_tasks_count || 0,
                    kpis_count: calculator_data.kpis_atingidos?.length || 0,
                    funcao: userData.funcao
                }
            }, 400);
        }
        // Se não tem tarefas válidas e não tem KPIs, também bloquear
        if (!hasValidTasks && !hasKpisOnly) {
            return c.json({
                error: 'Lançamento inválido',
                message: 'Operadores de empilhadeira devem ter pelo menos uma tarefa válida para fazer lançamentos.',
                details: {
                    valid_tasks_count: calculator_data.valid_tasks_count || 0,
                    funcao: userData.funcao
                }
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
        produtividade_alcancada: calculator_result.produtividadeAlcancada,
        nivel_atingido: calculator_result.nivelAtingido,
        unidade_medida: calculator_result.unidadeMedida,
        atividades_detalhes: calculator_result.atividadesDetalhes ? JSON.stringify(calculator_result.atividadesDetalhes) : undefined,
        tarefas_validas: calculator_result.tarefasValidas,
        valor_tarefas: calculator_result.valorTarefas,
        valor_bruto_atividades: calculator_result.valorBrutoAtividades,
        // Store original data for editing purposes
        calculator_data: JSON.stringify(calculator_data),
        calculator_result: JSON.stringify(calculator_result),
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
// POST /api/lancamentos/:id/validar
lancamentoRoutes.post('/lancamentos/:id/validar', (0, zod_validator_1.zValidator)('json', types_1.AdminValidationSchema), async (c) => {
    const supabase = (0, utils_1.getSupabase)(c.env);
    const id = parseInt(c.req.param('id'));
    const { acao, observacoes, admin_user_id } = c.req.valid('json');
    // Determine the new status based on action
    let newStatus;
    switch (acao) {
        case 'aprovar':
            newStatus = 'aprovado';
            break;
        case 'reprovar':
            newStatus = 'reprovado';
            break;
        case 'editar':
            newStatus = 'pendente'; // Keep as pending for editing
            break;
        default:
            return c.json({ error: 'Ação inválida' }, 400);
    }
    // Update the lancamento
    const updateData = {
        status: newStatus,
        observacoes,
        updated_at: new Date().toISOString()
    };
    // Add admin tracking if provided
    if (admin_user_id) {
        updateData.editado_por_admin = admin_user_id.toString();
        updateData.data_edicao = new Date().toISOString();
    }
    const { data: lancamento, error } = await supabase
        .from('lancamentos_produtividade')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
    if (error) {
        console.error('Error validating lancamento:', error);
        return c.json({ error: error.message }, 500);
    }
    return c.json(lancamento);
});
// PUT /api/lancamentos/:id/edit - Edit lancamento data and recalculate
lancamentoRoutes.put('/lancamentos/:id/edit', (0, zod_validator_1.zValidator)('json', zod_1.z.object({
    calculator_data: types_1.CalculatorInputSchema,
    calculator_result: types_1.CalculatorResultSchema,
    editado_por_admin: zod_1.z.string(),
    observacoes: zod_1.z.string().optional()
})), async (c) => {
    const supabase = (0, utils_1.getSupabase)(c.env);
    const id = parseInt(c.req.param('id'));
    const { calculator_data, calculator_result, editado_por_admin, observacoes } = c.req.valid('json');
    // Get current lancamento to preserve original data
    const { data: currentLancamento, error: fetchError } = await supabase
        .from('lancamentos_produtividade')
        .select('*')
        .eq('id', id)
        .single();
    if (fetchError || !currentLancamento) {
        return c.json({ error: 'Lançamento não encontrado' }, 404);
    }
    // Prepare update data with audit fields
    const updateData = {
        // Update calculator data and results
        calculator_data: JSON.stringify(calculator_data),
        calculator_result: JSON.stringify(calculator_result),
        // Update derived fields from calculator_data
        nome_atividade: calculator_data.nome_atividade || null,
        quantidade_produzida: calculator_data.quantidade_produzida || 0,
        tempo_horas: calculator_data.tempo_horas || 0,
        input_adicional: calculator_data.input_adicional || 0,
        kpis_atingidos: JSON.stringify(calculator_data.kpis_atingidos || []),
        multiple_activities: JSON.stringify(calculator_data.multiple_activities || []),
        valid_tasks_count: calculator_data.valid_tasks_count || 0,
        // Update derived fields from calculator_result
        subtotal_atividades: calculator_result.subtotalAtividades || 0,
        bonus_kpis: calculator_result.bonusKpis || 0,
        remuneracao_total: calculator_result.remuneracaoTotal || 0,
        produtividade_alcancada: calculator_result.produtividadeAlcancada || null,
        nivel_atingido: calculator_result.nivelAtingido || null,
        unidade_medida: calculator_result.unidadeMedida || null,
        atividades_detalhes: calculator_result.atividadesDetalhes ? JSON.stringify(calculator_result.atividadesDetalhes) : null,
        tarefas_validas: calculator_result.tarefasValidas || null,
        valor_tarefas: calculator_result.valorTarefas || null,
        valor_bruto_atividades: calculator_result.valorBrutoAtividades || null,
        // Audit fields
        editado_por_admin: editado_por_admin,
        data_edicao: new Date().toISOString(),
        observacoes: observacoes || currentLancamento.observacoes,
        // Keep status as pending for re-validation
        status: 'pendente',
        updated_at: new Date().toISOString()
    };
    const { data: lancamento, error } = await supabase
        .from('lancamentos_produtividade')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
    if (error) {
        console.error('Error updating lancamento:', error);
        return c.json({ error: error.message }, 500);
    }
    return c.json(lancamento);
});
// PUT /api/lancamentos/:id - Update lancamento with any fields
lancamentoRoutes.put('/lancamentos/:id', async (c) => {
    const supabase = (0, utils_1.getSupabase)(c.env);
    const id = parseInt(c.req.param('id'));
    const updateData = await c.req.json();
    // Always update the timestamp
    updateData.updated_at = new Date().toISOString();
    const { data: lancamento, error } = await supabase
        .from('lancamentos_produtividade')
        .update(updateData)
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
    const supabase = (0, utils_1.getSupabase)(c.env);
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
    const supabase = (0, utils_1.getSupabase)(c.env);
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
exports.default = lancamentoRoutes;
