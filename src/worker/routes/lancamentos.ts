import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { CreateLancamentoSchema } from '../../shared/types';
import { getSupabase, Env } from '../utils';

const lancamentoRoutes = new Hono<{ Bindings: Env }>();

// GET /api/lancamentos
lancamentoRoutes.get('/lancamentos', async (c) => {
  const supabase = getSupabase(c.env);
  
  const { data: lancamentos, error } = await supabase
    .from('lancamentos_produtividade')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return c.json({ error: error.message }, 500);
  }

  return c.json(lancamentos || []);
});

// POST /api/lancamentos
lancamentoRoutes.post('/lancamentos', zValidator('json', CreateLancamentoSchema), async (c) => {
  const supabase = getSupabase(c.env);
  const data = c.req.valid('json');

  // Check daily KPI limit
  if (data.calculator_result?.kpisAtingidos && data.calculator_result.kpisAtingidos.length > 0) {
    const { data: existingLancamentos, error: countError } = await supabase
      .from('lancamentos_produtividade')
      .select('id')
      .eq('user_id', data.user_id)
      .eq('data_lancamento', data.data_lancamento)
      .neq('status', 'rejeitado');

    if (countError) {
      console.error('Error checking existing lancamentos:', countError);
      return c.json({ error: 'Erro ao verificar lançamentos existentes' }, 500);
    }

    const currentCount = existingLancamentos?.length || 0;
    const dailyLimit = 1; // Maximum 1 KPI launch per day

    if (currentCount >= dailyLimit) {
      return c.json({
        error: 'Limite diário de KPIs atingido',
        message: `Você já atingiu o limite de ${dailyLimit} lançamento(s) de KPI por dia.`,
        current_count: currentCount,
        daily_limit: dailyLimit
      }, 400);
    }
  }

  const { data: lancamento, error } = await supabase
    .from('lancamentos_produtividade')
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

  return c.json(lancamento);
});

// PUT /api/lancamentos/:id
lancamentoRoutes.put('/lancamentos/:id', async (c) => {
  const supabase = getSupabase(c.env);
  const id = parseInt(c.req.param('id'));
  const { status, observacoes } = await c.req.json();

  const { data: lancamento, error } = await supabase
    .from('lancamentos_produtividade')
    .update({
      status,
      observacoes,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return c.json({ error: error.message }, 500);
  }

  return c.json(lancamento);
});

// DELETE /api/lancamentos/:id
lancamentoRoutes.delete('/lancamentos/:id', async (c) => {
  const supabase = getSupabase(c.env);
  const id = parseInt(c.req.param('id'));

  const { error } = await supabase
    .from('lancamentos_produtividade')
    .delete()
    .eq('id', id);

  if (error) {
    return c.json({ error: error.message }, 500);
  }

  return c.json({ success: true });
});

// GET /api/export-preview
lancamentoRoutes.get('/export-preview', async (c) => {
  const supabase = getSupabase(c.env);
  
  const { data: lancamentos, error } = await supabase
    .from('lancamentos_produtividade')
    .select('*')
    .eq('status', 'aprovado')
    .order('data_lancamento', { ascending: true });

  if (error) {
    return c.json({ error: error.message }, 500);
  }

  return c.json(lancamentos || []);
});

export default lancamentoRoutes;