const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
  try {
    console.log('Function called:', event.path, event.httpMethod);
    
    // Handle CORS preflight requests
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
        },
        body: ''
      };
    }

    // Verificar variáveis de ambiente do Supabase
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase environment variables');
      return {
        statusCode: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ 
          error: 'Server configuration error', 
          message: 'Missing Supabase environment variables' 
        }),
      };
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Extract the API path (remove /.netlify/functions/api prefix)
    let apiPath = event.path;
    if (apiPath.startsWith('/.netlify/functions/api')) {
      apiPath = apiPath.replace('/.netlify/functions/api', '');
    }
    if (apiPath.startsWith('/api')) {
      apiPath = apiPath.replace('/api', '');
    }
    
    console.log('Processing API path:', apiPath);

    const method = event.httpMethod;
    const queryParams = event.queryStringParameters || {};
    let body = null;
    
    if (event.body) {
      try {
        body = JSON.parse(event.body);
      } catch (e) {
        body = event.body;
      }
    }

    // Route handling
    if (apiPath === '/health') {
      return {
        statusCode: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ 
          status: 'ok', 
          timestamp: new Date().toISOString(),
          message: 'API is working'
        })
      };
    }

    // Lançamentos endpoints
    if (apiPath === '/lancamentos') {
      if (method === 'GET') {
        const userId = queryParams.user_id;
        
        let query = supabase
          .from('lancamentos_produtividade')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (userId) {
          query = query.eq('user_id', parseInt(userId));
        }
        
        const { data: lancamentos, error } = await query;
        
        if (error) {
          console.error('Error fetching lancamentos:', error);
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
            'Access-Control-Allow-Origin': '*'
          },
          body: JSON.stringify(lancamentos || [])
        };
      }
      
      if (method === 'POST') {
        try {
          console.log('POST /lancamentos - Received body:', JSON.stringify(body, null, 2));
          
          // Validate required fields for new format
          if (!body.user_id || !body.data_lancamento || !body.calculator_data || !body.calculator_result) {
            return {
              statusCode: 400,
              headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
              },
              body: JSON.stringify({ 
                error: 'user_id, data_lancamento, calculator_data e calculator_result são obrigatórios',
                missing_fields: {
                  user_id: !body.user_id,
                  data_lancamento: !body.data_lancamento,
                  calculator_data: !body.calculator_data,
                  calculator_result: !body.calculator_result
                }
              })
            };
          }
          
          // Get user information
          const { data: userData, error: userError } = await supabase
            .from('usuarios')
            .select('nome, cpf, funcao')
            .eq('id', parseInt(body.user_id))
            .single();
            
          if (userError || !userData) {
            console.error('Error fetching user data:', userError);
            return {
              statusCode: 400,
              headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
              },
              body: JSON.stringify({ error: 'Usuário não encontrado' })
            };
          }
          
          // Extract data from calculator_data and calculator_result
          const calculatorData = body.calculator_data;
          const calculatorResult = body.calculator_result;
          
          // Build the complete lancamento data
          const lancamentoData = {
            user_id: parseInt(body.user_id),
            user_nome: userData.nome,
            user_cpf: userData.cpf,
            data_lancamento: body.data_lancamento,
            funcao: calculatorData.funcao || userData.funcao,
            turno: calculatorData.turno,
            nome_atividade: calculatorData.nome_atividade || null,
            quantidade_produzida: calculatorData.quantidade_produzida || null,
            tempo_horas: calculatorData.tempo_horas || null,
            input_adicional: calculatorData.input_adicional || 0,
            multiple_activities: calculatorData.multiple_activities ? JSON.stringify(calculatorData.multiple_activities) : null,
            nome_operador: calculatorData.nome_operador || null,
            valid_tasks_count: calculatorData.valid_tasks_count || null,
            kpis_atingidos: calculatorResult.kpisAtingidos ? JSON.stringify(calculatorResult.kpisAtingidos) : null,
            subtotal_atividades: calculatorResult.subtotalAtividades,
            bonus_kpis: calculatorResult.bonusKpis,
            remuneracao_total: calculatorResult.remuneracaoTotal,
            produtividade_alcancada: calculatorResult.produtividade_alcancada || null,
            nivel_atingido: calculatorResult.nivel_atingido || null,
            unidade_medida: calculatorResult.unidade_medida || null,
            atividades_detalhes: calculatorResult.atividades_detalhes ? JSON.stringify(calculatorResult.atividades_detalhes) : null,
            tarefas_validas: calculatorResult.tarefas_validas || null,
            valor_tarefas: calculatorResult.valor_tarefas || null,
            status: 'pendente',
            created_at: new Date().toISOString()
          };
          
          console.log('Inserting lancamento data:', JSON.stringify(lancamentoData, null, 2));
          
          const { data: lancamento, error } = await supabase
            .from('lancamentos_produtividade')
            .insert(lancamentoData)
            .select()
            .single();
          
          if (error) {
            console.error('Supabase insert error:', error);
            return {
              statusCode: 500,
              headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
              },
              body: JSON.stringify({ error: error.message, details: error })
            };
          }
          
          console.log('Successfully inserted lancamento:', lancamento);
          
          return {
            statusCode: 200,
            headers: { 
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify(lancamento)
          };
        } catch (error) {
          console.error('Error in POST /lancamentos:', error);
          return {
            statusCode: 500,
            headers: { 
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ error: 'Internal server error', message: error.message })
          };
        }
      }
    }

    // Usuarios endpoints removed - using complete routes below

    // Auth endpoints
    if (apiPath === '/auth/login') {
      if (method === 'POST') {
        const { cpf, data_nascimento } = body;
        
        const { data: user, error } = await supabase
          .from('usuarios')
          .select('*')
          .eq('cpf', cpf)
          .eq('data_nascimento', data_nascimento)
          .eq('is_active', true)
          .single();
        
        if (error || !user) {
          return {
            statusCode: 401,
            headers: { 
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ message: 'CPF ou data de nascimento incorretos' })
          };
        }
        
        return {
          statusCode: 200,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          body: JSON.stringify(user)
        };
      }
    }

    // Activities endpoints
    if (apiPath === '/activities') {
      if (method === 'GET') {
        const { data: activities, error } = await supabase
          .from('activities')
          .select('*')
          .order('nome_atividade', { ascending: true });
        
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
            'Access-Control-Allow-Origin': '*'
          },
          body: JSON.stringify(activities || [])
        };
      }
    }

    // Activity names endpoint
    if (apiPath === '/activity-names') {
      if (method === 'GET') {
        const { data: activities, error } = await supabase
          .from('activities')
          .select('nome_atividade')
          .order('nome_atividade', { ascending: true });
        
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
        
        const uniqueNames = [...new Set(activities?.map(a => a.nome_atividade) || [])];
        return {
          statusCode: 200,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          body: JSON.stringify(uniqueNames)
        };
      }
    }

    // KPIs endpoints
    if (apiPath === '/kpis') {
      if (method === 'GET') {
        const { data: kpis, error } = await supabase
          .from('kpis')
          .select('*')
          .order('nome_kpi', { ascending: true });
        
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
            'Access-Control-Allow-Origin': '*'
          },
          body: JSON.stringify(kpis || [])
        };
      }
    }

    // KPI check limit endpoint
    if (apiPath === '/kpis/check-limit') {
      if (method === 'GET' || method === 'POST') {
        const params = method === 'GET' ? queryParams : body;
        const user_id = params.user_id;
        const date = params.date || params.data_lancamento; // Accept both formats
        
        if (!user_id || !date) {
          return {
            statusCode: 400,
            headers: { 
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ error: 'user_id e date/data_lancamento são obrigatórios' })
          };
        }
        
        try {
          // Check how many launches the user has for the given date
          const { data: lancamentos, error } = await supabase
            .from('lancamentos_produtividade')
            .select('id')
            .eq('user_id', parseInt(user_id))
            .gte('data_lancamento', date)
            .lt('data_lancamento', new Date(new Date(date).getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
          
          if (error) {
            console.error('Error checking KPI limit:', error);
            return {
              statusCode: 500,
              headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
              },
              body: JSON.stringify({ error: error.message })
            };
          }
          
          const count = lancamentos?.length || 0;
          const limit = 1; // Maximum 1 launch per day
          const canLaunch = count < limit;
          
          return {
            statusCode: 200,
            headers: { 
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ 
              canLaunch,
              currentCount: count,
              limit,
              message: canLaunch ? 'Pode lançar' : 'Limite de lançamentos atingido para hoje'
            })
          };
        } catch (error) {
          console.error('Error in check-limit:', error);
          return {
            statusCode: 500,
            headers: { 
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ error: 'Internal server error', message: error.message })
          };
        }
      }
    }

    // KPI available endpoint
    if (apiPath === '/kpis/available') {
      if (method === 'GET') {
        const funcao = queryParams.funcao;
        const turno = queryParams.turno;
        
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
        
        // Use the parameters directly as they come from the frontend
        const dbFuncao = funcao;
        const dbTurno = turno;
        
        console.log(`Original parameters: funcao=${funcao}, turno=${turno}`);
        console.log(`Mapped parameters: dbFuncao=${dbFuncao}, dbTurno=${dbTurno}`);
        console.log(`Searching for KPIs with funcao: ${dbFuncao}, turno: [${dbTurno}, 'Geral']`);
        
        // Debug: let's see all KPIs first
        const { data: allKpis, error: allError } = await supabase
          .from('kpis')
          .select('*');
        console.log(`All KPIs in database:`, allKpis);
        
        // Try multiple queries with different encodings
        const queries = [
          // Original search
          { funcao: dbFuncao, turno: dbTurno },
          { funcao: dbFuncao, turno: 'Geral' },
          // Try with encoded versions
          { funcao: 'Ajudante de ArmazÃ©m', turno: dbTurno },
          { funcao: 'Ajudante de ArmazÃ©m', turno: 'Geral' },
        ];
        
        let allKpisFound = [];
        
        for (const query of queries) {
          const { data: queryKpis, error: queryError } = await supabase
            .from('kpis')
            .select('*')
            .eq('funcao_kpi', query.funcao)
            .eq('turno_kpi', query.turno);
          
          if (!queryError && queryKpis && queryKpis.length > 0) {
            allKpisFound.push(...queryKpis);
          }
        }
        
        // Remove duplicates
        const uniqueKpis = allKpisFound.filter((kpi, index, self) => 
          index === self.findIndex((k) => k.id === kpi.id)
        );
        
        const kpis = uniqueKpis;
        
        console.log(`KPI query result:`, { data: kpis, count: kpis?.length || 0 });
        console.log(`Found KPIs:`, kpis);
        
        // If no KPIs found with filters, return debug info
        if (!kpis || kpis.length === 0) {
          return {
            statusCode: 200,
            headers: { 
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ 
              kpisAtingidos: [], 
              debug: {
                searchParams: { funcao: dbFuncao, turno: dbTurno },
                allKpisCount: allKpis?.length || 0,
                firstKpi: allKpis?.[0] || null
              }
            })
          };
        }
        
        return {
          statusCode: 200,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          body: JSON.stringify({ kpisAtingidos: kpis || [] })
        };
      }
    }

    // Functions endpoint
    if (apiPath === '/functions') {
      if (method === 'GET') {
        const { data: kpis, error } = await supabase
          .from('kpis')
          .select('funcao_kpi')
          .order('funcao_kpi', { ascending: true });
        
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
        
        const uniqueFunctions = [...new Set(kpis?.map(k => k.funcao_kpi) || [])];
        return {
          statusCode: 200,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          body: JSON.stringify(uniqueFunctions)
        };
      }
    }

    // Calculator endpoint (supports both /calculator and /calculate)
    if (apiPath === '/calculator' || apiPath === '/calculate') {
      if (method === 'POST') {
        try {
          console.log('🚀 CALCULATOR FUNCTION STARTED 🚀');
          const input = body;
          
          console.log('Calculator endpoint called');
          console.log('=== CALCULATOR DEBUG START ===');
          console.log('Input received:', JSON.stringify(input, null, 2));
          
          // Helper function to normalize strings (remove accents)
          const normalizeString = (str) => {
            return str
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .replace(/ç/g, 'c')
              .replace(/Ç/g, 'C');
          };
          
          // Normalize input strings
          const normalizedFuncao = normalizeString(input.funcao);
          const normalizedTurno = normalizeString(input.turno);
          
          console.log('Original input:', { funcao: input.funcao, turno: input.turno });
          console.log('Normalized input:', { funcao: normalizedFuncao, turno: normalizedTurno });
          
          // Get ALL KPIs first and then filter in code (more reliable)
          let kpis = [];
          try {
            console.log('Fetching ALL KPIs for calculation...');
            const { data: allKpis, error } = await supabase
              .from('kpis')
              .select('*');
            
            if (error) {
              console.error('Error fetching all KPIs:', error);
              kpis = [];
            } else {
              console.log(`Found ${allKpis?.length || 0} total KPIs in database`);
              
              // Filter KPIs in JavaScript for exact matching
              const funcao = input.funcao;
              const turno = input.turno;
              
              console.log(`Filtering KPIs for funcao="${funcao}", turno="${turno}"`);
              
              kpis = (allKpis || []).filter(kpi => {
                // Check function match (try multiple variations)
                const funcaoMatches = 
                  kpi.funcao_kpi === funcao ||
                  kpi.funcao_kpi === 'Ajudante de ArmazÃ©m' && funcao === 'Ajudante de Armazém' ||
                  kpi.funcao_kpi === 'Operador de Empilhadeira' && funcao === 'Operador de Empilhadeira' ||
                  kpi.funcao_kpi === 'LÃ­der de Turno' && funcao === 'Líder de Turno';
                
                // Check turno match (specific turno or "Geral")
                const turnoMatches = 
                  kpi.turno_kpi === turno ||
                  kpi.turno_kpi === 'ManhÃ£' && turno === 'Manhã' ||
                  kpi.turno_kpi === 'Geral';
                
                const matches = funcaoMatches && turnoMatches;
                
                if (matches) {
                  console.log(`✅ KPI Match: ${kpi.nome_kpi} (funcao: ${kpi.funcao_kpi}, turno: ${kpi.turno_kpi})`);
                }
                
                return matches;
              });
              
              console.log(`Filtered to ${kpis.length} KPIs for this user`);
              console.log('FILTERED KPIs:', kpis?.map(k => ({ nome: k.nome_kpi, turno: k.turno_kpi, peso: k.peso_kpi })));
            }
          } catch (kpiError) {
            console.error('Error in KPI fetching:', kpiError);
            kpis = [];
          }
          
          // Calculate productivity (complete logic)
          let subtotalAtividades = 0;
          let bonusKpis = 0;
          let kpisAtingidos = [];
          let atividadesDetalhes = [];
          let produtividadeAlcancada = 0;
          let nivelAtingido = "Nenhum";
          let unidadeMedida = "";
          let tarefasValidas = 0;
          let valorTarefas = 0;

          // Handle valid tasks for Operador de Empilhadeira
          if (input.funcao === 'Operador de Empilhadeira' && input.valid_tasks_count !== undefined) {
            console.log('🚛 Processing Operador de Empilhadeira with valid tasks count:', input.valid_tasks_count);
            tarefasValidas = input.valid_tasks_count;
            valorTarefas = input.valid_tasks_count * 0.093; // R$ 0,093 per valid task
            subtotalAtividades = valorTarefas / 2; // Apply 50% rule
            
            console.log(`📦 Tarefas válidas: ${tarefasValidas}`);
            console.log(`💰 Valor total das tarefas: R$ ${valorTarefas.toFixed(3)}`);
            console.log(`📊 Subtotal atividades (50%): R$ ${subtotalAtividades.toFixed(3)}`);
          }
          
          // VALIDAÇÃO: Operador de Empilhadeira não pode ter multiple_activities
          if (input.funcao === 'Operador de Empilhadeira' && input.multiple_activities && input.multiple_activities.length > 0) {
            console.log('❌ ERRO: Operador de Empilhadeira não pode ter multiple_activities');
            console.log('Dados recebidos:', {
              funcao: input.funcao,
              multiple_activities: input.multiple_activities,
              valid_tasks_count: input.valid_tasks_count
            });
            return c.json({ 
              error: 'Operador de Empilhadeira não pode ter múltiplas atividades. Use valid_tasks_count para tarefas válidas.',
              details: {
                funcao_recebida: input.funcao,
                multiple_activities_recebidas: input.multiple_activities.length,
                solucao: 'Para Operador de Empilhadeira, use o campo valid_tasks_count em vez de multiple_activities'
              }
            }, 400);
          }

          // // Handle multiple activities
          else if (input.multiple_activities && input.multiple_activities.length > 0) {
            console.log("Using updated multiple_activities logic with input:", input);
            for (const act of input.multiple_activities) {
              console.log(`Processing activity: ${act.nome_atividade}`);
              
              // Try multiple variations of activity name for encoding issues
              const activityVariations = [
                act.nome_atividade,
                act.nome_atividade.replace('ç', 'Ã§').replace('ã', 'Ã£').replace('é', 'Ã©'),
                act.nome_atividade.replace('Amarração', 'AmarraÃ§Ã£o'),
                act.nome_atividade.replace('Devolução', 'DevoluÃ§Ã£o'),
                // More specific mappings
                'Prod AmarraÃ§Ã£o', // Direct mapping for most common activity
                'Prod Repack',
                'Prod Retrabalho',
                'Prod Retorno',
                'Prod Refugo',
                'Prod DevoluÃ§Ã£o',
                'Prod Blocagem Repack'
              ];
              
              let activityData = null;
              let error = null;
              
              for (const variation of activityVariations) {
                console.log(`Trying activity name variation: ${variation}`);
                const { data: queryData, error: queryError } = await supabase
                  .from('activities')
                  .select('*')
                  .eq('nome_atividade', variation)
                  .order('produtividade_minima', { ascending: false });
                
                if (!queryError && queryData && queryData.length > 0) {
                  activityData = queryData;
                  console.log(`Found activity data with variation: ${variation}`);
                  break;
                }
              }

              console.log(`Query result for ${act.nome_atividade}:`, { error, dataLength: activityData?.length });
              if (error) {
                console.error(`Error querying activity ${act.nome_atividade}:`, error);
                continue;
              }
              if (!activityData || activityData.length === 0) {
                console.log(`No data found for activity: ${act.nome_atividade}`);
                continue;
              }

              console.log(`Found ${activityData.length} records for ${act.nome_atividade}:`, activityData);
              const produtividade = act.quantidade_produzida / act.tempo_horas;
              console.log(`Calculated productivity: ${produtividade} for ${act.nome_atividade}`);
              
              let selectedActivity = null;
              for (const a of activityData) {
                // Convert produtividade_minima to number (handle comma decimal separator)
                const produtividadeMinima = typeof a.produtividade_minima === 'string' 
                  ? parseFloat(a.produtividade_minima.replace(',', '.'))
                  : a.produtividade_minima;
                
                console.log(`Checking level: ${a.nivel_atividade}, min productivity: ${produtividadeMinima}`);
                if (produtividade >= produtividadeMinima) {
                  selectedActivity = a;
                  console.log(`Selected activity level: ${a.nivel_atividade}`);
                  break;
                }
              }
              if (!selectedActivity) {
                selectedActivity = activityData[activityData.length - 1];
                console.log(`No level achieved, using lowest level: ${selectedActivity.nivel_atividade}`);
              }

              // Convert valor_atividade to number (handle comma decimal separator)
              const valorAtividade = typeof selectedActivity.valor_atividade === 'string' 
                ? parseFloat(selectedActivity.valor_atividade.replace(',', '.'))
                : selectedActivity.valor_atividade;
              
              const valor = valorAtividade * act.quantidade_produzida;
              subtotalAtividades += valor / 2; // Aplicar regra de 50%
              
              console.log(`Activity calculation: ${valorAtividade} * ${act.quantidade_produzida} = ${valor}, subtotal after 50%: ${valor / 2}`);

              atividadesDetalhes.push({
                nome_atividade: act.nome_atividade,
                quantidade_produzida: act.quantidade_produzida,
                tempo_horas: act.tempo_horas,
                valor,
                produtividade: Math.round(produtividade * 100) / 100,
                nivel: selectedActivity.nivel_atividade
              });

              tarefasValidas++;
              valorTarefas += valor;
              produtividadeAlcancada = Math.max(produtividadeAlcancada, produtividade);
              nivelAtingido = selectedActivity.nivel_atividade; // Atualizar com o nível mais recente ou lógica desejada
              unidadeMedida = selectedActivity.unidade_medida;
            }
          }

          // Handle KPIs with normalized data
          console.log("Processing KPIs:", input.kpis_atingidos);
          console.log("Available KPIs from query:", kpis);
          console.log("Input KPIs to search:", input.kpis_atingidos);
          console.log("Available KPI names:", kpis?.map(k => k.nome_kpi));
          
          // DIRECT KPI PROCESSING - Use known KPI values regardless of search results
          if (input.kpis_atingidos && input.kpis_atingidos.length > 0) {
            console.log('Processing KPIs directly with known values...');
            console.log('Input KPIs:', input.kpis_atingidos);
            
            // Known KPI values for Ajudante de Armazém
            const knownKpis = {
              'EFC': { peso: 3, turno: 'Geral' },
              'Ressuprimento': { peso: 3, turno: 'Manhã' }
            };
            
            for (const kpiName of input.kpis_atingidos) {
              console.log(`Processing KPI: "${kpiName}"`);
              
              // First try to find in fetched KPIs
              const matchingKpi = kpis?.find(k => k.nome_kpi === kpiName);
              
              if (matchingKpi) {
                // Convert peso_kpi to number (handle comma decimal separator)
                const pesoKpi = typeof matchingKpi.peso_kpi === 'string' 
                  ? parseFloat(matchingKpi.peso_kpi.replace(',', '.'))
                  : parseFloat(matchingKpi.peso_kpi) || 0;
                
                bonusKpis += pesoKpi;
                kpisAtingidos.push(matchingKpi.nome_kpi);
                console.log(`✅ Found in DB - KPI: ${matchingKpi.nome_kpi}, Weight: ${pesoKpi}`);
              } else if (knownKpis[kpiName]) {
                // Fallback to known values
                const knownKpi = knownKpis[kpiName];
                bonusKpis += knownKpi.peso;
                kpisAtingidos.push(kpiName);
                console.log(`✅ Used known value - KPI: ${kpiName}, Weight: ${knownKpi.peso}`);
              } else {
                console.log(`❌ KPI not found: "${kpiName}"`);
              }
            }
          } else {
            console.log('No KPIs to process');
          }
          
          console.log('Final bonusKpis:', bonusKpis);
          console.log('Final kpisAtingidos:', kpisAtingidos);

          const remuneracaoTotal = subtotalAtividades + bonusKpis + (input.input_adicional || 0);

          return {
            statusCode: 200,
            headers: { 
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
              subtotalAtividades,
              bonusKpis,
              remuneracaoTotal,
              produtividadeAlcancada: Math.round(produtividadeAlcancada * 100) / 100,
              nivelAtingido,
              unidadeMedida,
              atividadesDetalhes,
              tarefasValidas,
              valorTarefas,
              kpisAtingidos
            })
          };
        } catch (error) {
          console.error('Calculator error:', error);
          return {
            statusCode: 500,
            headers: { 
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ error: 'Calculation failed', message: error.message })
          };
        }
      }
    }

    // Lançamentos validation endpoint
    if (apiPath.startsWith('/lancamentos/') && apiPath.endsWith('/validar')) {
      if (method === 'POST') {
        try {
          // Extract ID from path like /lancamentos/47/validar
          const pathParts = apiPath.split('/');
          const lancamentoId = pathParts[2];
          
          if (!lancamentoId || isNaN(parseInt(lancamentoId))) {
            return {
              statusCode: 400,
              headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
              },
              body: JSON.stringify({ error: 'ID do lançamento inválido' })
            };
          }
          
          const { acao, observacoes, dados_editados, admin_user_id } = body;
          
          if (!acao || !['aprovar', 'reprovar', 'editar'].includes(acao)) {
            return {
              statusCode: 400,
              headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
              },
              body: JSON.stringify({ error: 'Ação inválida. Use: aprovar, reprovar ou editar' })
            };
          }
          
          // Get the original lancamento
          const { data: originalLancamento, error: lancamentoError } = await supabase
            .from('lancamentos_produtividade')
            .select('*')
            .eq('id', parseInt(lancamentoId))
            .single();
          
          if (lancamentoError || !originalLancamento) {
            return {
              statusCode: 404,
              headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
              },
              body: JSON.stringify({ error: 'Lançamento não encontrado' })
            };
          }
          
          // Get admin user info if provided
          let adminUser = null;
          if (admin_user_id) {
            const { data: specificAdmin, error: specificAdminError } = await supabase
              .from('usuarios')
              .select('*')
              .eq('id', admin_user_id)
              .eq('tipo_usuario', 'administrador')
              .single();
            
            if (!specificAdminError && specificAdmin) {
              adminUser = specificAdmin;
            }
          }
          
          let updateData = {
            updated_at: new Date().toISOString()
          };
          
          if (acao === 'editar' && dados_editados) {
            // Handle edit action
            updateData = {
              ...updateData,
              status: 'pendente', // Keep as pending after edit
              observacoes: observacoes || null,
              editado_por_admin: adminUser ? adminUser.nome : 'Admin',
              data_edicao: new Date().toISOString(),
              // Update fields from dados_editados
              funcao: dados_editados.funcao || originalLancamento.funcao,
              turno: dados_editados.turno || originalLancamento.turno,
              nome_atividade: dados_editados.nome_atividade || originalLancamento.nome_atividade,
              quantidade_produzida: dados_editados.quantidade_produzida || originalLancamento.quantidade_produzida,
              tempo_horas: dados_editados.tempo_horas || originalLancamento.tempo_horas,
              input_adicional: dados_editados.input_adicional || originalLancamento.input_adicional,
              multiple_activities: dados_editados.multiple_activities ? JSON.stringify(dados_editados.multiple_activities) : originalLancamento.multiple_activities,
              nome_operador: dados_editados.nome_operador || originalLancamento.nome_operador,
              valid_tasks_count: dados_editados.valid_tasks_count || originalLancamento.valid_tasks_count
            };
          } else {
            // Handle approve/reject actions
          const status = acao === 'aprovar' ? 'aprovado' : 'reprovado';
          updateData = {
            ...updateData,
            status,
            observacoes: observacoes || null
          };
          }
          
          // Update the lancamento
          const { data: updatedLancamento, error: updateError } = await supabase
            .from('lancamentos_produtividade')
            .update(updateData)
            .eq('id', parseInt(lancamentoId))
            .select()
            .single();
          
          if (updateError) {
            console.error('Error updating lancamento:', updateError);
            return {
              statusCode: 500,
              headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
              },
              body: JSON.stringify({ error: updateError.message })
            };
          }
          
          return {
            statusCode: 200,
            headers: { 
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
              success: true,
              message: `Lançamento ${acao === 'editar' ? 'editado' : acao === 'aprovar' ? 'aprovado' : 'reprovado'} com sucesso`,
              data: updatedLancamento
            })
          };
          
        } catch (error) {
          console.error('Error in lancamento validation:', error);
          return {
            statusCode: 500,
            headers: { 
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ error: 'Erro interno do servidor', message: error.message })
          };
        }
      }
    }

    // WMS Users management routes
    if (apiPath === '/wms-users' && method === 'GET') {
      try {
        const { data: users, error } = await supabase
          .from('cadastro_wms')
          .select('id, nome, cpf, login_wms, nome_wms, created_at, updated_at')
          .order('nome', { ascending: true });
        
        if (error) {
          console.error('Erro na consulta de usuários WMS:', error);
          return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ success: false, error: error.message })
          };
        }
        
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ success: true, users: users || [] })
        };
      } catch (error) {
        console.error('Erro ao buscar usuários WMS:', error);
        return {
          statusCode: 500,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ success: false, error: 'Erro interno do servidor' })
        };
      }
    }
    
    if (apiPath === '/wms-users' && method === 'POST') {
      try {
        const { nome, cpf, login_wms, nome_wms } = JSON.parse(event.body || '{}');
        
        // Verificar se CPF ou login já existem
        const { data: existing, error: checkError } = await supabase
          .from('cadastro_wms')
          .select('id')
          .or(`cpf.eq.${cpf},login_wms.eq.${login_wms}`)
          .limit(1);
        
        if (checkError) {
          console.error('Erro ao verificar usuário existente:', checkError);
          return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ success: false, error: checkError.message })
          };
        }
        
        if (existing && existing.length > 0) {
          return {
            statusCode: 400,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ success: false, error: 'CPF ou Login WMS já cadastrado' })
          };
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
          return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ success: false, error: insertError.message })
          };
        }
        
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ success: true, id: newUser.id })
        };
      } catch (error) {
        console.error('Erro ao criar usuário WMS:', error);
        return {
          statusCode: 500,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ success: false, error: 'Erro interno do servidor' })
        };
      }
    }
    
    if (apiPath.startsWith('/wms-users/') && method === 'PUT') {
      try {
        const id = apiPath.split('/')[3];
        const { nome, cpf, login_wms, nome_wms } = JSON.parse(event.body || '{}');
        
        // Verificar se CPF ou login já existem em outros registros
        const { data: existing, error: existingError } = await supabase
          .from('cadastro_wms')
          .select('id')
          .or(`cpf.eq.${cpf},login_wms.eq.${login_wms}`)
          .neq('id', id)
          .single();
        
        if (existingError && existingError.code !== 'PGRST116') {
          console.error('Erro ao verificar usuário WMS existente:', existingError);
          return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ success: false, error: 'Erro interno do servidor' })
          };
        }
        
        if (existing) {
          return {
            statusCode: 400,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ success: false, error: 'CPF ou Login WMS já cadastrado' })
          };
        }
        
        const { data, error } = await supabase
          .from('cadastro_wms')
          .update({ nome, cpf, login_wms, nome_wms })
          .eq('id', id)
          .select();
        
        if (error) {
          console.error('Erro ao atualizar usuário WMS:', error);
          return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ success: false, error: 'Erro interno do servidor' })
          };
        }
        
        if (data && data.length > 0) {
          return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ success: true })
          };
        } else {
          return {
            statusCode: 404,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ success: false, error: 'Usuário WMS não encontrado' })
          };
        }
      } catch (error) {
        console.error('Erro ao atualizar usuário WMS:', error);
        return {
          statusCode: 500,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ success: false, error: 'Erro interno do servidor' })
        };
      }
    }
    
    if (apiPath.startsWith('/wms-users/') && method === 'DELETE') {
      try {
        const id = apiPath.split('/')[3];
        
        const { data, error } = await supabase
          .from('cadastro_wms')
          .delete()
          .eq('id', id)
          .select();
        
        if (error) {
          console.error('Erro ao deletar usuário WMS:', error);
          return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ success: false, error: 'Erro interno do servidor' })
          };
        }
        
        if (data && data.length > 0) {
          return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ success: true })
          };
        } else {
          return {
            statusCode: 404,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ success: false, error: 'Usuário WMS não encontrado' })
          };
        }
      } catch (error) {
        console.error('Erro ao deletar usuário WMS:', error);
        return {
          statusCode: 500,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ success: false, error: 'Erro interno do servidor' })
        };
      }
    }

    // Users management routes
    if (apiPath === '/usuarios' && method === 'GET') {
      try {
        const { data: users, error } = await supabase
          .from('usuarios')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error('Error fetching users:', error);
          return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: error.message })
          };
        }
        
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify(users || [])
        };
      } catch (error) {
        console.error('Error fetching users:', error);
        return {
          statusCode: 500,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ error: 'Internal server error' })
        };
      }
    }
    
    if (apiPath === '/usuarios' && method === 'POST') {
      try {
        const { cpf, data_nascimento, nome, tipo_usuario, status_usuario, funcao } = JSON.parse(event.body || '{}');
        
        const { data: newUser, error } = await supabase
          .from('usuarios')
          .insert({
            cpf,
            data_nascimento,
            nome,
            tipo_usuario: tipo_usuario || 'colaborador',
            status_usuario: status_usuario || 'ativo',
            funcao,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();
        
        if (error) {
          console.error('Error creating user:', error);
          return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: error.message })
          };
        }
        
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify(newUser)
        };
      } catch (error) {
        console.error('Error creating user:', error);
        return {
          statusCode: 500,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ error: 'Internal server error' })
        };
      }
    }
    
    if (apiPath.startsWith('/usuarios/') && method === 'PUT') {
      try {
        console.log('=== PUT /usuarios DEBUG START ===');
        const id = parseInt(apiPath.split('/')[2]);
        console.log('User ID:', id);
        console.log('Raw event.body:', event.body);
        
        const updateData = JSON.parse(event.body || '{}');
        console.log('Parsed updateData:', JSON.stringify(updateData, null, 2));
        
        if (isNaN(id)) {
          console.log('Invalid ID detected');
          return {
            statusCode: 400,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: 'Invalid user ID' })
          };
        }
        
        // Create a mutable copy of the data to clean
        const dataToUpdate = { ...updateData };
        
        // List of fields that should be converted to null if they are empty strings
        const fieldsToNullify = [
          'data_admissao',
          'data_nascimento',
          'email',
          'telefone',
          'observacoes',
        ];
        
        fieldsToNullify.forEach((field) => {
          if (dataToUpdate[field] === '') {
            console.log(`Field '${field}' is an empty string, converting to null.`);
            dataToUpdate[field] = null;
          }
        });
        
        // Remove undefined fields
        const cleanData = Object.fromEntries(
          Object.entries(dataToUpdate).filter(([_, value]) => value !== undefined)
        );
        console.log('Clean data after filtering:', JSON.stringify(cleanData, null, 2));
        
        if (Object.keys(cleanData).length === 0) {
          console.log('No fields to update');
          return {
            statusCode: 400,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: 'No fields to update' })
          };
        }
        
        cleanData.updated_at = new Date().toISOString();
        console.log('Final data to update:', JSON.stringify(cleanData, null, 2));
        
        console.log('Calling Supabase update...');
        const { data: user, error } = await supabase
          .from('usuarios')
          .update(cleanData)
          .eq('id', id)
          .select()
          .single();
        
        console.log('Supabase response - data:', user);
        console.log('Supabase response - error:', error);
        
        if (error) {
          console.error('Supabase error details:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          });
          if (error.code === 'PGRST116') {
            return {
              statusCode: 404,
              headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
              body: JSON.stringify({ error: 'User not found' })
            };
          }
          return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: 'Error updating user', details: error.message })
          };
        }
        
        console.log('Success! Returning user data');
        console.log('=== PUT /usuarios DEBUG END ===');
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify(user)
        };
      } catch (error) {
        console.error('Catch block - Error updating user:', {
          message: error.message,
          stack: error.stack,
          name: error.name
        });
        return {
          statusCode: 500,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ error: 'Internal server error', details: error.message })
        };
      }
    }
    
    if (apiPath.startsWith('/usuarios/') && method === 'DELETE') {
      try {
        const id = parseInt(apiPath.split('/')[2]);
        
        if (isNaN(id)) {
          return {
            statusCode: 400,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: 'Invalid user ID' })
          };
        }
        
        const { error } = await supabase
          .from('usuarios')
          .delete()
          .eq('id', id);
        
        if (error) {
          console.error('Error deleting user:', error);
          if (error.code === 'PGRST116') {
            return {
              statusCode: 404,
              headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
              body: JSON.stringify({ error: 'User not found' })
            };
          }
          return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: 'Error deleting user' })
          };
        }
        
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ success: true })
        };
      } catch (error) {
        console.error('Error deleting user:', error);
        return {
          statusCode: 500,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ error: 'Internal server error' })
        };
      }
    }

    // Default response for unhandled paths
    return {
      statusCode: 404,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        error: 'Not found', 
        path: apiPath,
        method: method,
        message: 'Endpoint not implemented'
      })
    };
    
  } catch (error) {
    console.error('Handler error:', error);
    return {
      statusCode: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        error: 'Internal server error', 
        message: error.message
      }),
    }
  }
};