import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { ActivitySchema, KPISchema, CalculatorInputSchema, UserSchema, LoginSchema, CreateLancamentoSchema, KPILimitCheckSchema, AdminValidationSchema, ExportFilterSchema } from '../shared/types';
import { cors } from 'hono/cors';
import { createClient } from '@supabase/supabase-js';
const app = new Hono();
app.use('*', cors());
// Helper function to get Supabase client
const getSupabase = (env) => {
    return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
};
// Authentication endpoints
app.post('/api/auth/login', zValidator('json', LoginSchema), async (c) => {
    const supabase = getSupabase(c.env);
    const { cpf, data_nascimento } = c.req.valid('json');
    
    const { data: user, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('cpf', cpf)
        .eq('status_usuario', 'ativo')
        .filter('data_nascimento::date', 'eq', data_nascimento)
        .single();
    
    if (error) {
        console.error('Login database error:', error.message);
        return c.json({ message: 'CPF ou data de nascimento incorretos' }, 401);
    }
    
    if (!user) {
        console.warn('Login failed - user not found');
        return c.json({ message: 'CPF ou data de nascimento incorretos' }, 401);
    }
    
    console.log('Login successful:', user.nome);
    return c.json(user);
});

// Helper function to generate export data
async function generateExportData(supabase, filtros) {
    try {
        let query = supabase
            .from('lancamentos_produtividade')
            .select(`
                data_lancamento,
                remuneracao_total,
                status,
                usuarios!inner(
                    id,
                    cpf,
                    nome,
                    funcao,
                    status_usuario
                )
            `)
            .eq('usuarios.status_usuario', 'ativo');

        // Apply filters
        if (filtros.periodo_inicio) {
            query = query.gte('data_lancamento', filtros.periodo_inicio);
        }
        if (filtros.periodo_fim) {
            query = query.lte('data_lancamento', filtros.periodo_fim);
        }
        if (filtros.funcao) {
            query = query.eq('usuarios.funcao', filtros.funcao);
        }
        if (filtros.colaborador_id) {
            query = query.eq('usuarios.id', filtros.colaborador_id);
        }
        if (filtros.status !== 'todos') {
            query = query.eq('status', filtros.status);
        }

        const { data: lancamentos, error } = await query.order('data_lancamento', { ascending: false });

        if (error) {
            console.error('Erro na consulta de exportação:', error);
            throw new Error(error.message);
        }

        // Group data by month and user
        const groupedData = new Map();
        lancamentos?.forEach((lancamento) => {
            const date = new Date(lancamento.data_lancamento);
            const mes = `${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
            const key = `${mes}_${lancamento.usuarios.id}`;

            if (!groupedData.has(key)) {
                groupedData.set(key, {
                    mes,
                    cpf: lancamento.usuarios.cpf,
                    nome: lancamento.usuarios.nome,
                    funcao: lancamento.usuarios.funcao,
                    valor_rv: 0,
                    total_lancamentos: 0
                });
            }

            const group = groupedData.get(key);
            group.valor_rv += lancamento.remuneracao_total || 0;
            group.total_lancamentos += 1;
        });

        const dados = Array.from(groupedData.values())
            .sort((a, b) => {
                // Sort by date desc, then by name asc
                const dateA = new Date(a.mes.split('/').reverse().join('-'));
                const dateB = new Date(b.mes.split('/').reverse().join('-'));
                if (dateB.getTime() !== dateA.getTime()) {
                    return dateB.getTime() - dateA.getTime();
                }
                return a.nome.localeCompare(b.nome);
            });

        const total_registros = dados.length;
        const valor_total = dados.reduce((sum, item) => sum + (item.valor_rv || 0), 0);
        const valor_medio = total_registros > 0 ? valor_total / total_registros : 0;

        return {
            dados,
            total_registros,
            valor_total,
            valor_medio
        };
    } catch (error) {
        console.error('Erro na função generateExportData:', error);
        throw error;
    }
}

function generateCSV(dados, adminNome) {
    const headers = ['MES', 'CPF', 'NOME', 'FUNCAO', 'VALOR_RV', 'TOTAL_LANCAMENTOS', 'DATA_EXPORTACAO', 'EXPORTADO_POR'];
    const dataAtual = new Date().toLocaleString('pt-BR');

    // Add BOM for UTF-8 encoding (better Excel compatibility)
    let csvContent = '\uFEFF';

    // Add headers with proper escaping
    csvContent += headers.map(header => `"${header}"`).join(';') + '\r\n';

    // Add data rows with proper formatting
    dados.forEach(linha => {
        const row = [
            `"${linha.mes || ''}"`,
            `"${linha.cpf || ''}"`,
            `"${(linha.nome || '').replace(/"/g, '""')}"`, // Escape quotes
            `"${(linha.funcao || '').replace(/"/g, '""')}"`, // Escape quotes
            `"${(linha.valor_rv || 0).toFixed(2).replace('.', ',')}"`, // Brazilian decimal format
            `"${linha.total_lancamentos || 0}"`,
            `"${dataAtual}"`,
            `"${adminNome.replace(/"/g, '""')}"` // Escape quotes
        ];
        csvContent += row.join(';') + '\r\n';
    });

    return csvContent;
}

// Export data endpoint
app.post('/api/export-data', async (c) => {
    const supabase = getSupabase(c.env);
    const { filtros, formato, admin_id, admin_nome } = await c.req.json();

    try {
        // Generate data directly instead of making internal HTTP call
        const previewData = await generateExportData(supabase, filtros);
        const dados = previewData.dados;

        if (dados.length === 0) {
            return c.json({ error: 'Nenhum dado encontrado para exportar' }, 400);
        }

        // Generate filename
        const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '').replace('T', '_');
        const filename = `produtividade_${timestamp}.${formato}`;

        // Log the export
        const { error: logError } = await supabase
            .from('log_exportacoes')
            .insert({
                admin_id,
                admin_nome,
                filtros_aplicados: JSON.stringify(filtros),
                formato_exportacao: formato,
                total_registros: dados.length,
                nome_arquivo: filename,
                data_exportacao: new Date().toISOString(),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            });

        if (logError) {
            console.error('Erro ao registrar log de exportação:', logError);
            // Continue with export even if logging fails
        }

        // Generate and return the file based on format
        if (formato === 'csv') {
            const csvContent = generateCSV(dados, admin_nome);
            return new Response(csvContent, {
                headers: {
                    'Content-Type': 'text/csv;charset=utf-8-sig',
                    'Content-Disposition': `attachment; filename="${filename}"`,
                    'Cache-Control': 'no-cache'
                }
            });
        } else if (formato === 'xlsx') {
            // For now, return CSV for xlsx (client will handle Excel generation)
            const csvContent = generateCSV(dados, admin_nome);
            return new Response(csvContent, {
                headers: {
                    'Content-Type': 'text/csv;charset=utf-8',
                    'Content-Disposition': `attachment; filename="${filename}"`
                }
            });
        } else if (formato === 'pdf') {
            // For now, return CSV for PDF (client will handle PDF generation)
            const csvContent = generateCSV(dados, admin_nome);
            return new Response(csvContent, {
                headers: {
                    'Content-Type': 'text/csv;charset=utf-8',
                    'Content-Disposition': `attachment; filename="${filename}"`
                }
            });
        }

        return c.json({ error: 'Formato não suportado' }, 400);
    } catch (error) {
        console.error('Erro na exportação:', error);
        return c.json({ error: 'Erro ao exportar dados' }, 500);
    }
});

// Export logs endpoint
app.get('/api/export-logs', async (c) => {
    const supabase = getSupabase(c.env);
    
    try {
        const { data: logs, error } = await supabase
            .from('log_exportacoes')
            .select('*')
            .order('data_exportacao', { ascending: false })
            .limit(50);

        if (error) {
            console.error('Erro na consulta de logs:', error);
            return c.json({ error: error.message }, 500);
        }

        return c.json(logs || []);
    } catch (error) {
        console.error('Erro ao buscar logs de exportação:', error);
        return c.json({ error: 'Erro ao carregar logs' }, 500);
    }
});

// WMS Users management endpoints
app.get('/api/wms-users', async (c) => {
    const supabase = getSupabase(c.env);
    
    try {
        const { data: users, error } = await supabase
            .from('cadastro_wms')
            .select('id, nome, cpf, login_wms, nome_wms, created_at, updated_at')
            .order('nome', { ascending: true });

        if (error) {
            console.error('Erro na consulta de usuários WMS:', error);
            return c.json({ success: false, error: error.message }, 500);
        }

        return c.json({ success: true, users: users || [] });
    } catch (error) {
        console.error('Erro ao buscar usuários WMS:', error);
        return c.json({ success: false, error: 'Erro interno do servidor' }, 500);
    }
});

app.post('/api/wms-users', async (c) => {
    const supabase = getSupabase(c.env);
    
    try {
        const { nome, cpf, login_wms, nome_wms } = await c.req.json();
        
        // Verificar se CPF ou login já existem
        const { data: existing, error: checkError } = await supabase
            .from('cadastro_wms')
            .select('id')
            .or(`cpf.eq.${cpf},login_wms.eq.${login_wms}`)
            .limit(1);

        if (checkError) {
            console.error('Erro ao verificar usuário existente:', checkError);
            return c.json({ success: false, error: checkError.message }, 500);
        }

        if (existing && existing.length > 0) {
            return c.json({ success: false, error: 'CPF ou Login WMS já cadastrado' }, 400);
        }

        const { data: newUser, error: insertError } = await supabase
            .from('cadastro_wms')
            .insert({
                nome,
                cpf,
                login_wms,
                nome_wms
            })
            .select('id')
            .single();

        if (insertError) {
            console.error('Erro ao inserir usuário WMS:', insertError);
            return c.json({ success: false, error: insertError.message }, 500);
        }

        return c.json({ success: true, id: newUser.id });
    } catch (error) {
        console.error('Erro ao criar usuário WMS:', error);
        return c.json({ success: false, error: 'Erro interno do servidor' }, 500);
    }
});

app.put('/api/wms-users/:id', async (c) => {
    const supabase = getSupabase(c.env);
    const id = c.req.param('id');
    
    try {
        const { nome, cpf, login_wms, nome_wms } = await c.req.json();
        
        // Verificar se CPF ou login já existem em outros registros
        const { data: existing, error: existingError } = await supabase
            .from('cadastro_wms')
            .select('id')
            .or(`cpf.eq.${cpf},login_wms.eq.${login_wms}`)
            .neq('id', id)
            .single();

        if (existingError && existingError.code !== 'PGRST116') {
            console.error('Erro ao verificar usuário WMS existente:', existingError);
            return c.json({ success: false, error: 'Erro interno do servidor' }, 500);
        }

        if (existing) {
            return c.json({ success: false, error: 'CPF ou Login WMS já cadastrado' }, 400);
        }

        const { data, error } = await supabase
            .from('cadastro_wms')
            .update({ nome, cpf, login_wms, nome_wms })
            .eq('id', id)
            .select();

        if (error) {
            console.error('Erro ao atualizar usuário WMS:', error);
            return c.json({ success: false, error: 'Erro interno do servidor' }, 500);
        }

        if (data && data.length > 0) {
            return c.json({ success: true });
        } else {
            return c.json({ success: false, error: 'Usuário WMS não encontrado' }, 404);
        }
    } catch (error) {
        console.error('Erro ao atualizar usuário WMS:', error);
        return c.json({ success: false, error: 'Erro interno do servidor' }, 500);
    }
});

app.delete('/api/wms-users/:id', async (c) => {
    const supabase = getSupabase(c.env);
    const id = c.req.param('id');
    
    try {
        const { data, error } = await supabase
            .from('cadastro_wms')
            .delete()
            .eq('id', id)
            .select();

        if (error) {
            console.error('Erro ao deletar usuário WMS:', error);
            return c.json({ success: false, error: 'Erro interno do servidor' }, 500);
        }

        if (data && data.length > 0) {
            return c.json({ success: true });
        } else {
            return c.json({ success: false, error: 'Usuário WMS não encontrado' }, 404);
        }
    } catch (error) {
        console.error('Erro ao deletar usuário WMS:', error);
        return c.json({ success: false, error: 'Erro interno do servidor' }, 500);
    }
});

// Check if operator exists in usuarios table
app.get('/api/check-operator/:operatorName', async (c) => {
    const supabase = getSupabase(c.env);
    const nome_operador = decodeURIComponent(c.req.param('operatorName'));
    
    try {
        // Buscar operador na tabela usuarios
        const { data: userData, error: userError } = await supabase
            .from('usuarios')
            .select('id, nome, funcao')
            .eq('nome', nome_operador)
            .single();

        if (userError && userError.code !== 'PGRST116') {
            console.error('Erro ao buscar operador:', userError);
            return c.json({ 
                success: false, 
                error: 'Erro ao buscar operador', 
                details: userError.message 
            }, 500);
        }

        if (userData) {
            return c.json({
                success: true,
                exists: true,
                operador: userData,
                message: `Operador ${nome_operador} encontrado na tabela usuarios`
            });
        } else {
            return c.json({
                success: true,
                exists: false,
                message: `Operador ${nome_operador} NÃO encontrado na tabela usuarios`
            });
        }
    } catch (error) {
        console.error('Erro ao verificar operador:', error);
        return c.json({ 
            success: false, 
            error: 'Erro interno do servidor', 
            details: error?.message || 'Erro desconhecido' 
        }, 500);
    }
});

// Register operator in usuarios table
app.post('/api/register-operator', async (c) => {
    const supabase = getSupabase(c.env);
    
    try {
        const { nome_operador } = await c.req.json();
        
        if (!nome_operador || !nome_operador.trim()) {
            return c.json({ success: false, error: 'Nome do operador é obrigatório' }, 400);
        }

        // Verificar se já existe
        const { data: existing } = await supabase
            .from('usuarios')
            .select('id')
            .eq('nome', nome_operador)
            .single();

        if (existing) {
            return c.json({ success: false, error: 'Operador já cadastrado' }, 400);
        }

        // Cadastrar novo operador
        const { data: newUser, error: insertError } = await supabase
            .from('usuarios')
            .insert({
                nome: nome_operador,
                funcao: 'Operador de Empilhadeira',
                turno: 'Manhã', // valor padrão
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .select()
            .single();

        if (insertError) {
            console.error('Erro ao cadastrar operador:', insertError);
            return c.json({ 
                success: false, 
                error: 'Erro ao cadastrar operador', 
                details: insertError.message 
            }, 500);
        }

        return c.json({
            success: true,
            operador: newUser,
            message: `Operador ${nome_operador} cadastrado com sucesso`
        });
    } catch (error) {
        console.error('Erro ao cadastrar operador:', error);
        return c.json({ 
            success: false, 
            error: 'Erro interno do servidor', 
            details: error?.message || 'Erro desconhecido' 
        }, 500);
    }
});

// List all unique WMS operators
app.get('/api/wms-operators', async (c) => {
    const supabase = getSupabase(c.env);
    
    try {
        // Buscar operadores únicos da tabela tarefas_wms
        const { data: tarefas, error } = await supabase
            .from('tarefas_wms')
            .select('usuario')
            .order('usuario');

        if (error) {
            console.error('Erro ao buscar operadores do Supabase:', error);
            return c.json({ 
                success: false, 
                error: 'Erro ao buscar operadores', 
                details: error.message 
            }, 500);
        }

        const operadores = [...new Set(tarefas.map(t => t.usuario).filter(u => u && u.trim()))];
        console.log('Operadores únicos encontrados:', operadores.length);

        return c.json({
            success: true,
            operadores: operadores.sort(),
            total: operadores.length
        });
    } catch (error) {
        console.error('Erro ao buscar operadores WMS:', error);
        return c.json({ 
            success: false, 
            error: 'Erro interno do servidor', 
            details: error?.message || 'Erro desconhecido' 
        }, 500);
    }
});

// Lancamentos produtividade endpoint for dashboard
app.get('/api/lancamentos-produtividade', async (c) => {
    const supabase = getSupabase(c.env);
    const user_id = c.req.query('user_id');

    try {
        // Buscar lançamentos aprovados
        let query = supabase
            .from('lancamentos_produtividade')
            .select('*')
            .eq('status', 'aprovado')
            .order('data_lancamento', { ascending: false });

        // Se user_id for fornecido, filtrar por usuário específico
        if (user_id) {
            query = query.eq('user_id', parseInt(user_id));
        }

        const { data: lancamentos, error } = await query;

        console.log('Resultado da consulta:', { count: lancamentos?.length || 0, error });

        if (error) {
            console.error('Erro na consulta:', error);
            return c.json({ error: error.message }, 500);
        }

        if (!lancamentos || lancamentos.length === 0) {
            console.log('Nenhum lançamento aprovado encontrado');
            return c.json([]);
        }

        console.log('Retornando:', lancamentos.length, 'registros');
        return c.json(lancamentos);

    } catch (error) {
        console.error('Erro no endpoint lancamentos-produtividade:', error);
        return c.json({ error: 'Erro interno do servidor' }, 500);
    }
});

// Approval history endpoint
app.get('/api/historico-aprovacoes', async (c) => {
    const supabase = getSupabase(c.env);
    const colaborador = c.req.query('colaborador');
    const admin = c.req.query('admin');
    const editado = c.req.query('editado');

    try {
        console.log('=== HISTORICO APROVACOES DEBUG ===');
        console.log('Filtros recebidos:', { colaborador, admin, editado });

        // Buscar todos os lançamentos aprovados diretamente
        const { data: allApproved, error: allError } = await supabase
            .from('lancamentos_produtividade')
            .select('*')
            .eq('status', 'aprovado')
            .order('updated_at', { ascending: false });

        console.log('Lançamentos aprovados encontrados:', allApproved?.length || 0);

        if (allError) {
            console.error('Erro na consulta inicial:', allError);
            return c.json({ error: 'Erro ao carregar histórico' }, 500);
        }

        if (!allApproved || allApproved.length === 0) {
            console.log('Nenhum lançamento aprovado encontrado');
            return c.json([]);
        }

        // Aplicar filtros manualmente se necessário
        let filteredHistory = allApproved;

        if (colaborador) {
            filteredHistory = filteredHistory.filter(item => 
                item.user_nome?.toLowerCase().includes(colaborador.toLowerCase())
            );
        }

        if (admin) {
            filteredHistory = filteredHistory.filter(item => 
                item.aprovado_por_nome?.toLowerCase().includes(admin.toLowerCase())
            );
        }

        if (editado === 'true') {
            filteredHistory = filteredHistory.filter(item => item.editado_por_admin);
        } else if (editado === 'false') {
            filteredHistory = filteredHistory.filter(item => !item.editado_por_admin);
        }

        console.log('Após filtros:', filteredHistory.length);

        // Transform data to match expected format
        const transformedHistory = filteredHistory.map(item => ({
            id: item.id,
            lancamento_id: item.id,
            colaborador_id: item.user_id,
            colaborador_nome: item.user_nome,
            colaborador_cpf: item.user_cpf,
            data_lancamento: item.data_lancamento,
            data_aprovacao: item.data_aprovacao || item.updated_at,
            aprovado_por: item.aprovado_por_nome || item.aprovado_por || 'N/A',
            editado: !!item.editado_por_admin,
            editado_por: item.editado_por_admin,
            dados_finais: JSON.stringify(item),
            observacoes: item.observacoes,
            remuneracao_total: item.remuneracao_total,
            created_at: item.created_at,
            updated_at: item.updated_at
        }));

        console.log('Retornando:', transformedHistory.length, 'registros');
        return c.json(transformedHistory);

    } catch (error) {
        console.error('Erro no endpoint historico-aprovacoes:', error);
        return c.json({ error: 'Erro interno do servidor' }, 500);
    }
});
app.post('/api/auth/logout', async (c) => {
    return c.json({ success: true, message: 'Logged out successfully' });
});

// Endpoint para buscar dados de produtividade
app.get('/api/productivity-data', async (c) => {
    const supabase = getSupabase(c.env);
    
    try {
        // Buscar dados de usuários com suas funções e turnos
        const { data: usuarios, error: usuariosError } = await supabase
            .from('usuarios')
            .select('id, nome, funcao, turno, status_usuario')
            .eq('status_usuario', 'ativo');

        if (usuariosError) {
            console.error('Erro ao buscar usuários:', usuariosError);
            return c.json({ success: false, error: 'Erro ao buscar dados de usuários' }, 500);
        }

        // Buscar dados de lançamentos para calcular produtividade
        const { data: lancamentos, error: lancamentosError } = await supabase
            .from('lancamentos_produtividade')
            .select(`
                id,
                usuario_id,
                data_lancamento,
                remuneracao_total,
                status
            `)
            .eq('status', 'aprovado')
            .gte('data_lancamento', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]) // Últimos 30 dias
            .order('data_lancamento', { ascending: false });

        if (lancamentosError) {
            console.error('Erro ao buscar lançamentos:', lancamentosError);
            return c.json({ success: false, error: 'Erro ao buscar dados de lançamentos' }, 500);
        }

        // Processar dados para calcular produtividade por turno e função
        const productivityData = [];
        const turnos = ['Manhã', 'Tarde', 'Noite'];
        const funcoes = ['Operador', 'Supervisor', 'Conferente'];

        for (const turno of turnos) {
            for (const funcao of funcoes) {
                const usuariosFuncao = usuarios?.filter(u => u.turno === turno && u.funcao === funcao) || [];
                const colaboradores = usuariosFuncao.length;

                if (colaboradores === 0) continue;

                // Calcular produtividade baseada nos lançamentos
                const lancamentosFuncao = lancamentos?.filter(l => {
                    const usuario = usuariosFuncao.find(u => u.id === l.usuario_id);
                    return usuario !== undefined;
                }) || [];

                let eficienciaTotal = 0;
                let contadorLancamentos = 0;

                for (const lancamento of lancamentosFuncao) {
                    if (lancamento.remuneracao_total && lancamento.remuneracao_total > 0) {
                        // Simular eficiência baseada na remuneração (quanto maior a remuneração, maior a eficiência)
                        const eficiencia = Math.min((lancamento.remuneracao_total || 0) * 10, 150); // Cap em 150%
                        eficienciaTotal += eficiencia;
                        contadorLancamentos++;
                    }
                }

                // Calcular médias ou usar valores padrão
                const produtividade = contadorLancamentos > 0
                    ? Math.round(eficienciaTotal / contadorLancamentos)
                    : Math.round(75 + Math.random() * 20); // Valor simulado entre 75-95%

                const eficiencia = contadorLancamentos > 0
                    ? Math.round(eficienciaTotal / contadorLancamentos)
                    : Math.round(95 + Math.random() * 15); // Valor simulado entre 95-110%

                // Meta baseada na função
                const meta = funcao === 'Supervisor' ? 85 : funcao === 'Operador' ? 80 : 75;

                productivityData.push({
                    turno,
                    funcao,
                    produtividade,
                    meta,
                    colaboradores,
                    eficiencia
                });
            }
        }

        return c.json({
            success: true,
            data: productivityData,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Erro ao buscar dados de produtividade:', error);
        return c.json({
            success: false,
            error: 'Erro interno do servidor',
            details: error?.message || 'Erro desconhecido'
        }, 500);
    }
});

// Monthly earnings endpoint
app.get('/api/monthly-earnings', async (c) => {
    const supabase = getSupabase(c.env);
    const funcao = c.req.query('funcao');
    const mesAno = c.req.query('mesAno');
    
    try {
        let query = supabase
            .from('lancamentos_produtividade')
            .select('*')
            .eq('status', 'aprovado')
            .order('data_lancamento', { ascending: false });
        
        // Filtrar por função se especificado
        if (funcao && funcao !== 'todas') {
            query = query.eq('funcao', funcao);
        }
        
        // Filtrar por mês/ano se especificado
        if (mesAno && mesAno !== 'todos') {
            const [ano, mes] = mesAno.split('-');
            const startDate = `${ano}-${mes.padStart(2, '0')}-01`;
            const endDate = new Date(parseInt(ano), parseInt(mes), 0).toISOString().split('T')[0];
            query = query.gte('data_lancamento', startDate).lte('data_lancamento', endDate);
        }
        
        const { data: lancamentos, error } = await query;
        
        if (error) {
            console.error('Error fetching monthly earnings:', error.message);
            return c.json({ success: false, error: error.message }, 500);
        }
        
        if (!lancamentos || lancamentos.length === 0) {
            return c.json({ success: true, data: [] });
        }
        
        // Agrupar por colaborador
        const colaboradoresMap = {};
        
        lancamentos.forEach(lancamento => {
            const userId = lancamento.user_id;
            if (!colaboradoresMap[userId]) {
                colaboradoresMap[userId] = {
                    id: userId,
                    nome: lancamento.user_nome,
                    cpf: lancamento.user_cpf,
                    funcao: lancamento.funcao,
                    ganhoTotal: 0,
                    totalLancamentos: 0,
                    detalhes: []
                };
            }
            
            colaboradoresMap[userId].ganhoTotal += lancamento.remuneracao_total || 0;
            colaboradoresMap[userId].totalLancamentos += 1;
            colaboradoresMap[userId].detalhes.push({
                data: lancamento.data_lancamento,
                atividade: lancamento.nome_atividade || 'N/A',
                turno: lancamento.turno,
                remuneracao: lancamento.remuneracao_total || 0,
                produtividade: lancamento.produtividade_alcancada || 0,
                bonusKpis: lancamento.bonus_kpis || 0
            });
        });
        
        // Calcular média de ganho por lançamento
        const monthlyEarningsData = Object.values(colaboradoresMap).map(colaborador => ({
            ...colaborador,
            mediaGanho: colaborador.totalLancamentos > 0 
                ? colaborador.ganhoTotal / colaborador.totalLancamentos 
                : 0
        }));
        
        return c.json({ success: true, data: monthlyEarningsData });
        
    } catch (error) {
        console.error('Error in monthly-earnings endpoint:', error.message);
        return c.json({ success: false, error: 'Erro interno do servidor' }, 500);
    }
});

// User management endpoints
app.get('/api/usuarios', async (c) => {
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
app.post('/api/usuarios', zValidator('json', UserSchema), async (c) => {
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
app.put('/api/usuarios/:id', zValidator('json', UserSchema.partial()), async (c) => {
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
app.delete('/api/usuarios/:id', async (c) => {
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
// Activity management endpoints
app.get('/api/activities', async (c) => {
    const supabase = getSupabase(c.env);
    const { data: activities, error } = await supabase
        .from('activities')
        .select('*')
        .order('nome_atividade', { ascending: true });
    if (error) {
        return c.json({ error: error.message }, 500);
    }
    return c.json(activities || []);
});
app.get('/api/activity-names', async (c) => {
    const supabase = getSupabase(c.env);
    const { data: activities, error } = await supabase
        .from('activities')
        .select('nome_atividade')
        .order('nome_atividade', { ascending: true });
    if (error) {
        return c.json({ error: error.message }, 500);
    }
    // Get unique activity names
    const uniqueActivities = [...new Set(activities?.map(item => item.nome_atividade) || [])]
        .filter(nome => nome && nome.trim() !== '')
        .map(nome_atividade => ({ nome_atividade }));
    
    // Force UTF-8 encoding in response
    const response = c.json({ results: uniqueActivities });
    response.headers.set('Content-Type', 'application/json; charset=utf-8');
    response.headers.set('Cache-Control', 'no-cache');
    return response;
});
app.post('/api/activities', zValidator('json', ActivitySchema), async (c) => {
    const supabase = getSupabase(c.env);
    const data = c.req.valid('json');
    const { data: activity, error } = await supabase
        .from('activities')
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
    return c.json(activity);
});
app.put('/api/activities/:id', zValidator('json', ActivitySchema.partial()), async (c) => {
    const supabase = getSupabase(c.env);
    const id = parseInt(c.req.param('id'));
    const data = c.req.valid('json');
    const { data: activity, error } = await supabase
        .from('activities')
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
    return c.json(activity);
});
app.delete('/api/activities/:id', async (c) => {
    const supabase = getSupabase(c.env);
    const id = parseInt(c.req.param('id'));
    const { error } = await supabase
        .from('activities')
        .delete()
        .eq('id', id);
    if (error) {
        return c.json({ error: error.message }, 500);
    }
    return c.json({ success: true });
});
// KPI management endpoints
app.get('/api/kpis', async (c) => {
    const supabase = getSupabase(c.env);
    const { data: kpis, error } = await supabase
        .from('kpis')
        .select('*')
        .order('nome_kpi', { ascending: true });
    if (error) {
        return c.json({ error: error.message }, 500);
    }
    return c.json(kpis || []);
});
app.get('/api/functions', async (c) => {
    const supabase = getSupabase(c.env);
    const { data: kpis, error } = await supabase
        .from('kpis')
        .select('funcao_kpi')
        .order('funcao_kpi', { ascending: true });
    if (error) {
        return c.json({ error: error.message }, 500);
    }
    const uniqueFunctions = [...new Set(kpis?.map(k => k.funcao_kpi) || [])];
    return c.json(uniqueFunctions);
});
app.post('/api/kpis', zValidator('json', KPISchema), async (c) => {
    const supabase = getSupabase(c.env);
    const data = c.req.valid('json');
    const { data: kpi, error } = await supabase
        .from('kpis')
        .insert(data)
        .select()
        .single();
    if (error) {
        return c.json({ error: error.message }, 500);
    }
    return c.json(kpi);
});
app.put('/api/kpis/:id', zValidator('json', KPISchema.partial()), async (c) => {
    const supabase = getSupabase(c.env);
    const id = parseInt(c.req.param('id'));
    const data = c.req.valid('json');
    const { data: kpi, error } = await supabase
        .from('kpis')
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
    return c.json(kpi);
});
app.delete('/api/kpis/:id', async (c) => {
    const supabase = getSupabase(c.env);
    const id = parseInt(c.req.param('id'));
    const { error } = await supabase
        .from('kpis')
        .delete()
        .eq('id', id);
    if (error) {
        return c.json({ error: error.message }, 500);
    }
    return c.json({ success: true });
});

// Get available KPIs for function/shift (limited to 2 active KPIs)
app.get('/api/kpis/available', async (c) => {
    const supabase = getSupabase(c.env);
    const funcao = c.req.query('funcao');
    const turno = c.req.query('turno');
    
    if (!funcao || !turno) {
        return c.json({ error: 'Função e turno são obrigatórios' }, 400);
    }
    
    console.log('Searching for KPIs with:', { funcao, turno });
    
    try {
        // Query KPIs for the specific function and turno, including 'Geral' turno
        const { data: kpis, error } = await supabase
            .from('kpis')
            .select('*')
            .eq('funcao_kpi', funcao)
            .in('turno_kpi', [turno, 'Geral'])
            .eq('status_ativo', true)
            .order('nome_kpi', { ascending: true });
        
        console.log(`KPI query result:`, { count: kpis?.length || 0, error });
        
        if (error) {
            console.error('Error fetching KPIs:', error);
            return c.json({ error: error.message }, 500);
        }
        
        // Return the KPIs array directly (not wrapped in an object)
        return c.json(kpis || []);
    } catch (error) {
        console.error('Error in KPI available endpoint:', error);
        return c.json({ error: 'Erro interno do servidor' }, 500);
    }
});

// KPI limit check endpoint
app.post('/api/kpis/check-limit', zValidator('json', KPILimitCheckSchema), async (c) => {
  const supabase = getSupabase(c.env);
  const { user_id, data_lancamento } = c.req.valid('json');

  try {
    // Count KPI launches for the user on the specific date, excluding reproved launches
    const { count, error } = await supabase
      .from('lancamentos_produtividade')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user_id)
      .eq('data_lancamento', data_lancamento)
      .not('kpis_atingidos', 'is', null)
      .neq('kpis_atingidos', '[]')
      .neq('status', 'reprovado'); // Exclude reproved launches

    if (error) {
      console.error('Error checking KPI limit:', error);
      return c.json({ error: 'Erro ao verificar limite de KPIs' }, 500);
    }

    const total = count || 0;
    const canLaunch = total < 1;
    const remaining = Math.max(0, 1 - total);

    return c.json({
      can_launch: canLaunch,
      current_count: total,
      remaining_launches: remaining,
      daily_limit: 1
    });
  } catch (error) {
    console.error('Error checking KPI limit:', error);
    return c.json({ error: 'Erro interno do servidor' }, 500);
  }
});

// Helper function to normalize strings (remove accents)
const normalizeString = (str) => {
    return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/ç/g, 'c')
        .replace(/Ç/g, 'C');
};
// Calculator endpoint
app.post('/api/calculate', zValidator('json', CalculatorInputSchema), async (c) => {
    const supabase = getSupabase(c.env);
    const input = c.req.valid('json');
    try {
        console.log('Calculator endpoint called');
        console.log('Input received:', JSON.stringify(input, null, 2));
        // Normalize input strings
        const normalizedFuncao = normalizeString(input.funcao);
        const normalizedTurno = normalizeString(input.turno);
        console.log('Original input:', { funcao: input.funcao, turno: input.turno });
        console.log('Normalized input:', { funcao: normalizedFuncao, turno: normalizedTurno });
        // Map input to database values - fix encoding issues
        const dbFuncao = input.funcao.includes('Armaz') ? 'Ajudante de Armazém' : input.funcao;
        const dbTurno = input.turno === 'Manha' ? 'Manhã' : input.turno; // Map to correct turno with accent
        console.log('Database search values:', { dbFuncao, dbTurno });
        console.log('Searching for KPIs with:', { funcao_kpi: dbFuncao, turno_kpi_in: [dbTurno, 'Geral'] });
        let subtotal_atividades = 0;
        let bonus_kpis = 0;
        let produtividade_alcancada;
        let nivel_atingido;
        let unidade_medida;
        let atividades_detalhes = [];
        let tarefas_validas;
        let valor_tarefas;
        let valor_bruto_atividades = 0;
        const kpis_atingidos_resultado = [];
        // Calculate activities
        if (input.nome_atividade && input.quantidade_produzida && input.tempo_horas) {
            const { data: activities, error: activityError } = await supabase
                .from('activities')
                .select('*')
                .eq('nome_atividade', input.nome_atividade)
                .order('produtividade_minima', { ascending: false });
            if (activityError || !activities || activities.length === 0) {
                console.error('Activity error:', activityError);
                return c.json({ error: 'Atividade não encontrada' }, 400);
            }
            if (activities.length > 0) {
                produtividade_alcancada = input.quantidade_produzida / input.tempo_horas;
                unidade_medida = activities[0].unidade_medida;
                
                // Find the highest level achieved based on productivity
                let selectedActivity = activities[activities.length - 1]; // Default to lowest level
                for (const activity of activities) {
                    if (produtividade_alcancada >= activity.produtividade_minima) {
                        selectedActivity = activity;
                        break;
                    }
                }
                
                nivel_atingido = selectedActivity.nivel_atividade;
                // Calculate subtotal: (quantity * unit_value) / 2 (50% rule)
                const valor_bruto = input.quantidade_produzida * selectedActivity.valor_atividade;
                subtotal_atividades = valor_bruto / 2;
                atividades_detalhes.push(`${selectedActivity.nome_atividade}: ${input.quantidade_produzida} ${selectedActivity.unidade_medida} em ${input.tempo_horas}h (${selectedActivity.nivel_atividade}) - Valor bruto: R$ ${valor_bruto.toFixed(2)}, Líquido: R$ ${subtotal_atividades.toFixed(2)}`);
            }
        }
        // Handle multiple activities
        if (input.multiple_activities) {
            try {
                const activities = input.multiple_activities;
                for (const act of activities) {
                    if (act.nome_atividade && act.quantidade_produzida && act.tempo_horas) {
                        const { data: activityLevels, error: activityError } = await supabase
                            .from('activities')
                            .select('*')
                            .eq('nome_atividade', act.nome_atividade)
                            .order('produtividade_minima', { ascending: false });
                        if (!activityError && activityLevels && activityLevels.length > 0) {
                            const prod = act.quantidade_produzida / act.tempo_horas;
                            
                            // Find the highest level achieved based on productivity
                            let selectedActivity = activityLevels[activityLevels.length - 1]; // Default to lowest level
                            for (const activity of activityLevels) {
                                if (prod >= activity.produtividade_minima) {
                                    selectedActivity = activity;
                                    break;
                                }
                            }
                            
                            // Calculate value for this activity: (quantity * unit_value) / 2 (50% rule)
                            const valor_bruto = act.quantidade_produzida * selectedActivity.valor_atividade;
                            const valor_liquido = valor_bruto / 2;
                            subtotal_atividades += valor_liquido;
                            valor_bruto_atividades += valor_bruto;
                            atividades_detalhes.push(`${selectedActivity.nome_atividade}: ${act.quantidade_produzida} ${selectedActivity.unidade_medida} em ${act.tempo_horas}h (${selectedActivity.nivel_atividade}) - Valor bruto: R$ ${valor_bruto.toFixed(2)}, Líquido: R$ ${valor_liquido.toFixed(2)}`);
                        }
                    }
                }
            }
            catch (e) {
                console.error('Error parsing multiple activities:', e);
            }
        }
        // Handle WMS tasks for Operador de Empilhadeira
        if (input.funcao === 'Operador de Empilhadeira' && input.nome_operador && input.data_lancamento) {
            const { data: tarefas, error: tarefasError } = await supabase
                .from('tarefas_wms')
                .select('*')
                .eq('usuario', input.nome_operador)
                .eq('data_alteracao', input.data_lancamento)
                .eq('status', 'Concluído');
            if (!tarefasError && tarefas) {
                tarefas_validas = tarefas.length;
                valor_tarefas = tarefas_validas * 2.5;
                subtotal_atividades = valor_tarefas;
                atividades_detalhes.push(`Tarefas WMS: ${tarefas_validas} tarefas concluídas`);
            }
        }
        // Calculate KPIs
        if (input.kpis_atingidos && input.kpis_atingidos.length > 0) {
            const { data: kpis, error: kpisError } = await supabase
                .from('kpis')
                .select('*')
                .eq('funcao_kpi', dbFuncao)
                .in('turno_kpi', [dbTurno, 'Geral'])
                .in('nome_kpi', input.kpis_atingidos);
            if (kpis) {
                for (const kpi of kpis) {
                    bonus_kpis += kpi.peso_kpi;
                    kpis_atingidos_resultado.push(kpi.nome_kpi);
                }
            }
        }
        // Final calculation
        const atividades_extras = input.input_adicional || 0;
        const remuneracao_total = subtotal_atividades + bonus_kpis + atividades_extras;
        const result = {
            subtotalAtividades: subtotal_atividades,
            bonusKpis: bonus_kpis,
            remuneracaoTotal: remuneracao_total,
            kpisAtingidos: kpis_atingidos_resultado,
        };
        // Add optional fields only if they exist
        if (produtividade_alcancada !== undefined)
            result.produtividadeAlcancada = produtividade_alcancada;
        if (nivel_atingido !== undefined)
            result.nivelAtingido = nivel_atingido;
        if (unidade_medida !== undefined)
            result.unidadeMedida = unidade_medida;
        if (atividades_detalhes.length > 0)
            result.atividadesDetalhes = atividades_detalhes;
        if (tarefas_validas !== undefined)
            result.tarefasValidas = tarefas_validas;
        if (valor_tarefas !== undefined)
            result.valorTarefas = valor_tarefas;
        if (valor_bruto_atividades > 0)
            result.valorBrutoAtividades = valor_bruto_atividades;
        return c.json({ data: result, error: null });
    }
    catch (error) {
        console.error('Calculator error:', error);
        return c.json({ error: 'Erro no cálculo' }, 500);
    }
});
// Lancamentos endpoints
app.get('/api/lancamentos', async (c) => {
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

// Endpoint para buscar lançamentos pendentes
app.get('/api/lancamentos/pendentes', async (c) => {
  const supabase = getSupabase(c.env);
  
  try {
    const { data: lancamentos, error } = await supabase
      .from('lancamentos_produtividade')
      .select('*')
      .eq('status', 'pendente')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Erro ao buscar lançamentos pendentes:', error);
      return c.json({ error: 'Erro ao buscar lançamentos pendentes' }, 500);
    }

    return c.json(lancamentos);
  } catch (error) {
    console.error('Erro no endpoint de lançamentos pendentes:', error);
    return c.json({ error: 'Erro interno do servidor' }, 500);
  }
});

// Endpoint para buscar todos os lançamentos
app.get('/api/lancamentos/todos', async (c) => {
  const supabase = getSupabase(c.env);
  const user_id = c.req.query('user_id');
  
  try {
    let query = supabase
      .from('lancamentos_produtividade')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (user_id) {
      query = query.eq('user_id', parseInt(user_id));
    }
    
    const { data: lancamentos, error } = await query;

    if (error) {
      console.error('Erro ao buscar todos os lançamentos:', error);
      return c.json({ error: 'Erro ao buscar todos os lançamentos' }, 500);
    }

    return c.json(lancamentos);
  } catch (error) {
    console.error('Erro no endpoint de todos os lançamentos:', error);
    return c.json({ error: 'Erro interno do servidor' }, 500);
  }
});
app.post('/api/lancamentos', zValidator('json', CreateLancamentoSchema), async (c) => {
    const supabase = getSupabase(c.env);
    const data = c.req.valid('json');
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
app.put('/api/lancamentos/:id', async (c) => {
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
app.delete('/api/lancamentos/:id', async (c) => {
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
// Export preview endpoint
app.get('/api/export-preview', async (c) => {
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
// Validation endpoint for lancamentos
app.post('/api/lancamentos/:id/validar', zValidator('json', AdminValidationSchema), async (c) => {
    const supabase = getSupabase(c.env);
    const lancamentoId = parseInt(c.req.param('id'));
    const { acao, observacoes, dados_editados, admin_user_id } = c.req.valid('json');

    console.log(`[VALIDAR] Iniciando validação do lançamento ${lancamentoId}:`, { acao, admin_user_id });

    try {
        // Buscar o lançamento original
        const { data: lancamento, error: fetchError } = await supabase
            .from('lancamentos_produtividade')
            .select('*')
            .eq('id', lancamentoId)
            .single();

        if (fetchError || !lancamento) {
            console.error('[VALIDAR] Erro ao buscar lançamento:', fetchError);
            return c.json({ error: 'Lançamento não encontrado' }, 404);
        }

        console.log('[VALIDAR] Lançamento encontrado:', lancamento.id);

        // Buscar dados do usuário administrador
        let adminUser = null;
        if (admin_user_id) {
            const { data: adminData } = await supabase
                .from('users')
                .select('nome, cpf')
                .eq('id', admin_user_id)
                .single();
            adminUser = adminData;
        }

        let updateData = {
            status: acao === 'aprovar' ? 'aprovado' : acao === 'reprovar' ? 'reprovado' : 'pendente',
            observacoes_admin: observacoes || null,
            validado_por: adminUser ? adminUser.nome : 'Admin',
            validado_em: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        // Se for edição, processar dados editados
        if (acao === 'editar' && dados_editados) {
            console.log('[VALIDAR] Processando edição de dados');
            
            // Fazer chamada interna para recalcular
            try {
                const recalcResponse = await fetch(`${c.env.WORKER_URL || 'http://localhost:8787'}/api/calculate`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(dados_editados)
                });

                if (recalcResponse.ok) {
                    const recalcData = await recalcResponse.json();
                    console.log('[VALIDAR] Recálculo realizado:', recalcData);
                    
                    // Backup dos dados originais
                    updateData.dados_originais = JSON.stringify({
                        calculator_data: lancamento.calculator_data,
                        calculator_result: lancamento.calculator_result
                    });
                    
                    // Atualizar com novos dados
                    updateData.calculator_data = JSON.stringify(dados_editados);
                    updateData.calculator_result = JSON.stringify(recalcData);
                    updateData.status_edicao = 'editado_admin';
                    updateData.observacoes_edicao = observacoes || 'Editado pelo administrador';
                } else {
                    console.error('[VALIDAR] Erro no recálculo');
                    return c.json({ error: 'Erro ao recalcular dados editados' }, 500);
                }
            } catch (calcError) {
                console.error('[VALIDAR] Erro na chamada de recálculo:', calcError);
                return c.json({ error: 'Erro ao recalcular dados' }, 500);
            }
        }

        // Atualizar o lançamento
        const { data: updatedLancamento, error: updateError } = await supabase
            .from('lancamentos_produtividade')
            .update(updateData)
            .eq('id', lancamentoId)
            .select()
            .single();

        if (updateError) {
            console.error('[VALIDAR] Erro ao atualizar lançamento:', updateError);
            return c.json({ error: 'Erro ao atualizar lançamento' }, 500);
        }

        console.log('[VALIDAR] Lançamento atualizado:', updatedLancamento.id);

        // Criar registro de revisão
        const revisaoData = {
            lancamento_id: lancamentoId,
            acao_realizada: acao,
            dados_anteriores: JSON.stringify({
                status: lancamento.status,
                calculator_data: lancamento.calculator_data,
                calculator_result: lancamento.calculator_result
            }),
            dados_posteriores: JSON.stringify({
                status: updateData.status,
                calculator_data: updateData.calculator_data || lancamento.calculator_data,
                calculator_result: updateData.calculator_result || lancamento.calculator_result
            }),
            admin_id: admin_user_id,
            admin_nome: adminUser ? adminUser.nome : 'Admin',
            observacoes: observacoes,
            created_at: new Date().toISOString()
        };

        const { error: revisaoError } = await supabase
            .from('lancamentos_produtividade_revisado')
            .insert(revisaoData);

        if (revisaoError) {
            console.error('[VALIDAR] Erro ao criar revisão:', revisaoError);
        }

        // Se aprovado, criar histórico
        if (acao === 'aprovar') {
            console.log('[VALIDAR] Criando histórico de aprovação');
            
            const { data: userData } = await supabase
                .from('users')
                .select('nome, cpf')
                .eq('id', lancamento.user_id)
                .single();

            const calculatorResult = typeof updatedLancamento.calculator_result === 'string' 
                ? JSON.parse(updatedLancamento.calculator_result) 
                : updatedLancamento.calculator_result;

            const historicoData = {
                lancamento_id: lancamentoId,
                colaborador_id: lancamento.user_id,
                colaborador_nome: userData?.nome || 'N/A',
                colaborador_cpf: userData?.cpf || 'N/A',
                data_lancamento: lancamento.data_lancamento,
                data_aprovacao: new Date().toISOString().split('T')[0],
                aprovado_por: adminUser ? adminUser.nome : 'Admin',
                editado: updateData.status_edicao === 'editado_admin',
                editado_por: updateData.status_edicao === 'editado_admin' ? (adminUser ? adminUser.nome : 'Admin') : null,
                dados_finais: JSON.stringify({
                    calculator_data: updatedLancamento.calculator_data,
                    calculator_result: updatedLancamento.calculator_result
                }),
                observacoes: observacoes,
                remuneracao_total: calculatorResult?.remuneracao_total || 0,
                created_at: new Date().toISOString()
            };

            const { error: historicoError } = await supabase
                .from('historico_lancamentos_aprovados')
                .insert(historicoData);

            if (historicoError) {
                console.error('[VALIDAR] Erro ao criar histórico:', historicoError);
            }
        }

        console.log(`[VALIDAR] Validação concluída para lançamento ${lancamentoId}`);
        return c.json({ 
            success: true, 
            lancamento: updatedLancamento,
            message: `Lançamento ${acao === 'aprovar' ? 'aprovado' : acao === 'reprovar' ? 'reprovado' : 'editado'} com sucesso`
        });

    } catch (error) {
        console.error('[VALIDAR] Erro geral:', error);
        return c.json({ error: 'Erro interno do servidor' }, 500);
    }
});

export default app;
