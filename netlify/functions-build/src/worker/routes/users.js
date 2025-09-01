"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hono_1 = require("hono");
const zod_validator_1 = require("@hono/zod-validator");
const types_1 = require("../../shared/types");
const utils_1 = require("../utils");
const userRoutes = new hono_1.Hono();
// GET /api/usuarios
userRoutes.get('/', async (c) => {
    const supabase = (0, utils_1.getSupabase)(c.env);
    const { data: users, error } = await supabase
        .from('usuarios')
        .select('*')
        .order('created_at', { ascending: false });
    if (error) {
        return c.json({ error: error.message }, 500);
    }
    return c.json(users || []);
});
// POST /api/usuarios
userRoutes.post('/', (0, zod_validator_1.zValidator)('json', types_1.UserSchema), async (c) => {
    const supabase = (0, utils_1.getSupabase)(c.env);
    const data = c.req.valid('json');
    const { data: user, error } = await supabase
        .from('usuarios')
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
    return c.json(user);
});
// PUT /api/usuarios/:id
userRoutes.put('/:id', (0, zod_validator_1.zValidator)('json', types_1.UserSchema.partial()), async (c) => {
    const supabase = (0, utils_1.getSupabase)(c.env);
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
// DELETE /api/usuarios/:id
userRoutes.delete('/:id', async (c) => {
    const supabase = (0, utils_1.getSupabase)(c.env);
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
exports.default = userRoutes;
