import { useState, useEffect } from 'react';
import { TrendingUp, Target, DollarSign, Activity, Trophy, ArrowLeft, ArrowRight, Download, Calendar } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
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
  valorBrutoAtividades?: number;
  quantidadeTotalProduzida?: number;
  tempoTotalHoras?: number;
  producaoHora?: number;
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
  valor_bruto_atividades?: number;
}

export default function DashboardCollaborator() {
  const { user, userFunction } = useAuth();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [mesAtual, setMesAtual] = useState(new Date());
  const [lancamentosPendentesReprovados, setLancamentosPendentesReprovados] = useState<any[]>([]);
  const [mesInicializado, setMesInicializado] = useState(false);

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
      const response = await fetch(`/api/lancamentos?user_id=${user?.id}&status=aprovado`);
      
      if (!response.ok) {
        throw new Error(`Falha ao carregar dados: ${response.status} ${response.statusText}`);
      }
      
      const historico = await response.json();
      
      // Se é a primeira vez carregando e há dados, inicializar com o mês mais recente que tem dados
      if (!mesInicializado && historico.length > 0) {
        const datasLancamentos = historico.map((item: any) => {
          const dateOnly = item.data_lancamento.split('T')[0];
          const [year, month, day] = dateOnly.split('-');
          return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        });
        
        // Encontrar a data mais recente
        const dataMaisRecente = new Date(Math.max(...datasLancamentos.map((d: Date) => d.getTime())));
        setMesAtual(dataMaisRecente);
        setMesInicializado(true);
        return; // Retornar para que o useEffect seja chamado novamente com o novo mês
      }
      
      // Buscar lançamentos pendentes e reprovados
      const responsePendentesReprovados = await fetch(`/api/lancamentos/todos?user_id=${user?.id}`);
      if (responsePendentesReprovados.ok) {
        const todoLancamentos = await responsePendentesReprovados.json();
        const pendentesReprovados = todoLancamentos.filter((item: any) => 
          item.status === 'pendente' || item.status === 'reprovado'
        );
        setLancamentosPendentesReprovados(pendentesReprovados);
      }
      
      // Filtrar por mês atual (já filtrado por usuário na API)
      const dadosUsuario = historico.filter((item: any) => {
        // Usar a mesma lógica da formatDateSafe para evitar problemas de timezone
        const dateOnly = item.data_lancamento.split('T')[0];
        const [year, month, day] = dateOnly.split('-');
        const dataLancamento = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        
        const mesLancamento = dataLancamento.getMonth();
        const anoLancamento = dataLancamento.getFullYear();
        

        
        return mesLancamento === mesAtual.getMonth() && anoLancamento === mesAtual.getFullYear();
      });

      if (dadosUsuario.length === 0) {
        setDashboardData(generateEmptyData());
        return;
      }

      // Processar dados reais
      let ganhoTotal = 0;
      
      console.log('Dados do usuário filtrados:', dadosUsuario);
      console.log('Função do usuário:', userFunction);
      
      if (userFunction === 'Operador de Empilhadeira') {
        // Para operador de empilhadeira: subtotal_atividades (já dividido por 2) + valor KPIs atingidos
        // Garantir que não há duplicação de dados - usar apenas lançamentos aprovados únicos
        const lancamentosUnicos = dadosUsuario.filter((item: any, index: number, arr: any[]) => {
          return arr.findIndex(t => t.id === item.id) === index && item.status === 'aprovado';
        });
        
        console.log('Lançamentos únicos (Operador):', lancamentosUnicos);
        
        // Usar remuneracao_total diretamente (já inclui subtotal_atividades + bonus_kpis + input_adicional)
        ganhoTotal = lancamentosUnicos.reduce((sum: number, item: any) => {
          console.log('Item remuneração total:', item.remuneracao_total, 'Tipo:', typeof item.remuneracao_total);
          return sum + (item.remuneracao_total || 0);
        }, 0);
      } else {
        // Para outras funções: soma da remuneração total - garantir lançamentos únicos
        const lancamentosUnicos = dadosUsuario.filter((item: any, index: number, arr: any[]) => {
          return arr.findIndex(t => t.id === item.id) === index && item.status === 'aprovado';
        });
        
        console.log('Lançamentos únicos (Outras funções):', lancamentosUnicos);
        
        ganhoTotal = lancamentosUnicos.reduce((sum: number, item: any) => {
          console.log('Item remuneração total:', item.remuneracao_total, 'Tipo:', typeof item.remuneracao_total);
          return sum + (item.remuneracao_total || 0);
        }, 0);
      }
      
      console.log('Ganho total calculado:', ganhoTotal);
      
      const diasTrabalhados = new Set(dadosUsuario.map((item: any) => item.data_lancamento)).size;
      const mediaDiaria = diasTrabalhados > 0 ? ganhoTotal / diasTrabalhados : 0;

      // Criar histórico completo com datas
      const historicoCompleto: HistoricoAtividade[] = [];
      
      // Agrupar por atividades baseado na função do usuário
      const atividadesPorTipo = dadosUsuario.reduce((acc: any, item: any) => {
        // VERIFICAÇÃO CRÍTICA: Apenas processar lançamentos aprovados
        if (item.status !== 'aprovado') {
          return acc;
        }
        
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
          // Para operadores de empilhadeira, criar atividade específica para tarefas válidas
          if (dados.tarefas_validas && dados.tarefas_validas > 0) {
            const nomeAtividade = 'Tarefas Válidas';
            
            if (!acc[nomeAtividade]) {
              acc[nomeAtividade] = {
                nome: nomeAtividade,
                icon: '📋',
                dias: 0,
                totalGanho: 0,
                valores: [],
                historico: [],
                tarefasValidas: 0,
                valorTarefas: 0,
                valorBrutoAtividades: 0
              };
            }
            
            // Usar o valor das tarefas (subtotal_atividades) em vez da remuneração total
            const valorTarefas = dados.subtotal_atividades || dados.valor_tarefas || 0;
            const valorBrutoAtividade = item.valor_bruto_atividades || 0;
            acc[nomeAtividade].totalGanho += valorTarefas;
            acc[nomeAtividade].valores.push(valorTarefas);
            acc[nomeAtividade].tarefasValidas = (acc[nomeAtividade].tarefasValidas || 0) + dados.tarefas_validas;
            acc[nomeAtividade].valorTarefas = (acc[nomeAtividade].valorTarefas || 0) + valorTarefas;
            acc[nomeAtividade].valorBrutoAtividades = (acc[nomeAtividade].valorBrutoAtividades || 0) + valorBrutoAtividade;
            acc[nomeAtividade].historico.push({
              data: dataFormatada,
              valor: valorTarefas,
              atividade: nomeAtividade,
              turno: item.turno,
              aprovadoPor: item.aprovado_por_nome || item.aprovado_por || 'Sistema'
            });
            acc[nomeAtividade].dias = new Set(acc[nomeAtividade].historico.map((h: any) => h.data)).size;
          }
          
          // KPIs são incluídos no valor total das tarefas válidas, não precisam de seção separada
          
          // Adicionar ao histórico completo - UMA ÚNICA ENTRADA POR LANÇAMENTO APROVADO
          if (item.status === 'aprovado') {
            // Determinar o nome da atividade principal
            let nomeAtividadePrincipal = 'Lançamento RV';
            if (dados.tarefas_validas && dados.tarefas_validas > 0) {
              nomeAtividadePrincipal = 'Operador de Empilhadeira';
            }
            
            // Usar a remuneração total do lançamento (que já inclui tarefas + KPIs)
            historicoCompleto.push({
              data: dataFormatada,
              valor: item.remuneracao_total || 0, // Valor total do lançamento
              atividade: nomeAtividadePrincipal,
              turno: item.turno,
              aprovadoPor: item.aprovado_por_nome || item.aprovado_por || 'Sistema',
              kpis_atingidos: item.kpis_atingidos,
              tarefas_validas: item.tarefas_validas,
              valor_tarefas: item.valor_tarefas,
              bonus_kpis: item.bonus_kpis,
              subtotal_atividades: item.subtotal_atividades
            });
          }
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
                  historico: [],
                  valorBrutoAtividades: 0,
                  quantidadeTotalProduzida: 0,
                  tempoTotalHoras: 0
                };
              }
              // Usar subtotal_atividades ao invés de remuneracao_total para mostrar apenas o valor das atividades
              const valorAtividade = (item.subtotal_atividades || 0) / dados.multiple_activities.length;
              const valorBrutoAtividade = (item.valor_bruto_atividades || 0) / dados.multiple_activities.length;
              const quantidade = parseFloat(activity.quantidade_produzida || '0');
              const tempo = parseFloat(activity.tempo_horas || '0');
              
              acc[subAtividade].totalGanho += valorAtividade;
              acc[subAtividade].valorBrutoAtividades += valorBrutoAtividade;
              acc[subAtividade].quantidadeTotalProduzida += quantidade;
              acc[subAtividade].tempoTotalHoras += tempo;
              acc[subAtividade].valores.push(valorAtividade);
              acc[subAtividade].historico.push({
                data: dataFormatada,
                valor: valorAtividade,
                atividade: subAtividade,
                turno: item.turno,
                aprovadoPor: item.aprovado_por_nome || item.aprovado_por || 'Sistema'
              });
              acc[subAtividade].dias = acc[subAtividade].valores.length;
              
              // Apenas adicionar ao histórico se aprovado
              if (item.status === 'aprovado') {
                historicoCompleto.push({
                  data: dataFormatada,
                  valor: valorAtividade,
                  atividade: subAtividade,
                  turno: item.turno,
                  aprovadoPor: item.aprovado_por_nome || item.aprovado_por || 'Sistema',
                  kpis_atingidos: item.kpis_atingidos,
                  tarefas_validas: item.tarefas_validas,
                  valor_tarefas: item.valor_tarefas,
                  bonus_kpis: item.bonus_kpis,
                  subtotal_atividades: item.subtotal_atividades
                });
              }
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
                historico: [],
                valorBrutoAtividades: 0,
                quantidadeTotalProduzida: 0,
                tempoTotalHoras: 0
              };
            }
            // Para atividades, usar subtotal_atividades; para KPIs, usar bonus_kpis
            const valorAtividade = nomeAtividade === 'KPIs Atingidos' ? (item.bonus_kpis || 0) : (item.subtotal_atividades || 0);
            const valorBrutoAtividade = nomeAtividade === 'KPIs Atingidos' ? 0 : (item.valor_bruto_atividades || 0);
            const quantidade = parseFloat(item.quantidade_produzida || '0');
            const tempo = parseFloat(item.tempo_horas || '0');
            
            acc[nomeAtividade].totalGanho += valorAtividade;
            acc[nomeAtividade].valorBrutoAtividades += valorBrutoAtividade;
            acc[nomeAtividade].quantidadeTotalProduzida += quantidade;
            acc[nomeAtividade].tempoTotalHoras += tempo;
            acc[nomeAtividade].valores.push(valorAtividade);
            acc[nomeAtividade].historico.push({
              data: dataFormatada,
              valor: valorAtividade,
              atividade: nomeAtividade,
              turno: item.turno,
              aprovadoPor: item.aprovado_por_nome || item.aprovado_por || 'Sistema'
            });
            acc[nomeAtividade].dias = acc[nomeAtividade].valores.length;
            
            // Apenas adicionar ao histórico se aprovado
            if (item.status === 'aprovado') {
              historicoCompleto.push({
                data: dataFormatada,
                valor: valorAtividade,
                atividade: nomeAtividade,
                turno: item.turno,
                aprovadoPor: item.aprovado_por_nome || item.aprovado_por || 'Sistema',
                kpis_atingidos: item.kpis_atingidos,
                tarefas_validas: item.tarefas_validas,
                valor_tarefas: item.valor_tarefas,
                bonus_kpis: item.bonus_kpis,
                subtotal_atividades: item.subtotal_atividades,
                valor_bruto_atividades: item.valor_bruto_atividades
              });
            }
          }
        }
        
        return acc;
      }, {});

      const atividades: ActivityPerformance[] = Object.values(atividadesPorTipo).map((ativ: any) => ({
        ...ativ,
        mediaDia: ativ.totalGanho / ativ.dias,
        performance: getPerformanceLevel(ativ.totalGanho / ativ.dias),
        cor: getActivityColor(ativ.nome),
        producaoHora: ativ.tempoTotalHoras && ativ.tempoTotalHoras > 0 ? ativ.quantidadeTotalProduzida / ativ.tempoTotalHoras : 0
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

  const navegarParaCalculadora = (dia: number) => {
    // Criar a data completa
    const dataCompleta = new Date(mesAtual.getFullYear(), mesAtual.getMonth(), dia);
    // Formatar a data no formato ISO (YYYY-MM-DD) para compatibilidade com input type="date"
    const dataFormatada = dataCompleta.toISOString().split('T')[0];
    
    // Navegar para a calculadora (página Home) com a data preenchida
    navigate(`/?data=${dataFormatada}`);
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
          <div className="container mx-auto px-2 sm:px-4 py-3 sm:py-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
              <div className="flex items-center space-x-2">
                <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                  <Trophy className="h-3 w-3 sm:h-5 sm:w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    🏆 MEU DESEMPENHO
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-600 break-words">
                    <span className="block sm:inline">👤 {user?.nome}</span>
                    <span className="hidden sm:inline"> | </span>
                    <span className="block sm:inline">💼 {userFunction}</span>
                    <span className="hidden sm:inline"> | </span>
                    <span className="block sm:inline">📅 {mesAtual.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2 sm:space-x-4 w-full sm:w-auto">
                <Link to="/" className="flex-1 sm:flex-none">
                  <Button variant="outline" size="sm" className="w-full sm:w-auto text-xs sm:text-sm">
                    <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Calculadora</span>
                    <span className="sm:hidden">Calc</span>
                  </Button>
                </Link>
                <UserMenu />
              </div>
            </div>
          </div>
        </header>

        {/* Navigation Controls */}
        <div className="container mx-auto px-2 sm:px-4 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-0 mb-4 sm:mb-6">
            <div className="flex items-center space-x-2 sm:space-x-4 w-full sm:w-auto">
              <Button variant="outline" onClick={mesAnterior} size="sm" className="flex-1 sm:flex-none text-xs sm:text-sm">
                <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Mês Anterior</span>
                <span className="sm:hidden">Anterior</span>
              </Button>
              <div className="text-sm sm:text-lg font-semibold text-center px-2">
                {mesAtual.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}
              </div>
              <Button variant="outline" onClick={proximoMes} size="sm" className="flex-1 sm:flex-none text-xs sm:text-sm">
                <span className="hidden sm:inline">Próximo Mês</span>
                <span className="sm:hidden">Próximo</span>
                <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1 sm:ml-2" />
              </Button>
            </div>
            
            <Button variant="outline" size="sm" onClick={exportarRelatorio} className="w-full sm:w-auto text-xs sm:text-sm">
              <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Exportar Relatório</span>
              <span className="sm:hidden">Exportar</span>
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <main className="container mx-auto px-2 sm:px-4 pb-6 sm:pb-8">
          <div className="max-w-7xl mx-auto space-y-4 sm:space-y-8">
            {!dashboardData || dashboardData.ganhoTotal === 0 ? (
              // Verificar se há lançamentos pendentes para exibir no mês atual
              lancamentosPendentesReprovados.filter((item: any) => {
                // Usar a mesma lógica da formatDateSafe para evitar problemas de timezone
                const dateOnly = item.data_lancamento.split('T')[0];
                const [year, month, day] = dateOnly.split('-');
                const dataLancamento = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                const mesLancamento = dataLancamento.getMonth();
                const anoLancamento = dataLancamento.getFullYear();
                return mesLancamento === mesAtual.getMonth() && anoLancamento === mesAtual.getFullYear();
              }).length > 0 ? (
                <div className="space-y-4 sm:space-y-6">
                  {/* Aviso sobre lançamentos aprovados */}
                  <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                    <CardContent className="p-6 text-center">
                      <Activity className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-blue-900 mb-2">
                        📊 Nenhum lançamento aprovado ainda
                      </h3>
                      <p className="text-blue-700 mb-4">
                        Você não possui lançamentos aprovados para este período, mas há lançamentos pendentes de análise.
                      </p>
                      <Link to="/">
                        <Button className="bg-blue-600 hover:bg-blue-700">
                          <Calendar className="h-4 w-4 mr-2" />
                          Fazer um Novo Lançamento
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>

                  {/* Seção de Lançamentos Pendentes */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2 text-sm sm:text-base">
                        <Activity className="h-4 w-4 sm:h-6 sm:w-6" />
                        <span className="text-sm sm:text-base">⏳ LANÇAMENTOS PENDENTES DE APROVAÇÃO</span>
                      </CardTitle>
                      <CardDescription className="text-xs sm:text-sm">
                        📋 Seus lançamentos que estão aguardando análise da supervisão
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 sm:space-y-3 max-h-80 sm:max-h-96 overflow-y-auto">
                        {lancamentosPendentesReprovados
                          .filter((item: any) => {
                            // Usar a mesma lógica da formatDateSafe para evitar problemas de timezone
                            const dateOnly = item.data_lancamento.split('T')[0];
                            const [year, month, day] = dateOnly.split('-');
                            const dataLancamento = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                            const mesLancamento = dataLancamento.getMonth();
                            const anoLancamento = dataLancamento.getFullYear();
                            return mesLancamento === mesAtual.getMonth() && anoLancamento === mesAtual.getFullYear() && item.status === 'pendente';
                          })
                          .map((item, index) => {
                            // Parse dos dados do lançamento para exibir detalhes
                            let kpisAtingidos = [];
                            let tarefasValidas = null;
                            
                            try {
                              if (item.kpis_atingidos && typeof item.kpis_atingidos === 'string') {
                                kpisAtingidos = JSON.parse(item.kpis_atingidos);
                              } else if (Array.isArray(item.kpis_atingidos)) {
                                kpisAtingidos = item.kpis_atingidos;
                              }
                              
                              if (item.tarefas_validas) {
                                tarefasValidas = item.tarefas_validas;
                              }
                            } catch (e) {
                              console.log('Erro ao parsear dados do lançamento:', e);
                            }
                            
                            return (
                              <div key={index} className="p-3 sm:p-4 border rounded-lg hover:shadow-md transition-all duration-200 bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                                  <div className="flex items-center space-x-3 sm:space-x-4">
                                    <div className="text-xl sm:text-2xl">
                                      {getActivityIcon(item.nome_atividade || 'KPIs Atingidos')}
                                    </div>
                                    <div className="flex-1">
                                      <h4 className="font-semibold text-gray-900 text-base sm:text-lg">Lançamento RV</h4>
                                      <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 mt-1 space-y-1 sm:space-y-0">
                                        <p className="text-xs sm:text-sm text-gray-600 flex items-center">
                                          <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                          📅 {formatDateSafe(item.data_lancamento)}
                                        </p>
                                        <p className="text-xs sm:text-sm text-gray-600">
                                          🏢 {item.turno || 'N/A'}
                                        </p>
                                      </div>
                                      
                                      {/* Resumo detalhado */}
                                      <div className="mt-2 sm:mt-3 space-y-1 sm:space-y-2 bg-white p-2 sm:p-3 rounded border">
                                        <h5 className="font-medium text-gray-800 text-xs sm:text-sm">📊 Resumo do Lançamento:</h5>
                                        
                                        {/* KPIs Atingidos */}
                                        {kpisAtingidos.length > 0 && (
                                          <div className="text-xs sm:text-sm">
                                            <span className="font-medium text-blue-600">🎯 KPIs Atingidos ({kpisAtingidos.length}):</span>
                                            <span className="text-gray-700 ml-1 sm:ml-2">{kpisAtingidos.join(', ')}</span>
                                            <span className="text-green-600 ml-1 sm:ml-2 font-medium">R$ {(item.bonus_kpis || 0).toFixed(2)}</span>
                                          </div>
                                        )}
                                        
                                        {/* Tarefas Válidas */}
                                        {tarefasValidas && (
                                          <div className="text-xs sm:text-sm">
                                            <span className="font-medium text-purple-600">📋 Tarefas Válidas:</span>
                                            <span className="text-gray-700 ml-1 sm:ml-2">{tarefasValidas} tarefas</span>
                                            <span className="text-green-600 ml-1 sm:ml-2 font-medium">R$ {(item.valor_tarefas || 0).toFixed(2)}</span>
                                          </div>
                                        )}
                                        
                                        {/* Subtotal Atividades */}
                                        {item.subtotal_atividades && (
                                          <div className="text-xs sm:text-sm">
                                            <span className="font-medium text-orange-600">💼 Subtotal Atividades:</span>
                                            <span className="text-green-600 ml-1 sm:ml-2 font-medium">R$ {(item.subtotal_atividades || 0).toFixed(2)}</span>
                                          </div>
                                        )}
                                      </div>
                                      
                                      <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 mt-2 space-y-1 sm:space-y-0">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                          ⏳ Aguardando Aprovação
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="text-center sm:text-right">
                                    <p className="text-lg sm:text-2xl font-bold text-yellow-600">
                                      ⏳ R$ {(item.remuneracao_total || 0).toFixed(2)}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">💰 Valor Pendente</p>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        }
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                // Caso não tenha nem aprovados nem pendentes
                <Card>
                  <CardContent className="p-8 text-center">
                    <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Nenhum dado encontrado
                    </h3>
                    <p className="text-gray-600">
                      Você ainda não possui lançamentos para este período.
                    </p>
                    <Link to="/">
                      <Button className="mt-4">
                        <Calendar className="h-4 w-4 mr-2" />
                        Fazer um Lançamento
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )
            ) : (
              <>
                {/* Seção 1: Resumo Financeiro */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                  <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                    <CardContent className="p-3 sm:p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-xs sm:text-sm font-medium text-green-600">💵 GANHO TOTAL</p>
                          <p className="text-xl sm:text-3xl font-bold text-green-900">
                            R$ {dashboardData.ganhoTotal.toFixed(2)}
                          </p>
                          <p className="text-xs sm:text-sm text-green-600 flex items-center mt-1">
                            {dashboardData.comparativoMesAnterior >= 0 ? '↗️' : '↘️'} 
                            {Math.abs(dashboardData.comparativoMesAnterior).toFixed(1)}% vs mês anterior
                          </p>
                        </div>
                        <DollarSign className="h-8 w-8 sm:h-12 sm:w-12 text-green-600 flex-shrink-0" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                    <CardContent className="p-3 sm:p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-xs sm:text-sm font-medium text-blue-600">📈 MÉDIA DIÁRIA</p>
                          <p className="text-xl sm:text-3xl font-bold text-blue-900">
                            R$ {dashboardData.mediaDiaria.toFixed(2)}
                          </p>
                          <p className="text-xs sm:text-sm text-blue-600 flex items-center mt-1">
                            {dashboardData.comparativoMesAnterior >= 0 ? '↗️' : '↘️'} 
                            {Math.abs(dashboardData.comparativoMesAnterior).toFixed(1)}% vs mês anterior
                          </p>
                          <p className="text-xs text-blue-500 mt-1">
                            🎯 Meta diária: R$ {(dashboardData.metaMensal / 22).toFixed(2)}
                          </p>
                        </div>
                        <TrendingUp className="h-8 w-8 sm:h-12 sm:w-12 text-blue-600 flex-shrink-0" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200 sm:col-span-2 lg:col-span-1">
                    <CardContent className="p-3 sm:p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-xs sm:text-sm font-medium text-purple-600">🎯 META MENSAL</p>
                          <p className="text-xl sm:text-3xl font-bold text-purple-900">
                            {dashboardData.percentualMeta.toFixed(1)}%
                          </p>
                          <p className="text-xs sm:text-sm text-purple-600">
                            {dashboardData.percentualMeta >= 85 ? '🟢 Excelente' : 
                             dashboardData.percentualMeta >= 70 ? '🟡 Bom' : '🟠 Em progresso'}
                          </p>
                        </div>
                        <Target className="h-8 w-8 sm:h-12 sm:w-12 text-purple-600 flex-shrink-0" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Seção 2: Atividades por Função */}
                <Card>
                  <CardHeader className="p-3 sm:p-6">
                    <CardTitle className="flex items-center space-x-2 text-sm sm:text-base">
                      <Activity className="h-4 w-4 sm:h-6 sm:w-6" />
                      <span className="truncate">🏃‍♂️ MINHAS ATIVIDADES - {userFunction}</span>
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      📋 Detalhamento das suas atividades específicas no período
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-6">
                    <div className="space-y-3 sm:space-y-4">
                      {dashboardData.atividades.map((atividade, index) => (
                        <div key={index} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-gray-50 rounded-lg space-y-3 sm:space-y-0">
                          <div className="flex items-start sm:items-center space-x-3 sm:space-x-4 flex-1">
                            <div className="text-xl sm:text-2xl flex-shrink-0">{atividade.icon}</div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{atividade.nome}</h3>
                              <p className="text-xs sm:text-sm text-gray-600">{atividade.dias} dias trabalhados</p>
                              {/* Exibir detalhes específicos para Tarefas Válidas de Operador de Empilhadeira */}
                              {userFunction === 'Operador de Empilhadeira' && atividade.nome === 'Tarefas Válidas' && atividade.tarefasValidas && (
                                <div className="mt-2 space-y-1">
                                  <p className="text-xs sm:text-sm text-blue-600 font-medium">
                                    📋 Total de Tarefas: {atividade.tarefasValidas} tarefas
                                  </p>
                                  <p className="text-xs sm:text-sm text-red-600">
                                    💰 Valor Bruto: R$ {(atividade.valorTarefas || 0).toFixed(2)}
                                  </p>
                                  <p className="text-xs sm:text-sm text-green-600">
                                    💰 Valor Líquido (÷2): R$ {(atividade.totalGanho || 0).toFixed(2)}
                                  </p>
                                  <p className="text-xs sm:text-sm text-purple-600">
                                    📊 Média Diária: {(atividade.tarefasValidas / atividade.dias).toFixed(1)} tarefas/dia
                                  </p>
                                  <p className="text-xs sm:text-sm text-orange-600">
                                    💵 Valor por Tarefa: R$ 0,093
                                  </p>
                                </div>
                              )}
                              {/* Exibir valor bruto para outras atividades de Ajudante de Armazém */}
                              {userFunction === 'Ajudante de Armazém' && atividade.nome !== 'KPIs Atingidos' && (
                                <div className="mt-2 space-y-1">
                                  <p className="text-xs sm:text-sm text-red-600">
                                    💰 Valor Bruto: R$ {(atividade.totalGanho * 2).toFixed(2)}
                                  </p>
                                  <p className="text-xs sm:text-sm text-green-600">
                                    💰 Valor Líquido (÷2): R$ {atividade.totalGanho.toFixed(2)}
                                  </p>
                                  {atividade.quantidadeTotalProduzida !== undefined && atividade.quantidadeTotalProduzida > 0 && (
                                    <p className="text-xs sm:text-sm text-blue-600 font-medium">
                                      📦 Quantidade Total: {atividade.quantidadeTotalProduzida.toFixed(0)} unidades
                                    </p>
                                  )}
                                  {atividade.tempoTotalHoras !== undefined && atividade.tempoTotalHoras > 0 && (
                                    <p className="text-xs sm:text-sm text-purple-600">
                                      ⏱️ Tempo Total: {atividade.tempoTotalHoras.toFixed(1)} horas
                                    </p>
                                  )}
                                  {atividade.producaoHora !== undefined && atividade.producaoHora > 0 && (
                                    <p className="text-xs sm:text-sm text-green-700 font-semibold">
                                      🚀 Produção/h: {atividade.producaoHora.toFixed(1)} unidades/h
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center justify-between sm:justify-end sm:space-x-4 lg:space-x-6">
                            <div className="text-left sm:text-right">
                              <p className="font-bold text-base sm:text-lg">R$ {atividade.totalGanho.toFixed(2)}</p>
                              <p className="text-xs sm:text-sm text-gray-600">R$ {atividade.mediaDia.toFixed(2)}/dia</p>
                            </div>
                            <div className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${getPerformanceColor(atividade.performance)} flex-shrink-0`}>
                              <span className="hidden sm:inline">{getPerformanceEmoji(atividade.performance)} {atividade.performance}</span>
                              <span className="sm:hidden">{getPerformanceEmoji(atividade.performance)}</span>
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
                    <CardHeader className="p-3 sm:p-6">
                      <CardTitle className="flex items-center space-x-2 text-sm sm:text-base">
                        <TrendingUp className="h-4 w-4 sm:h-6 sm:w-6" />
                        <span className="truncate">📊 GANHOS ACUMULADOS POR ATIVIDADE</span>
                      </CardTitle>
                      <CardDescription className="text-xs sm:text-sm">
                        💰 Visualização acumulada dos seus ganhos por tipo de atividade no mês
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-3 sm:p-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                        {dashboardData.atividades.map((atividade, index) => (
                          <div key={index} className="bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 rounded-xl p-3 sm:p-4 hover:shadow-lg transition-all duration-300">
                            <div className="flex items-center justify-between mb-2 sm:mb-3">
                              <div className="text-2xl sm:text-3xl">{atividade.icon}</div>
                              <div className="text-right">
                                <div className="text-lg sm:text-2xl font-bold" style={{ color: atividade.cor }}>
                                  R$ {atividade.totalGanho.toFixed(2)}
                                </div>
                                <div className="text-xs text-gray-500">Total Acumulado</div>
                              </div>
                            </div>
                            <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base truncate">{atividade.nome}</h4>
                            <div className="space-y-1 text-xs sm:text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-600">📅 Dias:</span>
                                <span className="font-medium">{atividade.dias}</span>
                              </div>
                              {atividade.nome !== 'KPIs Atingidos' && (
                                <div className="flex justify-between">
                                  <span className="text-gray-600">💰 Valor Bruto:</span>
                                  <span className="font-medium text-red-600">R$ {(atividade.valorBrutoAtividades || atividade.totalGanho * 2).toFixed(2)}</span>
                                </div>
                              )}
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
                  <CardHeader className="p-3 sm:p-6">
                    <CardTitle className="flex items-center space-x-2 text-sm sm:text-base">
                      <Calendar className="h-4 w-4 sm:h-6 sm:w-6" />
                      <span className="truncate">📅 CALENDÁRIO DE LANÇAMENTOS</span>
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      🗓️ Visualização dos dias com lançamentos de produtividade (Segunda a Sábado)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-6">
                    <div className="space-y-3 sm:space-y-4">
                      {/* Legenda */}
                      <div className="grid grid-cols-2 sm:flex sm:items-center sm:justify-center gap-2 sm:gap-6 p-2 sm:p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-1 sm:space-x-2">
                          <div className="w-3 h-3 sm:w-4 sm:h-4 bg-green-500 rounded-full flex-shrink-0"></div>
                          <span className="text-xs sm:text-sm text-gray-700">✅ Com lançamento</span>
                        </div>
                        <div className="flex items-center space-x-1 sm:space-x-2">
                          <div className="w-3 h-3 sm:w-4 sm:h-4 bg-red-500 rounded-full flex-shrink-0"></div>
                          <span className="text-xs sm:text-sm text-gray-700">❌ Sem lançamento</span>
                        </div>
                        <div className="flex items-center space-x-1 sm:space-x-2">
                          <div className="w-3 h-3 sm:w-4 sm:h-4 bg-yellow-500 rounded-full flex-shrink-0"></div>
                          <span className="text-xs sm:text-sm text-gray-700">⏳ Pendente/Reprovado</span>
                        </div>
                        <div className="flex items-center space-x-1 sm:space-x-2">
                          <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gray-300 rounded-full flex-shrink-0"></div>
                          <span className="text-xs sm:text-sm text-gray-700">🚫 Domingo</span>
                        </div>
                      </div>
                      
                      {/* Calendário */}
                      <div className="grid grid-cols-7 gap-1 sm:gap-2">
                        {/* Cabeçalho dos dias da semana */}
                        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((dia, index) => (
                          <div key={index} className="text-center text-xs sm:text-sm font-medium text-gray-600 p-1 sm:p-2">
                            {dia}
                          </div>
                        ))}
                        
                        {/* Dias do mês */}
                        {(() => {
                          const diasDoMes = new Date(mesAtual.getFullYear(), mesAtual.getMonth() + 1, 0).getDate();
                          const primeiroDia = new Date(mesAtual.getFullYear(), mesAtual.getMonth(), 1).getDay();
                          // Separar lançamentos aprovados dos pendentes/reprovados para o calendário
                          const diasAprovados = new Set();
                          const diasPendentesReprovados = new Set();
                          
                          // Adicionar dias com lançamentos aprovados
                          dashboardData.historicoCompleto.forEach(item => {
                            const [dia] = item.data.split('/');
                            diasAprovados.add(parseInt(dia));
                          });
                          
                          // Adicionar dias com lançamentos pendentes/reprovados
                          lancamentosPendentesReprovados.forEach(item => {
                            // Usar a mesma lógica da formatDateSafe para evitar problemas de timezone
                            const dateOnly = item.data_lancamento.split('T')[0];
                            const [year, month, day] = dateOnly.split('-');
                            const data = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                            const dia = data.getDate();
                            diasPendentesReprovados.add(dia);
                          });
                          
                          // Verificação de dias com lançamentos feita diretamente com diasAprovados e diasPendentesReprovados
                          
                          const calendario = [];
                          
                          // Espaços vazios antes do primeiro dia
                          for (let i = 0; i < primeiroDia; i++) {
                            calendario.push(
                              <div key={`empty-${i}`} className="p-1 sm:p-2"></div>
                            );
                          }
                          
                          // Dias do mês
                          for (let dia = 1; dia <= diasDoMes; dia++) {
                            const diaDaSemana = new Date(mesAtual.getFullYear(), mesAtual.getMonth(), dia).getDay();
                            const isDomingo = diaDaSemana === 0;
                            const temAprovado = diasAprovados.has(dia);
                            const temPendenteReprovado = diasPendentesReprovados.has(dia);
                            
                            let corFundo = 'bg-gray-300'; // Domingo
                            let icone = '🚫';
                            let titulo = 'Domingo - Não há trabalho';
                            
                            if (!isDomingo) {
                              if (temAprovado) {
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
                            
                            const podeClicar = !isDomingo && !temAprovado && !temPendenteReprovado;
                            
                            calendario.push(
                              <div 
                                key={dia} 
                                className={`${corFundo} text-white rounded-lg p-1 sm:p-2 text-center transition-all duration-200 relative group ${
                                  podeClicar ? 'cursor-pointer hover:opacity-80 hover:scale-105 hover:shadow-lg' : 'cursor-default'
                                }`}
                                title={podeClicar ? `${titulo} - Clique para lançar atividade` : titulo}
                                onClick={podeClicar ? () => navegarParaCalculadora(dia) : undefined}
                              >
                                <div className="text-xs sm:text-sm font-medium">{dia}</div>
                                <div className="text-xs mt-1">{icone}</div>
                                {podeClicar && (
                                  <div className="text-xs mt-1 opacity-75">📝</div>
                                )}
                                
                                {/* Tooltip */}
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                                  {podeClicar ? `${titulo} - Clique para lançar atividade` : titulo}
                                </div>
                              </div>
                            );
                          }
                          
                          return calendario;
                        })()}
                      </div>
                      
                      {/* Estatísticas do calendário */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mt-4 sm:mt-6">
                        <div className="text-center p-2 sm:p-3 bg-green-50 rounded-lg border border-green-200">
                          <div className="text-lg sm:text-2xl font-bold text-green-600">
                            {(() => {
                              // Contar apenas dias com lançamentos aprovados
                              const diasAprovados = new Set();
                              
                              dashboardData.historicoCompleto.forEach(item => {
                                const [dia] = item.data.split('/');
                                diasAprovados.add(parseInt(dia));
                              });
                              
                              return diasAprovados.size;
                            })()} 
                          </div>
                          <div className="text-xs sm:text-sm text-green-700">✅ Dias Aprovados</div>
                        </div>
                        
                        <div className="text-center p-2 sm:p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                          <div className="text-lg sm:text-2xl font-bold text-yellow-600">
                            {lancamentosPendentesReprovados.length}
                          </div>
                          <div className="text-xs sm:text-sm text-yellow-700">⏳ Pendentes/Reprovados</div>
                        </div>
                        
                        <div className="text-center p-2 sm:p-3 bg-red-50 rounded-lg border border-red-200">
                          <div className="text-lg sm:text-2xl font-bold text-red-600">
                            {(() => {
                              const diasDoMes = new Date(mesAtual.getFullYear(), mesAtual.getMonth() + 1, 0).getDate();
                              const diasUteis = Array.from({length: diasDoMes}, (_, i) => i + 1).filter(dia => {
                                const diaDaSemana = new Date(mesAtual.getFullYear(), mesAtual.getMonth(), dia).getDay();
                                return diaDaSemana !== 0; // Não é domingo
                              }).length;
                              
                              // Combinar todos os lançamentos (aprovados + pendentes/reprovados)
                              const todosLancamentos = new Set();
                              
                              // Adicionar dias com lançamentos aprovados
                              dashboardData.historicoCompleto.forEach(item => {
                                const [dia] = item.data.split('/');
                                todosLancamentos.add(parseInt(dia));
                              });
                              
                              // Adicionar dias com lançamentos pendentes/reprovados
                              lancamentosPendentesReprovados.forEach(item => {
                                const dateOnly = item.data_lancamento.split('T')[0];
                                const [year, month, day] = dateOnly.split('-');
                                const data = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                                todosLancamentos.add(data.getDate());
                              });
                              
                              return diasUteis - todosLancamentos.size;
                            })()} 
                          </div>
                          <div className="text-xs sm:text-sm text-red-700">❌ Dias sem lançamento</div>
                        </div>
                        
                        <div className="text-center p-2 sm:p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="text-lg sm:text-2xl font-bold text-blue-600">
                            {(() => {
                              const diasDoMes = new Date(mesAtual.getFullYear(), mesAtual.getMonth() + 1, 0).getDate();
                              const diasUteis = Array.from({length: diasDoMes}, (_, i) => i + 1).filter(dia => {
                                const diaDaSemana = new Date(mesAtual.getFullYear(), mesAtual.getMonth(), dia).getDay();
                                return diaDaSemana !== 0; // Não é domingo
                              }).length;
                              // Combinar todos os lançamentos (aprovados + pendentes/reprovados)
                              const todosLancamentos = new Set();
                              
                              // Adicionar dias com lançamentos aprovados
                              dashboardData.historicoCompleto.forEach(item => {
                                const [dia] = item.data.split('/');
                                todosLancamentos.add(parseInt(dia));
                              });
                              
                              // Adicionar dias com lançamentos pendentes/reprovados
                              lancamentosPendentesReprovados.forEach(item => {
                                const dateOnly = item.data_lancamento.split('T')[0];
                                const [year, month, day] = dateOnly.split('-');
                                const data = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                                todosLancamentos.add(data.getDate());
                              });
                              
                              return Math.round((todosLancamentos.size / diasUteis) * 100);
                            })()}%
                          </div>
                          <div className="text-xs sm:text-sm text-blue-700">📊 Taxa de lançamentos</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Seção 2.1: Histórico Detalhado de Lançamentos Aprovados */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-sm sm:text-base">
                      <Calendar className="h-4 w-4 sm:h-6 sm:w-6" />
                      <span className="text-sm sm:text-base">📋 HISTÓRICO DE LANÇAMENTOS RV APROVADOS</span>
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      📊 Todos os seus lançamentos RV aprovados no mês com detalhes completos
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 sm:space-y-3 max-h-80 sm:max-h-96 overflow-y-auto">
                      {dashboardData.historicoCompleto.length > 0 ? (
                        dashboardData.historicoCompleto.map((item, index) => {
                          // Parse dos dados do lançamento para exibir detalhes
                          let kpisAtingidos = [];
                          let tarefasValidas = null;
                          
                          try {
                            if (item.kpis_atingidos && typeof item.kpis_atingidos === 'string') {
                              kpisAtingidos = JSON.parse(item.kpis_atingidos);
                            } else if (Array.isArray(item.kpis_atingidos)) {
                              kpisAtingidos = item.kpis_atingidos;
                            }
                            
                            if (item.tarefas_validas) {
                              tarefasValidas = item.tarefas_validas;
                            }
                          } catch (e) {
                            console.log('Erro ao parsear dados do lançamento:', e);
                          }
                          
                          // Calcular valor final correto (Atividades + KPIs)
                          const valorAtividades = item.subtotal_atividades || item.valor_tarefas || 0;
                          const valorKpis = item.bonus_kpis || 0;
                          const valorFinal = valorAtividades + valorKpis;
                          
                          return (
                            <div key={index} className="p-3 sm:p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg hover:shadow-md transition-all duration-200">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2 sm:space-x-4">
                                  <div className="text-lg sm:text-2xl">
                                    {dashboardData.atividades.find(a => a.nome === item.atividade)?.icon || '⚡'}
                                  </div>
                                  <div className="flex-1">
                                    <h4 className="font-semibold text-gray-900 text-sm sm:text-lg">Lançamento RV</h4>
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 mt-1 space-y-1 sm:space-y-0">
                                      <p className="text-xs sm:text-sm text-gray-600 flex items-center">
                                        <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                        📅 {item.data}
                                      </p>
                                      <p className="text-xs sm:text-sm text-gray-600">
                                        🏢 {item.turno || 'N/A'}
                                      </p>
                                    </div>
                                    
                                    {/* Resumo detalhado */}
                                    <div className="mt-2 sm:mt-3 space-y-1 sm:space-y-2 bg-white p-2 sm:p-3 rounded border">
                                      <h5 className="font-medium text-gray-800 text-xs sm:text-sm">📊 Resumo do Lançamento:</h5>
                                      
                                      {/* KPIs Atingidos */}
                                      {kpisAtingidos.length > 0 && (
                                        <div className="text-xs sm:text-sm">
                                          <span className="font-medium text-blue-600">🎯 KPIs Atingidos ({kpisAtingidos.length}):</span>
                                          <span className="text-gray-700 ml-1 sm:ml-2">{kpisAtingidos.join(', ')}</span>
                                          <span className="text-green-600 ml-1 sm:ml-2 font-medium">R$ {(item.bonus_kpis || 0).toFixed(2)}</span>
                                        </div>
                                      )}
                                      
                                      {/* Tarefas Válidas - sempre exibir quando disponível */}
                                      {tarefasValidas && (
                                        <div className="text-xs sm:text-sm">
                                          <span className="font-medium text-purple-600">📋 Tarefas Válidas:</span>
                                          <span className="text-gray-700 ml-1 sm:ml-2">{tarefasValidas} tarefas</span>
                                          <span className="text-green-600 ml-1 sm:ml-2 font-medium">
                                            R$ {(item.subtotal_atividades || item.valor_tarefas || 0).toFixed(2)}
                                          </span>
                                          <span className="text-gray-500 ml-1 text-xs">(Valor Bruto/Líquido)</span>
                                        </div>
                                      )}
                                      
                                      {/* Atividade principal - para outras funções */}
                                      {item.atividade && item.atividade !== 'KPIs Atingidos' && item.atividade !== 'Tarefas Válidas' && (
                                        <div className="text-xs sm:text-sm">
                                          <span className="font-medium text-orange-600">🏃‍♂️ Atividade:</span>
                                          <span className="text-gray-700 ml-1 sm:ml-2">{item.atividade}</span>
                                          <span className="text-green-600 ml-1 sm:ml-2 font-medium">R$ {item.valor.toFixed(2)}</span>
                                        </div>
                                      )}
                                    </div>
                                    
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 mt-2 space-y-1 sm:space-y-0">
                                      <span className="inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 w-fit">
                                        ✅ Aprovado
                                      </span>
                                      <span className="text-xs text-gray-500">
                                        👤 Aprovado por: {item.aprovadoPor || 'Sistema'}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-lg sm:text-2xl font-bold text-green-600">
                                    + R$ {userFunction === 'Operador de Empilhadeira' ? valorFinal.toFixed(2) : item.valor.toFixed(2)}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-1">💰 Valor Final</p>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center py-8 sm:py-12 text-gray-500">
                          <Calendar className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-4 text-gray-300" />
                          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">Nenhum lançamento aprovado</h3>
                          <p className="text-sm sm:text-base text-gray-600">Você ainda não possui lançamentos aprovados para este mês.</p>
                          <Link to="/">
                            <Button className="mt-4" variant="outline" size="sm">
                              <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
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
                    <CardTitle className="flex items-center space-x-2 text-sm sm:text-base">
                      <TrendingUp className="h-4 w-4 sm:h-6 sm:w-6" />
                      <span className="text-sm sm:text-base">📊 RESUMO ACUMULADO DO MÊS</span>
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      📈 Consolidado de todas as suas atividades e KPIs no período
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                      {/* Total de Dias */}
                      <div className="bg-white p-3 sm:p-4 rounded-lg border border-blue-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs sm:text-sm font-medium text-blue-600">📅 DIAS TRABALHADOS</p>
                            <p className="text-lg sm:text-2xl font-bold text-blue-900">
                              {dashboardData.historicoCompleto ? new Set(dashboardData.historicoCompleto.map(item => item.data)).size : 0}
                            </p>
                            <p className="text-xs text-blue-600">dias no mês</p>
                          </div>
                          <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" />
                        </div>
                      </div>

                      {/* KPIs Atingidos */}
                      <div className="bg-white p-3 sm:p-4 rounded-lg border border-green-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs sm:text-sm font-medium text-green-600">🎯 KPIs ATINGIDOS</p>
                            <p className="text-lg sm:text-2xl font-bold text-green-900">
                              {dashboardData.historicoCompleto ? 
                                dashboardData.historicoCompleto.reduce((total, item) => {
                                  if (item.kpis_atingidos) {
                                    let kpisArray: string[] = [];
                                    if (typeof item.kpis_atingidos === 'string') {
                                      try {
                                        kpisArray = JSON.parse(item.kpis_atingidos);
                                      } catch {
                                        kpisArray = [];
                                      }
                                    } else if (Array.isArray(item.kpis_atingidos)) {
                                      kpisArray = item.kpis_atingidos;
                                    }
                                    return total + kpisArray.length;
                                  }
                                  return total;
                                }, 0) : 0
                              }
                            </p>
                            <p className="text-xs text-green-600">
                              R$ {dashboardData.historicoCompleto ? 
                                dashboardData.historicoCompleto.reduce((total, item) => total + (item.bonus_kpis || 0), 0).toFixed(2) : '0.00'
                              }
                            </p>
                          </div>
                          <Target className="h-6 w-6 sm:h-8 sm:w-8 text-green-500" />
                        </div>
                      </div>

                      {/* Tarefas Válidas */}
                      {userFunction === 'Operador de Empilhadeira' && (
                        <div className="bg-white p-3 sm:p-4 rounded-lg border border-purple-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs sm:text-sm font-medium text-purple-600">📋 TAREFAS VÁLIDAS</p>
                              <p className="text-lg sm:text-2xl font-bold text-purple-900">
                                {dashboardData.historicoCompleto ? 
                                  dashboardData.historicoCompleto.reduce((total, item) => total + (item.tarefas_validas || 0), 0) : 0
                                }
                              </p>
                              <p className="text-xs text-purple-600">
                                Bruto: R$ {dashboardData.historicoCompleto ? 
                                  dashboardData.historicoCompleto.reduce((total, item) => total + (item.valor_bruto_atividades || item.valor_tarefas || 0), 0).toFixed(2) : '0.00'
                                } | Líquido: R$ {dashboardData.historicoCompleto ? 
                                  dashboardData.historicoCompleto.reduce((total, item) => total + (item.subtotal_atividades || 0), 0).toFixed(2) : '0.00'
                                }
                              </p>
                            </div>
                            <Activity className="h-6 w-6 sm:h-8 sm:w-8 text-purple-500" />
                          </div>
                        </div>
                      )}

                      {/* Valor das Atividades - Específico para Ajudante de Armazém */}
                      {userFunction === 'Ajudante de Armazém' && (
                        <div className="bg-white p-3 sm:p-4 rounded-lg border border-indigo-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs sm:text-sm font-medium text-indigo-600">🏃‍♂️ ATIVIDADES</p>
                              <p className="text-lg sm:text-2xl font-bold text-indigo-900">
                                {dashboardData.atividades.length}
                              </p>
                              <p className="text-xs text-indigo-600">
                                Bruto: R$ {dashboardData.historicoCompleto ? 
                                  dashboardData.historicoCompleto.reduce((total, item) => {
                                    // Somar apenas atividades (não KPIs) para o valor bruto
                                    return item.atividade !== 'KPIs Atingidos' ? total + (item.valor_bruto_atividades || item.valor * 2) : total;
                                  }, 0).toFixed(2) : '0.00'
                                } | Líquido: R$ {dashboardData.atividades.reduce((total, ativ) => {
                                  // Somar apenas atividades (não KPIs)
                                  return ativ.nome !== 'KPIs Atingidos' ? total + ativ.totalGanho : total;
                                }, 0).toFixed(2)}
                              </p>
                            </div>
                            <Activity className="h-6 w-6 sm:h-8 sm:w-8 text-indigo-500" />
                          </div>
                        </div>
                      )}

                      {/* Valor Total */}
                      <div className="bg-white p-3 sm:p-4 rounded-lg border border-orange-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs sm:text-sm font-medium text-orange-600">💰 VALOR TOTAL</p>
                            <p className="text-lg sm:text-2xl font-bold text-orange-900">
                              R$ {dashboardData.ganhoTotal.toFixed(2)}
                            </p>
                            <p className="text-xs text-orange-600">
                              Média: R$ {dashboardData.mediaDiaria.toFixed(2)}/dia
                            </p>
                          </div>
                          <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-orange-500" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Seção 3: Histórico de Lançamentos Pendentes/Reprovados */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-sm sm:text-base">
                      <Activity className="h-4 w-4 sm:h-6 sm:w-6" />
                      <span className="text-sm sm:text-base">📋 HISTÓRICO DE LANÇAMENTOS PENDENTES/REPROVADOS</span>
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      📊 Lançamentos aguardando aprovação ou que foram reprovados
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 sm:space-y-3 max-h-80 sm:max-h-96 overflow-y-auto">
                      {lancamentosPendentesReprovados.length > 0 ? (
                      lancamentosPendentesReprovados
                        .filter((item: any) => {
                          // Usar a mesma lógica da formatDateSafe para evitar problemas de timezone
                          const dateOnly = item.data_lancamento.split('T')[0];
                          const [year, month, day] = dateOnly.split('-');
                          const dataLancamento = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                          const mesLancamento = dataLancamento.getMonth();
                          const anoLancamento = dataLancamento.getFullYear();
                          return mesLancamento === mesAtual.getMonth() && anoLancamento === mesAtual.getFullYear();
                        })
                        .map((item, index) => {
                          // Parse dos dados do lançamento para exibir detalhes
                          let kpisAtingidos = [];
                          let tarefasValidas = null;
                          
                          try {
                            if (item.kpis_atingidos && typeof item.kpis_atingidos === 'string') {
                              kpisAtingidos = JSON.parse(item.kpis_atingidos);
                            } else if (Array.isArray(item.kpis_atingidos)) {
                              kpisAtingidos = item.kpis_atingidos;
                            }
                            
                            if (item.tarefas_validas) {
                              tarefasValidas = item.tarefas_validas;
                            }
                          } catch (e) {
                            console.log('Erro ao parsear dados do lançamento:', e);
                          }
                          
                          const isPendente = item.status === 'pendente';
                          const isReprovado = item.status === 'reprovado';
                          
                          return (
                            <div key={index} className={`p-3 sm:p-4 border rounded-lg hover:shadow-md transition-all duration-200 ${
                              isPendente ? 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200' : 
                              'bg-gradient-to-r from-red-50 to-rose-50 border-red-200'
                            }`}>
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                                <div className="flex items-center space-x-3 sm:space-x-4">
                                  <div className="text-xl sm:text-2xl">
                                    {getActivityIcon(item.nome_atividade || 'KPIs Atingidos')}
                                  </div>
                                  <div className="flex-1">
                                    <h4 className="font-semibold text-gray-900 text-base sm:text-lg">Lançamento RV</h4>
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 mt-1 space-y-1 sm:space-y-0">
                                      <p className="text-xs sm:text-sm text-gray-600 flex items-center">
                                        <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                        📅 {formatDateSafe(item.data_lancamento)}
                                      </p>
                                      <p className="text-xs sm:text-sm text-gray-600">
                                        🏢 {item.turno || 'N/A'}
                                      </p>
                                    </div>
                                    
                                    {/* Resumo detalhado */}
                                    <div className="mt-2 sm:mt-3 space-y-1 sm:space-y-2 bg-white p-2 sm:p-3 rounded border">
                                      <h5 className="font-medium text-gray-800 text-xs sm:text-sm">📊 Resumo do Lançamento:</h5>
                                      
                                      {/* KPIs Atingidos */}
                                      {kpisAtingidos.length > 0 && (
                                        <div className="text-xs sm:text-sm">
                                          <span className="font-medium text-blue-600">🎯 KPIs Atingidos ({kpisAtingidos.length}):</span>
                                          <span className="text-gray-700 ml-1 sm:ml-2">{kpisAtingidos.join(', ')}</span>
                                          <span className="text-green-600 ml-1 sm:ml-2 font-medium">R$ {(item.bonus_kpis || 0).toFixed(2)}</span>
                                        </div>
                                      )}
                                      
                                      {/* Tarefas Válidas */}
                                      {tarefasValidas && (
                                        <div className="text-xs sm:text-sm">
                                          <span className="font-medium text-purple-600">📋 Tarefas Válidas:</span>
                                          <span className="text-gray-700 ml-1 sm:ml-2">{tarefasValidas} tarefas</span>
                                          <span className="text-green-600 ml-1 sm:ml-2 font-medium">R$ {(item.subtotal_atividades || 0).toFixed(2)}</span>
                                        </div>
                                      )}
                                      
                                      {/* Atividade principal */}
                                      {item.nome_atividade && item.nome_atividade !== 'KPIs Atingidos' && (
                                        <div className="text-xs sm:text-sm">
                                          <span className="font-medium text-orange-600">🏃‍♂️ Atividade:</span>
                                          <span className="text-gray-700 ml-1 sm:ml-2">{item.nome_atividade}</span>
                                          <span className="text-green-600 ml-1 sm:ml-2 font-medium">R$ {(item.subtotal_atividades || 0).toFixed(2)}</span>
                                        </div>
                                      )}
                                    </div>
                                    
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 mt-2 space-y-1 sm:space-y-0">
                                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
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
                                <div className="text-center sm:text-right">
                                  <p className={`text-lg sm:text-2xl font-bold ${
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
                        <div className="text-center py-8 sm:py-12 text-gray-500">
                          <Calendar className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-3 sm:mb-4 text-gray-300" />
                          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">Nenhum lançamento pendente/reprovado</h3>
                          <p className="text-sm sm:text-base text-gray-600 px-4">Você não possui lançamentos pendentes ou reprovados para este mês.</p>
                          <Link to="/">
                            <Button className="mt-3 sm:mt-4" variant="outline">
                              <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                              Fazer um Lançamento
                            </Button>
                          </Link>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Seção 4: Insights e KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
                    <CardHeader>
                      <CardTitle className="text-base sm:text-lg text-yellow-800">🥇 MELHOR DIA</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {dashboardData.melhorDia.data ? (
                        <div className="space-y-1 sm:space-y-2">
                          <p className="font-bold text-lg sm:text-xl text-yellow-900">
                            📅 {dashboardData.melhorDia.data}
                          </p>
                          <p className="text-base sm:text-lg font-semibold text-yellow-800">
                            💰 R$ {dashboardData.melhorDia.valor.toFixed(2)}
                          </p>
                          <p className="text-xs sm:text-sm text-yellow-700">
                            📊 Tempo trabalhado: {dashboardData.melhorDia.tempo}
                          </p>
                          <p className="text-xs sm:text-sm text-yellow-600">
                            🏆 Seu recorde pessoal
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm sm:text-base text-yellow-700">Sem dados disponíveis</p>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
                    <CardHeader>
                      <CardTitle className="text-base sm:text-lg text-indigo-800">⭐ PROGRESSO DA META</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3 sm:space-y-4">
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs sm:text-sm font-medium text-indigo-700">Meta {userFunction}</span>
                            <span className="text-xs sm:text-sm font-bold text-indigo-900">{dashboardData.percentualMeta.toFixed(0)}%</span>
                          </div>
                          <div className="w-full bg-indigo-200 rounded-full h-2 sm:h-3">
                            <div 
                              className="bg-gradient-to-r from-indigo-400 to-purple-600 h-2 sm:h-3 rounded-full transition-all duration-300"
                              style={{ width: `${Math.min(dashboardData.percentualMeta, 100)}%` }}
                            ></div>
                          </div>
                          <p className="text-xs text-indigo-600 mt-1">Meta: R$ {dashboardData.metaMensal.toFixed(2)}</p>
                        </div>
                        
                        <div className="text-center p-2 sm:p-3 bg-white rounded-lg border border-indigo-200">
                          <p className="text-sm sm:text-lg font-bold text-indigo-800">
                            {dashboardData.percentualMeta >= 100 ? '🎉 META SUPERADA!' : 
                             dashboardData.percentualMeta >= 85 ? '🔥 QUASE LÁ!' : 
                             '💪 CONTINUE ASSIM!'}
                          </p>
                          <p className="text-xs sm:text-sm text-indigo-600">
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
