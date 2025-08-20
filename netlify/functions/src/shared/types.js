"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExportLogSchema = exports.ExportFilterSchema = exports.HistoricoAprovacaoSchema = exports.AdminValidationSchema = exports.CreateLancamentoSchema = exports.KPILimitCheckSchema = exports.LancamentoSchema = exports.CalculatorResultSchema = exports.CalculatorInputSchema = exports.ValidTaskSchema = exports.MultipleActivitySchema = exports.LoginSchema = exports.UserSchema = exports.KPISchema = exports.ActivitySchema = void 0;
const zod_1 = __importDefault(require("zod"));
// Activity schema
exports.ActivitySchema = zod_1.default.object({
    id: zod_1.default.number().optional(),
    nome_atividade: zod_1.default.string().min(1, "Nome da atividade é obrigatório"),
    nivel_atividade: zod_1.default.string().min(1, "Nível da atividade é obrigatório"),
    valor_atividade: zod_1.default.number().min(0, "Valor deve ser maior que zero"),
    produtividade_minima: zod_1.default.number().min(0).optional(),
    unidade_medida: zod_1.default.string().optional(),
    created_at: zod_1.default.string().optional(),
    updated_at: zod_1.default.string().optional(),
});
// KPI schema
exports.KPISchema = zod_1.default.object({
    id: zod_1.default.number().optional(),
    nome_kpi: zod_1.default.string().min(1, "Nome do KPI é obrigatório"),
    descricao: zod_1.default.string().optional(),
    valor_meta_kpi: zod_1.default.number().min(0, "Meta deve ser maior que zero"),
    peso_kpi: zod_1.default.number().min(0, "Peso deve ser maior que zero"),
    turno_kpi: zod_1.default.enum(["Manhã", "Tarde", "Noite", "Geral"]),
    funcao_kpi: zod_1.default.string().min(1, "Função é obrigatória"),
    status_ativo: zod_1.default.boolean().default(true),
    created_at: zod_1.default.string().optional(),
    updated_at: zod_1.default.string().optional(),
});
// User schema for simple authentication
exports.UserSchema = zod_1.default.object({
    id: zod_1.default.number().optional(),
    cpf: zod_1.default.string().min(1, "CPF é obrigatório"),
    data_nascimento: zod_1.default.string().min(1, "Data de nascimento é obrigatória"),
    nome: zod_1.default.string().min(1, "Nome é obrigatório"),
    tipo_usuario: zod_1.default.string().default("colaborador"),
    status_usuario: zod_1.default.string().default("ativo"),
    funcao: zod_1.default.string().optional(),
    created_at: zod_1.default.string().optional(),
    updated_at: zod_1.default.string().optional(),
});
// Login schema
exports.LoginSchema = zod_1.default.object({
    cpf: zod_1.default.string().min(1, "CPF é obrigatório"),
    data_nascimento: zod_1.default.string().min(1, "Data de nascimento é obrigatória"),
});
// Multiple activities schema for Ajudantes de Armazém
exports.MultipleActivitySchema = zod_1.default.object({
    nome_atividade: zod_1.default.string().min(1, "Nome da atividade é obrigatório"),
    quantidade_produzida: zod_1.default.number().min(0, "Quantidade deve ser maior que zero"),
    tempo_horas: zod_1.default.number().min(0.1, "Tempo deve ser maior que 0.1 horas"),
});
// Valid tasks schema for Operador de Empilhadeira
exports.ValidTaskSchema = zod_1.default.object({
    tipo: zod_1.default.string(),
    meta_segundos: zod_1.default.number(),
    tempo_execucao_segundos: zod_1.default.number(),
    valida: zod_1.default.boolean(),
});
// Calculator input schema
exports.CalculatorInputSchema = zod_1.default.object({
    nome_atividade: zod_1.default.string().optional(),
    funcao: zod_1.default.string().min(1, "Função é obrigatória"),
    turno: zod_1.default.enum(["Manhã", "Tarde", "Noite", "Manha"]),
    quantidade_produzida: zod_1.default.number().optional(),
    tempo_horas: zod_1.default.number().optional(),
    input_adicional: zod_1.default.number().optional(),
    kpis_atingidos: zod_1.default.array(zod_1.default.string()).optional(),
    // Multiple activities for Ajudantes de Armazém
    multiple_activities: zod_1.default.array(exports.MultipleActivitySchema).optional(),
    // Valid tasks for Operador de Empilhadeira
    nome_operador: zod_1.default.string().optional(),
    valid_tasks_count: zod_1.default.number().optional(),
});
// Calculator result schema
exports.CalculatorResultSchema = zod_1.default.object({
    subtotal_atividades: zod_1.default.number(),
    bonus_kpis: zod_1.default.number(),
    remuneracao_total: zod_1.default.number(),
    kpis_atingidos: zod_1.default.array(zod_1.default.string()),
    produtividade_alcancada: zod_1.default.number().optional(),
    nivel_atingido: zod_1.default.string().optional(),
    unidade_medida: zod_1.default.string().optional(),
    // Multiple activities details
    atividades_detalhes: zod_1.default.array(zod_1.default.object({
        nome: zod_1.default.string(),
        produtividade: zod_1.default.number(),
        nivel: zod_1.default.string(),
        valor_total: zod_1.default.number(),
        unidade: zod_1.default.string(),
    })).optional(),
    // Valid tasks details
    tarefas_validas: zod_1.default.number().optional(),
    valor_tarefas: zod_1.default.number().optional(),
});
// Lançamento schema
exports.LancamentoSchema = zod_1.default.object({
    id: zod_1.default.number().optional(),
    user_id: zod_1.default.number(),
    user_nome: zod_1.default.string(),
    user_cpf: zod_1.default.string(),
    data_lancamento: zod_1.default.string(),
    funcao: zod_1.default.string(),
    turno: zod_1.default.enum(["Manhã", "Tarde", "Noite"]),
    // Calculator input data
    nome_atividade: zod_1.default.string().optional(),
    quantidade_produzida: zod_1.default.number().optional(),
    tempo_horas: zod_1.default.number().optional(),
    input_adicional: zod_1.default.number().default(0),
    multiple_activities: zod_1.default.string().optional(), // JSON
    nome_operador: zod_1.default.string().optional(),
    valid_tasks_count: zod_1.default.number().optional(),
    kpis_atingidos: zod_1.default.string().optional(), // JSON
    // Calculator results
    subtotal_atividades: zod_1.default.number(),
    bonus_kpis: zod_1.default.number(),
    remuneracao_total: zod_1.default.number(),
    produtividade_alcancada: zod_1.default.number().optional(),
    nivel_atingido: zod_1.default.string().optional(),
    unidade_medida: zod_1.default.string().optional(),
    atividades_detalhes: zod_1.default.string().optional(), // JSON
    tarefas_validas: zod_1.default.number().optional(),
    valor_tarefas: zod_1.default.number().optional(),
    // Status
    status: zod_1.default.enum(["pendente", "aprovado", "reprovado"]).default("pendente"),
    observacoes: zod_1.default.string().optional(),
    // Edit tracking fields
    editado_por_admin: zod_1.default.string().optional(),
    data_edicao: zod_1.default.string().optional(),
    valores_originais: zod_1.default.string().optional(), // JSON backup
    status_edicao: zod_1.default.enum(["original", "editado_admin"]).default("original"),
    observacoes_edicao: zod_1.default.string().optional(),
    created_at: zod_1.default.string().optional(),
    updated_at: zod_1.default.string().optional(),
});
// KPI limit check schema
exports.KPILimitCheckSchema = zod_1.default.object({
    user_id: zod_1.default.number(),
    data_lancamento: zod_1.default.string(),
});
// Lançamento creation input
exports.CreateLancamentoSchema = zod_1.default.object({
    data_lancamento: zod_1.default.string().min(1, "Data é obrigatória"),
    user_id: zod_1.default.number().optional(),
    calculator_data: exports.CalculatorInputSchema,
    calculator_result: exports.CalculatorResultSchema,
});
// Admin validation schema
exports.AdminValidationSchema = zod_1.default.object({
    acao: zod_1.default.enum(["aprovar", "reprovar", "editar"]),
    observacoes: zod_1.default.string().optional(),
    dados_editados: exports.CalculatorInputSchema.optional(),
});
// History schema for approved entries
exports.HistoricoAprovacaoSchema = zod_1.default.object({
    id: zod_1.default.number().optional(),
    lancamento_id: zod_1.default.number(),
    colaborador_id: zod_1.default.number(),
    colaborador_nome: zod_1.default.string(),
    colaborador_cpf: zod_1.default.string(),
    data_lancamento: zod_1.default.string(),
    data_aprovacao: zod_1.default.string(),
    aprovado_por: zod_1.default.string(),
    editado: zod_1.default.boolean(),
    editado_por: zod_1.default.string().optional(),
    dados_finais: zod_1.default.string(), // JSON
    observacoes: zod_1.default.string().optional(),
    remuneracao_total: zod_1.default.number(),
    created_at: zod_1.default.string().optional(),
    updated_at: zod_1.default.string().optional(),
});
// Exportação schemas
exports.ExportFilterSchema = zod_1.default.object({
    periodo_inicio: zod_1.default.string().optional(),
    periodo_fim: zod_1.default.string().optional(),
    funcao: zod_1.default.string().optional(),
    colaborador_id: zod_1.default.number().optional(),
    status: zod_1.default.enum(["pendente", "aprovado", "reprovado", "todos"]).default("aprovado"),
});
exports.ExportLogSchema = zod_1.default.object({
    id: zod_1.default.number().optional(),
    admin_id: zod_1.default.number(),
    admin_nome: zod_1.default.string(),
    filtros_aplicados: zod_1.default.string().optional(), // JSON
    formato_exportacao: zod_1.default.enum(["csv", "xlsx", "pdf"]),
    total_registros: zod_1.default.number(),
    nome_arquivo: zod_1.default.string().optional(),
    data_exportacao: zod_1.default.string().optional(),
    ip_origem: zod_1.default.string().optional(),
    created_at: zod_1.default.string().optional(),
    updated_at: zod_1.default.string().optional(),
});
