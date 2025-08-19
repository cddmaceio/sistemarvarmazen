"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = HistoricoAprovacoes;
const react_1 = require("react");
const lucide_react_1 = require("lucide-react");
const react_router_1 = require("react-router");
const Card_1 = require("@/react-app/components/Card");
const Button_1 = require("@/react-app/components/Button");
const Input_1 = require("@/react-app/components/Input");
const Select_1 = require("@/react-app/components/Select");
const AuthGuard_1 = __importDefault(require("@/react-app/components/AuthGuard"));
const UserMenu_1 = __importDefault(require("@/react-app/components/UserMenu"));
const useAuth_1 = require("@/react-app/hooks/useAuth");
function HistoricoAprovacoes() {
    const { isAdmin } = (0, useAuth_1.useAuth)();
    const [historico, setHistorico] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [filtros, setFiltros] = (0, react_1.useState)({
        colaborador: '',
        admin: '',
        editado: '',
    });
    (0, react_1.useEffect)(() => {
        if (isAdmin) {
            fetchHistorico();
        }
    }, [isAdmin]);
    const fetchHistorico = async () => {
        try {
            setLoading(true);
            const queryParams = new URLSearchParams();
            if (filtros.colaborador)
                queryParams.append('colaborador', filtros.colaborador);
            if (filtros.admin)
                queryParams.append('admin', filtros.admin);
            if (filtros.editado)
                queryParams.append('editado', filtros.editado);
            const response = await fetch(`/api/historico-aprovacoes?${queryParams.toString()}`);
            if (!response.ok)
                throw new Error('Falha ao carregar histórico');
            const data = await response.json();
            setHistorico(data);
        }
        catch (error) {
            console.error('Erro ao carregar histórico:', error);
        }
        finally {
            setLoading(false);
        }
    };
    const handleFiltroChange = (campo, valor) => {
        setFiltros(prev => ({ ...prev, [campo]: valor }));
    };
    const aplicarFiltros = () => {
        fetchHistorico();
    };
    const limparFiltros = () => {
        setFiltros({ colaborador: '', admin: '', editado: '' });
        setTimeout(fetchHistorico, 100);
    };
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('pt-BR');
    };
    const formatDateTime = (dateString) => {
        return new Date(dateString).toLocaleString('pt-BR');
    };
    const parseJsonSafely = (jsonString) => {
        try {
            return JSON.parse(jsonString);
        }
        catch {
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
              O histórico de aprovações só pode ser visualizado por administradores do sistema.
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
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
        {/* Header */}
        <header className="border-b bg-white/70 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-600 to-cyan-600 flex items-center justify-center">
                  <lucide_react_1.History className="h-5 w-5 text-white"/>
                </div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-cyan-600 bg-clip-text text-transparent">
                  Histórico de Aprovações
                </h1>
              </div>
              <div className="flex items-center space-x-4">
                <react_router_1.Link to="/admin/validacao">
                  <Button_1.Button variant="outline" size="sm">
                    <lucide_react_1.CheckCircle className="h-4 w-4 mr-2"/>
                    Validação
                  </Button_1.Button>
                </react_router_1.Link>
                <UserMenu_1.default />
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto">
            {/* Stats Header */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card_1.Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                <Card_1.CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-600">Total Aprovado</p>
                      <p className="text-2xl font-bold text-green-900">{historico.length}</p>
                    </div>
                    <lucide_react_1.CheckCircle className="h-8 w-8 text-green-600"/>
                  </div>
                </Card_1.CardContent>
              </Card_1.Card>
              
              <Card_1.Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                <Card_1.CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-600">Editados</p>
                      <p className="text-2xl font-bold text-blue-900">
                        {historico.filter(h => h.editado).length}
                      </p>
                    </div>
                    <lucide_react_1.Tag className="h-8 w-8 text-blue-600"/>
                  </div>
                </Card_1.CardContent>
              </Card_1.Card>
              
              <Card_1.Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
                <Card_1.CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-600">Colaboradores</p>
                      <p className="text-2xl font-bold text-purple-900">
                        {new Set(historico.map(h => h.colaborador_cpf)).size}
                      </p>
                    </div>
                    <lucide_react_1.User className="h-8 w-8 text-purple-600"/>
                  </div>
                </Card_1.CardContent>
              </Card_1.Card>
              
              <Card_1.Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
                <Card_1.CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-yellow-600">Valor Total</p>
                      <p className="text-2xl font-bold text-yellow-900">
                        R$ {historico.reduce((sum, h) => sum + h.remuneracao_total, 0).toFixed(2)}
                      </p>
                    </div>
                    <lucide_react_1.TrendingUp className="h-8 w-8 text-yellow-600"/>
                  </div>
                </Card_1.CardContent>
              </Card_1.Card>
            </div>

            {/* Filters */}
            <Card_1.Card className="mb-6">
              <Card_1.CardHeader>
                <Card_1.CardTitle className="flex items-center space-x-2 text-lg">
                  <lucide_react_1.Filter className="h-5 w-5"/>
                  <span>Filtros</span>
                </Card_1.CardTitle>
              </Card_1.CardHeader>
              <Card_1.CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Colaborador
                    </label>
                    <Input_1.Input placeholder="Nome do colaborador" value={filtros.colaborador} onChange={(e) => handleFiltroChange('colaborador', e.target.value)}/>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Aprovado por
                    </label>
                    <Input_1.Input placeholder="Nome do admin" value={filtros.admin} onChange={(e) => handleFiltroChange('admin', e.target.value)}/>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status de Edição
                    </label>
                    <Select_1.Select value={filtros.editado} onChange={(e) => handleFiltroChange('editado', e.target.value)}>
                      <option value="">Todos</option>
                      <option value="true">Editados</option>
                      <option value="false">Originais</option>
                    </Select_1.Select>
                  </div>
                  
                  <div className="flex items-end space-x-2">
                    <Button_1.Button onClick={aplicarFiltros} className="flex-1">
                      <lucide_react_1.Search className="h-4 w-4 mr-2"/>
                      Filtrar
                    </Button_1.Button>
                    <Button_1.Button variant="outline" onClick={limparFiltros}>
                      Limpar
                    </Button_1.Button>
                  </div>
                </div>
              </Card_1.CardContent>
            </Card_1.Card>

            {/* Export Button */}
            <div className="flex justify-end mb-6">
              <Button_1.Button onClick={exportarCSV} variant="outline">
                <lucide_react_1.Download className="h-4 w-4 mr-2"/>
                Exportar CSV
              </Button_1.Button>
            </div>

            {/* History List */}
            {loading ? (<div className="text-center py-8">
                <p className="text-gray-600">Carregando histórico...</p>
              </div>) : historico.length === 0 ? (<Card_1.Card>
                <Card_1.CardContent className="p-8 text-center">
                  <lucide_react_1.History className="h-12 w-12 text-gray-400 mx-auto mb-4"/>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Nenhum registro encontrado
                  </h3>
                  <p className="text-gray-600">
                    Não há lançamentos aprovados com os filtros aplicados.
                  </p>
                </Card_1.CardContent>
              </Card_1.Card>) : (<div className="space-y-4">
                {historico.map((item) => {
                const dadosFinais = parseJsonSafely(item.dados_finais);
                return (<Card_1.Card key={item.id} className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                      <Card_1.CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-4">
                            <div className="flex-shrink-0">
                              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center">
                                <lucide_react_1.CheckCircle className="h-6 w-6 text-green-600"/>
                              </div>
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <h3 className="text-lg font-semibold text-gray-900">
                                  {item.colaborador_nome}
                                </h3>
                                {item.editado && (<span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    <lucide_react_1.Tag className="h-3 w-3 mr-1"/>
                                    Editado por {item.editado_por}
                                  </span>)}
                              </div>
                              <div className="flex items-center space-x-4 text-sm text-gray-600">
                                <span className="flex items-center">
                                  <lucide_react_1.Calendar className="h-4 w-4 mr-1"/>
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
                          
                          {dadosFinais && (<>
                              <div className="bg-blue-50 p-3 rounded-lg">
                                <p className="text-xs text-blue-600 font-medium">Função</p>
                                <p className="text-sm font-semibold text-blue-900">{dadosFinais.funcao}</p>
                              </div>
                              
                              <div className="bg-blue-50 p-3 rounded-lg">
                                <p className="text-xs text-blue-600 font-medium">Turno</p>
                                <p className="text-sm font-semibold text-blue-900">{dadosFinais.turno}</p>
                              </div>
                            </>)}
                        </div>

                        {/* Observações */}
                        {item.observacoes && (<div className="bg-yellow-50 p-3 rounded-lg">
                            <p className="text-xs text-yellow-600 font-medium mb-1">Observações</p>
                            <p className="text-sm text-yellow-900">{item.observacoes}</p>
                          </div>)}
                      </Card_1.CardContent>
                    </Card_1.Card>);
            })}
              </div>)}
          </div>
        </main>
      </div>
    </AuthGuard_1.default>);
}
