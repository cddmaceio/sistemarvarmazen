import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/Card';
import { Download, Filter, User, Calendar, Activity, Target, Clock, DollarSign } from 'lucide-react';
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

interface IndividualReportData {
  colaborador: {
    id: number;
    nome: string;
    cpf: string;
    funcao: string;
  };
  resumo: {
    valorTotalKpi: number;
    valorTotalAtividade: number;
    valorTotalTarefas: number;
    valorFinalMes: number;
    percentualMeta: number;
    diasTrabalhados: number;
    totalLancamentos: number;
  };
  lancamentos: {
    data: string;
    diaSemana: string;
    bonus_kpis: number; // Valor real dos KPIs do banco de dados
    atividades: {
      nome: string;
      quantidade: number;
      tempoGasto: number; // em minutos
      valorUnitario: number;
      valorTotal: number;
      turno: string;
    }[];
    kpis: {
      nome: string;
      valor: number;
      atingido: boolean;
      bonus: number;
    }[];
    valorDia: number;
  }[];
}

const ProductivityDashboard: React.FC = () => {
  const [monthlyEarningsData, setMonthlyEarningsData] = useState<MonthlyEarningsData[]>([]);
  const [earningsLoading, setEarningsLoading] = useState(false);
  
  // Estados para filtros
  const [selectedFuncao, setSelectedFuncao] = useState<string>('');
  const [selectedMesAno, setSelectedMesAno] = useState<string>('');
  
  // Estados para relatório individual
  const [individualReportData, setIndividualReportData] = useState<IndividualReportData | null>(null);
  const [individualLoading, setIndividualLoading] = useState(false);
  const [selectedColaborador, setSelectedColaborador] = useState<string>('');
  const [selectedMesAnoIndividual, setSelectedMesAnoIndividual] = useState<string>('');
  const [colaboradoresList, setColaboradoresList] = useState<{id: number, nome: string, cpf: string}[]>([]);
  const [activeTab, setActiveTab] = useState<'resumo' | 'individual'>('resumo');
  const [activities, setActivities] = useState<any[]>([]);
  
  // Funções disponíveis
  const funcoesDisponiveis = ['Ajudante de Armazém', 'Operador de Empilhadeira'];
  
  // Meta fixa de R$ 300,00
  const META_VALOR = 300;
  
  // Gerar opções de mês/ano (últimos 12 meses) - Ajustado para GMT-3 (Brasília)
  const generateMonthOptions = () => {
    const options = [];
    // Criar data no horário de Brasília (GMT-3)
    const now = new Date();
    const brasiliaOffset = -3 * 60; // GMT-3 em minutos
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const brasiliaTime = new Date(utc + (brasiliaOffset * 60000));
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(brasiliaTime.getFullYear(), brasiliaTime.getMonth() - i, 1);
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      options.push({ value, label });
    }
    return options;
  };
  
  const monthOptions = generateMonthOptions();

  // Função para carregar lista de colaboradores
  const loadColaboradores = async () => {
    try {
      const response = await fetch('/api/colaboradores');
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      const result = await response.json();
      if (result.success && result.data) {
        setColaboradoresList(result.data);
      }
    } catch (error) {
      console.error('Erro ao carregar colaboradores:', error);
      setColaboradoresList([]);
    }
  };

  // Função para carregar atividades
  const loadActivities = async () => {
    try {
      const response = await fetch('/api/activities');
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      const result = await response.json();
      setActivities(result || []);
    } catch (error) {
      console.error('Erro ao carregar atividades:', error);
      setActivities([]);
    }
  };

  // Função para calcular nível baseado na produção (baseada na lógica do DashboardCollaborator)
  const calcularNivelAtingido = (nomeAtividade: string, producaoHora: number): { nivel: string, valorUnitario: number } => {
    const atividadesDoTipo = activities.filter(act => act.nome_atividade === nomeAtividade);
    
    if (atividadesDoTipo.length === 0) {
      return { nivel: 'Nível não encontrado', valorUnitario: 0 };
    }
    
    // Ordenar por produtividade_minima decrescente
    const atividadesOrdenadas = atividadesDoTipo.sort((a, b) => parseFloat(b.produtividade_minima) - parseFloat(a.produtividade_minima));
    
    // Encontrar o nível apropriado baseado na produtividade
    let selectedActivity = null;
    for (const activity of atividadesOrdenadas) {
      if (producaoHora >= parseFloat(activity.produtividade_minima)) {
        selectedActivity = activity;
        break;
      }
    }
    
    // Se nenhum nível foi atingido, usar o nível mais baixo
    if (!selectedActivity) {
      selectedActivity = atividadesOrdenadas[atividadesOrdenadas.length - 1];
    }
    
    return {
      nivel: selectedActivity.nivel_atividade || 'Nível não definido',
      valorUnitario: parseFloat(selectedActivity.valor_atividade) || 0
    };
  };

  // Função para carregar relatório individual
  const loadIndividualReport = async () => {
    if (!selectedColaborador) {
      alert('Selecione um colaborador');
      return;
    }

    try {
      setIndividualLoading(true);
      const params = new URLSearchParams();
      params.append('colaboradorId', selectedColaborador);
      if (selectedMesAnoIndividual) params.append('mesAno', selectedMesAnoIndividual);
      
      const url = `/api/individual-report?${params.toString()}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      
      const result = await response.json();
      if (result.success && result.data) {
        setIndividualReportData(result.data);
      } else {
        setIndividualReportData(null);
      }
    } catch (error) {
      console.error('Erro ao carregar relatório individual:', error);
      setIndividualReportData(null);
    } finally {
      setIndividualLoading(false);
    }
  };

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

  // Função para exportar relatório individual
  const exportIndividualToXLSX = () => {
    if (!individualReportData) {
      alert('Não há dados para exportar');
      return;
    }

    const { colaborador, resumo, lancamentos } = individualReportData;
    
    // Aba de resumo
    const resumoData = [{
      'Nome': colaborador.nome,
      'CPF': colaborador.cpf,
      'Função': colaborador.funcao,
      'Valor Total KPI': `R$ ${resumo.valorTotalKpi.toFixed(2)}`,
      'Valor Total Atividade': `R$ ${resumo.valorTotalAtividade.toFixed(2)}`,
      'Valor Total Tarefas': `R$ ${resumo.valorTotalTarefas.toFixed(2)}`,
      'Valor Final Mês': `R$ ${resumo.valorFinalMes.toFixed(2)}`,
      '% da Meta': `${resumo.percentualMeta.toFixed(1)}%`,
      'Dias Trabalhados': resumo.diasTrabalhados,
      'Total Lançamentos': resumo.totalLancamentos
    }];

    // Aba de lançamentos detalhados
    const lancamentosData: any[] = [];
    lancamentos.forEach(lancamento => {
      // Atividades
      lancamento.atividades.forEach(atividade => {
        // Recalcular valores corretos para exportação
        const tempoHoras = atividade.tempoGasto / 60;
        const producaoHora = tempoHoras > 0 ? atividade.quantidade / tempoHoras : 0;
        const { nivel: nivelAlcancado, valorUnitario: valorUnitarioCorreto } = calcularNivelAtingido(atividade.nome, producaoHora);
        const valorBruto = atividade.quantidade * valorUnitarioCorreto;
        const valorLiquido = valorBruto / 2;
        
        lancamentosData.push({
          'Data': lancamento.data,
          'Dia da Semana': lancamento.diaSemana,
          'Tipo': 'Atividade',
          'Nome': atividade.nome,
          'Quantidade': atividade.quantidade,
          'Tempo (min)': atividade.tempoGasto,
          'Nível Alcançado': nivelAlcancado,
          'Produção/Hora': producaoHora.toFixed(1),
          'Valor Unitário': `R$ ${valorUnitarioCorreto.toFixed(2)}`,
          'Valor Bruto': `R$ ${valorBruto.toFixed(2)}`,
          'Valor Líquido': `R$ ${valorLiquido.toFixed(2)}`,
          'Turno': atividade.turno
        });
      });
      
      // KPIs
      lancamento.kpis.forEach(kpi => {
        lancamentosData.push({
          'Data': lancamento.data,
          'Dia da Semana': lancamento.diaSemana,
          'Tipo': 'KPI',
          'Nome': kpi.nome,
          'Valor': kpi.valor,
          'Atingido': kpi.atingido ? 'Sim' : 'Não',
          'Bônus': `R$ ${kpi.bonus.toFixed(2)}`,
          'Turno': '-'
        });
      });
    });

    const workbook = XLSX.utils.book_new();
    
    const resumoSheet = XLSX.utils.json_to_sheet(resumoData);
    XLSX.utils.book_append_sheet(workbook, resumoSheet, 'Resumo');
    
    const lancamentosSheet = XLSX.utils.json_to_sheet(lancamentosData);
    XLSX.utils.book_append_sheet(workbook, lancamentosSheet, 'Lançamentos');
    
    const fileName = `relatorio_individual_${colaborador.nome.replace(/\s+/g, '_')}_${selectedMesAnoIndividual || 'atual'}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  // Função para carregar dados de ganhos mensais
  const loadMonthlyEarnings = async () => {
    try {
      setEarningsLoading(true);
      console.log('🔄 [Dashboard] Iniciando carregamento de dados de ganhos mensais...');
      
      const params = new URLSearchParams();
      if (selectedFuncao) params.append('funcao', selectedFuncao);
      if (selectedMesAno) params.append('mesAno', selectedMesAno);
      
      const url = `/api/monthly-earnings${params.toString() ? '?' + params.toString() : ''}`;
      console.log('🔗 [Dashboard] URL da requisição:', url);
      console.log('📋 [Dashboard] Parâmetros:', { selectedFuncao, selectedMesAno });
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      console.log('📊 [Dashboard] Response status:', response.status);
      console.log('📊 [Dashboard] Response ok:', response.ok);
      console.log('📊 [Dashboard] Response headers:', Object.fromEntries(response.headers.entries()));
      
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
      console.log('📦 [Dashboard] Dados de ganhos recebidos:', {
        success: result.success,
        hasData: !!result.data,
        isArray: Array.isArray(result.data),
        dataLength: result.data ? result.data.length : 0,
        firstItem: result.data && result.data[0] ? result.data[0] : null
      });
      
      if (result.success && result.data && Array.isArray(result.data)) {
        console.log('🔄 [Dashboard] Processando dados...');
        
        // Processar dados para incluir cálculos necessários
        const processedData = result.data.map((item: any, index: number) => {
          const valorFinal = item.valor_final || 0;
          const percentualMeta = (valorFinal / META_VALOR) * 100;

          const processed = {
            ...item,
            valorKpi: item.valor_kpi || 0,
            valorAtividade: item.valor_atividade || 0,
            valorTarefas: item.valor_tarefas || 0,
            valorFinal,
            percentualMeta,
          };
          
          if (index === 0) {
            console.log('📝 [Dashboard] Primeiro item processado:', processed);
          }
          
          return processed;
        });
        
        console.log('✅ [Dashboard] Definindo dados no estado...');
        setMonthlyEarningsData(processedData);
        console.log('✅ [Dashboard] Dados de ganhos mensais carregados com sucesso:', processedData.length, 'registros');
      } else {
        console.warn('⚠️ [Dashboard] Dados de ganhos vazios ou inválidos recebidos');
        setMonthlyEarningsData([]);
      }
    } catch (error) {
      console.error('❌ [Dashboard] Erro na requisição de dados de ganhos mensais:', error);
      console.error('❌ [Dashboard] Stack trace:', error instanceof Error ? error.stack : 'Stack trace não disponível');
      setMonthlyEarningsData([]);
    } finally {
      console.log('🏁 [Dashboard] Finalizando carregamento (loading = false)');
      setEarningsLoading(false);
    }
  };

  // Carregar dados iniciais
  useEffect(() => {
    loadMonthlyEarnings();
    loadColaboradores();
    loadActivities();
  }, []);
  
  // Carregar dados de ganhos mensais quando os filtros mudarem
  useEffect(() => {
    loadMonthlyEarnings();
  }, [selectedFuncao, selectedMesAno]);
  
  // Carregar relatório individual quando os filtros mudarem
  useEffect(() => {
    if (selectedColaborador && activeTab === 'individual') {
      loadIndividualReport();
    }
  }, [selectedColaborador, selectedMesAnoIndividual]);

  return (
    <div className="space-y-6">
      {/* Header da página */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Dashboard de Produtividade
          </h1>
          <p className="text-gray-600 mt-2">
            Relatórios detalhados de ganhos e produtividade com meta de R$ {META_VALOR.toFixed(2)}
          </p>
        </div>
        <UserMenu />
      </div>

      {/* Navegação por abas */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('resumo')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'resumo'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Resumo Geral
            </div>
          </button>
          <button
            onClick={() => setActiveTab('individual')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'individual'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Relatório Individual
            </div>
          </button>
        </nav>
      </div>

      {/* Conteúdo das abas */}
      {activeTab === 'resumo' && (
        <div>
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
      )}

      {activeTab === 'individual' && (
        <div className="space-y-6">
          {/* Seção de Relatório Individual */}
          {/* Card de Filtros para Relatório Individual */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Relatório Individual de Colaborador
              </CardTitle>
              <CardDescription>Extrato detalhado de produtividade dia a dia</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Colaborador
                  </label>
                  <select
                    value={selectedColaborador}
                    onChange={(e) => setSelectedColaborador(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Selecione um colaborador</option>
                    {colaboradoresList.map((colaborador) => (
                      <option key={colaborador.id} value={colaborador.id.toString()}>
                        {colaborador.nome} - {colaborador.cpf}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mês/Ano
                  </label>
                  <select
                    value={selectedMesAnoIndividual}
                    onChange={(e) => setSelectedMesAnoIndividual(e.target.value)}
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
                    onClick={loadIndividualReport}
                    disabled={individualLoading || !selectedColaborador}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {individualLoading ? 'Carregando...' : 'Gerar Relatório'}
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card de Resumo do Colaborador */}
          {individualReportData && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Resumo do Período - {individualReportData.colaborador.nome}
                    </CardTitle>
                    <CardDescription>
                      {individualReportData.colaborador.funcao} | CPF: {individualReportData.colaborador.cpf}
                    </CardDescription>
                  </div>
                  <button
                    onClick={exportIndividualToXLSX}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    Exportar XLSX
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="h-5 w-5 text-blue-600" />
                      <span className="text-sm font-medium text-blue-600">Valor Final</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-900">
                      R$ {individualReportData.resumo.valorFinalMes.toFixed(2)}
                    </p>
                  </div>
                  
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="h-5 w-5 text-green-600" />
                      <span className="text-sm font-medium text-green-600">% da Meta</span>
                    </div>
                    <p className={`text-2xl font-bold ${
                      individualReportData.resumo.percentualMeta >= 100 
                        ? 'text-green-900' 
                        : individualReportData.resumo.percentualMeta >= 80 
                        ? 'text-yellow-600'
                        : 'text-red-600'
                    }`}>
                      {individualReportData.resumo.percentualMeta.toFixed(1)}%
                    </p>
                  </div>
                  
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="h-5 w-5 text-purple-600" />
                      <span className="text-sm font-medium text-purple-600">Dias Trabalhados</span>
                    </div>
                    <p className="text-2xl font-bold text-purple-900">
                      {individualReportData.resumo.diasTrabalhados}
                    </p>
                  </div>
                  
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="h-5 w-5 text-orange-600" />
                      <span className="text-sm font-medium text-orange-600">Lançamentos</span>
                    </div>
                    <p className="text-2xl font-bold text-orange-900">
                      {individualReportData.resumo.totalLancamentos}
                    </p>
                  </div>
                </div>
                
                {/* Breakdown de valores */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-700 mb-2">Valor KPIs</h4>
                    <p className="text-xl font-bold text-gray-900">
                      R$ {individualReportData.resumo.valorTotalKpi.toFixed(2)}
                    </p>
                  </div>
                  
                  {individualReportData.colaborador.funcao === 'Ajudante de Armazém' && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-gray-700 mb-2">Valor Atividades</h4>
                      <p className="text-xl font-bold text-gray-900">
                        R$ {individualReportData.resumo.valorTotalAtividade.toFixed(2)}
                      </p>
                    </div>
                  )}
                  
                  {individualReportData.colaborador.funcao === 'Operador de Empilhadeira' && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-gray-700 mb-2">Valor Tarefas</h4>
                      <p className="text-xl font-bold text-gray-900">
                        R$ {individualReportData.resumo.valorTotalTarefas.toFixed(2)}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Card de Extrato Detalhado */}
          {individualReportData && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Extrato Detalhado - Dia a Dia
                </CardTitle>
                <CardDescription>Lançamentos de produtividade e KPIs por data em formato tabular simplificado</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Data</th>
                        <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Atividade</th>
                        <th className="border border-gray-300 px-4 py-3 text-center font-semibold">Qtd</th>
                        <th className="border border-gray-300 px-4 py-3 text-center font-semibold">Tempo Produção</th>
                        <th className="border border-gray-300 px-4 py-3 text-center font-semibold">Nível Alcançado</th>
                        <th className="border border-gray-300 px-4 py-3 text-center font-semibold">Valor Bruto</th>
                        <th className="border border-gray-300 px-4 py-3 text-center font-semibold">Valor Líquido</th>
                        <th className="border border-gray-300 px-4 py-3 text-center font-semibold">KPI Atingido</th>
                        <th className="border border-gray-300 px-4 py-3 text-center font-semibold">Valor dos KPIs Atingidos</th>
                        <th className="border border-gray-300 px-4 py-3 text-center font-semibold">Resultado Final</th>
                      </tr>
                    </thead>
                    <tbody>
                      {individualReportData.lancamentos.map((lancamento, lancamentoIndex) => {
                        const dataFormatada = new Date(lancamento.data).toLocaleDateString('pt-BR');
                        const kpisAtingidosArray = lancamento.kpis.filter(kpi => kpi.atingido);
                        const kpisAtingidos = kpisAtingidosArray.map(kpi => kpi.nome).join(', ') || 'Nenhum';
                        const quantidadeKpisAtingidos = kpisAtingidosArray.length;
                        // Usar o bonus_kpis diretamente do lançamento (valor real do banco de dados)
                        const valorKpisAtingidos = lancamento.bonus_kpis || 0;
                        
                        // Se há atividades, criar uma linha para cada atividade
                        if (lancamento.atividades.length > 0) {
                          return lancamento.atividades.map((atividade, atividadeIndex) => {
                            // Calcular produção baseada na quantidade e tempo (qtd/tempo = produção)
                            const tempoHoras = atividade.tempoGasto / 60; // converter minutos para horas
                            const producaoHora = tempoHoras > 0 ? atividade.quantidade / tempoHoras : 0;
                            
                            // Determinar nível alcançado e valor unitário correto baseado na produção
                            const { nivel: nivelAlcancado, valorUnitario: valorUnitarioCorreto } = calcularNivelAtingido(atividade.nome, producaoHora);
                            
                            // Calcular valor bruto baseado na quantidade e valor unitário correto do nível atingido
                            const valorBruto = atividade.quantidade * valorUnitarioCorreto;
                            // Valor líquido = valor bruto / 2 (conforme especificação)
                            const valorLiquido = valorBruto / 2;
                            
                            return (
                              <tr key={`${lancamentoIndex}-${atividadeIndex}`} className={lancamentoIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                <td className="border border-gray-300 px-4 py-3">
                                  {atividadeIndex === 0 ? dataFormatada : ''}
                                </td>
                                <td className="border border-gray-300 px-4 py-3 font-medium">
                                  {atividade.nome}
                                </td>
                                <td className="border border-gray-300 px-4 py-3 text-center">
                                  {atividade.quantidade}
                                </td>
                                <td className="border border-gray-300 px-4 py-3 text-center">
                                  <div className="flex items-center justify-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {atividade.tempoGasto}min
                                  </div>
                                </td>
                                <td className="border border-gray-300 px-4 py-3 text-center">
                                  <div className="flex flex-col items-center gap-1">
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                                      nivelAlcancado === 'Nível 5' ? 'bg-green-100 text-green-800' :
                                      nivelAlcancado === 'Nível 4' ? 'bg-blue-100 text-blue-800' :
                                      nivelAlcancado === 'Nível 3' ? 'bg-yellow-100 text-yellow-800' :
                                      nivelAlcancado === 'Nível 2' ? 'bg-orange-100 text-orange-800' :
                                      'bg-red-100 text-red-800'
                                    }`}>
                                      {nivelAlcancado}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      {producaoHora.toFixed(1)}/h
                                    </span>
                                  </div>
                                </td>
                                <td className="border border-gray-300 px-4 py-3 text-center font-semibold text-blue-600">
                                  R$ {valorBruto.toFixed(2)}
                                </td>
                                <td className="border border-gray-300 px-4 py-3 text-center font-semibold text-green-600">
                                  R$ {valorLiquido.toFixed(2)}
                                </td>
                                <td className="border border-gray-300 px-4 py-3 text-center">
                                  {atividadeIndex === 0 ? (
                                    <div className="flex flex-col items-center gap-1">
                                      <span className="text-sm font-medium">{quantidadeKpisAtingidos} KPI{quantidadeKpisAtingidos !== 1 ? 's' : ''}</span>
                                      <span className="text-xs text-gray-500">{kpisAtingidos}</span>
                                    </div>
                                  ) : ''}
                                </td>
                                <td className="border border-gray-300 px-4 py-3 text-center">
                                  {atividadeIndex === 0 ? (
                                    <span className="font-semibold text-purple-600">
                                      R$ {valorKpisAtingidos.toFixed(2)}
                                    </span>
                                  ) : ''}
                                </td>
                                <td className="border border-gray-300 px-4 py-3 text-center">
                                  {atividadeIndex === 0 ? (
                                    <span className="font-bold text-lg text-blue-700">
                                      R$ {(valorLiquido + valorKpisAtingidos).toFixed(2)}
                                    </span>
                                  ) : (
                                    <span className="font-bold text-lg text-blue-700">
                                      R$ {valorLiquido.toFixed(2)}
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          });
                        } else {
                          // Se não há atividades, mostrar apenas uma linha com KPIs
                          return (
                            <tr key={lancamentoIndex} className={lancamentoIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                              <td className="border border-gray-300 px-4 py-3">{dataFormatada}</td>
                              <td className="border border-gray-300 px-4 py-3 text-gray-500 italic">Sem atividades</td>
                              <td className="border border-gray-300 px-4 py-3 text-center text-gray-400">-</td>
                              <td className="border border-gray-300 px-4 py-3 text-center text-gray-400">-</td>
                              <td className="border border-gray-300 px-4 py-3 text-center text-gray-400">-</td>
                              <td className="border border-gray-300 px-4 py-3 text-center text-gray-400">-</td>
                              <td className="border border-gray-300 px-4 py-3 text-center text-gray-400">-</td>
                              <td className="border border-gray-300 px-4 py-3 text-center">
                                <div className="flex flex-col items-center gap-1">
                                  <span className="text-sm font-medium">{quantidadeKpisAtingidos} KPI{quantidadeKpisAtingidos !== 1 ? 's' : ''}</span>
                                  <span className="text-xs text-gray-500">{kpisAtingidos}</span>
                                </div>
                              </td>
                              <td className="border border-gray-300 px-4 py-3 text-center">
                                <span className="font-semibold text-purple-600">
                                  R$ {valorKpisAtingidos.toFixed(2)}
                                </span>
                              </td>
                              <td className="border border-gray-300 px-4 py-3 text-center">
                                <span className="font-bold text-lg text-blue-700">
                                  R$ {valorKpisAtingidos.toFixed(2)}
                                </span>
                              </td>
                            </tr>
                          );
                        }
                      }).flat()}
                    </tbody>
                  </table>
                </div>
                
                {/* Legenda */}
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-gray-700 mb-2">Legenda:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                    <div><strong>Nível Alcançado:</strong> Baseado na produção (qtd/tempo) conforme tabela activities</div>
                    <div><strong>Valor Bruto:</strong> Quantidade × Valor Unitário da atividade</div>
                    <div><strong>Valor Líquido:</strong> Valor Bruto ÷ 2 (conforme regra do sistema)</div>
                    <div><strong>Níveis de Produção:</strong> Nível 5: ≥25/h | Nível 4: ≥20/h | Nível 3: ≥15/h | Nível 2: ≥10/h | Nível 1: &lt;10/h</div>
                    <div><strong>KPI Atingido:</strong> Lista dos KPIs que foram atingidos no dia</div>
                    <div><strong>Tempo Produção:</strong> Tempo gasto na atividade em minutos</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Estado de loading ou vazio */}
          {individualLoading && (
            <Card>
              <CardContent>
                <div className="flex items-center justify-center h-64">
                  <div className="text-lg text-gray-600">Carregando relatório individual...</div>
                </div>
              </CardContent>
            </Card>
          )}

          {!individualLoading && !individualReportData && selectedColaborador && (
            <Card>
              <CardContent>
                <div className="flex items-center justify-center h-64 text-gray-500">
                  <div className="text-center">
                    <User className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-lg mb-2">Nenhum dado encontrado</p>
                    <p className="text-sm">Não há lançamentos para este colaborador no período selecionado</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductivityDashboard;
