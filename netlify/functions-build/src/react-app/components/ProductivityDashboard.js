import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, Area, AreaChart } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/react-app/components/Card';
import { Clock, Users, TrendingUp, Award } from 'lucide-react';
import ErrorBoundary from '@/react-app/components/ErrorBoundary';
const ProductivityDashboard = () => {
    const [productivityData, setProductivityData] = useState([]);
    const [monthlyEarningsData, setMonthlyEarningsData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [earningsLoading, setEarningsLoading] = useState(false);
    // Estados para filtros
    const [selectedFuncao, setSelectedFuncao] = useState('');
    const [selectedMesAno, setSelectedMesAno] = useState('');
    // Funções disponíveis
    const funcoesDisponiveis = ['Ajudante de Armazém', 'Operador de Empilhadeira'];
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
    // Dados mockados para demonstração
    const mockData = [
        { turno: 'Manhã', funcao: 'Operador', produtividade: 85, meta: 80, colaboradores: 12, eficiencia: 106 },
        { turno: 'Manhã', funcao: 'Supervisor', produtividade: 92, meta: 85, colaboradores: 3, eficiencia: 108 },
        { turno: 'Manhã', funcao: 'Conferente', produtividade: 78, meta: 75, colaboradores: 8, eficiencia: 104 },
        { turno: 'Tarde', funcao: 'Operador', produtividade: 82, meta: 80, colaboradores: 10, eficiencia: 102 },
        { turno: 'Tarde', funcao: 'Supervisor', produtividade: 88, meta: 85, colaboradores: 2, eficiencia: 104 },
        { turno: 'Tarde', funcao: 'Conferente', produtividade: 75, meta: 75, colaboradores: 6, eficiencia: 100 },
        { turno: 'Noite', funcao: 'Operador', produtividade: 79, meta: 80, colaboradores: 8, eficiencia: 99 },
        { turno: 'Noite', funcao: 'Supervisor', produtividade: 86, meta: 85, colaboradores: 2, eficiencia: 101 },
        { turno: 'Noite', funcao: 'Conferente', produtividade: 72, meta: 75, colaboradores: 5, eficiencia: 96 }
    ];
    // Função para carregar dados de ganhos mensais
    const loadMonthlyEarnings = async () => {
        try {
            setEarningsLoading(true);
            console.log('Carregando dados de ganhos mensais...');
            const params = new URLSearchParams();
            if (selectedFuncao)
                params.append('funcao', selectedFuncao);
            if (selectedMesAno)
                params.append('mesAno', selectedMesAno);
            const url = `/.netlify/functions/api/monthly-earnings${params.toString() ? '?' + params.toString() : ''}`;
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
                setMonthlyEarningsData(result.data);
                console.log('Dados de ganhos mensais carregados com sucesso');
            }
            else {
                console.warn('Dados de ganhos vazios ou inválidos recebidos');
                setMonthlyEarningsData([]);
            }
        }
        catch (error) {
            console.error('Erro na requisição de dados de ganhos mensais:', error);
            setMonthlyEarningsData([]);
        }
        finally {
            setEarningsLoading(false);
        }
    };
    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                console.log('Carregando dados de produtividade...');
                const response = await fetch('/.netlify/functions/api/productivity-data');
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
                console.log('Dados recebidos:', result);
                if (result.success && result.data && Array.isArray(result.data) && result.data.length > 0) {
                    setProductivityData(result.data);
                    console.log('Dados de produtividade carregados com sucesso');
                }
                else {
                    console.warn('Dados vazios ou inválidos recebidos, usando dados mockados');
                    console.error('Erro ao carregar dados de produtividade:', result.error || 'Dados não encontrados');
                    setProductivityData(mockData);
                }
            }
            catch (error) {
                console.error('Erro na requisição de dados de produtividade:', error);
                console.log('Usando dados mockados como fallback');
                setProductivityData(mockData);
            }
            finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);
    // Carregar dados de ganhos mensais quando os filtros mudarem
    useEffect(() => {
        loadMonthlyEarnings();
    }, [selectedFuncao, selectedMesAno]);
    // Agregar dados por turno
    const turnoData = productivityData.length > 0 ? productivityData.reduce((acc, item) => {
        const existing = acc.find(t => t.turno === item.turno);
        if (existing) {
            existing.produtividade = (existing.produtividade + item.produtividade) / 2;
            existing.colaboradores += item.colaboradores;
        }
        else {
            acc.push({
                turno: item.turno,
                produtividade: item.produtividade,
                meta: item.meta,
                colaboradores: item.colaboradores
            });
        }
        return acc;
    }, []) : [];
    // Agregar dados por função
    const funcaoData = productivityData.length > 0 ? productivityData.reduce((acc, item) => {
        const existing = acc.find(f => f.funcao === item.funcao);
        if (existing) {
            existing.produtividade = (existing.produtividade + item.produtividade) / 2;
            existing.colaboradores += item.colaboradores;
        }
        else {
            acc.push({
                funcao: item.funcao,
                produtividade: item.produtividade,
                colaboradores: item.colaboradores
            });
        }
        return acc;
    }, []) : [];
    // Agregar dados para o AreaChart (por função com eficiência)
    const areaChartData = productivityData.length > 0 ? productivityData.reduce((acc, item) => {
        const existing = acc.find(f => f.funcao === item.funcao);
        if (existing) {
            existing.produtividade = (existing.produtividade + item.produtividade) / 2;
            existing.eficiencia = (existing.eficiencia + item.eficiencia) / 2;
            existing.colaboradores += item.colaboradores;
        }
        else {
            acc.push({
                funcao: item.funcao,
                produtividade: item.produtividade,
                eficiencia: item.eficiencia,
                colaboradores: item.colaboradores
            });
        }
        return acc;
    }, []) : [];
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];
    if (loading) {
        return (<div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Carregando dados de produtividade...</div>
      </div>);
    }
    return (<div className="space-y-6">
      {/* Header com métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-blue-600"/>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Produtividade Média</p>
                <p className="text-2xl font-bold text-gray-900">
                  {productivityData.length > 0 ? Math.round(productivityData.reduce((acc, item) => acc + item.produtividade, 0) / productivityData.length) : 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-green-600"/>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Colaboradores</p>
                <p className="text-2xl font-bold text-gray-900">
                  {productivityData.reduce((acc, item) => acc + item.colaboradores, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-orange-600"/>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Turnos Ativos</p>
                <p className="text-2xl font-bold text-gray-900">{turnoData.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Award className="h-8 w-8 text-purple-600"/>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Eficiência Média</p>
                <p className="text-2xl font-bold text-gray-900">
                  {productivityData.length > 0 ? Math.round(productivityData.reduce((acc, item) => acc + item.eficiencia, 0) / productivityData.length) : 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos principais */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Produtividade por Turno */}
        <Card>
          <CardHeader>
            <CardTitle>Produtividade por Turno</CardTitle>
            <CardDescription>Comparação entre produtividade real e meta por turno</CardDescription>
          </CardHeader>
          <CardContent>
            <ErrorBoundary>
            {turnoData.length > 0 ? (<ResponsiveContainer width="100%" height={300}>
                <BarChart data={turnoData}>
                  <CartesianGrid strokeDasharray="3 3"/>
                  <XAxis dataKey="turno"/>
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="produtividade" fill="#3B82F6" name="Produtividade"/>
                  <Bar dataKey="meta" fill="#EF4444" name="Meta"/>
                </BarChart>
              </ResponsiveContainer>) : (<div className="flex items-center justify-center h-64 text-gray-500">
                Nenhum dado disponível para exibir
              </div>)}
          </ErrorBoundary>
          </CardContent>
        </Card>

        {/* Gráfico de Distribuição por Função */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Função</CardTitle>
            <CardDescription>Número de colaboradores por função</CardDescription>
          </CardHeader>
          <CardContent>
            <ErrorBoundary>
            {funcaoData.length > 0 ? (<ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={funcaoData} cx="50%" cy="50%" labelLine={false} label={({ funcao, colaboradores }) => `${funcao}: ${colaboradores}`} outerRadius={80} fill="#8884d8" dataKey="colaboradores">
                    {funcaoData.map((_, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]}/>))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>) : (<div className="flex items-center justify-center h-64 text-gray-500">
                Nenhum dado disponível para exibir
              </div>)}
          </ErrorBoundary>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico detalhado de produtividade */}
      <Card>
        <CardHeader>
          <CardTitle>Análise Detalhada de Produtividade</CardTitle>
          <CardDescription>Produtividade por turno e função com linha de eficiência</CardDescription>
        </CardHeader>
        <CardContent>
          <ErrorBoundary>
            {areaChartData.length > 0 ? (<ResponsiveContainer width="100%" height={400}>
                <AreaChart data={areaChartData}>
                  <CartesianGrid strokeDasharray="3 3"/>
                  <XAxis dataKey="funcao"/>
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="produtividade" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} name="Produtividade"/>
                  <Area type="monotone" dataKey="eficiencia" stackId="2" stroke="#10B981" fill="#10B981" fillOpacity={0.3} name="Eficiência"/>
                </AreaChart>
              </ResponsiveContainer>) : (<div className="flex items-center justify-center h-96 text-gray-500">
                Nenhum dado disponível para exibir
              </div>)}
          </ErrorBoundary>
        </CardContent>
      </Card>

      {/* Tabela de dados detalhados */}
      <Card>
        <CardHeader>
          <CardTitle>Dados Detalhados</CardTitle>
          <CardDescription>Visão completa dos dados de produtividade</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-4 py-2 text-left">Turno</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Função</th>
                  <th className="border border-gray-300 px-4 py-2 text-center">Produtividade</th>
                  <th className="border border-gray-300 px-4 py-2 text-center">Meta</th>
                  <th className="border border-gray-300 px-4 py-2 text-center">Colaboradores</th>
                  <th className="border border-gray-300 px-4 py-2 text-center">Eficiência</th>
                </tr>
              </thead>
              <tbody>
                {productivityData.map((item, index) => (<tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="border border-gray-300 px-4 py-2">{item.turno}</td>
                    <td className="border border-gray-300 px-4 py-2">{item.funcao}</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">
                      <span className={`font-semibold ${item.produtividade >= item.meta ? 'text-green-600' : 'text-red-600'}`}>
                        {item.produtividade}%
                      </span>
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-center">{item.meta}%</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">{item.colaboradores}</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">
                      <span className={`font-semibold ${item.eficiencia >= 100 ? 'text-green-600' : 'text-orange-600'}`}>
                        {item.eficiencia}%
                      </span>
                    </td>
                  </tr>))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Seção de Ganhos Mensais por Colaborador */}
      <Card>
        <CardHeader>
          <CardTitle>Ganhos Mensais por Colaborador</CardTitle>
          <CardDescription>Filtros e relatório detalhado de ganhos por colaborador</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filtros */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Função
              </label>
              <select value={selectedFuncao} onChange={(e) => setSelectedFuncao(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option value="">Todas as funções</option>
                {funcoesDisponiveis.map((funcao) => (<option key={funcao} value={funcao}>
                    {funcao}
                  </option>))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mês/Ano
              </label>
              <select value={selectedMesAno} onChange={(e) => setSelectedMesAno(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option value="">Mês atual</option>
                {monthOptions.map((option) => (<option key={option.value} value={option.value}>
                    {option.label}
                  </option>))}
              </select>
            </div>
            
            <div className="flex items-end">
              <button onClick={loadMonthlyEarnings} disabled={earningsLoading} className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed">
                {earningsLoading ? 'Carregando...' : 'Atualizar'}
              </button>
            </div>
          </div>

          {/* Tabela de Ganhos */}
          {earningsLoading ? (<div className="flex items-center justify-center h-32">
              <div className="text-lg text-gray-600">Carregando dados de ganhos...</div>
            </div>) : (<div className="overflow-x-auto">
              {monthlyEarningsData.length > 0 ? (<table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 px-4 py-2 text-left">Colaborador</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">CPF</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Função</th>
                      <th className="border border-gray-300 px-4 py-2 text-center">Total de Lançamentos</th>
                      <th className="border border-gray-300 px-4 py-2 text-center">Ganho Total (R$)</th>
                      <th className="border border-gray-300 px-4 py-2 text-center">Média por Lançamento (R$)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyEarningsData.map((colaborador, index) => (<tr key={colaborador.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="border border-gray-300 px-4 py-2 font-medium">
                          {colaborador.nome}
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          {colaborador.cpf}
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          {colaborador.funcao}
                        </td>
                        <td className="border border-gray-300 px-4 py-2 text-center">
                          {colaborador.totalLancamentos}
                        </td>
                        <td className="border border-gray-300 px-4 py-2 text-center">
                          <span className="font-semibold text-green-600">
                            R$ {colaborador.ganhoTotal.toFixed(2)}
                          </span>
                        </td>
                        <td className="border border-gray-300 px-4 py-2 text-center">
                          <span className="font-medium text-blue-600">
                            R$ {isNaN(Number(colaborador.mediaGanho)) ? '0.00' : Number(colaborador.mediaGanho).toFixed(2)}
                          </span>
                        </td>
                      </tr>))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-100 font-semibold">
                      <td colSpan={3} className="border border-gray-300 px-4 py-2 text-right">
                        TOTAIS:
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-center">
                        {monthlyEarningsData.reduce((acc, col) => acc + col.totalLancamentos, 0)}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-center text-green-600">
                        R$ {monthlyEarningsData.reduce((acc, col) => acc + col.ganhoTotal, 0).toFixed(2)}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-center text-blue-600">
                        R$ {monthlyEarningsData.length > 0
                    ? (() => {
                        const totalGanho = monthlyEarningsData.reduce((acc, col) => acc + col.ganhoTotal, 0);
                        const totalLancamentos = monthlyEarningsData.reduce((acc, col) => acc + col.totalLancamentos, 0);
                        return totalLancamentos > 0 ? (totalGanho / totalLancamentos).toFixed(2) : '0.00';
                    })()
                    : '0.00'}
                      </td>
                    </tr>
                  </tfoot>
                </table>) : (<div className="flex items-center justify-center h-32 text-gray-500">
                  <div className="text-center">
                    <p className="text-lg mb-2">Nenhum dado encontrado</p>
                    <p className="text-sm">Tente ajustar os filtros ou verificar se há lançamentos aprovados no período selecionado.</p>
                  </div>
                </div>)}
            </div>)}
        </CardContent>
      </Card>
    </div>);
};
export default ProductivityDashboard;
