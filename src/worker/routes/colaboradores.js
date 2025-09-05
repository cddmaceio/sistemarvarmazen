import { Hono } from 'hono';
import { getSupabase } from '../utils';
const colaboradoresRoutes = new Hono();
// GET /api/colaboradores - Lista todos os colaboradores ativos
colaboradoresRoutes.get('/', async (c) => {
    const supabase = getSupabase(c.env);
    const { data: colaboradores, error } = await supabase
        .from('usuarios')
        .select('id, nome, cpf, funcao, tipo_usuario')
        .eq('status_usuario', 'ativo')
        .eq('tipo_usuario', 'colaborador')
        .order('nome', { ascending: true });
    if (error) {
        return c.json({ error: error.message }, 500);
    }
    return c.json({ success: true, data: colaboradores || [] });
});
// GET /api/individual-report - Relatório individual de colaborador
colaboradoresRoutes.get('/individual-report', async (c) => {
    const supabase = getSupabase(c.env);
    const colaboradorId = c.req.query('colaboradorId');
    const mesAno = c.req.query('mesAno'); // formato: YYYY-MM
    if (!colaboradorId) {
        return c.json({ error: 'colaboradorId é obrigatório' }, 400);
    }
    try {
        // 1. Buscar dados do colaborador
        const { data: colaborador, error: colaboradorError } = await supabase
            .from('usuarios')
            .select('id, nome, cpf, funcao, tipo_usuario')
            .eq('id', colaboradorId)
            .eq('status_usuario', 'ativo')
            .single();
        if (colaboradorError || !colaborador) {
            return c.json({ error: 'Colaborador não encontrado' }, 404);
        }
        // 2. Definir período de busca
        let startDate;
        let endDate;
        if (mesAno) {
            const [year, month] = mesAno.split('-');
            startDate = `${year}-${month}-01`;
            const nextMonth = parseInt(month) === 12 ? 1 : parseInt(month) + 1;
            const nextYear = parseInt(month) === 12 ? parseInt(year) + 1 : parseInt(year);
            endDate = `${nextYear}-${nextMonth.toString().padStart(2, '0')}-01`;
        }
        else {
            // Se não especificado, usar mês atual
            const now = new Date();
            const year = now.getFullYear();
            const month = now.getMonth() + 1;
            startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
            const nextMonth = month === 12 ? 1 : month + 1;
            const nextYear = month === 12 ? year + 1 : year;
            endDate = `${nextYear}-${nextMonth.toString().padStart(2, '0')}-01`;
        }
        // 3. Buscar lançamentos do período
        const { data: lancamentos, error: lancamentosError } = await supabase
            .from('lancamentos_produtividade')
            .select(`
        id,
        data_lancamento,
        turno,
        nome_atividade,
        quantidade_produzida,
        tempo_horas,
        multiple_activities,
        atividades_detalhes,
        kpis_atingidos,
        remuneracao_total,
        subtotal_atividades,
        bonus_kpis,
        status,
        observacoes,
        created_at
      `)
            .eq('user_id', colaboradorId)
            .gte('data_lancamento', startDate)
            .lt('data_lancamento', endDate)
            .order('data_lancamento', { ascending: true });
        if (lancamentosError) {
            return c.json({ error: lancamentosError.message }, 500);
        }
        // 4. Calcular resumo do mês
        const lancamentosAprovados = lancamentos?.filter(l => l.status === 'aprovado') || [];
        const valorFinalMes = lancamentosAprovados.reduce((sum, l) => sum + (l.remuneracao_total || 0), 0);
        const diasTrabalhados = new Set(lancamentosAprovados.map(l => l.data_lancamento)).size;
        const totalLancamentos = lancamentosAprovados.length;
        // Calcular valores de KPIs e atividades
        const valorKPIs = lancamentosAprovados.reduce((sum, l) => sum + (l.bonus_kpis || 0), 0);
        const valorAtividades = lancamentosAprovados.reduce((sum, l) => sum + (l.subtotal_atividades || 0), 0);
        // 5. Buscar meta do colaborador (assumindo que existe uma tabela de metas)
        // Por enquanto, vamos usar um valor padrão ou calcular baseado nos KPIs
        const metaMensal = 5000; // Valor padrão - pode ser ajustado conforme necessário
        const percentualMeta = metaMensal > 0 ? (valorFinalMes / metaMensal) * 100 : 0;
        // 6. Processar lançamentos para exibição detalhada
        const lancamentosDetalhados = lancamentosAprovados.map(lancamento => {
            let atividadesProcessadas = [];
            let kpisProcessados = [];
            // Processar atividades principais
            if (lancamento.nome_atividade) {
                atividadesProcessadas.push({
                    nome: lancamento.nome_atividade,
                    quantidade: lancamento.quantidade_produzida || 0,
                    tempo: lancamento.tempo_horas || 0,
                    valor: lancamento.subtotal_atividades || 0
                });
            }
            // Processar atividades múltiplas se existirem
            if (lancamento.multiple_activities) {
                try {
                    const atividades = typeof lancamento.multiple_activities === 'string'
                        ? JSON.parse(lancamento.multiple_activities)
                        : lancamento.multiple_activities;
                    if (Array.isArray(atividades)) {
                        atividades.forEach(ativ => {
                            atividadesProcessadas.push({
                                nome: ativ.nome_atividade || 'Atividade',
                                quantidade: ativ.quantidade || 0,
                                tempo: ativ.tempo || 0,
                                valor: ativ.valor || 0
                            });
                        });
                    }
                }
                catch (e) {
                    console.error('Erro ao processar atividades múltiplas:', e);
                }
            }
            // Processar KPIs
            if (lancamento.kpis_atingidos) {
                try {
                    const kpis = typeof lancamento.kpis_atingidos === 'string'
                        ? JSON.parse(lancamento.kpis_atingidos)
                        : lancamento.kpis_atingidos;
                    if (Array.isArray(kpis)) {
                        kpisProcessados = kpis.map(kpi => ({
                            nome: kpi.nome || kpi.nome_kpi || 'KPI',
                            valor: kpi.valor || 0,
                            atingido: kpi.atingido || false
                        }));
                    }
                }
                catch (e) {
                    console.error('Erro ao processar KPIs do lançamento:', e);
                }
            }
            return {
                id: lancamento.id,
                data: lancamento.data_lancamento,
                turno: lancamento.turno,
                atividades: atividadesProcessadas,
                kpis: kpisProcessados,
                valorFinal: lancamento.remuneracao_total || 0,
                valorAtividades: lancamento.subtotal_atividades || 0,
                valorKPIs: lancamento.bonus_kpis || 0,
                observacoes: lancamento.observacoes
            };
        });
        // 7. Montar resposta no formato esperado pelo frontend
        const lancamentosFormatados = lancamentosDetalhados.map(lancamento => {
            const dataFormatada = new Date(lancamento.data).toISOString().split('T')[0];
            const diaSemana = new Date(lancamento.data).toLocaleDateString('pt-BR', { weekday: 'long' });
            return {
                data: dataFormatada,
                diaSemana: diaSemana,
                atividades: lancamento.atividades.map(ativ => ({
                    nome: ativ.nome,
                    quantidade: ativ.quantidade,
                    tempoGasto: ativ.tempo * 60, // converter horas para minutos
                    valorUnitario: ativ.quantidade > 0 ? ativ.valor / ativ.quantidade : 0,
                    valorTotal: ativ.valor,
                    turno: lancamento.turno
                })),
                kpis: lancamento.kpis.map(kpi => ({
                    nome: kpi.nome,
                    valor: kpi.valor,
                    atingido: kpi.atingido,
                    bonus: kpi.valor
                })),
                valorDia: lancamento.valorFinal
            };
        });
        const relatorioData = {
            colaborador: {
                id: colaborador.id,
                nome: colaborador.nome,
                cpf: colaborador.cpf,
                funcao: colaborador.funcao
            },
            periodo: {
                inicio: startDate,
                fim: endDate,
                mesAno: mesAno || `${new Date().getFullYear()}-${(new Date().getMonth() + 1).toString().padStart(2, '0')}`
            },
            resumo: {
                valorTotalKpi: valorKPIs,
                valorTotalAtividade: valorAtividades,
                valorTotalTarefas: 0, // Adicionar lógica para tarefas se necessário
                valorFinalMes,
                percentualMeta: Math.round(percentualMeta * 100) / 100,
                diasTrabalhados,
                totalLancamentos
            },
            lancamentos: lancamentosFormatados
        };
        return c.json({ success: true, data: relatorioData });
    }
    catch (error) {
        console.error('Erro ao gerar relatório individual:', error);
        return c.json({ error: 'Erro interno do servidor' }, 500);
    }
});
export default colaboradoresRoutes;
