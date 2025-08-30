import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { LoginSchema } from '../../shared/types';
import { getSupabase, Env } from '../utils';

const authRoutes = new Hono<{ Bindings: Env }>();

// POST /api/auth/login
authRoutes.post('/login', zValidator('json', LoginSchema), async (c) => {
  const supabase = getSupabase(c.env);
  const { cpf, data_nascimento } = c.req.valid('json');

  const { data: user, error } = await supabase
    .from('usuarios')
    .select('*')
    .eq('cpf', cpf)
    .eq('data_nascimento', data_nascimento)
    .eq('is_active', true)
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