"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hono_1 = require("hono");
const zod_validator_1 = require("@hono/zod-validator");
const types_1 = require("../../shared/types");
const utils_1 = require("../utils");
const activityRoutes = new hono_1.Hono();
// GET /api/activities
activityRoutes.get('/activities', async (c) => {
    const supabase = (0, utils_1.getSupabase)(c.env);
    const { data: activities, error } = await supabase
        .from('activities')
        .select('*')
        .order('nome_atividade', { ascending: true });
    if (error) {
        return c.json({ error: error.message }, 500);
    }
    return c.json(activities || []);
});
// GET /api/activity-names
activityRoutes.get('/activity-names', async (c) => {
    const supabase = (0, utils_1.getSupabase)(c.env);
    const { data: activities, error } = await supabase
        .from('activities')
        .select('nome_atividade')
        .order('nome_atividade');
    if (error) {
        console.error('Error fetching activity names:', error);
        return c.json({ error: 'Erro ao buscar nomes de atividades' }, 500);
    }
    // Get unique activity names
    const uniqueActivities = [...new Set(activities?.map(item => item.nome_atividade) || [])]
        .filter(nome => nome && nome.trim() !== '')
        .map(nome_atividade => ({ nome_atividade }));
    // Force UTF-8 encoding in response
    const response = c.json({ results: uniqueActivities });
    response.headers.set('Content-Type', 'application/json; charset=utf-8');
    response.headers.set('Cache-Control', 'no-cache');
    return response;
});
// POST /api/activities
activityRoutes.post('/activities', (0, zod_validator_1.zValidator)('json', types_1.ActivitySchema), async (c) => {
    const supabase = (0, utils_1.getSupabase)(c.env);
    const data = c.req.valid('json');
    const { data: activity, error } = await supabase
        .from('activities')
        .insert({
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    })
        .select()
        .single();
    if (error) {
        return c.json({ error: error.message }, 500);
    }
    return c.json(activity);
});
// PUT /api/activities/:id
activityRoutes.put('/activities/:id', (0, zod_validator_1.zValidator)('json', types_1.ActivitySchema.partial()), async (c) => {
    const supabase = (0, utils_1.getSupabase)(c.env);
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
// DELETE /api/activities/:id
activityRoutes.delete('/activities/:id', async (c) => {
    const supabase = (0, utils_1.getSupabase)(c.env);
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
exports.default = activityRoutes;
