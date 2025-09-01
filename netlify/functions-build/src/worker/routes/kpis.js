"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hono_1 = require("hono");
const zod_validator_1 = require("@hono/zod-validator");
const types_1 = require("../../shared/types");
const utils_1 = require("../utils");
const kpiRoutes = new hono_1.Hono();
// GET /api/kpis
kpiRoutes.get('/kpis', async (c) => {
    const supabase = (0, utils_1.getSupabase)(c.env);
    const { data: kpis, error } = await supabase
        .from('kpis')
        .select('*')
        .order('nome_kpi', { ascending: true });
    if (error) {
        return c.json({ error: error.message }, 500);
    }
    // Return complete KPI objects instead of just names
    const kpiObjects = kpis || [];
    return c.json({ kpisAtingidos: kpiObjects });
});
// GET /api/functions
kpiRoutes.get('/functions', async (c) => {
    const supabase = (0, utils_1.getSupabase)(c.env);
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
// GET /api/kpis/available - Get available KPIs for function and shift
kpiRoutes.get('/kpis/available', async (c) => {
    const supabase = (0, utils_1.getSupabase)(c.env);
    const funcao = c.req.query('funcao');
    const turno = c.req.query('turno');
    if (!funcao || !turno) {
        return c.json({ error: 'Função e turno são obrigatórios' }, 400);
    }
    // Map input to database values
    const dbFuncao = funcao; // Use correct encoding
    const dbTurno = turno === 'Manha' ? 'Manhã' : turno; // Map to correct turno with accent
    const { data: kpis, error } = await supabase
        .from('kpis')
        .select('*')
        .eq('funcao_kpi', dbFuncao)
        .in('turno_kpi', [dbTurno, 'Geral']);
    if (error) {
        console.error('Error fetching available KPIs:', error);
        return c.json({ error: 'Erro ao buscar KPIs disponíveis' }, 500);
    }
    const kpiNames = kpis?.map(kpi => kpi.nome_kpi) || [];
    return c.json({ kpisAtingidos: kpiNames });
});
// POST /api/kpis
kpiRoutes.post('/kpis', (0, zod_validator_1.zValidator)('json', types_1.KPISchema), async (c) => {
    const supabase = (0, utils_1.getSupabase)(c.env);
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
// PUT /api/kpis/:id
kpiRoutes.put('/kpis/:id', (0, zod_validator_1.zValidator)('json', types_1.KPISchema.partial()), async (c) => {
    const supabase = (0, utils_1.getSupabase)(c.env);
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
// DELETE /api/kpis/:id
kpiRoutes.delete('/kpis/:id', async (c) => {
    const supabase = (0, utils_1.getSupabase)(c.env);
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
exports.default = kpiRoutes;
