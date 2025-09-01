import { Hono } from 'hono';
import { getSupabase, Env } from '../utils';

const monthlyEarningsRoutes = new Hono<{ Bindings: Env }>();

monthlyEarningsRoutes.get('/monthly-earnings', async (c) => {
  const { funcao, mesAno } = c.req.query();
  const supabase = getSupabase(c.env);



  try {
    let query = supabase.from('ganhos_mensais_com_usuarios').select('*');

    if (funcao) {
      query = query.eq('funcao', funcao);
    }

    if (mesAno) {
      query = query.eq('mes_ano', mesAno);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return c.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching monthly earnings:', error);
    return c.json({ success: false, error: (error as Error).message }, 500);
  }
});

export default monthlyEarningsRoutes;