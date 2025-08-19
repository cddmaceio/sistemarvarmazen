"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = CadastroUsuarios;
const react_1 = __importStar(require("react"));
const lucide_react_1 = require("lucide-react");
const react_router_1 = require("react-router");
const Button_1 = require("@/react-app/components/Button");
const Input_1 = require("@/react-app/components/Input");
const Select_1 = require("@/react-app/components/Select");
const Card_1 = require("@/react-app/components/Card");
const Dialog_1 = require("@/react-app/components/Dialog");
const Alert_1 = require("@/react-app/components/Alert");
const Table_1 = require("@/react-app/components/Table");
const AuthGuard_1 = __importDefault(require("@/react-app/components/AuthGuard"));
const UserMenu_1 = __importDefault(require("@/react-app/components/UserMenu"));
const FUNCOES_SISTEMA = [
    'Ajudante de Armazém',
    'Operador de Empilhadeira',
    'Conferente',
    'Supervisor',
    'Gerente'
];
const TURNOS = [
    'Manhã',
    'Tarde',
    'Noite',
    'Todos'
];
function CadastroUsuarios() {
    const [users, setUsers] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [showDialog, setShowDialog] = (0, react_1.useState)(false);
    const [showViewDialog, setShowViewDialog] = (0, react_1.useState)(false);
    const [editingUser, setEditingUser] = (0, react_1.useState)(null);
    const [viewingUser, setViewingUser] = (0, react_1.useState)(null);
    const [searchTerm, setSearchTerm] = (0, react_1.useState)('');
    const [statusFilter, setStatusFilter] = (0, react_1.useState)('all');
    const [funcaoFilter, setFuncaoFilter] = (0, react_1.useState)('all');
    const [perfilFilter, setPerfilFilter] = (0, react_1.useState)('all');
    const [error, setError] = (0, react_1.useState)(null);
    const [submitting, setSubmitting] = (0, react_1.useState)(false);
    const [formData, setFormData] = (0, react_1.useState)({
        nome: '',
        cpf: '',
        data_nascimento: '',
        funcao: 'Ajudante de Armazém',
        role: 'user',
        is_active: true,
        email: '',
        telefone: '',
        data_admissao: '',
        turno: 'Manhã',
        observacoes: ''
    });
    (0, react_1.useEffect)(() => {
        loadUsers();
    }, []);
    const loadUsers = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/usuarios');
            if (response.ok) {
                const data = await response.json();
                setUsers(data);
            }
        }
        catch (error) {
            console.error('Error loading users:', error);
            setError('Erro ao carregar usuários');
        }
        finally {
            setLoading(false);
        }
    };
    const validarCPF = (cpf) => {
        const numbers = cpf.replace(/\D/g, '');
        return numbers.length === 11;
    };
    const validarIdade = (dataNascimento) => {
        const hoje = new Date();
        const nascimento = new Date(dataNascimento);
        const idade = hoje.getFullYear() - nascimento.getFullYear();
        return idade >= 16 && idade <= 80;
    };
    const formatCPF = (value) => {
        const numbers = value.replace(/\D/g, '');
        if (numbers.length <= 11) {
            return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
        }
        return value;
    };
    const formatTelefone = (value) => {
        const numbers = value.replace(/\D/g, '');
        if (numbers.length <= 11) {
            return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
        }
        return value;
    };
    const maskCPF = (cpf) => {
        if (!cpf)
            return '';
        return cpf.replace(/(\d{3})\.\d{3}\.(\d{3})-\d{2}/, '$1.***.***-**');
    };
    const resetForm = () => {
        setFormData({
            nome: '',
            cpf: '',
            data_nascimento: '',
            funcao: 'Ajudante de Armazém',
            role: 'user',
            is_active: true,
            email: '',
            telefone: '',
            data_admissao: '',
            turno: 'Manhã',
            observacoes: ''
        });
        setEditingUser(null);
        setError(null);
    };
    const openAddDialog = () => {
        resetForm();
        setShowDialog(true);
    };
    const openEditDialog = (user) => {
        setFormData({
            nome: user.nome,
            cpf: user.cpf,
            data_nascimento: user.data_nascimento,
            funcao: user.funcao || 'Ajudante de Armazém',
            role: user.role,
            is_active: user.is_active,
            email: user.email || '',
            telefone: user.telefone || '',
            data_admissao: user.data_admissao || '',
            turno: user.turno || 'Manhã',
            observacoes: user.observacoes || ''
        });
        setEditingUser(user);
        setShowDialog(true);
    };
    const openViewDialog = (user) => {
        setViewingUser(user);
        setShowViewDialog(true);
    };
    const handleCPFChange = (value) => {
        const formatted = formatCPF(value);
        setFormData(prev => ({ ...prev, cpf: formatted }));
    };
    const handleTelefoneChange = (value) => {
        const formatted = formatTelefone(value);
        setFormData(prev => ({ ...prev, telefone: formatted }));
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        // Validações
        if (!formData.nome || !formData.cpf || !formData.data_nascimento) {
            setError('Nome, CPF e data de nascimento são obrigatórios');
            return;
        }
        if (!validarCPF(formData.cpf)) {
            setError('CPF inválido. Deve conter 11 dígitos');
            return;
        }
        if (!validarIdade(formData.data_nascimento)) {
            setError('Idade deve estar entre 16 e 80 anos');
            return;
        }
        // Check if CPF already exists (only for new users)
        if (!editingUser) {
            const cpfExists = users.some(user => user.cpf === formData.cpf);
            if (cpfExists) {
                setError('CPF já está cadastrado no sistema');
                return;
            }
        }
        try {
            setSubmitting(true);
            const payload = {
                nome: formData.nome.trim(),
                cpf: formData.cpf,
                data_nascimento: formData.data_nascimento,
                funcao: formData.funcao,
                role: formData.role,
                is_active: Boolean(formData.is_active)
                // Note: email, telefone, etc. would need database schema updates
            };
            const url = editingUser ? `/api/usuarios/${editingUser.id}` : '/api/usuarios';
            const method = editingUser ? 'PUT' : 'POST';
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (response.ok) {
                await loadUsers();
                setShowDialog(false);
                resetForm();
            }
            else {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erro ao salvar usuário');
            }
        }
        catch (error) {
            setError(error instanceof Error ? error.message : 'Erro ao salvar usuário');
        }
        finally {
            setSubmitting(false);
        }
    };
    const handleDelete = async (user) => {
        if (!confirm(`Tem certeza que deseja excluir o usuário "${user.nome}"?`)) {
            return;
        }
        try {
            const response = await fetch(`/api/usuarios/${user.id}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                await loadUsers();
            }
            else {
                alert('Erro ao excluir usuário');
            }
        }
        catch (error) {
            alert('Erro ao excluir usuário');
        }
    };
    const toggleUserStatus = async (user) => {
        try {
            const response = await fetch(`/api/usuarios/${user.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_active: Boolean(!user.is_active) })
            });
            if (response.ok) {
                await loadUsers();
            }
        }
        catch (error) {
            console.error('Error toggling user status:', error);
        }
    };
    const filteredUsers = users.filter(user => {
        const matchesSearch = user.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
            maskCPF(user.cpf).includes(searchTerm);
        const matchesStatus = statusFilter === 'all' ||
            (statusFilter === 'active' && user.is_active) ||
            (statusFilter === 'inactive' && !user.is_active);
        const matchesFuncao = funcaoFilter === 'all' || user.funcao === funcaoFilter;
        const matchesPerfil = perfilFilter === 'all' || user.role === perfilFilter;
        return matchesSearch && matchesStatus && matchesFuncao && matchesPerfil;
    });
    return (<AuthGuard_1.default requireAdmin>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        {/* Header */}
        <header className="border-b bg-white/70 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <react_router_1.Link to="/admin">
                  <Button_1.Button variant="outline" size="sm">
                    <lucide_react_1.ArrowLeft className="h-4 w-4 mr-2"/>
                    Voltar
                  </Button_1.Button>
                </react_router_1.Link>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  👥 Cadastro de Usuários
                </h1>
              </div>
              <UserMenu_1.default />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          <div className="space-y-6">
            {/* Filters and Search */}
            <Card_1.Card>
              <Card_1.CardHeader>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                  <Card_1.CardTitle className="flex items-center space-x-2">
                    <lucide_react_1.Search className="h-5 w-5"/>
                    <span>Buscar e Filtrar</span>
                  </Card_1.CardTitle>
                  <Button_1.Button onClick={openAddDialog} className="flex items-center space-x-2">
                    <lucide_react_1.Plus className="h-4 w-4"/>
                    <span>➕ Novo Usuário</span>
                  </Button_1.Button>
                </div>
              </Card_1.CardHeader>
              <Card_1.CardContent>
                <div className="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-4">
                  <div className="flex-1">
                    <Input_1.Input placeholder="🔍 Buscar por nome ou CPF..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}/>
                  </div>
                  <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                    <Select_1.Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                      <option value="all">Todos Status</option>
                      <option value="active">Ativos</option>
                      <option value="inactive">Inativos</option>
                    </Select_1.Select>
                    <Select_1.Select value={funcaoFilter} onChange={(e) => setFuncaoFilter(e.target.value)}>
                      <option value="all">Todas Funções</option>
                      {FUNCOES_SISTEMA.map(funcao => (<option key={funcao} value={funcao}>{funcao}</option>))}
                    </Select_1.Select>
                    <Select_1.Select value={perfilFilter} onChange={(e) => setPerfilFilter(e.target.value)}>
                      <option value="all">Todos Perfis</option>
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </Select_1.Select>
                  </div>
                </div>
              </Card_1.CardContent>
            </Card_1.Card>

            {/* Users Table */}
            <Card_1.Card>
              <Card_1.CardHeader>
                <Card_1.CardTitle>👥 Usuários Cadastrados</Card_1.CardTitle>
              </Card_1.CardHeader>
              <Card_1.CardContent>
                {loading ? (<div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>) : (<div className="overflow-x-auto">
                    <Table_1.Table>
                      <Table_1.TableHeader>
                        <Table_1.TableRow>
                          <Table_1.TableHead>ID</Table_1.TableHead>
                          <Table_1.TableHead>Nome</Table_1.TableHead>
                          <Table_1.TableHead>CPF</Table_1.TableHead>
                          <Table_1.TableHead>Função</Table_1.TableHead>
                          <Table_1.TableHead>Perfil</Table_1.TableHead>
                          <Table_1.TableHead>Status</Table_1.TableHead>
                          <Table_1.TableHead>Ações</Table_1.TableHead>
                        </Table_1.TableRow>
                      </Table_1.TableHeader>
                      <Table_1.TableBody>
                        {filteredUsers.map((user) => (<Table_1.TableRow key={user.id}>
                            <Table_1.TableCell className="font-mono">
                              {String(user.id).padStart(2, '0')}
                            </Table_1.TableCell>
                            <Table_1.TableCell className="font-medium">
                              {user.nome}
                            </Table_1.TableCell>
                            <Table_1.TableCell className="font-mono text-sm">
                              {maskCPF(user.cpf)}
                            </Table_1.TableCell>
                            <Table_1.TableCell>
                              <span className="text-sm">
                                {user.funcao || 'Ajudante de Armazém'}
                              </span>
                            </Table_1.TableCell>
                            <Table_1.TableCell>
                              <div className="flex items-center space-x-2">
                                {user.role === 'admin' ? (<>
                                    <lucide_react_1.Shield className="h-4 w-4 text-purple-600"/>
                                    <span className="text-purple-600 font-medium text-sm">Admin</span>
                                  </>) : (<>
                                    <lucide_react_1.User className="h-4 w-4 text-gray-600"/>
                                    <span className="text-gray-600 text-sm">User</span>
                                  </>)}
                              </div>
                            </Table_1.TableCell>
                            <Table_1.TableCell>
                              <button onClick={() => toggleUserStatus(user)} className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium transition-colors ${user.is_active
                    ? 'bg-green-100 text-green-800 hover:bg-green-200'
                    : 'bg-red-100 text-red-800 hover:bg-red-200'}`}>
                                <span className={`w-2 h-2 rounded-full ${user.is_active ? 'bg-green-600' : 'bg-red-600'}`}></span>
                                <span>{user.is_active ? 'Ativo' : 'Inativo'}</span>
                              </button>
                            </Table_1.TableCell>
                            <Table_1.TableCell>
                              <div className="flex items-center space-x-2">
                                <Button_1.Button variant="outline" size="sm" onClick={() => openViewDialog(user)} className="text-blue-600 hover:text-blue-800" title="Visualizar">
                                  <lucide_react_1.Eye className="h-3 w-3"/>
                                </Button_1.Button>
                                <Button_1.Button variant="outline" size="sm" onClick={() => openEditDialog(user)} className="text-green-600 hover:text-green-800" title="Editar">
                                  <lucide_react_1.Edit className="h-3 w-3"/>
                                </Button_1.Button>
                                <Button_1.Button variant="destructive" size="sm" onClick={() => handleDelete(user)} className="text-red-600 hover:text-red-800" title="Excluir">
                                  <lucide_react_1.Trash2 className="h-3 w-3"/>
                                </Button_1.Button>
                              </div>
                            </Table_1.TableCell>
                          </Table_1.TableRow>))}
                        {filteredUsers.length === 0 && (<Table_1.TableRow>
                            <Table_1.TableCell colSpan={7} className="text-center py-8 text-gray-500">
                              {searchTerm || statusFilter !== 'all' || funcaoFilter !== 'all' || perfilFilter !== 'all'
                    ? 'Nenhum usuário encontrado com os filtros aplicados'
                    : 'Nenhum usuário cadastrado'}
                            </Table_1.TableCell>
                          </Table_1.TableRow>)}
                      </Table_1.TableBody>
                    </Table_1.Table>
                  </div>)}
              </Card_1.CardContent>
            </Card_1.Card>
          </div>
        </main>

        {/* Add/Edit Dialog */}
        <Dialog_1.Dialog open={showDialog} onOpenChange={setShowDialog}>
          <Dialog_1.DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <Dialog_1.DialogHeader>
              <Dialog_1.DialogTitle>
                {editingUser ? '✏️ Editar Usuário' : '➕ Novo Usuário'}
              </Dialog_1.DialogTitle>
            </Dialog_1.DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Dados Básicos */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                  Dados Básicos
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Nome Completo *
                    </label>
                    <Input_1.Input value={formData.nome} onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))} placeholder="Nome completo do usuário" required/>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      CPF * 🔒
                    </label>
                    <Input_1.Input value={formData.cpf} onChange={(e) => handleCPFChange(e.target.value)} placeholder="000.000.000-00" maxLength={14} required/>
                    <p className="text-xs text-gray-500">Usado para login no sistema</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Data de Nascimento * 🔒
                    </label>
                    <Input_1.Input type="date" value={formData.data_nascimento} onChange={(e) => setFormData(prev => ({ ...prev, data_nascimento: e.target.value }))} required/>
                    <p className="text-xs text-gray-500">Usada para login no sistema</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Função *
                    </label>
                    <Select_1.Select value={formData.funcao} onChange={(e) => setFormData(prev => ({ ...prev, funcao: e.target.value }))} required>
                      {FUNCOES_SISTEMA.map(funcao => (<option key={funcao} value={funcao}>{funcao}</option>))}
                    </Select_1.Select>
                  </div>
                </div>
              </div>

              {/* Controle de Acesso */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                  Controle de Acesso
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Perfil de Acesso</label>
                    <div className="flex items-center space-x-4">
                      <label className="flex items-center space-x-2">
                        <input type="radio" name="role" value="user" checked={formData.role === 'user'} onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}/>
                        <lucide_react_1.User className="h-4 w-4 text-gray-600"/>
                        <span className="text-sm">User</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input type="radio" name="role" value="admin" checked={formData.role === 'admin'} onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}/>
                        <lucide_react_1.Shield className="h-4 w-4 text-purple-600"/>
                        <span className="text-sm">Admin</span>
                      </label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Status</label>
                    <div className="flex items-center space-x-4">
                      <label className="flex items-center space-x-2">
                        <input type="radio" name="status" checked={formData.is_active} onChange={() => setFormData(prev => ({ ...prev, is_active: true }))}/>
                        <span className="text-sm">🟢 Ativo</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input type="radio" name="status" checked={!formData.is_active} onChange={() => setFormData(prev => ({ ...prev, is_active: false }))}/>
                        <span className="text-sm">🔴 Inativo</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dados Complementares */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                  Dados Complementares (Opcional)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                      <lucide_react_1.Mail className="h-4 w-4"/>
                      <span>Email</span>
                    </label>
                    <Input_1.Input type="email" value={formData.email} onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))} placeholder="email@exemplo.com"/>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                      <lucide_react_1.Phone className="h-4 w-4"/>
                      <span>Telefone</span>
                    </label>
                    <Input_1.Input value={formData.telefone} onChange={(e) => handleTelefoneChange(e.target.value)} placeholder="(11) 99999-9999" maxLength={15}/>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                      <lucide_react_1.Calendar className="h-4 w-4"/>
                      <span>Data de Admissão</span>
                    </label>
                    <Input_1.Input type="date" value={formData.data_admissao} onChange={(e) => setFormData(prev => ({ ...prev, data_admissao: e.target.value }))}/>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Turno</label>
                    <Select_1.Select value={formData.turno} onChange={(e) => setFormData(prev => ({ ...prev, turno: e.target.value }))}>
                      {TURNOS.map(turno => (<option key={turno} value={turno}>{turno}</option>))}
                    </Select_1.Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Observações</label>
                  <textarea className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none" rows={3} value={formData.observacoes} onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))} placeholder="Informações adicionais sobre o usuário..."/>
                </div>
              </div>

              {error && (<Alert_1.Alert variant="destructive">
                  <Alert_1.AlertDescription>{error}</Alert_1.AlertDescription>
                </Alert_1.Alert>)}

              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button_1.Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                  ❌ Cancelar
                </Button_1.Button>
                <Button_1.Button type="button" variant="outline" onClick={resetForm}>
                  🗑️ Limpar
                </Button_1.Button>
                <Button_1.Button type="submit" disabled={submitting}>
                  {submitting ? 'Salvando...' : (editingUser ? '💾 Atualizar' : '💾 Salvar')}
                </Button_1.Button>
              </div>
            </form>
          </Dialog_1.DialogContent>
        </Dialog_1.Dialog>

        {/* View Dialog */}
        <Dialog_1.Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
          <Dialog_1.DialogContent className="max-w-2xl">
            <Dialog_1.DialogHeader>
              <Dialog_1.DialogTitle>👁️ Visualizar Usuário</Dialog_1.DialogTitle>
            </Dialog_1.DialogHeader>
            {viewingUser && (<div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Nome Completo</label>
                      <p className="text-lg font-medium text-gray-900">{viewingUser.nome}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-500">CPF 🔒</label>
                      <p className="text-sm font-mono text-gray-700">{viewingUser.cpf}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-500">Data de Nascimento 🔒</label>
                      <p className="text-sm text-gray-700">
                        {new Date(viewingUser.data_nascimento + 'T00:00:00').toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Função</label>
                      <p className="text-sm text-gray-900">{viewingUser.funcao || 'Ajudante de Armazém'}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-500">Perfil</label>
                      <div className="flex items-center space-x-2">
                        {viewingUser.role === 'admin' ? (<>
                            <lucide_react_1.Shield className="h-4 w-4 text-purple-600"/>
                            <span className="text-purple-600 font-medium">Administrador</span>
                          </>) : (<>
                            <lucide_react_1.User className="h-4 w-4 text-gray-600"/>
                            <span className="text-gray-600">Usuário</span>
                          </>)}
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-500">Status</label>
                      <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${viewingUser.is_active
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'}`}>
                        <span className={`w-2 h-2 rounded-full ${viewingUser.is_active ? 'bg-green-600' : 'bg-red-600'}`}></span>
                        <span>{viewingUser.is_active ? 'Ativo' : 'Inativo'}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-500">
                    <div>
                      <span className="font-medium">Cadastrado em:</span>
                      <p>{viewingUser.created_at ? new Date(viewingUser.created_at).toLocaleString('pt-BR') : 'N/A'}</p>
                    </div>
                    <div>
                      <span className="font-medium">Última atualização:</span>
                      <p>{viewingUser.updated_at ? new Date(viewingUser.updated_at).toLocaleString('pt-BR') : 'N/A'}</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-4 border-t">
                  <Button_1.Button variant="outline" onClick={() => {
                setShowViewDialog(false);
                openEditDialog(viewingUser);
            }}>
                    ✏️ Editar
                  </Button_1.Button>
                  <Button_1.Button variant="outline" onClick={() => setShowViewDialog(false)}>
                    Fechar
                  </Button_1.Button>
                </div>
              </div>)}
          </Dialog_1.DialogContent>
        </Dialog_1.Dialog>
      </div>
    </AuthGuard_1.default>);
}
