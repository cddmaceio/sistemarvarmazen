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
        // Map input to database values - fix encoding issues
        const dbFuncao = input.funcao.includes('Armaz') ? 'Ajudante de Armazém' : input.funcao;
        const dbTurno = input.turno; // Use turno as is since schema now only accepts correct values
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
        // Handle multiple activities for Ajudante de Armazém
        let valor_bruto_atividades = 0;
        if (dbFuncao === 'Ajudante de Armazém' && input.multiple_activities && input.multiple_activities.length > 0) {
            const activities = input.multiple_activities;
            let total_quantidade = 0;
            let total_tempo = 0;
            let unidades_medida_set = new Set();
            let niveis_atingidos = [];
            for (const act of activities) {
                if (act.nome_atividade && act.quantidade_produzida && act.tempo_horas) {
                    const { data: activityLevels, error: activityError } = await supabase
                        .from('activities')
                        .select('*')
                        .eq('nome_atividade', act.nome_atividade)
                        .order('produtividade_minima', { ascending: false });
                    if (activityError) {
                        console.error('Error fetching activity:', act.nome_atividade, activityError);
                        continue; // Skip to next activity if an error occurs
                    }
                    if (activityLevels && activityLevels.length > 0) {
                        const prod = act.quantidade_produzida / act.tempo_horas;
                        // Find the highest level achieved based on productivity
                        let selectedActivity = activityLevels[activityLevels.length - 1]; // Default to lowest level
                        for (const activityLevel of activityLevels) {
                            if (prod >= parseFloat(activityLevel.produtividade_minima)) {
                                selectedActivity = activityLevel;
                                break;
                            }
                        }
                        // Calculate valor_bruto for this activity
                        const valor_bruto_atividade = act.quantidade_produzida * parseFloat(selectedActivity.valor_atividade);
                        valor_bruto_atividades += valor_bruto_atividade;
                        // Apply correct formula: quantidade_produzida * valor_atividade / 2
                        const valor_final = valor_bruto_atividade / 2;
                        subtotal_atividades += valor_final;
                        // Accumulate data for overall metrics
                        total_quantidade += act.quantidade_produzida;
                        total_tempo += act.tempo_horas;
                        unidades_medida_set.add(selectedActivity.unidade_medida);
                        niveis_atingidos.push(selectedActivity.nivel_atividade);
                        atividades_detalhes.push(`${selectedActivity.nome_atividade}: ${act.quantidade_produzida} ${selectedActivity.unidade_medida} em ${act.tempo_horas}h (${selectedActivity.nivel_atividade})`);
                    }
                }
            }
            // Set overall metrics for multiple activities
            if (total_tempo > 0) {
                produtividade_alcancada = total_quantidade / total_tempo;
            }
            // Set unidade_medida (use the first one if multiple, or combine them)
            const unidades_array = Array.from(unidades_medida_set);
            unidade_medida = unidades_array.length === 1 ? unidades_array[0] : unidades_array.join(', ');
            // Set nivel_atingido (combine all levels achieved)
            nivel_atingido = niveis_atingidos.length > 0 ? niveis_atingidos.join(', ') : undefined;
        }
        // Calculate single activity if multiple are not present
        else if (input.nome_atividade && input.quantidade_produzida && input.tempo_horas) {
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
                    if (produtividade_alcancada >= parseFloat(activity.produtividade_minima)) {
                        selectedActivity = activity;
                        break;
                    }
                }
                nivel_atingido = selectedActivity.nivel_atividade;
                // Apply correct formula: quantidade_produzida * valor_atividade / 2
                const valor_bruto_atividade = input.quantidade_produzida * parseFloat(selectedActivity.valor_atividade);
                subtotal_atividades = valor_bruto_atividade / 2;
                atividades_detalhes.push(`${selectedActivity.nome_atividade}: ${input.quantidade_produzida} ${selectedActivity.unidade_medida} em ${input.tempo_horas}h (${selectedActivity.nivel_atividade})`);
            }
        }
        // Handle valid tasks count for Operador de Empilhadeira (from uploaded file)
        if (input.funcao === 'Operador de Empilhadeira' && input.valid_tasks_count !== undefined && input.valid_tasks_count > 0) {
            tarefas_validas = input.valid_tasks_count;
            valor_tarefas = (tarefas_validas * 0.093) / 2; // Nova fórmula: R$ 0,093 por tarefa / 2
            subtotal_atividades += valor_tarefas;
            atividades_detalhes.push(`Tarefas Válidas: ${tarefas_validas} tarefas processadas`);
        }
        // Handle WMS tasks for Operador de Empilhadeira (from database)
        else if (input.funcao === 'Operador de Empilhadeira' && input.nome_operador && input.data_lancamento) {
            const { data: tarefas, error: tarefasError } = await supabase
                .from('tarefas_wms')
                .select('*')
                .eq('usuario', input.nome_operador)
                .eq('data_alteracao', input.data_lancamento)
                .eq('status', 'Concluído');
            if (!tarefasError && tarefas) {
                tarefas_validas = tarefas.length;
                valor_tarefas = (tarefas_validas * 0.093) / 2; // Nova fórmula: R$ 0,093 por tarefa / 2
                subtotal_atividades += valor_tarefas;
                atividades_detalhes.push(`Tarefas WMS: ${tarefas_validas} tarefas concluídas`);
            }
        }
        // Calculate KPIs bonus: R$ 3,00 per selected KPI (maximum 2)
        if (input.kpis_atingidos && input.kpis_atingidos.length > 0) {
            // Limit to maximum 2 KPIs
            const kpisLimitados = input.kpis_atingidos.slice(0, 2);
            for (const kpiNome of kpisLimitados) {
                // Each selected KPI is worth R$ 3,00
                bonus_kpis += 3.00;
                kpis_atingidos_resultado.push(kpiNome);
            }
        }
        // Final calculation: KPIs + atividades (já calculadas com 50%) + extras
        const atividades_extras = input.input_adicional || 0;
        const remuneracao_total = bonus_kpis + subtotal_atividades + atividades_extras;
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
export default calculatorRoutes;
