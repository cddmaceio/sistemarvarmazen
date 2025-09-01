"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hono_1 = require("hono");
const zod_validator_1 = require("@hono/zod-validator");
const types_1 = require("../../shared/types");
const utils_1 = require("../utils");
const authRoutes = new hono_1.Hono();
// POST /api/auth/login
authRoutes.post('/login', (0, zod_validator_1.zValidator)('json', types_1.LoginSchema), async (c) => {
    const supabase = (0, utils_1.getSupabase)(c.env);
    const { cpf, data_nascimento } = c.req.valid('json');
    const { data: user, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('cpf', cpf)
        .eq('data_nascimento', data_nascimento)
        .eq('status_usuario', 'ativo')
        .single();
    if (error || !user) {
        return c.json({ message: 'CPF ou data de nascimento incorretos' }, 401);
    }
    return c.json(user);
});
// POST /api/auth/logout
authRoutes.post('/logout', async (c) => {
    return c.json({ success: true, message: 'Logged out successfully' });
});
exports.default = authRoutes;
