"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hono_1 = require("hono");
const zod_validator_1 = require("@hono/zod-validator");
const types_1 = require("../shared/types");
const cors_1 = require("hono/cors");
const app = new hono_1.Hono();
app.use('*', (0, cors_1.cors)());
// Authentication endpoints
app.post('/api/auth/login', (0, zod_validator_1.zValidator)('json', types_1.LoginSchema), async (c) => {
    const db = c.env.DB;
    const { cpf, data_nascimento } = c.req.valid('json');
    const user = await db.prepare(`
    SELECT * FROM usuarios 
    WHERE cpf = ? AND data_nascimento = ? AND is_active = true
  `).bind(cpf, data_nascimento).first();
    if (!user) {
        return c.json({ message: 'CPF ou data de nascimento incorretos' }, 401);
    }
    return c.json(user);
});
app.post('/api/auth/logout', async (c) => {
    // Server-side logout endpoint
    // Clear any server-side sessions if implemented
    return c.json({ success: true, message: 'Logged out successfully' });
});
// User management endpoints
app.get('/api/usuarios', async (c) => {
    const db = c.env.DB;
    const users = await db.prepare('SELECT * FROM usuarios ORDER BY created_at DESC').all();
    return c.json(users.results);
});
app.post('/api/usuarios', (0, zod_validator_1.zValidator)('json', types_1.UserSchema), async (c) => {
    const db = c.env.DB;
    const data = c.req.valid('json');
    const result = await db.prepare(`
    INSERT INTO usuarios (cpf, data_nascimento, nome, role, is_active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `).bind(data.cpf, data.data_nascimento, data.nome, data.role, data.is_active).run();
    if (result.success) {
        const user = await db.prepare('SELECT * FROM usuarios WHERE id = ?').bind(result.meta.last_row_id).first();
        return c.json(user);
    }
    return c.json({ error: 'Failed to create user' }, 500);
});
app.put('/api/usuarios/:id', (0, zod_validator_1.zValidator)('json', types_1.UserSchema.partial()), async (c) => {
    const db = c.env.DB;
    const id = parseInt(c.req.param('id'));
    const data = c.req.valid('json');
    if (isNaN(id)) {
        return c.json({ error: 'Invalid user ID' }, 400);
    }
    // Build dynamic update query
    const updates = [];
    const values = [];
    if (data.nome !== undefined) {
        updates.push('nome = ?');
        values.push(data.nome);
    }
    if (data.cpf !== undefined) {
        updates.push('cpf = ?');
        values.push(data.cpf);
    }
    if (data.data_nascimento !== undefined) {
        updates.push('data_nascimento = ?');
        values.push(data.data_nascimento);
    }
    if (data.role !== undefined) {
        updates.push('role = ?');
        values.push(data.role);
    }
    if (data.is_active !== undefined) {
        updates.push('is_active = ?');
        values.push(data.is_active);
    }
    if (updates.length === 0) {
        return c.json({ error: 'No fields to update' }, 400);
    }
    updates.push('updated_at = datetime(\'now\')');
    values.push(id);
    const query = `UPDATE usuarios SET ${updates.join(', ')} WHERE id = ?`;
    const result = await db.prepare(query).bind(...values).run();
    if (result.success && result.meta.changes && result.meta.changes > 0) {
        const user = await db.prepare('SELECT * FROM usuarios WHERE id = ?').bind(id).first();
        return c.json(user);
    }
    return c.json({ error: 'User not found' }, 404);
});
app.delete('/api/usuarios/:id', async (c) => {
    const db = c.env.DB;
    const id = c.req.param('id');
    const result = await db.prepare('DELETE FROM usuarios WHERE id = ?').bind(id).run();
    if (result.success) {
        return c.json({ success: true });
    }
    return c.json({ error: 'User not found' }, 404);
});
// Activities endpoints
app.get('/api/activities', async (c) => {
    const db = c.env.DB;
    const activities = await db.prepare('SELECT * FROM activities ORDER BY created_at DESC').all();
    return c.json(activities.results);
});
app.post('/api/activities', (0, zod_validator_1.zValidator)('json', types_1.ActivitySchema), async (c) => {
    const db = c.env.DB;
    const data = c.req.valid('json');
    const result = await db.prepare(`
    INSERT INTO activities (nome_atividade, nivel_atividade, valor_atividade, created_at, updated_at)
    VALUES (?, ?, ?, datetime('now'), datetime('now'))
  `).bind(data.nome_atividade, data.nivel_atividade, data.valor_atividade).run();
    if (result.success) {
        const activity = await db.prepare('SELECT * FROM activities WHERE id = ?').bind(result.meta.last_row_id).first();
        return c.json(activity);
    }
    return c.json({ error: 'Failed to create activity' }, 500);
});
app.put('/api/activities/:id', (0, zod_validator_1.zValidator)('json', types_1.ActivitySchema), async (c) => {
    const db = c.env.DB;
    const id = c.req.param('id');
    const data = c.req.valid('json');
    const result = await db.prepare(`
    UPDATE activities 
    SET nome_atividade = ?, nivel_atividade = ?, valor_atividade = ?, updated_at = datetime('now')
    WHERE id = ?
  `).bind(data.nome_atividade, data.nivel_atividade, data.valor_atividade, id).run();
    if (result.success) {
        const activity = await db.prepare('SELECT * FROM activities WHERE id = ?').bind(id).first();
        return c.json(activity);
    }
    return c.json({ error: 'Activity not found' }, 404);
});
app.delete('/api/activities/:id', async (c) => {
    const db = c.env.DB;
    const id = c.req.param('id');
    const result = await db.prepare('DELETE FROM activities WHERE id = ?').bind(id).run();
    if (result.success) {
        return c.json({ success: true });
    }
    return c.json({ error: 'Activity not found' }, 404);
});
// KPIs endpoints
app.get('/api/kpis', async (c) => {
    const db = c.env.DB;
    const kpis = await db.prepare('SELECT * FROM kpis ORDER BY created_at DESC').all();
    return c.json(kpis.results);
});
app.post('/api/kpis', (0, zod_validator_1.zValidator)('json', types_1.KPISchema), async (c) => {
    const db = c.env.DB;
    const data = c.req.valid('json');
    const result = await db.prepare(`
    INSERT INTO kpis (nome_kpi, descricao, valor_meta_kpi, peso_kpi, turno_kpi, funcao_kpi, status_ativo, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `).bind(data.nome_kpi, data.descricao || null, data.valor_meta_kpi, data.peso_kpi, data.turno_kpi, data.funcao_kpi, data.status_ativo).run();
    if (result.success) {
        const kpi = await db.prepare('SELECT * FROM kpis WHERE id = ?').bind(result.meta.last_row_id).first();
        return c.json(kpi);
    }
    return c.json({ error: 'Failed to create KPI' }, 500);
});
app.put('/api/kpis/:id', (0, zod_validator_1.zValidator)('json', types_1.KPISchema.partial()), async (c) => {
    const db = c.env.DB;
    const id = c.req.param('id');
    const data = c.req.valid('json');
    // Build dynamic update query
    const updates = [];
    const values = [];
    if (data.nome_kpi !== undefined) {
        updates.push('nome_kpi = ?');
        values.push(data.nome_kpi);
    }
    if (data.descricao !== undefined) {
        updates.push('descricao = ?');
        values.push(data.descricao);
    }
    if (data.valor_meta_kpi !== undefined) {
        updates.push('valor_meta_kpi = ?');
        values.push(data.valor_meta_kpi);
    }
    if (data.peso_kpi !== undefined) {
        updates.push('peso_kpi = ?');
        values.push(data.peso_kpi);
    }
    if (data.turno_kpi !== undefined) {
        updates.push('turno_kpi = ?');
        values.push(data.turno_kpi);
    }
    if (data.funcao_kpi !== undefined) {
        updates.push('funcao_kpi = ?');
        values.push(data.funcao_kpi);
    }
    if (data.status_ativo !== undefined) {
        updates.push('status_ativo = ?');
        values.push(data.status_ativo);
    }
    if (updates.length === 0) {
        return c.json({ error: 'No fields to update' }, 400);
    }
    updates.push('updated_at = datetime(\'now\')');
    values.push(id);
    const result = await db.prepare(`
    UPDATE kpis 
    SET ${updates.join(', ')}
    WHERE id = ?
  `).bind(...values).run();
    if (result.success) {
        const kpi = await db.prepare('SELECT * FROM kpis WHERE id = ?').bind(id).first();
        return c.json(kpi);
    }
    return c.json({ error: 'KPI not found' }, 404);
});
app.delete('/api/kpis/:id', async (c) => {
    const db = c.env.DB;
    const id = c.req.param('id');
    const result = await db.prepare('DELETE FROM kpis WHERE id = ?').bind(id).run();
    if (result.success) {
        return c.json({ success: true });
    }
    return c.json({ error: 'KPI not found' }, 404);
});
// Get available KPIs for function/shift (limited to 2 active KPIs)
app.get('/api/kpis/available', async (c) => {
    const db = c.env.DB;
    const funcao = c.req.query('funcao');
    const turno = c.req.query('turno');
    if (!funcao || !turno) {
        return c.json({ error: 'Função e turno são obrigatórios' }, 400);
    }
    const kpis = await db.prepare(`
    SELECT * FROM kpis 
    WHERE funcao_kpi = ? AND (turno_kpi = ? OR turno_kpi = 'Geral') AND status_ativo = true
    ORDER BY created_at DESC
    LIMIT 2
  `).bind(funcao, turno).all();
    return c.json(kpis.results);
});
// Check KPI daily limit for user
app.post('/api/kpis/check-limit', (0, zod_validator_1.zValidator)('json', types_1.KPILimitCheckSchema), async (c) => {
    const db = c.env.DB;
    const { user_id, data_lancamento } = c.req.valid('json');
    // Count KPI launches for the user on the specific date
    const count = await db.prepare(`
    SELECT COUNT(*) as total FROM lancamentos_produtividade 
    WHERE user_id = ? AND data_lancamento = ? AND kpis_atingidos IS NOT NULL AND kpis_atingidos != '[]'
  `).bind(user_id, data_lancamento).first();
    const canLaunch = count.total < 1;
    const remaining = Math.max(0, 1 - count.total);
    return c.json({
        can_launch: canLaunch,
        current_count: count.total,
        remaining_launches: remaining,
        daily_limit: 1
    });
});
// Calculator endpoint
app.post('/api/calculate', (0, zod_validator_1.zValidator)('json', types_1.CalculatorInputSchema), async (c) => {
    const db = c.env.DB;
    const { nome_atividade, funcao, turno, quantidade_produzida, tempo_horas, input_adicional, kpis_atingidos, multiple_activities, valid_tasks_count } = c.req.valid('json');
    let subtotal_atividades = 0;
    let atividades_detalhes = [];
    let produtividade_alcancada;
    let nivel_atingido;
    let unidade_medida;
    let tarefas_validas;
    let valor_tarefas;
    // Handle multiple activities for Ajudantes de Armazém
    if (funcao === 'Ajudante de Armazém' && multiple_activities && multiple_activities.length > 0) {
        for (const activity of multiple_activities) {
            const produtividade = activity.quantidade_produzida / activity.tempo_horas;
            // Get activities for this activity name, ordered by produtividade_minima descending
            const activities = await db.prepare(`
        SELECT * FROM activities 
        WHERE nome_atividade = ? 
        ORDER BY produtividade_minima DESC
      `).bind(activity.nome_atividade).all();
            if (activities.results && activities.results.length > 0) {
                // Find the appropriate level based on productivity
                let selectedActivity = null;
                for (const act of activities.results) {
                    if (produtividade >= act.produtividade_minima) {
                        selectedActivity = act;
                        break;
                    }
                }
                // If no level achieved, use the lowest level
                if (!selectedActivity) {
                    selectedActivity = activities.results[activities.results.length - 1];
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
        const activities = await db.prepare(`
      SELECT * FROM activities 
      WHERE nome_atividade = ? 
      ORDER BY produtividade_minima DESC
    `).bind(nome_atividade).all();
        if (!activities.results || activities.results.length === 0) {
            return c.json({ error: 'Atividade não encontrada' }, 404);
        }
        // Find the appropriate level based on productivity
        let selectedActivity = null;
        for (const activity of activities.results) {
            if (produtividade_alcancada >= activity.produtividade_minima) {
                selectedActivity = activity;
                break;
            }
        }
        // If no level achieved, use the lowest level
        if (!selectedActivity) {
            selectedActivity = activities.results[activities.results.length - 1];
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
        const kpis = await db.prepare(`
      SELECT * FROM kpis 
      WHERE funcao_kpi = ? AND (turno_kpi = ? OR turno_kpi = 'Geral') AND nome_kpi IN (${kpis_atingidos.map(() => '?').join(',')})
    `).bind(funcao, turno, ...kpis_atingidos).all();
        for (const kpi of kpis.results) {
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
    if (produtividade_alcancada !== undefined)
        result.produtividade_alcancada = produtividade_alcancada;
    if (nivel_atingido !== undefined)
        result.nivel_atingido = nivel_atingido;
    if (unidade_medida !== undefined)
        result.unidade_medida = unidade_medida;
    if (atividades_detalhes.length > 0)
        result.atividades_detalhes = atividades_detalhes;
    if (tarefas_validas !== undefined)
        result.tarefas_validas = tarefas_validas;
    if (valor_tarefas !== undefined)
        result.valor_tarefas = valor_tarefas;
    return c.json(result);
});
// Get unique functions from KPIs
app.get('/api/functions', async (c) => {
    const db = c.env.DB;
    const functions = await db.prepare('SELECT DISTINCT funcao_kpi as funcao FROM kpis ORDER BY funcao_kpi').all();
    return c.json(functions);
});
// Get unique activity names
app.get('/api/activity-names', async (c) => {
    const db = c.env.DB;
    const activityNames = await db.prepare('SELECT DISTINCT nome_atividade FROM activities ORDER BY nome_atividade').all();
    return c.json(activityNames);
});
// Lançamentos endpoints
app.post('/api/lancamentos', (0, zod_validator_1.zValidator)('json', types_1.CreateLancamentoSchema), async (c) => {
    const db = c.env.DB;
    const { data_lancamento, calculator_data, calculator_result, user_id } = c.req.valid('json');
    // Get current user by ID if provided, or fallback to getting any user (for testing)
    let currentUser = null;
    if (user_id) {
        currentUser = await db.prepare('SELECT * FROM usuarios WHERE id = ?').bind(user_id).first();
    }
    // If no specific user provided or not found, error out
    if (!currentUser) {
        return c.json({ error: 'Usuário não identificado. Faça login novamente.' }, 401);
    }
    if (!currentUser) {
        return c.json({ error: 'Usuário não encontrado' }, 401);
    }
    // Check if user is trying to launch KPIs and validate daily limit
    const hasKPIs = calculator_data.kpis_atingidos &&
        Array.isArray(calculator_data.kpis_atingidos) &&
        calculator_data.kpis_atingidos.length > 0;
    if (hasKPIs) {
        // Count existing KPI launches for the user on the specific date
        const existingKPICount = await db.prepare(`
      SELECT COUNT(*) as total FROM lancamentos_produtividade 
      WHERE user_id = ? AND data_lancamento = ? AND kpis_atingidos IS NOT NULL AND kpis_atingidos != '[]'
    `).bind(currentUser.id, data_lancamento).first();
        if (existingKPICount.total >= 1) {
            return c.json({
                error: 'Limite diário de KPIs atingido',
                message: 'Você já possui 1 lançamento de KPI para esta data. Remova os KPIs do cálculo atual ou escolha uma data diferente.',
                current_count: existingKPICount.total,
                daily_limit: 1
            }, 400);
        }
    }
    const result = await db.prepare(`
    INSERT INTO lancamentos_produtividade (
      user_id, user_nome, user_cpf, data_lancamento, funcao, turno,
      nome_atividade, quantidade_produzida, tempo_horas, input_adicional,
      multiple_activities, nome_operador, valid_tasks_count, kpis_atingidos,
      subtotal_atividades, bonus_kpis, remuneracao_total,
      produtividade_alcancada, nivel_atingido, unidade_medida,
      atividades_detalhes, tarefas_validas, valor_tarefas,
      status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `).bind(currentUser.id, currentUser.nome, currentUser.cpf, data_lancamento, calculator_data.funcao, calculator_data.turno, calculator_data.nome_atividade || null, calculator_data.quantidade_produzida || null, calculator_data.tempo_horas || null, calculator_data.input_adicional || 0, calculator_data.multiple_activities ? JSON.stringify(calculator_data.multiple_activities) : null, calculator_data.nome_operador || null, calculator_data.valid_tasks_count || null, calculator_data.kpis_atingidos ? JSON.stringify(calculator_data.kpis_atingidos) : null, calculator_result.subtotal_atividades, calculator_result.bonus_kpis, calculator_result.remuneracao_total, calculator_result.produtividade_alcancada || null, calculator_result.nivel_atingido || null, calculator_result.unidade_medida || null, calculator_result.atividades_detalhes ? JSON.stringify(calculator_result.atividades_detalhes) : null, calculator_result.tarefas_validas || null, calculator_result.valor_tarefas || null, 'pendente').run();
    if (result.success) {
        const lancamento = await db.prepare('SELECT * FROM lancamentos_produtividade WHERE id = ?').bind(result.meta.last_row_id).first();
        return c.json(lancamento);
    }
    return c.json({ error: 'Falha ao criar lançamento' }, 500);
});
app.get('/api/lancamentos', async (c) => {
    const db = c.env.DB;
    const status = c.req.query('status');
    let query = 'SELECT * FROM lancamentos_produtividade';
    let params = [];
    if (status) {
        query += ' WHERE status = ?';
        params.push(status);
    }
    query += ' ORDER BY created_at DESC';
    const lancamentos = await db.prepare(query).bind(...params).all();
    return c.json(lancamentos.results);
});
app.get('/api/lancamentos/pendentes', async (c) => {
    const db = c.env.DB;
    const lancamentos = await db.prepare(`
    SELECT * FROM lancamentos_produtividade 
    WHERE status = 'pendente' 
    ORDER BY created_at ASC
  `).all();
    return c.json(lancamentos.results);
});
app.post('/api/lancamentos/:id/validar', (0, zod_validator_1.zValidator)('json', types_1.AdminValidationSchema), async (c) => {
    const db = c.env.DB;
    const id = c.req.param('id');
    try {
        const { acao, observacoes, dados_editados } = c.req.valid('json');
        // Get the original lancamento
        const originalLancamento = await db.prepare('SELECT * FROM lancamentos_produtividade WHERE id = ?').bind(id).first();
        if (!originalLancamento) {
            return c.json({ error: 'Lançamento não encontrado' }, 404);
        }
        // Get current admin user
        const adminUser = await db.prepare('SELECT * FROM usuarios WHERE role = ? LIMIT 1').bind('admin').first();
        if (!adminUser) {
            return c.json({ error: 'Usuário admin não encontrado' }, 401);
        }
        let newStatus = 'pendente';
        let isEdited = false;
        let recalculatedData = null;
        if (acao === 'aprovar') {
            newStatus = 'aprovado';
        }
        else if (acao === 'reprovar') {
            newStatus = 'reprovado';
        }
        else if (acao === 'editar') {
            newStatus = 'aprovado'; // Auto-approve after edit
            isEdited = true;
            if (dados_editados) {
                // Recalculate with edited data
                try {
                    const calcResponse = await fetch(`${c.req.url.split('/api')[0]}/api/calculate`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(dados_editados),
                    });
                    if (calcResponse.ok) {
                        const responseText = await calcResponse.text();
                        try {
                            recalculatedData = JSON.parse(responseText);
                        }
                        catch (parseError) {
                            console.error('Error parsing calculation response:', responseText);
                            return c.json({ error: 'Erro ao recalcular dados editados' }, 500);
                        }
                    }
                    else {
                        console.error('Calculation request failed:', calcResponse.status);
                        return c.json({ error: 'Erro na requisição de recálculo' }, 500);
                    }
                }
                catch (fetchError) {
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
        try {
            if (isEdited && recalculatedData && dados_editados) {
                const updateResult = await db.prepare(`
        UPDATE lancamentos_produtividade 
        SET status = ?, observacoes = ?, 
            editado_por_admin = ?, data_edicao = datetime('now'), 
            valores_originais = ?, status_edicao = ?, observacoes_edicao = ?,
            nome_atividade = ?, quantidade_produzida = ?, tempo_horas = ?, input_adicional = ?,
            multiple_activities = ?, nome_operador = ?, valid_tasks_count = ?, kpis_atingidos = ?,
            subtotal_atividades = ?, bonus_kpis = ?, remuneracao_total = ?,
            produtividade_alcancada = ?, nivel_atingido = ?, unidade_medida = ?,
            atividades_detalhes = ?, tarefas_validas = ?, valor_tarefas = ?,
            updated_at = datetime('now')
        WHERE id = ?
      `).bind(newStatus, observacoes || null, adminUser.nome, originalValues, 'editado_admin', observacoes || null, dados_editados.nome_atividade || null, dados_editados.quantidade_produzida || null, dados_editados.tempo_horas || null, dados_editados.input_adicional || 0, dados_editados.multiple_activities ? JSON.stringify(dados_editados.multiple_activities) : null, dados_editados.nome_operador || null, dados_editados.valid_tasks_count || null, dados_editados.kpis_atingidos ? JSON.stringify(dados_editados.kpis_atingidos) : null, recalculatedData.subtotal_atividades, recalculatedData.bonus_kpis, recalculatedData.remuneracao_total, recalculatedData.produtividade_alcancada || null, recalculatedData.nivel_atingido || null, recalculatedData.unidade_medida || null, recalculatedData.atividades_detalhes ? JSON.stringify(recalculatedData.atividades_detalhes) : null, recalculatedData.tarefas_validas || null, recalculatedData.valor_tarefas || null, id).run();
                if (!updateResult.success) {
                    console.error('Failed to update edited lancamento:', updateResult);
                    return c.json({ error: 'Erro ao salvar lançamento editado' }, 500);
                }
            }
            else {
                const updateResult = await db.prepare(`
        UPDATE lancamentos_produtividade 
        SET status = ?, observacoes = ?, updated_at = datetime('now')
        WHERE id = ?
      `).bind(newStatus, observacoes || null, id).run();
                if (!updateResult.success) {
                    console.error('Failed to update lancamento status:', updateResult);
                    return c.json({ error: 'Erro ao atualizar status do lançamento' }, 500);
                }
            }
        }
        catch (dbError) {
            console.error('Database error during update:', dbError);
            return c.json({ error: 'Erro de banco de dados ao atualizar lançamento' }, 500);
        }
        // Create revision record
        try {
            const revisionResult = await db.prepare(`
      INSERT INTO lancamentos_produtividade_revisado (
        lancamento_original_id, admin_user_id, admin_nome,
        user_id, user_nome, user_cpf, data_lancamento, funcao, turno,
        nome_atividade, quantidade_produzida, tempo_horas, input_adicional,
        multiple_activities, nome_operador, valid_tasks_count, kpis_atingidos,
        subtotal_atividades, bonus_kpis, remuneracao_total,
        produtividade_alcancada, nivel_atingido, unidade_medida,
        atividades_detalhes, tarefas_validas, valor_tarefas,
        acao_admin, observacoes_admin, alteracoes_feitas,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(originalLancamento.id, adminUser.id, adminUser.nome, originalLancamento.user_id, originalLancamento.user_nome, originalLancamento.user_cpf, originalLancamento.data_lancamento, originalLancamento.funcao, originalLancamento.turno, originalLancamento.nome_atividade, originalLancamento.quantidade_produzida, originalLancamento.tempo_horas, originalLancamento.input_adicional, originalLancamento.multiple_activities, originalLancamento.nome_operador, originalLancamento.valid_tasks_count, originalLancamento.kpis_atingidos, originalLancamento.subtotal_atividades, originalLancamento.bonus_kpis, originalLancamento.remuneracao_total, originalLancamento.produtividade_alcancada, originalLancamento.nivel_atingido, originalLancamento.unidade_medida, originalLancamento.atividades_detalhes, originalLancamento.tarefas_validas, originalLancamento.valor_tarefas, acao, observacoes || null, isEdited ? originalValues : null).run();
            if (!revisionResult.success) {
                console.error('Failed to create revision record:', revisionResult);
                // Not a critical error, continue processing
            }
        }
        catch (revisionError) {
            console.error('Error creating revision record:', revisionError);
            // Not a critical error, continue processing
        }
        // If approved, add to history table
        if (newStatus === 'aprovado') {
            try {
                const finalLancamento = await db.prepare('SELECT * FROM lancamentos_produtividade WHERE id = ?').bind(id).first();
                if (finalLancamento) {
                    const historyResult = await db.prepare(`
          INSERT INTO historico_lancamentos_aprovados (
            lancamento_id, colaborador_id, colaborador_nome, colaborador_cpf,
            data_lancamento, data_aprovacao, aprovado_por, editado, editado_por,
            dados_finais, observacoes, remuneracao_total,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, datetime('now'), ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        `).bind(finalLancamento.id, finalLancamento.user_id, finalLancamento.user_nome, finalLancamento.user_cpf, finalLancamento.data_lancamento, adminUser.nome, isEdited, isEdited ? adminUser.nome : null, JSON.stringify(finalLancamento), observacoes || null, finalLancamento.remuneracao_total).run();
                    if (!historyResult.success) {
                        console.error('Failed to create history record:', historyResult);
                        // Not critical, continue
                    }
                }
            }
            catch (historyError) {
                console.error('Error creating history record:', historyError);
                // Not critical, continue
            }
        }
        const updatedLancamento = await db.prepare('SELECT * FROM lancamentos_produtividade WHERE id = ?').bind(id).first();
        return c.json(updatedLancamento);
    }
    catch (error) {
        console.error('Error in validation endpoint:', error);
        return c.json({
            error: 'Erro interno do servidor durante validação',
            details: error instanceof Error ? error.message : 'Erro desconhecido'
        }, 500);
    }
});
// Add endpoint to get approval history
app.get('/api/historico-aprovacoes', async (c) => {
    const db = c.env.DB;
    const colaborador = c.req.query('colaborador');
    const admin = c.req.query('admin');
    const editado = c.req.query('editado');
    let query = 'SELECT * FROM historico_lancamentos_aprovados';
    const conditions = [];
    const params = [];
    if (colaborador) {
        conditions.push('colaborador_nome LIKE ?');
        params.push(`%${colaborador}%`);
    }
    if (admin) {
        conditions.push('aprovado_por LIKE ?');
        params.push(`%${admin}%`);
    }
    if (editado === 'true') {
        conditions.push('editado = ?');
        params.push(true);
    }
    else if (editado === 'false') {
        conditions.push('editado = ?');
        params.push(false);
    }
    if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY data_aprovacao DESC';
    const history = await db.prepare(query).bind(...params).all();
    return c.json(history.results);
});
// Export endpoints
app.post('/api/export-preview', (0, zod_validator_1.zValidator)('json', types_1.ExportFilterSchema), async (c) => {
    const db = c.env.DB;
    const filtros = c.req.valid('json');
    try {
        const result = await generateExportData(db, filtros);
        return c.json(result);
    }
    catch (error) {
        console.error('Erro no preview de exportação:', error);
        return c.json({ error: 'Erro ao gerar preview dos dados' }, 500);
    }
});
// Helper function to generate export data
async function generateExportData(db, filtros) {
    let query = `
    SELECT 
      strftime('%m/%Y', lp.data_lancamento) as mes,
      u.cpf,
      u.nome,
      u.funcao,
      SUM(lp.remuneracao_total) as valor_rv,
      COUNT(lp.id) as total_lancamentos
    FROM lancamentos_produtividade lp
    INNER JOIN usuarios u ON lp.user_id = u.id
    WHERE 1=1
  `;
    const params = [];
    // Apply filters
    if (filtros.periodo_inicio) {
        query += ' AND lp.data_lancamento >= ?';
        params.push(filtros.periodo_inicio);
    }
    if (filtros.periodo_fim) {
        query += ' AND lp.data_lancamento <= ?';
        params.push(filtros.periodo_fim);
    }
    if (filtros.funcao) {
        query += ' AND u.funcao = ?';
        params.push(filtros.funcao);
    }
    if (filtros.colaborador_id) {
        query += ' AND u.id = ?';
        params.push(filtros.colaborador_id);
    }
    if (filtros.status !== 'todos') {
        query += ' AND lp.status = ?';
        params.push(filtros.status);
    }
    query += ` 
    AND u.is_active = true
    GROUP BY strftime('%m/%Y', lp.data_lancamento), u.id, u.cpf, u.nome, u.funcao
    ORDER BY lp.data_lancamento DESC, u.nome ASC
  `;
    const result = await db.prepare(query).bind(...params).all();
    const dados = result.results;
    const total_registros = dados.length;
    const valor_total = dados.reduce((sum, item) => sum + (item.valor_rv || 0), 0);
    const valor_medio = total_registros > 0 ? valor_total / total_registros : 0;
    return {
        dados,
        total_registros,
        valor_total,
        valor_medio
    };
}
app.post('/api/export-data', async (c) => {
    const db = c.env.DB;
    const { filtros, formato, admin_id, admin_nome } = await c.req.json();
    try {
        // Generate data directly instead of making internal HTTP call
        const previewData = await generateExportData(db, filtros);
        const dados = previewData.dados;
        if (dados.length === 0) {
            return c.json({ error: 'Nenhum dado encontrado para exportar' }, 400);
        }
        // Generate filename
        const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '').replace('T', '_');
        const filename = `produtividade_${timestamp}.${formato}`;
        // Log the export
        await db.prepare(`
      INSERT INTO log_exportacoes (
        admin_id, admin_nome, filtros_aplicados, formato_exportacao, 
        total_registros, nome_arquivo, data_exportacao,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'), datetime('now'))
    `).bind(admin_id, admin_nome, JSON.stringify(filtros), formato, dados.length, filename).run();
        // Generate and return the file based on format
        if (formato === 'csv') {
            const csvContent = generateCSV(dados, admin_nome);
            return new Response(csvContent, {
                headers: {
                    'Content-Type': 'text/csv;charset=utf-8-sig',
                    'Content-Disposition': `attachment; filename="${filename}"`,
                    'Cache-Control': 'no-cache'
                }
            });
        }
        else if (formato === 'xlsx') {
            // For now, return CSV for xlsx (client will handle Excel generation)
            const csvContent = generateCSV(dados, admin_nome);
            return new Response(csvContent, {
                headers: {
                    'Content-Type': 'text/csv;charset=utf-8',
                    'Content-Disposition': `attachment; filename="${filename}"`
                }
            });
        }
        else if (formato === 'pdf') {
            // For now, return CSV for PDF (client will handle PDF generation)
            const csvContent = generateCSV(dados, admin_nome);
            return new Response(csvContent, {
                headers: {
                    'Content-Type': 'text/csv;charset=utf-8',
                    'Content-Disposition': `attachment; filename="${filename}"`
                }
            });
        }
        return c.json({ error: 'Formato não suportado' }, 400);
    }
    catch (error) {
        console.error('Erro na exportação:', error);
        return c.json({ error: 'Erro ao exportar dados' }, 500);
    }
});
function generateCSV(dados, adminNome) {
    const headers = ['MES', 'CPF', 'NOME', 'FUNCAO', 'VALOR_RV', 'TOTAL_LANCAMENTOS', 'DATA_EXPORTACAO', 'EXPORTADO_POR'];
    const dataAtual = new Date().toLocaleString('pt-BR');
    // Add BOM for UTF-8 encoding (better Excel compatibility)
    let csvContent = '\uFEFF';
    // Add headers with proper escaping
    csvContent += headers.map(header => `"${header}"`).join(';') + '\r\n';
    // Add data rows with proper formatting
    dados.forEach(linha => {
        const row = [
            `"${linha.mes || ''}"`,
            `"${linha.cpf || ''}"`,
            `"${(linha.nome || '').replace(/"/g, '""')}"`, // Escape quotes
            `"${(linha.funcao || '').replace(/"/g, '""')}"`, // Escape quotes
            `"${(linha.valor_rv || 0).toFixed(2).replace('.', ',')}"`, // Brazilian decimal format
            `"${linha.total_lancamentos || 0}"`,
            `"${dataAtual}"`,
            `"${adminNome.replace(/"/g, '""')}"` // Escape quotes
        ];
        csvContent += row.join(';') + '\r\n';
    });
    return csvContent;
}
app.get('/api/export-logs', async (c) => {
    const db = c.env.DB;
    try {
        const logs = await db.prepare(`
      SELECT * FROM log_exportacoes 
      ORDER BY data_exportacao DESC 
      LIMIT 50
    `).all();
        return c.json(logs.results);
    }
    catch (error) {
        console.error('Erro ao buscar logs de exportação:', error);
        return c.json({ error: 'Erro ao carregar logs' }, 500);
    }
});
export default app;
