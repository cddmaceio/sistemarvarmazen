"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Admin;
const react_1 = require("react");
const lucide_react_1 = require("lucide-react");
const react_router_1 = require("react-router");
const Card_1 = require("@/react-app/components/Card");
const Button_1 = require("@/react-app/components/Button");
const Table_1 = require("@/react-app/components/Table");
const Dialog_1 = require("@/react-app/components/Dialog");
const Input_1 = require("@/react-app/components/Input");
const Select_1 = require("@/react-app/components/Select");
const AuthGuard_1 = __importDefault(require("@/react-app/components/AuthGuard"));
const UserMenu_1 = __importDefault(require("@/react-app/components/UserMenu"));
const UserManagement_1 = __importDefault(require("@/react-app/pages/UserManagement"));
const useAuth_1 = require("@/react-app/hooks/useAuth");
const useApi_1 = require("@/react-app/hooks/useApi");
function Admin() {
    const { user, isAdmin } = (0, useAuth_1.useAuth)();
    const [activeTab, setActiveTab] = (0, react_1.useState)('activities');
    const { activities, loading: activitiesLoading, createActivity, updateActivity, deleteActivity } = (0, useApi_1.useActivities)();
    const { kpis, loading: kpisLoading, createKPI, updateKPI, deleteKPI } = (0, useApi_1.useKPIs)();
    // User management state
    const [users, setUsers] = (0, react_1.useState)([]);
    const [usersLoading, setUsersLoading] = (0, react_1.useState)(false);
    // Load users when tab is selected
    (0, react_1.useEffect)(() => {
        if (activeTab === 'users') {
            loadUsers();
        }
    }, [activeTab]);
    const loadUsers = async () => {
        try {
            setUsersLoading(true);
            const response = await fetch('/api/usuarios');
            if (response.ok) {
                const data = await response.json();
                setUsers(data);
            }
        }
        catch (error) {
            console.error('Error loading users:', error);
        }
        finally {
            setUsersLoading(false);
        }
    };
    const createUser = async (userData) => {
        const response = await fetch('/api/usuarios', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
        if (response.ok) {
            const newUser = await response.json();
            setUsers(prev => [newUser, ...prev]);
        }
        else {
            throw new Error('Failed to create user');
        }
    };
    const updateUser = async (id, userData) => {
        const response = await fetch(`/api/usuarios/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
        if (response.ok) {
            const updatedUser = await response.json();
            setUsers(prev => prev.map(user => user.id === id ? updatedUser : user));
        }
        else {
            throw new Error('Failed to update user');
        }
    };
    const deleteUser = async (id) => {
        const response = await fetch(`/api/usuarios/${id}`, {
            method: 'DELETE'
        });
        if (response.ok) {
            setUsers(prev => prev.filter(user => user.id !== id));
        }
        else {
            throw new Error('Failed to delete user');
        }
    };
    // Activity modal state
    const [activityDialog, setActivityDialog] = (0, react_1.useState)(false);
    const [editingActivity, setEditingActivity] = (0, react_1.useState)(null);
    const [activityForm, setActivityForm] = (0, react_1.useState)({
        nome_atividade: '',
        nivel_atividade: '',
        valor_atividade: 0,
        produtividade_minima: 0,
        unidade_medida: '',
    });
    // KPI modal state
    const [kpiDialog, setKpiDialog] = (0, react_1.useState)(false);
    const [editingKPI, setEditingKPI] = (0, react_1.useState)(null);
    const [kpiForm, setKpiForm] = (0, react_1.useState)({
        nome_kpi: '',
        descricao: '',
        valor_meta_kpi: 0,
        peso_kpi: 0,
        turno_kpi: 'Geral',
        funcao_kpi: '',
        status_ativo: true,
    });
    // Activity handlers
    const handleActivitySubmit = async (e) => {
        e.preventDefault();
        if (editingActivity) {
            await updateActivity(editingActivity.id, activityForm);
        }
        else {
            await createActivity(activityForm);
        }
        setActivityDialog(false);
        resetActivityForm();
    };
    const handleEditActivity = (activity) => {
        setEditingActivity(activity);
        setActivityForm({
            nome_atividade: activity.nome_atividade,
            nivel_atividade: activity.nivel_atividade,
            valor_atividade: activity.valor_atividade,
            produtividade_minima: activity.produtividade_minima || 0,
            unidade_medida: activity.unidade_medida || '',
        });
        setActivityDialog(true);
    };
    const handleDeleteActivity = async (id) => {
        if (confirm('Tem certeza que deseja excluir esta atividade?')) {
            await deleteActivity(id);
        }
    };
    const resetActivityForm = () => {
        setEditingActivity(null);
        setActivityForm({
            nome_atividade: '',
            nivel_atividade: '',
            valor_atividade: 0,
            produtividade_minima: 0,
            unidade_medida: '',
        });
    };
    // KPI handlers
    const handleKPISubmit = async (e) => {
        e.preventDefault();
        if (editingKPI) {
            await updateKPI(editingKPI.id, kpiForm);
        }
        else {
            await createKPI(kpiForm);
        }
        setKpiDialog(false);
        resetKPIForm();
    };
    const handleEditKPI = (kpi) => {
        setEditingKPI(kpi);
        setKpiForm({
            nome_kpi: kpi.nome_kpi,
            descricao: kpi.descricao || '',
            valor_meta_kpi: kpi.valor_meta_kpi,
            peso_kpi: kpi.peso_kpi,
            turno_kpi: kpi.turno_kpi,
            funcao_kpi: kpi.funcao_kpi,
            status_ativo: kpi.status_ativo !== false,
        });
        setKpiDialog(true);
    };
    const handleDeleteKPI = async (id) => {
        if (confirm('Tem certeza que deseja excluir este KPI?')) {
            await deleteKPI(id);
        }
    };
    const resetKPIForm = () => {
        setEditingKPI(null);
        setKpiForm({
            nome_kpi: '',
            descricao: '',
            valor_meta_kpi: 0,
            peso_kpi: 0,
            turno_kpi: 'Geral',
            funcao_kpi: '',
            status_ativo: true,
        });
    };
    // Redirect non-admin users
    if (!isAdmin && user) {
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
              Olá <strong>{user.nome}</strong>, você não tem permissão para acessar o painel administrativo.
            </p>
            <react_router_1.Link to="/">
              <Button_1.Button className="w-full">
                <lucide_react_1.ArrowLeft className="h-4 w-4 mr-2"/>
                Voltar para Calculadora
              </Button_1.Button>
            </react_router_1.Link>
          </Card_1.CardContent>
        </Card_1.Card>
      </div>);
    }
    return (<AuthGuard_1.default requireAdmin>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
        {/* Header */}
        <header className="border-b bg-white/70 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <react_router_1.Link to="/">
                  <Button_1.Button variant="outline" size="sm">
                    <lucide_react_1.ArrowLeft className="h-4 w-4 mr-2"/>
                    Voltar
                  </Button_1.Button>
                </react_router_1.Link>
                <div className="flex items-center space-x-2">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-slate-600 to-blue-600 flex items-center justify-center">
                    <lucide_react_1.Settings className="h-5 w-5 text-white"/>
                  </div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-600 to-blue-600 bg-clip-text text-transparent">
                    Painel Administrativo
                  </h1>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <react_router_1.Link to="/">
                  <Button_1.Button variant="outline" size="sm">
                    <lucide_react_1.Calculator className="h-4 w-4 mr-2"/>
                    Calculadora
                  </Button_1.Button>
                </react_router_1.Link>
                <UserMenu_1.default />
              </div>
            </div>
          </div>
        </header>

        {/* Quick Actions */}
        <div className="container mx-auto px-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
            <react_router_1.Link to="/admin/users">
              <Card_1.Card className="cursor-pointer hover:shadow-lg transition-shadow bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
                <Card_1.CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                      <lucide_react_1.Users className="h-6 w-6 text-blue-600"/>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Gerenciar Usuários</h3>
                      <p className="text-sm text-gray-600">Cadastrar e editar colaboradores</p>
                    </div>
                  </div>
                </Card_1.CardContent>
              </Card_1.Card>
            </react_router_1.Link>

            <react_router_1.Link to="/admin/validacao">
              <Card_1.Card className="cursor-pointer hover:shadow-lg transition-shadow bg-gradient-to-br from-green-50 to-blue-50 border-green-200">
                <Card_1.CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center">
                      <lucide_react_1.CheckCircle className="h-6 w-6 text-green-600"/>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Validar Lançamentos</h3>
                      <p className="text-sm text-gray-600">Aprovar produtividade dos colaboradores</p>
                    </div>
                  </div>
                </Card_1.CardContent>
              </Card_1.Card>
            </react_router_1.Link>

            <react_router_1.Link to="/admin/historico">
              <Card_1.Card className="cursor-pointer hover:shadow-lg transition-shadow bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
                <Card_1.CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 rounded-lg bg-indigo-100 flex items-center justify-center">
                      <lucide_react_1.History className="h-6 w-6 text-indigo-600"/>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Histórico de Aprovações</h3>
                      <p className="text-sm text-gray-600">Ver lançamentos aprovados e editados</p>
                    </div>
                  </div>
                </Card_1.CardContent>
              </Card_1.Card>
            </react_router_1.Link>

            <div onClick={() => setActiveTab('activities')}>
              <Card_1.Card className="cursor-pointer hover:shadow-lg transition-shadow bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
                <Card_1.CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 rounded-lg bg-orange-100 flex items-center justify-center">
                      <lucide_react_1.Settings className="h-6 w-6 text-orange-600"/>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Gerenciar Atividades</h3>
                      <p className="text-sm text-gray-600">Cadastrar atividades e valores</p>
                    </div>
                  </div>
                </Card_1.CardContent>
              </Card_1.Card>
            </div>

            <react_router_1.Link to="/admin/kpis">
              <Card_1.Card className="cursor-pointer hover:shadow-lg transition-shadow bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
                <Card_1.CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center">
                      <lucide_react_1.Calculator className="h-6 w-6 text-purple-600"/>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Gerenciar KPIs</h3>
                      <p className="text-sm text-gray-600">Configurar indicadores de performance</p>
                    </div>
                  </div>
                </Card_1.CardContent>
              </Card_1.Card>
            </react_router_1.Link>

            <react_router_1.Link to="/admin/exportacao">
              <Card_1.Card className="cursor-pointer hover:shadow-lg transition-shadow bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200">
                <Card_1.CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 rounded-lg bg-emerald-100 flex items-center justify-center">
                      <lucide_react_1.Download className="h-6 w-6 text-emerald-600"/>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Exportação de Dados</h3>
                      <p className="text-sm text-gray-600">Gerar relatórios em CSV, Excel e PDF</p>
                    </div>
                  </div>
                </Card_1.CardContent>
              </Card_1.Card>
            </react_router_1.Link>
          </div>

          {/* Navigation Tabs */}
          <div className="flex space-x-1 bg-white/60 backdrop-blur-sm rounded-lg p-1 w-fit">
            <Button_1.Button variant={activeTab === 'activities' ? 'default' : 'ghost'} size="sm" onClick={() => setActiveTab('activities')} className="flex items-center space-x-2">
              <lucide_react_1.Settings className="h-4 w-4"/>
              <span>Atividades</span>
            </Button_1.Button>
            <Button_1.Button variant={activeTab === 'kpis' ? 'default' : 'ghost'} size="sm" onClick={() => setActiveTab('kpis')} className="flex items-center space-x-2">
              <lucide_react_1.Calculator className="h-4 w-4"/>
              <span>KPIs</span>
            </Button_1.Button>
            <Button_1.Button variant={activeTab === 'users' ? 'default' : 'ghost'} size="sm" onClick={() => setActiveTab('users')} className="flex items-center space-x-2">
              <lucide_react_1.Users className="h-4 w-4"/>
              <span>Usuários</span>
            </Button_1.Button>
          </div>
        </div>

        {/* Main Content */}
        <main className="container mx-auto px-4 pb-8">
          {activeTab === 'users' ? (<UserManagement_1.default users={users} onAddUser={createUser} onUpdateUser={updateUser} onDeleteUser={deleteUser} loading={usersLoading}/>) : (<div className="space-y-8">
              {/* Activities Section */}
              {activeTab === 'activities' && (<Card_1.Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                  <Card_1.CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <Card_1.CardTitle className="text-xl">Gerenciamento de Atividades</Card_1.CardTitle>
                        <Card_1.CardDescription>
                          Cadastre e gerencie as atividades que geram valor direto
                        </Card_1.CardDescription>
                      </div>
                      <Button_1.Button onClick={() => {
                    resetActivityForm();
                    setActivityDialog(true);
                }} className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
                        <lucide_react_1.Plus className="h-4 w-4 mr-2"/>
                        Nova Atividade
                      </Button_1.Button>
                    </div>
                  </Card_1.CardHeader>
                  <Card_1.CardContent>
                    {activitiesLoading ? (<div className="text-center py-8">Carregando atividades...</div>) : (<Table_1.Table>
                        <Table_1.TableHeader>
                          <Table_1.TableRow>
                            <Table_1.TableHead>Nome da Atividade</Table_1.TableHead>
                            <Table_1.TableHead>Nível</Table_1.TableHead>
                            <Table_1.TableHead>Valor (R$)</Table_1.TableHead>
                            <Table_1.TableHead>Produtividade Mín.</Table_1.TableHead>
                            <Table_1.TableHead>Unidade</Table_1.TableHead>
                            <Table_1.TableHead className="text-right">Ações</Table_1.TableHead>
                          </Table_1.TableRow>
                        </Table_1.TableHeader>
                        <Table_1.TableBody>
                          {activities.length === 0 ? (<Table_1.TableRow>
                              <Table_1.TableCell colSpan={6} className="text-center text-gray-500 py-8">
                                Nenhuma atividade cadastrada
                              </Table_1.TableCell>
                            </Table_1.TableRow>) : (activities.map((activity) => (<Table_1.TableRow key={activity.id}>
                                <Table_1.TableCell className="font-medium">{activity.nome_atividade}</Table_1.TableCell>
                                <Table_1.TableCell>{activity.nivel_atividade}</Table_1.TableCell>
                                <Table_1.TableCell>R$ {activity.valor_atividade.toFixed(2)}</Table_1.TableCell>
                                <Table_1.TableCell>{activity.produtividade_minima || 0}</Table_1.TableCell>
                                <Table_1.TableCell>{activity.unidade_medida || 'unidades'}</Table_1.TableCell>
                                <Table_1.TableCell className="text-right">
                                  <div className="flex justify-end space-x-2">
                                    <Button_1.Button variant="outline" size="sm" onClick={() => handleEditActivity(activity)}>
                                      <lucide_react_1.Edit className="h-4 w-4"/>
                                    </Button_1.Button>
                                    <Button_1.Button variant="destructive" size="sm" onClick={() => handleDeleteActivity(activity.id)}>
                                      <lucide_react_1.Trash2 className="h-4 w-4"/>
                                    </Button_1.Button>
                                  </div>
                                </Table_1.TableCell>
                              </Table_1.TableRow>)))}
                        </Table_1.TableBody>
                      </Table_1.Table>)}
                  </Card_1.CardContent>
                </Card_1.Card>)}

              {/* KPIs Section */}
              {activeTab === 'kpis' && (<Card_1.Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                  <Card_1.CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <Card_1.CardTitle className="text-xl">Gerenciamento de KPIs</Card_1.CardTitle>
                        <Card_1.CardDescription>
                          Cadastre e gerencie os indicadores de performance
                        </Card_1.CardDescription>
                      </div>
                      <Button_1.Button onClick={() => {
                    resetKPIForm();
                    setKpiDialog(true);
                }} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                        <lucide_react_1.Plus className="h-4 w-4 mr-2"/>
                        Novo KPI
                      </Button_1.Button>
                    </div>
                  </Card_1.CardHeader>
                  <Card_1.CardContent>
                    {kpisLoading ? (<div className="text-center py-8">Carregando KPIs...</div>) : (<Table_1.Table>
                        <Table_1.TableHeader>
                          <Table_1.TableRow>
                            <Table_1.TableHead>Nome do KPI</Table_1.TableHead>
                            <Table_1.TableHead>Meta</Table_1.TableHead>
                            <Table_1.TableHead>Peso/Bônus (R$)</Table_1.TableHead>
                            <Table_1.TableHead>Turno</Table_1.TableHead>
                            <Table_1.TableHead>Função</Table_1.TableHead>
                            <Table_1.TableHead className="text-right">Ações</Table_1.TableHead>
                          </Table_1.TableRow>
                        </Table_1.TableHeader>
                        <Table_1.TableBody>
                          {kpis.length === 0 ? (<Table_1.TableRow>
                              <Table_1.TableCell colSpan={6} className="text-center text-gray-500 py-8">
                                Nenhum KPI cadastrado
                              </Table_1.TableCell>
                            </Table_1.TableRow>) : (kpis.map((kpi) => (<Table_1.TableRow key={kpi.id}>
                                <Table_1.TableCell className="font-medium">{kpi.nome_kpi}</Table_1.TableCell>
                                <Table_1.TableCell>{kpi.valor_meta_kpi}</Table_1.TableCell>
                                <Table_1.TableCell>R$ {kpi.peso_kpi.toFixed(2)}</Table_1.TableCell>
                                <Table_1.TableCell>{kpi.turno_kpi}</Table_1.TableCell>
                                <Table_1.TableCell>{kpi.funcao_kpi}</Table_1.TableCell>
                                <Table_1.TableCell className="text-right">
                                  <div className="flex justify-end space-x-2">
                                    <Button_1.Button variant="outline" size="sm" onClick={() => handleEditKPI(kpi)}>
                                      <lucide_react_1.Edit className="h-4 w-4"/>
                                    </Button_1.Button>
                                    <Button_1.Button variant="destructive" size="sm" onClick={() => handleDeleteKPI(kpi.id)}>
                                      <lucide_react_1.Trash2 className="h-4 w-4"/>
                                    </Button_1.Button>
                                  </div>
                                </Table_1.TableCell>
                              </Table_1.TableRow>)))}
                        </Table_1.TableBody>
                      </Table_1.Table>)}
                  </Card_1.CardContent>
                </Card_1.Card>)}
            </div>)}
        </main>

        {/* Activity Dialog */}
        <Dialog_1.Dialog open={activityDialog} onOpenChange={setActivityDialog}>
          <Dialog_1.DialogContent>
            <Dialog_1.DialogHeader>
              <Dialog_1.DialogTitle>
                {editingActivity ? 'Editar Atividade' : 'Nova Atividade'}
              </Dialog_1.DialogTitle>
            </Dialog_1.DialogHeader>
            <form onSubmit={handleActivitySubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Nome da Atividade</label>
                <Input_1.Input value={activityForm.nome_atividade} onChange={(e) => setActivityForm(prev => ({ ...prev, nome_atividade: e.target.value }))} placeholder="Ex: Separação de Pedidos" required/>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Nível da Atividade</label>
                <Input_1.Input value={activityForm.nivel_atividade} onChange={(e) => setActivityForm(prev => ({ ...prev, nivel_atividade: e.target.value }))} placeholder="Ex: N1, N2, N3" required/>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Valor (R$)</label>
                <Input_1.Input type="number" step="0.01" min="0" value={activityForm.valor_atividade} onChange={(e) => setActivityForm(prev => ({ ...prev, valor_atividade: parseFloat(e.target.value) || 0 }))} placeholder="Ex: 0.25" required/>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Produtividade Mínima</label>
                  <Input_1.Input type="number" step="0.1" min="0" value={activityForm.produtividade_minima} onChange={(e) => setActivityForm(prev => ({ ...prev, produtividade_minima: parseFloat(e.target.value) || 0 }))} placeholder="Ex: 14.2" required/>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Unidade de Medida</label>
                  <Select_1.Select value={activityForm.unidade_medida} onChange={(e) => setActivityForm(prev => ({ ...prev, unidade_medida: e.target.value }))}>
                    <option value="">Selecione</option>
                    <option value="cxs/h">cxs/h (Caixas por hora)</option>
                    <option value="plt/h">plt/h (Pallets por hora)</option>
                    <option value="unidades/h">unidades/h</option>
                  </Select_1.Select>
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button_1.Button type="button" variant="outline" onClick={() => setActivityDialog(false)}>
                  Cancelar
                </Button_1.Button>
                <Button_1.Button type="submit">
                  {editingActivity ? 'Atualizar' : 'Criar'}
                </Button_1.Button>
              </div>
            </form>
          </Dialog_1.DialogContent>
        </Dialog_1.Dialog>

        {/* KPI Dialog */}
        <Dialog_1.Dialog open={kpiDialog} onOpenChange={setKpiDialog}>
          <Dialog_1.DialogContent>
            <Dialog_1.DialogHeader>
              <Dialog_1.DialogTitle>
                {editingKPI ? 'Editar KPI' : 'Novo KPI'}
              </Dialog_1.DialogTitle>
            </Dialog_1.DialogHeader>
            <form onSubmit={handleKPISubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Nome do KPI</label>
                <Input_1.Input value={kpiForm.nome_kpi} onChange={(e) => setKpiForm(prev => ({ ...prev, nome_kpi: e.target.value }))} placeholder="Ex: Produtividade na Separação" required/>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Descrição</label>
                <textarea value={kpiForm.descricao} onChange={(e) => setKpiForm(prev => ({ ...prev, descricao: e.target.value }))} placeholder="Descreva o objetivo deste KPI..." className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none" rows={2}/>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Meta</label>
                  <Input_1.Input type="number" step="0.01" min="0" value={kpiForm.valor_meta_kpi} onChange={(e) => setKpiForm(prev => ({ ...prev, valor_meta_kpi: parseFloat(e.target.value) || 0 }))} placeholder="Ex: 99.5" required/>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Peso/Bônus (R$)</label>
                  <Input_1.Input type="number" step="0.01" min="0" value={kpiForm.peso_kpi} onChange={(e) => setKpiForm(prev => ({ ...prev, peso_kpi: parseFloat(e.target.value) || 0 }))} placeholder="Ex: 10.00" required/>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Turno</label>
                <Select_1.Select value={kpiForm.turno_kpi} onChange={(e) => setKpiForm(prev => ({ ...prev, turno_kpi: e.target.value }))}>
                  <option value="Geral">Geral</option>
                  <option value="Manhã">Manhã</option>
                  <option value="Tarde">Tarde</option>
                  <option value="Noite">Noite</option>
                </Select_1.Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Função</label>
                <Input_1.Input value={kpiForm.funcao_kpi} onChange={(e) => setKpiForm(prev => ({ ...prev, funcao_kpi: e.target.value }))} placeholder="Ex: Separador, Conferente" required/>
              </div>
              <div className="flex items-center space-x-2">
                <input type="checkbox" id="status_ativo_form" checked={kpiForm.status_ativo} onChange={(e) => setKpiForm(prev => ({ ...prev, status_ativo: e.target.checked }))} className="rounded border-gray-300"/>
                <label htmlFor="status_ativo_form" className="text-sm font-medium text-gray-700">
                  KPI ativo
                </label>
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button_1.Button type="button" variant="outline" onClick={() => setKpiDialog(false)}>
                  Cancelar
                </Button_1.Button>
                <Button_1.Button type="submit">
                  {editingKPI ? 'Atualizar' : 'Criar'}
                </Button_1.Button>
              </div>
            </form>
          </Dialog_1.DialogContent>
        </Dialog_1.Dialog>
      </div>
    </AuthGuard_1.default>);
}
