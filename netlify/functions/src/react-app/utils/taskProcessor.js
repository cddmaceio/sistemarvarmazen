"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TASK_METAS = void 0;
exports.parseDateTime = parseDateTime;
exports.calculateValidTasks = calculateValidTasks;
exports.parseCSV = parseCSV;
exports.TASK_METAS = [
    { tipo: 'Armazenagem (Mapa)', meta_segundos: 30 },
    { tipo: 'Carregamento AG', meta_segundos: 10 },
    { tipo: 'Carregamento Palete Fechado (AS)', meta_segundos: 10 },
    { tipo: 'Carregamento Palete Fechado (Rota)', meta_segundos: 10 },
    { tipo: 'Carregamento Palete Misto (AS)', meta_segundos: 10 },
    { tipo: 'Carregamento Palete Misto (Rota)', meta_segundos: 10 },
    { tipo: 'Movimentação de Remontagem', meta_segundos: 30 },
    { tipo: 'Movimentação Interna - Manual', meta_segundos: 30 },
    { tipo: 'Puxada Descarregamento', meta_segundos: 10 },
    { tipo: 'Ressuprimento Inteligente - Demanda', meta_segundos: 30 },
    { tipo: 'Ressuprimento Inteligente - Execução', meta_segundos: 30 },
    { tipo: 'Ressuprimento Manual', meta_segundos: 30 },
    { tipo: 'Retorno de Rota (Descarregamento)', meta_segundos: 10 },
];
function parseDateTime(dateTimeStr) {
    if (!dateTimeStr || dateTimeStr.trim() === '')
        return null;
    // Formato esperado: DD/MM/YYYY HH:mm:ss
    const match = dateTimeStr.match(/(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2}):(\d{2})/);
    if (match) {
        const [, day, month, year, hour, minute, second] = match;
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute), parseInt(second));
    }
    return null;
}
// Função simples para verificar se o nome do operador corresponde
function isOperatorMatch(taskOperator, searchOperator) {
    if (!taskOperator || !searchOperator)
        return false;
    const taskName = taskOperator.trim().toUpperCase();
    const searchName = searchOperator.trim().toUpperCase();
    // Match exato ou um contém o outro
    return taskName === searchName ||
        taskName.includes(searchName) ||
        searchName.includes(taskName);
}
function calculateValidTasks(tasks, operatorName) {
    console.log('=== PROCESSAMENTO DE TAREFAS VÁLIDAS ===');
    console.log('Operador procurado:', operatorName);
    console.log('Total de tarefas:', tasks.length);
    if (!operatorName || tasks.length === 0) {
        return { total: 0, detalhes: [] };
    }
    // Agrupar tarefas por tipo (como tabela dinâmica)
    const tasksByType = {};
    let operatorTasksCount = 0;
    // Filtrar tarefas do operador e agrupar por tipo
    for (const task of tasks) {
        // Verificar se é do operador
        if (!isOperatorMatch(task.Usuário, operatorName)) {
            continue;
        }
        operatorTasksCount++;
        // Verificar se tarefa foi concluída
        if (task['Concluída Task'] !== '1') {
            continue;
        }
        // Agrupar por tipo
        if (!tasksByType[task.Tipo]) {
            tasksByType[task.Tipo] = [];
        }
        tasksByType[task.Tipo].push(task);
    }
    console.log('Tarefas do operador encontradas:', operatorTasksCount);
    console.log('Tipos de tarefa encontrados:', Object.keys(tasksByType));
    // Processar cada tipo de tarefa
    const detalhes = [];
    let totalValidTasks = 0;
    for (const [tipo, tasksOfType] of Object.entries(tasksByType)) {
        // Verificar se existe meta para este tipo
        const meta = exports.TASK_METAS.find(m => m.tipo === tipo);
        if (!meta) {
            console.log(`Tipo sem meta definida: ${tipo}`);
            continue;
        }
        // Contar tarefas válidas deste tipo
        let validTasksOfType = 0;
        for (const task of tasksOfType) {
            const dataAssociacao = parseDateTime(task['Data Última Associação']);
            const dataAlteracao = parseDateTime(task['Data de Alteração']);
            if (!dataAssociacao || !dataAlteracao) {
                continue;
            }
            // Calcular tempo de execução
            const tempoExecucaoMs = dataAlteracao.getTime() - dataAssociacao.getTime();
            const tempoExecucaoSegundos = Math.abs(tempoExecucaoMs / 1000);
            // Verificar se está dentro da meta
            if (tempoExecucaoSegundos <= meta.meta_segundos) {
                validTasksOfType++;
            }
        }
        if (validTasksOfType > 0) {
            detalhes.push({
                tipo: tipo,
                quantidade: validTasksOfType,
                meta_segundos: meta.meta_segundos
            });
            totalValidTasks += validTasksOfType;
        }
        console.log(`${tipo}: ${validTasksOfType} tarefas válidas de ${tasksOfType.length} total`);
    }
    console.log('TOTAL DE TAREFAS VÁLIDAS:', totalValidTasks);
    console.log('VALOR TOTAL: R$', (totalValidTasks * 0.093).toFixed(2));
    return { total: totalValidTasks, detalhes };
}
function parseCSV(csvContent) {
    console.log('=== PARSING CSV ===');
    const lines = csvContent.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
        console.log('Arquivo vazio ou inválido');
        return [];
    }
    console.log('Total de linhas:', lines.length);
    // Usar primeira linha como header de referência
    const headerLine = lines[0];
    console.log('Header:', headerLine);
    // Encontrar posições dos campos obrigatórios
    const requiredFields = ['Tipo', 'Data Última Associação', 'Data de Alteração', 'Concluída Task', 'Usuário'];
    const fieldPositions = {};
    for (const field of requiredFields) {
        const pos = headerLine.indexOf(field);
        if (pos !== -1) {
            fieldPositions[field] = pos;
        }
    }
    console.log('Posições dos campos:', fieldPositions);
    // Se não encontrou todos os campos, tentar parsing por separador
    if (Object.keys(fieldPositions).length < requiredFields.length) {
        console.log('Tentando parsing por separador...');
        return parseCSVBySeparator(lines);
    }
    // Parsing por posição
    const tasks = [];
    const sortedFields = Object.entries(fieldPositions).sort((a, b) => a[1] - b[1]);
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        const task = {};
        for (let j = 0; j < sortedFields.length; j++) {
            const [fieldName, startPos] = sortedFields[j];
            const endPos = j < sortedFields.length - 1 ? sortedFields[j + 1][1] : line.length;
            let value = line.substring(startPos, endPos).trim();
            // Remover header se apareceu na linha
            if (value.startsWith(fieldName)) {
                value = value.substring(fieldName.length).trim();
            }
            task[fieldName] = value;
        }
        // Validar se tem dados mínimos
        if (task['Tipo'] && task['Usuário'] && task['Usuário'].trim() !== '') {
            tasks.push(task);
        }
    }
    console.log('Tarefas parseadas:', tasks.length);
    if (tasks.length > 0) {
        console.log('Primeira tarefa:', tasks[0]);
        const operators = [...new Set(tasks.map(t => t.Usuário?.trim()).filter(Boolean))];
        console.log('Operadores encontrados:', operators);
    }
    return tasks;
}
function parseCSVBySeparator(lines) {
    console.log('Parsing por separador...');
    const headerLine = lines[0];
    let headers = [];
    // Tentar diferentes separadores
    if (headerLine.includes(';')) {
        headers = headerLine.split(';').map(h => h.trim());
    }
    else if (headerLine.includes('\t')) {
        headers = headerLine.split('\t').map(h => h.trim());
    }
    else if (headerLine.includes(',')) {
        headers = headerLine.split(',').map(h => h.trim());
    }
    else {
        // Split por múltiplos espaços
        headers = headerLine.split(/\s{2,}/).filter(h => h.trim()).map(h => h.trim());
    }
    console.log('Headers encontrados:', headers);
    const tasks = [];
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        let values = [];
        if (headerLine.includes(';')) {
            values = line.split(';').map(v => v.trim());
        }
        else if (headerLine.includes('\t')) {
            values = line.split('\t').map(v => v.trim());
        }
        else if (headerLine.includes(',')) {
            values = line.split(',').map(v => v.trim());
        }
        else {
            values = line.split(/\s{2,}/).filter(v => v.trim()).map(v => v.trim());
        }
        const task = {};
        headers.forEach((header, index) => {
            task[header] = values[index] || '';
        });
        if (task['Tipo'] && task['Usuário'] && task['Usuário'].trim() !== '') {
            tasks.push(task);
        }
    }
    console.log('Tarefas parseadas por separador:', tasks.length);
    return tasks;
}
