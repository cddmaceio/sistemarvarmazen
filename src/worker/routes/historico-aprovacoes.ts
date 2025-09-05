import { Hono } from 'hono';
import { createClient } from '@supabase/supabase-js';
import { Env } from '../utils';

const app = new Hono<{ Bindings: Env }>();

// GET /api/historico-aprovacoes - Buscar histórico de aprovações
app.get('/historico-aprovacoes', async (c) => {
  try {
    const supabase = createClient(
      c.env.SUPABASE_URL,
      c.env.SUPABASE_ANON_KEY
    );

    // Parâmetros de filtro
    const colaborador = c.req.query('colaborador');
    const colaborador_cpf = c.req.query('colaborador_cpf');
    const admin = c.req.query('admin');
    const editado = c.req.query('editado');

    // Query base para buscar lançamentos aprovados
    let query = supabase
      .from('lancamentos_produtividade')
      .select(`
        id,
        user_id,
        user_nome,
        user_cpf,
        data_lancamento,
        data_aprovacao,
        aprovado_por,
        aprovado_por_nome,
        editado_por_admin,
        data_edicao,
        status_edicao,
        observacoes,
        observacoes_edicao,
        remuneracao_total,
        funcao,
        turno,
        nome_atividade,
        subtotal_atividades,
        bonus_kpis,
        created_at,
        updated_at
      `)
      .eq('status', 'aprovado')
      .order('created_at', { ascending: false });

    // Aplicar filtros se fornecidos
    if (colaborador_cpf) {
      query = query.eq('user_cpf', colaborador_cpf);
    } else if (colaborador) {
      query = query.ilike('user_nome', `%${colaborador}%`);
    }

    if (admin) {
      query = query.ilike('aprovado_por_nome', `%${admin}%`);
    }

    if (editado) {
      if (editado === 'sim') {
        query = query.eq('status_edicao', 'editado_admin');
      } else if (editado === 'nao') {
        query = query.eq('status_edicao', 'original');
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao buscar histórico de aprovações:', error);
      return c.json({ error: 'Erro interno do servidor' }, 500);
    }

    // Transformar dados para o formato esperado pelo frontend
    const historicoFormatado = data.map(item => ({
      id: item.id,
      lancamento_id: item.id,
      colaborador_id: item.user_id,
      colaborador_nome: item.user_nome,
      colaborador_cpf: item.user_cpf,
      data_lancamento: item.data_lancamento,
      data_aprovacao: item.data_aprovacao,
      aprovado_por: item.aprovado_por_nome || item.aprovado_por || 'Sistema',
      editado: item.status_edicao === 'editado_admin',
      editado_por: item.editado_por_admin || null,
      dados_finais: JSON.stringify({
        funcao: item.funcao,
        turno: item.turno,
        nome_atividade: item.nome_atividade,
        subtotal_atividades: item.subtotal_atividades,
        bonus_kpis: item.bonus_kpis,
        remuneracao_total: item.remuneracao_total
      }),
      observacoes: item.observacoes_edicao || item.observacoes || null,
      remuneracao_total: item.remuneracao_total,
      created_at: item.created_at,
      updated_at: item.updated_at
    }));

    return c.json(historicoFormatado);

  } catch (error) {
    console.error('Erro ao processar histórico de aprovações:', error);
    return c.json({ error: 'Erro interno do servidor' }, 500);
  }
});

export default app;