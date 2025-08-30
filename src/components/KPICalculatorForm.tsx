import React, { useState, useEffect } from 'react';
import { Calculator, AlertTriangle, Target, Clock, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Select } from '@/components/Select';
import { Alert, AlertDescription } from '@/components/Alert';
import { useAuth } from '@/hooks/useAuth';
import { useAvailableKPIs, useKPILimit, useCalculator } from '@/hooks/useApi';
import { CalculatorInputType } from '@/shared/types';
import { FUNCOES_UI_FORMAT, TURNO_UI_TO_DB } from '@/shared/utils/encoding';

interface KPICalculatorFormProps {
  onCalculate: (input: CalculatorInputType, result: any) => void;
  disabled?: boolean;
}

export default function KPICalculatorForm({ onCalculate, disabled }: KPICalculatorFormProps) {
  const { user, userFunction, userTurno, isAdmin } = useAuth();
  const { kpis: availableKPIs, loading: kpisLoading, fetchAvailableKPIs } = useAvailableKPIs();
  const { checkLimit } = useKPILimit();
  const { calculate, loading: calculating, error: calcError, reset, lastCalculationSuccess } = useCalculator();
  
  const [formData, setFormData] = useState<CalculatorInputType>({
    funcao: userFunction || 'Ajudante de Armazém',
    turno: (userTurno as 'Manhã' | 'Tarde' | 'Noite') || 'Manhã',
    kpis_atingidos: []
  });
  
  const [limitInfo, setLimitInfo] = useState<any>(null);
  const [dataLancamento, setDataLancamento] = useState('');
  const [canLaunchKPIs, setCanLaunchKPIs] = useState(true);

  const [showFunctionSelector, setShowFunctionSelector] = useState(false);

  const funcoes = FUNCOES_UI_FORMAT;

  // Turnos disponíveis (removido variável não utilizada)

  // Check if user has a function defined
  useEffect(() => {
    // Show function selector for test users or if no function is defined
    if (!userFunction || userFunction === 'Ajudante de Armazém') {
      setShowFunctionSelector(true);
    } else {
      setShowFunctionSelector(false);
    }
    
    // Always update form data with userFunction and userTurno
    if (userFunction) {
      setFormData(prev => ({ ...prev, funcao: userFunction }));
    }
    // Apenas atualizar turno se não for administrador e tiver turno definido
    if (userTurno && !isAdmin) {
      setFormData(prev => ({ ...prev, turno: userTurno as 'Manhã' | 'Tarde' | 'Noite' }));
    }
  }, [user, userFunction, userTurno]);

  // Load available KPIs when function or shift changes
  useEffect(() => {
    console.log('KPI Calculator - Function/Shift changed:', { 
      funcao: formData.funcao, 
      turno: formData.turno,
      userFunction: userFunction,
      userFuncaoFromDB: user?.funcao 
    });
    
    if (formData.funcao && formData.turno) {
      console.log('Fetching KPIs for:', formData.funcao, formData.turno);
      fetchAvailableKPIs(formData.funcao, formData.turno);
    }
  }, [formData.funcao, formData.turno, userFunction, user?.funcao, fetchAvailableKPIs]);

  // Check KPI limit when user or date changes
  useEffect(() => {
    if (user?.id && dataLancamento) {
      checkKPILimit();
    }
  }, [user?.id, dataLancamento]);

  // Reset form and re-check limit after successful calculation
  useEffect(() => {
    if (lastCalculationSuccess && user?.id && dataLancamento) {
      // Reset form data
      setFormData(prev => ({
        ...prev,
        kpis_atingidos: []
      }));
      
      // Re-check limit after successful calculation
      const timeoutId = setTimeout(() => {
        checkKPILimit();
        reset(); // Reset calculator state
      }, 1000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [lastCalculationSuccess, user?.id, dataLancamento, reset]);

  const checkKPILimit = async () => {
    if (!user?.id) return;
    
    try {
      const limit = await checkLimit(user.id, dataLancamento);
      setLimitInfo(limit);
      setCanLaunchKPIs(limit?.canLaunch ?? true);
    } catch (error) {
      console.error('Error checking KPI limit:', error);
    }
  };

  const handleKPIToggle = (kpiName: string) => {
    if (!canLaunchKPIs && !formData.kpis_atingidos?.includes(kpiName)) {
      return; // Don't allow adding new KPIs if limit is reached
    }

    setFormData(prev => ({
      ...prev,
      kpis_atingidos: prev.kpis_atingidos?.includes(kpiName)
        ? prev.kpis_atingidos.filter(k => k !== kpiName)
        : [...(prev.kpis_atingidos || []), kpiName]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id) {
      alert('Usuário não identificado. Faça login novamente.');
      return;
    }

    if (!canLaunchKPIs && formData.kpis_atingidos && formData.kpis_atingidos.length > 0) {
      alert('Você já atingiu o limite de 1 KPI para hoje. Não é possível adicionar mais lançamentos.');
      return;
    }

    if (!formData.kpis_atingidos || formData.kpis_atingidos.length === 0) {
      alert('Selecione pelo menos um KPI para continuar.');
      return;
    }

    try {
      // Convert turno from UI format to DB format before sending to API
    const calculationData = {
      ...formData,
      turno: (TURNO_UI_TO_DB[formData.turno] || formData.turno) as "Manhã" | "Tarde" | "Noite" | "Manha"
    };
      
      console.log('🔄 Converting turno for API:', {
        original: formData.turno,
        converted: calculationData.turno
      });
      
      await calculate(calculationData);
      // The result is now stored in the hook state
      onCalculate(formData, {});
      // Form reset and limit check are now handled by useEffect
    } catch (error) {
      console.error('Error calculating KPIs:', error);
    }
  };

  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  return (
    <Card className="border-0 shadow-xl bg-gradient-to-br from-white via-blue-50 to-purple-50">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2 text-xl">
              <Target className="h-6 w-6 text-blue-600" />
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Calculadora de KPIs
              </span>
            </CardTitle>
            <p className="text-gray-600 mt-1">
              {getTimeBasedGreeting()}, {user?.nome?.split(' ')[0]}! Configure seus KPIs atingidos.
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Data do lançamento</div>
            <Input
              type="date"
              value={dataLancamento}
              onChange={(e) => setDataLancamento(e.target.value)}
              className="w-auto text-right"
              disabled={disabled}
            />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* KPI Limit Status */}
        {limitInfo && (
          <div className={`p-4 rounded-lg border-l-4 ${
            canLaunchKPIs 
              ? 'bg-green-50 border-green-500 text-green-800' 
              : 'bg-red-50 border-red-500 text-red-800'
          }`}>
            <div className="flex items-center space-x-2">
              {canLaunchKPIs ? (
                <Target className="h-5 w-5" />
              ) : (
                <AlertTriangle className="h-5 w-5" />
              )}
              <div>
                <p className="font-medium">
                  {canLaunchKPIs 
                    ? `Você pode lançar ${limitInfo.remaining_launches} KPI(s) hoje`
                    : 'Limite diário de KPIs atingido'
                  }
                </p>
                <p className="text-sm opacity-75">
                  {limitInfo.current_count} de {limitInfo.daily_limit} KPIs lançados hoje
                </p>
              </div>
            </div>
          </div>
        )}

        {!canLaunchKPIs && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Você já atingiu o limite de 1 KPI para hoje. Não é possível adicionar mais lançamentos.
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Function Selection (only for test users) */}
          {showFunctionSelector && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                <User className="h-4 w-4" />
                <span>Função (Usuário de Teste)</span>
              </label>
              <Select
                value={formData.funcao}
                onChange={(e) => setFormData(prev => ({ ...prev, funcao: e.target.value }))}
                disabled={disabled}
              >
                {funcoes.map(funcao => (
                  <option key={funcao} value={funcao}>{funcao}</option>
                ))}
              </Select>
            </div>
          )}

          {/* Fixed function display for regular users */}
          {!showFunctionSelector && (
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-2 text-blue-800">
                <User className="h-4 w-4" />
                <span className="font-medium">Função: {formData.funcao}</span>
              </div>
            </div>
          )}

          {/* Shift Selection - Fixed based on user's registered shift */}
          {!isAdmin ? (
            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center space-x-2 text-green-800">
                <Clock className="h-4 w-4" />
                <span className="font-medium">Turno: {formData.turno}</span>
                <span className="text-sm opacity-75">(baseado no seu cadastro)</span>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center space-x-2 text-gray-600">
                <Clock className="h-4 w-4" />
                <span className="font-medium">Administrador - Sem turno específico</span>
              </div>
            </div>
          )}

          {/* Available KPIs */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              KPIs Disponíveis ({availableKPIs.length}/2)
            </label>
            
            {kpisLoading ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Carregando KPIs...</span>
              </div>
            ) : availableKPIs.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Nenhum KPI disponível para esta função e turno</p>
                <p className="text-sm">Entre em contato com o administrador</p>
              </div>
            ) : (
              <div className="space-y-2">
                {availableKPIs.map((kpi) => {
                  const isSelected = formData.kpis_atingidos?.includes(kpi.nome_kpi) || false;
                  const canSelect = canLaunchKPIs || isSelected;
                  
                  return (
                    <div
                      key={kpi.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-all ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50'
                          : canSelect
                          ? 'border-gray-300 hover:border-blue-300 bg-white'
                          : 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-50'
                      }`}
                      onClick={() => canSelect && handleKPIToggle(kpi.nome_kpi)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">{kpi.nome_kpi}</h4>
                          {kpi.descricao && (
                            <p className="text-sm text-gray-600">{kpi.descricao}</p>
                          )}
                          <div className="flex items-center space-x-4 mt-1">
                            <span className="text-xs text-gray-500">
                              Meta: {kpi.valor_meta_kpi}
                            </span>
                            <span className="text-xs font-medium text-green-600">
                              Bônus: R$ {kpi.peso_kpi.toFixed(2)}
                            </span>
                          </div>
                        </div>
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                          isSelected
                            ? 'border-blue-500 bg-blue-500'
                            : 'border-gray-300'
                        }`}>
                          {isSelected && <div className="w-2 h-2 bg-white rounded-full"></div>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {calcError && (
            <Alert variant="destructive">
              <AlertDescription>{calcError}</AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            disabled={
              disabled || 
              calculating || 
              !formData.kpis_atingidos?.length || 
              (!canLaunchKPIs && formData.kpis_atingidos?.length > 0)
            }
            className="w-full flex items-center justify-center space-x-2"
          >
            {calculating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Calculando...</span>
              </>
            ) : (
              <>
                <Calculator className="h-4 w-4" />
                <span>Calcular KPIs</span>
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
