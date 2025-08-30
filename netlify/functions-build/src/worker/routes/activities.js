import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { ActivitySchema } from '../../shared/types';
import { getSupabase } from '../utils';
const activityRoutes = new Hono();
// GET /api/activities
activityRoutes.get('/activities', async (c) => {
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
// GET /api/activity-names
activityRoutes.get('/activity-names', async (c) => {
    const supabase = getSupabase(c.env);
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
activityRoutes.post('/activities', zValidator('json', ActivitySchema), async (c) => {
    const supabase = getSupabase(c.env);
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
activityRoutes.put('/activities/:id', zValidator('json', ActivitySchema.partial()), async (c) => {
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
// DELETE /api/activities/:id
activityRoutes.delete('/activities/:id', async (c) => {
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
export default activityRoutes;
