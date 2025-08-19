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
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = UserManagement;
const react_1 = __importStar(require("react"));
const lucide_react_1 = require("lucide-react");
const Card_1 = require("@/react-app/components/Card");
const Button_1 = require("@/react-app/components/Button");
const Input_1 = require("@/react-app/components/Input");
const Select_1 = require("@/react-app/components/Select");
const Dialog_1 = require("@/react-app/components/Dialog");
const Alert_1 = require("@/react-app/components/Alert");
const Table_1 = require("@/react-app/components/Table");
function UserManagement({ users, onAddUser, onUpdateUser, onDeleteUser, loading }) {
    const [showDialog, setShowDialog] = (0, react_1.useState)(false);
    const [editingUser, setEditingUser] = (0, react_1.useState)(null);
    const [formData, setFormData] = (0, react_1.useState)({
        cpf: '',
        data_nascimento: '',
        nome: '',
        funcao: 'Ajudante de Armazém',
        role: 'user',
        is_active: true
    });
    const [error, setError] = (0, react_1.useState)(null);
    const [submitting, setSubmitting] = (0, react_1.useState)(false);
    const formatCPF = (value) => {
        const numbers = value.replace(/\D/g, '');
        if (numbers.length <= 11) {
            return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
        }
        return value;
    };
    const handleCPFChange = (value) => {
        const formatted = formatCPF(value);
        setFormData(prev => ({ ...prev, cpf: formatted }));
    };
    const resetForm = () => {
        setFormData({
            cpf: '',
            data_nascimento: '',
            nome: '',
            funcao: 'Ajudante de Armazém',
            role: 'user',
            is_active: true
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
            cpf: user.cpf,
            data_nascimento: user.data_nascimento,
            nome: user.nome,
            funcao: user.funcao || 'Ajudante de Armazém',
            role: user.role,
            is_active: user.is_active
        });
        setEditingUser(user);
        setShowDialog(true);
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        if (!formData.cpf || !formData.data_nascimento || !formData.nome) {
            setError('Todos os campos são obrigatórios');
            return;
        }
        try {
            setSubmitting(true);
            if (editingUser) {
                await onUpdateUser(editingUser.id, formData);
            }
            else {
                await onAddUser(formData);
            }
            setShowDialog(false);
            resetForm();
        }
        catch (error) {
            setError('Erro ao salvar usuário');
        }
        finally {
            setSubmitting(false);
        }
    };
    const handleDelete = async (user) => {
        if (confirm(`Tem certeza que deseja excluir o usuário ${user.nome}?`)) {
            try {
                await onDeleteUser(user.id);
            }
            catch (error) {
                console.error('Error deleting user:', error);
            }
        }
    };
    const toggleUserStatus = async (user) => {
        try {
            await onUpdateUser(user.id, { is_active: !user.is_active });
        }
        catch (error) {
            console.error('Error updating user status:', error);
        }
    };
    const toggleUserRole = async (user) => {
        const newRole = user.role === 'admin' ? 'user' : 'admin';
        const roleText = newRole === 'admin' ? 'Administrador' : 'Usuário';
        if (confirm(`Tem certeza que deseja alterar o perfil de ${user.nome} para ${roleText}?`)) {
            try {
                await onUpdateUser(user.id, { role: newRole });
            }
            catch (error) {
                console.error('Error updating user role:', error);
            }
        }
    };
    return (<div className="space-y-6">
      <Card_1.Card>
        <Card_1.CardHeader>
          <div className="flex items-center justify-between">
            <Card_1.CardTitle className="flex items-center space-x-2">
              <lucide_react_1.User className="h-5 w-5"/>
              <span>Gerenciar Usuários</span>
            </Card_1.CardTitle>
            <Button_1.Button onClick={openAddDialog} className="flex items-center space-x-2">
              <lucide_react_1.Plus className="h-4 w-4"/>
              <span>Novo Usuário</span>
            </Button_1.Button>
          </div>
        </Card_1.CardHeader>
        <Card_1.CardContent>
          {loading ? (<div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>) : (<div className="overflow-x-auto">
              <Table_1.Table>
                <Table_1.TableHeader>
                  <Table_1.TableRow>
                    <Table_1.TableHead>Nome</Table_1.TableHead>
                    <Table_1.TableHead>CPF</Table_1.TableHead>
                    <Table_1.TableHead>Data de Nascimento</Table_1.TableHead>
                    <Table_1.TableHead>Cargo/Função</Table_1.TableHead>
                    <Table_1.TableHead>Status</Table_1.TableHead>
                    <Table_1.TableHead>Ações</Table_1.TableHead>
                  </Table_1.TableRow>
                </Table_1.TableHeader>
                <Table_1.TableBody>
                  {users.map((user) => (<Table_1.TableRow key={user.id}>
                      <Table_1.TableCell className="font-medium">{user.nome}</Table_1.TableCell>
                      <Table_1.TableCell>{user.cpf}</Table_1.TableCell>
                      <Table_1.TableCell>{new Date(user.data_nascimento + 'T00:00:00').toLocaleDateString('pt-BR')}</Table_1.TableCell>
                      <Table_1.TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            {user.role === 'admin' ? (<lucide_react_1.Shield className="h-4 w-4 text-purple-600"/>) : (<lucide_react_1.User className="h-4 w-4 text-gray-600"/>)}
                            <span className={user.role === 'admin' ? 'text-purple-600 font-medium' : 'text-gray-600'}>
                              {user.role === 'admin' ? 'Administrador' : 'Usuário'}
                            </span>
                          </div>
                          {user.funcao && (<div className="text-xs text-gray-500">{user.funcao}</div>)}
                        </div>
                      </Table_1.TableCell>
                      <Table_1.TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.is_active
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'}`}>
                          {user.is_active ? 'Ativo' : 'Inativo'}
                        </span>
                      </Table_1.TableCell>
                      <Table_1.TableCell>
                        <div className="flex items-center space-x-2">
                          <Button_1.Button variant="outline" size="sm" onClick={() => openEditDialog(user)} title="Editar usuário">
                            <lucide_react_1.Edit className="h-3 w-3"/>
                          </Button_1.Button>
                          <Button_1.Button variant="outline" size="sm" onClick={() => toggleUserRole(user)} className={user.role === 'admin' ? 'text-purple-600' : 'text-gray-600'} title={`Alterar perfil para ${user.role === 'admin' ? 'Usuário' : 'Administrador'}`}>
                            <lucide_react_1.Shield className="h-3 w-3"/>
                          </Button_1.Button>
                          <Button_1.Button variant="outline" size="sm" onClick={() => toggleUserStatus(user)} className={user.is_active ? 'text-red-600' : 'text-green-600'} title={user.is_active ? 'Desativar usuário' : 'Ativar usuário'}>
                            {user.is_active ? <lucide_react_1.UserX className="h-3 w-3"/> : <lucide_react_1.UserCheck className="h-3 w-3"/>}
                          </Button_1.Button>
                          <Button_1.Button variant="destructive" size="sm" onClick={() => handleDelete(user)} title="Excluir usuário">
                            <lucide_react_1.Trash2 className="h-3 w-3"/>
                          </Button_1.Button>
                        </div>
                      </Table_1.TableCell>
                    </Table_1.TableRow>))}
                  {users.length === 0 && (<Table_1.TableRow>
                      <Table_1.TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        Nenhum usuário encontrado
                      </Table_1.TableCell>
                    </Table_1.TableRow>)}
                </Table_1.TableBody>
              </Table_1.Table>
            </div>)}
        </Card_1.CardContent>
      </Card_1.Card>

      {/* Add/Edit User Dialog */}
      <Dialog_1.Dialog open={showDialog} onOpenChange={setShowDialog}>
        <Dialog_1.DialogContent>
          <Dialog_1.DialogHeader>
            <Dialog_1.DialogTitle>
              {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
            </Dialog_1.DialogTitle>
          </Dialog_1.DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Nome</label>
              <Input_1.Input value={formData.nome} onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))} placeholder="Nome completo" required/>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">CPF</label>
              <Input_1.Input value={formData.cpf} onChange={(e) => handleCPFChange(e.target.value)} placeholder="000.000.000-00" maxLength={14} required/>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Data de Nascimento</label>
              <Input_1.Input type="date" value={formData.data_nascimento} onChange={(e) => setFormData(prev => ({ ...prev, data_nascimento: e.target.value }))} required/>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Função no Armazém</label>
              <Select_1.Select value={formData.funcao} onChange={(e) => setFormData(prev => ({ ...prev, funcao: e.target.value }))}>
                <option value="Ajudante de Armazém">Ajudante de Armazém</option>
                <option value="Operador de Empilhadeira">Operador de Empilhadeira</option>
                <option value="Conferente">Conferente</option>
                <option value="Líder de Equipe">Líder de Equipe</option>
                <option value="Supervisor">Supervisor</option>
              </Select_1.Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Tipo de Usuário</label>
              <Select_1.Select value={formData.role} onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}>
                <option value="user">Usuário</option>
                <option value="admin">Administrador</option>
              </Select_1.Select>
            </div>

            <div className="flex items-center space-x-2">
              <input type="checkbox" id="is_active" checked={formData.is_active} onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))} className="rounded border-gray-300"/>
              <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                Usuário ativo
              </label>
            </div>

            {error && (<Alert_1.Alert variant="destructive">
                <Alert_1.AlertDescription>{error}</Alert_1.AlertDescription>
              </Alert_1.Alert>)}

            <div className="flex justify-end space-x-2 pt-4">
              <Button_1.Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                Cancelar
              </Button_1.Button>
              <Button_1.Button type="submit" disabled={submitting}>
                {submitting ? 'Salvando...' : (editingUser ? 'Atualizar' : 'Criar')}
              </Button_1.Button>
            </div>
          </form>
        </Dialog_1.DialogContent>
      </Dialog_1.Dialog>
    </div>);
}
