"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hono_1 = require("hono");
const zod_validator_1 = require("@hono/zod-validator");
const zod_1 = require("zod");
const utils_1 = require("../utils");
// Schema para validação de tarefas WMS
const WMSTaskSchema = zod_1.z.object({
    armazem_mapa: zod_1.z.string().optional(),
    tarefa: zod_1.z.string().min(1, 'Tarefa é obrigatória'),
    placa_cavalo: zod_1.z.string().optional(),
    placa_carreta: zod_1.z.string().optional(),
    origem: zod_1.z.string().optional(),
    destino: zod_1.z.string().optional(),
    palete: zod_1.z.string().optional(),
    prioridade: zod_1.z.string().optional(),
    status: zod_1.z.string().optional(),
    tipo: zod_1.z.string().min(1, 'Tipo é obrigatório'),
    usuario: zod_1.z.string().min(1, 'Usuário é obrigatório'),
    user_id: zod_1.z.string().optional(),
    data_criacao: zod_1.z.string().optional(),
    data_ultima_associacao: zod_1.z.string().optional(),
    data_alteracao: zod_1.z.string().optional(),
    data_liberacao: zod_1.z.string().optional(),
    concluida_task: zod_1.z.boolean().default(false),
    tempo_execucao: zod_1.z.number().min(0).default(0)
});
const wmsTaskRoutes = new hono_1.Hono();
// ===== CRUD ENDPOINTS =====
// GET /api/wms-tasks - Listar todas as tarefas com filtros
wmsTaskRoutes.get('/', async (c) => {
    try {
        const supabase = (0, utils_1.getSupabase)(c.env);
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
    }
    catch (error) {
        console.error('Erro ao buscar tarefas WMS:', error);
        return c.json({ success: false, error: 'Erro interno do servidor' }, 500);
    }
});
// GET /api/wms-tasks/:id - Buscar tarefa específica
wmsTaskRoutes.get('/:id', async (c) => {
    try {
        const supabase = (0, utils_1.getSupabase)(c.env);
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
    }
    catch (error) {
        console.error('Erro ao buscar tarefa WMS:', error);
        return c.json({ success: false, error: 'Erro interno do servidor' }, 500);
    }
});
// POST /api/wms-tasks - Criar nova tarefa
wmsTaskRoutes.post('/', (0, zod_validator_1.zValidator)('json', WMSTaskSchema), async (c) => {
    try {
        const supabase = (0, utils_1.getSupabase)(c.env);
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
    }
    catch (error) {
        console.error('Erro ao criar tarefa WMS:', error);
        return c.json({ success: false, error: 'Erro interno do servidor' }, 500);
    }
});
exports.default = wmsTaskRoutes;
