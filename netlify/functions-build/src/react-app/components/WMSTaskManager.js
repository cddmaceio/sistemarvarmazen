import React, { useState } from 'react';
import { useAuth } from '@/react-app/hooks/useAuth';
const WMSTaskManager = ({ selectedOperator, onCalculateProductivity, onDateChange }) => {
    const { user } = useAuth();
    const [csvData, setCsvData] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [selectedDate, setSelectedDate] = useState('');
    const [userStats, setUserStats] = useState({});
    const [showFilters, setShowFilters] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [error, setError] = useState(null);
    // Usar o usuário logado como operador fixo
    const currentOperator = user?.nome || selectedOperator || 'Usuário';
    // Função para converter data brasileira para Date
    const parseDate = (dateString) => {
        if (!dateString)
            return null;
        const match = dateString.match(/^(\d{2})\/(\d{2})\/(\d{4})\s(\d{2}):(\d{2}):(\d{2})/);
        if (!match)
            return null;
        const [, day, month, year, hours, minutes, seconds] = match;
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(minutes), parseInt(seconds));
    };
    // Função para processar o arquivo CSV
    const handleFileSelect = (selectedFile) => {
        if (!selectedFile)
            return;
        setIsProcessing(true);
        setShowFilters(false);
        setShowResults(false);
        setError(null);
        const reader = new FileReader();
        reader.onload = (e) => {
            setTimeout(() => {
                processData(e.target?.result);
                setIsProcessing(false);
            }, 500);
        };
        reader.readAsText(selectedFile, 'UTF-8');
    };
    // Função para processar dados do CSV
    const processData = (csvContent) => {
        try {
            const lines = csvContent.split(/\r\n|\n/);
            const csvHeaders = lines[0].split(';').map(h => h.trim());
            const requiredHeaders = ['Usuário', 'Data de Alteração', 'Data Última Associação', 'Data de Criação'];
            if (!requiredHeaders.every(h => csvHeaders.includes(h))) {
                setError(`O arquivo CSV não contém as colunas necessárias: ${requiredHeaders.join(', ')}.`);
                return;
            }
            const data = lines.slice(1)
                .map(line => line.split(';'))
                .filter(row => row.length === csvHeaders.length)
                .map(row => {
                let obj = {};
                csvHeaders.forEach((header, i) => {
                    obj[header] = row[i] ? row[i].trim() : '';
                });
                return obj;
            });
            setCsvData(data);
            setShowFilters(true);
        }
        catch (err) {
            setError('Erro ao processar arquivo CSV');
        }
    };
    // Função para analisar dados
    const analyzeData = () => {
        if (!selectedDate) {
            setError('Por favor, selecione uma data.');
            return;
        }
        // Filtrar dados por data (usando Data Última Associação)
        const dateFilteredData = csvData.filter(row => {
            if (!selectedDate)
                return true;
            const dataAssociacao = parseDate(row['Data Última Associação']);
            if (!dataAssociacao)
                return false;
            const [year, month, day] = selectedDate.split('-').map(Number);
            const dateMatch = dataAssociacao.getFullYear() === year &&
                (dataAssociacao.getMonth() + 1) === month &&
                dataAssociacao.getDate() === day;
            return dateMatch;
        });
        // Calcular estatísticas para cada usuário
        const stats = {};
        dateFilteredData.forEach(row => {
            const user = row['Usuário'];
            if (!user)
                return;
            if (!stats[user]) {
                stats[user] = { total: 0, valid: 0, invalid: 0 };
            }
            stats[user].total++;
            const dateAlteracao = parseDate(row['Data de Alteração']);
            const dateAssociacao = parseDate(row['Data Última Associação']);
            if (dateAlteracao && dateAssociacao) {
                const differenceInSeconds = (dateAlteracao.getTime() - dateAssociacao.getTime()) / 1000;
                if (differenceInSeconds > 15) {
                    stats[user].valid++;
                }
                else {
                    stats[user].invalid++;
                }
            }
            else {
                stats[user].invalid++;
            }
        });
        // Filtrar apenas o usuário logado
        const finalStats = {};
        if (stats[currentOperator]) {
            finalStats[currentOperator] = stats[currentOperator];
        }
        setUserStats(finalStats);
        setShowResults(true);
        setError(null);
    };
    // Função para calcular produtividade
    const handleCalculateProductivity = () => {
        const operatorStats = userStats[currentOperator];
        if (!operatorStats || !selectedDate) {
            setError('Dados insuficientes para calcular produtividade.');
            return;
        }
        onCalculateProductivity({
            nome_operador: currentOperator,
            valid_tasks_count: operatorStats.valid,
            data_referencia: selectedDate
        });
    };
    // Função para resetar o formulário
    const resetForm = () => {
        setCsvData([]);
        setSelectedDate('');
        setUserStats({});
        setShowFilters(false);
        setShowResults(false);
        setError(null);
    };
    // Interface do usuário
    return (<div className="space-y-6">
      {/* Título */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Análise de Produtividade WMS</h2>
        <p className="text-gray-600 mt-2">Faça upload do arquivo CSV para analisar as tarefas</p>
      </div>

      {/* Upload de arquivo */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">1. Selecionar Arquivo CSV</h3>
        <div className="space-y-4">
          <input type="file" accept=".csv" onChange={(e) => handleFileSelect(e.target.files?.[0] || null)} disabled={isProcessing} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
          {isProcessing && (<div className="text-blue-600">
              <div className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2"></div>
              Processando arquivo...
            </div>)}
        </div>
      </div>

      {/* Filtros */}
      {showFilters && (<div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">2. Filtros de Análise</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Usuário (Fixado)
              </label>
              <input type="text" value={currentOperator} disabled className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data de Referência
              </label>
              <input type="date" value={selectedDate} onChange={(e) => {
                setSelectedDate(e.target.value);
                onDateChange?.(e.target.value);
            }} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"/>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={analyzeData} disabled={!selectedDate} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed">
              Analisar Dados
            </button>
            <button onClick={resetForm} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700">
              Resetar
            </button>
          </div>
        </div>)}

      {/* Resultados */}
      {showResults && (<div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">3. Resultados da Análise</h3>
            
            {/* Cards de resumo */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-blue-800">Total de Tarefas</h4>
                <p className="text-2xl font-bold text-blue-900">
                  {userStats[currentOperator]?.total || 0}
                </p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-red-800">Tarefas Inválidas</h4>
                <p className="text-2xl font-bold text-red-900">
                  {userStats[currentOperator]?.invalid || 0}
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-green-800">Tarefas Válidas</h4>
                <p className="text-2xl font-bold text-green-900">
                  {userStats[currentOperator]?.valid || 0}
                </p>
              </div>
            </div>

            {/* Tabela de resultados */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usuário
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Inválidas
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Válidas
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {userStats[currentOperator] ? (<tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {currentOperator}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {userStats[currentOperator].total}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                        {userStats[currentOperator].invalid}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                        {userStats[currentOperator].valid}
                      </td>
                    </tr>) : (<tr>
                      <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                        Nenhuma tarefa encontrada para os filtros selecionados
                      </td>
                    </tr>)}
                </tbody>
              </table>
            </div>

            {/* Botão de calcular produtividade */}
            <div className="mt-6">
              <button onClick={handleCalculateProductivity} disabled={!userStats[currentOperator] || !selectedDate} className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed">
                Calcular Produtividade
              </button>
            </div>
          </div>
        </div>)}

      {/* Mensagem de erro */}
      {error && (<div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Erro</h3>
              <div className="mt-2 text-sm text-red-700">
                {error}
              </div>
            </div>
          </div>
        </div>)}
    </div>);
};
export default WMSTaskManager;
