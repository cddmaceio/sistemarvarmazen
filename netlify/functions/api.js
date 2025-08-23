const { Handler } = require('@netlify/functions');

const handler = async (event, context) => {
  console.log('Event:', JSON.stringify(event, null, 2));
  
  // Verificar se as variáveis de ambiente do Supabase estão configuradas
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    console.error('Variáveis de ambiente do Supabase não configuradas');
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'Configuração do servidor incompleta' })
    };
  }
  
  const { path, httpMethod, headers, body, queryStringParameters } = event;
  
  // Remove o prefixo /.netlify/functions/api do path
  const cleanPath = path.replace(/^\/\.netlify\/functions\/api/, '') || '/';
  
  console.log('Clean path:', cleanPath);
  console.log('HTTP Method:', httpMethod);
  
  try {
    // Importar dinamicamente o worker
    const { createClient } = require('@supabase/supabase-js');
    
    // Criar cliente Supabase
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
    
    // Handler para health check
    if (cleanPath === '/api/health') {
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
        },
        body: JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() })
      };
    }
    
    // Handler para lancamentos-produtividade
    if (cleanPath === '/api/lancamentos-produtividade') {
      const user_id = queryStringParameters?.user_id;
      
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
        return {
          statusCode: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          body: JSON.stringify({ error: error.message })
        };
      }
      
      if (!lancamentos || lancamentos.length === 0) {
        console.log('Nenhum lançamento aprovado encontrado');
        return {
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
          },
          body: JSON.stringify([])
        };
      }
      
      console.log('Retornando:', lancamentos.length, 'registros');
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
        },
        body: JSON.stringify(lancamentos)
      };
    }

    // Handler para kpis/available
    if (cleanPath === '/api/kpis/available') {
      const funcao = queryStringParameters?.funcao;
      const turno = queryStringParameters?.turno;
      
      if (!funcao || !turno) {
        return {
          statusCode: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          body: JSON.stringify({ error: 'Função e turno são obrigatórios' })
        };
      }
      
      const { data: kpis, error } = await supabase
        .from('kpis')
        .select('*')
        .eq('funcao_kpi', funcao)
        .in('turno_kpi', [turno, 'Geral'])
        .eq('status_ativo', true)
        .order('created_at', { ascending: false })
        .limit(2);
      
      if (error) {
        return {
          statusCode: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          body: JSON.stringify({ error: error.message })
        };
      }
      
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
        },
        body: JSON.stringify(kpis || [])
      };
    }

    // Handler para lancamentos
    if (cleanPath === '/api/lancamentos') {
      const { data: lancamentos, error } = await supabase
        .from('lancamentos_produtividade')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        return {
          statusCode: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          body: JSON.stringify({ error: error.message })
        };
      }
      
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
        },
        body: JSON.stringify(lancamentos || [])
      };
    }
    
    // Handler para /api/kpis/check-limit
    if (cleanPath === '/api/kpis/check-limit' && httpMethod === 'POST') {
      try {
        const requestBody = JSON.parse(body || '{}');
        
        // Validação básica dos parâmetros
        if (!requestBody.user_id || !requestBody.data_lancamento) {
          return {
            statusCode: 400,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Headers': 'Content-Type',
              'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
            },
            body: JSON.stringify({ error: 'user_id e data_lancamento são obrigatórios' })
          };
        }

        const { user_id, data_lancamento } = requestBody;
        
        // Count KPI launches for the user on the specific date
        const { count, error } = await supabase
          .from('lancamentos_produtividade')
          .select('*', { count: 'exact', head: true })
          .eq('usuario_id', user_id)
          .eq('data_lancamento', data_lancamento);
        
        if (error) {
          console.error('Supabase error:', error);
          return {
            statusCode: 500,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Headers': 'Content-Type',
              'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
            },
            body: JSON.stringify({ error: error.message })
          };
        }
        
        const total = count || 0;
        const canLaunch = total < 1;
        const remaining = Math.max(0, 1 - total);
        
        return {
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
          },
          body: JSON.stringify({
            can_launch: canLaunch,
            current_count: total,
            remaining_launches: remaining,
            daily_limit: 1
          })
        };
      } catch (error) {
        console.error('Error in /api/kpis/check-limit:', error);
        return {
          statusCode: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
          },
          body: JSON.stringify({ error: 'Erro interno do servidor' })
        };
      }
    }

    // Handler para /api/calculate
    if (cleanPath === '/api/calculate' && httpMethod === 'POST') {
      try {
        const requestBody = JSON.parse(body || '{}');
        console.log('Calculate request body:', requestBody);
        
        const {
          nome_atividade,
          funcao,
          turno,
          quantidade_produzida,
          tempo_horas,
          input_adicional,
          kpis_atingidos,
          multiple_activities,
          valid_tasks_count
        } = requestBody;
        
        // Validação básica
        if (!funcao || !turno) {
          return {
            statusCode: 400,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Headers': 'Content-Type',
              'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
            },
            body: JSON.stringify({ error: 'Função e turno são obrigatórios' })
          };
        }
        
        let subtotal_atividades = 0;
        let atividades_detalhes = [];
        let produtividade_alcancada;
        let nivel_atingido;
        let unidade_medida;
        let tarefas_validas;
        let valor_tarefas;
        
        // Handle multiple activities for Ajudantes de Armazém
        if (funcao === 'Ajudante de Armazém' && multiple_activities && multiple_activities.length > 0) {
          console.log('Processing multiple activities for Ajudante de Armazém');
          
          for (const activity of multiple_activities) {
            const produtividade = activity.quantidade_produzida / activity.tempo_horas;
            console.log(`Activity: ${activity.nome_atividade}, Produtividade: ${produtividade}`);
            
            // Get activities for this activity name, ordered by produtividade_minima descending
            const { data: activities, error } = await supabase
              .from('activities')
              .select('*')
              .eq('nome_atividade', activity.nome_atividade)
              .order('produtividade_minima', { ascending: false });
            
            if (error) {
              return {
                statusCode: 500,
                headers: {
                  'Content-Type': 'application/json',
                  'Access-Control-Allow-Origin': '*',
                  'Access-Control-Allow-Headers': 'Content-Type',
                  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
                },
                body: JSON.stringify({ error: error.message })
              };
            }
            
            if (activities && activities.length > 0) {
              // Find the appropriate level based on productivity
              let selectedActivity = null;
              for (const act of activities) {
                if (produtividade >= act.produtividade_minima) {
                  selectedActivity = act;
                  break;
                }
              }
              
              // If no level achieved, use the lowest level
              if (!selectedActivity) {
                selectedActivity = activities[activities.length - 1];
              }
              
              // Calculate value for this activity (applying 50% rule: atividades/2)
              const valor_bruto = activity.quantidade_produzida * selectedActivity.valor_atividade;
              const valor_final = valor_bruto / 2;
              subtotal_atividades += valor_final;
              
              atividades_detalhes.push({
                nome: activity.nome_atividade,
                produtividade: produtividade,
                nivel: selectedActivity.nivel_atividade,
                valor_total: valor_final,
                unidade: selectedActivity.unidade_medida || 'unidades'
              });
            }
          }
        }
        // Handle valid tasks for Operador de Empilhadeira
        else if (funcao === 'Operador de Empilhadeira' && valid_tasks_count !== undefined) {
          tarefas_validas = valid_tasks_count;
          valor_tarefas = valid_tasks_count * 0.093; // R$ 0,093 per valid task
          subtotal_atividades = valor_tarefas / 2; // Apply 50% rule
        }
        // Handle single activity for other functions
        else if (nome_atividade && quantidade_produzida && tempo_horas) {
          // Calculate productivity (quantity per hour)
          produtividade_alcancada = quantidade_produzida / tempo_horas;
          
          // Get activities for this activity name, ordered by produtividade_minima descending
          const { data: activities, error } = await supabase
            .from('activities')
            .select('*')
            .eq('nome_atividade', nome_atividade)
            .order('produtividade_minima', { ascending: false });
          
          if (error) {
            return {
              statusCode: 500,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
              },
              body: JSON.stringify({ error: error.message })
            };
          }
          
          if (!activities || activities.length === 0) {
            return {
              statusCode: 404,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
              },
              body: JSON.stringify({ error: 'Atividade não encontrada' })
            };
          }
          
          // Find the appropriate level based on productivity
          let selectedActivity = null;
          for (const activity of activities) {
            if (produtividade_alcancada >= activity.produtividade_minima) {
              selectedActivity = activity;
              break;
            }
          }
          
          // If no level achieved, use the lowest level
          if (!selectedActivity) {
            selectedActivity = activities[activities.length - 1];
          }
          
          // Calculate subtotal from activities (applying 50% rule: atividades/2)
          const valor_bruto_atividades = quantidade_produzida * selectedActivity.valor_atividade;
          subtotal_atividades = valor_bruto_atividades / 2;
          
          nivel_atingido = selectedActivity.nivel_atividade;
          unidade_medida = selectedActivity.unidade_medida;
        }
        
        // Get applicable KPIs and calculate bonus
        let bonus_kpis = 0;
        const kpis_atingidos_resultado = [];
        
        if (kpis_atingidos && kpis_atingidos.length > 0) {
          const { data: kpis, error } = await supabase
            .from('kpis')
            .select('*')
            .eq('funcao_kpi', funcao)
            .in('turno_kpi', [turno, 'Geral'])
            .in('nome_kpi', kpis_atingidos);
          
          if (error) {
            return {
              statusCode: 500,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
              },
              body: JSON.stringify({ error: error.message })
            };
          }
          
          for (const kpi of kpis || []) {
            bonus_kpis += kpi.peso_kpi;
            kpis_atingidos_resultado.push(kpi.nome_kpi);
          }
        }
        
        // Final calculation: atividades/2 + kpi1 + kpi2 + extras
        const atividades_extras = input_adicional || 0;
        const remuneracao_total = subtotal_atividades + bonus_kpis + atividades_extras;
        
        const result = {
          subtotal_atividades,
          bonus_kpis,
          remuneracao_total,
          kpis_atingidos: kpis_atingidos_resultado,
        };
        
        // Add optional fields only if they exist
        if (produtividade_alcancada !== undefined) result.produtividade_alcancada = produtividade_alcancada;
        if (nivel_atingido !== undefined) result.nivel_atingido = nivel_atingido;
        if (unidade_medida !== undefined) result.unidade_medida = unidade_medida;
        if (atividades_detalhes.length > 0) result.atividades_detalhes = atividades_detalhes;
        if (tarefas_validas !== undefined) result.tarefas_validas = tarefas_validas;
        if (valor_tarefas !== undefined) result.valor_tarefas = valor_tarefas;
        
        return {
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
          },
          body: JSON.stringify(result)
        };
        
      } catch (error) {
        console.error('Error in calculate endpoint:', error);
        return {
          statusCode: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
          },
          body: JSON.stringify({ error: 'Erro interno do servidor', message: error.message })
        };
      }
    }

    // POST /api/lancamentos - Criar novo lançamento
    if (cleanPath === '/api/lancamentos' && event.httpMethod === 'POST') {
      try {
        const body = JSON.parse(event.body || '{}');
        console.log('Raw body received:', JSON.stringify(body, null, 2));
        
        // Validação básica dos campos obrigatórios
        if (!body.data_lancamento || !body.user_id || !body.calculator_data || !body.calculator_result) {
          return {
            statusCode: 400,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Headers': 'Content-Type',
              'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
            },
            body: JSON.stringify({ error: 'Campos obrigatórios: data_lancamento, user_id, calculator_data, calculator_result' })
          };
        }
        
        // Buscar dados do usuário
        const { data: userData, error: userError } = await supabase
          .from('usuarios')
          .select('id, nome, cpf')
          .eq('id', body.user_id)
          .single();
        
        if (userError) {
          console.error('User fetch error:', userError);
          return {
            statusCode: 404,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Headers': 'Content-Type',
              'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
            },
            body: JSON.stringify({ error: 'Usuário não encontrado' })
          };
        }
        
        // Mapear dados do frontend para colunas do banco
        const dbData = {
          data_lancamento: body.data_lancamento,
          turno: body.calculator_data.turno,
          quantidade: body.calculator_data.quantidade_produzida || 0,
          usuario_id: body.user_id,
          user_id: body.user_id,
          user_nome: userData.nome,
          user_cpf: userData.cpf,
          funcao: body.calculator_data.funcao,
          nome_atividade: body.calculator_data.nome_atividade,
          quantidade_produzida: body.calculator_data.quantidade_produzida || 0,
          tempo_horas: body.calculator_data.tempo_horas || 0,
          input_adicional: body.calculator_data.input_adicional || 0,
          multiple_activities: body.calculator_data.multiple_activities ? JSON.stringify(body.calculator_data.multiple_activities) : null,
          nome_operador: body.calculator_data.nome_operador || null,
          valid_tasks_count: body.calculator_data.valid_tasks_count || null,
          kpis_atingidos: body.calculator_data.kpis_atingidos ? JSON.stringify(body.calculator_data.kpis_atingidos) : null,
          subtotal_atividades: body.calculator_result.subtotal_atividades || 0,
          bonus_kpis: body.calculator_result.bonus_kpis || 0,
          remuneracao_total: body.calculator_result.remuneracao_total || 0,
          produtividade_alcancada: body.calculator_result.produtividade_alcancada || null,
          nivel_atingido: body.calculator_result.nivel_atingido || null,
          unidade_medida: body.calculator_result.unidade_medida || null,
          atividades_detalhes: body.calculator_result.atividades_detalhes ? JSON.stringify(body.calculator_result.atividades_detalhes) : null,
          tarefas_validas: body.calculator_result.tarefas_validas || null,
          valor_tarefas: body.calculator_result.valor_tarefas || null,
          observacoes: `Atividade: ${body.calculator_data.nome_atividade || 'N/A'}, Função: ${body.calculator_data.funcao}, Tempo: ${body.calculator_data.tempo_horas}h, Remuneração: R$ ${body.calculator_result.remuneracao_total}`,
          status: 'pendente'
        };
        
        console.log('Mapped database data:', JSON.stringify(dbData, null, 2));
        
        const { data: lancamento, error } = await supabase
          .from('lancamentos_produtividade')
          .insert(dbData)
          .select()
          .single();
        
        if (error) {
          console.error('Supabase error:', error);
          return {
            statusCode: 500,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Headers': 'Content-Type',
              'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
            },
            body: JSON.stringify({ error: error.message })
          };
        }
        
        return {
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
          },
          body: JSON.stringify(lancamento)
        };
        
      } catch (error) {
        console.error('Lançamento creation error:', error);
        return {
          statusCode: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
          },
          body: JSON.stringify({ error: 'Erro interno do servidor', details: error.message })
        };
      }
    }

    // Rota não encontrada
    return {
      statusCode: 404,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'Rota não encontrada', path: cleanPath })
    };
    
  } catch (error) {
    console.error('Erro no handler:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'Erro interno do servidor', details: error.message })
    };
  }
};

module.exports = { handler };
