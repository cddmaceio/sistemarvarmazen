import { Hono } from 'hono';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';

// Schema para validação de tarefas WMS
const WMSTaskSchema = z.object({
  armazem_mapa: z.string().optional(),
  tarefa: z.string().min(1, 'Tarefa é obrigatória'),
  placa_cavalo: z.string().optional(),
  placa_carreta: z.string().optional(),
  origem: z.string().optional(),
  destino: z.string().optional(),
  palete: z.string().optional(),
  prioridade: z.string().optional(),
  status: z.string().optional(),
  tipo: z.string().min(1, 'Tipo é obrigatório'),
  usuario: z.string().min(1, 'Usuário é obrigatório'),
  user_id: z.string().optional(),
  data_criacao: z.string().optional(),
  data_ultima_associacao: z.string().optional(),
  data_alteracao: z.string().optional(),
  data_liberacao: z.string().optional(),
  concluida_task: z.boolean().default(false),
  tempo_execucao: z.number().min(0).default(0)
});

const WMSTaskUpdateSchema = WMSTaskSchema.partial();

const WMSTaskBulkSchema = z.object({
  nome_operador: z.string().min(1, 'Nome do operador é obrigatório'),
  tarefas: z.array(z.any()).min(1, 'Pelo menos uma tarefa é obrigatória')
});

type Env = {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
};

// Interface para estatísticas de tarefas por tipo
interface TarefasPorTipo {
  [tipo: string]: {
    total: number;
    validas: number;
    invalidas: number;
  };
}

// Interface para tarefa WMS
interface WMSTask {
  tipo?: string;
  tarefa_valida?: boolean;
  tempo_execucao?: number;
  usuario?: string;
  [key: string]: any;
}

// Helper para criar cliente Supabase
function getSupabase(env: Env) {
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
}

const wmsTasksRouter = new Hono<{ Bindings: Env }>();

// ===== CRUD ENDPOINTS =====

// GET /api/wms-tasks - Listar todas as tarefas com filtros
wmsTasksRouter.get('/', async (c) => {
  try {
    const supabase = getSupabase(c.env);
    
    // Parâmetros de query
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '50');
    const usuario = c.req.query('usuario');
    const tipo = c.req.query('tipo');
    const tarefa_valida = c.req.query('tarefa_valida');
    const data_inicio = c.req.query('data_inicio');
    const data_fim = c.req.query('data_fim');
    
    const offset = (page - 1) * limit;
    
    let query = supabase
      .from('tarefas_wms')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    // Aplicar filtros
    if (usuario) {
      query = query.ilike('usuario', `%${usuario}%`);
    }
    
    if (tipo) {
      query = query.eq('tipo', tipo);
    }
    
    if (tarefa_valida !== undefined) {
      query = query.eq('tarefa_valida', tarefa_valida === 'true');
    }
    
    if (data_inicio) {
      query = query.gte('created_at', data_inicio);
    }
    
    if (data_fim) {
      query = query.lte('created_at', data_fim);
    }
    
    const { data: tarefas, error, count } = await query;
    
    if (error) {
      console.error('Erro ao buscar tarefas:', error);
      return c.json({ success: false, error: 'Erro ao buscar tarefas' }, 500);
    }
    
    return c.json({
      success: true,
      data: tarefas || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    });
    
  } catch (error) {
    console.error('Erro ao buscar tarefas WMS:', error);
    return c.json({ success: false, error: 'Erro interno do servidor' }, 500);
  }
});

// GET /api/wms-tasks/:id - Buscar tarefa específica
wmsTasksRouter.get('/:id', async (c) => {
  try {
    const supabase = getSupabase(c.env);
    const id = parseInt(c.req.param('id'));
    
    if (isNaN(id)) {
      return c.json({ success: false, error: 'ID inválido' }, 400);
    }
    
    const { data: tarefa, error } = await supabase
      .from('tarefas_wms')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Erro ao buscar tarefa:', error);
      return c.json({ success: false, error: 'Tarefa não encontrada' }, 404);
    }
    
    return c.json({ success: true, data: tarefa });
    
  } catch (error) {
    console.error('Erro ao buscar tarefa WMS:', error);
    return c.json({ success: false, error: 'Erro interno do servidor' }, 500);
  }
});

// POST /api/wms-tasks - Criar nova tarefa
wmsTasksRouter.post('/', zValidator('json', WMSTaskSchema), async (c) => {
  try {
    const supabase = getSupabase(c.env);
    const data = c.req.valid('json');
    
    // Buscar user_id do operador
    const { data: userData, error: userError } = await supabase
      .from('usuarios')
      .select('id')
      .eq('nome', data.usuario)
      .single();
    
    if (userError || !userData) {
      return c.json({ 
        success: false, 
        error: `Operador "${data.usuario}" não encontrado no sistema` 
      }, 404);
    }
    
    // Preparar dados para inserção
    const tarefaData = {
      ...data,
      user_id: userData.id,
      data_criacao: data.data_criacao ? new Date(data.data_criacao).toISOString() : null,
      data_ultima_associacao: data.data_ultima_associacao ? new Date(data.data_ultima_associacao).toISOString() : null,
      data_alteracao: data.data_alteracao ? new Date(data.data_alteracao).toISOString() : null,
      data_liberacao: data.data_liberacao ? new Date(data.data_liberacao).toISOString() : null
    };
    
    const { data: novaTarefa, error } = await supabase
      .from('tarefas_wms')
      .insert(tarefaData)
      .select()
      .single();
    
    if (error) {
      console.error('Erro ao criar tarefa:', error);
      return c.json({ success: false, error: 'Erro ao criar tarefa' }, 500);
    }
    
    return c.json({ success: true, data: novaTarefa }, 201);
    
  } catch (error) {
    console.error('Erro ao criar tarefa WMS:', error);
    return c.json({ success: false, error: 'Erro interno do servidor' }, 500);
  }
});

// POST /api/wms-tasks/bulk - Importação em lote via arquivo
wmsTasksRouter.post('/bulk', async (c) => {
  console.log('🚀 ENDPOINT /bulk CHAMADO - ANTES DO TRY');
  try {
    console.log('=== INÍCIO DO ENDPOINT /bulk ===');
    console.log('Content-Type:', c.req.header('content-type'));
    console.log('Method:', c.req.method);
    
    const formData = await c.req.formData();
    console.log('FormData recebido com sucesso');
    
    const file = formData.get('file') as File;
    console.log('Arquivo extraído:', file ? `${file.name} (${file.size} bytes)` : 'null');
    
    if (!file) {
      console.log('ERRO: Arquivo não encontrado no FormData');
      return c.json({ 
        success: false, 
        error: 'Arquivo é obrigatório' 
      }, 400);
    }
    
    console.log('Lendo conteúdo do arquivo...');
    const fileContent = await file.text();
    console.log('Conteúdo lido:', fileContent.length, 'caracteres');
    
    console.log('Fazendo parse do CSV...');
    const tasks = parseCSVContent(fileContent);
    console.log('Tasks parseadas:', tasks.length);
    
    if (tasks.length === 0) {
      console.log('ERRO: Nenhuma tarefa encontrada após parse');
      return c.json({ 
        success: false, 
        error: 'Nenhuma tarefa encontrada no arquivo' 
      }, 400);
    }
    
    console.log('Chamando processBulkTasksAll...');
    return await processBulkTasksAll(c, tasks);
    
  } catch (error: any) {
    console.error('Erro ao processar arquivo:', error);
    return c.json({ 
      success: false, 
      error: 'Erro ao processar arquivo',
      details: error?.message || 'Erro desconhecido'
    }, 500);
  }
});

// POST /api/wms-tasks/bulk-json - Importação em lote via JSON (endpoint existente)
wmsTasksRouter.post('/bulk-json', zValidator('json', WMSTaskBulkSchema), async (c) => {
  try {
    const supabase = getSupabase(c.env);
    const { nome_operador, tarefas } = c.req.valid('json');
    
    console.log('=== POST /api/wms-tasks/bulk ===');
    console.log('- nome_operador:', nome_operador);
    console.log('- quantidade de tarefas:', tarefas?.length);
    
    // Buscar user_id do operador
    const { data: userData, error: userError } = await supabase
      .from('usuarios')
      .select('id')
      .eq('nome', nome_operador)
      .single();
    
    if (userError || !userData) {
      console.error('Erro ao buscar usuário:', userError);
      return c.json({ 
        success: false, 
        error: `Operador "${nome_operador}" não encontrado no sistema` 
      }, 404);
    }
    
    const userId = userData.id;
    console.log('User ID encontrado:', userId);
    
    // Preparar dados das tarefas para inserção
    const tarefasParaInserir = [];
    
    for (const tarefa of tarefas) {
      // Parse das datas
      const dataAssociacao = tarefa.data_ultima_associacao ? new Date(tarefa.data_ultima_associacao) : null;
      const dataAlteracao = tarefa.data_alteracao ? new Date(tarefa.data_alteracao) : null;
      const dataCriacao = tarefa.data_criacao ? new Date(tarefa.data_criacao) : null;
      const dataLiberacao = tarefa.data_liberacao ? new Date(tarefa.data_liberacao) : null;
      
      // Calcular se a tarefa é válida baseado no tempo de execução
      const tempoExecucao = tarefa.tempo_execucao || 0;
      const tipo = tarefa.tipo || tarefa.Tipo || '';
      const meta = TASK_METAS.find(m => m.tipo === tipo);
      const tarefaValida = meta ? (tempoExecucao > 10 && tempoExecucao <= meta.meta_segundos) : (tempoExecucao > 10);
      
      const tarefaCompleta = {
        // Campos obrigatórios
        user_id: userId,
        usuario: nome_operador,
        tarefa: tarefa.tarefa || tarefa.Tarefa || '',
        tipo: tipo,
        tempo_execucao: tempoExecucao,
        concluida_task: tarefa.concluida_task || tarefa['Concluída Task'] === '1' || false,
        // tarefa_valida será calculado automaticamente pelo banco baseado no tempo_execucao
        
        // Campos de data/hora
        data_ultima_associacao: dataAssociacao ? dataAssociacao.toISOString() : null,
        data_alteracao: dataAlteracao ? dataAlteracao.toISOString() : null,
        data_criacao: dataCriacao ? dataCriacao.toISOString() : null,
        data_liberacao: dataLiberacao ? dataLiberacao.toISOString() : null,
        
        // Campos opcionais do WMS
        origem: tarefa.origem || tarefa.Origem || null,
        destino: tarefa.destino || tarefa.Destino || null,
        palete: tarefa.palete || tarefa.Palete || null,
        armazem_mapa: tarefa.armazem_mapa || tarefa['Armazém Mapa'] || null,
        placa_carreta: tarefa.placa_carreta || tarefa['Placa Carreta'] || null,
        placa_cavalo: tarefa.placa_cavalo || tarefa['Placa Cavalo'] || null,
        prioridade: tarefa.prioridade || tarefa.Prioridade || null,
        status: tarefa.status || tarefa.Status || null
      };
      
      tarefasParaInserir.push(tarefaCompleta);
    }
    
    console.log('Tarefas preparadas para inserção:', tarefasParaInserir.length);
    
    // Inserir tarefas no Supabase usando upsert para evitar duplicação
    // ON CONFLICT baseado em data_alteracao + usuario + status
    const { data: insertResult, error: insertError } = await supabase
      .from('tarefas_wms')
      .upsert(tarefasParaInserir, {
        onConflict: 'data_alteracao,usuario,status',
        ignoreDuplicates: false // Atualiza se já existe
      })
      .select();
    
    if (insertError) {
      console.error('Erro ao inserir tarefas:', insertError);
      return c.json({ 
        success: false, 
        error: 'Erro ao salvar no banco de dados',
        details: insertError.message
      }, 500);
    }
    
    console.log('Tarefas inseridas com sucesso:', insertResult?.length || 0);
    
    // Contar tarefas válidas inseridas
    const tarefasValidas = tarefasParaInserir.filter(t => t.tempo_execucao > 10).length;
    const tarefasInseridas = insertResult?.length || 0;
    
    return c.json({ 
      success: true, 
      message: `${tarefasInseridas} tarefas salvas no banco de dados`,
      tarefas_validas: tarefasValidas,
      tarefas_inseridas: tarefasInseridas,
      user_id: userId
    });
    
  } catch (error: any) {
    console.error('Erro ao salvar tarefas WMS:', error);
    return c.json({ 
      success: false, 
      error: 'Erro interno do servidor',
      details: error?.message || 'Erro desconhecido'
    }, 500);
  }
});

// PUT /api/wms-tasks/:id - Atualizar tarefa
wmsTasksRouter.put('/:id', zValidator('json', WMSTaskUpdateSchema), async (c) => {
  try {
    const supabase = getSupabase(c.env);
    const id = parseInt(c.req.param('id'));
    const data = c.req.valid('json');
    
    if (isNaN(id)) {
      return c.json({ success: false, error: 'ID inválido' }, 400);
    }
    
    // Verificar se a tarefa existe
    const { data: tarefaExistente, error: checkError } = await supabase
      .from('tarefas_wms')
      .select('id')
      .eq('id', id)
      .single();
    
    if (checkError || !tarefaExistente) {
      return c.json({ success: false, error: 'Tarefa não encontrada' }, 404);
    }
    
    // Se o usuário foi alterado, buscar o novo user_id
    let updateData = { ...data };
    if (data.usuario) {
      const { data: userData, error: userError } = await supabase
        .from('usuarios')
        .select('id')
        .eq('nome', data.usuario)
        .single();
      
      if (userError || !userData) {
        return c.json({ 
          success: false, 
          error: `Operador "${data.usuario}" não encontrado no sistema` 
        }, 404);
      }
      
      updateData.user_id = userData.id;
    }
    
    // Converter datas se fornecidas
    if (data.data_criacao) {
      updateData.data_criacao = new Date(data.data_criacao).toISOString();
    }
    if (data.data_ultima_associacao) {
      updateData.data_ultima_associacao = new Date(data.data_ultima_associacao).toISOString();
    }
    if (data.data_alteracao) {
      updateData.data_alteracao = new Date(data.data_alteracao).toISOString();
    }
    if (data.data_liberacao) {
      updateData.data_liberacao = new Date(data.data_liberacao).toISOString();
    }
    
    const { data: tarefaAtualizada, error } = await supabase
      .from('tarefas_wms')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Erro ao atualizar tarefa:', error);
      return c.json({ success: false, error: 'Erro ao atualizar tarefa' }, 500);
    }
    
    return c.json({ success: true, data: tarefaAtualizada });
    
  } catch (error) {
    console.error('Erro ao atualizar tarefa WMS:', error);
    return c.json({ success: false, error: 'Erro interno do servidor' }, 500);
  }
});

// DELETE /api/wms-tasks/:id - Deletar tarefa
wmsTasksRouter.delete('/:id', async (c) => {
  try {
    const supabase = getSupabase(c.env);
    const id = parseInt(c.req.param('id'));
    
    if (isNaN(id)) {
      return c.json({ success: false, error: 'ID inválido' }, 400);
    }
    
    // Verificar se a tarefa existe
    const { data: tarefaExistente, error: checkError } = await supabase
      .from('tarefas_wms')
      .select('id, tarefa, usuario')
      .eq('id', id)
      .single();
    
    if (checkError || !tarefaExistente) {
      return c.json({ success: false, error: 'Tarefa não encontrada' }, 404);
    }
    
    const { error } = await supabase
      .from('tarefas_wms')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Erro ao deletar tarefa:', error);
      return c.json({ success: false, error: 'Erro ao deletar tarefa' }, 500);
    }
    
    return c.json({ 
      success: true, 
      message: `Tarefa "${tarefaExistente.tarefa}" do operador "${tarefaExistente.usuario}" foi deletada com sucesso` 
    });
    
  } catch (error) {
    console.error('Erro ao deletar tarefa WMS:', error);
    return c.json({ success: false, error: 'Erro interno do servidor' }, 500);
  }
});

// ===== ENDPOINTS ESPECIAIS =====

// GET /api/wms-tasks/operator/:operatorName - Buscar tarefas de um operador específico
// GET /api/wms-tasks/operator/:operatorName?date=YYYY-MM-DD - Buscar tarefas por data específica
wmsTasksRouter.get('/operator/:operatorName', async (c) => {
  try {
    const supabase = getSupabase(c.env);
    const nome_operador = decodeURIComponent(c.req.param('operatorName'));
    const data_filtro = c.req.query('date'); // Optional date filter
    
    console.log('Buscando tarefas para operador:', nome_operador, 'data:', data_filtro);
    
    if (!nome_operador) {
      return c.json({ success: false, error: 'Nome do operador é obrigatório' }, 400);
    }
    
    let query = supabase
      .from('tarefas_wms')
      .select('*')
      .ilike('usuario', `%${nome_operador}%`)
      .eq('tarefa_valida', true);
    
    // Apply date filter if provided - usar data_ultima_associacao para consistência com WMSTaskManager
    if (data_filtro) {
      const dataInicio = new Date(data_filtro);
      dataInicio.setHours(0, 0, 0, 0);
      const dataFim = new Date(data_filtro);
      dataFim.setHours(23, 59, 59, 999);
      
      query = query
        .gte('data_ultima_associacao', dataInicio.toISOString())
        .lte('data_ultima_associacao', dataFim.toISOString());
    }
    
    const { data: tarefas, error } = await query.order('created_at', { ascending: false });
    
    if (error) {
      console.error('Erro ao buscar tarefas do operador:', error);
      return c.json({ success: false, error: 'Erro ao buscar tarefas' }, 500);
    }
    
    console.log(`Encontradas ${tarefas?.length || 0} tarefas válidas para ${nome_operador}${data_filtro ? ` na data ${data_filtro}` : ''}`);
    
    return c.json({ 
      success: true, 
      data: tarefas || [],
      valid_tasks_count: tarefas?.length || 0
    });
    
  } catch (error) {
    console.error('Erro ao buscar tarefas do operador:', error);
    return c.json({ success: false, error: 'Erro interno do servidor' }, 500);
  }
});

// GET /api/wms-tasks/operator/:operatorName/stats - Estatísticas de um operador
// GET /api/wms-tasks/operator/:operatorName/stats/date/:date - Estatísticas por operador e data
wmsTasksRouter.get('/operator/:operatorName/stats/date/:date', async (c) => {
  try {
    const supabase = getSupabase(c.env);
    const nome_operador = decodeURIComponent(c.req.param('operatorName'));
    const data_selecionada = c.req.param('date');
    
    console.log('Buscando estatísticas para operador:', nome_operador, 'na data:', data_selecionada);
    
    if (!nome_operador || !data_selecionada) {
      return c.json({ success: false, error: 'Nome do operador e data são obrigatórios' }, 400);
    }
    
    // Converter data para formato de filtro (início e fim do dia)
    const dataInicio = new Date(data_selecionada);
    dataInicio.setHours(0, 0, 0, 0);
    const dataFim = new Date(data_selecionada);
    dataFim.setHours(23, 59, 59, 999);
    
    const { data: tarefas, error } = await supabase
      .from('tarefas_wms')
      .select('id, tarefa_valida, tempo_execucao, tipo, data_ultima_associacao, created_at')
      .ilike('usuario', `%${nome_operador}%`)
      .gte('data_ultima_associacao', dataInicio.toISOString())
      .lte('data_ultima_associacao', dataFim.toISOString());
    
    if (error) {
      console.error('Erro ao buscar tarefas do operador:', error);
      return c.json({ success: false, error: 'Erro ao buscar tarefas' }, 500);
    }
    
    // Calcular estatísticas
    const totalTarefas = tarefas?.length || 0;
    const tarefasValidas = tarefas?.filter(t => t.tarefa_valida === true).length || 0;
    const tarefasInvalidas = totalTarefas - tarefasValidas;
    
    // Agrupar por tipo de tarefa
    const tarefasPorTipo = (tarefas || []).reduce((acc: TarefasPorTipo, tarefa: WMSTask) => {
      const tipo = tarefa.tipo || 'Não especificado';
      if (!acc[tipo]) {
        acc[tipo] = { total: 0, validas: 0, invalidas: 0 };
      }
      acc[tipo].total++;
      if (tarefa.tarefa_valida) {
        acc[tipo].validas++;
      } else {
        acc[tipo].invalidas++;
      }
      return acc;
    }, {} as TarefasPorTipo);
    
    // Calcular tempo médio de execução
    const temposExecucao = (tarefas || []).filter(t => t.tempo_execucao > 0).map(t => t.tempo_execucao);
    const tempoMedio = temposExecucao.length > 0 
      ? temposExecucao.reduce((a, b) => a + b, 0) / temposExecucao.length 
      : 0;
    
    return c.json({ 
      success: true,
      operador: nome_operador,
      data: data_selecionada,
      stats: {
        total_tarefas: totalTarefas,
        tarefas_validas: tarefasValidas,
        tarefas_invalidas: tarefasInvalidas,
        percentual_validas: totalTarefas > 0 ? Math.round((tarefasValidas / totalTarefas) * 100) : 0,
        tempo_medio_execucao: Math.round(tempoMedio),
        tarefas_por_tipo: tarefasPorTipo
      }
    });
    
  } catch (error) {
    console.error('Erro ao buscar estatísticas WMS por data:', error);
    return c.json({ success: false, error: 'Erro interno do servidor' }, 500);
  }
});

wmsTasksRouter.get('/operator/:operatorName/stats', async (c) => {
  try {
    const supabase = getSupabase(c.env);
    const nome_operador = decodeURIComponent(c.req.param('operatorName'));
    
    console.log('Buscando estatísticas para operador:', nome_operador);
    
    if (!nome_operador) {
      return c.json({ success: false, error: 'Nome do operador é obrigatório' }, 400);
    }
    
    const { data: tarefas, error } = await supabase
      .from('tarefas_wms')
      .select('id, tarefa_valida, tempo_execucao, tipo, created_at')
      .ilike('usuario', `%${nome_operador}%`);
    
    if (error) {
      console.error('Erro ao buscar tarefas do operador:', error);
      return c.json({ success: false, error: 'Erro ao buscar tarefas' }, 500);
    }
    
    // Calcular estatísticas
    const totalTarefas = tarefas?.length || 0;
    const tarefasValidas = tarefas?.filter(t => t.tarefa_valida === true).length || 0;
    const tarefasInvalidas = totalTarefas - tarefasValidas;
    
    // Agrupar por tipo de tarefa
    const tarefasPorTipo = (tarefas || []).reduce((acc: TarefasPorTipo, tarefa: WMSTask) => {
      const tipo = tarefa.tipo || 'Não especificado';
      if (!acc[tipo]) {
        acc[tipo] = { total: 0, validas: 0, invalidas: 0 };
      }
      acc[tipo].total++;
      if (tarefa.tarefa_valida) {
        acc[tipo].validas++;
      } else {
        acc[tipo].invalidas++;
      }
      return acc;
    }, {} as TarefasPorTipo);
    
    // Calcular tempo médio de execução
    const temposExecucao = (tarefas || []).filter(t => t.tempo_execucao > 0).map(t => t.tempo_execucao);
    const tempoMedio = temposExecucao.length > 0 
      ? temposExecucao.reduce((a, b) => a + b, 0) / temposExecucao.length 
      : 0;
    
    return c.json({ 
      success: true,
      operador: nome_operador,
      estatisticas: {
        total_tarefas: totalTarefas,
        tarefas_validas: tarefasValidas,
        tarefas_invalidas: tarefasInvalidas,
        percentual_validas: totalTarefas > 0 ? Math.round((tarefasValidas / totalTarefas) * 100) : 0,
        tempo_medio_execucao: Math.round(tempoMedio),
        tarefas_por_tipo: tarefasPorTipo
      }
    });
    
  } catch (error) {
    console.error('Erro ao buscar estatísticas WMS:', error);
    return c.json({ success: false, error: 'Erro interno do servidor' }, 500);
  }
});

// GET /api/wms-tasks/types - Listar tipos de tarefa únicos
wmsTasksRouter.get('/types', async (c) => {
  try {
    const supabase = getSupabase(c.env);
    
    const { data: tipos, error } = await supabase
      .from('tarefas_wms')
      .select('tipo')
      .not('tipo', 'is', null)
      .neq('tipo', '')
      .order('tipo');
    
    if (error) {
      console.error('Erro ao buscar tipos de tarefa:', error);
      return c.json({ success: false, error: 'Erro ao buscar tipos' }, 500);
    }
    
    // Extrair tipos únicos
    const tiposUnicos = [...new Set((tipos || []).map(t => t.tipo))];
    
    return c.json({ success: true, data: tiposUnicos });
    
  } catch (error) {
    console.error('Erro ao buscar tipos de tarefa:', error);
    return c.json({ success: false, error: 'Erro interno do servidor' }, 500);
  }
});

// GET /api/wms-tasks/operators - Listar operadores únicos
wmsTasksRouter.get('/operators', async (c) => {
  try {
    const supabase = getSupabase(c.env);
    
    const { data: operadores, error } = await supabase
      .from('tarefas_wms')
      .select('usuario')
      .not('usuario', 'is', null)
      .neq('usuario', '')
      .order('usuario');
    
    if (error) {
      console.error('Erro ao buscar operadores:', error);
      return c.json({ success: false, error: 'Erro ao buscar operadores' }, 500);
    }
    
    // Extrair operadores únicos
    const operadoresUnicos = [...new Set((operadores || []).map(o => o.usuario))];

    return c.json({ success: true, data: operadoresUnicos });
    
  } catch (error) {
    console.error('Erro ao buscar tipos de tarefa WMS:', error);
    return c.json({ success: false, error: 'Erro interno do servidor' }, 500);
  }
});

// Funções auxiliares
function parseCSVContent(content: string): any[] {
  try {
    console.log('Iniciando parse otimizado do CSV com streaming...');
    const parseStartTime = Date.now();
    
    // Usar streaming para arquivos grandes (> 1MB)
    const isLargeFile = content.length > 1024 * 1024;
    console.log(`Arquivo ${isLargeFile ? 'grande' : 'pequeno'} detectado: ${(content.length / 1024 / 1024).toFixed(2)}MB`);
    
    if (isLargeFile) {
      return parseCSVStreaming(content);
    }
    
    // Dividir em linhas de forma mais eficiente
    const lines = content.split('\n');
    const validLines = [];
    
    // Filtrar linhas válidas em uma única passada
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line && line.length > 0) {
        validLines.push(line);
      }
    }
    
    if (validLines.length < 2) {
      console.log('Arquivo CSV inválido: menos de 2 linhas válidas');
      return [];
    }
    
    // Detectar separador (vírgula ou ponto e vírgula)
    const firstLine = validLines[0];
    const separator = firstLine.includes(';') ? ';' : ',';
    console.log('Separador CSV detectado:', separator);
    
    // Parse do cabeçalho
    const headers = firstLine.split(separator).map(h => h.trim().replace(/"/g, ''));
    console.log(`Cabeçalhos encontrados: ${headers.length}`);
    
    const tasks = [];
    const PARSE_BATCH_SIZE = 1000; // Processar em lotes para melhor performance
    
    // Processar linhas em lotes
    for (let batchStart = 1; batchStart < validLines.length; batchStart += PARSE_BATCH_SIZE) {
      const batchEnd = Math.min(batchStart + PARSE_BATCH_SIZE, validLines.length);
      const batchTasks = [];
      
      console.log(`Processando lote ${Math.floor(batchStart / PARSE_BATCH_SIZE) + 1}: linhas ${batchStart} a ${batchEnd - 1}`);
      
      for (let i = batchStart; i < batchEnd; i++) {
        const values = validLines[i].split(separator).map(v => v.trim().replace(/"/g, ''));
        
        // Pular linhas com número incorreto de colunas
        if (values.length !== headers.length) {
          console.warn(`Linha ${i + 1} ignorada: ${values.length} colunas vs ${headers.length} esperadas`);
          continue;
        }
        
        const task: any = {};
        for (let j = 0; j < headers.length; j++) {
          task[headers[j]] = values[j] || null;
        }
        
        batchTasks.push(task);
      }
      
      tasks.push(...batchTasks);
      
      // Log de progresso para arquivos grandes
      if (validLines.length > 2000) {
        const progress = ((batchEnd - 1) / (validLines.length - 1) * 100).toFixed(1);
        console.log(`Parse CSV: ${progress}% (${batchEnd - 1}/${validLines.length - 1} linhas)`);
      }
    }
    
    const parseEndTime = Date.now();
    const parseDuration = parseEndTime - parseStartTime;
    
    console.log(`CSV parseado com sucesso: ${tasks.length} tarefas de ${validLines.length - 1} linhas em ${parseDuration}ms`);
    console.log(`Performance de parse: ${(tasks.length / (parseDuration / 1000)).toFixed(2)} tarefas/segundo`);
    
    return tasks;
    
  } catch (error) {
    console.error('Erro ao fazer parse do CSV:', error);
    return [];
  }
}

function parseDateTime(dateStr: string): Date | null {
  if (!dateStr) return null;
  
  try {
    // Formato esperado: "dd/MM/yyyy HH:mm:ss"
    const [datePart, timePart] = dateStr.split(' ');
    if (!datePart || !timePart) return null;
    
    const [day, month, year] = datePart.split('/');
    const [hour, minute, second] = timePart.split(':');
    
    // Criar data em UTC para evitar problemas de timezone
    const date = new Date(
      parseInt(year),
      parseInt(month) - 1, // Mês é 0-indexado
      parseInt(day),
      parseInt(hour),
      parseInt(minute),
      parseInt(second)
    );
    
    // Verificar se a data é válida
    if (isNaN(date.getTime())) {
      console.warn(`Data inválida: ${dateStr}`);
      return null;
    }
    
    return date;
  } catch (error) {
    console.warn(`Erro ao parsear data: ${dateStr}`, error);
    return null;
  }
}

function isOperatorMatch(taskOperator: string, selectedOperator: string): boolean {
  if (!taskOperator || !selectedOperator) return false;
  
  const normalize = (str: string) => str.trim().toLowerCase();
  return normalize(taskOperator) === normalize(selectedOperator);
}

// Metas de tempo por tipo de tarefa (em segundos)
const TASK_METAS = [
  { tipo: 'Picking', meta_segundos: 300 },
  { tipo: 'Reposição', meta_segundos: 180 },
  { tipo: 'Conferência', meta_segundos: 120 },
  { tipo: 'Movimentação', meta_segundos: 240 },
  { tipo: 'Inventário', meta_segundos: 600 }
];

async function processBulkTasks(c: any, nome_operador: string, rawTasks: any[]) {
  try {
    const supabase = getSupabase(c.env);
    
    console.log('=== processBulkTasks ===');
    console.log('- nome_operador:', nome_operador);
    console.log('- quantidade de tarefas brutas:', rawTasks.length);
    
    // Buscar user_id do operador
    const { data: userData, error: userError } = await supabase
      .from('usuarios')
      .select('id')
      .eq('nome', nome_operador)
      .single();
    
    if (userError || !userData) {
      console.error('Erro ao buscar usuário:', userError);
      return c.json({ 
        success: false, 
        error: `Operador "${nome_operador}" não encontrado no sistema` 
      }, 404);
    }
    
    const userId = userData.id;
    console.log('User ID encontrado:', userId);
    
    // Filtrar e processar tarefas do operador
    const tarefasParaInserir = [];
    let tarefasValidasCount = 0;
    let tarefasDoOperadorCount = 0;
    let tarefasConcluidasCount = 0;
    
    console.log('Iniciando processamento das tarefas...');
    
    // Log dos primeiros operadores encontrados para debug
    const operadoresEncontrados = new Set();
    for (let i = 0; i < Math.min(10, rawTasks.length); i++) {
      const taskOperator = rawTasks[i].Usuário || rawTasks[i].Usuario || rawTasks[i].usuario;
      if (taskOperator) {
        operadoresEncontrados.add(taskOperator);
      }
    }
    console.log('Primeiros operadores encontrados no arquivo:', Array.from(operadoresEncontrados));
    console.log('Operador selecionado:', nome_operador);
    
    // DEBUG: Processar sem filtro de operador para verificar tarefas válidas totais
    console.log('DEBUG: Processando TODAS as tarefas sem filtro de operador');
    
    // Filtrar apenas tarefas concluídas (sem filtro de operador)
    const allCompletedTasks = rawTasks.filter(task => task['Concluída Task'] === '1');
    console.log(`Total de tarefas concluídas (todos operadores): ${allCompletedTasks.length}`);
    
    // Validar e processar todas as tarefas concluídas
    const allValidTasks = [];
    for (const task of allCompletedTasks) {
      // Calcular tempo de execução
      const dataAssociacao = task['Data Última Associação'] || task.data_ultima_associacao;
      const dataAlteracao = task['Data de Alteração'] || task.data_alteracao;
      
      let tempoExecucao = 0;
      if (dataAssociacao && dataAlteracao) {
        const dateAssoc = parseDateTime(dataAssociacao);
        const dateAlt = parseDateTime(dataAlteracao);
        if (dateAssoc && dateAlt) {
          tempoExecucao = Math.abs(dateAlt.getTime() - dateAssoc.getTime()) / 1000;
        }
      }
      
      // Verificar se tem tempo de execução válido
      if (tempoExecucao > 0) {
        allValidTasks.push(task);
      }
    }
    
    console.log(`Total de tarefas válidas (todos operadores): ${allValidTasks.length}`);
    
    // Agora processar para o operador específico
    for (const task of rawTasks) {
      // Verificar se a tarefa é do operador selecionado
      const taskOperator = task.Usuário || task.Usuario || task.usuario;
      if (!isOperatorMatch(taskOperator, nome_operador)) {
        continue;
      }
      
      tarefasDoOperadorCount++;
      
      // Verificar se a tarefa foi concluída
      const concluida = task['Concluída Task'] === '1' || task.concluida_task === true;
      if (!concluida) {
        continue;
      }
      
      tarefasConcluidasCount++;
      
      // Calcular tempo de execução
      const dataAssociacao = task['Data Última Associação'] || task.data_ultima_associacao;
      const dataAlteracao = task['Data de Alteração'] || task.data_alteracao;
      
      let tempoExecucao = 0;
      if (dataAssociacao && dataAlteracao) {
        const dateAssoc = parseDateTime(dataAssociacao);
        const dateAlt = parseDateTime(dataAlteracao);
        if (dateAssoc && dateAlt) {
          tempoExecucao = Math.abs(dateAlt.getTime() - dateAssoc.getTime()) / 1000;
        }
      }
      
      // Verificar se tarefa é válida (>10s e dentro da meta do tipo)
      const tipo = task.Tipo || task.tipo;
      const meta = TASK_METAS.find(m => m.tipo === tipo);
      const tarefaValida = meta ? (tempoExecucao > 10 && tempoExecucao <= meta.meta_segundos) : (tempoExecucao > 10);
      
      if (tarefaValida) {
        tarefasValidasCount++;
      }
      
      const tarefaCompleta = {
        // Campos obrigatórios
        user_id: userId,
        usuario: nome_operador,
        tarefa: tipo || '',
        tipo: tipo || '',
        tempo_execucao: tempoExecucao,
        concluida_task: concluida,
        tarefa_valida: tarefaValida, // Campo calculado baseado no tempo de execução
        
        // Campos de data/hora
        data_ultima_associacao: dataAssociacao ? parseDateTime(dataAssociacao)?.toISOString() : null,
        data_alteracao: dataAlteracao ? parseDateTime(dataAlteracao)?.toISOString() : null,
        data_criacao: task['Data de Criação'] ? parseDateTime(task['Data de Criação'])?.toISOString() : null,
        data_liberacao: task['Data de Liberação'] ? parseDateTime(task['Data de Liberação'])?.toISOString() : null,
        
        // Campos opcionais do WMS
        origem: task.Origem || null,
        destino: task.Destino || null,
        palete: task.Palete || null,
        armazem_mapa: task['Armazém Mapa'] || null,
        placa_carreta: task['Placa Carreta'] || null,
        placa_cavalo: task['Placa Cavalo'] || null,
        prioridade: task.Prioridade || null,
        status: task.Status || null
      };
      
      tarefasParaInserir.push(tarefaCompleta);
    }
    
    console.log('=== ESTATÍSTICAS DO PROCESSAMENTO ===');
    console.log('- Tarefas brutas processadas:', rawTasks.length);
    console.log('- Tarefas do operador encontradas:', tarefasDoOperadorCount);
    console.log('- Tarefas concluídas do operador:', tarefasConcluidasCount);
    console.log('- Tarefas válidas (preparadas para inserção):', tarefasParaInserir.length);
    
    if (tarefasParaInserir.length === 0) {
      return c.json({ 
        success: false, 
        error: `Nenhuma tarefa válida encontrada para o operador "${nome_operador}". Tarefas do operador: ${tarefasDoOperadorCount}, Tarefas concluídas: ${tarefasConcluidasCount}`,
        debug: {
          tarefas_brutas: rawTasks.length,
          tarefas_do_operador: tarefasDoOperadorCount,
          tarefas_concluidas: tarefasConcluidasCount,
          tarefas_validas: tarefasParaInserir.length
        }
      }, 400);
    }
    
    console.log('Tarefas preparadas para inserção:', tarefasParaInserir.length);
    console.log('Tarefas válidas encontradas:', tarefasValidasCount);
    
    // Inserir tarefas no Supabase usando upsert para evitar duplicação
    // ON CONFLICT baseado em data_alteracao + usuario + status
    const { data: insertResult, error: insertError } = await supabase
      .from('tarefas_wms')
      .upsert(tarefasParaInserir, {
        onConflict: 'data_alteracao,usuario,status',
        ignoreDuplicates: false // Atualiza se já existe
      })
      .select();
    
    if (insertError) {
      console.error('Erro ao inserir tarefas:', insertError);
      return c.json({ 
        success: false, 
        error: 'Erro ao salvar no banco de dados',
        details: insertError.message
      }, 500);
    }
    
    console.log('Tarefas inseridas com sucesso:', insertResult?.length || 0);
    
    const tarefasInseridas = insertResult?.length || 0;
    
    return c.json({ 
      success: true, 
      message: `${tarefasInseridas} tarefas importadas com sucesso para ${nome_operador}`,
      tarefas_validas: tarefasValidasCount,
      tarefas_inseridas: tarefasInseridas,
      user_id: userId
    });
    
  } catch (error: any) {
    console.error('Erro ao processar tarefas em lote:', error);
    return c.json({ 
      success: false, 
      error: 'Erro interno do servidor',
      details: error?.message || 'Erro desconhecido'
    }, 500);
  }
}

async function processBulkTasksAll(c: any, rawTasks: any[]) {
  try {
    const supabase = getSupabase(c.env);
    
    console.log('=== processBulkTasksAll ===');
    console.log('- quantidade de tarefas brutas:', rawTasks.length);
    
    // Processar todas as tarefas do arquivo
    const tarefasParaInserir = [];
    let tarefasValidasCount = 0;
    let tarefasConcluidasCount = 0;
    const operadoresProcessados = new Set();
    const userIdCache = new Map();
    const operadoresNaoEncontrados = new Set();
    
    console.log('Iniciando processamento de todas as tarefas...');
    
    for (const task of rawTasks) {
      // Verificar se a tarefa foi concluída pelo campo Status
      const statusValue = task['Status'];
      const concluida = statusValue === 'Completa' || statusValue === 'completa' || statusValue === 'COMPLETA' || statusValue === 'Complete' || statusValue === 'complete' || statusValue === 'COMPLETE';
      
      // Log para debug das primeiras 5 tarefas
      if (tarefasConcluidasCount < 5) {
        console.log(`Tarefa ${tarefasConcluidasCount + 1}:`, {
          'Status': statusValue,
          'concluida': concluida,
          'keys': Object.keys(task).slice(0, 10)
        });
      }
      
      if (!concluida) {
        continue;
      }
      
      tarefasConcluidasCount++;
      
      // Obter operador da tarefa
      const taskOperator = task.Usuário || task.Usuario || task.usuario;
      if (!taskOperator) {
        continue;
      }
      
      operadoresProcessados.add(taskOperator);
      
      // Buscar user_id do operador (com cache)
      let userId = userIdCache.get(taskOperator);
      if (!userId) {
        const { data: userData, error: userError } = await supabase
          .from('usuarios')
          .select('id')
          .eq('nome', taskOperator)
          .single();
        
        if (userError || !userData) {
          operadoresNaoEncontrados.add(taskOperator);
          continue;
        }
        
        userId = userData.id;
        userIdCache.set(taskOperator, userId);
      }
      
      // Calcular tempo de execução
      const dataAssociacao = task['Data Última Associação'] || task.data_ultima_associacao;
      const dataAlteracao = task['Data de Alteração'] || task.data_alteracao;
      
      let tempoExecucao = 0;
      if (dataAssociacao && dataAlteracao) {
        const dateAssoc = parseDateTime(dataAssociacao);
        const dateAlt = parseDateTime(dataAlteracao);
        if (dateAssoc && dateAlt) {
          tempoExecucao = Math.abs(dateAlt.getTime() - dateAssoc.getTime()) / 1000;
        }
      }
      
      // Verificar se tarefa é válida (>10s e dentro da meta do tipo)
      const tipo = task.Tipo || task.tipo;
      const meta = TASK_METAS.find(m => m.tipo === tipo);
      const tarefaValida = meta ? (tempoExecucao > 10 && tempoExecucao <= meta.meta_segundos) : (tempoExecucao > 10);
      
      if (tarefaValida) {
        tarefasValidasCount++;
      }
      
      const tarefaCompleta = {
        // Campos obrigatórios
        user_id: userId,
        usuario: taskOperator,
        tarefa: tipo || '',
        tipo: tipo || '',
        tempo_execucao: tempoExecucao,
        concluida_task: concluida,
        // tarefa_valida será calculado automaticamente pelo banco baseado no tempo_execucao
        
        // Campos de data/hora
        data_ultima_associacao: dataAssociacao ? parseDateTime(dataAssociacao)?.toISOString() : null,
        data_alteracao: dataAlteracao ? parseDateTime(dataAlteracao)?.toISOString() : null,
        data_criacao: task['Data de Criação'] ? parseDateTime(task['Data de Criação'])?.toISOString() : null,
        data_liberacao: task['Data de Liberação'] ? parseDateTime(task['Data de Liberação'])?.toISOString() : null,
        
        // Campos opcionais do WMS
        origem: task.Origem || null,
        destino: task.Destino || null,
        palete: task.Palete || null,
        armazem_mapa: task['Armazém Mapa'] || null,
        placa_carreta: task['Placa Carreta'] || null,
        placa_cavalo: task['Placa Cavalo'] || null,
        prioridade: task.Prioridade || null,
        status: task.Status || null
      };
      
      tarefasParaInserir.push(tarefaCompleta);
    }
    
    console.log('=== ESTATÍSTICAS DO PROCESSAMENTO ===');
    console.log('- Tarefas brutas processadas:', rawTasks.length);
    console.log('- Tarefas concluídas encontradas:', tarefasConcluidasCount);
    console.log('- Tarefas válidas (preparadas para inserção):', tarefasParaInserir.length);
    
    // Log de performance - início da inserção no banco
    const insertStartTime = Date.now();
    console.log('- Operadores processados:', Array.from(operadoresProcessados));
    
    if (tarefasParaInserir.length === 0) {
      return c.json({ 
        success: false, 
        error: `Nenhuma tarefa válida encontrada no arquivo. Tarefas concluídas: ${tarefasConcluidasCount}`,
        debug: {
          tarefas_brutas: rawTasks.length,
          tarefas_concluidas: tarefasConcluidasCount,
          tarefas_validas: tarefasParaInserir.length,
          operadores_encontrados: Array.from(operadoresProcessados)
        }
      }, 400);
    }
    
    console.log('Tarefas preparadas para inserção:', tarefasParaInserir.length);
    console.log('Tarefas válidas encontradas:', tarefasValidasCount);
    
    // Inserir tarefas no Supabase usando processamento em lotes para melhor performance
    // Dividir em chunks de 500 tarefas para otimizar inserções grandes
    const BATCH_SIZE = 500;
    const chunks = [];
    for (let i = 0; i < tarefasParaInserir.length; i += BATCH_SIZE) {
      chunks.push(tarefasParaInserir.slice(i, i + BATCH_SIZE));
    }
    
    console.log(`Processando ${tarefasParaInserir.length} tarefas em ${chunks.length} lotes de até ${BATCH_SIZE} tarefas`);
    
    let totalInseridas = 0;
    const insertResults = [];
    
    // Processar cada lote sequencialmente para evitar sobrecarga
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const chunkStartTime = Date.now();
      
      console.log(`Processando lote ${i + 1}/${chunks.length} (${chunk.length} tarefas)...`);
      
      const { data: insertResult, error: insertError } = await supabase
        .from('tarefas_wms')
        .upsert(chunk, {
          onConflict: 'data_alteracao,usuario,status',
          ignoreDuplicates: false // Atualiza se já existe
        })
        .select();
      
      if (insertError) {
        console.error(`Erro ao inserir lote ${i + 1}:`, insertError);
        return c.json({ 
          success: false, 
          error: `Erro ao salvar lote ${i + 1} no banco de dados`,
          details: insertError.message,
          lotes_processados: i,
          tarefas_inseridas_ate_erro: totalInseridas
        }, 500);
      }
      
      const chunkInseridas = insertResult?.length || 0;
      totalInseridas += chunkInseridas;
      insertResults.push(...(insertResult || []));
      
      const chunkDuration = Date.now() - chunkStartTime;
      console.log(`Lote ${i + 1} concluído: ${chunkInseridas} tarefas em ${chunkDuration}ms`);
      
      // Pequena pausa entre lotes para não sobrecarregar o banco
      if (i < chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }
    
    // Log de performance - fim da inserção no banco
    const insertEndTime = Date.now();
    const insertDuration = insertEndTime - insertStartTime;
    
    console.log('Tarefas inseridas com sucesso:', totalInseridas);
    console.log(`Tempo total de inserção no banco: ${insertDuration}ms`);
    console.log(`Performance: ${(totalInseridas / (insertDuration / 1000)).toFixed(2)} tarefas/segundo`);
    
    const tarefasInseridas = totalInseridas;
    
    // Log resumido dos operadores não encontrados
    if (operadoresNaoEncontrados.size > 0) {
      console.warn('=== OPERADORES NÃO ENCONTRADOS NO SISTEMA ===');
      console.warn(`⚠️  ${operadoresNaoEncontrados.size} operadores não foram encontrados na base de usuários:`);
      Array.from(operadoresNaoEncontrados).forEach((operador, index) => {
        console.warn(`   ${index + 1}. ${operador}`);
      });
      console.warn('💡 Essas tarefas foram ignoradas durante a importação.');
      console.warn('');
    }
    
    console.log('=== RESUMO FINAL DA IMPORTAÇÃO ===');
    console.log(`✅ ${tarefasInseridas} tarefas inseridas no banco de dados`);
    console.log(`⏱️  Tempo total de inserção: ${insertDuration}ms`);
    console.log(`👥 Operadores processados: ${operadoresProcessados.size}`);
    console.log(`📊 Taxa de sucesso: ${((tarefasInseridas / tarefasConcluidasCount) * 100).toFixed(1)}%`);
    
    return c.json({ 
      success: true, 
      message: `${tarefasInseridas} tarefas importadas com sucesso de ${operadoresProcessados.size} operadores`,
      tarefas_validas: tarefasValidasCount,
      tarefas_inseridas: tarefasInseridas,
      tempo_insercao_ms: insertDuration,
      operadores_processados: Array.from(operadoresProcessados)
    });
    
  } catch (error: any) {
    console.error('Erro ao processar todas as tarefas:', error);
    return c.json({ 
      success: false, 
      error: 'Erro interno do servidor',
      details: error?.message || 'Erro desconhecido'
    }, 500);
  }
}

// Função de streaming para arquivos grandes
function parseCSVStreaming(content: string): any[] {
  console.log('Iniciando parse com streaming para arquivo grande...');
  const streamStartTime = Date.now();
  
  const tasks = [];
  const CHUNK_SIZE = 64 * 1024; // 64KB chunks
  const LINE_BUFFER_SIZE = 10000; // Buffer para 10k linhas
  
  let buffer = '';
  let headers: string[] = [];
  let separator = ',';
  let lineCount = 0;
  let processedLines = 0;
  
  // Processar o conteúdo em chunks
  for (let offset = 0; offset < content.length; offset += CHUNK_SIZE) {
    const chunk = content.slice(offset, offset + CHUNK_SIZE);
    buffer += chunk;
    
    // Processar linhas completas no buffer
    const lines = buffer.split('\n');
    
    // Manter a última linha incompleta no buffer
    buffer = lines.pop() || '';
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;
      
      lineCount++;
      
      // Primeira linha: detectar cabeçalho e separador
      if (lineCount === 1) {
        separator = trimmedLine.includes(';') ? ';' : ',';
        headers = trimmedLine.split(separator).map(h => h.trim().replace(/"/g, ''));
        console.log(`Headers detectados: ${headers.length}, separador: '${separator}'`);
        continue;
      }
      
      // Processar linha de dados
      const values = trimmedLine.split(separator).map(v => v.trim().replace(/"/g, ''));
      
      if (values.length !== headers.length) {
        console.warn(`Linha ${lineCount}: número de colunas inconsistente (${values.length} vs ${headers.length})`);
        continue;
      }
      
      const task: any = {};
      for (let i = 0; i < headers.length; i++) {
        task[headers[i]] = values[i] || null;
      }
      
      tasks.push(task);
      processedLines++;
      
      // Log de progresso a cada 5000 linhas
      if (processedLines % 5000 === 0) {
        const progress = ((offset + chunk.length) / content.length * 100).toFixed(1);
        console.log(`Streaming progress: ${progress}% - ${processedLines} linhas processadas`);
      }
    }
    
    // Liberar memória periodicamente
    if (tasks.length > LINE_BUFFER_SIZE) {
      // Em uma implementação real, aqui poderíamos processar e limpar o buffer
      // Por agora, apenas logamos o progresso
      console.log(`Buffer de linhas atingido: ${tasks.length} tarefas em memória`);
    }
  }
  
  // Processar última linha se houver
  if (buffer.trim()) {
    const values = buffer.trim().split(separator).map(v => v.trim().replace(/"/g, ''));
    if (values.length === headers.length) {
      const task: any = {};
      for (let i = 0; i < headers.length; i++) {
        task[headers[i]] = values[i] || null;
      }
      tasks.push(task);
      processedLines++;
    }
  }
  
  const streamDuration = Date.now() - streamStartTime;
  console.log(`Streaming concluído: ${processedLines} linhas processadas em ${streamDuration}ms`);
  console.log(`Performance streaming: ${(processedLines / (streamDuration / 1000)).toFixed(2)} linhas/segundo`);
  
  return tasks;
}

export default wmsTasksRouter;