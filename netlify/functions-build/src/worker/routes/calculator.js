import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { CalculatorInputSchema } from '../../shared/types';
import { getSupabase } from '../utils';
const calculatorRoutes = new Hono();
// Helper function to normalize strings (remove accents)
const normalizeString = (str) => {
    return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/ç/g, 'c')
        .replace(/Ç/g, 'C');
};
// POST /api/calculate
calculatorRoutes.post('/calculate', zValidator('json', CalculatorInputSchema), async (c) => {
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
        // Map input to database values
        const dbFuncao = input.funcao === 'Ajudante de Armazém' ? 'Ajudante de ArmazÃ©m' : input.funcao;
        const dbTurno = input.turno === 'Manha' ? 'ManhÃ£' : input.turno;
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
        const kpis_atingidos_resultado = [];
        // Calculate activities
        if (input.nome_atividade && input.quantidade_produzida && input.tempo_horas) {
            const { data: activity, error: activityError } = await supabase
                .from('activities')
                .select('*')
                .eq('nome_atividade', input.nome_atividade)
                .single();
            if (activityError) {
                console.error('Activity error:', activityError);
                return c.json({ error: 'Atividade não encontrada' }, 400);
            }
            if (activity) {
                produtividade_alcancada = input.quantidade_produzida / input.tempo_horas;
                unidade_medida = activity.unidade_medida;
                if (produtividade_alcancada >= activity.produtividade_minima) {
                    nivel_atingido = activity.nivel_atividade;
                    subtotal_atividades = activity.valor_atividade;
                    atividades_detalhes.push(`${activity.nome_atividade}: ${input.quantidade_produzida} ${activity.unidade_medida} em ${input.tempo_horas}h`);
                }
            }
        }
        // Handle multiple activities
        if (input.multiple_activities) {
            try {
                const activities = input.multiple_activities;
                for (const act of activities) {
                    if (act.nome_atividade && act.quantidade_produzida && act.tempo_horas) {
                        const { data: activity, error: activityError } = await supabase
                            .from('activities')
                            .select('*')
                            .eq('nome_atividade', act.nome_atividade)
                            .single();
                        if (!activityError && activity) {
                            const prod = act.quantidade_produzida / act.tempo_horas;
                            if (prod >= activity.produtividade_minima) {
                                subtotal_atividades += activity.valor_atividade;
                                atividades_detalhes.push(`${activity.nome_atividade}: ${act.quantidade_produzida} ${activity.unidade_medida} em ${act.tempo_horas}h`);
                            }
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
            const { data: kpis } = await supabase
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
            subtotal_atividades,
            bonus_kpis,
            remuneracao_total,
            kpis_atingidos: kpis_atingidos_resultado,
        };
        // Add optional fields only if they exist
        if (produtividade_alcancada !== undefined)
            result.produtividade_alcancada = produtividade_alcancada;
        if (nivel_atingido !== undefined)
            result.nivel_atingido = nivel_atingido;
        if (unidade_medida !== undefined)
            result.unidade_medida = unidade_medida;
        if (atividades_detalhes.length > 0)
            result.atividades_detalhes = atividades_detalhes;
        if (tarefas_validas !== undefined)
            result.tarefas_validas = tarefas_validas;
        if (valor_tarefas !== undefined)
            result.valor_tarefas = valor_tarefas;
        return c.json({ data: result, error: null });
    }
    catch (error) {
        console.error('Calculator error:', error);
        return c.json({ error: 'Erro no cálculo' }, 500);
    }
});
export default calculatorRoutes;
