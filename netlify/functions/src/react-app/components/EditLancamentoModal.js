"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = EditLancamentoModal;
const react_1 = require("react");
const lucide_react_1 = require("lucide-react");
const Dialog_1 = require("@/react-app/components/Dialog");
const Button_1 = require("@/react-app/components/Button");
const Input_1 = require("@/react-app/components/Input");
const Select_1 = require("@/react-app/components/Select");
const Card_1 = require("@/react-app/components/Card");
const useApi_1 = require("@/react-app/hooks/useApi");
function EditLancamentoModal({ open, onClose, lancamento, onSave }) {
    const { functions } = (0, useApi_1.useFunctions)();
    const { activityNames } = (0, useApi_1.useActivityNames)();
    const { kpis } = (0, useApi_1.useKPIs)();
    const { calculate, result, loading: calculating } = (0, useApi_1.useCalculator)();
    const [formData, setFormData] = (0, react_1.useState)({
        funcao: '',
        turno: 'Manhã',
        nome_atividade: '',
        quantidade_produzida: 0,
        tempo_horas: 0,
        input_adicional: 0,
        kpis_atingidos: [],
        multiple_activities: [],
        nome_operador: '',
        valid_tasks_count: 0,
    });
    const [multipleActivities, setMultipleActivities] = (0, react_1.useState)([]);
    const [editObservacoes, setEditObservacoes] = (0, react_1.useState)('');
    const [hasCalculated, setHasCalculated] = (0, react_1.useState)(false);
    (0, react_1.useEffect)(() => {
        if (lancamento && open) {
            // Parse JSON fields safely
            const kpisAtingidos = lancamento.kpis_atingidos ? JSON.parse(lancamento.kpis_atingidos) : [];
            const multipleActivitiesData = lancamento.multiple_activities ? JSON.parse(lancamento.multiple_activities) : [];
            setFormData({
                funcao: lancamento.funcao,
                turno: lancamento.turno,
                nome_atividade: lancamento.nome_atividade || '',
                quantidade_produzida: lancamento.quantidade_produzida || 0,
                tempo_horas: lancamento.tempo_horas || 0,
                input_adicional: lancamento.input_adicional || 0,
                kpis_atingidos: kpisAtingidos,
                multiple_activities: multipleActivitiesData,
                nome_operador: lancamento.nome_operador || '',
                valid_tasks_count: lancamento.valid_tasks_count || 0,
            });
            setMultipleActivities(multipleActivitiesData);
            setEditObservacoes('');
            setHasCalculated(false);
        }
    }, [lancamento, open]);
    const availableKPIs = kpis.filter(kpi => kpi.funcao_kpi === formData.funcao &&
        (kpi.turno_kpi === formData.turno || kpi.turno_kpi === 'Geral'));
    const handleKPIToggle = (kpiName) => {
        setFormData(prev => ({
            ...prev,
            kpis_atingidos: prev.kpis_atingidos?.includes(kpiName)
                ? prev.kpis_atingidos.filter(k => k !== kpiName)
                : [...(prev.kpis_atingidos || []), kpiName]
        }));
    };
    const addMultipleActivity = () => {
        setMultipleActivities(prev => [...prev, { nome_atividade: '', quantidade_produzida: 0, tempo_horas: 0 }]);
    };
    const updateMultipleActivity = (index, field, value) => {
        setMultipleActivities(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };
            return updated;
        });
    };
    const removeMultipleActivity = (index) => {
        setMultipleActivities(prev => prev.filter((_, i) => i !== index));
    };
    const handleCalculate = async () => {
        const calculatorInput = {
            ...formData,
            multiple_activities: formData.funcao === 'Ajudante de Armazém' ? multipleActivities.map(act => ({
                nome_atividade: act.nome_atividade,
                quantidade_produzida: act.quantidade_produzida,
                tempo_horas: act.tempo_horas
            })) : undefined,
        };
        await calculate(calculatorInput);
        setHasCalculated(true);
    };
    const handleSave = async () => {
        if (!result)
            return;
        const calculatorInput = {
            ...formData,
            multiple_activities: formData.funcao === 'Ajudante de Armazém' ? multipleActivities : undefined,
        };
        await onSave(calculatorInput, result);
        onClose();
    };
    if (!lancamento)
        return null;
    return (<Dialog_1.Dialog open={open} onOpenChange={onClose}>
      <Dialog_1.DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <Dialog_1.DialogHeader>
          <Dialog_1.DialogTitle className="flex items-center space-x-2">
            <lucide_react_1.FileText className="h-5 w-5"/>
            <span>Editar Lançamento - {lancamento.user_nome}</span>
          </Dialog_1.DialogTitle>
        </Dialog_1.DialogHeader>

        <div className="space-y-6">
          {/* Original vs New Values Comparison */}
          <Card_1.Card className="bg-amber-50 border-amber-200">
            <Card_1.CardHeader>
              <Card_1.CardTitle className="text-amber-800 text-sm">Valores Originais</Card_1.CardTitle>
            </Card_1.CardHeader>
            <Card_1.CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-amber-600">Remuneração Total:</span>
                  <p className="font-semibold text-amber-900">R$ {lancamento.remuneracao_total.toFixed(2)}</p>
                </div>
                <div>
                  <span className="text-amber-600">Atividades:</span>
                  <p className="font-semibold text-amber-900">R$ {lancamento.subtotal_atividades.toFixed(2)}</p>
                </div>
                <div>
                  <span className="text-amber-600">KPIs:</span>
                  <p className="font-semibold text-amber-900">R$ {lancamento.bonus_kpis.toFixed(2)}</p>
                </div>
                {lancamento.produtividade_alcancada && (<div>
                    <span className="text-amber-600">Produtividade:</span>
                    <p className="font-semibold text-amber-900">{lancamento.produtividade_alcancada.toFixed(2)}</p>
                  </div>)}
              </div>
            </Card_1.CardContent>
          </Card_1.Card>

          {/* Edit Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Função</label>
                <Select_1.Select value={formData.funcao} onChange={(e) => setFormData(prev => ({ ...prev, funcao: e.target.value }))}>
                  <option value="">Selecione uma função</option>
                  {functions.map((func) => (<option key={func.funcao} value={func.funcao}>{func.funcao}</option>))}
                </Select_1.Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Turno</label>
                <Select_1.Select value={formData.turno} onChange={(e) => setFormData(prev => ({ ...prev, turno: e.target.value }))}>
                  <option value="Manhã">Manhã</option>
                  <option value="Tarde">Tarde</option>
                  <option value="Noite">Noite</option>
                </Select_1.Select>
              </div>
            </div>

            {/* Activity Fields */}
            <div className="space-y-4">
              {formData.funcao !== 'Ajudante de Armazém' && formData.funcao !== 'Operador de Empilhadeira' && (<>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Atividade</label>
                    <Select_1.Select value={formData.nome_atividade || ''} onChange={(e) => setFormData(prev => ({ ...prev, nome_atividade: e.target.value }))}>
                      <option value="">Selecione uma atividade</option>
                      {activityNames.map((activity) => (<option key={activity.nome_atividade} value={activity.nome_atividade}>
                          {activity.nome_atividade}
                        </option>))}
                    </Select_1.Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Quantidade</label>
                      <Input_1.Input type="number" value={formData.quantidade_produzida || ''} onChange={(e) => setFormData(prev => ({ ...prev, quantidade_produzida: Number(e.target.value) }))}/>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Tempo (horas)</label>
                      <Input_1.Input type="number" step="0.1" value={formData.tempo_horas || ''} onChange={(e) => setFormData(prev => ({ ...prev, tempo_horas: Number(e.target.value) }))}/>
                    </div>
                  </div>
                </>)}

              {formData.funcao === 'Operador de Empilhadeira' && (<>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nome do Operador</label>
                    <Input_1.Input value={formData.nome_operador || ''} onChange={(e) => setFormData(prev => ({ ...prev, nome_operador: e.target.value }))}/>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tarefas Válidas</label>
                    <Input_1.Input type="number" value={formData.valid_tasks_count || ''} onChange={(e) => setFormData(prev => ({ ...prev, valid_tasks_count: Number(e.target.value) }))}/>
                  </div>
                </>)}
            </div>
          </div>

          {/* Multiple Activities for Ajudante de Armazém */}
          {formData.funcao === 'Ajudante de Armazém' && (<Card_1.Card>
              <Card_1.CardHeader>
                <Card_1.CardTitle className="text-sm">Múltiplas Atividades</Card_1.CardTitle>
              </Card_1.CardHeader>
              <Card_1.CardContent className="space-y-4">
                {multipleActivities.map((activity, index) => (<div key={index} className="grid grid-cols-4 gap-4 p-4 border rounded-lg">
                    <Select_1.Select value={activity.nome_atividade} onChange={(e) => updateMultipleActivity(index, 'nome_atividade', e.target.value)}>
                      <option value="">Selecione atividade</option>
                      {activityNames.map((act) => (<option key={act.nome_atividade} value={act.nome_atividade}>
                          {act.nome_atividade}
                        </option>))}
                    </Select_1.Select>
                    <Input_1.Input type="number" placeholder="Quantidade" value={activity.quantidade_produzida || ''} onChange={(e) => updateMultipleActivity(index, 'quantidade_produzida', Number(e.target.value))}/>
                    <Input_1.Input type="number" step="0.1" placeholder="Tempo (h)" value={activity.tempo_horas || ''} onChange={(e) => updateMultipleActivity(index, 'tempo_horas', Number(e.target.value))}/>
                    <Button_1.Button variant="destructive" size="sm" onClick={() => removeMultipleActivity(index)}>
                      <lucide_react_1.X className="h-4 w-4"/>
                    </Button_1.Button>
                  </div>))}
                <Button_1.Button variant="outline" onClick={addMultipleActivity}>
                  Adicionar Atividade
                </Button_1.Button>
              </Card_1.CardContent>
            </Card_1.Card>)}

          {/* KPIs Section */}
          {availableKPIs.length > 0 && (<Card_1.Card>
              <Card_1.CardHeader>
                <Card_1.CardTitle className="text-sm">KPIs Disponíveis</Card_1.CardTitle>
              </Card_1.CardHeader>
              <Card_1.CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {availableKPIs.map((kpi) => (<label key={kpi.id} className="flex items-center space-x-2 cursor-pointer">
                      <input type="checkbox" checked={formData.kpis_atingidos?.includes(kpi.nome_kpi) || false} onChange={() => handleKPIToggle(kpi.nome_kpi)} className="rounded"/>
                      <span className="text-sm">
                        {kpi.nome_kpi} (R$ {kpi.peso_kpi.toFixed(2)})
                      </span>
                    </label>))}
                </div>
              </Card_1.CardContent>
            </Card_1.Card>)}

          {/* Input Adicional */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Valor Adicional (opcional)
            </label>
            <Input_1.Input type="number" step="0.01" value={formData.input_adicional || ''} onChange={(e) => setFormData(prev => ({ ...prev, input_adicional: Number(e.target.value) }))} placeholder="R$ 0,00"/>
          </div>

          {/* Observações da Edição */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observações da Edição
            </label>
            <Input_1.Input value={editObservacoes} onChange={(e) => setEditObservacoes(e.target.value)} placeholder="Justifique as alterações realizadas..."/>
          </div>

          {/* Calculate Button */}
          <Button_1.Button onClick={handleCalculate} disabled={calculating} className="w-full">
            <lucide_react_1.Clock className="h-4 w-4 mr-2"/>
            {calculating ? 'Calculando...' : 'Recalcular com Novos Valores'}
          </Button_1.Button>

          {/* Results Preview */}
          {result && hasCalculated && (<Card_1.Card className="bg-green-50 border-green-200">
              <Card_1.CardHeader>
                <Card_1.CardTitle className="text-green-800 text-sm">Novos Valores Calculados</Card_1.CardTitle>
              </Card_1.CardHeader>
              <Card_1.CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-green-600">Nova Remuneração:</span>
                    <p className="font-semibold text-green-900">R$ {result.remuneracao_total.toFixed(2)}</p>
                  </div>
                  <div>
                    <span className="text-green-600">Atividades:</span>
                    <p className="font-semibold text-green-900">R$ {result.subtotal_atividades.toFixed(2)}</p>
                  </div>
                  <div>
                    <span className="text-green-600">KPIs:</span>
                    <p className="font-semibold text-green-900">R$ {result.bonus_kpis.toFixed(2)}</p>
                  </div>
                  {result.produtividade_alcancada && (<div>
                      <span className="text-green-600">Produtividade:</span>
                      <p className="font-semibold text-green-900">{result.produtividade_alcancada.toFixed(2)}</p>
                    </div>)}
                </div>
                
                {/* Difference Indicator */}
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-blue-700 text-sm font-medium">
                    Diferença: R$ {(result.remuneracao_total - lancamento.remuneracao_total).toFixed(2)}
                    {result.remuneracao_total > lancamento.remuneracao_total ? ' (aumento)' : ' (redução)'}
                  </p>
                </div>
              </Card_1.CardContent>
            </Card_1.Card>)}

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4 border-t">
            <Button_1.Button variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button_1.Button>
            <Button_1.Button onClick={handleSave} disabled={!result || !hasCalculated} className="flex-1 bg-green-600 hover:bg-green-700">
              <lucide_react_1.Save className="h-4 w-4 mr-2"/>
              Salvar e Aprovar
            </Button_1.Button>
          </div>
        </div>
      </Dialog_1.DialogContent>
    </Dialog_1.Dialog>);
}
