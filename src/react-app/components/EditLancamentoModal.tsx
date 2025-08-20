import { useState, useEffect } from 'react';
import { Clock, FileText, Save, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/react-app/components/Dialog';
import { Button } from '@/react-app/components/Button';
import { Input } from '@/react-app/components/Input';
import { Select } from '@/react-app/components/Select';
import { Card, CardContent, CardHeader, CardTitle } from '@/react-app/components/Card';
import { LancamentoType, CalculatorInputType, CalculatorResultType } from '@/shared/types';
import { useKPIs, useActivityNames, useFunctions, useCalculator } from '@/react-app/hooks/useApi';

interface EditLancamentoModalProps {
  open: boolean;
  onClose: () => void;
  lancamento: LancamentoType | null;
  onSave: (editedData: CalculatorInputType, result: CalculatorResultType) => Promise<void>;
}

export default function EditLancamentoModal({ open, onClose, lancamento, onSave }: EditLancamentoModalProps) {
  const { functions } = useFunctions();
  const { activityNames } = useActivityNames();
  const { kpis } = useKPIs();
  const { calculate, result, loading: calculating } = useCalculator();
  
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

  useEffect(() => {
    if (lancamento && open) {
      // Parse JSON fields safely
      const kpisAtingidos = lancamento.kpis_atingidos ? JSON.parse(lancamento.kpis_atingidos) : [];
      const multipleActivitiesData = lancamento.multiple_activities ? JSON.parse(lancamento.multiple_activities) : [];

      setFormData({
        funcao: lancamento.funcao,
        turno: lancamento.turno as 'Manhã' | 'Tarde' | 'Noite',
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

  const availableKPIs = kpis.filter(kpi => 
    kpi.funcao_kpi === formData.funcao && 
    (kpi.turno_kpi === formData.turno || kpi.turno_kpi === 'Geral')
  );

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

  const updateMultipleActivity = (index: number, field: string, value: any) => {
    setMultipleActivities(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const removeMultipleActivity = (index: number) => {
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
    if (!result) return;

    const calculatorInput = {
      ...formData,
      multiple_activities: formData.funcao === 'Ajudante de Armazém' ? multipleActivities : undefined,
    };

    await onSave(calculatorInput, result);
    onClose();
  };

  if (!lancamento) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
                </div>
                <div>
                  <span className="text-amber-600">KPIs:</span>
                  <p className="font-semibold text-amber-900">R$ {(lancamento.bonus_kpis || 0).toFixed(2)}</p>
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
                >
                  <option value="">Selecione uma função</option>
                  {functions.map((func: any) => (
                    <option key={func.funcao} value={func.funcao}>{func.funcao}</option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Turno</label>
                <Select
                  value={formData.turno}
                  onChange={(e) => setFormData(prev => ({ ...prev, turno: e.target.value as any }))}
                >
                  <option value="Manhã">Manhã</option>
                  <option value="Tarde">Tarde</option>
                  <option value="Noite">Noite</option>
                </Select>
              </div>
            </div>

            {/* Activity Fields */}
            <div className="space-y-4">
              {formData.funcao !== 'Ajudante de Armazém' && formData.funcao !== 'Operador de Empilhadeira' && (
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

              {formData.funcao === 'Operador de Empilhadeira' && (
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

          {/* Multiple Activities for Ajudante de Armazém */}
          {formData.funcao === 'Ajudante de Armazém' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Múltiplas Atividades</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {multipleActivities.map((activity, index) => (
                  <div key={index} className="grid grid-cols-4 gap-4 p-4 border rounded-lg">
                    <Select
                      value={activity.nome_atividade}
                      onChange={(e) => updateMultipleActivity(index, 'nome_atividade', e.target.value)}
                    >
                      <option value="">Selecione atividade</option>
                      {activityNames.map((act: any) => (
                        <option key={act.nome_atividade} value={act.nome_atividade}>
                          {act.nome_atividade}
                        </option>
                      ))}
                    </Select>
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
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeMultipleActivity(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" onClick={addMultipleActivity}>
                  Adicionar Atividade
                </Button>
              </CardContent>
            </Card>
          )}

          {/* KPIs Section */}
          {availableKPIs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">KPIs Disponíveis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {availableKPIs.map((kpi) => (
                    <label key={kpi.id} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.kpis_atingidos?.includes(kpi.nome_kpi) || false}
                        onChange={() => handleKPIToggle(kpi.nome_kpi)}
                        className="rounded"
                      />
                      <span className="text-sm">
                        {kpi.nome_kpi} (R$ {kpi.peso_kpi.toFixed(2)})
                      </span>
                    </label>
                  ))}
                </div>
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
                  {result.produtividade_alcancada && (
                    <div>
                      <span className="text-green-600">Produtividade:</span>
                      <p className="font-semibold text-green-900">{result.produtividade_alcancada.toFixed(2)}</p>
                    </div>
                  )}
                </div>
                
                {/* Difference Indicator */}
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-blue-700 text-sm font-medium">
                    Diferença: R$ {(result.remuneracao_total - (lancamento.remuneracao_total || 0)).toFixed(2)}
                    {result.remuneracao_total > (lancamento.remuneracao_total || 0) ? ' (aumento)' : ' (redução)'}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={!result || !hasCalculated}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <Save className="h-4 w-4 mr-2" />
              Salvar e Aprovar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
