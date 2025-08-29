import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Edit, Trash2, Search, Save, X, RotateCcw } from 'lucide-react';
import { Link } from 'react-router';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Select } from '@/components/Select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/Dialog';
import { Alert, AlertDescription } from '@/components/Alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/Table';
import AuthGuard from '@/components/AuthGuard';
import UserMenu from '@/components/UserMenu';
import { ActivityType } from '@/shared/types';
import { 
  FUNCOES_UI_FORMAT, 
  convertToDbFormat
} from '@/shared/utils/encoding';

const CATEGORIAS_ATIVIDADE = [
  'Repack',
  'Retrabalho', 
  'Amarração',
  'Separação',
  'Conferência',
  'Devolução',
  'Refugo',
  'Retorno',
  'Blocagem',
  'Outras'
];

const FUNCOES_SISTEMA = FUNCOES_UI_FORMAT;

export default function CadastroAtividades() {
  const [activities, setActivities] = useState<ActivityType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingActivity, setEditingActivity] = useState<ActivityType | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoriaFilter, setCategoriaFilter] = useState('all');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    nome_atividade: '',
    nivel_atividade: '',
    valor_atividade: '',
    produtividade_minima: '',
    unidade_medida: 'cxs/h',
    categoria: 'Repack',
    funcoes_permitidas: [] as string[],
    ativo: true
  });

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/activities');
      if (response.ok) {
        const data = await response.json();
        setActivities(data);
      }
    } catch (error) {
      console.error('Error loading activities:', error);
      setError('Erro ao carregar atividades');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      nome_atividade: '',
      nivel_atividade: '',
      valor_atividade: '',
      produtividade_minima: '',
      unidade_medida: 'cxs/h',
      categoria: 'Repack',
      funcoes_permitidas: [],
      ativo: true
    });
    setEditingActivity(null);
    setError(null);
  };

  const openAddDialog = () => {
    resetForm();
    setShowDialog(true);
  };

  const openEditDialog = (activity: ActivityType) => {
    setFormData({
      nome_atividade: activity.nome_atividade,
      nivel_atividade: activity.nivel_atividade,
      valor_atividade: activity.valor_atividade.toString(),
      produtividade_minima: activity.produtividade_minima?.toString() || '',
      unidade_medida: activity.unidade_medida || 'cxs/h',
      categoria: 'Repack', // Default, would need to add categoria to database
      funcoes_permitidas: [], // Would need to add to database
      ativo: true // Would need to add to database
    });
    setEditingActivity(activity);
    setShowDialog(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.nome_atividade || !formData.nivel_atividade || !formData.valor_atividade) {
      setError('Nome, nível e valor da atividade são obrigatórios');
      return;
    }

    if (isNaN(parseFloat(formData.valor_atividade))) {
      setError('Valor da atividade deve ser um número válido');
      return;
    }

    if (formData.produtividade_minima && isNaN(parseFloat(formData.produtividade_minima))) {
      setError('Produtividade mínima deve ser um número válido');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        nome_atividade: convertToDbFormat(formData.nome_atividade),
        nivel_atividade: formData.nivel_atividade,
        valor_atividade: parseFloat(formData.valor_atividade),
        produtividade_minima: formData.produtividade_minima ? parseFloat(formData.produtividade_minima) : 0,
        unidade_medida: formData.unidade_medida
      };

      const url = editingActivity ? `/api/activities/${editingActivity.id}` : '/api/activities';
      const method = editingActivity ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        await loadActivities();
        setShowDialog(false);
        resetForm();
      } else {
        throw new Error('Erro ao salvar atividade');
      }
    } catch (error) {
      setError('Erro ao salvar atividade');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (activity: ActivityType) => {
    if (!confirm(`Tem certeza que deseja excluir a atividade "${activity.nome_atividade} - ${activity.nivel_atividade}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/activities/${activity.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await loadActivities();
      } else {
        alert('Erro ao excluir atividade');
      }
    } catch (error) {
      alert('Erro ao excluir atividade');
    }
  };

  const handleFuncaoChange = (funcao: string, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        funcoes_permitidas: [...prev.funcoes_permitidas, funcao]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        funcoes_permitidas: prev.funcoes_permitidas.filter(f => f !== funcao)
      }));
    }
  };

  const filteredActivities = activities.filter(activity => {
    const matchesSearch = activity.nome_atividade.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         activity.nivel_atividade.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
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
                  🏷️ Cadastro de Atividades
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
                    <span>➕ Nova Atividade</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
                  <div className="flex-1">
                    <Input
                      placeholder="🔍 Buscar por nome ou nível da atividade..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="flex space-x-4">
                    <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                      <option value="all">Todos Status</option>
                      <option value="active">Ativos</option>
                      <option value="inactive">Inativos</option>
                    </Select>
                    <Select value={categoriaFilter} onChange={(e) => setCategoriaFilter(e.target.value)}>
                      <option value="all">Todas Categorias</option>
                      {CATEGORIAS_ATIVIDADE.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Activities Table */}
            <Card>
              <CardHeader>
                <CardTitle>📋 Atividades Cadastradas</CardTitle>
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
                          <TableHead>Nome Atividade</TableHead>
                          <TableHead>Nível Atividade</TableHead>
                          <TableHead>Valor (R$)</TableHead>
                          <TableHead>Prod. Mín.</TableHead>
                          <TableHead>Unidade</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredActivities.map((activity) => (
                          <TableRow key={activity.id}>
                            <TableCell className="font-mono">
                              {String(activity.id).padStart(2, '0')}
                            </TableCell>
                            <TableCell className="font-medium">
                              {activity.nome_atividade}
                            </TableCell>
                            <TableCell>
                              {activity.nivel_atividade}
                            </TableCell>
                            <TableCell className="font-mono text-green-600">
                              R$ {activity.valor_atividade.toFixed(2)}
                            </TableCell>
                            <TableCell className="font-mono">
                              {activity.produtividade_minima || 0}
                            </TableCell>
                            <TableCell>
                              {activity.unidade_medida || 'unidades'}
                            </TableCell>
                            <TableCell>
                              <span className="inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                                <span>Ativo</span>
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openEditDialog(activity)}
                                  className="text-blue-600 hover:text-blue-800"
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleDelete(activity)}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                        {filteredActivities.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                              {searchTerm ? 'Nenhuma atividade encontrada com os filtros aplicados' : 'Nenhuma atividade cadastrada'}
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
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingActivity ? '✏️ Editar Atividade' : '➕ Nova Atividade'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Nome da Atividade *
                  </label>
                  <Input
                    value={formData.nome_atividade}
                    onChange={(e) => setFormData(prev => ({ ...prev, nome_atividade: e.target.value }))}
                    placeholder="ex: Prod Repack, Prod Retrabalho"
                    required
                  />
                  <p className="text-xs text-gray-500">
                    Ex: Prod Repack, Prod Retrabalho, Prod Amarração
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Nível da Atividade *
                  </label>
                  <Input
                    value={formData.nivel_atividade}
                    onChange={(e) => setFormData(prev => ({ ...prev, nivel_atividade: e.target.value }))}
                    placeholder="ex: Nível 1 (0 cxs/h)"
                    required
                  />
                  <p className="text-xs text-gray-500">
                    Ex: Nível 1 (0 cxs/h), Nível 2 (14.2 cxs/h)
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Valor da Atividade (R$) *
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.valor_atividade}
                    onChange={(e) => setFormData(prev => ({ ...prev, valor_atividade: e.target.value }))}
                    placeholder="0.00"
                    required
                  />
                  <p className="text-xs text-gray-500">
                    Ex: 0.05, 0.08, 0.10, 0.12
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Produtividade Mínima
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.produtividade_minima}
                    onChange={(e) => setFormData(prev => ({ ...prev, produtividade_minima: e.target.value }))}
                    placeholder="0.0"
                  />
                  <p className="text-xs text-gray-500">
                    Meta mínima para atingir o nível
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Unidade de Medida
                  </label>
                  <Select
                    value={formData.unidade_medida}
                    onChange={(e) => setFormData(prev => ({ ...prev, unidade_medida: e.target.value }))}
                  >
                    <option value="cxs/h">cxs/h</option>
                    <option value="plt/h">plt/h</option>
                    <option value="pct/h">pct/h</option>
                    <option value="unidades/h">unidades/h</option>
                    <option value="kg/h">kg/h</option>
                    <option value="m³/h">m³/h</option>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Categoria
                  </label>
                  <Select
                    value={formData.categoria}
                    onChange={(e) => setFormData(prev => ({ ...prev, categoria: e.target.value }))}
                  >
                    {CATEGORIAS_ATIVIDADE.map(categoria => (
                      <option key={categoria} value={categoria}>{categoria}</option>
                    ))}
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Funções Permitidas
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {FUNCOES_SISTEMA.map(funcao => (
                    <label key={funcao} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.funcoes_permitidas.includes(funcao)}
                        onChange={(e) => handleFuncaoChange(funcao, e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">{funcao}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Status</label>
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="status"
                        checked={formData.ativo}
                        onChange={() => setFormData(prev => ({ ...prev, ativo: true }))}
                      />
                      <span className="text-sm">🟢 Ativo</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="status"
                        checked={!formData.ativo}
                        onChange={() => setFormData(prev => ({ ...prev, ativo: false }))}
                      />
                      <span className="text-sm">🔴 Inativo</span>
                    </label>
                  </div>
                </div>
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
                  className="flex items-center space-x-2"
                >
                  <X className="h-4 w-4" />
                  <span>Cancelar</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  className="flex items-center space-x-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>🗑️ Limpar</span>
                </Button>
                <Button type="submit" disabled={submitting} className="flex items-center space-x-2">
                  <Save className="h-4 w-4" />
                  <span>{submitting ? 'Salvando...' : '💾 Salvar'}</span>
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AuthGuard>
  );
}
