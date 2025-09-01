import { createClient } from '@supabase/supabase-js'

// Configuração do Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Cliente Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Tipos para as tabelas do banco
export interface Activity {
  id: number
  nome_atividade: string
  nivel_atividade: string
  valor_atividade: number
  produtividade_minima: number
  unidade_medida: string
  created_at: string
  updated_at: string
}

export interface KPI {
  id: number
  nome_kpi: string
  valor_meta_kpi: number
  peso_kpi: number
  turno_kpi: string
  funcao_kpi: string
  created_at: string
  updated_at: string
}

export interface Usuario {
  id: number
  cpf: string
  data_nascimento: string
  nome: string
  tipo_usuario: string
  status_usuario: string
  funcao: string
  created_at: string
  updated_at: string
}

export interface UserProfile {
  id: number
  user_id: string
  email: string
  name: string
  cpf: string | null
  role: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface LancamentoProdutividade {
  id: number
  user_id: number
  user_nome: string
  user_cpf: string
  data_lancamento: string
  funcao: string
  turno: string
  nome_atividade: string | null
  quantidade_produzida: number | null
  tempo_horas: number | null
  input_adicional: number
  multiple_activities: string | null
  nome_operador: string | null
  valid_tasks_count: number | null
  kpis_atingidos: string | null
  subtotal_atividades: number
  bonus_kpis: number
  remuneracao_total: number
  produtividade_alcancada: number | null
  nivel_atingido: string | null
  unidade_medida: string | null
  atividades_detalhes: string | null
  tarefas_validas: number | null
  valor_tarefas: number | null
  valor_bruto_atividades: number | null
  status: string
  observacoes: string | null
  created_at: string
  updated_at: string
}

// Funções auxiliares para queries comuns
export const supabaseQueries = {
  // Atividades
  async getActivities() {
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .order('nome_atividade', { ascending: true })
    
    if (error) throw error
    return data as Activity[]
  },

  async getActivityNames() {
    const { data, error } = await supabase
      .from('activities')
      .select('nome_atividade')
      .order('nome_atividade', { ascending: true })
    
    if (error) throw error
    return data.map(item => item.nome_atividade)
  },

  // KPIs
  async getKPIs() {
    const { data, error } = await supabase
      .from('kpis')
      .select('*')
      .order('nome_kpi', { ascending: true })
    
    if (error) throw error
    return data as KPI[]
  },

  async getFunctions() {
    const { data, error } = await supabase
      .from('kpis')
      .select('funcao_kpi')
      .order('funcao_kpi', { ascending: true })
    
    if (error) throw error
    return [...new Set(data.map(item => item.funcao_kpi))]
  },

  // Usuários
  async getUsuarios() {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('is_active', true)
      .order('nome', { ascending: true })
    
    if (error) throw error
    return data as Usuario[]
  },

  async getUsuarioByCPF(cpf: string) {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('cpf', cpf)
      .eq('is_active', true)
      .single()
    
    if (error) throw error
    return data as Usuario
  },

  // Lançamentos
  async getLancamentos() {
    const { data, error } = await supabase
      .from('lancamentos_produtividade')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data as LancamentoProdutividade[]
  },

  async createLancamento(lancamento: Omit<LancamentoProdutividade, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('lancamentos_produtividade')
      .insert(lancamento)
      .select()
      .single()
    
    if (error) throw error
    return data as LancamentoProdutividade
  },

  async updateLancamento(id: number, updates: Partial<LancamentoProdutividade>) {
    const { data, error } = await supabase
      .from('lancamentos_produtividade')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()
    
    return { data, error }
  },

  // Função de cálculo de produtividade
  async calculateProductivity(input: {
    nome_atividade?: string
    funcao: string
    turno: string
    quantidade_produzida?: number
    tempo_horas?: number
    input_adicional?: number
    kpis_atingidos?: string[]
    multiple_activities?: any[]
    valid_tasks_count?: number
  }) {
    let subtotal_atividades = 0
    let atividades_detalhes: any[] = []
    let produtividade_alcancada: number | undefined
    let nivel_atingido: string | undefined
    let unidade_medida: string | undefined
    let tarefas_validas: number | undefined
    let valor_tarefas: number | undefined

    // Handle multiple activities for Ajudantes de Armazém
    if (input.funcao === 'Ajudante de Armazém' && input.multiple_activities && input.multiple_activities.length > 0) {
      for (const activity of input.multiple_activities) {
        const produtividade = activity.quantidade_produzida / activity.tempo_horas
        
        // Get activities for this activity name, ordered by produtividade_minima descending
        const { data: activities } = await supabase
          .from('activities')
          .select('*')
          .eq('nome_atividade', activity.nome_atividade)
          .order('produtividade_minima', { ascending: false })
        
        if (activities && activities.length > 0) {
          // Find the appropriate level based on productivity
          let selectedActivity = null
          for (const act of activities) {
            if (produtividade >= parseFloat(act.produtividade_minima)) {
              selectedActivity = act
              break
            }
          }
          
          // If no level achieved, use the lowest level
          if (!selectedActivity) {
            selectedActivity = activities[activities.length - 1]
          }
          
          // Calculate value for this activity (applying 50% rule: atividades/2)
          const valor_bruto = activity.quantidade_produzida * parseFloat(selectedActivity.valor_atividade)
          const valor_final = valor_bruto / 2
          subtotal_atividades += valor_final
          
          atividades_detalhes.push({
            nome: activity.nome_atividade,
            produtividade: produtividade,
            nivel: selectedActivity.nivel_atividade,
            valor_total: valor_final,
            unidade: selectedActivity.unidade_medida || 'unidades'
          })
        }
      }
    }
    // Handle valid tasks for Operador de Empilhadeira
    else if (input.funcao === 'Operador de Empilhadeira' && input.valid_tasks_count !== undefined) {
      tarefas_validas = input.valid_tasks_count
      valor_tarefas = input.valid_tasks_count * 0.093 // R$ 0,093 per valid task
      subtotal_atividades = valor_tarefas / 2 // Apply 50% rule
    }
    // Handle single activity for other functions
    else if (input.nome_atividade && input.quantidade_produzida && input.tempo_horas) {
      // Calculate productivity (quantity per hour)
      produtividade_alcancada = input.quantidade_produzida / input.tempo_horas
      
      // Get activities for this activity name, ordered by produtividade_minima descending
      const { data: activities } = await supabase
        .from('activities')
        .select('*')
        .eq('nome_atividade', input.nome_atividade)
        .order('produtividade_minima', { ascending: false })
      
      if (!activities || activities.length === 0) {
        throw new Error('Atividade não encontrada')
      }
      
      // Find the appropriate level based on productivity
      let selectedActivity = null
      for (const activity of activities) {
        if (produtividade_alcancada >= parseFloat(activity.produtividade_minima)) {
          selectedActivity = activity
          break
        }
      }
      
      // If no level achieved, use the lowest level
      if (!selectedActivity) {
        selectedActivity = activities[activities.length - 1]
      }
      
      // Calculate subtotal from activities (applying 50% rule: atividades/2)
      const valor_bruto_atividades = input.quantidade_produzida * parseFloat(selectedActivity.valor_atividade)
      subtotal_atividades = valor_bruto_atividades / 2
      
      nivel_atingido = selectedActivity.nivel_atividade
      unidade_medida = selectedActivity.unidade_medida
    }
    
    // Calculate KPIs bonus: R$ 3,00 per selected KPI (maximum 2)
    let bonus_kpis = 0
    const kpis_atingidos_resultado: string[] = []
    
    if (input.kpis_atingidos && input.kpis_atingidos.length > 0) {
      // Limit to maximum 2 KPIs
      const kpisLimitados = input.kpis_atingidos.slice(0, 2)
      
      for (const kpiNome of kpisLimitados) {
        // Each selected KPI is worth R$ 3,00
        bonus_kpis += 3.00
        kpis_atingidos_resultado.push(kpiNome)
      }
    }
    
    // Final calculation: KPIs + 50% das atividades + extras
    const valor_atividades_50_porcento = subtotal_atividades * 0.5
    const atividades_extras = input.input_adicional || 0
    const remuneracao_total = bonus_kpis + valor_atividades_50_porcento + atividades_extras
    
    const result: any = {
      subtotalAtividades: subtotal_atividades,
      bonusKpis: bonus_kpis,
      remuneracaoTotal: remuneracao_total,
      kpisAtingidos: kpis_atingidos_resultado,
    }

    // Add optional fields only if they exist
    if (produtividade_alcancada !== undefined) result.produtividadeAlcancada = produtividade_alcancada
    if (nivel_atingido !== undefined) result.nivelAtingido = nivel_atingido
    if (unidade_medida !== undefined) result.unidadeMedida = unidade_medida
    if (atividades_detalhes.length > 0) result.atividadesDetalhes = atividades_detalhes
    if (tarefas_validas !== undefined) result.tarefasValidas = tarefas_validas
    if (valor_tarefas !== undefined) result.valorTarefas = valor_tarefas
    
    return { data: result, error: null }
  },

  // Verificar limite de KPIs
  async checkKPILimit(user_id: number, data_lancamento: string) {
    try {
      const { data, error } = await supabase
        .from('lancamentos_produtividade')
        .select('id')
        .eq('user_id', user_id)
        .eq('data_lancamento', data_lancamento)
        .neq('status', 'reprovado') // Exclude reproved launches to allow relaunch
        .limit(1)

      if (error) {
        console.error('Erro ao verificar limite de KPI:', error)
        throw error
      }

      // Retorna true se já existe um lançamento (limite atingido)
      return data && data.length > 0
    } catch (error) {
      console.error('Erro ao verificar limite de KPI:', error)
      throw error
    }
  },

  // Funções de autenticação
  async login(cpf: string, dataNascimento: string) {
    try {
      // Validar parâmetros
      if (!cpf || !dataNascimento) {
        throw new Error('CPF e data de nascimento são obrigatórios')
      }

      // Formatar CPF removendo caracteres especiais
      const cleanCPF = cpf.replace(/\D/g, '')
      if (cleanCPF.length !== 11) {
        throw new Error('CPF deve ter 11 dígitos')
      }
      const formattedCPF = cleanCPF.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
      
      // Converter data para formato ISO (YYYY-MM-DD)
      let isoDate: string
      
      // Verificar se a data já está no formato ISO (YYYY-MM-DD)
      if (dataNascimento.includes('-') && dataNascimento.length === 10) {
        // Data já está no formato ISO
        isoDate = dataNascimento
      } else {
        // Data está no formato DD/MM/AAAA
        const dateParts = dataNascimento.split('/')
        if (dateParts.length !== 3) {
          throw new Error('Data deve estar no formato DD/MM/AAAA ou YYYY-MM-DD')
        }
        
        const [day, month, year] = dateParts
        if (!day || !month || !year) {
          throw new Error('Data inválida')
        }
        
        isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
      }
      
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('cpf', formattedCPF)
        .eq('status_usuario', 'ativo')
        .filter('data_nascimento::date', 'eq', isoDate)
        .single()

      if (error) {
        console.error('Erro na query:', error)
        if (error.code === 'PGRST116') {
          throw new Error('CPF ou data de nascimento inválidos')
        }
        throw new Error('Erro ao fazer login')
      }

      if (!data) {
        throw new Error('Usuário não encontrado ou inativo')
      }

      return data
    } catch (error) {
      console.error('Erro no login:', error)
      throw error
    }
  },

  async updateUsuario(id: number, updates: Partial<Usuario>) {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Erro ao atualizar usuário:', error)
        throw error
      }

      return data
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error)
      throw error
    }
  },

  async getLancamentosPendentes() {
    const { data, error } = await supabase
      .from('lancamentos_produtividade')
      .select('*')
      .eq('status', 'pendente')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar lançamentos pendentes:', error)
      throw new Error('Erro ao buscar lançamentos pendentes')
    }

    return data
  },

  async validarLancamento(id: number, acao: 'aprovar' | 'reprovar', observacoes?: string) {
    const status = acao === 'aprovar' ? 'aprovado' : 'reprovado'
    
    const { data, error } = await supabase
      .from('lancamentos_produtividade')
      .update({
        status,
        observacoes: observacoes || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Erro ao validar lançamento:', error)
      throw new Error('Erro ao validar lançamento')
    }

    return data
  }
}

export default supabase