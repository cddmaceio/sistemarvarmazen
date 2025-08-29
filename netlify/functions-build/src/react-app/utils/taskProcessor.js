export const TASK_METAS = [
    { tipo: 'Armazenagem (Mapa)', meta_segundos: 30 },
    { tipo: 'Carregamento AG', meta_segundos: 10 },
    { tipo: 'Carregamento Palete Fechado (AS)', meta_segundos: 10 },
    { tipo: 'Carregamento Palete Fechado (Rota)', meta_segundos: 10 },
    { tipo: 'Carregamento Palete Misto (AS)', meta_segundos: 10 },
    { tipo: 'Carregamento Palete Misto (Rota)', meta_segundos: 10 },
    { tipo: 'Contagem de estoque', meta_segundos: 60 },
    { tipo: 'Movimentação de Remontagem', meta_segundos: 30 },
    { tipo: 'Movimentação Interna - Manual', meta_segundos: 30 },
    { tipo: 'Puxada Descarregamento', meta_segundos: 10 },
    { tipo: 'Ressuprimento Inteligente - Demanda', meta_segundos: 30 },
    { tipo: 'Ressuprimento Inteligente - Execução', meta_segundos: 30 },
    { tipo: 'Ressuprimento Manual', meta_segundos: 30 },
    { tipo: 'Retorno de Rota (Descarregamento)', meta_segundos: 10 },
];
export function parseDateTime(dateTimeStr) {
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
// Função para normalizar nomes removendo pontos e caracteres especiais
function normalizeName(name) {
    return name.trim().toUpperCase().replace(/[.\s]+/g, ' ').trim();
}
// Função simples para verificar se o nome do operador corresponde
export function isOperatorMatch(taskOperator, searchOperator) {
    if (!taskOperator || !searchOperator)
        return false;
    const taskName = normalizeName(taskOperator);
    const searchName = normalizeName(searchOperator);
    return taskName === searchName ||
        taskName.includes(searchName) ||
        searchName.includes(taskName);
}
export function calculateValidTasks(tasks, operatorName) {
    console.log('=== PROCESSAMENTO DE TAREFAS VÁLIDAS ===');
    console.log('Operador procurado:', operatorName);
    console.log('Total de tarefas:', tasks.length);
    if (!operatorName || tasks.length === 0) {
        return { total: 0, detalhes: [] };
    }
    // Debug: mostrar alguns operadores únicos encontrados
    const uniqueOperators = [...new Set(tasks.map(t => t.Usuário).filter(u => u && u.trim()))];
    console.log('Total de operadores únicos:', uniqueOperators.length);
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
        const meta = TASK_METAS.find(m => m.tipo === tipo);
        if (!meta) {
            console.log(`Tipo sem meta definida: ${tipo}`);
            continue;
        }
        // Contar tarefas válidas deste tipo
        let validTasksOfType = 0;
        console.log(`\n--- Analisando tipo: ${tipo} (meta: ${meta.meta_segundos}s) ---`);
        console.log(`Total de tarefas deste tipo: ${tasksOfType.length}`);
        for (const task of tasksOfType) {
            const dataAssociacao = parseDateTime(task['Data Última Associação']);
            const dataAlteracao = parseDateTime(task['Data de Alteração']);
            console.log(`Tarefa: Data Associação='${task['Data Última Associação']}', Data Alteração='${task['Data de Alteração']}'`);
            if (!dataAssociacao || !dataAlteracao) {
                console.log('  ❌ Datas inválidas - tarefa ignorada');
                continue;
            }
            // Calcular tempo de execução
            const tempoExecucaoMs = dataAlteracao.getTime() - dataAssociacao.getTime();
            const tempoExecucaoSegundos = Math.abs(tempoExecucaoMs / 1000);
            console.log(`  Tempo execução: ${tempoExecucaoSegundos}s`);
            // Verificar se tarefa é válida: >10s = válida, ≤10s = inválida
            // E também deve estar dentro da meta específica do tipo de tarefa
            if (tempoExecucaoSegundos > 10 && tempoExecucaoSegundos <= meta.meta_segundos) {
                console.log(`  ✅ Tarefa VÁLIDA (${tempoExecucaoSegundos}s > 10s e <= ${meta.meta_segundos}s)`);
                validTasksOfType++;
            }
            else {
                console.log(`  ❌ Tarefa INVÁLIDA (${tempoExecucaoSegundos}s - deve ser > 10s e <= ${meta.meta_segundos}s)`);
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
export function parseCSV(csvContent) {
    console.log('=== PARSING CSV ===');
    // Verificar se o arquivo está corrompido (contém apenas timestamps)
    if (isCorruptedFile(csvContent)) {
        console.log('Arquivo corrompido detectado!');
        return parseFragmentedData(csvContent);
    }
    const lines = csvContent.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
        console.log('Arquivo vazio ou inválido');
        return [];
    }
    console.log('Total de linhas:', lines.length);
    console.log('Primeiras 3 linhas:', lines.slice(0, 3));
    // Usar primeira linha como header de referência
    const headerLine = lines[0];
    console.log('Header:', headerLine);
    // Sempre usar parsing por separador para arquivos CSV
    console.log('Usando parsing por separador...');
    return parseCSVBySeparator(lines);
}
function isCorruptedFile(csvContent) {
    // Verificar se o arquivo tem cabeçalho válido
    const firstLine = csvContent.split('\n')[0];
    const hasValidHeader = firstLine.includes('Usuário') && firstLine.includes('Tipo') && firstLine.includes('Data');
    if (hasValidHeader) {
        return false; // Arquivo com cabeçalho válido não é corrompido
    }
    // Verificar se contém dados estruturados mesmo que fragmentados
    const hasStructuredData = csvContent.includes('Armazém') &&
        csvContent.includes('Usuário') &&
        csvContent.includes('Tipo') &&
        csvContent.includes('Data');
    if (hasStructuredData) {
        return true; // Tem dados válidos mas fragmentados - tentar reconstruir
    }
    // Verificar se o arquivo contém apenas timestamps sem estrutura
    const timestampPatterns = [
        /^\d+\.\d+;\d{2}\/\d{2}\/\d{4}/, // linha começando com: 40.322059;20/08/2025
        /^\d+;\d{2}\/\d{2}\/\d{4}/, // linha começando com: 898480;19/08/2025
        /^\d{2}:\d{2}:\d{2}\.\d+;\d{2}\/\d{2}\/\d{2}/, // linha começando com: 6:25:13.119178;19/08/202
    ];
    const lines = csvContent.split('\n').filter(line => line.trim());
    let timestampLines = 0;
    for (const line of lines.slice(0, 10)) {
        for (const pattern of timestampPatterns) {
            if (pattern.test(line.trim())) {
                timestampLines++;
                break;
            }
        }
    }
    // Se mais de 80% das linhas são apenas timestamps, é realmente corrompido
    return timestampLines >= Math.min(lines.length * 0.8, 8);
}
function parseFragmentedData(csvContent) {
    console.log('Tentando reconstruir dados fragmentados...');
    // Tentar reconstruir o CSV a partir dos fragmentos
    try {
        // Remover aspas simples e tentar juntar fragmentos
        let reconstructed = csvContent.replace(/'/g, '');
        // Tentar identificar quebras de linha perdidas
        // Padrão: timestamp;data seguido de texto
        reconstructed = reconstructed.replace(/(\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}:\d{2}[^\n]*)(\w)/g, '$1\n$2');
        // Tentar parsing normal
        const lines = reconstructed.split('\n').filter(line => line.trim());
        console.log('Linhas reconstruídas:', lines.length);
        if (lines.length > 1) {
            return parseCSVBySeparator(lines);
        }
    }
    catch (error) {
        console.error('Erro ao reconstruir dados:', error);
    }
    // Se não conseguiu reconstruir, mostrar alerta
    alert(`❌ ARQUIVO CORROMPIDO DETECTADO\n\n` +
        `O arquivo contém dados fragmentados que não puderam ser reconstruídos.\n\n` +
        `📋 COMO OBTER O ARQUIVO CORRETO:\n` +
        `1. Acesse o sistema WMS\n` +
        `2. Vá para Relatórios > Tarefas de Operadores\n` +
        `3. Selecione o período desejado\n` +
        `4. Exporte como CSV com TODAS as colunas\n\n` +
        `📊 COLUNAS OBRIGATÓRIAS:\n` +
        `• Tipo (tipo da tarefa)\n` +
        `• Usuário (nome do operador)\n` +
        `• Data Última Associação\n` +
        `• Data de Alteração\n` +
        `• Concluída Task (1 = sim, 0 = não)`);
    return [];
}
function parseCSVBySeparator(lines) {
    console.log('=== PARSING POR SEPARADOR ===');
    if (lines.length === 0)
        return [];
    const header = lines[0].trim();
    console.log('Header:', header);
    // Detectar separador
    let separator = ';';
    if (header.includes(';')) {
        separator = ';';
    }
    else if (header.includes('\t')) {
        separator = '\t';
    }
    else if (header.includes(',')) {
        separator = ',';
    }
    else if (header.includes('  ')) {
        separator = /\s{2,}/; // múltiplos espaços
    }
    console.log('Separador detectado:', separator);
    // Dividir cabeçalho
    const headers = typeof separator === 'string'
        ? header.split(separator).map(h => h.trim())
        : header.split(separator).map(h => h.trim());
    console.log('Cabeçalhos encontrados:', headers.length);
    console.log('Cabeçalhos:', headers);
    // Verificar se temos os campos obrigatórios
    const requiredFields = ['Tipo', 'Data Última Associação', 'Data de Alteração', 'Concluída Task', 'Usuário'];
    const missingFields = requiredFields.filter(field => !headers.includes(field));
    if (missingFields.length > 0) {
        console.warn('Campos obrigatórios ausentes:', missingFields);
    }
    // Encontrar índices dos campos obrigatórios
    const fieldIndexes = {
        Tipo: headers.indexOf('Tipo'),
        'Data Última Associação': headers.indexOf('Data Última Associação'),
        'Data de Alteração': headers.indexOf('Data de Alteração'),
        'Concluída Task': headers.indexOf('Concluída Task'),
        Usuário: headers.indexOf('Usuário')
    };
    console.log('Índices dos campos:', fieldIndexes);
    const tasks = [];
    // Processar linhas de dados (pular cabeçalho)
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line)
            continue;
        // Dividir linha pelos separadores
        const values = typeof separator === 'string'
            ? line.split(separator).map(v => v.trim())
            : line.split(separator).map(v => v.trim());
        // Log da primeira linha para debug
        if (i === 1) {
            console.log('Primeira linha de dados:', line);
            console.log('Valores divididos:', values);
            console.log('Quantidade de valores:', values.length);
            console.log('Mapeamento dos campos:');
            console.log('  Tipo (índice', fieldIndexes.Tipo, '):', values[fieldIndexes.Tipo]);
            console.log('  Usuário (índice', fieldIndexes.Usuário, '):', values[fieldIndexes.Usuário]);
            console.log('  Data Última Associação (índice', fieldIndexes['Data Última Associação'], '):', values[fieldIndexes['Data Última Associação']]);
            console.log('  Data de Alteração (índice', fieldIndexes['Data de Alteração'], '):', values[fieldIndexes['Data de Alteração']]);
            console.log('  Concluída Task (índice', fieldIndexes['Concluída Task'], '):', values[fieldIndexes['Concluída Task']]);
        }
        // Verificar se temos valores suficientes
        if (values.length < Math.max(...Object.values(fieldIndexes).filter(idx => idx >= 0)) + 1) {
            console.warn(`Linha ${i + 1} tem poucos valores (${values.length}), esperado pelo menos ${Math.max(...Object.values(fieldIndexes).filter(idx => idx >= 0)) + 1}`);
            continue;
        }
        // Mapear valores para campos
        const task = {
            Tipo: fieldIndexes.Tipo >= 0 ? (values[fieldIndexes.Tipo] || '') : '',
            'Data Última Associação': fieldIndexes['Data Última Associação'] >= 0 ? (values[fieldIndexes['Data Última Associação']] || '') : '',
            'Data de Alteração': fieldIndexes['Data de Alteração'] >= 0 ? (values[fieldIndexes['Data de Alteração']] || '') : '',
            'Concluída Task': fieldIndexes['Concluída Task'] >= 0 ? (values[fieldIndexes['Concluída Task']] || '') : '',
            Usuário: fieldIndexes.Usuário >= 0 ? (values[fieldIndexes.Usuário] || '') : ''
        };
        // Log da primeira tarefa mapeada
        if (i === 1) {
            console.log('Primeira tarefa mapeada:', task);
        }
        tasks.push(task);
    }
    console.log('Total de tarefas parseadas:', tasks.length);
    // Mostrar operadores únicos encontrados
    const uniqueOperators = [...new Set(tasks.map(t => t.Usuário).filter(u => u && u.trim()))];
    console.log('Operadores únicos encontrados:', uniqueOperators.slice(0, 10)); // Primeiros 10
    return tasks;
}
