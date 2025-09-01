import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/Card';
import { Download, Filter } from 'lucide-react';
import UserMenu from '@/components/UserMenu';
import * as XLSX from 'xlsx';

interface MonthlyEarningsData {
  id: number;
  nome: string;
  cpf: string;
  funcao: string;
  valorKpi: number;
  valorAtividade: number; // Para Ajudante de Armazém
  valorTarefas: number;   // Para Operador de Empilhadeira
  valorFinal: number;
  percentualMeta: number;
  ganhoTotal: number;
  totalLancamentos: number;
  mediaGanho: number;
  detalhes: {
    data: string;
    atividade: string;
    turno: string;
    remuneracao: number;
    produtividade: number;
    bonusKpis: number;
  }[];
}

const ProductivityDashboard: React.FC = () => {
  const [monthlyEarningsData, setMonthlyEarningsData] = useState<MonthlyEarningsData[]>([]);
  const [earningsLoading, setEarningsLoading] = useState(false);
  
  // Estados para filtros
  const [selectedFuncao, setSelectedFuncao] = useState<string>('');
  const [selectedMesAno, setSelectedMesAno] = useState<string>('');
  
  // Funções disponíveis
  const funcoesDisponiveis = ['Ajudante de Armazém', 'Operador de Empilhadeira'];
  
  // Meta fixa de R$ 300,00
  const META_VALOR = 300;
  
  // Gerar opções de mês/ano (últimos 12 meses)
  const generateMonthOptions = () => {
    const options = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      options.push({ value, label });
    }
    return options;
  };
  
  const monthOptions = generateMonthOptions();

  // Função para exportar dados para XLSX
  const exportToXLSX = () => {
    if (monthlyEarningsData.length === 0) {
      alert('Não há dados para exportar');
      return;
    }

    const exportData = monthlyEarningsData.map(item => ({
      'Nome': item.nome,
      'Função': item.funcao,
      'Valor KPI': `R$ ${item.valorKpi.toFixed(2)}`,
      'Valor Atividade': item.funcao === 'Ajudante de Armazém' ? `R$ ${item.valorAtividade.toFixed(2)}` : '-',
      'Valor Tarefas': item.funcao === 'Operador de Empilhadeira' ? `R$ ${item.valorTarefas.toFixed(2)}` : '-',
      'Valor Final': `R$ ${item.valorFinal.toFixed(2)}`,
      '% da Meta': `${item.percentualMeta.toFixed(1)}%`
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Ganhos Mensais');
    
    const fileName = `ganhos_mensais_${selectedMesAno || 'atual'}_${selectedFuncao || 'todas_funcoes'}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  // Função para carregar dados de ganhos mensais
  const loadMonthlyEarnings = async () => {
    try {
      setEarningsLoading(true);
      console.log('Carregando dados de ganhos mensais...');
      
      const params = new URLSearchParams();
      if (selectedFuncao) params.append('funcao', selectedFuncao);
      if (selectedMesAno) params.append('mesAno', selectedMesAno);
      
      const url = `/api/monthly-earnings${params.toString() ? '?' + params.toString() : ''}`;
      console.log('URL da requisição:', url);
      
      const response = await fetch(url);
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Erro na resposta da API:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        throw new Error(`API Error: ${response.status} - ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('Dados de ganhos recebidos:', result);
      
      if (result.success && result.data && Array.isArray(result.data)) {
        // Processar dados para incluir cálculos necessários
        const processedData = result.data.map((item: any) => {
          const valorFinal = item.valor_final || 0;
          const percentualMeta = (valorFinal / META_VALOR) * 100;

          return {
            ...item,
            valorKpi: item.valor_kpi || 0,
            valorAtividade: item.valor_atividade || 0,
            valorTarefas: item.valor_tarefas || 0,
            valorFinal,
            percentualMeta,
          };
        });
        
        setMonthlyEarningsData(processedData);
        console.log('Dados de ganhos mensais carregados com sucesso');
      } else {
        console.warn('Dados de ganhos vazios ou inválidos recebidos');
        setMonthlyEarningsData([]);
      }
    } catch (error) {
      console.error('Erro na requisição de dados de ganhos mensais:', error);
      setMonthlyEarningsData([]);
    } finally {
      setEarningsLoading(false);
    }
  };

  // Carregar dados iniciais
  useEffect(() => {
    loadMonthlyEarnings();
  }, []);
  
  // Carregar dados de ganhos mensais quando os filtros mudarem
  useEffect(() => {
    loadMonthlyEarnings();
  }, [selectedFuncao, selectedMesAno]);

  return (
    <div className="space-y-6">
      {/* Header da página */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Ganhos Mensais por Colaborador
          </h1>
          <p className="text-gray-600 mt-2">
            Relatório detalhado de ganhos por colaborador com meta de R$ {META_VALOR.toFixed(2)}
          </p>
        </div>
        <UserMenu />
      </div>

      {/* Seção de Ganhos Mensais por Colaborador */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Ganhos Mensais por Colaborador
              </CardTitle>
              <CardDescription>Filtros e relatório detalhado de ganhos por colaborador</CardDescription>
            </div>
            <button
              onClick={exportToXLSX}
              disabled={monthlyEarningsData.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              <Download className="h-4 w-4" />
              Exportar XLSX
            </button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filtros */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Função
              </label>
              <select
                value={selectedFuncao}
                onChange={(e) => setSelectedFuncao(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todas as funções</option>
                {funcoesDisponiveis.map((funcao) => (
                  <option key={funcao} value={funcao}>
                    {funcao}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mês/Ano
              </label>
              <select
                value={selectedMesAno}
                onChange={(e) => setSelectedMesAno(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Mês atual</option>
                {monthOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex items-end">
              <button
                onClick={loadMonthlyEarnings}
                disabled={earningsLoading}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {earningsLoading ? 'Carregando...' : 'Atualizar Dados'}
              </button>
            </div>
          </div>

          {/* Tabela de Ganhos */}
          {earningsLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-lg text-gray-600">Carregando dados de ganhos...</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              {monthlyEarningsData.length > 0 ? (
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 px-4 py-2 text-left">Nome</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Função</th>
                      <th className="border border-gray-300 px-4 py-2 text-center">Valor KPI</th>
                      <th className="border border-gray-300 px-4 py-2 text-center">Valor Atividade</th>
                      <th className="border border-gray-300 px-4 py-2 text-center">Valor Tarefas</th>
                      <th className="border border-gray-300 px-4 py-2 text-center">Valor Final</th>
                      <th className="border border-gray-300 px-4 py-2 text-center">% da Meta</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyEarningsData.map((item, index) => (
                      <tr key={item.id || index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="border border-gray-300 px-4 py-2 font-medium">{item.nome}</td>
                        <td className="border border-gray-300 px-4 py-2">{item.funcao}</td>
                        <td className="border border-gray-300 px-4 py-2 text-center">
                          R$ {item.valorKpi.toFixed(2)}
                        </td>
                        <td className="border border-gray-300 px-4 py-2 text-center">
                          {item.funcao === 'Ajudante de Armazém' ? (
                            <span className="text-blue-600 font-medium">
                              R$ {item.valorAtividade.toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="border border-gray-300 px-4 py-2 text-center">
                          {item.funcao === 'Operador de Empilhadeira' ? (
                            <span className="text-green-600 font-medium">
                              R$ {item.valorTarefas.toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="border border-gray-300 px-4 py-2 text-center">
                          <span className="font-bold text-lg">
                            R$ {item.valorFinal.toFixed(2)}
                          </span>
                        </td>
                        <td className="border border-gray-300 px-4 py-2 text-center">
                          <span className={`font-semibold px-2 py-1 rounded ${
                            item.percentualMeta >= 100 
                              ? 'bg-green-100 text-green-800' 
                              : item.percentualMeta >= 80 
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {item.percentualMeta.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-100 font-bold">
                      <td className="border border-gray-300 px-4 py-2" colSpan={2}>TOTAIS</td>
                      <td className="border border-gray-300 px-4 py-2 text-center">
                        R$ {monthlyEarningsData.reduce((sum, item) => sum + item.valorKpi, 0).toFixed(2)}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-center">
                        R$ {monthlyEarningsData.reduce((sum, item) => sum + item.valorAtividade, 0).toFixed(2)}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-center">
                        R$ {monthlyEarningsData.reduce((sum, item) => sum + item.valorTarefas, 0).toFixed(2)}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-center">
                        R$ {monthlyEarningsData.reduce((sum, item) => sum + item.valorFinal, 0).toFixed(2)}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-center">
                        {monthlyEarningsData.length > 0 
                          ? (monthlyEarningsData.reduce((sum, item) => sum + item.percentualMeta, 0) / monthlyEarningsData.length).toFixed(1)
                          : '0.0'
                        }%
                      </td>
                    </tr>
                  </tfoot>
                </table>
              ) : (
                <div className="flex items-center justify-center h-64 text-gray-500">
                  <div className="text-center">
                    <p className="text-lg mb-2">Nenhum dado encontrado</p>
                    <p className="text-sm">Tente ajustar os filtros ou verificar se há dados para o período selecionado</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductivityDashboard;
