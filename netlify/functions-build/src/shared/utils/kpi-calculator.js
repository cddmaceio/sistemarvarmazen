"use strict";
// Utilitário para calcular valor dinâmico dos KPIs baseado nos dias úteis do mês
Object.defineProperty(exports, "__esModule", { value: true });
exports.calcularDiasUteisMes = calcularDiasUteisMes;
exports.calcularValorKpiDinamico = calcularValorKpiDinamico;
exports.calcularInfoKpiMes = calcularInfoKpiMes;
exports.calcularValorKpiMesAtual = calcularValorKpiMesAtual;
exports.exemploCalculos = exemploCalculos;
/**
 * Calcula o número de dias úteis (segunda a sábado) em um mês específico
 * @param year Ano (ex: 2025)
 * @param month Mês (1-12)
 * @returns Número de dias úteis no mês
 */
function calcularDiasUteisMes(year, month) {
    const diasUteis = [];
    const ultimoDia = new Date(year, month, 0).getDate();
    for (let dia = 1; dia <= ultimoDia; dia++) {
        const data = new Date(year, month - 1, dia);
        const diaSemana = data.getDay(); // 0 = domingo, 1 = segunda, ..., 6 = sábado
        // Incluir segunda (1) a sábado (6), excluir domingo (0)
        if (diaSemana >= 1 && diaSemana <= 6) {
            diasUteis.push(dia);
        }
    }
    return diasUteis.length;
}
/**
 * Calcula o valor dinâmico por KPI baseado no orçamento mensal fixo
 * @param year Ano do mês
 * @param month Mês (1-12)
 * @param orcamentoMensal Orçamento fixo mensal (padrão: R$ 150,00)
 * @param maxKpisPorDia Máximo de KPIs por dia (padrão: 2)
 * @returns Valor por KPI em reais
 */
function calcularValorKpiDinamico(year, month, orcamentoMensal = 150.00, maxKpisPorDia = 2) {
    const diasUteis = calcularDiasUteisMes(year, month);
    const totalKpisMes = diasUteis * maxKpisPorDia;
    const valorPorKpi = orcamentoMensal / totalKpisMes;
    // Arredondar para 2 casas decimais
    return Math.round(valorPorKpi * 100) / 100;
}
/**
 * Calcula informações completas sobre KPIs para um mês específico
 * @param year Ano do mês
 * @param month Mês (1-12)
 * @param orcamentoMensal Orçamento fixo mensal (padrão: R$ 150,00)
 * @param maxKpisPorDia Máximo de KPIs por dia (padrão: 2)
 * @returns Objeto com informações detalhadas
 */
function calcularInfoKpiMes(year, month, orcamentoMensal = 150.00, maxKpisPorDia = 2) {
    const diasUteis = calcularDiasUteisMes(year, month);
    const totalKpisMes = diasUteis * maxKpisPorDia;
    const valorPorKpi = calcularValorKpiDinamico(year, month, orcamentoMensal, maxKpisPorDia);
    const totalRealMes = totalKpisMes * valorPorKpi;
    return {
        diasUteis,
        totalKpisMes,
        valorPorKpi,
        totalRealMes,
        orcamentoMensal,
        maxKpisPorDia,
        mes: month,
        ano: year
    };
}
/**
 * Calcula o valor por KPI para o mês atual
 * @param orcamentoMensal Orçamento fixo mensal (padrão: R$ 150,00)
 * @param maxKpisPorDia Máximo de KPIs por dia (padrão: 2)
 * @returns Valor por KPI em reais
 */
function calcularValorKpiMesAtual(orcamentoMensal = 150.00, maxKpisPorDia = 2) {
    const agora = new Date();
    return calcularValorKpiDinamico(agora.getFullYear(), agora.getMonth() + 1, orcamentoMensal, maxKpisPorDia);
}
/**
 * Exemplos de uso e testes
 */
function exemploCalculos() {
    console.log('📊 Exemplos de Cálculo de KPIs Dinâmicos\n');
    // Agosto 2025 (26 dias úteis)
    const agosto2025 = calcularInfoKpiMes(2025, 8);
    console.log('Agosto 2025:', agosto2025);
    // Fevereiro 2025 (24 dias úteis)
    const fevereiro2025 = calcularInfoKpiMes(2025, 2);
    console.log('Fevereiro 2025:', fevereiro2025);
    // Dezembro 2024 (26 dias úteis)
    const dezembro2024 = calcularInfoKpiMes(2024, 12);
    console.log('Dezembro 2024:', dezembro2024);
    // Mês atual
    const mesAtual = calcularValorKpiMesAtual();
    console.log(`Valor KPI mês atual: R$ ${mesAtual}`);
}
