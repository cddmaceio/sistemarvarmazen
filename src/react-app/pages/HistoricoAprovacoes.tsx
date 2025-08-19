import { useState, useEffect } from 'react';
import { History, Search, Filter, Calendar, User, Download, Tag, CheckCircle, TrendingUp } from 'lucide-react';
import { Link } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/react-app/components/Card';
import { Button } from '@/react-app/components/Button';
import { Input } from '@/react-app/components/Input';
import { Select } from '@/react-app/components/Select';
import AuthGuard from '@/react-app/components/AuthGuard';
import UserMenu from '@/react-app/components/UserMenu';
import { useAuth } from '@/react-app/hooks/useAuth';
import { HistoricoAprovacaoType } from '@/shared/types';

export default function HistoricoAprovacoes() {
  const { isAdmin } = useAuth();
  const [historico, setHistorico] = useState<HistoricoAprovacaoType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filtros, setFiltros] = useState({
    colaborador: '',
    admin: '',
    editado: '',
  });

  useEffect(() => {
    if (isAdmin) {
      fetchHistorico();
    }
  }, [isAdmin]);

  const fetchHistorico = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      
      if (filtros.colaborador) queryParams.append('colaborador', filtros.colaborador);
      if (filtros.admin) queryParams.append('admin', filtros.admin);
      if (filtros.editado) queryParams.append('editado', filtros.editado);
      
      const response = await fetch(`/api/historico-aprovacoes?${queryParams.toString()}`);
      if (!response.ok) throw new Error('Falha ao carregar histórico');
      const data = await response.json();
      setHistorico(data);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFiltroChange = (campo: string, valor: string) => {
    setFiltros(prev => ({ ...prev, [campo]: valor }));
  };

  const aplicarFiltros = () => {
    fetchHistorico();
  };

  const limparFiltros = () => {
    setFiltros({ colaborador: '', admin: '', editado: '' });
    setTimeout(fetchHistorico, 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const parseJsonSafely = (jsonString: string) => {
    try {
      return JSON.parse(jsonString);
    } catch {
      return null;
    }
  };

  const exportarCSV = () => {
    const csvData = historico.map(item => ({
      'Data Lançamento': formatDate(item.data_lancamento),
      'Colaborador': item.colaborador_nome,
      'CPF': item.colaborador_cpf,
      'Data Aprovação': formatDateTime(item.data_aprovacao),
      'Aprovado Por': item.aprovado_por,
      'Editado': item.editado ? 'Sim' : 'Não',
      'Editado Por': item.editado_por || '-',
      'Remuneração Total': `R$ ${item.remuneracao_total.toFixed(2)}`,
      'Observações': item.observacoes || '-'
    }));
    
    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `historico_aprovacoes_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
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
              O histórico de aprovações só pode ser visualizado por administradores do sistema.
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
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
        {/* Header */}
        <header className="border-b bg-white/70 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-600 to-cyan-600 flex items-center justify-center">
                  <History className="h-5 w-5 text-white" />
                </div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-cyan-600 bg-clip-text text-transparent">
                  Histórico de Aprovações
                </h1>
              </div>
              <div className="flex items-center space-x-4">
                <Link to="/admin/validacao">
                  <Button variant="outline" size="sm">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Validação
                  </Button>
                </Link>
                <UserMenu />
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto">
            {/* Stats Header */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-600">Total Aprovado</p>
                      <p className="text-2xl font-bold text-green-900">{historico.length}</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-600">Editados</p>
                      <p className="text-2xl font-bold text-blue-900">
                        {historico.filter(h => h.editado).length}
                      </p>
                    </div>
                    <Tag className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-600">Colaboradores</p>
                      <p className="text-2xl font-bold text-purple-900">
                        {new Set(historico.map(h => h.colaborador_cpf)).size}
                      </p>
                    </div>
                    <User className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-yellow-600">Valor Total</p>
                      <p className="text-2xl font-bold text-yellow-900">
                        R$ {historico.reduce((sum, h) => sum + h.remuneracao_total, 0).toFixed(2)}
                      </p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-yellow-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-lg">
                  <Filter className="h-5 w-5" />
                  <span>Filtros</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Colaborador
                    </label>
                    <Input
                      placeholder="Nome do colaborador"
                      value={filtros.colaborador}
                      onChange={(e) => handleFiltroChange('colaborador', e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Aprovado por
                    </label>
                    <Input
                      placeholder="Nome do admin"
                      value={filtros.admin}
                      onChange={(e) => handleFiltroChange('admin', e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status de Edição
                    </label>
                    <Select
                      value={filtros.editado}
                      onChange={(e) => handleFiltroChange('editado', e.target.value)}
                    >
                      <option value="">Todos</option>
                      <option value="true">Editados</option>
                      <option value="false">Originais</option>
                    </Select>
                  </div>
                  
                  <div className="flex items-end space-x-2">
                    <Button onClick={aplicarFiltros} className="flex-1">
                      <Search className="h-4 w-4 mr-2" />
                      Filtrar
                    </Button>
                    <Button variant="outline" onClick={limparFiltros}>
                      Limpar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Export Button */}
            <div className="flex justify-end mb-6">
              <Button onClick={exportarCSV} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Exportar CSV
              </Button>
            </div>

            {/* History List */}
            {loading ? (
              <div className="text-center py-8">
                <p className="text-gray-600">Carregando histórico...</p>
              </div>
            ) : historico.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Nenhum registro encontrado
                  </h3>
                  <p className="text-gray-600">
                    Não há lançamentos aprovados com os filtros aplicados.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {historico.map((item) => {
                  const dadosFinais = parseJsonSafely(item.dados_finais);
                  
                  return (
                    <Card key={item.id} className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-4">
                            <div className="flex-shrink-0">
                              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center">
                                <CheckCircle className="h-6 w-6 text-green-600" />
                              </div>
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <h3 className="text-lg font-semibold text-gray-900">
                                  {item.colaborador_nome}
                                </h3>
                                {item.editado && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    <Tag className="h-3 w-3 mr-1" />
                                    Editado por {item.editado_por}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center space-x-4 text-sm text-gray-600">
                                <span className="flex items-center">
                                  <Calendar className="h-4 w-4 mr-1" />
                                  Lançamento: {formatDate(item.data_lancamento)}
                                </span>
                                <span>CPF: {item.colaborador_cpf}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="text-2xl font-bold text-green-600">
                              R$ {item.remuneracao_total.toFixed(2)}
                            </div>
                            <div className="text-xs text-gray-500">
                              Aprovado em {formatDateTime(item.data_aprovacao)}
                            </div>
                          </div>
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-xs text-gray-600 font-medium">Aprovado por</p>
                            <p className="text-sm font-semibold text-gray-900">{item.aprovado_por}</p>
                          </div>
                          
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-xs text-gray-600 font-medium">Status</p>
                            <p className="text-sm font-semibold text-gray-900">
                              {item.editado ? 'Editado e Aprovado' : 'Aprovado Original'}
                            </p>
                          </div>
                          
                          {dadosFinais && (
                            <>
                              <div className="bg-blue-50 p-3 rounded-lg">
                                <p className="text-xs text-blue-600 font-medium">Função</p>
                                <p className="text-sm font-semibold text-blue-900">{dadosFinais.funcao}</p>
                              </div>
                              
                              <div className="bg-blue-50 p-3 rounded-lg">
                                <p className="text-xs text-blue-600 font-medium">Turno</p>
                                <p className="text-sm font-semibold text-blue-900">{dadosFinais.turno}</p>
                              </div>
                            </>
                          )}
                        </div>

                        {/* Observações */}
                        {item.observacoes && (
                          <div className="bg-yellow-50 p-3 rounded-lg">
                            <p className="text-xs text-yellow-600 font-medium mb-1">Observações</p>
                            <p className="text-sm text-yellow-900">{item.observacoes}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
