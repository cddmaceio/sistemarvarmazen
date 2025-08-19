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
exports.default = CadastroKPIs;
const react_1 = __importStar(require("react"));
const lucide_react_1 = require("lucide-react");
const Card_1 = require("@/react-app/components/Card");
const Button_1 = require("@/react-app/components/Button");
const Input_1 = require("@/react-app/components/Input");
const Select_1 = require("@/react-app/components/Select");
const Dialog_1 = require("@/react-app/components/Dialog");
const Alert_1 = require("@/react-app/components/Alert");
const Table_1 = require("@/react-app/components/Table");
const useApi_1 = require("@/react-app/hooks/useApi");
function CadastroKPIs() {
    const { kpis, loading, error, createKPI, updateKPI, deleteKPI } = (0, useApi_1.useKPIs)();
    const [showDialog, setShowDialog] = (0, react_1.useState)(false);
    const [editingKPI, setEditingKPI] = (0, react_1.useState)(null);
    const [formData, setFormData] = (0, react_1.useState)({
        nome_kpi: '',
        descricao: '',
        valor_meta_kpi: '',
        peso_kpi: '',
        turno_kpi: 'Manhã',
        funcao_kpi: 'Ajudante de Armazém',
        status_ativo: true
    });
    const [submitError, setSubmitError] = (0, react_1.useState)(null);
    const [submitting, setSubmitting] = (0, react_1.useState)(false);
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
    return (<div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Gestão de KPIs
            </h1>
            <p className="text-gray-600 mt-2">
              Configure indicadores de performance por função e turno
            </p>
          </div>
          <Button_1.Button onClick={openAddDialog} className="flex items-center space-x-2">
            <lucide_react_1.Plus className="h-4 w-4"/>
            <span>Novo KPI</span>
          </Button_1.Button>
        </div>

        {error && (<Alert_1.Alert variant="destructive">
            <Alert_1.AlertDescription>{error}</Alert_1.AlertDescription>
          </Alert_1.Alert>)}

        <Card_1.Card>
          <Card_1.CardHeader>
            <Card_1.CardTitle className="flex items-center space-x-2">
              <lucide_react_1.Target className="h-5 w-5"/>
              <span>KPIs Cadastrados ({kpis.length})</span>
            </Card_1.CardTitle>
          </Card_1.CardHeader>
          <Card_1.CardContent>
            <div className="space-y-6">
              {Object.keys(groupedKPIs).length === 0 ? (<div className="text-center py-8 text-gray-500">
                  <lucide_react_1.Target className="h-12 w-12 mx-auto mb-4 opacity-50"/>
                  <p>Nenhum KPI cadastrado</p>
                  <p className="text-sm">Clique em "Novo KPI" para começar</p>
                </div>) : (Object.entries(groupedKPIs).map(([group, groupKPIs]) => (<Card_1.Card key={group} className="border-l-4 border-l-blue-500">
                    <Card_1.CardHeader className="pb-3">
                      <Card_1.CardTitle className="text-lg text-blue-700">
                        {group}
                      </Card_1.CardTitle>
                    </Card_1.CardHeader>
                    <Card_1.CardContent>
                      <Table_1.Table>
                        <Table_1.TableHeader>
                          <Table_1.TableRow>
                            <Table_1.TableHead>Nome do KPI</Table_1.TableHead>
                            <Table_1.TableHead>Descrição</Table_1.TableHead>
                            <Table_1.TableHead>Meta</Table_1.TableHead>
                            <Table_1.TableHead>Peso</Table_1.TableHead>
                            <Table_1.TableHead>Status</Table_1.TableHead>
                            <Table_1.TableHead>Ações</Table_1.TableHead>
                          </Table_1.TableRow>
                        </Table_1.TableHeader>
                        <Table_1.TableBody>
                          {groupKPIs.map((kpi) => (<Table_1.TableRow key={kpi.id}>
                              <Table_1.TableCell className="font-medium">{kpi.nome_kpi}</Table_1.TableCell>
                              <Table_1.TableCell className="max-w-xs">
                                <span className="text-sm text-gray-600 line-clamp-2">
                                  {kpi.descricao || 'Sem descrição'}
                                </span>
                              </Table_1.TableCell>
                              <Table_1.TableCell>{kpi.valor_meta_kpi}</Table_1.TableCell>
                              <Table_1.TableCell>R$ {kpi.peso_kpi.toFixed(2)}</Table_1.TableCell>
                              <Table_1.TableCell>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${kpi.status_ativo !== false
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'}`}>
                                  {kpi.status_ativo !== false ? 'Ativo' : 'Inativo'}
                                </span>
                              </Table_1.TableCell>
                              <Table_1.TableCell>
                                <div className="flex items-center space-x-2">
                                  <Button_1.Button variant="outline" size="sm" onClick={() => openEditDialog(kpi)}>
                                    <lucide_react_1.Edit className="h-3 w-3"/>
                                  </Button_1.Button>
                                  <Button_1.Button variant="outline" size="sm" onClick={() => toggleStatus(kpi)} className={kpi.status_ativo !== false ? 'text-red-600' : 'text-green-600'}>
                                    {kpi.status_ativo !== false ? <lucide_react_1.EyeOff className="h-3 w-3"/> : <lucide_react_1.Eye className="h-3 w-3"/>}
                                  </Button_1.Button>
                                  <Button_1.Button variant="destructive" size="sm" onClick={() => handleDelete(kpi)}>
                                    <lucide_react_1.Trash2 className="h-3 w-3"/>
                                  </Button_1.Button>
                                </div>
                              </Table_1.TableCell>
                            </Table_1.TableRow>))}
                        </Table_1.TableBody>
                      </Table_1.Table>
                    </Card_1.CardContent>
                  </Card_1.Card>)))}
            </div>
          </Card_1.CardContent>
        </Card_1.Card>

        {/* Add/Edit KPI Dialog */}
        <Dialog_1.Dialog open={showDialog} onOpenChange={setShowDialog}>
          <Dialog_1.DialogContent className="max-w-md">
            <Dialog_1.DialogHeader>
              <Dialog_1.DialogTitle>
                {editingKPI ? 'Editar KPI' : 'Novo KPI'}
              </Dialog_1.DialogTitle>
            </Dialog_1.DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Nome do KPI *</label>
                <Input_1.Input value={formData.nome_kpi} onChange={(e) => setFormData(prev => ({ ...prev, nome_kpi: e.target.value }))} placeholder="Ex: Taxa de Produtividade" required/>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Descrição</label>
                <textarea value={formData.descricao} onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))} placeholder="Descreva o objetivo deste KPI..." className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none" rows={3}/>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Meta *</label>
                  <Input_1.Input type="number" step="0.01" value={formData.valor_meta_kpi} onChange={(e) => setFormData(prev => ({ ...prev, valor_meta_kpi: e.target.value }))} placeholder="0.00" required/>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Peso (R$) *</label>
                  <Input_1.Input type="number" step="0.01" value={formData.peso_kpi} onChange={(e) => setFormData(prev => ({ ...prev, peso_kpi: e.target.value }))} placeholder="0.00" required/>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Função *</label>
                <Select_1.Select value={formData.funcao_kpi} onChange={(e) => setFormData(prev => ({ ...prev, funcao_kpi: e.target.value }))}>
                  {funcoes.map(funcao => (<option key={funcao} value={funcao}>{funcao}</option>))}
                </Select_1.Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Turno *</label>
                <Select_1.Select value={formData.turno_kpi} onChange={(e) => setFormData(prev => ({ ...prev, turno_kpi: e.target.value }))}>
                  {turnos.map(turno => (<option key={turno} value={turno}>{turno}</option>))}
                </Select_1.Select>
              </div>

              <div className="flex items-center space-x-2">
                <input type="checkbox" id="status_ativo" checked={formData.status_ativo} onChange={(e) => setFormData(prev => ({ ...prev, status_ativo: e.target.checked }))} className="rounded border-gray-300"/>
                <label htmlFor="status_ativo" className="text-sm font-medium text-gray-700">
                  KPI ativo
                </label>
              </div>

              {submitError && (<Alert_1.Alert variant="destructive">
                  <Alert_1.AlertDescription>{submitError}</Alert_1.AlertDescription>
                </Alert_1.Alert>)}

              <div className="flex justify-end space-x-2 pt-4">
                <Button_1.Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                  Cancelar
                </Button_1.Button>
                <Button_1.Button type="submit" disabled={submitting}>
                  {submitting ? 'Salvando...' : (editingKPI ? 'Atualizar' : 'Criar')}
                </Button_1.Button>
              </div>
            </form>
          </Dialog_1.DialogContent>
        </Dialog_1.Dialog>
      </div>
    </div>);
}
