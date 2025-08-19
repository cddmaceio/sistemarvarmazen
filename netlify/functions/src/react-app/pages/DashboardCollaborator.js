"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = DashboardCollaborator;
const react_1 = require("react");
const lucide_react_1 = require("lucide-react");
const react_router_1 = require("react-router");
const Card_1 = require("@/react-app/components/Card");
const Button_1 = require("@/react-app/components/Button");
const AuthGuard_1 = __importDefault(require("@/react-app/components/AuthGuard"));
const UserMenu_1 = __importDefault(require("@/react-app/components/UserMenu"));
const useAuth_1 = require("@/react-app/hooks/useAuth");
function DashboardCollaborator() {
    const { user, userFunction } = (0, useAuth_1.useAuth)();
    const [dashboardData, setDashboardData] = (0, react_1.useState)(null);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [mesAtual, setMesAtual] = (0, react_1.useState)(new Date());
    (0, react_1.useEffect)(() => {
        if (user) {
            fetchDashboardData();
        }
    }, [user, mesAtual]);
    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            // Buscar dados dos lançamentos aprovados para este colaborador
            const response = await fetch('/api/historico-aprovacoes');
            if (!response.ok)
                throw new Error('Falha ao carregar dados');
            const historico = await response.json();
            // Filtrar por usuário e mês atual
            const dadosUsuario = historico.filter((item) => item.colaborador_cpf === user?.cpf &&
                new Date(item.data_lancamento).getMonth() === mesAtual.getMonth() &&
                new Date(item.data_lancamento).getFullYear() === mesAtual.getFullYear());
            if (dadosUsuario.length === 0) {
                setDashboardData(generateEmptyData());
                return;
            }
            // Processar dados reais
            const ganhoTotal = dadosUsuario.reduce((sum, item) => sum + item.remuneracao_total, 0);
            const diasTrabalhados = new Set(dadosUsuario.map((item) => item.data_lancamento)).size;
            const mediaDiaria = diasTrabalhados > 0 ? ganhoTotal / diasTrabalhados : 0;
            // Criar histórico completo com datas
            const historicoCompleto = [];
            // Agrupar por atividades baseado na função do usuário
            const atividadesPorTipo = dadosUsuario.reduce((acc, item) => {
                const dados = JSON.parse(item.dados_finais);
                const dataFormatada = new Date(item.data_lancamento).toLocaleDateString('pt-BR');
                if (userFunction === 'Operador de Empilhadeira') {
                    // Para operadores de empilhadeira, verificar se tem atividade específica ou apenas KPIs
                    let nomeAtividade;
                    if (!dados.nome_atividade || dados.nome_atividade.trim() === '') {
                        // Lançamento apenas de KPIs
                        nomeAtividade = 'KPIs Atingidos';
                    }
                    else {
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
                        atividade: nomeAtividade
                    });
                    acc[nomeAtividade].dias = new Set([...acc[nomeAtividade].valores.map((_, i) => i)]).size;
                    historicoCompleto.push({
                        data: dataFormatada,
                        valor: item.remuneracao_total,
                        atividade: nomeAtividade
                    });
                }
                else if (userFunction === 'Ajudante de Armazém') {
                    // Para múltiplas atividades
                    if (dados.multiple_activities && Array.isArray(dados.multiple_activities)) {
                        dados.multiple_activities.forEach((activity) => {
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
                                atividade: subAtividade
                            });
                            acc[subAtividade].dias = acc[subAtividade].valores.length;
                            historicoCompleto.push({
                                data: dataFormatada,
                                valor: valorProporcional,
                                atividade: subAtividade
                            });
                        });
                    }
                    else {
                        // Atividade única - verificar se tem nome ou é apenas KPIs
                        let nomeAtividade;
                        if (!dados.nome_atividade || dados.nome_atividade.trim() === '') {
                            // Lançamento apenas de KPIs
                            nomeAtividade = 'KPIs Atingidos';
                        }
                        else {
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
                            atividade: nomeAtividade
                        });
                        acc[nomeAtividade].dias = acc[nomeAtividade].valores.length;
                        historicoCompleto.push({
                            data: dataFormatada,
                            valor: item.remuneracao_total,
                            atividade: nomeAtividade
                        });
                    }
                }
                return acc;
            }, {});
            const atividades = Object.values(atividadesPorTipo).map((ativ) => ({
                ...ativ,
                mediaDia: ativ.totalGanho / ativ.dias,
                performance: getPerformanceLevel(ativ.totalGanho / ativ.dias),
                cor: getActivityColor(ativ.nome)
            }));
            // Encontrar melhor dia
            const melhorDia = dadosUsuario.reduce((melhor, atual) => {
                return atual.remuneracao_total > (melhor?.remuneracao_total || 0) ? atual : melhor;
            }, null);
            setDashboardData({
                ganhoTotal,
                mediaDiaria,
                metaMensal: getMetaByFunction(userFunction),
                percentualMeta: (ganhoTotal / getMetaByFunction(userFunction)) * 100,
                atividades,
                melhorDia: melhorDia ? {
                    data: new Date(melhorDia.data_lancamento).toLocaleDateString('pt-BR'),
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
        }
        catch (error) {
            console.error('Erro ao carregar dashboard:', error);
            setDashboardData(generateEmptyData());
        }
        finally {
            setLoading(false);
        }
    };
    const getMetaByFunction = (funcao) => {
        switch (funcao) {
            case 'Operador de Empilhadeira': return 300;
            case 'Ajudante de Armazém': return 300;
            default: return 300;
        }
    };
    const generateEmptyData = () => ({
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
    const generateDailyChart = (dados) => {
        const diasDoMes = new Date(mesAtual.getFullYear(), mesAtual.getMonth() + 1, 0).getDate();
        const ganhosPorDia = Array.from({ length: diasDoMes }, (_, i) => ({ dia: i + 1, valor: 0 }));
        dados.forEach(item => {
            const dia = new Date(item.data_lancamento).getDate();
            ganhosPorDia[dia - 1].valor += item.remuneracao_total;
        });
        return ganhosPorDia;
    };
    const getActivityIcon = (nome) => {
        if (nome === 'KPIs Atingidos')
            return '📊';
        if (nome.includes('Repack'))
            return '📦';
        if (nome.includes('Amarração'))
            return '🔗';
        if (nome.includes('Devolução'))
            return '↩️';
        if (nome.includes('Refugo'))
            return '🗑️';
        if (nome.includes('Retorno'))
            return '🔄';
        if (nome.includes('Retrabalho'))
            return '🔧';
        if (nome.includes('Blocagem'))
            return '🚧';
        if (nome.includes('Empilhadeira'))
            return '🏗️';
        return '⚡';
    };
    const getActivityColor = (nome) => {
        if (nome === 'KPIs Atingidos')
            return '#6366F1';
        if (nome.includes('Repack'))
            return '#10B981';
        if (nome.includes('Amarração'))
            return '#3B82F6';
        if (nome.includes('Devolução'))
            return '#F59E0B';
        if (nome.includes('Refugo'))
            return '#EF4444';
        if (nome.includes('Retorno'))
            return '#8B5CF6';
        if (nome.includes('Retrabalho'))
            return '#F97316';
        if (nome.includes('Blocagem'))
            return '#6B7280';
        return '#8B5CF6';
    };
    const getPerformanceLevel = (mediaDia) => {
        if (mediaDia >= 55)
            return 'excelente';
        if (mediaDia >= 40)
            return 'bom';
        return 'regular';
    };
    const getPerformanceColor = (performance) => {
        switch (performance) {
            case 'excelente': return 'text-green-600 bg-green-100';
            case 'bom': return 'text-yellow-600 bg-yellow-100';
            case 'regular': return 'text-orange-600 bg-orange-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };
    const getPerformanceEmoji = (performance) => {
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
        if (!dashboardData)
            return;
        const dados = `Relatório de Performance - ${mesAtual.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}\n\n` +
            `Colaborador: ${user?.nome}\n` +
            `Função: ${userFunction}\n` +
            `CPF: ${user?.cpf}\n\n` +
            `Ganho Total: R$ ${dashboardData.ganhoTotal.toFixed(2)}\n` +
            `Média Diária: R$ ${dashboardData.mediaDiaria.toFixed(2)}\n` +
            `Meta Mensal: ${dashboardData.percentualMeta.toFixed(1)}% atingido\n\n` +
            `Atividades Realizadas:\n` +
            dashboardData.atividades.map(ativ => `${ativ.nome}: R$ ${ativ.totalGanho.toFixed(2)} (${ativ.dias} dias) - ${ativ.performance}`).join('\n');
        const blob = new Blob([dados], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `relatorio_${user?.nome.replace(/\s/g, '_')}_${mesAtual.getMonth() + 1}_${mesAtual.getFullYear()}.txt`;
        a.click();
        window.URL.revokeObjectURL(url);
    };
    if (loading) {
        return (<AuthGuard_1.default>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando seus dados de performance...</p>
          </div>
        </div>
      </AuthGuard_1.default>);
    }
    return (<AuthGuard_1.default>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        {/* Header */}
        <header className="border-b bg-white/70 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                  <lucide_react_1.Trophy className="h-5 w-5 text-white"/>
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
                <react_router_1.Link to="/">
                  <Button_1.Button variant="outline" size="sm">
                    <lucide_react_1.Calendar className="h-4 w-4 mr-2"/>
                    Calculadora
                  </Button_1.Button>
                </react_router_1.Link>
                <UserMenu_1.default />
              </div>
            </div>
          </div>
        </header>

        {/* Navigation Controls */}
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <Button_1.Button variant="outline" onClick={mesAnterior}>
                <lucide_react_1.ArrowLeft className="h-4 w-4 mr-2"/>
                Mês Anterior
              </Button_1.Button>
              <div className="text-lg font-semibold">
                {mesAtual.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
              </div>
              <Button_1.Button variant="outline" onClick={proximoMes}>
                Próximo Mês
                <lucide_react_1.ArrowRight className="h-4 w-4 ml-2"/>
              </Button_1.Button>
            </div>
            
            <Button_1.Button variant="outline" size="sm" onClick={exportarRelatorio}>
              <lucide_react_1.Download className="h-4 w-4 mr-2"/>
              Exportar Relatório
            </Button_1.Button>
          </div>
        </div>

        {/* Main Content */}
        <main className="container mx-auto px-4 pb-8">
          <div className="max-w-7xl mx-auto space-y-8">
            {!dashboardData || dashboardData.ganhoTotal === 0 ? (<Card_1.Card>
                <Card_1.CardContent className="p-8 text-center">
                  <lucide_react_1.Activity className="h-12 w-12 text-gray-400 mx-auto mb-4"/>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Nenhum dado encontrado
                  </h3>
                  <p className="text-gray-600">
                    Você ainda não possui lançamentos aprovados para este período.
                  </p>
                  <react_router_1.Link to="/">
                    <Button_1.Button className="mt-4">
                      <lucide_react_1.Calendar className="h-4 w-4 mr-2"/>
                      Fazer um Lançamento
                    </Button_1.Button>
                  </react_router_1.Link>
                </Card_1.CardContent>
              </Card_1.Card>) : (<>
                {/* Seção 1: Resumo Financeiro */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card_1.Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                    <Card_1.CardContent className="p-6">
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
                        <lucide_react_1.DollarSign className="h-12 w-12 text-green-600"/>
                      </div>
                    </Card_1.CardContent>
                  </Card_1.Card>

                  <Card_1.Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                    <Card_1.CardContent className="p-6">
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
                        <lucide_react_1.TrendingUp className="h-12 w-12 text-blue-600"/>
                      </div>
                    </Card_1.CardContent>
                  </Card_1.Card>

                  <Card_1.Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
                    <Card_1.CardContent className="p-6">
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
                        <lucide_react_1.Target className="h-12 w-12 text-purple-600"/>
                      </div>
                    </Card_1.CardContent>
                  </Card_1.Card>
                </div>

                {/* Seção 2: Atividades por Função */}
                <Card_1.Card>
                  <Card_1.CardHeader>
                    <Card_1.CardTitle className="flex items-center space-x-2">
                      <lucide_react_1.Activity className="h-6 w-6"/>
                      <span>🏃‍♂️ MINHAS ATIVIDADES - {userFunction}</span>
                    </Card_1.CardTitle>
                    <Card_1.CardDescription>
                      📋 Detalhamento das suas atividades específicas no período
                    </Card_1.CardDescription>
                  </Card_1.CardHeader>
                  <Card_1.CardContent>
                    <div className="space-y-4">
                      {dashboardData.atividades.map((atividade, index) => (<div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
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
                        </div>))}
                    </div>
                  </Card_1.CardContent>
                </Card_1.Card>

                {/* Seção 2.1: Histórico Detalhado de Atividades */}
                <Card_1.Card>
                  <Card_1.CardHeader>
                    <Card_1.CardTitle className="flex items-center space-x-2">
                      <lucide_react_1.Calendar className="h-6 w-6"/>
                      <span>📅 HISTÓRICO DE ATIVIDADES</span>
                    </Card_1.CardTitle>
                    <Card_1.CardDescription>
                      📊 Registro detalhado com datas dos seus lançamentos no mês
                    </Card_1.CardDescription>
                  </Card_1.CardHeader>
                  <Card_1.CardContent>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {dashboardData.historicoCompleto.length > 0 ? (dashboardData.historicoCompleto.map((item, index) => (<div key={index} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                            <div className="flex items-center space-x-3">
                              <div className="text-lg">
                                {dashboardData.atividades.find(a => a.nome === item.atividade)?.icon || '⚡'}
                              </div>
                              <div>
                                <h4 className="font-medium text-gray-900">{item.atividade}</h4>
                                <p className="text-sm text-gray-500">📅 {item.data}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-green-600">+ R$ {item.valor.toFixed(2)}</p>
                              <p className="text-xs text-gray-400">Lançamento</p>
                            </div>
                          </div>))) : (<div className="text-center py-8 text-gray-500">
                          <lucide_react_1.Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300"/>
                          <p>Nenhum lançamento encontrado para este mês</p>
                        </div>)}
                    </div>
                  </Card_1.CardContent>
                </Card_1.Card>

                {/* Seção 3: Insights e KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card_1.Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
                    <Card_1.CardHeader>
                      <Card_1.CardTitle className="text-lg text-yellow-800">🥇 MELHOR DIA</Card_1.CardTitle>
                    </Card_1.CardHeader>
                    <Card_1.CardContent>
                      {dashboardData.melhorDia.data ? (<div className="space-y-2">
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
                        </div>) : (<p className="text-yellow-700">Sem dados disponíveis</p>)}
                    </Card_1.CardContent>
                  </Card_1.Card>

                  <Card_1.Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
                    <Card_1.CardHeader>
                      <Card_1.CardTitle className="text-lg text-indigo-800">⭐ PROGRESSO DA META</Card_1.CardTitle>
                    </Card_1.CardHeader>
                    <Card_1.CardContent>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-indigo-700">Meta {userFunction}</span>
                            <span className="text-sm font-bold text-indigo-900">{dashboardData.percentualMeta.toFixed(0)}%</span>
                          </div>
                          <div className="w-full bg-indigo-200 rounded-full h-3">
                            <div className="bg-gradient-to-r from-indigo-400 to-purple-600 h-3 rounded-full transition-all duration-300" style={{ width: `${Math.min(dashboardData.percentualMeta, 100)}%` }}></div>
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
                    </Card_1.CardContent>
                  </Card_1.Card>
                </div>
              </>)}
          </div>
        </main>
      </div>
    </AuthGuard_1.default>);
}
