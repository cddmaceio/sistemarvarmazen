import { z } from "zod";
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
    turno: z.enum(["Manhã", "Tarde", "Noite", "Geral"]).optional(), // Opcional para administradores
    email: z.string().optional(),
    telefone: z.string().optional(),
    data_admissao: z.string().optional(),
    observacoes: z.string().optional(),
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
    data_lancamento: z.string().optional(),
});
// Calculator result schema
export const CalculatorResultSchema = z.object({
    subtotalAtividades: z.number(),
    bonusKpis: z.number(),
    remuneracaoTotal: z.number(),
    kpisAtingidos: z.array(z.string()),
    produtividade_alcancada: z.number().optional(),
    nivel_atingido: z.string().optional(),
    unidade_medida: z.string().optional(),
    // Multiple activities details - array of strings with format: "Nome: quantidade unidade em tempo (nível)"
    atividades_detalhes: z.array(z.string()).optional(),
    // Valid tasks details
    tarefas_validas: z.number().optional(),
    valor_tarefas: z.number().optional(),
    // Gross activity value
    valor_bruto_atividades: z.number().optional(),
});
// Lançamento schema
export const LancamentoSchema = z.object({
    id: z.number().optional(),
    user_id: z.number(),
    user_nome: z.string(),
    user_cpf: z.string(),
    data_lancamento: z.string(),
    funcao: z.string(),
    turno: z.enum(["Manhã", "Tarde", "Noite", "Manha"]),
    // Calculator input data
    nome_atividade: z.string().optional(),
    quantidade_produzida: z.number().optional(),
    tempo_horas: z.number().optional(),
    input_adicional: z.number().default(0),
    multiple_activities: z.string().optional(), // JSON
    nome_operador: z.string().optional(),
    valid_tasks_count: z.number().optional(),
    kpis_atingidos: z.string().optional(), // JSON
    // Calculator results
    subtotal_atividades: z.number(),
    bonus_kpis: z.number(),
    remuneracao_total: z.number(),
    produtividade_alcancada: z.number().optional(),
    nivel_atingido: z.string().optional(),
    unidade_medida: z.string().optional(),
    atividades_detalhes: z.string().optional(), // JSON
    tarefas_validas: z.number().optional(),
    valor_tarefas: z.number().optional(),
    valor_bruto_atividades: z.number().optional(), // Para Ajudante de Armazém
    // Status
    status: z.enum(["pendente", "aprovado", "reprovado"]).default("pendente"),
    observacoes: z.string().optional(),
    // Edit tracking fields
    editado_por_admin: z.string().optional(),
    data_edicao: z.string().optional(),
    valores_originais: z.string().optional(), // JSON backup
    status_edicao: z.enum(["original", "editado_admin"]).default("original"),
    observacoes_edicao: z.string().optional(),
    created_at: z.string().optional(),
    updated_at: z.string().optional(),
});
// KPI limit check schema
export const KPILimitCheckSchema = z.object({
    user_id: z.number(),
    data_lancamento: z.string(),
});
// Lançamento creation input
export const CreateLancamentoSchema = z.object({
    data_lancamento: z.string().min(1, "Data é obrigatória"),
    user_id: z.number(),
    calculator_data: CalculatorInputSchema,
    calculator_result: CalculatorResultSchema,
});
// Admin validation schema
export const AdminValidationSchema = z.object({
    acao: z.enum(["aprovar", "reprovar", "editar"]),
    observacoes: z.string().optional(),
    dados_editados: CalculatorInputSchema.optional(),
    admin_user_id: z.number().optional(),
});
// History schema for approved entries
export const HistoricoAprovacaoSchema = z.object({
    id: z.number().optional(),
    lancamento_id: z.number(),
    colaborador_id: z.number(),
    colaborador_nome: z.string(),
    colaborador_cpf: z.string(),
    data_lancamento: z.string(),
    data_aprovacao: z.string(),
    aprovado_por: z.string(),
    editado: z.boolean(),
    editado_por: z.string().optional(),
    dados_finais: z.string(), // JSON
    observacoes: z.string().optional(),
    remuneracao_total: z.number(),
    created_at: z.string().optional(),
    updated_at: z.string().optional(),
});
// Exportação schemas
export const ExportFilterSchema = z.object({
    periodo_inicio: z.string().optional(),
    periodo_fim: z.string().optional(),
    funcao: z.string().optional(),
    colaborador_id: z.number().optional(),
    status: z.enum(["pendente", "aprovado", "reprovado", "todos"]).default("aprovado"),
});
export const ExportLogSchema = z.object({
    id: z.number().optional(),
    admin_id: z.number(),
    admin_nome: z.string(),
    filtros_aplicados: z.string().optional(), // JSON
    formato_exportacao: z.enum(["csv", "xlsx", "pdf"]),
    total_registros: z.number(),
    nome_arquivo: z.string().optional(),
    data_exportacao: z.string().optional(),
    ip_origem: z.string().optional(),
    created_at: z.string().optional(),
    updated_at: z.string().optional(),
});
