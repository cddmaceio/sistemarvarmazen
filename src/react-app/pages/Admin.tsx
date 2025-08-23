import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Calculator, ArrowLeft, Users, Database, Activity } from 'lucide-react';
import { Link, useSearchParams } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/react-app/components/Card';
import { Button } from '@/react-app/components/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/react-app/components/Table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/react-app/components/Dialog';
import { Input } from '@/react-app/components/Input';
import { Select } from '@/react-app/components/Select';
import AuthGuard from '@/react-app/components/AuthGuard';
import AdminLayout from '@/react-app/components/AdminLayout';
import UserManagement from '@/react-app/pages/UserManagement';
import { useAuth } from '@/react-app/hooks/useAuth';
import { useActivities, useKPIs } from '@/react-app/hooks/useApi';
import { ActivityType, KPIType, UserType } from '@/shared/types';

export default function Admin() {
  const { user, isAdmin } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const { activities, loading: activitiesLoading, createActivity, updateActivity, deleteActivity } = useActivities();
  const { kpis, loading: kpisLoading, createKPI, updateKPI, deleteKPI } = useKPIs();
  
  // User management state
  const [users, setUsers] = useState<UserType[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);

  // WMS Users state
  const [wmsUsers, setWmsUsers] = useState<any[]>([]);
  const [wmsUsersLoading, setWmsUsersLoading] = useState(false);
  const [wmsDialog, setWmsDialog] = useState(false);
  const [editingWmsUser, setEditingWmsUser] = useState<any | null>(null);
  const [wmsForm, setWmsForm] = useState({
    nome: '',
    cpf: '',
    login_wms: '',
    nome_wms: ''
  });

  // Sync activeTab with URL parameters
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['activities', 'kpis', 'users', 'wms'].includes(tab)) {
      setActiveTab(tab as 'activities' | 'kpis' | 'users' | 'wms');
    } else if (!tab) {
      // Se não há parâmetro tab, mostra o dashboard
      setActiveTab('dashboard');
    }
  }, [searchParams]);

  // Update URL when activeTab changes
  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    if (newTab === 'dashboard') {
      // Para dashboard, remove o parâmetro tab da URL
      setSearchParams({});
    } else {
      setSearchParams({ tab: newTab });
    }
  };

  // Load users when tab is selected
  useEffect(() => {
    if (activeTab === 'users') {
      loadUsers();
    } else if (activeTab === 'wms') {
      loadWmsUsers();
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
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setUsersLoading(false);
    }
  };

  const createUser = async (userData: Omit<UserType, 'id' | 'created_at' | 'updated_at'>) => {
    const response = await fetch('/api/usuarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    if (response.ok) {
      const newUser = await response.json();
      setUsers(prev => [newUser, ...prev]);
    } else {
      throw new Error('Failed to create user');
    }
  };

  const updateUser = async (id: number, userData: Partial<UserType>) => {
    const response = await fetch(`/api/usuarios/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    if (response.ok) {
      const updatedUser = await response.json();
      setUsers(prev => prev.map(user => user.id === id ? updatedUser : user));
    } else {
      throw new Error('Failed to update user');
    }
  };

  const deleteUser = async (id: number) => {
    const response = await fetch(`/api/usuarios/${id}`, {
      method: 'DELETE'
    });
    if (response.ok) {
      setUsers(prev => prev.filter(user => user.id !== id));
    } else {
      throw new Error('Failed to delete user');
    }
  };

  // WMS Users functions
  const loadWmsUsers = async () => {
    try {
      setWmsUsersLoading(true);
      const response = await fetch('/api/wms-users');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setWmsUsers(data.users);
        }
      }
    } catch (error) {
      console.error('Error loading WMS users:', error);
    } finally {
      setWmsUsersLoading(false);
    }
  };

  const createWmsUser = async (userData: any) => {
    const response = await fetch('/api/wms-users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    if (response.ok) {
      const result = await response.json();
      if (result.success) {
        loadWmsUsers(); // Recarregar lista
      }
    } else {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create WMS user');
    }
  };

  const updateWmsUser = async (id: number, userData: any) => {
    const response = await fetch(`/api/wms-users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    if (response.ok) {
      const result = await response.json();
      if (result.success) {
        loadWmsUsers(); // Recarregar lista
      }
    } else {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update WMS user');
    }
  };

  const deleteWmsUser = async (id: number) => {
    const response = await fetch(`/api/wms-users/${id}`, {
      method: 'DELETE'
    });
    if (response.ok) {
      const result = await response.json();
      if (result.success) {
        setWmsUsers(prev => prev.filter(user => user.id !== id));
      }
    } else {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete WMS user');
    }
  };

  const resetWmsForm = () => {
    setWmsForm({
      nome: '',
      cpf: '',
      login_wms: '',
      nome_wms: ''
    });
    setEditingWmsUser(null);
  };

  const handleWmsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingWmsUser) {
        await updateWmsUser(editingWmsUser.id, wmsForm);
      } else {
        await createWmsUser(wmsForm);
      }
      setWmsDialog(false);
      resetWmsForm();
    } catch (error) {
      console.error('Error saving WMS user:', error);
    }
  };

  // Activity modal state
  const [activityDialog, setActivityDialog] = useState(false);
  const [editingActivity, setEditingActivity] = useState<ActivityType | null>(null);
  const [activityForm, setActivityForm] = useState({
    nome_atividade: '',
    nivel_atividade: '',
    valor_atividade: 0,
    produtividade_minima: 0,
    unidade_medida: '',
  });

  // KPI modal state
  const [kpiDialog, setKpiDialog] = useState(false);
  const [editingKPI, setEditingKPI] = useState<KPIType | null>(null);
  const [kpiForm, setKpiForm] = useState({
    nome_kpi: '',
    descricao: '',
    valor_meta_kpi: 0,
    peso_kpi: 0,
    turno_kpi: 'Geral' as 'Manhã' | 'Tarde' | 'Noite' | 'Geral',
    funcao_kpi: '',
    status_ativo: true,
  });

  // Activity handlers
  const handleActivitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingActivity) {
      await updateActivity(editingActivity.id!, activityForm);
    } else {
      await createActivity(activityForm);
    }
    setActivityDialog(false);
    resetActivityForm();
  };

  const handleEditActivity = (activity: ActivityType) => {
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

  const handleDeleteActivity = async (id: number) => {
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
  const handleKPISubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingKPI) {
      await updateKPI(editingKPI.id!, kpiForm);
    } else {
      await createKPI(kpiForm);
    }
    setKpiDialog(false);
    resetKPIForm();
  };

  const handleEditKPI = (kpi: KPIType) => {
    setEditingKPI(kpi);
    setKpiForm({
      nome_kpi: kpi.nome_kpi,
      descricao: (kpi as any).descricao || '',
      valor_meta_kpi: kpi.valor_meta_kpi,
      peso_kpi: kpi.peso_kpi,
      turno_kpi: kpi.turno_kpi,
      funcao_kpi: kpi.funcao_kpi,
      status_ativo: (kpi as any).status_ativo !== false,
    });
    setKpiDialog(true);
  };

  const handleDeleteKPI = async (id: number) => {
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
              Olá <strong>{user.nome}</strong>, você não tem permissão para acessar o painel administrativo.
            </p>
            <Link to="/">
              <Button className="w-full">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar para Calculadora
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <AuthGuard requireAdmin>
      <AdminLayout activeTab={activeTab} onTabChange={handleTabChange}>

        {activeTab === 'dashboard' ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-50 to-blue-100">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-600">Total de Atividades</p>
                      <p className="text-2xl font-bold text-blue-900">{activities.length}</p>
                    </div>
                    <Activity className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="shadow-lg border-0 bg-gradient-to-br from-green-50 to-green-100">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-600">Total de KPIs</p>
                      <p className="text-2xl font-bold text-green-900">{kpis.length}</p>
                    </div>
                    <Calculator className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="shadow-lg border-0 bg-gradient-to-br from-purple-50 to-purple-100">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-600">Total de Usuários</p>
                      <p className="text-2xl font-bold text-purple-900">{users.length}</p>
                    </div>
                    <Users className="h-8 w-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="shadow-lg border-0 bg-gradient-to-br from-orange-50 to-orange-100">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-orange-600">Usuários WMS</p>
                      <p className="text-2xl font-bold text-orange-900">{wmsUsers.length}</p>
                    </div>
                    <Database className="h-8 w-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl">Painel Administrativo</CardTitle>
                <CardDescription>
                  Bem-vindo ao painel de administração do sistema RV Armazém
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-center">Status do Sistema</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                      <span className="text-sm font-medium text-green-800">Sistema Online</span>
                      <span className="text-green-600 font-bold text-lg">✓ Ativo</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <span className="text-sm font-medium text-blue-800">Banco de Dados</span>
                      <span className="text-blue-600 font-bold text-lg">✓ Conectado</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg border border-purple-200">
                      <span className="text-sm font-medium text-purple-800">Autenticação</span>
                      <span className="text-purple-600 font-bold text-lg">✓ Funcionando</span>
                    </div>
                  </div>
                  <div className="text-center mt-6">
                    <p className="text-gray-600 text-sm">
                      Use o menu lateral para navegar entre as diferentes seções do painel administrativo.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : activeTab === 'users' ? (
          <UserManagement
            users={users}
            onAddUser={createUser}
            onUpdateUser={updateUser}
            onDeleteUser={deleteUser}
            loading={usersLoading}
          />
        ) : activeTab === 'wms' ? (
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">Cadastro de Usuários WMS</CardTitle>
                    <CardDescription>
                      Gerencie os usuários do sistema WMS com login e identificação
                    </CardDescription>
                  </div>
                  <Button
                    onClick={() => {
                      resetWmsForm();
                      setWmsDialog(true);
                    }}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Usuário WMS
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {wmsUsersLoading ? (
                  <div className="text-center py-8">Carregando usuários WMS...</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>CPF</TableHead>
                        <TableHead>Login WMS</TableHead>
                        <TableHead>Nome WMS</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {wmsUsers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                            Nenhum usuário WMS cadastrado
                          </TableCell>
                        </TableRow>
                      ) : (
                        wmsUsers.map((wmsUser) => (
                          <TableRow key={wmsUser.id}>
                            <TableCell className="font-medium">{wmsUser.nome}</TableCell>
                            <TableCell>{wmsUser.cpf}</TableCell>
                            <TableCell>{wmsUser.login_wms}</TableCell>
                            <TableCell>{wmsUser.nome_wms}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setEditingWmsUser(wmsUser);
                                    setWmsForm({
                                      nome: wmsUser.nome,
                                      cpf: wmsUser.cpf,
                                      login_wms: wmsUser.login_wms,
                                      nome_wms: wmsUser.nome_wms
                                    });
                                    setWmsDialog(true);
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => deleteWmsUser(wmsUser.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-8">
              {/* Activities Section */}
              {activeTab === 'activities' && (
                <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-xl">Gerenciamento de Atividades</CardTitle>
                        <CardDescription>
                          Cadastre e gerencie as atividades que geram valor direto
                        </CardDescription>
                      </div>
                      <Button
                        onClick={() => {
                          resetActivityForm();
                          setActivityDialog(true);
                        }}
                        className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Nova Atividade
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {activitiesLoading ? (
                      <div className="text-center py-8">Carregando atividades...</div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nome da Atividade</TableHead>
                            <TableHead>Nível</TableHead>
                            <TableHead>Valor (R$)</TableHead>
                            <TableHead>Produtividade Mín.</TableHead>
                            <TableHead>Unidade</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {activities.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                                Nenhuma atividade cadastrada
                              </TableCell>
                            </TableRow>
                          ) : (
                            activities.map((activity) => (
                              <TableRow key={activity.id}>
                                <TableCell className="font-medium">{activity.nome_atividade}</TableCell>
                                <TableCell>{activity.nivel_atividade}</TableCell>
                                <TableCell>R$ {activity.valor_atividade.toFixed(2)}</TableCell>
                                <TableCell>{activity.produtividade_minima || 0}</TableCell>
                                <TableCell>{activity.unidade_medida || 'unidades'}</TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end space-x-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleEditActivity(activity)}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() => handleDeleteActivity(activity.id!)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* KPIs Section */}
              {activeTab === 'kpis' && (
                <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-xl">Gerenciamento de KPIs</CardTitle>
                        <CardDescription>
                          Cadastre e gerencie os indicadores de performance
                        </CardDescription>
                      </div>
                      <Button
                        onClick={() => {
                          resetKPIForm();
                          setKpiDialog(true);
                        }}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Novo KPI
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {kpisLoading ? (
                      <div className="text-center py-8">Carregando KPIs...</div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nome do KPI</TableHead>
                            <TableHead>Meta</TableHead>
                            <TableHead>Peso/Bônus (R$)</TableHead>
                            <TableHead>Turno</TableHead>
                            <TableHead>Função</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {kpis.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                                Nenhum KPI cadastrado
                              </TableCell>
                            </TableRow>
                          ) : (
                            kpis.map((kpi) => (
                              <TableRow key={kpi.id}>
                                <TableCell className="font-medium">{kpi.nome_kpi}</TableCell>
                                <TableCell>{kpi.valor_meta_kpi}</TableCell>
                                <TableCell>R$ {kpi.peso_kpi.toFixed(2)}</TableCell>
                                <TableCell>{kpi.turno_kpi}</TableCell>
                                <TableCell>{kpi.funcao_kpi}</TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end space-x-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleEditKPI(kpi)}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() => handleDeleteKPI(kpi.id!)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}

        {/* Activity Dialog */}
        <Dialog open={activityDialog} onOpenChange={setActivityDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingActivity ? 'Editar Atividade' : 'Nova Atividade'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleActivitySubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Nome da Atividade</label>
                <Input
                  value={activityForm.nome_atividade}
                  onChange={(e) => setActivityForm(prev => ({ ...prev, nome_atividade: e.target.value }))}
                  placeholder="Ex: Separação de Pedidos"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Nível da Atividade</label>
                <Input
                  value={activityForm.nivel_atividade}
                  onChange={(e) => setActivityForm(prev => ({ ...prev, nivel_atividade: e.target.value }))}
                  placeholder="Ex: N1, N2, N3"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Valor (R$)</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={activityForm.valor_atividade}
                  onChange={(e) => setActivityForm(prev => ({ ...prev, valor_atividade: parseFloat(e.target.value) || 0 }))}
                  placeholder="Ex: 0.25"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Produtividade Mínima</label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    value={activityForm.produtividade_minima}
                    onChange={(e) => setActivityForm(prev => ({ ...prev, produtividade_minima: parseFloat(e.target.value) || 0 }))}
                    placeholder="Ex: 14.2"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Unidade de Medida</label>
                  <Select
                    value={activityForm.unidade_medida}
                    onChange={(e) => setActivityForm(prev => ({ ...prev, unidade_medida: e.target.value }))}
                  >
                    <option value="">Selecione</option>
                    <option value="cxs/h">cxs/h (Caixas por hora)</option>
                    <option value="plt/h">plt/h (Pallets por hora)</option>
                    <option value="unidades/h">unidades/h</option>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActivityDialog(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingActivity ? 'Atualizar' : 'Criar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* KPI Dialog */}
        <Dialog open={kpiDialog} onOpenChange={setKpiDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingKPI ? 'Editar KPI' : 'Novo KPI'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleKPISubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Nome do KPI</label>
                <Input
                  value={kpiForm.nome_kpi}
                  onChange={(e) => setKpiForm(prev => ({ ...prev, nome_kpi: e.target.value }))}
                  placeholder="Ex: Produtividade na Separação"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Descrição</label>
                <textarea
                  value={kpiForm.descricao}
                  onChange={(e) => setKpiForm(prev => ({ ...prev, descricao: e.target.value }))}
                  placeholder="Descreva o objetivo deste KPI..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Meta</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={kpiForm.valor_meta_kpi}
                    onChange={(e) => setKpiForm(prev => ({ ...prev, valor_meta_kpi: parseFloat(e.target.value) || 0 }))}
                    placeholder="Ex: 99.5"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Peso/Bônus (R$)</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={kpiForm.peso_kpi}
                    onChange={(e) => setKpiForm(prev => ({ ...prev, peso_kpi: parseFloat(e.target.value) || 0 }))}
                    placeholder="Ex: 10.00"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Turno</label>
                <Select
                  value={kpiForm.turno_kpi}
                  onChange={(e) => setKpiForm(prev => ({ ...prev, turno_kpi: e.target.value as any }))}
                >
                  <option value="Geral">Geral</option>
                  <option value="Manhã">Manhã</option>
                  <option value="Tarde">Tarde</option>
                  <option value="Noite">Noite</option>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Função</label>
                <Input
                  value={kpiForm.funcao_kpi}
                  onChange={(e) => setKpiForm(prev => ({ ...prev, funcao_kpi: e.target.value }))}
                  placeholder="Ex: Separador, Conferente"
                  required
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="status_ativo_form"
                  checked={kpiForm.status_ativo}
                  onChange={(e) => setKpiForm(prev => ({ ...prev, status_ativo: e.target.checked }))}
                  className="rounded border-gray-300"
                />
                <label htmlFor="status_ativo_form" className="text-sm font-medium text-gray-700">
                  KPI ativo
                </label>
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setKpiDialog(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingKPI ? 'Atualizar' : 'Criar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* WMS User Dialog */}
        <Dialog open={wmsDialog} onOpenChange={setWmsDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingWmsUser ? 'Editar Usuário WMS' : 'Novo Usuário WMS'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleWmsSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Nome</label>
                <Input
                  value={wmsForm.nome}
                  onChange={(e) => setWmsForm(prev => ({ ...prev, nome: e.target.value }))}
                  placeholder="Nome completo do usuário"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">CPF</label>
                <Input
                  value={wmsForm.cpf}
                  onChange={(e) => setWmsForm(prev => ({ ...prev, cpf: e.target.value }))}
                  placeholder="000.000.000-00"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Login WMS</label>
                <Input
                  value={wmsForm.login_wms}
                  onChange={(e) => setWmsForm(prev => ({ ...prev, login_wms: e.target.value }))}
                  placeholder="Login do usuário no sistema WMS"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Nome WMS</label>
                <Input
                  value={wmsForm.nome_wms}
                  onChange={(e) => setWmsForm(prev => ({ ...prev, nome_wms: e.target.value }))}
                  placeholder="Nome de identificação no WMS"
                  required
                />
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setWmsDialog(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingWmsUser ? 'Atualizar' : 'Criar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </AdminLayout>
    </AuthGuard>
  );
}
