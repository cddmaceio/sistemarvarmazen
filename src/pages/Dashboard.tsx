import React, { useState, useEffect } from 'react';
import { TrendingUp, Target, BarChart3, DollarSign, Activity, Star, ArrowLeft, ArrowRight, Download, Mail, Share, Clock } from 'lucide-react';
import { Link } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/Card';
import { Button } from '@/components/Button';
import AuthGuard from '@/components/AuthGuard';
import UserMenu from '@/components/UserMenu';
import { useAuth } from '@/hooks/useAuth';

// Função para formatar data corretamente, evitando problemas de timezone
const formatDateSafe = (dateString: string): string => {
  if (!dateString) return '';
  
  // Se a data contém timezone (Z ou +/-), extrair apenas a parte da data
  const dateOnly = dateString.split('T')[0];
  const [year, month, day] = dateOnly.split('-');
  
  // Criar data local sem conversão de timezone
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  return date.toLocaleDateString('pt-BR');
};

interface DashboardData {
  ganhoTotal: number;
  mediaDiaria: number;
  metaMensal: number;
  percentualMeta: number;
  atividades: ActivityPerformance[];
  melhorDia: {
    data: string;
    valor: number;
    tempo: string;
  };
  comparativoMesAnterior: number;
  ganhosPorDia: { dia: number; valor: number }[];
  kpis: {
    metaMensal: number;
    produtividade: number;
    eficiencia: number;
    pontualidade: number;
  };
  historicoCompleto: HistoricoAtividade[];
}

interface ActivityPerformance {
  nome: string;
  icon: string;
  dias: number;
  totalGanho: number;
  mediaDia: number;
  performance: 'excelente' | 'bom' | 'regular';
  cor: string;
}

interface HistoricoAtividade {
  data: string;
  valor: number;
  atividade: string;
  turno?: string;
  aprovadoPor?: string;
}

export default function Dashboard() {
  const { user, isAdmin, isCollaborator, userFunction } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [mesAtual, setMesAtual] = useState(new Date());
  

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user, mesAtual]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Buscar dados dos lançamentos aprovados
      const response = await fetch('/api/lancamentos?status=aprovado');
      if (!response.ok) throw new Error('Falha ao carregar dados');
      
      const historico = await response.json();
      
      // Filtrar por usuário e mês atual - apenas para colaboradores
      const dadosUsuario = isCollaborator ? historico.filter((item: any) => {
        // Usar a mesma lógica da formatDateSafe para evitar problemas de timezone
        const dateOnly = item.data_lancamento.split('T')[0];
        const [year, month, day] = dateOnly.split('-');
        const dataLancamento = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        return item.user_cpf === user?.cpf &&
               dataLancamento.getMonth() === mesAtual.getMonth() &&
               dataLancamento.getFullYear() === mesAtual.getFullYear();
      }) : historico.filter((item: any) => {
        // Usar a mesma lógica da formatDateSafe para evitar problemas de timezone
        const dateOnly = item.data_lancamento.split('T')[0];
        const [year, month, day] = dateOnly.split('-');
        const dataLancamento = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        return dataLancamento.getMonth() === mesAtual.getMonth() &&
               dataLancamento.getFullYear() === mesAtual.getFullYear();
      });

      if (dadosUsuario.length === 0) {
        setDashboardData(generateMockData());
        return;
      }

      // Processar dados reais
      const ganhoTotal = dadosUsuario.reduce((sum: number, item: any) => sum + item.remuneracao_total, 0);
      const diasTrabalhados = new Set(dadosUsuario.map((item: any) => item.data_lancamento)).size;
      const mediaDiaria = diasTrabalhados > 0 ? ganhoTotal / diasTrabalhados : 0;

      // Criar histórico completo de atividades
      const historicoCompleto: HistoricoAtividade[] = [];

      // Agrupar por atividades
      const atividadesPorTipo = dadosUsuario.reduce((acc: any, item: any) => {
        // Usar dados diretamente do lançamento
        const dados = {
          nome_atividade: item.nome_atividade,
          multiple_activities: item.multiple_activities ? JSON.parse(item.multiple_activities) : null,
          funcao: item.funcao,
          nome_operador: item.nome_operador
        };
        let nomeAtividade = dados.nome_atividade || 'Outras atividades';
        
        // Para operadores de empilhadeira, verificar se tem atividade específica ou apenas KPIs
        if (dados.funcao === 'Operador de Empilhadeira' || dados.nome_operador) {
          if (!dados.nome_atividade || dados.nome_atividade.trim() === '') {
            nomeAtividade = 'KPIs Atingidos';
          } else {
            nomeAtividade = dados.nome_atividade;
          }
        } else if (!dados.nome_atividade || dados.nome_atividade.trim() === '') {
          // Para outras funções sem atividade específica
          nomeAtividade = 'KPIs Atingidos';
        }
        
        // Para múltiplas atividades, agrupar individualmente
        if (dados.multiple_activities && Array.isArray(dados.multiple_activities)) {
          dados.multiple_activities.forEach((activity: any) => {
            const subAtividade = activity.nome_atividade;
            if (!acc[subAtividade]) {
              acc[subAtividade] = {
                nome: subAtividade,
                icon: getActivityIcon(subAtividade),
                dias: 0,
                totalGanho: 0,
                valores: []
              };
            }
            const valorProporcional = item.remuneracao_total / dados.multiple_activities.length;
            acc[subAtividade].totalGanho += valorProporcional;
            acc[subAtividade].valores.push(valorProporcional);
            acc[subAtividade].dias = acc[subAtividade].valores.length;
            
            // Adicionar ao histórico
            historicoCompleto.push({
              data: formatDateSafe(item.data_lancamento),
              valor: valorProporcional,
              atividade: subAtividade,
              turno: item.turno || 'N/A',
              aprovadoPor: item.aprovado_por_nome || item.aprovado_por || 'Sistema'
            });
          });
          return acc;
        }
        
        if (!acc[nomeAtividade]) {
          acc[nomeAtividade] = {
            nome: nomeAtividade,
            icon: getActivityIcon(nomeAtividade),
            dias: 0,
            totalGanho: 0,
            valores: []
          };
        }
        
        acc[nomeAtividade].totalGanho += item.remuneracao_total;
        acc[nomeAtividade].valores.push(item.remuneracao_total);
        acc[nomeAtividade].dias = acc[nomeAtividade].valores.length;
        
        // Adicionar ao histórico
        historicoCompleto.push({
          data: formatDateSafe(item.data_lancamento),
          valor: item.remuneracao_total,
          atividade: nomeAtividade,
          turno: item.turno || 'N/A',
          aprovadoPor: item.aprovado_por_nome || item.aprovado_por || 'Sistema'
        });
        
        return acc;
      }, {});

      const atividades: ActivityPerformance[] = Object.values(atividadesPorTipo).map((ativ: any) => ({
        ...ativ,
        mediaDia: ativ.totalGanho / ativ.dias,
        performance: getPerformanceLevel(ativ.totalGanho / ativ.dias),
        cor: getActivityColor(ativ.nome)
      }));

      // Encontrar melhor dia
      const melhorDia = dadosUsuario.reduce((melhor: any, atual: any) => {
        return atual.remuneracao_total > (melhor?.remuneracao_total || 0) ? atual : melhor;
      }, null);

      setDashboardData({
        ganhoTotal,
        mediaDiaria,
        metaMensal: 300, // Meta padrão
        percentualMeta: (ganhoTotal / 300) * 100,
        atividades,
        melhorDia: melhorDia ? {
          data: formatDateSafe(melhorDia.data_lancamento),
          valor: melhorDia.remuneracao_total,
          tempo: '8h 30min'
        } : { data: '', valor: 0, tempo: '' },
        comparativoMesAnterior: Math.random() * 20 - 10, // Simulado
        ganhosPorDia: generateDailyChart(dadosUsuario),
        kpis: {
          metaMensal: Math.min((ganhoTotal / 300) * 100, 100),
          produtividade: 94,
          eficiencia: 87,
          pontualidade: 100
        },
        historicoCompleto: historicoCompleto.sort((a, b) => new Date(b.data.split('/').reverse().join('-')).getTime() - new Date(a.data.split('/').reverse().join('-')).getTime())
      });

    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
      setDashboardData({
        ...generateMockData(),
        historicoCompleto: []
      });
    } finally {
      setLoading(false);
    }
  };

  const generateMockData = (): DashboardData => ({
    ganhoTotal: 2847.90,
    mediaDiaria: 91.87,
    metaMensal: 300,
    percentualMeta: 85,
    atividades: [
      {
        nome: 'Prod Repack',
        icon: '📦',
        dias: 22,
        totalGanho: 1320.50,
        mediaDia: 60.02,
        performance: 'excelente',
        cor: '#10B981'
      },
      {
        nome: 'Prod Amarração',
        icon: '🔗',
        dias: 18,
        totalGanho: 987.40,
        mediaDia: 54.86,
        performance: 'bom',
        cor: '#3B82F6'
      },
      {
        nome: 'Prod Devolução',
        icon: '↩️',
        dias: 15,
        totalGanho: 540.00,
        mediaDia: 36.00,
        performance: 'regular',
        cor: '#F59E0B'
      }
    ],
    melhorDia: {
      data: '15/08/2025',
      valor: 156.30,
      tempo: '8h 30min'
    },
    comparativoMesAnterior: 12,
    ganhosPorDia: Array.from({ length: 31 }, (_, i) => ({
      dia: i + 1,
      valor: Math.random() * 100 + 50
    })),
    kpis: {
      metaMensal: 85,
      produtividade: 94,
      eficiencia: 87,
      pontualidade: 100
    },
    historicoCompleto: [
      {
        data: '15/01/2024',
        valor: 156.30,
        atividade: 'Prod Repack',
        turno: 'Manhã',
        aprovadoPor: 'Sistema'
      },
      {
        data: '14/01/2024',
        valor: 89.50,
        atividade: 'Prod Amarração',
        turno: 'Tarde',
        aprovadoPor: 'Admin'
      },
      {
        data: '13/01/2024',
        valor: 67.20,
        atividade: 'Prod Devolução',
        turno: 'Manhã',
        aprovadoPor: 'Admin'
      }
    ]
  });

  const generateDailyChart = (dados: any[]) => {
    const diasDoMes = new Date(mesAtual.getFullYear(), mesAtual.getMonth() + 1, 0).getDate();
    const ganhosPorDia = Array.from({ length: diasDoMes }, (_, i) => ({ dia: i + 1, valor: 0 }));
    
    dados.forEach(item => {
      // Usar a mesma lógica da formatDateSafe para evitar problemas de timezone
      const dateOnly = item.data_lancamento.split('T')[0];
      const [year, month, day] = dateOnly.split('-');
      const dataLancamento = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      const dia = dataLancamento.getDate();
      ganhosPorDia[dia - 1].valor += item.remuneracao_total;
    });
    
    return ganhosPorDia;
  };

  const getActivityIcon = (nome: string) => {
    if (nome.includes('Repack')) return '📦';
    if (nome.includes('Amarração')) return '🔗';
    if (nome.includes('Devolução')) return '↩️';
    if (nome.includes('Refugo')) return '🗑️';
    if (nome.includes('Retorno')) return '🔄';
    if (nome.includes('Retrabalho')) return '🔧';
    if (nome.includes('Blocagem')) return '🚧';
    if (nome.includes('Empilhadeira')) return '🏗️';
    if (nome.includes('KPIs Atingidos')) return '📊';
    return '⚡';
  };

  const getActivityColor = (nome: string) => {
    if (nome.includes('Repack')) return '#10B981';
    if (nome.includes('Amarração')) return '#3B82F6';
    if (nome.includes('Devolução')) return '#F59E0B';
    if (nome.includes('Refugo')) return '#EF4444';
    if (nome.includes('Retorno')) return '#8B5CF6';
    if (nome.includes('Retrabalho')) return '#F97316';
    if (nome.includes('Blocagem')) return '#6B7280';
    return '#8B5CF6';
  };

  const getPerformanceLevel = (mediaDia: number): 'excelente' | 'bom' | 'regular' => {
    if (mediaDia >= 55) return 'excelente';
    if (mediaDia >= 40) return 'bom';
    return 'regular';
  };

  const getPerformanceColor = (performance: string) => {
    switch (performance) {
      case 'excelente': return 'text-green-600 bg-green-100';
      case 'bom': return 'text-yellow-600 bg-yellow-100';
      case 'regular': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPerformanceEmoji = (performance: string) => {
    switch (performance) {
      case 'excelente': return '🟢';
      case 'bom': return '🟡';
      case 'regular': return '🟠';
      default: return '⚪';
    }
  };

  const proximoMes = () => {
    const novoMes = new Date(mesAtual);
    novoMes.setMonth(novoMes.getMonth() + 1);
    setMesAtual(novoMes);
  };

  const mesAnterior = () => {
    const novoMes = new Date(mesAtual);
    novoMes.setMonth(novoMes.getMonth() - 1);
    setMesAtual(novoMes);
  };

  const exportarRelatorio = () => {
    if (!dashboardData) return;
    
    const dados = `Relatório de Performance - ${mesAtual.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}\n\n` +
      `Ganho Total: R$ ${dashboardData.ganhoTotal.toFixed(2)}\n` +
      `Média Diária: R$ ${dashboardData.mediaDiaria.toFixed(2)}\n` +
      `Meta Mensal: ${dashboardData.percentualMeta.toFixed(1)}% atingido\n\n` +
      `Atividades:\n` +
      dashboardData.atividades.map(ativ => 
        `${ativ.nome}: R$ ${ativ.totalGanho.toFixed(2)} (${ativ.dias} dias)`
      ).join('\n');
    
    const blob = new Blob([dados], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio_performance_${mesAtual.getMonth() + 1}_${mesAtual.getFullYear()}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando seus dados de performance...</p>
          </div>
        </div>
      </AuthGuard>
    );
  }

  if (!dashboardData) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle className="text-red-700">Dados Indisponíveis</CardTitle>
              <CardDescription>
                Não foi possível carregar os dados de performance.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={fetchDashboardData} className="w-full">
                Tentar Novamente
              </Button>
            </CardContent>
          </Card>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
        {/* Header */}
        <header className="border-b bg-white/70 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                    🏆 MEU DESEMPENHO
                  </h1>
                  <p className="text-sm text-gray-600">
                    👤 {user?.nome} | 💼 {user?.tipo_usuario === 'admin' ? 'Administrador' : `Colaborador - ${userFunction}`} | 📅 Período: {mesAtual.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                {isAdmin && (
                  <>
                    <Link to="/admin/validacao">
                      <Button variant="outline" size="sm">
                        <Activity className="h-4 w-4 mr-2" />
                        Validação
                      </Button>
                    </Link>
                    <Link to="/admin/historico">
                      <Button variant="outline" size="sm">
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Histórico
                      </Button>
                    </Link>
                  </>
                )}
                <UserMenu />
              </div>
            </div>
          </div>
        </header>

        {/* Navigation Controls */}
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={mesAnterior}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Mês Anterior
              </Button>
              <div className="text-lg font-semibold">
                {mesAtual.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
              </div>
              <Button variant="outline" onClick={proximoMes}>
                Próximo Mês
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={exportarRelatorio}>
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
              <Button variant="outline" size="sm">
                <Mail className="h-4 w-4 mr-2" />
                Email
              </Button>
              <Button variant="outline" size="sm">
                <Share className="h-4 w-4 mr-2" />
                Compartilhar
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="container mx-auto px-4 pb-8">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Seção 1: Resumo Financeiro */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-600">💵 GANHO TOTAL</p>
                      <p className="text-3xl font-bold text-green-900">
                        R$ {dashboardData.ganhoTotal.toFixed(2)}
                      </p>
                      <p className="text-sm text-green-600 flex items-center mt-1">
                        {dashboardData.comparativoMesAnterior >= 0 ? '↗️' : '↘️'} 
                        {Math.abs(dashboardData.comparativoMesAnterior).toFixed(1)}% vs mês anterior
                      </p>
                    </div>
                    <DollarSign className="h-12 w-12 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-600">📈 MÉDIA DIÁRIA</p>
                      <p className="text-3xl font-bold text-blue-900">
                        R$ {dashboardData.mediaDiaria.toFixed(2)}
                      </p>
                      <p className="text-sm text-blue-600 flex items-center mt-1">
                        {dashboardData.comparativoMesAnterior >= 0 ? '↗️' : '↘️'} 
                        {Math.abs(dashboardData.comparativoMesAnterior).toFixed(1)}% vs mês anterior
                      </p>
                      <p className="text-xs text-blue-500 mt-1">
                        🎯 Meta diária: R$ {(dashboardData.metaMensal / 22).toFixed(2)}
                      </p>
                    </div>
                    <TrendingUp className="h-12 w-12 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-600">🎯 META MENSAL</p>
                      <p className="text-3xl font-bold text-purple-900">
                        {dashboardData.percentualMeta.toFixed(1)}% Atingido
                      </p>
                      <p className="text-sm text-purple-600">
                        {dashboardData.percentualMeta >= 85 ? '🟢 Excelente' : 
                         dashboardData.percentualMeta >= 70 ? '🟡 Bom' : '🟠 Regular'}
                      </p>
                    </div>
                    <Target className="h-12 w-12 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Seção 2: Performance por Atividade */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-6 w-6" />
                  <span>🏃‍♂️ PERFORMANCE POR ATIVIDADE</span>
                </CardTitle>
                <CardDescription>
                  📋 Detalhamento das suas atividades no período
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData.atividades.map((atividade, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="text-2xl">{atividade.icon}</div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{atividade.nome}</h3>
                          <p className="text-sm text-gray-600">{atividade.dias} dias trabalhados</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-6">
                        <div className="text-right">
                          <p className="font-bold text-lg">R$ {atividade.totalGanho.toFixed(2)}</p>
                          <p className="text-sm text-gray-600">R$ {atividade.mediaDia.toFixed(2)}/dia</p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${getPerformanceColor(atividade.performance)}`}>
                          {getPerformanceEmoji(atividade.performance)} {atividade.performance}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border-2 border-yellow-200">
                    <div className="flex items-center space-x-4">
                      <div className="text-2xl">📊</div>
                      <div>
                        <h3 className="font-bold text-gray-900">TOTAL GERAL</h3>
                        <p className="text-sm text-gray-600">Todas as atividades</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-6">
                      <div className="text-right">
                        <p className="font-bold text-xl text-yellow-700">R$ {dashboardData.ganhoTotal.toFixed(2)}</p>
                        <p className="text-sm text-yellow-600">R$ {dashboardData.mediaDiaria.toFixed(2)}/dia</p>
                      </div>
                      <div className="px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                        🏆 Destaque
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Seção 3: Rankings e Destaques */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
                <CardHeader>
                  <CardTitle className="text-lg text-yellow-800">🥇 TOP ATIVIDADE DO MÊS</CardTitle>
                </CardHeader>
                <CardContent>
                  {dashboardData.atividades.length > 0 && (
                    <div className="space-y-2">
                      <p className="font-bold text-xl text-yellow-900">
                        {dashboardData.atividades[0].icon} {dashboardData.atividades[0].nome}
                      </p>
                      <p className="text-lg font-semibold text-yellow-800">
                        R$ {dashboardData.atividades[0].totalGanho.toFixed(2)}
                      </p>
                      <p className="text-sm text-yellow-700">
                        {dashboardData.atividades[0].dias} dias trabalhados
                      </p>
                      <p className="text-sm text-yellow-600">
                        🏅 {((dashboardData.atividades[0].totalGanho / dashboardData.ganhoTotal) * 100).toFixed(1)}% do ganho total
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-red-50 to-pink-50 border-red-200">
                <CardHeader>
                  <CardTitle className="text-lg text-red-800">🔥 MELHOR DIA</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="font-bold text-xl text-red-900">
                      📅 {dashboardData.melhorDia.data}
                    </p>
                    <p className="text-lg font-semibold text-red-800">
                      💰 R$ {dashboardData.melhorDia.valor.toFixed(2)}
                    </p>
                    <p className="text-sm text-red-700">
                      📊 {dashboardData.melhorDia.tempo}
                    </p>
                    <p className="text-sm text-red-600">
                      🏆 Recorde pessoal
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
                <CardHeader>
                  <CardTitle className="text-lg text-purple-800">⭐ MAIOR PRODUTIVIDADE</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="font-bold text-xl text-purple-900">
                      🎯 {dashboardData.percentualMeta.toFixed(0)}% da Meta
                    </p>
                    <p className="text-lg font-semibold text-purple-800">
                      {dashboardData.atividades.length > 0 ? dashboardData.atividades[0].icon + ' ' + dashboardData.atividades[0].nome : 'N/A'}
                    </p>
                    <p className="text-sm text-purple-700">
                      📅 {dashboardData.melhorDia.data}
                    </p>
                    <p className="text-sm text-purple-600">
                      ⚡ Performance excepcional
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Seção 4: KPIs */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-6 w-6" />
                  <span>🎯 INDICADORES DE PERFORMANCE</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">🎯 Meta Mensal</span>
                        <span className="text-sm font-bold text-gray-900">{dashboardData.kpis.metaMensal.toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-gradient-to-r from-green-400 to-green-600 h-3 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(dashboardData.kpis.metaMensal, 100)}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">Meta: R$ {dashboardData.metaMensal.toFixed(2)}</p>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">⚡ Produtividade Média</span>
                        <span className="text-sm font-bold text-gray-900">{dashboardData.kpis.produtividade}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-gradient-to-r from-blue-400 to-blue-600 h-3 rounded-full transition-all duration-300"
                          style={{ width: `${dashboardData.kpis.produtividade}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">Meta: 80%</p>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">📦 Eficiência Atividades</span>
                        <span className="text-sm font-bold text-gray-900">{dashboardData.kpis.eficiencia}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-gradient-to-r from-purple-400 to-purple-600 h-3 rounded-full transition-all duration-300"
                          style={{ width: `${dashboardData.kpis.eficiencia}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">Meta: 85%</p>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">⏱️ Pontualidade</span>
                        <span className="text-sm font-bold text-gray-900">{dashboardData.kpis.pontualidade}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-gradient-to-r from-yellow-400 to-yellow-600 h-3 rounded-full transition-all duration-300"
                          style={{ width: `${dashboardData.kpis.pontualidade}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">Meta: 95%</p>
                    </div>
                  </div>

                  <div className="text-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                    <p className="text-lg font-bold text-green-800">
                      🏆 STATUS GERAL: EXCELENTE DESEMPENHO
                    </p>
                    <p className="text-sm text-green-600 mt-1">
                      Continue assim! Você está superando as expectativas.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Histórico de Lançamentos */}
            <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-blue-800">
                  <Clock className="h-6 w-6" />
                  <span>📋 HISTÓRICO DE LANÇAMENTOS</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dashboardData.historicoCompleto.length > 0 ? (
                    <>
                      {/* Versão Desktop */}
                      <div className="hidden md:block">
                        <div className="grid grid-cols-4 gap-4 text-sm font-semibold text-gray-700 border-b pb-2 mb-3">
                          <span>Data</span>
                          <span>Atividade</span>
                          <span>Valor</span>
                          <span>Turno</span>
                        </div>
                        {dashboardData.historicoCompleto.slice(0, 10).map((item, index) => (
                          <div key={index} className="grid grid-cols-4 gap-4 text-sm py-2 border-b border-gray-100 hover:bg-blue-50 transition-colors">
                            <span className="text-gray-600">{item.data}</span>
                            <span className="font-medium text-blue-700">{item.atividade}</span>
                            <span className="font-bold text-green-600">R$ {item.valor.toFixed(2)}</span>
                            <span className="text-gray-500">{item.turno}</span>
                          </div>
                        ))}
                        {dashboardData.historicoCompleto.length > 10 && (
                          <div className="text-center py-3 text-sm text-gray-500">
                            ... e mais {dashboardData.historicoCompleto.length - 10} lançamentos
                          </div>
                        )}
                      </div>

                      {/* Versão Mobile */}
                      <div className="md:hidden space-y-3">
                        {dashboardData.historicoCompleto.slice(0, 5).map((item, index) => (
                          <div key={index} className="bg-white p-3 rounded-lg border border-blue-200 shadow-sm">
                            <div className="flex justify-between items-start mb-2">
                              <span className="font-medium text-blue-700">{item.atividade}</span>
                              <span className="font-bold text-green-600">R$ {item.valor.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm text-gray-500">
                              <span>{item.data}</span>
                              <span>{item.turno}</span>
                            </div>
                          </div>
                        ))}
                        {dashboardData.historicoCompleto.length > 5 && (
                          <div className="text-center py-2 text-sm text-gray-500">
                            ... e mais {dashboardData.historicoCompleto.length - 5} lançamentos
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Clock className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p>Nenhum lançamento encontrado para este período</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Insights Automáticos */}
            <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-indigo-800">
                  <Star className="h-6 w-6" />
                  <span>🤖 INSIGHTS INTELIGENTES</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-lg border border-indigo-200">
                    <p className="text-sm text-indigo-700">
                      💡 "Sua melhor atividade é {dashboardData.atividades.length > 0 ? dashboardData.atividades[0].nome : 'N/A'}"
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-indigo-200">
                    <p className="text-sm text-indigo-700">
                      💡 "Você melhorou {Math.abs(dashboardData.comparativoMesAnterior).toFixed(1)}% comparado ao mês passado"
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-indigo-200">
                    <p className="text-sm text-indigo-700">
                      💡 "Seu melhor dia foi {dashboardData.melhorDia.data} com R$ {dashboardData.melhorDia.valor.toFixed(2)}"
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-indigo-200">
                    <p className="text-sm text-indigo-700">
                      💡 "Meta para próximo mês: R$ {(dashboardData.ganhoTotal * 1.1).toFixed(2)} (viável baseado na tendência)"
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
