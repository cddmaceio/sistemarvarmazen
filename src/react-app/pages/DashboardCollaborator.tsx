import { useState, useEffect } from 'react';
import { TrendingUp, Target, DollarSign, Activity, Trophy, ArrowLeft, ArrowRight, Download, Calendar } from 'lucide-react';
import { Link } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/react-app/components/Card';
import { Button } from '@/react-app/components/Button';
import AuthGuard from '@/react-app/components/AuthGuard';
import UserMenu from '@/react-app/components/UserMenu';
import { useAuth } from '@/react-app/hooks/useAuth';

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
  historico?: HistoricoAtividade[];
  tarefasValidas?: number;
  valorTarefas?: number;
  bonusKpis?: number;
  subtotalAtividades?: number;
}

interface HistoricoAtividade {
  data: string;
  valor: number;
  atividade: string;
  turno?: string;
  aprovadoPor?: string;
  kpis_atingidos?: any;
  tarefas_validas?: number;
  valor_tarefas?: number;
  bonus_kpis?: number;
  subtotal_atividades?: number;
}

export default function DashboardCollaborator() {
  const { user, userFunction } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [mesAtual, setMesAtual] = useState(new Date());
  const [lancamentosPendentesReprovados, setLancamentosPendentesReprovados] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user, mesAtual]);

  const fetchDashboardData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Buscar dados dos lançamentos aprovados para este colaborador
      console.log('=== DASHBOARD COLABORADOR DEBUG ===');
      console.log('User ID:', user?.id);
      console.log('User Nome:', user?.nome);
      
      const response = await fetch(`/api/lancamentos-produtividade?user_id=${user?.id}`);
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`Falha ao carregar dados: ${response.status} ${response.statusText}`);
      }
      
      const historico = await response.json();
      console.log('Dados recebidos da API:', historico);
      console.log('Quantidade de lançamentos:', historico?.length || 0);
      
      // Buscar lançamentos pendentes e reprovados
      const responsePendentesReprovados = await fetch(`/api/lancamentos?user_id=${user?.id}`);
      if (responsePendentesReprovados.ok) {
        const todoLancamentos = await responsePendentesReprovados.json();
        const pendentesReprovados = todoLancamentos.filter((item: any) => 
          item.status === 'pendente' || item.status === 'reprovado'
        );
        setLancamentosPendentesReprovados(pendentesReprovados);
      }
      
      // Filtrar por mês atual (já filtrado por usuário na API)
      console.log('Mês atual:', mesAtual.getMonth() + 1, mesAtual.getFullYear());
      
      const dadosUsuario = historico.filter((item: any) => {
        const dataLancamento = new Date(item.data_lancamento);
        const mesLancamento = dataLancamento.getMonth();
        const anoLancamento = dataLancamento.getFullYear();
        
        console.log('Item:', {
          data_lancamento: item.data_lancamento,
          mes: mesLancamento + 1,
          ano: anoLancamento,
          remuneracao: item.remuneracao_total
        });
        
        return mesLancamento === mesAtual.getMonth() && anoLancamento === mesAtual.getFullYear();
      });
      
      console.log('Dados filtrados por mês:', dadosUsuario.length);

      if (dadosUsuario.length === 0) {
        console.log('Nenhum dado encontrado para o mês atual, gerando dados vazios');
        setDashboardData(generateEmptyData());
        return;
      }

      // Processar dados reais
      const ganhoTotal = dadosUsuario.reduce((sum: number, item: any) => sum + item.remuneracao_total, 0);
      const diasTrabalhados = new Set(dadosUsuario.map((item: any) => item.data_lancamento)).size;
      const mediaDiaria = diasTrabalhados > 0 ? ganhoTotal / diasTrabalhados : 0;

      // Criar histórico completo com datas
      const historicoCompleto: HistoricoAtividade[] = [];
      
      // Agrupar por atividades baseado na função do usuário
      const atividadesPorTipo = dadosUsuario.reduce((acc: any, item: any) => {
        // Usar dados diretamente do lançamento
        const dados = {
          nome_atividade: item.nome_atividade,
          multiple_activities: item.multiple_activities ? JSON.parse(item.multiple_activities) : null,
          funcao: item.funcao,
          kpis_atingidos: item.kpis_atingidos,
          tarefas_validas: item.tarefas_validas,
          valor_tarefas: item.valor_tarefas,
          bonus_kpis: item.bonus_kpis,
          subtotal_atividades: item.subtotal_atividades
        };
        
        console.log('Dados do item:', {
          id: item.id,
          data: item.data_lancamento,
          kpis_atingidos: item.kpis_atingidos,
          tarefas_validas: item.tarefas_validas,
          valor_tarefas: item.valor_tarefas,
          bonus_kpis: item.bonus_kpis,
          subtotal_atividades: item.subtotal_atividades
        });
        const dataFormatada = formatDateSafe(item.data_lancamento);
        
        if (userFunction === 'Operador de Empilhadeira') {
          // Para operadores de empilhadeira, verificar se tem atividade específica ou apenas KPIs
          let nomeAtividade;
          if (!dados.nome_atividade || dados.nome_atividade.trim() === '') {
            // Lançamento apenas de KPIs
            nomeAtividade = 'KPIs Atingidos';
          } else {
            nomeAtividade = dados.nome_atividade;
          }
          
          if (!acc[nomeAtividade]) {
            acc[nomeAtividade] = {
              nome: nomeAtividade,
              icon: nomeAtividade === 'KPIs Atingidos' ? '📊' : '🏗️',
              dias: 0,
              totalGanho: 0,
              valores: [],
              historico: []
            };
          }
          acc[nomeAtividade].totalGanho += item.remuneracao_total;
          acc[nomeAtividade].valores.push(item.remuneracao_total);
          acc[nomeAtividade].historico.push({
            data: dataFormatada,
            valor: item.remuneracao_total,
            atividade: nomeAtividade,
            turno: item.turno,
            aprovadoPor: item.aprovado_por_nome || item.aprovado_por || 'Sistema'
          });
          acc[nomeAtividade].dias = new Set([...acc[nomeAtividade].valores.map((_: any, i: number) => i)]).size;
          
          historicoCompleto.push({
            data: dataFormatada,
            valor: item.remuneracao_total,
            atividade: nomeAtividade,
            turno: item.turno,
            aprovadoPor: item.aprovado_por_nome || item.aprovado_por || 'Sistema',
            kpis_atingidos: item.kpis_atingidos,
            tarefas_validas: item.tarefas_validas,
            valor_tarefas: item.valor_tarefas,
            bonus_kpis: item.bonus_kpis,
            subtotal_atividades: item.subtotal_atividades
          });
        } else if (userFunction === 'Ajudante de Armazém') {
          // Para múltiplas atividades
          if (dados.multiple_activities && Array.isArray(dados.multiple_activities)) {
            dados.multiple_activities.forEach((activity: any) => {
              const subAtividade = activity.nome_atividade;
              if (!acc[subAtividade]) {
                acc[subAtividade] = {
                  nome: subAtividade,
                  icon: getActivityIcon(subAtividade),
                  dias: 0,
                  totalGanho: 0,
                  valores: [],
                  historico: []
                };
              }
              const valorProporcional = item.remuneracao_total / dados.multiple_activities.length;
              acc[subAtividade].totalGanho += valorProporcional;
              acc[subAtividade].valores.push(valorProporcional);
              acc[subAtividade].historico.push({
                data: dataFormatada,
                valor: valorProporcional,
                atividade: subAtividade,
                turno: item.turno,
                aprovadoPor: item.aprovado_por_nome || item.aprovado_por || 'Sistema'
              });
              acc[subAtividade].dias = acc[subAtividade].valores.length;
              
              historicoCompleto.push({
                data: dataFormatada,
                valor: valorProporcional,
                atividade: subAtividade,
                turno: item.turno,
                aprovadoPor: item.aprovado_por_nome || item.aprovado_por || 'Sistema',
                kpis_atingidos: item.kpis_atingidos,
                tarefas_validas: item.tarefas_validas,
                valor_tarefas: item.valor_tarefas,
                bonus_kpis: item.bonus_kpis,
                subtotal_atividades: item.subtotal_atividades
              });
            });
          } else {
            // Atividade única - verificar se tem nome ou é apenas KPIs
            let nomeAtividade;
            if (!dados.nome_atividade || dados.nome_atividade.trim() === '') {
              // Lançamento apenas de KPIs
              nomeAtividade = 'KPIs Atingidos';
            } else {
              nomeAtividade = dados.nome_atividade;
            }
            
            if (!acc[nomeAtividade]) {
              acc[nomeAtividade] = {
                nome: nomeAtividade,
                icon: nomeAtividade === 'KPIs Atingidos' ? '📊' : getActivityIcon(nomeAtividade),
                dias: 0,
                totalGanho: 0,
                valores: [],
                historico: []
              };
            }
            acc[nomeAtividade].totalGanho += item.remuneracao_total;
            acc[nomeAtividade].valores.push(item.remuneracao_total);
            acc[nomeAtividade].historico.push({
              data: dataFormatada,
              valor: item.remuneracao_total,
              atividade: nomeAtividade,
              turno: item.turno,
              aprovadoPor: item.aprovado_por_nome || item.aprovado_por || 'Sistema'
            });
            acc[nomeAtividade].dias = acc[nomeAtividade].valores.length;
            
            historicoCompleto.push({
              data: dataFormatada,
              valor: item.remuneracao_total,
              atividade: nomeAtividade,
              turno: item.turno,
              aprovadoPor: item.aprovado_por_nome || item.aprovado_por || 'Sistema',
              kpis_atingidos: item.kpis_atingidos,
              tarefas_validas: item.tarefas_validas,
              valor_tarefas: item.valor_tarefas,
              bonus_kpis: item.bonus_kpis,
              subtotal_atividades: item.subtotal_atividades
            });
          }
        }
        
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
        metaMensal: getMetaByFunction(userFunction),
        percentualMeta: (ganhoTotal / getMetaByFunction(userFunction)) * 100,
        atividades,
        melhorDia: melhorDia ? {
          data: formatDateSafe(melhorDia.data_lancamento),
          valor: melhorDia.remuneracao_total,
          tempo: '8h 30min'
        } : { data: '', valor: 0, tempo: '' },
        comparativoMesAnterior: Math.random() * 20 - 10, // Simulado
        ganhosPorDia: generateDailyChart(dadosUsuario),
        kpis: {
          metaMensal: Math.min((ganhoTotal / getMetaByFunction(userFunction)) * 100, 100),
          produtividade: 94,
          eficiencia: 87,
          pontualidade: 100
        },
        historicoCompleto: historicoCompleto.sort((a, b) => new Date(b.data.split('/').reverse().join('-')).getTime() - new Date(a.data.split('/').reverse().join('-')).getTime())
      });

    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
      setDashboardData(generateEmptyData());
    } finally {
      setLoading(false);
    }
  };

  const getMetaByFunction = (funcao: string) => {
    switch (funcao) {
      case 'Operador de Empilhadeira': return 300;
      case 'Ajudante de Armazém': return 300;
      default: return 300;
    }
  };

  const generateEmptyData = (): DashboardData => ({
    ganhoTotal: 0,
    mediaDiaria: 0,
    metaMensal: getMetaByFunction(userFunction),
    percentualMeta: 0,
    atividades: [],
    melhorDia: { data: '', valor: 0, tempo: '' },
    comparativoMesAnterior: 0,
    ganhosPorDia: [],
    kpis: {
      metaMensal: 0,
      produtividade: 0,
      eficiencia: 0,
      pontualidade: 0
    },
    historicoCompleto: []
  });

  const generateDailyChart = (dados: any[]) => {
    const diasDoMes = new Date(mesAtual.getFullYear(), mesAtual.getMonth() + 1, 0).getDate();
    const ganhosPorDia = Array.from({ length: diasDoMes }, (_, i) => ({ dia: i + 1, valor: 0 }));
    
    dados.forEach(item => {
      const dia = new Date(item.data_lancamento).getDate();
      ganhosPorDia[dia - 1].valor += item.remuneracao_total;
    });
    
    return ganhosPorDia;
  };

  const getActivityIcon = (nome: string) => {
    if (nome === 'KPIs Atingidos') return '📊';
    if (nome.includes('Repack')) return '📦';
    if (nome.includes('Amarração')) return '🔗';
    if (nome.includes('Devolução')) return '↩️';
    if (nome.includes('Refugo')) return '🗑️';
    if (nome.includes('Retorno')) return '🔄';
    if (nome.includes('Retrabalho')) return '🔧';
    if (nome.includes('Blocagem')) return '🚧';
    if (nome.includes('Empilhadeira')) return '🏗️';
    return '⚡';
  };

  const getActivityColor = (nome: string) => {
    if (nome === 'KPIs Atingidos') return '#6366F1';
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
      `Colaborador: ${user?.nome}\n` +
      `Função: ${userFunction}\n` +
      `CPF: ${user?.cpf}\n\n` +
      `Ganho Total: R$ ${dashboardData.ganhoTotal.toFixed(2)}\n` +
      `Média Diária: R$ ${dashboardData.mediaDiaria.toFixed(2)}\n` +
      `Meta Mensal: ${dashboardData.percentualMeta.toFixed(1)}% atingido\n\n` +
      `Atividades Realizadas:\n` +
      dashboardData.atividades.map(ativ => 
        `${ativ.nome}: R$ ${ativ.totalGanho.toFixed(2)} (${ativ.dias} dias) - ${ativ.performance}`
      ).join('\n');
    
    const blob = new Blob([dados], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio_${user?.nome.replace(/\s/g, '_')}_${mesAtual.getMonth() + 1}_${mesAtual.getFullYear()}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando seus dados de performance...</p>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        {/* Header */}
        <header className="border-b bg-white/70 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                  <Trophy className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    🏆 MEU DESEMPENHO
                  </h1>
                  <p className="text-sm text-gray-600">
                    👤 {user?.nome} | 💼 {userFunction} | 📅 {mesAtual.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Link to="/">
                  <Button variant="outline" size="sm">
                    <Calendar className="h-4 w-4 mr-2" />
                    Calculadora
                  </Button>
                </Link>
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
            
            <Button variant="outline" size="sm" onClick={exportarRelatorio}>
              <Download className="h-4 w-4 mr-2" />
              Exportar Relatório
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <main className="container mx-auto px-4 pb-8">
          <div className="max-w-7xl mx-auto space-y-8">
            {!dashboardData || dashboardData.ganhoTotal === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Nenhum dado encontrado
                  </h3>
                  <p className="text-gray-600">
                    Você ainda não possui lançamentos aprovados para este período.
                  </p>
                  <Link to="/">
                    <Button className="mt-4">
                      <Calendar className="h-4 w-4 mr-2" />
                      Fazer um Lançamento
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <>
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
                            {dashboardData.percentualMeta.toFixed(1)}%
                          </p>
                          <p className="text-sm text-purple-600">
                            {dashboardData.percentualMeta >= 85 ? '🟢 Excelente' : 
                             dashboardData.percentualMeta >= 70 ? '🟡 Bom' : '🟠 Em progresso'}
                          </p>
                        </div>
                        <Target className="h-12 w-12 text-purple-600" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Seção 2: Atividades por Função */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Activity className="h-6 w-6" />
                      <span>🏃‍♂️ MINHAS ATIVIDADES - {userFunction}</span>
                    </CardTitle>
                    <CardDescription>
                      📋 Detalhamento das suas atividades específicas no período
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
                              {/* Exibir detalhes específicos para Operador de Empilhadeira */}
                              {userFunction === 'Operador de Empilhadeira' && atividade.tarefasValidas && (
                                <div className="mt-2 space-y-1">
                                  <p className="text-sm text-blue-600 font-medium">
                                    📋 Tarefas Válidas: {atividade.tarefasValidas} tarefas
                                  </p>
                                  <p className="text-sm text-green-600">
                                    💰 Valor por Tarefa: R$ 0,093
                                  </p>
                                  <p className="text-sm text-purple-600">
                                    📊 Média Diária: {(atividade.tarefasValidas / atividade.dias).toFixed(1)} tarefas/dia
                                  </p>
                                </div>
                              )}
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
                    </div>
                  </CardContent>
                </Card>

                {/* Seção 2.5: Visual Acumulado para Ajudante de Armazém */}
                {userFunction === 'Ajudante de Armazém' && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <TrendingUp className="h-6 w-6" />
                        <span>📊 GANHOS ACUMULADOS POR ATIVIDADE</span>
                      </CardTitle>
                      <CardDescription>
                        💰 Visualização acumulada dos seus ganhos por tipo de atividade no mês
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {dashboardData.atividades.map((atividade, index) => (
                          <div key={index} className="bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 rounded-xl p-4 hover:shadow-lg transition-all duration-300">
                            <div className="flex items-center justify-between mb-3">
                              <div className="text-3xl">{atividade.icon}</div>
                              <div className="text-right">
                                <div className="text-2xl font-bold" style={{ color: atividade.cor }}>
                                  R$ {atividade.totalGanho.toFixed(2)}
                                </div>
                                <div className="text-xs text-gray-500">Total Acumulado</div>
                              </div>
                            </div>
                            <h4 className="font-semibold text-gray-900 mb-2">{atividade.nome}</h4>
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-600">📅 Dias:</span>
                                <span className="font-medium">{atividade.dias}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">📈 Média/dia:</span>
                                <span className="font-medium">R$ {atividade.mediaDia.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">🎯 Performance:</span>
                                <span className={`font-medium ${getPerformanceColor(atividade.performance).split(' ')[0]}`}>
                                  {getPerformanceEmoji(atividade.performance)} {atividade.performance}
                                </span>
                              </div>
                            </div>
                            {/* Barra de progresso visual */}
                            <div className="mt-3">
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="h-2 rounded-full transition-all duration-500" 
                                  style={{ 
                                    backgroundColor: atividade.cor, 
                                    width: `${Math.min((atividade.totalGanho / Math.max(...dashboardData.atividades.map(a => a.totalGanho))) * 100, 100)}%` 
                                  }}
                                ></div>
                              </div>
                              <div className="text-xs text-gray-500 mt-1 text-center">
                                {((atividade.totalGanho / dashboardData.ganhoTotal) * 100).toFixed(1)}% do total
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Seção 2.6: Calendário Visual de Lançamentos */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Calendar className="h-6 w-6" />
                      <span>📅 CALENDÁRIO DE LANÇAMENTOS</span>
                    </CardTitle>
                    <CardDescription>
                      🗓️ Visualização dos dias com lançamentos de produtividade (Segunda a Sábado)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Legenda */}
                      <div className="flex items-center justify-center space-x-6 p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                          <span className="text-sm text-gray-700">✅ Com lançamento</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                          <span className="text-sm text-gray-700">❌ Sem lançamento</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                          <span className="text-sm text-gray-700">⏳ Pendente/Reprovado</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 bg-gray-300 rounded-full"></div>
                          <span className="text-sm text-gray-700">🚫 Domingo</span>
                        </div>
                      </div>
                      
                      {/* Calendário */}
                      <div className="grid grid-cols-7 gap-2">
                        {/* Cabeçalho dos dias da semana */}
                        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((dia, index) => (
                          <div key={index} className="text-center text-sm font-medium text-gray-600 p-2">
                            {dia}
                          </div>
                        ))}
                        
                        {/* Dias do mês */}
                        {(() => {
                          const diasDoMes = new Date(mesAtual.getFullYear(), mesAtual.getMonth() + 1, 0).getDate();
                          const primeiroDia = new Date(mesAtual.getFullYear(), mesAtual.getMonth(), 1).getDay();
                          const diasComLancamento = new Set(dashboardData.historicoCompleto.map(item => {
                            const [dia, mes, ano] = item.data.split('/');
                            return parseInt(dia);
                          }));
                          const diasPendentesReprovados = new Set(lancamentosPendentesReprovados.map(item => {
                            const data = new Date(item.data_lancamento);
                            return data.getDate();
                          }));
                          
                          const calendario = [];
                          
                          // Espaços vazios antes do primeiro dia
                          for (let i = 0; i < primeiroDia; i++) {
                            calendario.push(
                              <div key={`empty-${i}`} className="p-2"></div>
                            );
                          }
                          
                          // Dias do mês
                          for (let dia = 1; dia <= diasDoMes; dia++) {
                            const diaDaSemana = new Date(mesAtual.getFullYear(), mesAtual.getMonth(), dia).getDay();
                            const isDomingo = diaDaSemana === 0;
                            const temLancamento = diasComLancamento.has(dia);
                            const temPendenteReprovado = diasPendentesReprovados.has(dia);
                            
                            let corFundo = 'bg-gray-300'; // Domingo
                            let icone = '🚫';
                            let titulo = 'Domingo - Não há trabalho';
                            
                            if (!isDomingo) {
                              if (temLancamento) {
                                corFundo = 'bg-green-500';
                                icone = '✅';
                                titulo = 'Dia com lançamento aprovado';
                              } else if (temPendenteReprovado) {
                                corFundo = 'bg-yellow-500';
                                icone = '⏳';
                                titulo = 'Dia com lançamento pendente ou reprovado';
                              } else {
                                corFundo = 'bg-red-500';
                                icone = '❌';
                                titulo = 'Dia sem lançamento';
                              }
                            }
                            
                            calendario.push(
                              <div 
                                key={dia} 
                                className={`${corFundo} text-white rounded-lg p-2 text-center cursor-pointer hover:opacity-80 transition-all duration-200 relative group`}
                                title={titulo}
                              >
                                <div className="text-sm font-medium">{dia}</div>
                                <div className="text-xs mt-1">{icone}</div>
                                
                                {/* Tooltip */}
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                                  {titulo}
                                </div>
                              </div>
                            );
                          }
                          
                          return calendario;
                        })()}
                      </div>
                      
                      {/* Estatísticas do calendário */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                        <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                          <div className="text-2xl font-bold text-green-600">
                            {(() => {
                              const diasDoMes = new Date(mesAtual.getFullYear(), mesAtual.getMonth() + 1, 0).getDate();
                              const diasComLancamento = new Set(dashboardData.historicoCompleto.map(item => {
                                const [dia, mes, ano] = item.data.split('/');
                                return parseInt(dia);
                              }));
                              return diasComLancamento.size;
                            })()} 
                          </div>
                          <div className="text-sm text-green-700">✅ Dias com lançamento</div>
                        </div>
                        
                        <div className="text-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                          <div className="text-2xl font-bold text-yellow-600">
                            {lancamentosPendentesReprovados.length}
                          </div>
                          <div className="text-sm text-yellow-700">⏳ Pendentes/Reprovados</div>
                        </div>
                        
                        <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
                          <div className="text-2xl font-bold text-red-600">
                            {(() => {
                              const diasDoMes = new Date(mesAtual.getFullYear(), mesAtual.getMonth() + 1, 0).getDate();
                              const diasUteis = Array.from({length: diasDoMes}, (_, i) => i + 1).filter(dia => {
                                const diaDaSemana = new Date(mesAtual.getFullYear(), mesAtual.getMonth(), dia).getDay();
                                return diaDaSemana !== 0; // Não é domingo
                              }).length;
                              const diasComLancamento = new Set(dashboardData.historicoCompleto.map(item => {
                                const [dia, mes, ano] = item.data.split('/');
                                return parseInt(dia);
                              }));
                              const diasPendentesReprovados = new Set(lancamentosPendentesReprovados.map(item => {
                                const data = new Date(item.data_lancamento);
                                return data.getDate();
                              }));
                              return diasUteis - diasComLancamento.size - diasPendentesReprovados.size;
                            })()} 
                          </div>
                          <div className="text-sm text-red-700">❌ Dias sem lançamento</div>
                        </div>
                        
                        <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="text-2xl font-bold text-blue-600">
                            {(() => {
                              const diasDoMes = new Date(mesAtual.getFullYear(), mesAtual.getMonth() + 1, 0).getDate();
                              const diasUteis = Array.from({length: diasDoMes}, (_, i) => i + 1).filter(dia => {
                                const diaDaSemana = new Date(mesAtual.getFullYear(), mesAtual.getMonth(), dia).getDay();
                                return diaDaSemana !== 0; // Não é domingo
                              }).length;
                              const diasComLancamento = new Set(dashboardData.historicoCompleto.map(item => {
                                const [dia, mes, ano] = item.data.split('/');
                                return parseInt(dia);
                              }));
                              return Math.round((diasComLancamento.size / diasUteis) * 100);
                            })()}%
                          </div>
                          <div className="text-sm text-blue-700">📊 Taxa de lançamentos</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Seção 2.1: Histórico Detalhado de Lançamentos Aprovados */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Calendar className="h-6 w-6" />
                      <span>📋 HISTÓRICO DE LANÇAMENTOS RV APROVADOS</span>
                    </CardTitle>
                    <CardDescription>
                      📊 Todos os seus lançamentos RV aprovados no mês com detalhes completos
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {dashboardData.historicoCompleto.length > 0 ? (
                        dashboardData.historicoCompleto.map((item, index) => {
                          // Parse dos dados do lançamento para exibir detalhes
                          let kpisAtingidos = [];
                          let tarefasValidas = null;
                          let valorTarefas = null;
                          
                          try {
                            if (item.kpis_atingidos && typeof item.kpis_atingidos === 'string') {
                              kpisAtingidos = JSON.parse(item.kpis_atingidos);
                            } else if (Array.isArray(item.kpis_atingidos)) {
                              kpisAtingidos = item.kpis_atingidos;
                            }
                            
                            if (item.tarefas_validas) {
                              tarefasValidas = item.tarefas_validas;
                            }
                            if (item.valor_tarefas) {
                              valorTarefas = item.valor_tarefas;
                            }
                          } catch (e) {
                            console.log('Erro ao parsear dados do lançamento:', e);
                          }
                          
                          return (
                            <div key={index} className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg hover:shadow-md transition-all duration-200">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                  <div className="text-2xl">
                                    {dashboardData.atividades.find(a => a.nome === item.atividade)?.icon || '⚡'}
                                  </div>
                                  <div className="flex-1">
                                    <h4 className="font-semibold text-gray-900 text-lg">Lançamento RV</h4>
                                    <div className="flex items-center space-x-4 mt-1">
                                      <p className="text-sm text-gray-600 flex items-center">
                                        <Calendar className="h-4 w-4 mr-1" />
                                        📅 {item.data}
                                      </p>
                                      <p className="text-sm text-gray-600">
                                        🏢 {item.turno || 'N/A'}
                                      </p>
                                    </div>
                                    
                                    {/* Resumo detalhado */}
                                    <div className="mt-3 space-y-2 bg-white p-3 rounded border">
                                      <h5 className="font-medium text-gray-800">📊 Resumo do Lançamento:</h5>
                                      
                                      {/* KPIs Atingidos */}
                                      {kpisAtingidos.length > 0 && (
                                        <div className="text-sm">
                                          <span className="font-medium text-blue-600">🎯 KPIs Atingidos ({kpisAtingidos.length}):</span>
                                          <span className="text-gray-700 ml-2">{kpisAtingidos.join(', ')}</span>
                                          <span className="text-green-600 ml-2 font-medium">R$ {(item.bonus_kpis || 0).toFixed(2)}</span>
                                        </div>
                                      )}
                                      
                                      {/* Atividades para Operador de Empilhadeira */}
                                      {userFunction === 'Operador de Empilhadeira' && tarefasValidas && (
                                        <div className="text-sm">
                                          <span className="font-medium text-purple-600">📋 Tarefas Válidas:</span>
                                          <span className="text-gray-700 ml-2">{tarefasValidas} tarefas</span>
                                          <span className="text-green-600 ml-2 font-medium">R$ {((valorTarefas || 0) / 2).toFixed(2)}</span>
                                        </div>
                                      )}
                                      
                                      {/* Atividade principal */}
                                      {item.atividade && item.atividade !== 'KPIs Atingidos' && (
                                        <div className="text-sm">
                                          <span className="font-medium text-orange-600">🏃‍♂️ Atividade:</span>
                                          <span className="text-gray-700 ml-2">{item.atividade}</span>
                                          <span className="text-green-600 ml-2 font-medium">R$ {((item.subtotal_atividades || 0) / 2).toFixed(2)}</span>
                                        </div>
                                      )}
                                    </div>
                                    
                                    <div className="flex items-center space-x-4 mt-2">
                                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        ✅ Aprovado
                                      </span>
                                      {item.aprovadoPor && (
                                        <span className="text-xs text-gray-500">
                                          👤 Aprovado por: {item.aprovadoPor}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-2xl font-bold text-green-600">+ R$ {item.valor.toFixed(2)}</p>
                                  <p className="text-xs text-gray-500 mt-1">💰 Valor Final</p>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center py-12 text-gray-500">
                          <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum lançamento aprovado</h3>
                          <p className="text-gray-600">Você ainda não possui lançamentos aprovados para este mês.</p>
                          <Link to="/">
                            <Button className="mt-4" variant="outline">
                              <Calendar className="h-4 w-4 mr-2" />
                              Fazer um Lançamento
                            </Button>
                          </Link>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Seção 2.2: Resumo Acumulado */}
                <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <TrendingUp className="h-6 w-6" />
                      <span>📊 RESUMO ACUMULADO DO MÊS</span>
                    </CardTitle>
                    <CardDescription>
                      📈 Consolidado de todas as suas atividades e KPIs no período
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Total de Dias */}
                      <div className="bg-white p-4 rounded-lg border border-blue-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-blue-600">📅 DIAS TRABALHADOS</p>
                            <p className="text-2xl font-bold text-blue-900">
                              {dashboardData.historicoCompleto ? new Set(dashboardData.historicoCompleto.map(item => item.data)).size : 0}
                            </p>
                            <p className="text-xs text-blue-600">dias no mês</p>
                          </div>
                          <Calendar className="h-8 w-8 text-blue-500" />
                        </div>
                      </div>

                      {/* KPIs Atingidos */}
                      <div className="bg-white p-4 rounded-lg border border-green-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-green-600">🎯 KPIs ATINGIDOS</p>
                            <p className="text-2xl font-bold text-green-900">
                              {dashboardData.historicoCompleto ? 
                                dashboardData.historicoCompleto.reduce((total, item) => {
                                  try {
                                    let kpis = [];
                                    if (item.kpis_atingidos && typeof item.kpis_atingidos === 'string') {
                                      kpis = JSON.parse(item.kpis_atingidos);
                                    } else if (Array.isArray(item.kpis_atingidos)) {
                                      kpis = item.kpis_atingidos;
                                    }
                                    return total + (kpis.length || 0);
                                  } catch (e) {
                                    return total;
                                  }
                                }, 0) : 0
                              }
                            </p>
                            <p className="text-xs text-green-600">
                              R$ {dashboardData.historicoCompleto ? 
                                dashboardData.historicoCompleto.reduce((total, item) => total + (item.bonus_kpis || 0), 0).toFixed(2) : '0.00'
                              }
                            </p>
                          </div>
                          <Target className="h-8 w-8 text-green-500" />
                        </div>
                      </div>

                      {/* Tarefas Válidas */}
                      {userFunction === 'Operador de Empilhadeira' && (
                        <div className="bg-white p-4 rounded-lg border border-purple-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-purple-600">📋 TAREFAS VÁLIDAS</p>
                              <p className="text-2xl font-bold text-purple-900">
                                {dashboardData.historicoCompleto ? 
                                  dashboardData.historicoCompleto.reduce((total, item) => total + (item.tarefas_validas || 0), 0) : 0
                                }
                              </p>
                              <p className="text-xs text-purple-600">
                                Bruto: R$ {dashboardData.historicoCompleto ? 
                                  dashboardData.historicoCompleto.reduce((total, item) => total + (item.valor_tarefas || 0), 0).toFixed(2) : '0.00'
                                } | Líquido: R$ {dashboardData.historicoCompleto ? 
                                  (dashboardData.historicoCompleto.reduce((total, item) => total + (item.valor_tarefas || 0), 0) / 2).toFixed(2) : '0.00'
                                }
                              </p>
                            </div>
                            <Activity className="h-8 w-8 text-purple-500" />
                          </div>
                        </div>
                      )}

                      {/* Valor Total */}
                      <div className="bg-white p-4 rounded-lg border border-orange-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-orange-600">💰 VALOR TOTAL</p>
                            <p className="text-2xl font-bold text-orange-900">
                              R$ {dashboardData.ganhoTotal.toFixed(2)}
                            </p>
                            <p className="text-xs text-orange-600">
                              Média: R$ {dashboardData.mediaDiaria.toFixed(2)}/dia
                            </p>
                          </div>
                          <DollarSign className="h-8 w-8 text-orange-500" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Seção 3: Histórico de Lançamentos Pendentes/Reprovados */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Activity className="h-6 w-6" />
                      <span>📋 HISTÓRICO DE LANÇAMENTOS PENDENTES/REPROVADOS</span>
                    </CardTitle>
                    <CardDescription>
                      📊 Lançamentos aguardando aprovação ou que foram reprovados
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {lancamentosPendentesReprovados.length > 0 ? (
                      lancamentosPendentesReprovados
                        .filter((item: any) => {
                          const dataLancamento = new Date(item.data_lancamento);
                          const mesLancamento = dataLancamento.getMonth();
                          const anoLancamento = dataLancamento.getFullYear();
                          return mesLancamento === mesAtual.getMonth() && anoLancamento === mesAtual.getFullYear();
                        })
                        .map((item, index) => {
                          // Parse dos dados do lançamento para exibir detalhes
                          let kpisAtingidos = [];
                          let tarefasValidas = null;
                          let valorTarefas = null;
                          
                          try {
                            if (item.kpis_atingidos && typeof item.kpis_atingidos === 'string') {
                              kpisAtingidos = JSON.parse(item.kpis_atingidos);
                            } else if (Array.isArray(item.kpis_atingidos)) {
                              kpisAtingidos = item.kpis_atingidos;
                            }
                            
                            if (item.tarefas_validas) {
                              tarefasValidas = item.tarefas_validas;
                            }
                            if (item.valor_tarefas) {
                              valorTarefas = item.valor_tarefas;
                            }
                          } catch (e) {
                            console.log('Erro ao parsear dados do lançamento:', e);
                          }
                          
                          const isPendente = item.status === 'pendente';
                          const isReprovado = item.status === 'reprovado';
                          
                          return (
                            <div key={index} className={`p-4 border rounded-lg hover:shadow-md transition-all duration-200 ${
                              isPendente ? 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200' : 
                              'bg-gradient-to-r from-red-50 to-rose-50 border-red-200'
                            }`}>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                  <div className="text-2xl">
                                    {getActivityIcon(item.nome_atividade || 'KPIs Atingidos')}
                                  </div>
                                  <div className="flex-1">
                                    <h4 className="font-semibold text-gray-900 text-lg">Lançamento RV</h4>
                                    <div className="flex items-center space-x-4 mt-1">
                                      <p className="text-sm text-gray-600 flex items-center">
                                        <Calendar className="h-4 w-4 mr-1" />
                                        📅 {formatDateSafe(item.data_lancamento)}
                                      </p>
                                      <p className="text-sm text-gray-600">
                                        🏢 {item.turno || 'N/A'}
                                      </p>
                                    </div>
                                    
                                    {/* Resumo detalhado */}
                                    <div className="mt-3 space-y-2 bg-white p-3 rounded border">
                                      <h5 className="font-medium text-gray-800">📊 Resumo do Lançamento:</h5>
                                      
                                      {/* KPIs Atingidos */}
                                      {kpisAtingidos.length > 0 && (
                                        <div className="text-sm">
                                          <span className="font-medium text-blue-600">🎯 KPIs Atingidos ({kpisAtingidos.length}):</span>
                                          <span className="text-gray-700 ml-2">{kpisAtingidos.join(', ')}</span>
                                          <span className="text-green-600 ml-2 font-medium">R$ {(item.bonus_kpis || 0).toFixed(2)}</span>
                                        </div>
                                      )}
                                      
                                      {/* Atividades para Operador de Empilhadeira */}
                                      {userFunction === 'Operador de Empilhadeira' && tarefasValidas && (
                                        <div className="text-sm">
                                          <span className="font-medium text-purple-600">📋 Tarefas Válidas:</span>
                                          <span className="text-gray-700 ml-2">{tarefasValidas} tarefas</span>
                                          <span className="text-green-600 ml-2 font-medium">R$ {((valorTarefas || 0) / 2).toFixed(2)}</span>
                                        </div>
                                      )}
                                      
                                      {/* Atividade principal */}
                                      {item.nome_atividade && item.nome_atividade !== 'KPIs Atingidos' && (
                                        <div className="text-sm">
                                          <span className="font-medium text-orange-600">🏃‍♂️ Atividade:</span>
                                          <span className="text-gray-700 ml-2">{item.nome_atividade}</span>
                                          <span className="text-green-600 ml-2 font-medium">R$ {((item.subtotal_atividades || 0) / 2).toFixed(2)}</span>
                                        </div>
                                      )}
                                    </div>
                                    
                                    <div className="flex items-center space-x-4 mt-2">
                                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                        isPendente ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                                      }`}>
                                        {isPendente ? '⏳ Pendente' : '❌ Reprovado'}
                                      </span>
                                      {item.aprovadoPor && (
                                        <span className="text-xs text-gray-500">
                                          👤 {isReprovado ? 'Reprovado' : 'Analisado'} por: {item.aprovadoPor}
                                        </span>
                                      )}
                                      {isReprovado && item.motivo_reprovacao && (
                                        <span className="text-xs text-red-600">
                                          💬 Motivo: {item.motivo_reprovacao}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className={`text-2xl font-bold ${
                                    isPendente ? 'text-yellow-600' : 'text-red-600'
                                  }`}>
                                    {isPendente ? '⏳' : '❌'} R$ {(item.remuneracao_total || 0).toFixed(2)}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-1">💰 Valor {isPendente ? 'Pendente' : 'Reprovado'}</p>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center py-12 text-gray-500">
                          <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum lançamento pendente/reprovado</h3>
                          <p className="text-gray-600">Você não possui lançamentos pendentes ou reprovados para este mês.</p>
                          <Link to="/">
                            <Button className="mt-4" variant="outline">
                              <Calendar className="h-4 w-4 mr-2" />
                              Fazer um Lançamento
                            </Button>
                          </Link>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Seção 4: Insights e KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
                    <CardHeader>
                      <CardTitle className="text-lg text-yellow-800">🥇 MELHOR DIA</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {dashboardData.melhorDia.data ? (
                        <div className="space-y-2">
                          <p className="font-bold text-xl text-yellow-900">
                            📅 {dashboardData.melhorDia.data}
                          </p>
                          <p className="text-lg font-semibold text-yellow-800">
                            💰 R$ {dashboardData.melhorDia.valor.toFixed(2)}
                          </p>
                          <p className="text-sm text-yellow-700">
                            📊 Tempo trabalhado: {dashboardData.melhorDia.tempo}
                          </p>
                          <p className="text-sm text-yellow-600">
                            🏆 Seu recorde pessoal
                          </p>
                        </div>
                      ) : (
                        <p className="text-yellow-700">Sem dados disponíveis</p>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
                    <CardHeader>
                      <CardTitle className="text-lg text-indigo-800">⭐ PROGRESSO DA META</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-indigo-700">Meta {userFunction}</span>
                            <span className="text-sm font-bold text-indigo-900">{dashboardData.percentualMeta.toFixed(0)}%</span>
                          </div>
                          <div className="w-full bg-indigo-200 rounded-full h-3">
                            <div 
                              className="bg-gradient-to-r from-indigo-400 to-purple-600 h-3 rounded-full transition-all duration-300"
                              style={{ width: `${Math.min(dashboardData.percentualMeta, 100)}%` }}
                            ></div>
                          </div>
                          <p className="text-xs text-indigo-600 mt-1">Meta: R$ {dashboardData.metaMensal.toFixed(2)}</p>
                        </div>
                        
                        <div className="text-center p-3 bg-white rounded-lg border border-indigo-200">
                          <p className="text-lg font-bold text-indigo-800">
                            {dashboardData.percentualMeta >= 100 ? '🎉 META SUPERADA!' : 
                             dashboardData.percentualMeta >= 85 ? '🔥 QUASE LÁ!' : 
                             '💪 CONTINUE ASSIM!'}
                          </p>
                          <p className="text-sm text-indigo-600">
                            Faltam R$ {Math.max(0, dashboardData.metaMensal - dashboardData.ganhoTotal).toFixed(2)} para a meta
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
