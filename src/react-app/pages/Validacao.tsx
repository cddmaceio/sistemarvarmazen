import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Edit, Clock, User, Calendar, TrendingUp, FileText, Tag } from 'lucide-react';
import { Link } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/react-app/components/Card';
import { Button } from '@/react-app/components/Button';
import { Input } from '@/react-app/components/Input';
import AuthGuard from '@/react-app/components/AuthGuard';
import UserMenu from '@/react-app/components/UserMenu';
import EditLancamentoModal from '@/react-app/components/EditLancamentoModal';
import { useAuth } from '@/react-app/hooks/useAuth';
import { LancamentoType, CalculatorInputType, CalculatorResultType } from '@/shared/types';

export default function Validacao() {
  const { isAdmin } = useAuth();
  const [lancamentos, setLancamentos] = useState<LancamentoType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [processando, setProcessando] = useState<string | null>(null);
  const [selectedLancamento, setSelectedLancamento] = useState<LancamentoType | null>(null);
  const [observacoes, setObservacoes] = useState<string>('');
  const [showDetails, setShowDetails] = useState<string | null>(null);
  const [editModalOpen, setEditModalOpen] = useState<boolean>(false);
  const [editingLancamento, setEditingLancamento] = useState<LancamentoType | null>(null);

  useEffect(() => {
    if (isAdmin) {
      fetchLancamentosPendentes();
    }
  }, [isAdmin]);

  const fetchLancamentosPendentes = async () => {
    try {
      const response = await fetch('/api/lancamentos/pendentes');
      if (!response.ok) throw new Error('Falha ao carregar lançamentos');
      const data = await response.json();
      setLancamentos(data);
    } catch (error) {
      console.error('Erro ao carregar lançamentos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleValidacao = async (lancamentoId: number, acao: 'aprovar' | 'reprovar') => {
    setProcessando(String(lancamentoId));
    try {
      const response = await fetch(`/api/lancamentos/${lancamentoId}/validar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          acao,
          observacoes: observacoes || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha na validação');
      }

      // Refresh the list
      await fetchLancamentosPendentes();
      setObservacoes('');
      setSelectedLancamento(null);
      
    } catch (error) {
      console.error('Erro na validação:', error);
      alert(`Erro ao processar validação: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setProcessando(null);
    }
  };

  const handleEditLancamento = (lancamento: LancamentoType) => {
    setEditingLancamento(lancamento);
    setEditModalOpen(true);
  };

  const handleSaveEdit = async (editedData: CalculatorInputType, _result: CalculatorResultType) => {
    if (!editingLancamento) return;

    setProcessando(String(editingLancamento.id));
    try {
      const response = await fetch(`/api/lancamentos/${editingLancamento.id}/validar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          acao: 'editar',
          observacoes: observacoes || undefined,
          dados_editados: editedData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha na edição');
      }

      // Refresh the list
      await fetchLancamentosPendentes();
      setEditModalOpen(false);
      setEditingLancamento(null);
      setObservacoes('');
      
    } catch (error) {
      console.error('Erro na edição:', error);
      alert(`Erro ao editar lançamento: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setProcessando(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const parseJsonSafely = (jsonString: string | null | undefined) => {
    if (!jsonString) return null;
    try {
      return JSON.parse(jsonString);
    } catch {
      return null;
    }
  };

  const getLancamentoDetails = (lancamento: LancamentoType) => {
    const kpisAtingidos = parseJsonSafely(lancamento.kpis_atingidos || null);
    const atividadesDetalhes = parseJsonSafely(lancamento.atividades_detalhes || null);
    const multipleActivities = parseJsonSafely(lancamento.multiple_activities || null);

    return {
      kpisAtingidos: kpisAtingidos || [],
      atividadesDetalhes: atividadesDetalhes || [],
      multipleActivities: multipleActivities || [],
    };
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-red-700">Acesso Restrito</CardTitle>
            <CardDescription>
              Esta área é exclusiva para administradores.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              A validação de lançamentos só pode ser feita por administradores do sistema.
            </p>
            <Link to="/">
              <Button className="w-full">
                <Calendar className="h-4 w-4 mr-2" />
                Voltar para Calculadora
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
        {/* Header */}
        <header className="border-b bg-white/70 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  Validação de Lançamentos
                </h1>
              </div>
              <UserMenu />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            {/* Stats Header */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-yellow-600">Lançamentos Pendentes</p>
                      <p className="text-2xl font-bold text-yellow-900">{lancamentos.length}</p>
                    </div>
                    <Clock className="h-8 w-8 text-yellow-600" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-600">Total de Colaboradores</p>
                      <p className="text-2xl font-bold text-blue-900">
                        {new Set(lancamentos.map(l => l.user_cpf)).size}
                      </p>
                    </div>
                    <User className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-600">Valor Total Pendente</p>
                      <p className="text-2xl font-bold text-green-900">
                        R$ {lancamentos.reduce((sum, l) => sum + l.remuneracao_total, 0).toFixed(2)}
                      </p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Lançamentos List */}
            {loading ? (
              <div className="text-center py-8">
                <p className="text-gray-600">Carregando lançamentos...</p>
              </div>
            ) : lancamentos.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Nenhum lançamento pendente
                  </h3>
                  <p className="text-gray-600">
                    Todos os lançamentos foram processados.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {lancamentos.map((lancamento) => {
                  const details = getLancamentoDetails(lancamento);
                  const isExpanded = showDetails === String(lancamento.id);
                  
                  return (
                    <Card key={lancamento.id} className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                      <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="flex-shrink-0">
                              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
                                <User className="h-6 w-6 text-purple-600" />
                              </div>
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <CardTitle className="text-lg text-gray-900">
                                  {lancamento.user_nome}
                                </CardTitle>
                                {lancamento.status_edicao === 'editado_admin' && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    <Tag className="h-3 w-3 mr-1" />
                                    Editado por {lancamento.editado_por_admin}
                                  </span>
                                )}
                              </div>
                              <CardDescription className="flex items-center space-x-4 text-sm">
                                <span className="flex items-center">
                                  <Calendar className="h-4 w-4 mr-1" />
                                  {formatDate(lancamento.data_lancamento)}
                                </span>
                                <span>CPF: {lancamento.user_cpf}</span>
                                <span>Função: {lancamento.funcao}</span>
                                <span>Turno: {lancamento.turno}</span>
                                {lancamento.data_edicao && (
                                  <span className="text-blue-600">
                                    Editado em: {formatDate(lancamento.data_edicao)}
                                  </span>
                                )}
                              </CardDescription>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-green-600">
                              R$ {lancamento.remuneracao_total.toFixed(2)}
                            </div>
                            <div className="text-xs text-gray-500">
                              Lançado em {formatDate(lancamento.created_at!)}
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="pt-0">
                        {/* Quick Summary */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div className="bg-blue-50 p-3 rounded-lg">
                            <p className="text-xs text-blue-600 font-medium">Atividades</p>
                            <p className="text-sm font-semibold text-blue-900">
                              R$ {(lancamento.subtotal_atividades * 2).toFixed(2)}
                              <span className="text-xs text-blue-600 ml-1">(50%)</span>
                            </p>
                          </div>
                          <div className="bg-green-50 p-3 rounded-lg">
                            <p className="text-xs text-green-600 font-medium">KPIs</p>
                            <p className="text-sm font-semibold text-green-900">
                              R$ {lancamento.bonus_kpis.toFixed(2)}
                            </p>
                          </div>
                          {lancamento.tarefas_validas && (
                            <div className="bg-purple-50 p-3 rounded-lg">
                              <p className="text-xs text-purple-600 font-medium">Tarefas Válidas</p>
                              <p className="text-sm font-semibold text-purple-900">
                                {lancamento.tarefas_validas} tarefas
                              </p>
                            </div>
                          )}
                          {details.kpisAtingidos.length > 0 && (
                            <div className="bg-amber-50 p-3 rounded-lg">
                              <p className="text-xs text-amber-600 font-medium">KPIs Atingidos</p>
                              <p className="text-sm font-semibold text-amber-900">
                                {details.kpisAtingidos.length} de {details.kpisAtingidos.length}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Expand/Collapse Details */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowDetails(isExpanded ? null : String(lancamento.id))}
                          className="mb-4 w-full"
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          {isExpanded ? 'Ocultar Detalhes' : 'Ver Detalhes Completos'}
                        </Button>

                        {/* Detailed Information */}
                        {isExpanded && (
                          <div className="space-y-4 p-4 bg-gray-50 rounded-lg mb-4">
                            {/* Single Activity */}
                            {lancamento.nome_atividade && (
                              <div>
                                <h4 className="font-medium text-gray-900 mb-2">Atividade Realizada</h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                  <div>
                                    <span className="text-gray-600">Atividade:</span>
                                    <p className="font-medium">{lancamento.nome_atividade}</p>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">Quantidade:</span>
                                    <p className="font-medium">{lancamento.quantidade_produzida}</p>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">Tempo:</span>
                                    <p className="font-medium">{lancamento.tempo_horas}h</p>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">Produtividade:</span>
                                    <p className="font-medium text-blue-600">
                                      {lancamento.produtividade_alcancada?.toFixed(2)} {lancamento.unidade_medida}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Multiple Activities */}
                            {details.multipleActivities.length > 0 && (
                              <div>
                                <h4 className="font-medium text-gray-900 mb-2">Múltiplas Atividades</h4>
                                <div className="space-y-2">
                                  {details.multipleActivities.map((activity: any, index: number) => (
                                    <div key={index} className="bg-white p-3 rounded border text-sm">
                                      <div className="grid grid-cols-3 gap-3">
                                        <div>
                                          <span className="text-gray-600">Atividade:</span>
                                          <p className="font-medium">{activity.nome_atividade}</p>
                                        </div>
                                        <div>
                                          <span className="text-gray-600">Quantidade:</span>
                                          <p className="font-medium">{activity.quantidade_produzida}</p>
                                        </div>
                                        <div>
                                          <span className="text-gray-600">Tempo:</span>
                                          <p className="font-medium">{activity.tempo_horas}h</p>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Operator Tasks */}
                            {lancamento.nome_operador && (
                              <div>
                                <h4 className="font-medium text-gray-900 mb-2">Tarefas do Operador</h4>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                  <div>
                                    <span className="text-gray-600">Operador:</span>
                                    <p className="font-medium">{lancamento.nome_operador}</p>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">Tarefas Válidas:</span>
                                    <p className="font-medium text-purple-600">{lancamento.tarefas_validas}</p>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* KPIs Achieved */}
                            {details.kpisAtingidos.length > 0 && (
                              <div>
                                <h4 className="font-medium text-gray-900 mb-2">KPIs Atingidos</h4>
                                <div className="flex flex-wrap gap-2">
                                  {details.kpisAtingidos.map((kpi: string, index: number) => (
                                    <span key={index} className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                                      ✅ {kpi}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Observações */}
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Observações (opcional)
                          </label>
                          <Input
                            value={selectedLancamento?.id === lancamento.id ? observacoes : ''}
                            onChange={(e) => {
                              setSelectedLancamento(lancamento);
                              setObservacoes(e.target.value);
                            }}
                            placeholder="Adicione observações sobre este lançamento..."
                            className="w-full"
                          />
                        </div>

                        {/* Action Buttons */}
                        <div className="flex space-x-3">
                          <Button
                            onClick={() => {
                              setSelectedLancamento(lancamento);
                              handleValidacao(lancamento.id!, 'aprovar');
                            }}
                            disabled={processando === String(lancamento.id)}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            {processando === String(lancamento.id) ? 'Processando...' : 'Aprovar Lançamento'}
                          </Button>
                          
                          <Button
                            onClick={() => {
                              setSelectedLancamento(lancamento);
                              handleValidacao(lancamento.id!, 'reprovar');
                            }}
                            disabled={processando === String(lancamento.id)}
                            variant="destructive"
                            className="flex-1"
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            {processando === String(lancamento.id) ? 'Processando...' : 'Reprovar Lançamento'}
                          </Button>
                          
                          <Button
                            variant="outline"
                            className="px-6"
                            disabled={processando === String(lancamento.id)}
                            onClick={() => handleEditLancamento(lancamento)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </main>

        {/* Edit Modal */}
        <EditLancamentoModal
          open={editModalOpen}
          onClose={() => {
            setEditModalOpen(false);
            setEditingLancamento(null);
          }}
          lancamento={editingLancamento}
          onSave={handleSaveEdit}
        />
      </div>
    </AuthGuard>
  );
}
