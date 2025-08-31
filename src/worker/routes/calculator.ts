import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { CalculatorInputSchema } from '../../shared/types';
import { getSupabase, Env } from '../utils';

const calculatorRoutes = new Hono<{ Bindings: Env }>();

// Helper function to normalize strings (remove accents)
const normalizeString = (str: string): string => {
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
    let produtividade_alcancada: number | undefined;
    let nivel_atingido: string | undefined;
    let unidade_medida: string | undefined;
    let atividades_detalhes: string[] = [];
    let tarefas_validas: number | undefined;
    let valor_tarefas: number | undefined;
    const kpis_atingidos_resultado: string[] = [];

    // Handle multiple activities for Ajudante de Armazém
    let valor_bruto_atividades = 0;
    if (dbFuncao === 'Ajudante de Armazém' && input.multiple_activities && input.multiple_activities.length > 0) {
      const activities = input.multiple_activities;
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
            
            // Apply 50% rule: subtotal = valor_bruto / 2
            const valor_final = valor_bruto_atividade / 2;
            subtotal_atividades += valor_final;
            
            atividades_detalhes.push(
              `${selectedActivity.nome_atividade}: ${act.quantidade_produzida} ${selectedActivity.unidade_medida} em ${act.tempo_horas}h (${selectedActivity.nivel_atividade})`
            );
          }
        }
      }
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
        subtotal_atividades = parseFloat(selectedActivity.valor_atividade);
        atividades_detalhes.push(`${selectedActivity.nome_atividade}: ${input.quantidade_produzida} ${selectedActivity.unidade_medida} em ${input.tempo_horas}h (${selectedActivity.nivel_atividade})`);
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
        subtotal_atividades += valor_tarefas; // Fix: changed from = to +=
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
          bonus_kpis += parseFloat(kpi.peso_kpi);
          kpis_atingidos_resultado.push(kpi.nome_kpi);
        }
      }
    }
    
    // Final calculation
    const atividades_extras = input.input_adicional || 0;
    const remuneracao_total = subtotal_atividades + bonus_kpis + atividades_extras;
    
    const result: any = {
      subtotalAtividades: subtotal_atividades,
      bonusKpis: bonus_kpis,
      remuneracaoTotal: remuneracao_total,
      kpisAtingidos: kpis_atingidos_resultado,
    };

    // Add optional fields only if they exist
    if (produtividade_alcancada !== undefined) result.produtividadeAlcancada = produtividade_alcancada;
    if (nivel_atingido !== undefined) result.nivelAtingido = nivel_atingido;
    if (unidade_medida !== undefined) result.unidadeMedida = unidade_medida;
    if (atividades_detalhes.length > 0) result.atividadesDetalhes = atividades_detalhes;
    if (tarefas_validas !== undefined) result.tarefasValidas = tarefas_validas;
    if (valor_tarefas !== undefined) result.valorTarefas = valor_tarefas;
    if (valor_bruto_atividades > 0) result.valorBrutoAtividades = valor_bruto_atividades;
    
    return c.json({ data: result, error: null });
  } catch (error) {
    console.error('Calculator error:', error);
    return c.json({ error: 'Erro no cálculo' }, 500);
  }
});

export default calculatorRoutes;