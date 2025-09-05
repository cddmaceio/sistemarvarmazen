import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { LoginSchema } from '../../shared/types';
import { getSupabase } from '../utils';
const authRoutes = new Hono();
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
authRoutes.post('/login', zValidator('json', LoginSchema), async (c) => {
    const supabase = getSupabase(c.env);
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
export default authRoutes;
