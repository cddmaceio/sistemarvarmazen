import React, { useState } from 'react';
import { Target, Plus, Edit, Trash2, Eye, EyeOff, ArrowLeft, Settings } from 'lucide-react';
import { Link } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '@/react-app/components/Card';
import { Button } from '@/react-app/components/Button';
import { Input } from '@/react-app/components/Input';
import { Select } from '@/react-app/components/Select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/react-app/components/Dialog';
import { Alert, AlertDescription } from '@/react-app/components/Alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/react-app/components/Table';
import AuthGuard from '@/react-app/components/AuthGuard';
import UserMenu from '@/react-app/components/UserMenu';
import { useKPIs } from '@/react-app/hooks/useApi';
export default function CadastroKPIsStandalone() {
    const { kpis, loading, error, createKPI, updateKPI, deleteKPI } = useKPIs();
    const [showDialog, setShowDialog] = useState(false);
    const [editingKPI, setEditingKPI] = useState(null);
    const [formData, setFormData] = useState({
        nome_kpi: '',
        descricao: '',
        valor_meta_kpi: '',
        peso_kpi: '',
        turno_kpi: 'Manhã',
        funcao_kpi: 'Ajudante de Armazém',
        status_ativo: true
    });
    const [submitError, setSubmitError] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const funcoes = [
        'Ajudante de Armazém',
        'Operador de Empilhadeira',
        'Conferente',
        'Líder de Equipe',
        'Supervisor'
    ];
    const turnos = ['Manhã', 'Tarde', 'Noite', 'Geral'];
    const resetForm = () => {
        setFormData({
            nome_kpi: '',
            descricao: '',
            valor_meta_kpi: '',
            peso_kpi: '',
            turno_kpi: 'Manhã',
            funcao_kpi: 'Ajudante de Armazém',
            status_ativo: true
        });
        setEditingKPI(null);
        setSubmitError(null);
    };
    const openAddDialog = () => {
        resetForm();
        setShowDialog(true);
    };
    const openEditDialog = (kpi) => {
        setFormData({
            nome_kpi: kpi.nome_kpi,
            descricao: kpi.descricao || '',
            valor_meta_kpi: kpi.valor_meta_kpi.toString(),
            peso_kpi: kpi.peso_kpi.toString(),
            turno_kpi: kpi.turno_kpi,
            funcao_kpi: kpi.funcao_kpi,
            status_ativo: kpi.status_ativo !== false
        });
        setEditingKPI(kpi);
        setShowDialog(true);
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitError(null);
        if (!formData.nome_kpi || !formData.valor_meta_kpi || !formData.peso_kpi) {
            setSubmitError('Nome do KPI, meta e peso são obrigatórios');
            return;
        }
        const valor_meta = parseFloat(formData.valor_meta_kpi);
        const peso = parseFloat(formData.peso_kpi);
        if (isNaN(valor_meta) || valor_meta < 0) {
            setSubmitError('Meta deve ser um número válido maior ou igual a zero');
            return;
        }
        if (isNaN(peso) || peso < 0) {
            setSubmitError('Peso deve ser um número válido maior ou igual a zero');
            return;
        }
        try {
            setSubmitting(true);
            const kpiData = {
                nome_kpi: formData.nome_kpi,
                descricao: formData.descricao,
                valor_meta_kpi: valor_meta,
                peso_kpi: peso,
                turno_kpi: formData.turno_kpi,
                funcao_kpi: formData.funcao_kpi,
                status_ativo: formData.status_ativo
            };
            if (editingKPI) {
                await updateKPI(editingKPI.id, kpiData);
            }
            else {
                await createKPI(kpiData);
            }
            setShowDialog(false);
            resetForm();
        }
        catch (error) {
            setSubmitError('Erro ao salvar KPI');
        }
        finally {
            setSubmitting(false);
        }
    };
    const handleDelete = async (kpi) => {
        if (confirm(`Tem certeza que deseja excluir o KPI "${kpi.nome_kpi}"?`)) {
            try {
                await deleteKPI(kpi.id);
            }
            catch (error) {
                console.error('Error deleting KPI:', error);
            }
        }
    };
    const toggleStatus = async (kpi) => {
        try {
            const newStatus = !kpi.status_ativo;
            await updateKPI(kpi.id, { status_ativo: newStatus });
        }
        catch (error) {
            console.error('Error toggling KPI status:', error);
        }
    };
    // Group KPIs by function and shift for better visualization
    const groupedKPIs = kpis.reduce((acc, kpi) => {
        const key = `${kpi.funcao_kpi} - ${kpi.turno_kpi}`;
        if (!acc[key])
            acc[key] = [];
        acc[key].push(kpi);
        return acc;
    }, {});
    if (loading) {
        return (<div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando KPIs...</p>
        </div>
      </div>);
    }
    return (<AuthGuard requireAdmin>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        {/* Header */}
        <header className="border-b bg-white/70 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Link to="/admin">
                  <Button variant="outline" size="sm">
                    <ArrowLeft className="h-4 w-4 mr-2"/>
                    Voltar ao Admin
                  </Button>
                </Link>
                <div className="flex items-center space-x-2">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                    <Target className="h-5 w-5 text-white"/>
                  </div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                    Gestão de KPIs
                  </h1>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Link to="/">
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4 mr-2"/>
                    Calculadora
                  </Button>
                </Link>
                <UserMenu />
              </div>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 mt-2">
                Configure indicadores de performance por função e turno
              </p>
            </div>
            <Button onClick={openAddDialog} className="flex items-center space-x-2">
              <Plus className="h-4 w-4"/>
              <span>Novo KPI</span>
            </Button>
          </div>

          {error && (<Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>)}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="h-5 w-5"/>
                <span>KPIs Cadastrados ({kpis.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {Object.keys(groupedKPIs).length === 0 ? (<div className="text-center py-8 text-gray-500">
                    <Target className="h-12 w-12 mx-auto mb-4 opacity-50"/>
                    <p>Nenhum KPI cadastrado</p>
                    <p className="text-sm">Clique em "Novo KPI" para começar</p>
                  </div>) : (Object.entries(groupedKPIs).map(([group, groupKPIs]) => (<Card key={group} className="border-l-4 border-l-blue-500">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg text-blue-700">
                          {group}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Nome do KPI</TableHead>
                              <TableHead>Descrição</TableHead>
                              <TableHead>Meta</TableHead>
                              <TableHead>Peso</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Ações</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {groupKPIs.map((kpi) => (<TableRow key={kpi.id}>
                                <TableCell className="font-medium">{kpi.nome_kpi}</TableCell>
                                <TableCell className="max-w-xs">
                                  <span className="text-sm text-gray-600 line-clamp-2">
                                    {kpi.descricao || 'Sem descrição'}
                                  </span>
                                </TableCell>
                                <TableCell>{kpi.valor_meta_kpi}</TableCell>
                                <TableCell>R$ {kpi.peso_kpi.toFixed(2)}</TableCell>
                                <TableCell>
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${kpi.status_ativo !== false
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'}`}>
                                    {kpi.status_ativo !== false ? 'Ativo' : 'Inativo'}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center space-x-2">
                                    <Button variant="outline" size="sm" onClick={() => openEditDialog(kpi)}>
                                      <Edit className="h-3 w-3"/>
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => toggleStatus(kpi)} className={kpi.status_ativo !== false ? 'text-red-600' : 'text-green-600'}>
                                      {kpi.status_ativo !== false ? <EyeOff className="h-3 w-3"/> : <Eye className="h-3 w-3"/>}
                                    </Button>
                                    <Button variant="destructive" size="sm" onClick={() => handleDelete(kpi)}>
                                      <Trash2 className="h-3 w-3"/>
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>)))}
              </div>
            </CardContent>
          </Card>

          {/* Add/Edit KPI Dialog */}
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingKPI ? 'Editar KPI' : 'Novo KPI'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Nome do KPI *</label>
                  <Input value={formData.nome_kpi} onChange={(e) => setFormData(prev => ({ ...prev, nome_kpi: e.target.value }))} placeholder="Ex: Taxa de Produtividade" required/>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Descrição</label>
                  <textarea value={formData.descricao} onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))} placeholder="Descreva o objetivo deste KPI..." className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none" rows={3}/>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Meta *</label>
                    <Input type="number" step="0.01" value={formData.valor_meta_kpi} onChange={(e) => setFormData(prev => ({ ...prev, valor_meta_kpi: e.target.value }))} placeholder="0.00" required/>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Peso (R$) *</label>
                    <Input type="number" step="0.01" value={formData.peso_kpi} onChange={(e) => setFormData(prev => ({ ...prev, peso_kpi: e.target.value }))} placeholder="0.00" required/>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Função *</label>
                  <Select value={formData.funcao_kpi} onChange={(e) => setFormData(prev => ({ ...prev, funcao_kpi: e.target.value }))}>
                    {funcoes.map(funcao => (<option key={funcao} value={funcao}>{funcao}</option>))}
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Turno *</label>
                  <Select value={formData.turno_kpi} onChange={(e) => setFormData(prev => ({ ...prev, turno_kpi: e.target.value }))}>
                    {turnos.map(turno => (<option key={turno} value={turno}>{turno}</option>))}
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="status_ativo" checked={formData.status_ativo} onChange={(e) => setFormData(prev => ({ ...prev, status_ativo: e.target.checked }))} className="rounded border-gray-300"/>
                  <label htmlFor="status_ativo" className="text-sm font-medium text-gray-700">
                    KPI ativo
                  </label>
                </div>

                {submitError && (<Alert variant="destructive">
                    <AlertDescription>{submitError}</AlertDescription>
                  </Alert>)}

                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? 'Salvando...' : (editingKPI ? 'Atualizar' : 'Criar')}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </AuthGuard>);
}
