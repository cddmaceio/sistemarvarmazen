import React, { useState } from 'react';
import { User, Plus, Edit, Trash2, Shield, UserCheck, UserX } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/react-app/components/Card';
import { Button } from '@/react-app/components/Button';
import { Input } from '@/react-app/components/Input';
import { Select } from '@/react-app/components/Select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/react-app/components/Dialog';
import { Alert, AlertDescription } from '@/react-app/components/Alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/react-app/components/Table';
import { UserType } from '@/shared/types';

interface UserManagementProps {
  users: UserType[];
  onAddUser: (user: Omit<UserType, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  onUpdateUser: (id: number, user: Partial<UserType>) => Promise<void>;
  onDeleteUser: (id: number) => Promise<void>;
  loading: boolean;
}

export default function UserManagement({ 
  users, 
  onAddUser, 
  onUpdateUser, 
  onDeleteUser, 
  loading 
}: UserManagementProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [formData, setFormData] = useState({
    cpf: '',
    data_nascimento: '',
    nome: '',
    funcao: 'Ajudante de Armazém',
    tipo_usuario: 'colaborador' as 'admin' | 'colaborador',
    status_usuario: 'ativo' as 'ativo' | 'inativo'
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    return value;
  };

  const handleCPFChange = (value: string) => {
    const formatted = formatCPF(value);
    setFormData(prev => ({ ...prev, cpf: formatted }));
  };

  const resetForm = () => {
    setFormData({
      cpf: '',
      data_nascimento: '',
      nome: '',
      funcao: 'Ajudante de Armazém',
      tipo_usuario: 'colaborador' as 'admin' | 'colaborador',
      status_usuario: 'ativo' as 'ativo' | 'inativo'
    });
    setEditingUser(null);
    setError(null);
  };

  const openAddDialog = () => {
    resetForm();
    setShowDialog(true);
  };

  const openEditDialog = (user: UserType) => {
    setFormData({
      cpf: user.cpf,
      data_nascimento: user.data_nascimento,
      nome: user.nome,
      funcao: user.funcao || 'Ajudante de Armazém',
      tipo_usuario: user.tipo_usuario as 'admin' | 'colaborador',
      status_usuario: user.status_usuario as 'ativo' | 'inativo'
    });
    setEditingUser(user);
    setShowDialog(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.cpf || !formData.data_nascimento || !formData.nome) {
      setError('Todos os campos são obrigatórios');
      return;
    }

    try {
      setSubmitting(true);
      if (editingUser) {
        await onUpdateUser(editingUser.id!, formData);
      } else {
        await onAddUser(formData);
      }
      setShowDialog(false);
      resetForm();
    } catch (error) {
      setError('Erro ao salvar usuário');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (user: UserType) => {
    if (confirm(`Tem certeza que deseja excluir o usuário ${user.nome}?`)) {
      try {
        await onDeleteUser(user.id!);
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };

  const toggleUserStatus = async (user: UserType) => {
    try {
      const newStatus = user.status_usuario === 'ativo' ? 'inativo' : 'ativo';
      await onUpdateUser(user.id!, { status_usuario: newStatus });
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  };

  const toggleUserRole = async (user: UserType) => {
    const newRole = user.tipo_usuario === 'admin' ? 'colaborador' : 'admin';
    const roleText = newRole === 'admin' ? 'Administrador' : 'Colaborador';
    
    if (confirm(`Tem certeza que deseja alterar o perfil de ${user.nome} para ${roleText}?`)) {
      try {
        await onUpdateUser(user.id!, { tipo_usuario: newRole });
      } catch (error) {
        console.error('Error updating user role:', error);
      }
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Gerenciar Usuários</span>
            </CardTitle>
            <Button onClick={openAddDialog} className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Novo Usuário</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>CPF</TableHead>
                    <TableHead>Data de Nascimento</TableHead>
                    <TableHead>Cargo/Função</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.nome}</TableCell>
                      <TableCell>{user.cpf}</TableCell>
                      <TableCell>{new Date(user.data_nascimento + 'T00:00:00').toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            {user.tipo_usuario === 'admin' ? (
                              <Shield className="h-4 w-4 text-purple-600" />
                            ) : (
                              <User className="h-4 w-4 text-gray-600" />
                            )}
                            <span className={user.tipo_usuario === 'admin' ? 'text-purple-600 font-medium' : 'text-gray-600'}>
                              {user.tipo_usuario === 'admin' ? 'Administrador' : 'Colaborador'}
                            </span>
                          </div>
                          {user.funcao && (
                            <div className="text-xs text-gray-500">{user.funcao}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          user.status_usuario === 'ativo'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {user.status_usuario === 'ativo' ? 'Ativo' : 'Inativo'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(user)}
                            title="Editar usuário"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleUserRole(user)}
                            className={user.tipo_usuario === 'admin' ? 'text-purple-600' : 'text-gray-600'}
                            title={`Alterar perfil para ${user.tipo_usuario === 'admin' ? 'Colaborador' : 'Administrador'}`}
                          >
                            <Shield className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleUserStatus(user)}
                            className={user.status_usuario === 'ativo' ? 'text-red-600' : 'text-green-600'}
                            title={user.status_usuario === 'ativo' ? 'Desativar usuário' : 'Ativar usuário'}
                          >
                            {user.status_usuario === 'ativo' ? <UserX className="h-3 w-3" /> : <UserCheck className="h-3 w-3" />}
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(user)}
                            title="Excluir usuário"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {users.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        Nenhum usuário encontrado
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit User Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Nome</label>
              <Input
                value={formData.nome}
                onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                placeholder="Nome completo"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">CPF</label>
              <Input
                value={formData.cpf}
                onChange={(e) => handleCPFChange(e.target.value)}
                placeholder="000.000.000-00"
                maxLength={14}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Data de Nascimento</label>
              <Input
                type="date"
                value={formData.data_nascimento}
                onChange={(e) => setFormData(prev => ({ ...prev, data_nascimento: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Função no Armazém</label>
              <Select
                value={formData.funcao}
                onChange={(e) => setFormData(prev => ({ ...prev, funcao: e.target.value }))}
              >
                <option value="Ajudante de Armazém">Ajudante de Armazém</option>
                <option value="Operador de Empilhadeira">Operador de Empilhadeira</option>
                <option value="Conferente">Conferente</option>
                <option value="Líder de Equipe">Líder de Equipe</option>
                <option value="Supervisor">Supervisor</option>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Tipo de Usuário</label>
              <Select
                value={formData.tipo_usuario}
                onChange={(e) => setFormData(prev => ({ ...prev, tipo_usuario: e.target.value as 'admin' | 'colaborador' }))}
              >
                <option value="colaborador">Colaborador</option>
                <option value="admin">Administrador</option>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="status_usuario"
                checked={formData.status_usuario === 'ativo'}
                onChange={(e) => setFormData(prev => ({ ...prev, status_usuario: e.target.checked ? 'ativo' : 'inativo' }))}
                className="rounded border-gray-300"
              />
              <label htmlFor="status_usuario" className="text-sm font-medium text-gray-700">
                Usuário ativo
              </label>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDialog(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Salvando...' : (editingUser ? 'Atualizar' : 'Criar')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
