import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { UserSchema } from '../../shared/types';
import { getSupabase, Env } from '../utils';

const userRoutes = new Hono<{ Bindings: Env }>();

// GET /api/usuarios
userRoutes.get('/', async (c) => {
  const supabase = getSupabase(c.env);
  
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
userRoutes.post('/', zValidator('json', UserSchema), async (c) => {
  const supabase = getSupabase(c.env);
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
userRoutes.put('/:id', zValidator('json', UserSchema.partial()), async (c) => {
  const supabase = getSupabase(c.env);
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
  const supabase = getSupabase(c.env);
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

export default userRoutes;