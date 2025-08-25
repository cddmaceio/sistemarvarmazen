"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExportLogSchema = exports.ExportFilterSchema = exports.HistoricoAprovacaoSchema = exports.AdminValidationSchema = exports.CreateLancamentoSchema = exports.KPILimitCheckSchema = exports.LancamentoSchema = exports.CalculatorResultSchema = exports.CalculatorInputSchema = exports.ValidTaskSchema = exports.MultipleActivitySchema = exports.LoginSchema = exports.UserSchema = exports.KPISchema = exports.ActivitySchema = void 0;
const zod_1 = require("zod");
// Activity schema
exports.ActivitySchema = zod_1.z.object({
    id: zod_1.z.number().optional(),
    nome_atividade: zod_1.z.string().min(1, "Nome da atividade é obrigatório"),
    nivel_atividade: zod_1.z.string().min(1, "Nível da atividade é obrigatório"),
    valor_atividade: zod_1.z.number().min(0, "Valor deve ser maior que zero"),
    produtividade_minima: zod_1.z.number().min(0).optional(),
    unidade_medida: zod_1.z.string().optional(),
    created_at: zod_1.z.string().optional(),
    updated_at: zod_1.z.string().optional(),
});
// KPI schema
exports.KPISchema = zod_1.z.object({
    id: zod_1.z.number().optional(),
    nome_kpi: zod_1.z.string().min(1, "Nome do KPI é obrigatório"),
    descricao: zod_1.z.string().optional(),
    valor_meta_kpi: zod_1.z.number().min(0, "Meta deve ser maior que zero"),
    peso_kpi: zod_1.z.number().min(0, "Peso deve ser maior que zero"),
    turno_kpi: zod_1.z.enum(["Manhã", "Tarde", "Noite", "Geral"]),
    funcao_kpi: zod_1.z.string().min(1, "Função é obrigatória"),
    status_ativo: zod_1.z.boolean().default(true),
    created_at: zod_1.z.string().optional(),
    updated_at: zod_1.z.string().optional(),
});
// User schema for simple authentication
exports.UserSchema = zod_1.z.object({
    id: zod_1.z.number().optional(),
    cpf: zod_1.z.string().min(1, "CPF é obrigatório"),
    data_nascimento: zod_1.z.string().min(1, "Data de nascimento é obrigatória"),
    nome: zod_1.z.string().min(1, "Nome é obrigatório"),
    tipo_usuario: zod_1.z.string().default("colaborador"),
    status_usuario: zod_1.z.string().default("ativo"),
    funcao: zod_1.z.string().optional(),
    turno: zod_1.z.enum(["Manhã", "Tarde", "Noite", "Geral"]).optional(), // Opcional para administradores
    email: zod_1.z.string().optional(),
    telefone: zod_1.z.string().optional(),
    data_admissao: zod_1.z.string().optional(),
    observacoes: zod_1.z.string().optional(),
    created_at: zod_1.z.string().optional(),
    updated_at: zod_1.z.string().optional(),
});
// Login schema
exports.LoginSchema = zod_1.z.object({
    cpf: zod_1.z.string().min(1, "CPF é obrigatório"),
    data_nascimento: zod_1.z.string().min(1, "Data de nascimento é obrigatória"),
});
// Multiple activities schema for Ajudantes de Armazém
exports.MultipleActivitySchema = zod_1.z.object({
    nome_atividade: zod_1.z.string().min(1, "Nome da atividade é obrigatório"),
    quantidade_produzida: zod_1.z.number().min(0, "Quantidade deve ser maior que zero"),
    tempo_horas: zod_1.z.number().min(0.1, "Tempo deve ser maior que 0.1 horas"),
});
// Valid tasks schema for Operador de Empilhadeira
exports.ValidTaskSchema = zod_1.z.object({
    tipo: zod_1.z.string(),
    meta_segundos: zod_1.z.number(),
    tempo_execucao_segundos: zod_1.z.number(),
    valida: zod_1.z.boolean(),
});
// Calculator input schema
exports.CalculatorInputSchema = zod_1.z.object({
    nome_atividade: zod_1.z.string().optional(),
    funcao: zod_1.z.string().min(1, "Função é obrigatória"),
    turno: zod_1.z.enum(["Manhã", "Tarde", "Noite", "Manha"]),
    quantidade_produzida: zod_1.z.number().optional(),
    tempo_horas: zod_1.z.number().optional(),
    input_adicional: zod_1.z.number().optional(),
    kpis_atingidos: zod_1.z.array(zod_1.z.string()).optional(),
    // Multiple activities for Ajudantes de Armazém
    multiple_activities: zod_1.z.array(exports.MultipleActivitySchema).optional(),
    // Valid tasks for Operador de Empilhadeira
    nome_operador: zod_1.z.string().optional(),
    valid_tasks_count: zod_1.z.number().optional(),
});
// Calculator result schema
exports.CalculatorResultSchema = zod_1.z.object({
    subtotalAtividades: zod_1.z.number(),
    bonusKpis: zod_1.z.number(),
    remuneracaoTotal: zod_1.z.number(),
    kpisAtingidos: zod_1.z.array(zod_1.z.string()),
    produtividade_alcancada: zod_1.z.number().optional(),
    nivel_atingido: zod_1.z.string().optional(),
    unidade_medida: zod_1.z.string().optional(),
    // Multiple activities details
    atividades_detalhes: zod_1.z.array(zod_1.z.object({
        nome: zod_1.z.string(),
        produtividade: zod_1.z.number(),
        nivel: zod_1.z.string(),
        valor_total: zod_1.z.number(),
        unidade: zod_1.z.string(),
    })).optional(),
    // Valid tasks details
    tarefas_validas: zod_1.z.number().optional(),
    valor_tarefas: zod_1.z.number().optional(),
    // Gross activity value
    valor_bruto_atividades: zod_1.z.number().optional(),
});
// Lançamento schema
exports.LancamentoSchema = zod_1.z.object({
    id: zod_1.z.number().optional(),
    user_id: zod_1.z.number(),
    user_nome: zod_1.z.string(),
    user_cpf: zod_1.z.string(),
    data_lancamento: zod_1.z.string(),
    funcao: zod_1.z.string(),
    turno: zod_1.z.enum(["Manhã", "Tarde", "Noite"]),
    // Calculator input data
    nome_atividade: zod_1.z.string().optional(),
    quantidade_produzida: zod_1.z.number().optional(),
    tempo_horas: zod_1.z.number().optional(),
    input_adicional: zod_1.z.number().default(0),
    multiple_activities: zod_1.z.string().optional(), // JSON
    nome_operador: zod_1.z.string().optional(),
    valid_tasks_count: zod_1.z.number().optional(),
    kpis_atingidos: zod_1.z.string().optional(), // JSON
    // Calculator results
    subtotal_atividades: zod_1.z.number(),
    bonus_kpis: zod_1.z.number(),
    remuneracao_total: zod_1.z.number(),
    produtividade_alcancada: zod_1.z.number().optional(),
    nivel_atingido: zod_1.z.string().optional(),
    unidade_medida: zod_1.z.string().optional(),
    atividades_detalhes: zod_1.z.string().optional(), // JSON
    tarefas_validas: zod_1.z.number().optional(),
    valor_tarefas: zod_1.z.number().optional(),
    valor_bruto_atividades: zod_1.z.number().optional(),
    // Status
    status: zod_1.z.enum(["pendente", "aprovado", "reprovado"]).default("pendente"),
    observacoes: zod_1.z.string().optional(),
    // Edit tracking fields
    editado_por_admin: zod_1.z.string().optional(),
    data_edicao: zod_1.z.string().optional(),
    valores_originais: zod_1.z.string().optional(), // JSON backup
    status_edicao: zod_1.z.enum(["original", "editado_admin"]).default("original"),
    observacoes_edicao: zod_1.z.string().optional(),
    created_at: zod_1.z.string().optional(),
    updated_at: zod_1.z.string().optional(),
});
// KPI limit check schema
exports.KPILimitCheckSchema = zod_1.z.object({
    user_id: zod_1.z.number(),
    data_lancamento: zod_1.z.string(),
});
// Lançamento creation input
exports.CreateLancamentoSchema = zod_1.z.object({
    data_lancamento: zod_1.z.string().min(1, "Data é obrigatória"),
    user_id: zod_1.z.number().optional(),
    calculator_data: exports.CalculatorInputSchema,
    calculator_result: exports.CalculatorResultSchema,
});
// Admin validation schema
exports.AdminValidationSchema = zod_1.z.object({
    acao: zod_1.z.enum(["aprovar", "reprovar", "editar"]),
    observacoes: zod_1.z.string().optional(),
    dados_editados: exports.CalculatorInputSchema.optional(),
    admin_user_id: zod_1.z.number().optional(),
});
// History schema for approved entries
exports.HistoricoAprovacaoSchema = zod_1.z.object({
    id: zod_1.z.number().optional(),
    lancamento_id: zod_1.z.number(),
    colaborador_id: zod_1.z.number(),
    colaborador_nome: zod_1.z.string(),
    colaborador_cpf: zod_1.z.string(),
    data_lancamento: zod_1.z.string(),
    data_aprovacao: zod_1.z.string(),
    aprovado_por: zod_1.z.string(),
    editado: zod_1.z.boolean(),
    editado_por: zod_1.z.string().optional(),
    dados_finais: zod_1.z.string(), // JSON
    observacoes: zod_1.z.string().optional(),
    remuneracao_total: zod_1.z.number(),
    created_at: zod_1.z.string().optional(),
    updated_at: zod_1.z.string().optional(),
});
// Exportação schemas
exports.ExportFilterSchema = zod_1.z.object({
    periodo_inicio: zod_1.z.string().optional(),
    periodo_fim: zod_1.z.string().optional(),
    funcao: zod_1.z.string().optional(),
    colaborador_id: zod_1.z.number().optional(),
    status: zod_1.z.enum(["pendente", "aprovado", "reprovado", "todos"]).default("aprovado"),
});
exports.ExportLogSchema = zod_1.z.object({
    id: zod_1.z.number().optional(),
    admin_id: zod_1.z.number(),
    admin_nome: zod_1.z.string(),
    filtros_aplicados: zod_1.z.string().optional(), // JSON
    formato_exportacao: zod_1.z.enum(["csv", "xlsx", "pdf"]),
    total_registros: zod_1.z.number(),
    nome_arquivo: zod_1.z.string().optional(),
    data_exportacao: zod_1.z.string().optional(),
    ip_origem: zod_1.z.string().optional(),
    created_at: zod_1.z.string().optional(),
    updated_at: zod_1.z.string().optional(),
});
