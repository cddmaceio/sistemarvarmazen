import { Hono } from 'hono';
import { createClient } from '@supabase/supabase-js';
import { cors } from 'hono/cors';

const app = new Hono();

app.use('*', cors());

app.get('/api/monthly-earnings', async (c) => {
  const { funcao, mesAno } = c.req.query();
  const supabaseUrl = c.env.SUPABASE_URL;
  const supabaseAnonKey = c.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return c.json({ success: false, error: 'Supabase credentials not provided' }, 500);
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  try {
    let query = supabase.from('monthly_earnings_view').select('*');

    if (funcao) {
      query = query.eq('funcao', funcao);
    }

    if (mesAno) {
      const [year, month] = mesAno.split('-');
      const startDate = `${year}-${month}-01T00:00:00.000Z`;
      const endDate = new Date(parseInt(year), parseInt(month), 0);
      const endOfMonth = `${year}-${month}-${endDate.getDate()}T23:59:59.999Z`;
      
      query = query.gte('data', startDate).lte('data', endOfMonth);
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

export default app;