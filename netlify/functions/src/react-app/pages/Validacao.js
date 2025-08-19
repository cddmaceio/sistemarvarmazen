"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Validacao;
const react_1 = require("react");
const lucide_react_1 = require("lucide-react");
const react_router_1 = require("react-router");
const Card_1 = require("@/react-app/components/Card");
const Button_1 = require("@/react-app/components/Button");
const Input_1 = require("@/react-app/components/Input");
const AuthGuard_1 = __importDefault(require("@/react-app/components/AuthGuard"));
const UserMenu_1 = __importDefault(require("@/react-app/components/UserMenu"));
const EditLancamentoModal_1 = __importDefault(require("@/react-app/components/EditLancamentoModal"));
const useAuth_1 = require("@/react-app/hooks/useAuth");
function Validacao() {
    const { isAdmin } = (0, useAuth_1.useAuth)();
    const [lancamentos, setLancamentos] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [processando, setProcessando] = (0, react_1.useState)(null);
    const [selectedLancamento, setSelectedLancamento] = (0, react_1.useState)(null);
    const [observacoes, setObservacoes] = (0, react_1.useState)('');
    const [showDetails, setShowDetails] = (0, react_1.useState)(null);
    const [editModalOpen, setEditModalOpen] = (0, react_1.useState)(false);
    const [editingLancamento, setEditingLancamento] = (0, react_1.useState)(null);
    (0, react_1.useEffect)(() => {
        if (isAdmin) {
            fetchLancamentosPendentes();
        }
    }, [isAdmin]);
    const fetchLancamentosPendentes = async () => {
        try {
            const response = await fetch('/api/lancamentos/pendentes');
            if (!response.ok)
                throw new Error('Falha ao carregar lançamentos');
            const data = await response.json();
            setLancamentos(data);
        }
        catch (error) {
            console.error('Erro ao carregar lançamentos:', error);
        }
        finally {
            setLoading(false);
        }
    };
    const handleValidacao = async (lancamentoId, acao) => {
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
        }
        catch (error) {
            console.error('Erro na validação:', error);
            alert(`Erro ao processar validação: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        }
        finally {
            setProcessando(null);
        }
    };
    const handleEditLancamento = (lancamento) => {
        setEditingLancamento(lancamento);
        setEditModalOpen(true);
    };
    const handleSaveEdit = async (editedData, _result) => {
        if (!editingLancamento)
            return;
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
        }
        catch (error) {
            console.error('Erro na edição:', error);
            alert(`Erro ao editar lançamento: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        }
        finally {
            setProcessando(null);
        }
    };
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('pt-BR');
    };
    const parseJsonSafely = (jsonString) => {
        if (!jsonString)
            return null;
        try {
            return JSON.parse(jsonString);
        }
        catch {
            return null;
        }
    };
    const getLancamentoDetails = (lancamento) => {
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
        return (<div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center">
        <Card_1.Card className="max-w-md">
          <Card_1.CardHeader>
            <Card_1.CardTitle className="text-red-700">Acesso Restrito</Card_1.CardTitle>
            <Card_1.CardDescription>
              Esta área é exclusiva para administradores.
            </Card_1.CardDescription>
          </Card_1.CardHeader>
          <Card_1.CardContent>
            <p className="text-gray-600 mb-4">
              A validação de lançamentos só pode ser feita por administradores do sistema.
            </p>
            <react_router_1.Link to="/">
              <Button_1.Button className="w-full">
                <lucide_react_1.Calendar className="h-4 w-4 mr-2"/>
                Voltar para Calculadora
              </Button_1.Button>
            </react_router_1.Link>
          </Card_1.CardContent>
        </Card_1.Card>
      </div>);
    }
    return (<AuthGuard_1.default>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
        {/* Header */}
        <header className="border-b bg-white/70 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                  <lucide_react_1.CheckCircle className="h-5 w-5 text-white"/>
                </div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  Validação de Lançamentos
                </h1>
              </div>
              <UserMenu_1.default />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            {/* Stats Header */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card_1.Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
                <Card_1.CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-yellow-600">Lançamentos Pendentes</p>
                      <p className="text-2xl font-bold text-yellow-900">{lancamentos.length}</p>
                    </div>
                    <lucide_react_1.Clock className="h-8 w-8 text-yellow-600"/>
                  </div>
                </Card_1.CardContent>
              </Card_1.Card>
              
              <Card_1.Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
                <Card_1.CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-600">Total de Colaboradores</p>
                      <p className="text-2xl font-bold text-blue-900">
                        {new Set(lancamentos.map(l => l.user_cpf)).size}
                      </p>
                    </div>
                    <lucide_react_1.User className="h-8 w-8 text-blue-600"/>
                  </div>
                </Card_1.CardContent>
              </Card_1.Card>
              
              <Card_1.Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
                <Card_1.CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-600">Valor Total Pendente</p>
                      <p className="text-2xl font-bold text-green-900">
                        R$ {lancamentos.reduce((sum, l) => sum + l.remuneracao_total, 0).toFixed(2)}
                      </p>
                    </div>
                    <lucide_react_1.TrendingUp className="h-8 w-8 text-green-600"/>
                  </div>
                </Card_1.CardContent>
              </Card_1.Card>
            </div>

            {/* Lançamentos List */}
            {loading ? (<div className="text-center py-8">
                <p className="text-gray-600">Carregando lançamentos...</p>
              </div>) : lancamentos.length === 0 ? (<Card_1.Card>
                <Card_1.CardContent className="p-8 text-center">
                  <lucide_react_1.CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4"/>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Nenhum lançamento pendente
                  </h3>
                  <p className="text-gray-600">
                    Todos os lançamentos foram processados.
                  </p>
                </Card_1.CardContent>
              </Card_1.Card>) : (<div className="space-y-6">
                {lancamentos.map((lancamento) => {
                const details = getLancamentoDetails(lancamento);
                const isExpanded = showDetails === String(lancamento.id);
                return (<Card_1.Card key={lancamento.id} className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                      <Card_1.CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="flex-shrink-0">
                              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
                                <lucide_react_1.User className="h-6 w-6 text-purple-600"/>
                              </div>
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <Card_1.CardTitle className="text-lg text-gray-900">
                                  {lancamento.user_nome}
                                </Card_1.CardTitle>
                                {lancamento.status_edicao === 'editado_admin' && (<span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    <lucide_react_1.Tag className="h-3 w-3 mr-1"/>
                                    Editado por {lancamento.editado_por_admin}
                                  </span>)}
                              </div>
                              <Card_1.CardDescription className="flex items-center space-x-4 text-sm">
                                <span className="flex items-center">
                                  <lucide_react_1.Calendar className="h-4 w-4 mr-1"/>
                                  {formatDate(lancamento.data_lancamento)}
                                </span>
                                <span>CPF: {lancamento.user_cpf}</span>
                                <span>Função: {lancamento.funcao}</span>
                                <span>Turno: {lancamento.turno}</span>
                                {lancamento.data_edicao && (<span className="text-blue-600">
                                    Editado em: {formatDate(lancamento.data_edicao)}
                                  </span>)}
                              </Card_1.CardDescription>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-green-600">
                              R$ {lancamento.remuneracao_total.toFixed(2)}
                            </div>
                            <div className="text-xs text-gray-500">
                              Lançado em {formatDate(lancamento.created_at)}
                            </div>
                          </div>
                        </div>
                      </Card_1.CardHeader>
                      
                      <Card_1.CardContent className="pt-0">
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
                          {lancamento.tarefas_validas && (<div className="bg-purple-50 p-3 rounded-lg">
                              <p className="text-xs text-purple-600 font-medium">Tarefas Válidas</p>
                              <p className="text-sm font-semibold text-purple-900">
                                {lancamento.tarefas_validas} tarefas
                              </p>
                            </div>)}
                          {details.kpisAtingidos.length > 0 && (<div className="bg-amber-50 p-3 rounded-lg">
                              <p className="text-xs text-amber-600 font-medium">KPIs Atingidos</p>
                              <p className="text-sm font-semibold text-amber-900">
                                {details.kpisAtingidos.length} de {details.kpisAtingidos.length}
                              </p>
                            </div>)}
                        </div>

                        {/* Expand/Collapse Details */}
                        <Button_1.Button variant="outline" size="sm" onClick={() => setShowDetails(isExpanded ? null : String(lancamento.id))} className="mb-4 w-full">
                          <lucide_react_1.FileText className="h-4 w-4 mr-2"/>
                          {isExpanded ? 'Ocultar Detalhes' : 'Ver Detalhes Completos'}
                        </Button_1.Button>

                        {/* Detailed Information */}
                        {isExpanded && (<div className="space-y-4 p-4 bg-gray-50 rounded-lg mb-4">
                            {/* Single Activity */}
                            {lancamento.nome_atividade && (<div>
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
                              </div>)}

                            {/* Multiple Activities */}
                            {details.multipleActivities.length > 0 && (<div>
                                <h4 className="font-medium text-gray-900 mb-2">Múltiplas Atividades</h4>
                                <div className="space-y-2">
                                  {details.multipleActivities.map((activity, index) => (<div key={index} className="bg-white p-3 rounded border text-sm">
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
                                    </div>))}
                                </div>
                              </div>)}

                            {/* Operator Tasks */}
                            {lancamento.nome_operador && (<div>
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
                              </div>)}

                            {/* KPIs Achieved */}
                            {details.kpisAtingidos.length > 0 && (<div>
                                <h4 className="font-medium text-gray-900 mb-2">KPIs Atingidos</h4>
                                <div className="flex flex-wrap gap-2">
                                  {details.kpisAtingidos.map((kpi, index) => (<span key={index} className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                                      ✅ {kpi}
                                    </span>))}
                                </div>
                              </div>)}
                          </div>)}

                        {/* Observações */}
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Observações (opcional)
                          </label>
                          <Input_1.Input value={selectedLancamento?.id === lancamento.id ? observacoes : ''} onChange={(e) => {
                        setSelectedLancamento(lancamento);
                        setObservacoes(e.target.value);
                    }} placeholder="Adicione observações sobre este lançamento..." className="w-full"/>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex space-x-3">
                          <Button_1.Button onClick={() => {
                        setSelectedLancamento(lancamento);
                        handleValidacao(lancamento.id, 'aprovar');
                    }} disabled={processando === String(lancamento.id)} className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                            <lucide_react_1.CheckCircle className="h-4 w-4 mr-2"/>
                            {processando === String(lancamento.id) ? 'Processando...' : 'Aprovar Lançamento'}
                          </Button_1.Button>
                          
                          <Button_1.Button onClick={() => {
                        setSelectedLancamento(lancamento);
                        handleValidacao(lancamento.id, 'reprovar');
                    }} disabled={processando === String(lancamento.id)} variant="destructive" className="flex-1">
                            <lucide_react_1.XCircle className="h-4 w-4 mr-2"/>
                            {processando === String(lancamento.id) ? 'Processando...' : 'Reprovar Lançamento'}
                          </Button_1.Button>
                          
                          <Button_1.Button variant="outline" className="px-6" disabled={processando === String(lancamento.id)} onClick={() => handleEditLancamento(lancamento)}>
                            <lucide_react_1.Edit className="h-4 w-4"/>
                          </Button_1.Button>
                        </div>
                      </Card_1.CardContent>
                    </Card_1.Card>);
            })}
              </div>)}
          </div>
        </main>

        {/* Edit Modal */}
        <EditLancamentoModal_1.default open={editModalOpen} onClose={() => {
            setEditModalOpen(false);
            setEditingLancamento(null);
        }} lancamento={editingLancamento} onSave={handleSaveEdit}/>
      </div>
    </AuthGuard_1.default>);
}
