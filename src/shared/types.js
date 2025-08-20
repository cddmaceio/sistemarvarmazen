import z from "zod";

// Activity schema
export const ActivitySchema = z.object({
  id: z.number().optional(),
  nome_atividade: z.string().min(1, "Nome da atividade é obrigatório"),
  nivel_atividade: z.string().min(1, "Nível da atividade é obrigatório"),
  valor_atividade: z.number().min(0, "Valor deve ser maior que zero"),
  produtividade_minima: z.number().min(0).optional(),
  unidade_medida: z.string().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

// KPI schema
export const KPISchema = z.object({
  id: z.number().optional(),
  nome_kpi: z.string().min(1, "Nome do KPI é obrigatório"),
  descricao: z.string().optional(),
  valor_meta_kpi: z.number().min(0, "Meta deve ser maior que zero"),
  peso_kpi: z.number().min(0, "Peso deve ser maior que zero"),
  turno_kpi: z.enum(["Manhã", "Tarde", "Noite", "Geral"]),
  funcao_kpi: z.string().min(1, "Função é obrigatória"),
  status_ativo: z.boolean().default(true),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

// User schema for simple authentication
export const UserSchema = z.object({
  id: z.number().optional(),
  cpf: z.string().min(1, "CPF é obrigatório"),
  data_nascimento: z.string().min(1, "Data de nascimento é obrigatória"),
  nome: z.string().min(1, "Nome é obrigatório"),
  tipo_usuario: z.string().default("colaborador"),
  status_usuario: z.string().default("ativo"),
  funcao: z.string().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

// Login schema
export const LoginSchema = z.object({
  cpf: z.string().min(1, "CPF é obrigatório"),
  data_nascimento: z.string().min(1, "Data de nascimento é obrigatória"),
});

// Multiple activities schema for Ajudantes de Armazém
export const MultipleActivitySchema = z.object({
  nome_atividade: z.string().min(1, "Nome da atividade é obrigatório"),
  quantidade_produzida: z.number().min(0, "Quantidade deve ser maior que zero"),
  tempo_horas: z.number().min(0.1, "Tempo deve ser maior que 0.1 horas"),
});

// Valid tasks schema for Operador de Empilhadeira
export const ValidTaskSchema = z.object({
  tipo: z.string(),
  meta_segundos: z.number(),
  tempo_execucao_segundos: z.number(),
  valida: z.boolean(),
});

// Calculator input schema
export const CalculatorInputSchema = z.object({
  nome_atividade: z.string().optional(),
  funcao: z.string().min(1, "Função é obrigatória"),
  turno: z.enum(["Manhã", "Tarde", "Noite", "Manha"]),
  quantidade_produzida: z.number().optional(),
  tempo_horas: z.number().optional(),
  input_adicional: z.number().optional(),
  kpis_atingidos: z.array(z.string()).optional(),
  // Multiple activities for Ajudantes de Armazém
  multiple_activities: z.array(MultipleActivitySchema).optional(),
  // Valid tasks for Operador de Empilhadeira
  nome_operador: z.string().optional(),
  valid_tasks_count: z.number().optional(),
});

// Calculator result schema
export const CalculatorResultSchema = z.object({
  subtotal_atividades: z.number(),
  bonus_kpis: z.number(),
  remuneracao_total: z.number(),
  kpis_atingidos: z.array(z.string()),
  produtividade_alcancada: z.number().optional(),
  nivel_atingido: z.string().optional(),
  atividades_detalhes: z.array(z.object({
    nome: z.string(),
    produtividade: z.number(),
    nivel: z.string(),
    valor_total: z.number(),
    unidade: z.string()
  })).optional(),
  tarefas_validas: z.number().optional(),
  valor_tarefas: z.number().optional(),
  unidade_medida: z.string().optional(),
});

// Create Lancamento schema
export const CreateLancamentoSchema = z.object({
  data_lancamento: z.string().min(1, "Data é obrigatória"),
  user_id: z.number().optional(),
  calculator_data: CalculatorInputSchema,
  calculator_result: CalculatorResultSchema,
});

// Admin validation schema
export const AdminValidationSchema = z.object({
  cpf: z.string().min(1, "CPF é obrigatório"),
});

// Export filter schema
export const ExportFilterSchema = z.object({
  data_inicio: z.string().optional(),
  data_fim: z.string().optional(),
  funcao: z.string().optional(),
  turno: z.string().optional(),
  cpf: z.string().optional(),
});

// KPI Limit Check schema
export const KPILimitCheckSchema = z.object({
  user_id: z.number().min(1, "ID do usuário é obrigatório"),
  data_lancamento: z.string().min(1, "Data do lançamento é obrigatória"),
});