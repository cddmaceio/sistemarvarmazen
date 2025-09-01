"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hono_1 = require("hono");
const zod_validator_1 = require("@hono/zod-validator");
const types_1 = require("../../shared/types");
const utils_1 = require("../utils");
const authRoutes = new hono_1.Hono();
// Helper function to format date from DD/MM/YYYY to YYYY-MM-DD
function formatDateToISO(dateStr) {
    // If already in ISO format (YYYY-MM-DD), return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        return dateStr;
    }
    // If in DD/MM/YYYY format, convert to YYYY-MM-DD
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
        const [day, month, year] = dateStr.split('/');
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    // Return original if format is not recognized
    return dateStr;
}
// POST /api/auth/login
authRoutes.post('/login', (0, zod_validator_1.zValidator)('json', types_1.LoginSchema), async (c) => {
    const supabase = (0, utils_1.getSupabase)(c.env);
    const { cpf, data_nascimento } = c.req.valid('json');
    // Format date to ISO format for database query
    const formattedDate = formatDateToISO(data_nascimento);
    const { data: user, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('cpf', cpf)
        .eq('data_nascimento', formattedDate)
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
