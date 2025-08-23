import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Edit, Trash2, Search, Eye, Shield, User, Phone, Mail, Calendar } from 'lucide-react';
import { Link } from 'react-router';
import { Button } from '@/react-app/components/Button';
import { Input } from '@/react-app/components/Input';
import { Select } from '@/react-app/components/Select';
import { Card, CardContent, CardHeader, CardTitle } from '@/react-app/components/Card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/react-app/components/Dialog';
import { Alert, AlertDescription } from '@/react-app/components/Alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/react-app/components/Table';
import AuthGuard from '@/react-app/components/AuthGuard';
import UserMenu from '@/react-app/components/UserMenu';
import { UserType } from '@/shared/types';

const formatDateSafe = (dateString: string): string => {
  if (!dateString) return '';
  
  // Se a data contém timezone (Z ou +/-), extrair apenas a parte da data
  const dateOnly = dateString.split('T')[0];
  const [year, month, day] = dateOnly.split('-');
  
  // Criar data local sem conversão de timezone
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  return date.toLocaleDateString('pt-BR');
};

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

interface ExtendedUserType extends UserType {
  email?: string;
  telefone?: string;
  data_admissao?: string;
  turno?: string;
  observacoes?: string;
  // Legacy fields for compatibility
  role?: 'user' | 'admin';
  is_active?: boolean;
}

export default function CadastroUsuarios() {
  const [users, setUsers] = useState<ExtendedUserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<ExtendedUserType | null>(null);
  const [viewingUser, setViewingUser] = useState<ExtendedUserType | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [funcaoFilter, setFuncaoFilter] = useState('all');
  const [perfilFilter, setPerfilFilter] = useState('all');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    nome: '',
    cpf: '',
    data_nascimento: '',
    funcao: 'Ajudante de Armazém',
    tipo_usuario: 'colaborador',
    status_usuario: 'ativo',
    email: '',
    telefone: '',
    data_admissao: '',
    turno: 'Manhã',
    observacoes: ''
  });

  useEffect(() => {
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
    } catch (error) {
      console.error('Error loading users:', error);
      setError('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const validarCPF = (cpf: string) => {
    const numbers = cpf.replace(/\D/g, '');
    return numbers.length === 11;
  };

  const validarIdade = (dataNascimento: string) => {
    const hoje = new Date();
    const nascimento = new Date(dataNascimento);
    const idade = hoje.getFullYear() - nascimento.getFullYear();
    return idade >= 16 && idade <= 80;
  };

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    return value;
  };

  const formatTelefone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    return value;
  };

  const maskCPF = (cpf: string) => {
    if (!cpf) return '';
    return cpf.replace(/(\d{3})\.\d{3}\.(\d{3})-\d{2}/, '$1.***.***-**');
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      cpf: '',
      data_nascimento: '',
      funcao: 'Ajudante de Armazém',
      tipo_usuario: 'colaborador',
      status_usuario: 'ativo',
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

  const openEditDialog = (user: ExtendedUserType) => {
    setFormData({
      nome: user.nome || '',
      cpf: user.cpf || '',
      data_nascimento: user.data_nascimento || '',
      funcao: user.funcao || 'Ajudante de Armazém',
      tipo_usuario: user.tipo_usuario || (user.role === 'admin' ? 'administrador' : 'colaborador'),
      status_usuario: user.status_usuario || (user.is_active ? 'ativo' : 'inativo'),
      email: user.email || '',
      telefone: user.telefone || '',
      data_admissao: user.data_admissao || '',
      turno: user.turno || 'Manhã',
      observacoes: user.observacoes || ''
    });
    setEditingUser(user);
    setShowDialog(true);
  };

  const openViewDialog = (user: ExtendedUserType) => {
    setViewingUser(user);
    setShowViewDialog(true);
  };

  const handleCPFChange = (value: string) => {
    const formatted = formatCPF(value);
    setFormData(prev => ({ ...prev, cpf: formatted }));
  };

  const handleTelefoneChange = (value: string) => {
    const formatted = formatTelefone(value);
    setFormData(prev => ({ ...prev, telefone: formatted }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
        tipo_usuario: formData.tipo_usuario,
        status_usuario: formData.status_usuario,
        email: formData.email,
        telefone: formData.telefone,
        data_admissao: formData.data_admissao,
        turno: formData.turno,
        observacoes: formData.observacoes
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
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao salvar usuário');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erro ao salvar usuário');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (user: ExtendedUserType) => {
    if (!confirm(`Tem certeza que deseja excluir o usuário "${user.nome}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/usuarios/${user.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await loadUsers();
      } else {
        alert('Erro ao excluir usuário');
      }
    } catch (error) {
      alert('Erro ao excluir usuário');
    }
  };

  const toggleUserStatus = async (user: ExtendedUserType) => {
    try {
      const currentStatus = user.status_usuario || (user.is_active ? 'ativo' : 'inativo');
      const newStatus = currentStatus === 'ativo' ? 'inativo' : 'ativo';
      
      const response = await fetch(`/api/usuarios/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status_usuario: newStatus })
      });

      if (response.ok) {
        await loadUsers();
      } else {
        const errorData = await response.json();
        console.error('Error toggling user status:', errorData);
        setError('Erro ao alterar status do usuário');
      }
    } catch (error) {
      console.error('Error toggling user status:', error);
      setError('Erro ao alterar status do usuário');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         maskCPF(user.cpf).includes(searchTerm);
    
    const userStatus = user.status_usuario || (user.is_active ? 'ativo' : 'inativo');
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && userStatus === 'ativo') ||
                         (statusFilter === 'inactive' && userStatus === 'inativo');
    
    const matchesFuncao = funcaoFilter === 'all' || user.funcao === funcaoFilter;
    
    const userTipo = user.tipo_usuario || (user.role === 'admin' ? 'administrador' : 'colaborador');
    const matchesPerfil = perfilFilter === 'all' || 
                         (perfilFilter === 'admin' && userTipo === 'administrador') ||
                         (perfilFilter === 'user' && userTipo === 'colaborador');
    
    return matchesSearch && matchesStatus && matchesFuncao && matchesPerfil;
  });

  return (
    <AuthGuard requireAdmin>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        {/* Header */}
        <header className="border-b bg-white/70 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Link to="/admin">
                  <Button variant="outline" size="sm">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Voltar
                  </Button>
                </Link>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  👥 Cadastro de Usuários
                </h1>
              </div>
              <UserMenu />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          <div className="space-y-6">
            {/* Filters and Search */}
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                  <CardTitle className="flex items-center space-x-2">
                    <Search className="h-5 w-5" />
                    <span>Buscar e Filtrar</span>
                  </CardTitle>
                  <Button onClick={openAddDialog} className="flex items-center space-x-2">
                    <Plus className="h-4 w-4" />
                    <span>➕ Novo Usuário</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-4">
                  <div className="flex-1">
                    <Input
                      placeholder="🔍 Buscar por nome ou CPF..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                    <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                      <option value="all">Todos Status</option>
                      <option value="active">Ativos</option>
                      <option value="inactive">Inativos</option>
                    </Select>
                    <Select value={funcaoFilter} onChange={(e) => setFuncaoFilter(e.target.value)}>
                      <option value="all">Todas Funções</option>
                      {FUNCOES_SISTEMA.map(funcao => (
                        <option key={funcao} value={funcao}>{funcao}</option>
                      ))}
                    </Select>
                    <Select value={perfilFilter} onChange={(e) => setPerfilFilter(e.target.value)}>
                      <option value="all">Todos Perfis</option>
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Users Table */}
            <Card>
              <CardHeader>
                <CardTitle>👥 Usuários Cadastrados</CardTitle>
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
                          <TableHead>ID</TableHead>
                          <TableHead>Nome</TableHead>
                          <TableHead>CPF</TableHead>
                          <TableHead>Função</TableHead>
                          <TableHead>Perfil</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell className="font-mono">
                              {String(user.id).padStart(2, '0')}
                            </TableCell>
                            <TableCell className="font-medium">
                              {user.nome}
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {maskCPF(user.cpf)}
                            </TableCell>
                            <TableCell>
                              <span className="text-sm">
                                {user.funcao || 'Ajudante de Armazém'}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                {(user.tipo_usuario === 'administrador' || user.role === 'admin') ? (
                                  <>
                                    <Shield className="h-4 w-4 text-purple-600" />
                                    <span className="text-purple-600 font-medium text-sm">Admin</span>
                                  </>
                                ) : (
                                  <>
                                    <User className="h-4 w-4 text-gray-600" />
                                    <span className="text-gray-600 text-sm">User</span>
                                  </>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <button
                                onClick={() => toggleUserStatus(user)}
                                className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                                  (user.status_usuario === 'ativo' || user.is_active)
                                    ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                    : 'bg-red-100 text-red-800 hover:bg-red-200'
                                }`}
                              >
                                <span className={`w-2 h-2 rounded-full ${
                                  (user.status_usuario === 'ativo' || user.is_active) ? 'bg-green-600' : 'bg-red-600'
                                }`}></span>
                                <span>{(user.status_usuario === 'ativo' || user.is_active) ? 'Ativo' : 'Inativo'}</span>
                              </button>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openViewDialog(user)}
                                  className="text-blue-600 hover:text-blue-800"
                                  title="Visualizar"
                                >
                                  <Eye className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openEditDialog(user)}
                                  className="text-green-600 hover:text-green-800"
                                  title="Editar"
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleDelete(user)}
                                  className="text-red-600 hover:text-red-800"
                                  title="Excluir"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                        {filteredUsers.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                              {searchTerm || statusFilter !== 'all' || funcaoFilter !== 'all' || perfilFilter !== 'all'
                                ? 'Nenhum usuário encontrado com os filtros aplicados'
                                : 'Nenhum usuário cadastrado'}
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>

        {/* Add/Edit Dialog */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingUser ? '✏️ Editar Usuário' : '➕ Novo Usuário'}
              </DialogTitle>
            </DialogHeader>
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
                    <Input
                      value={formData.nome}
                      onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                      placeholder="Nome completo do usuário"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      CPF * 🔒
                    </label>
                    <Input
                      value={formData.cpf}
                      onChange={(e) => handleCPFChange(e.target.value)}
                      placeholder="000.000.000-00"
                      maxLength={14}
                      required
                    />
                    <p className="text-xs text-gray-500">Usado para login no sistema</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Data de Nascimento * 🔒
                    </label>
                    <Input
                      type="date"
                      value={formData.data_nascimento}
                      onChange={(e) => setFormData(prev => ({ ...prev, data_nascimento: e.target.value }))}
                      required
                    />
                    <p className="text-xs text-gray-500">Usada para login no sistema</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Função *
                    </label>
                    <Select
                      value={formData.funcao}
                      onChange={(e) => setFormData(prev => ({ ...prev, funcao: e.target.value }))}
                      required
                    >
                      {FUNCOES_SISTEMA.map(funcao => (
                        <option key={funcao} value={funcao}>{funcao}</option>
                      ))}
                    </Select>
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
                        <input
                          type="radio"
                          name="tipo_usuario"
                          value="colaborador"
                          checked={formData.tipo_usuario === 'colaborador'}
                          onChange={(e) => setFormData(prev => ({ ...prev, tipo_usuario: e.target.value }))}
                        />
                        <User className="h-4 w-4 text-gray-600" />
                        <span className="text-sm">User</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="tipo_usuario"
                          value="administrador"
                          checked={formData.tipo_usuario === 'administrador'}
                          onChange={(e) => setFormData(prev => ({ ...prev, tipo_usuario: e.target.value }))}
                        />
                        <Shield className="h-4 w-4 text-purple-600" />
                        <span className="text-sm">Admin</span>
                      </label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Status</label>
                    <div className="flex items-center space-x-4">
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="status_usuario"
                          value="ativo"
                          checked={formData.status_usuario === 'ativo'}
                          onChange={(e) => setFormData(prev => ({ ...prev, status_usuario: e.target.value }))}
                        />
                        <span className="text-sm">🟢 Ativo</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="status_usuario"
                          value="inativo"
                          checked={formData.status_usuario === 'inativo'}
                          onChange={(e) => setFormData(prev => ({ ...prev, status_usuario: e.target.value }))}
                        />
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
                      <Mail className="h-4 w-4" />
                      <span>Email</span>
                    </label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="email@exemplo.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                      <Phone className="h-4 w-4" />
                      <span>Telefone</span>
                    </label>
                    <Input
                      value={formData.telefone}
                      onChange={(e) => handleTelefoneChange(e.target.value)}
                      placeholder="(11) 99999-9999"
                      maxLength={15}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                      <Calendar className="h-4 w-4" />
                      <span>Data de Admissão</span>
                    </label>
                    <Input
                      type="date"
                      value={formData.data_admissao}
                      onChange={(e) => setFormData(prev => ({ ...prev, data_admissao: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Turno</label>
                    <Select
                      value={formData.turno}
                      onChange={(e) => setFormData(prev => ({ ...prev, turno: e.target.value }))}
                    >
                      {TURNOS.map(turno => (
                        <option key={turno} value={turno}>{turno}</option>
                      ))}
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Observações</label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={3}
                    value={formData.observacoes}
                    onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                    placeholder="Informações adicionais sobre o usuário..."
                  />
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowDialog(false)}
                >
                  ❌ Cancelar
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                >
                  🗑️ Limpar
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Salvando...' : (editingUser ? '💾 Atualizar' : '💾 Salvar')}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* View Dialog */}
        <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>👁️ Visualizar Usuário</DialogTitle>
            </DialogHeader>
            {viewingUser && (
              <div className="space-y-6">
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
                        {formatDateSafe(viewingUser.data_nascimento)}
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
                        {(viewingUser.tipo_usuario === 'administrador' || viewingUser.role === 'admin') ? (
                          <>
                            <Shield className="h-4 w-4 text-purple-600" />
                            <span className="text-purple-600 font-medium">Administrador</span>
                          </>
                        ) : (
                          <>
                            <User className="h-4 w-4 text-gray-600" />
                            <span className="text-gray-600">Usuário</span>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-500">Status</label>
                      <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
                        (viewingUser.status_usuario === 'ativo' || viewingUser.is_active)
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        <span className={`w-2 h-2 rounded-full ${
                          (viewingUser.status_usuario === 'ativo' || viewingUser.is_active) ? 'bg-green-600' : 'bg-red-600'
                        }`}></span>
                        <span>{(viewingUser.status_usuario === 'ativo' || viewingUser.is_active) ? 'Ativo' : 'Inativo'}</span>
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
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowViewDialog(false);
                      openEditDialog(viewingUser);
                    }}
                  >
                    ✏️ Editar
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowViewDialog(false)}
                  >
                    Fechar
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AuthGuard>
  );
}
