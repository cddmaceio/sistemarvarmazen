import { useState, useEffect } from 'react';
import { Clock, FileText, Save, Plus, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/Dialog';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Select } from '@/components/Select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import { LancamentoType, CalculatorInputType, CalculatorResultType } from '@/shared/types';
import { useAvailableKPIs, useActivityNames, useFunctions, useCalculator } from '@/hooks/useApi';
import { useAuth } from '@/hooks/useAuth';
import { TURNO_UI_TO_DB } from '@/shared/utils/encoding';

interface EditLancamentoModalProps {
  open: boolean;
  onClose: () => void;
  lancamento: LancamentoType | null;
  onSave: (editedData: CalculatorInputType, result: CalculatorResultType) => Promise<void>;
}

export default function EditLancamentoModal({ open, onClose, lancamento, onSave }: EditLancamentoModalProps) {
  const { functions } = useFunctions();
  const { activityNames } = useActivityNames();
  const { kpis: availableKPIs, fetchAvailableKPIs } = useAvailableKPIs();
  const { calculate, result, loading: calculating } = useCalculator();
  const { userFunction, userTurno } = useAuth();
  
  const [formData, setFormData] = useState<CalculatorInputType>({
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
  
  const [multipleActivities, setMultipleActivities] = useState<{ nome_atividade: string; quantidade_produzida: number; tempo_horas: number; }[]>([]);
  const [editObservacoes, setEditObservacoes] = useState('');
  const [hasCalculated, setHasCalculated] = useState(false);
  const [hasMultipleActivities, setHasMultipleActivities] = useState(false);

  useEffect(() => {
    if (lancamento && open) {
      // Parse JSON fields safely
      const kpisAtingidos = lancamento.kpis_atingidos ? JSON.parse(lancamento.kpis_atingidos) : [];
      const multipleActivitiesData = lancamento.multiple_activities ? JSON.parse(lancamento.multiple_activities) : [];
      
      // Detectar se há múltiplas atividades
      // Se há mais de uma atividade no array OU se há dados no campo multiple_activities mas não há atividade única
      const hasMultiple = multipleActivitiesData.length > 1 || 
                         (multipleActivitiesData.length > 0 && !lancamento.nome_atividade);
       
      setHasMultipleActivities(hasMultiple);
      
      // Usar os dados de múltiplas atividades se existirem
      let activitiesForEditing = multipleActivitiesData;

      setFormData({
        funcao: lancamento.funcao, // Use original launch user function
        turno: lancamento.turno as 'Manhã' | 'Tarde' | 'Noite', // Use original launch user shift
        nome_atividade: lancamento.nome_atividade || '',
        quantidade_produzida: lancamento.quantidade_produzida || 0,
        tempo_horas: lancamento.tempo_horas || 0,
        input_adicional: lancamento.input_adicional || 0,
        kpis_atingidos: kpisAtingidos,
        multiple_activities: activitiesForEditing,
        nome_operador: lancamento.nome_operador || '',
        valid_tasks_count: lancamento.valid_tasks_count || 0,
      });

      setMultipleActivities(activitiesForEditing);
      setEditObservacoes('');
      setHasCalculated(false);
      
      // Buscar KPIs disponíveis para a função e turno do usuário original do lançamento
      fetchAvailableKPIs(lancamento.funcao, lancamento.turno);
    }
  }, [lancamento, open]);

  // Os KPIs já estão filtrados pela API baseados na função e turno do usuário original
  const kpisForDisplay = availableKPIs || [];

  const handleKPIToggle = (kpiName: string) => {
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

  const toggleMultipleActivitiesMode = () => {
    if (!hasMultipleActivities) {
      // Converter atividade única para múltiplas
      const currentActivity = {
        nome_atividade: formData.nome_atividade || '',
        quantidade_produzida: formData.quantidade_produzida || 0,
        tempo_horas: formData.tempo_horas || 0
      };
      setMultipleActivities([currentActivity]);
      setHasMultipleActivities(true);
    } else {
      // Converter múltiplas para atividade única (usar a primeira)
      if (multipleActivities.length > 0) {
        const firstActivity = multipleActivities[0];
        setFormData(prev => ({
          ...prev,
          nome_atividade: firstActivity.nome_atividade,
          quantidade_produzida: firstActivity.quantidade_produzida,
          tempo_horas: firstActivity.tempo_horas
        }));
      }
      setHasMultipleActivities(false);
    }
  };

  const updateMultipleActivity = (index: number, field: string, value: any) => {
    setMultipleActivities(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const removeMultipleActivity = (index: number) => {
    // Impede remover se há apenas uma atividade
    if (multipleActivities.length <= 1) {
      return;
    }
    setMultipleActivities(prev => prev.filter((_, i) => i !== index));
  };

  const handleCalculate = async () => {
    const validActivities = multipleActivities.filter(act => act.nome_atividade && act.nome_atividade.trim() !== '');
    const calculatorInput = {
      ...formData,
      turno: (TURNO_UI_TO_DB[formData.turno] || formData.turno) as "Manhã" | "Tarde" | "Noite" | "Manha",
      multiple_activities: hasMultipleActivities && formData.funcao !== 'Operador de Empilhadeira' ? validActivities.map(act => ({
        nome_atividade: act.nome_atividade,
        quantidade_produzida: act.quantidade_produzida,
        tempo_horas: act.tempo_horas
      })) : undefined,
    };
    
    console.log('🔄 EditLancamentoModal - Converting turno for API:', {
      original: formData.turno,
      converted: calculatorInput.turno
    });
    
    await calculate(calculatorInput);
    setHasCalculated(true);
  };

  const handleSave = async () => {
    if (!result) return;

    const validActivities = multipleActivities.filter(act => act.nome_atividade && act.nome_atividade.trim() !== '');
    const calculatorInput = {
      ...formData,
      turno: (TURNO_UI_TO_DB[formData.turno] || formData.turno) as "Manhã" | "Tarde" | "Noite" | "Manha",
      multiple_activities: hasMultipleActivities && formData.funcao !== 'Operador de Empilhadeira' ? validActivities : undefined,
    };

    await onSave(calculatorInput, result);
    onClose();
  };

  if (!lancamento) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-[95vw] sm:max-w-2xl lg:max-w-4xl max-h-[90vh] overflow-y-auto mx-4">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Editar Lançamento - {lancamento.user_nome}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Original vs New Values Comparison */}
          <Card className="bg-amber-50 border-amber-200">
            <CardHeader>
              <CardTitle className="text-amber-800 text-sm">Valores Originais</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-amber-600">Remuneração Total:</span>
                  <p className="font-semibold text-amber-900">R$ {(lancamento.remuneracao_total || 0).toFixed(2)}</p>
                </div>
                <div>
                  <span className="text-amber-600">Atividades:</span>
                  <p className="font-semibold text-amber-900">R$ {(lancamento.subtotal_atividades || 0).toFixed(2)}</p>
                  {/* Display launched activities */}
                  <div className="mt-1 text-xs text-amber-700">
                    {(() => {
                      const activities = [];
                      if (lancamento.nome_atividade) {
                        activities.push(lancamento.nome_atividade);
                      }
                      if (lancamento.multiple_activities) {
                        try {
                          const multipleActs = JSON.parse(lancamento.multiple_activities);
                          multipleActs.forEach((act: any) => {
                            if (act.nome_atividade) activities.push(act.nome_atividade);
                          });
                        } catch (e) {}
                      }
                      return activities.length > 0 ? activities.join(', ') : 'Nenhuma atividade';
                    })()}
                  </div>
                </div>
                <div>
                  <span className="text-amber-600">KPIs:</span>
                  <p className="font-semibold text-amber-900">R$ {(lancamento.bonus_kpis || 0).toFixed(2)}</p>
                  {/* Display launched KPIs */}
                  <div className="mt-1 text-xs text-amber-700">
                    {(() => {
                      try {
                        const kpisAtingidos = lancamento.kpis_atingidos ? JSON.parse(lancamento.kpis_atingidos) : [];
                        return kpisAtingidos.length > 0 ? kpisAtingidos.join(', ') : 'Nenhum KPI';
                      } catch (e) {
                        return 'Nenhum KPI';
                      }
                    })()}
                  </div>
                </div>
                {lancamento.produtividade_alcancada && (
                  <div>
                    <span className="text-amber-600">Produtividade:</span>
                    <p className="font-semibold text-amber-900">{(lancamento.produtividade_alcancada || 0).toFixed(2)}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Edit Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Função</label>
                <Select
                  value={formData.funcao}
                  onChange={(e) => setFormData(prev => ({ ...prev, funcao: e.target.value }))}
                  disabled={true}
                  className="bg-gray-100 cursor-not-allowed"
                >
                  <option value="">Selecione uma função</option>
                  {functions.map((func: any) => (
                    <option key={func.funcao} value={func.funcao}>{func.funcao}</option>
                  ))}
                </Select>
                <p className="text-xs text-gray-500 mt-1">Função bloqueada - carregada do usuário logado</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Turno</label>
                <Select
                  value={formData.turno}
                  onChange={(e) => setFormData(prev => ({ ...prev, turno: e.target.value as any }))}
                  disabled={true}
                  className="bg-gray-100 cursor-not-allowed"
                >
                  <option value="Manhã">Manhã</option>
                  <option value="Tarde">Tarde</option>
                  <option value="Noite">Noite</option>
                </Select>
                <p className="text-xs text-gray-500 mt-1">Turno bloqueado - carregado do usuário logado</p>
              </div>
            </div>

            {/* Toggle Multiple Activities Mode */}
            {userFunction !== 'Operador de Empilhadeira' && (
              <div className="flex flex-col gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-blue-900">
                    {hasMultipleActivities ? 'Modo: Múltiplas Atividades' : 'Modo: Atividade Única'}
                  </p>
                  <p className="text-xs text-blue-600 break-words">
                    {hasMultipleActivities 
                      ? 'Editando múltiplas atividades. Clique para alternar para atividade única.' 
                      : 'Editando uma atividade. Clique para adicionar mais atividades.'}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={toggleMultipleActivitiesMode}
                  className="bg-white hover:bg-blue-100 border-blue-300 w-full max-w-xs mx-auto text-sm px-3 py-2 whitespace-nowrap overflow-hidden text-ellipsis"
                >
                  {hasMultipleActivities ? 'Atividade Única' : 'Múltiplas Atividades'}
                </Button>
              </div>
            )}

            {/* Activity Fields */}
            <div className="space-y-4">
              {userFunction !== 'Operador de Empilhadeira' && !hasMultipleActivities && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Atividade</label>
                    <Select
                      value={formData.nome_atividade || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, nome_atividade: e.target.value }))}
                    >
                      <option value="">Selecione uma atividade</option>
                      {activityNames.map((activity: any) => (
                        <option key={activity.nome_atividade} value={activity.nome_atividade}>
                          {activity.nome_atividade}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Quantidade</label>
                      <Input
                        type="number"
                        value={formData.quantidade_produzida || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, quantidade_produzida: Number(e.target.value) }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Tempo (horas)</label>
                      <Input
                        type="number"
                        step="0.1"
                        value={formData.tempo_horas || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, tempo_horas: Number(e.target.value) }))}
                      />
                    </div>
                  </div>
                </>
              )}

              {userFunction === 'Operador de Empilhadeira' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nome do Operador</label>
                    <Input
                      value={formData.nome_operador || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, nome_operador: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tarefas Válidas</label>
                    <Input
                      type="number"
                      value={formData.valid_tasks_count || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, valid_tasks_count: Number(e.target.value) }))}
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Multiple Activities - Para qualquer função com múltiplas atividades */}
          {hasMultipleActivities && userFunction !== 'Operador de Empilhadeira' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Atividades Lançadas pelo Colaborador</CardTitle>
                <p className="text-xs text-gray-600">Edite a quantidade e tempo para recálculo. Use o botão + para adicionar mais atividades.</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {multipleActivities.map((activity, index) => (
                  <div key={index} className="grid grid-cols-5 gap-4 p-4 border rounded-lg bg-gray-50">
                    <div className="flex items-center">
                      <Select
                        value={activity.nome_atividade || ''}
                        onChange={(e) => updateMultipleActivity(index, 'nome_atividade', e.target.value)}
                        className={`text-sm ${!activity.nome_atividade ? 'border-red-300 bg-red-50' : ''}`}
                      >
                        <option value="">Selecione uma atividade</option>
                        {activityNames.map((activityName: any) => (
                          <option key={activityName.nome_atividade} value={activityName.nome_atividade}>
                            {activityName.nome_atividade}
                          </option>
                        ))}
                      </Select>
                      {!activity.nome_atividade && (
                        <span className="text-xs text-red-500 ml-2">Obrigatório</span>
                      )}
                    </div>
                    <Input
                      type="number"
                      placeholder="Quantidade"
                      value={activity.quantidade_produzida || ''}
                      onChange={(e) => updateMultipleActivity(index, 'quantidade_produzida', Number(e.target.value))}
                    />
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="Tempo (h)"
                      value={activity.tempo_horas || ''}
                      onChange={(e) => updateMultipleActivity(index, 'tempo_horas', Number(e.target.value))}
                    />
                    <div className="flex items-center justify-center">
                      <span className="text-xs text-gray-500">Editável</span>
                    </div>
                    <div className="flex items-center justify-center">
                       <Button
                         type="button"
                         variant="outline"
                         size="sm"
                         onClick={() => removeMultipleActivity(index)}
                         disabled={multipleActivities.length <= 1}
                         className={`${multipleActivities.length <= 1 ? 'opacity-50 cursor-not-allowed' : 'text-red-600 hover:text-red-700 hover:bg-red-50'}`}
                         title={multipleActivities.length <= 1 ? 'Deve haver pelo menos uma atividade' : 'Remover atividade'}
                       >
                         <Trash2 className="h-4 w-4" />
                       </Button>
                     </div>
                  </div>
                ))}
                
                <div className="flex justify-center pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addMultipleActivity}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Adicionar Atividade
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* KPIs Section */}
          {kpisForDisplay.length > 0 && formData.funcao && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">KPIs Atingidos (Editável)</CardTitle>
                <p className="text-xs text-gray-600 mt-1">Selecione ou desselecione os KPIs que foram atingidos</p>
              </CardHeader>
              <CardContent>
                {kpisForDisplay.length > 0 ? (
                  <div className="space-y-3">
                    {kpisForDisplay.map((kpi) => (
                      <label key={kpi.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={formData.kpis_atingidos?.includes(kpi.nome_kpi) || false}
                          onChange={() => handleKPIToggle(kpi.nome_kpi)}
                          className="rounded w-4 h-4 text-blue-600 focus:ring-blue-500"
                        />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">
                            {kpi.nome_kpi} | {(kpi as any).tipo_kpi || 'KPI'}
                          </div>
                          <div className="text-xs text-gray-500">
                            Valor: R$ {kpi.peso_kpi.toFixed(2)} • Função: {kpi.funcao_kpi} • Turno: {kpi.turno_kpi}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 p-4 text-center">
                    Nenhum KPI disponível para a função "{formData.funcao}" e turno "{formData.turno}"
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Input Adicional */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Valor Adicional (opcional)
            </label>
            <Input
              type="number"
              step="0.01"
              value={formData.input_adicional || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, input_adicional: Number(e.target.value) }))}
              placeholder="R$ 0,00"
            />
          </div>

          {/* Observações da Edição */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observações da Edição
            </label>
            <Input
              value={editObservacoes}
              onChange={(e) => setEditObservacoes(e.target.value)}
              placeholder="Justifique as alterações realizadas..."
            />
          </div>

          {/* Calculate Button */}
          <Button
            onClick={handleCalculate}
            disabled={calculating}
            className="w-full"
          >
            <Clock className="h-4 w-4 mr-2" />
            {calculating ? 'Calculando...' : 'Recalcular com Novos Valores'}
          </Button>

          {/* Results Preview */}
          {result && hasCalculated && (
            <Card className="bg-green-50 border-green-200">
              <CardHeader>
                <CardTitle className="text-green-800 text-sm">Novos Valores Calculados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-green-600">Nova Remuneração:</span>
                    <p className="font-semibold text-green-900">R$ {(result?.remuneracaoTotal || 0).toFixed(2)}</p>
                  </div>
                  <div>
                    <span className="text-green-600">Atividades:</span>
                    <p className="font-semibold text-green-900">R$ {(result?.subtotalAtividades || 0).toFixed(2)}</p>
                  </div>
                  <div>
                    <span className="text-green-600">KPIs:</span>
                    <p className="font-semibold text-green-900">R$ {(result?.bonusKpis || 0).toFixed(2)}</p>
                  </div>
                  {result?.produtividade_alcancada && (
                    <div>
                      <span className="text-green-600">Produtividade:</span>
                      <p className="font-semibold text-green-900">{(result.produtividade_alcancada || 0).toFixed(2)}</p>
                    </div>
                  )}
                </div>
                
                {/* Difference Indicator */}
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-blue-700 text-sm font-medium">
                    Diferença: R$ {((result?.remuneracaoTotal || 0) - (lancamento.remuneracao_total || 0)).toFixed(2)}
                    {(result?.remuneracaoTotal || 0) > (lancamento.remuneracao_total || 0) ? ' (aumento)' : ' (redução)'}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 w-full"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={!result || !hasCalculated}
              className="flex-1 w-full bg-blue-600 hover:bg-blue-700"
            >
              <Save className="h-4 w-4 mr-2" />
              Salvar Edição
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
