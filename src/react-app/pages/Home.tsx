import { useState, useEffect } from 'react';
import { Truck, TrendingUp, CheckCircle, Plus, Trash2, Send } from 'lucide-react';
import { Link, Navigate, useSearchParams } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/react-app/components/Card';
import { Button } from '@/react-app/components/Button';
import { Input } from '@/react-app/components/Input';
import { Select } from '@/react-app/components/Select';
import { Alert, AlertDescription, AlertTitle } from '@/react-app/components/Alert';

import AuthGuard from '@/react-app/components/AuthGuard';
import UserMenu from '@/react-app/components/UserMenu';
import WMSTaskManager from '@/react-app/components/WMSTaskManager';

import { useAuth } from '@/react-app/hooks/useAuth';
import { useActivityNames, useFunctions, useCalculator } from '@/react-app/hooks/useApi';
import { CalculatorInputType, KPIType, MultipleActivityType, CreateLancamentoType } from '@/shared/types';
import { FUNCAO_DB_TO_UI } from '@/shared/utils/encoding';


export default function Home() {
  const { user, isAdmin } = useAuth();
  const { activityNames, loading: activityNamesLoading } = useActivityNames();
  const { functions } = useFunctions();
  const { result, loading: calculating, error, calculate } = useCalculator();
  const [searchParams] = useSearchParams();

  const [availableKPIs, setAvailableKPIs] = useState<KPIType[]>([]);
  const [selectedKPIs, setSelectedKPIs] = useState<string[]>([]);
  const [validTasksCount, setValidTasksCount] = useState<number>(0);
  
  // WMS Task Manager states
  const [selectedOperator, setSelectedOperator] = useState<string>(user?.nome || '');
  const [wmsReferenceDate, setWmsReferenceDate] = useState<string>('');
  
  // Update selectedOperator when user changes
  useEffect(() => {
    if (user?.nome) {
      setSelectedOperator(user.nome);
    }
  }, [user?.nome]);

  // Set user's function automatically when user is loaded
  useEffect(() => {
    if (user?.funcao) {
      // Convert user function from DB format to UI format
      const convertedFunction = FUNCAO_DB_TO_UI[user.funcao] || user.funcao;
      console.log('Home - User function conversion:', { 
        original: user.funcao, 
        converted: convertedFunction 
      });
      
      setFormData(prev => ({
        ...prev,
        funcao: convertedFunction
      }));
    }
  }, [user?.funcao]);

  // Capturar parâmetro de data da URL e preencher automaticamente
  useEffect(() => {
    const dateParam = searchParams.get('data');
    if (dateParam) {
      setDataLancamento(dateParam);
      // Abrir automaticamente o modal de lançamento se houver resultado calculado
      if (result) {
        setShowLancamento(true);
      }
    }
  }, [searchParams, result]);
  
  // Lançamento states
  const [showLancamento, setShowLancamento] = useState<boolean>(false);
  const [dataLancamento, setDataLancamento] = useState<string>('');
  const [lancando, setLancando] = useState<boolean>(false);

  // Multiple activities for Ajudantes de Armazém
  const [multipleActivities, setMultipleActivities] = useState<MultipleActivityType[]>([
    { nome_atividade: '', quantidade_produzida: 0, tempo_horas: 0 }
  ]);

  const [formData, setFormData] = useState<CalculatorInputType>({
    nome_atividade: '',
    funcao: '',
    turno: 'Manhã',
    quantidade_produzida: 0,
    tempo_horas: 0,
    input_adicional: 0,
    nome_operador: '',
  });

  const isAjudanteArmazem = formData.funcao === 'Ajudante de Armazém';
  const isOperadorEmpilhadeira = formData.funcao === 'Operador de Empilhadeira';

  // Available operators list (será atualizada dinamicamente pelo WMSTaskManager)
  const [availableOperators, setAvailableOperators] = useState<string[]>([
    'ERCILIO AUGUSTO DE SOUSA',
    'LUCAS PATRICK FERREIRA DA SILV',
    'ALMIR VICTOR ALENCAR DA ROCHA',
    'JOSE WILSON FRANKLIM PEREIRA',
    'ERIVALDO FERREIRA DA SILVA',
    'JAMERSON FRANCISCO DA SILVA',
    'ALLYSSON ARAUJO DE LIMA',
    'MURILO LUCAS DA SILVA',
    'DILSON ARLINDO DOS SANTOS',
    'Paulo Ursulino da Silva neto'
  ]);











  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🔄 Home - Submit triggered');
    console.log('📋 Form data:', formData);
    console.log('🎯 Selected KPIs:', selectedKPIs);
    console.log('👤 Function type checks:', { isAjudanteArmazem, isOperadorEmpilhadeira });
    
    if (!formData.funcao) {
      console.log('❌ No function defined');
      alert('Função não definida. Entre em contato com o administrador.');
      return;
    }

    const submitData: CalculatorInputType = {
      ...formData,
      kpis_atingidos: selectedKPIs,
    };

    if (isAjudanteArmazem) {
      // Validate multiple activities
      const validActivities = multipleActivities.filter(
        act => act.nome_atividade && act.quantidade_produzida > 0 && act.tempo_horas > 0
      );
      console.log('📊 Multiple activities validation:', { 
        total: multipleActivities.length, 
        valid: validActivities.length,
        activities: validActivities 
      });
      
      if (validActivities.length === 0) {
        console.log('❌ No valid activities for Ajudante de Armazém');
        alert('Por favor, preencha pelo menos uma atividade válida com nome, quantidade e tempo.');
        return;
      }
      
      // Map to the expected schema format
      submitData.multiple_activities = validActivities.map(act => ({
        nome_atividade: act.nome_atividade,
        quantidade_produzida: act.quantidade_produzida,
        tempo_horas: act.tempo_horas
      }));
    } else if (isOperadorEmpilhadeira) {
      // For Operador de Empilhadeira, use only the valid tasks count from form data
      // Don't add existing tasks to avoid double counting
      submitData.valid_tasks_count = formData.valid_tasks_count || 0;
      submitData.nome_operador = formData.nome_operador;
      
      console.log(`📦 Tarefas válidas para cálculo: ${formData.valid_tasks_count || 0}`);
    } else {
      // Single activity validation
      if (!formData.nome_atividade || formData.quantidade_produzida! <= 0 || formData.tempo_horas! <= 0) {
        console.log('❌ Invalid single activity data');
        alert('Por favor, preencha todos os campos obrigatórios da atividade.');
        return;
      }
    }

    console.log('✅ Calling calculate with data:', submitData);
    calculate(submitData);
  };

  const checkKPILimit = async (date: string) => {
    if (!user?.id || !selectedKPIs.length) return true; // No KPIs selected, no need to check
    
    try {
      const response = await fetch('/api/kpis/check-limit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          data_lancamento: date
        }),
      });
      
      if (!response.ok) return true; // If check fails, allow the attempt
      
      const data = await response.json();
      return data.can_launch;
    } catch (err) {
      console.error('Erro ao verificar limite de KPIs:', err);
      return true; // If check fails, allow the attempt
    }
  };

  const handleOpenLancamento = async () => {
    console.log('🚀 Home - Open Lançamento triggered');
    console.log('📊 Result exists:', !!result);
    console.log('🎯 Selected KPIs:', selectedKPIs);
    
    if (!result) {
      console.log('❌ No calculation result available');
      alert('Por favor, calcule a remuneração antes de fazer o lançamento.');
      return;
    }
    
    // If user has selected KPIs, check if they can launch more for today
    if (selectedKPIs.length > 0) {
      const today = new Date().toISOString().split('T')[0];
      console.log('🔍 Checking KPI limit for date:', today);
      const canLaunch = await checkKPILimit(today);
      
      if (!canLaunch) {
        console.log('❌ KPI limit reached for today');
        alert('❌ Limite diário de KPIs atingido!\n\n💡 Você já possui 1 lançamento de KPI para hoje.\n\nPara lançar novos KPIs:\n• Remova os KPIs do cálculo atual, ou\n• Escolha uma data diferente no modal de lançamento');
        return;
      }
    }
    
    // For forklift operators, set the launch date to the WMS reference date
    if (isOperadorEmpilhadeira && wmsReferenceDate) {
      console.log('📅 Setting WMS reference date:', wmsReferenceDate);
      setDataLancamento(wmsReferenceDate);
    } else {
      // Default to today's date for other roles
      const today = new Date().toISOString().split('T')[0];
      console.log('📅 Setting today\'s date:', today);
      setDataLancamento(today);
    }
    
    console.log('✅ Opening lançamento modal');
    setShowLancamento(true);
  };

  const handleLancarProdutividade = async () => {
    if (!result || !dataLancamento) return;
    
    // Check KPI limit again before launching if KPIs are selected
    if (selectedKPIs.length > 0) {
      const canLaunch = await checkKPILimit(dataLancamento);
      if (!canLaunch) {
        alert('❌ Limite diário de KPIs atingido!\n\n💡 Você já possui lançamentos de KPIs para esta data.\n\nPara lançar novos KPIs:\n• Remova os KPIs do cálculo atual, ou\n• Escolha uma data diferente');
        return;
      }
    }
    
    setLancando(true);
    try {
      const lancamentoData: CreateLancamentoType = {
        data_lancamento: dataLancamento,
        user_id: user?.id,
        calculator_data: {
          ...formData,
          kpis_atingidos: selectedKPIs,
          ...(isAjudanteArmazem && { multiple_activities: multipleActivities.filter(act => act.nome_atividade && act.quantidade_produzida > 0 && act.tempo_horas > 0) }),
          ...(isOperadorEmpilhadeira && { valid_tasks_count: validTasksCount, nome_operador: formData.nome_operador }),
        },
        calculator_result: result,
      };
      
      const response = await fetch('/api/lancamentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lancamentoData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        
        // Handle specific KPI limit error
        if (errorData.error === 'Limite diário de KPIs atingido') {
          alert(`❌ ${errorData.message}\n\n💡 Para lançar novos KPIs:\n• Remova os KPIs do cálculo atual, ou\n• Escolha uma data diferente\n\nLançamentos atuais: ${errorData.current_count}/${errorData.daily_limit}`);
          return;
        }
        
        throw new Error(errorData.message || 'Falha ao lançar produtividade');
      }
      
      // Success - reset form and show success message
      setShowLancamento(false);
      setDataLancamento('');
      alert('Produtividade lançada com sucesso! Aguarde a validação do administrador.');
      
    } catch (err) {
      console.error('Erro ao lançar produtividade:', err);
      alert('Erro ao lançar produtividade. Tente novamente.');
    } finally {
      setLancando(false);
    }
  };

  const handleInputChange = (field: keyof CalculatorInputType, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Reset KPIs and activities when function or shift changes
    if (field === 'funcao' || field === 'turno') {
      setSelectedKPIs([]);
      if (field === 'funcao') {
        setMultipleActivities([{ nome_atividade: '', quantidade_produzida: 0, tempo_horas: 0 }]);
        setValidTasksCount(0);
      }
    }
    
    // Reset valid tasks count when operator name changes
    if (field === 'nome_operador') {
      setValidTasksCount(0);
    }
  };

  const addActivity = () => {
    setMultipleActivities(prev => [
      ...prev,
      { nome_atividade: '', quantidade_produzida: 0, tempo_horas: 0 }
    ]);
  };

  const removeActivity = (index: number) => {
    setMultipleActivities(prev => prev.filter((_, i) => i !== index));
  };

  const updateActivity = (index: number, field: keyof MultipleActivityType, value: string | number) => {
    setMultipleActivities(prev => prev.map((act, i) => 
      i === index ? { ...act, [field]: value } : act
    ));
  };











  const fetchAvailableKPIs = async (funcao: string, turno: string) => {
    if (!funcao || !turno) return;
    
    try {
      console.log('Home - Fetching KPIs for:', { funcao, turno });
      const response = await fetch(`/api/kpis/available?funcao=${encodeURIComponent(funcao)}&turno=${encodeURIComponent(turno)}`);
      if (!response.ok) throw new Error('Failed to fetch KPIs');
      const data = await response.json();
      console.log('Home - KPIs response:', data);
      // Extract KPIs from the response object
      const kpisList = data.kpisAtingidos || data || [];
      console.log('Home - Setting KPIs:', kpisList);
      setAvailableKPIs(kpisList);
    } catch (err) {
      console.error('Error fetching KPIs:', err);
      setAvailableKPIs([]);
    }
  };

  const toggleKPI = (kpiName: string) => {
    setSelectedKPIs(prev => 
      prev.includes(kpiName) 
        ? prev.filter(name => name !== kpiName)
        : [...prev, kpiName]
    );
  };

  useEffect(() => {
    if (formData.funcao && formData.turno) {
      fetchAvailableKPIs(formData.funcao, formData.turno);
    }
  }, [formData.funcao, formData.turno]);



  // Redirect admins to admin panel - admins don't use calculator
  if (isAdmin) {
    return <Navigate to="/admin-redirect" replace />;
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
        {/* Header */}
        <header className="border-b bg-white/70 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
                  <Truck className="h-5 w-5 text-white" />
                </div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                  RV Armazém CDD Maceió
                </h1>
              </div>
              <div className="flex items-center space-x-3">
                <Link to="/dashboard">
                  <Button variant="outline" size="sm">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Dashboard
                  </Button>
                </Link>
                <UserMenu />
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Hero Section */}
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Calculadora de Remuneração Variável
              </h2>
              <p className="text-lg text-gray-600">
                Calcule e lance sua remuneração diária com base na produção e KPIs atingidos
              </p>
              <p className="text-sm text-gray-500 mt-2">
                👤 {user?.nome} | 💼 {user?.funcao || 'Colaborador'}
              </p>
            </div>

            {/* Calculator Form */}
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  <span>Cálculo Diário</span>
                </CardTitle>
                <CardDescription>
                  Preencha os dados da sua produção do dia para calcular sua remuneração
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Função</label>
                      <Select
                        value={formData.funcao}
                        onChange={(e) => handleInputChange('funcao', e.target.value)}
                        placeholder="Função definida pelo usuário"
                        disabled={true}
                      >
                        {functions.map((func) => (
                          <option key={func.funcao} value={func.funcao}>
                            {func.funcao}
                          </option>
                        ))}
                      </Select>
                      <p className="text-xs text-gray-500">🔒 Função travada baseada no seu perfil de usuário</p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Turno</label>
                      <Select
                        value={formData.turno}
                        onChange={(e) => handleInputChange('turno', e.target.value as any)}
                      >
                        <option value="Manhã">Manhã</option>
                        <option value="Tarde">Tarde</option>
                        <option value="Noite">Noite</option>
                      </Select>
                    </div>
                  </div>

                  {/* Multiple Activities for Ajudantes de Armazém */}
                  {isAjudanteArmazem && (
                    <div className="space-y-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-gray-900">Atividades Realizadas</h4>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={addActivity}
                          className="text-amber-600 border-amber-300 hover:bg-amber-100"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Adicionar
                        </Button>
                      </div>
                      <p className="text-sm text-gray-600">Adicione todas as atividades realizadas no dia:</p>
                      
                      {multipleActivities.map((activity, index) => (
                        <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3 bg-white rounded-lg border">
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-gray-600">Atividade</label>
                            <Select
                              value={activity.nome_atividade}
                              onChange={(e) => updateActivity(index, 'nome_atividade', e.target.value)}
                              placeholder="Selecione"
                              disabled={activityNamesLoading}
                            >
                              {activityNames.map((act) => (
                                <option key={act.nome_atividade} value={act.nome_atividade}>
                                  {act.nome_atividade}
                                </option>
                              ))}
                            </Select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-gray-600">Quantidade</label>
                            <Input
                              type="number"
                              min="0"
                              step="1"
                              value={activity.quantidade_produzida || ''}
                              onChange={(e) => updateActivity(index, 'quantidade_produzida', parseInt(e.target.value) || 0)}
                              placeholder="Ex: 83"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-gray-600">Tempo (h)</label>
                            <Input
                              type="number"
                              min="0.1"
                              step="0.1"
                              value={activity.tempo_horas || ''}
                              onChange={(e) => updateActivity(index, 'tempo_horas', parseFloat(e.target.value) || 0)}
                              placeholder="Ex: 3"
                            />
                          </div>
                          <div className="flex items-end">
                            {multipleActivities.length > 1 && (
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={() => removeActivity(index)}
                                className="w-full"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Single Activity for other functions */}
                  {!isAjudanteArmazem && !isOperadorEmpilhadeira && (
                    <>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Atividade Realizada</label>
                        <Select
                          value={formData.nome_atividade || ''}
                          onChange={(e) => handleInputChange('nome_atividade', e.target.value)}
                          placeholder="Selecione a atividade"
                          disabled={activityNamesLoading}
                        >
                          {activityNames.map((activity) => (
                            <option key={activity.nome_atividade} value={activity.nome_atividade}>
                              {activity.nome_atividade}
                            </option>
                          ))}
                        </Select>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">Quantidade Produzida</label>
                          <Input
                            type="number"
                            min="0"
                            step="1"
                            value={formData.quantidade_produzida || ''}
                            onChange={(e) => handleInputChange('quantidade_produzida', parseInt(e.target.value) || 0)}
                            placeholder="Ex: 83"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">Tempo Trabalhado (horas)</label>
                          <Input
                            type="number"
                            min="0.1"
                            step="0.1"
                            value={formData.tempo_horas || ''}
                            onChange={(e) => handleInputChange('tempo_horas', parseFloat(e.target.value) || 0)}
                            placeholder="Ex: 3"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {/* WMS Task Manager for Operador de Empilhadeira */}
                  {isOperadorEmpilhadeira && (
                    <WMSTaskManager 
                      selectedOperator={selectedOperator}
                      onOperatorChange={setSelectedOperator}
                      availableOperators={availableOperators}
                      onOperatorsUpdate={setAvailableOperators}
                      onCalculateProductivity={(data) => {
                        // Atualizar dados do formulário com informações do WMS
                        setFormData(prev => ({
                          ...prev,
                          nome_operador: data.nome_operador,
                          valid_tasks_count: data.valid_tasks_count
                        }));
                        
                        // Calcular automaticamente a produtividade
                        const calculatorData: CalculatorInputType = {
                          ...formData,
                          nome_operador: data.nome_operador,
                          valid_tasks_count: data.valid_tasks_count,
                          kpis_atingidos: selectedKPIs
                        };
                        
                        calculate(calculatorData);
                      }}
                      onDateChange={setWmsReferenceDate}
                    />
                  )}

                  {/* Extra Activities Input */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Atividades Extras (R$)</label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.input_adicional || ''}
                      onChange={(e) => handleInputChange('input_adicional', parseFloat(e.target.value) || 0)}
                      placeholder="Ex: 15.50"
                    />
                  </div>

                  {/* KPIs Section */}
                  {availableKPIs.length > 0 && (
                    <div className="space-y-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h4 className="font-medium text-gray-900">KPIs Disponíveis para sua Função/Turno</h4>
                      <p className="text-sm text-gray-600">Selecione os KPIs que você atingiu hoje:</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {availableKPIs.map((kpi) => (
                          <div
                            key={`${kpi.nome_kpi}-${kpi.turno_kpi}`}
                            className={`p-3 rounded-lg border cursor-pointer transition-all ${
                              selectedKPIs.includes(kpi.nome_kpi)
                                ? 'bg-green-100 border-green-300 shadow-sm'
                                : 'bg-white border-gray-200 hover:border-blue-300'
                            }`}
                            onClick={() => toggleKPI(kpi.nome_kpi)}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-gray-900">{kpi.nome_kpi}</p>
                                <p className="text-sm text-gray-500">Meta: {kpi.valor_meta_kpi}% | R$ {kpi.peso_kpi.toFixed(2)}</p>
                              </div>
                              {selectedKPIs.includes(kpi.nome_kpi) && (
                                <CheckCircle className="h-5 w-5 text-green-600" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900" 
                    disabled={calculating || !formData.funcao}
                  >
                    {calculating ? 'Calculando...' : 'Calcular Remuneração'}
                  </Button>
                </form>

                {/* Results */}
                {result && (
                  <div className="mt-6 p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Resultado do Cálculo</h3>
                    <div className="space-y-3">
                      
                      {/* Multiple activities details */}
                      {result?.atividades_detalhes && result.atividades_detalhes.length > 0 && (
                        <div className="mb-4">
                          <h4 className="font-medium text-gray-800 mb-2">Detalhes das Atividades:</h4>
                          <div className="space-y-2">
                            {result?.atividades_detalhes?.map((atividade, index) => (
                              <div key={index} className="bg-white/70 p-3 rounded-lg border">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                                  <div>
                                    <p className="text-gray-600">Atividade:</p>
                                    <p className="font-medium">{atividade.nome}</p>
                                  </div>
                                  <div>
                                    <p className="text-gray-600">Produtividade:</p>
                                    <p className="font-medium">{atividade.produtividade.toFixed(2)} {atividade.unidade}</p>
                                  </div>
                                  <div>
                                    <p className="text-gray-600">Nível:</p>
                                    <p className="font-medium text-blue-600">{atividade.nivel}</p>
                                  </div>
                                  <div>
                                    <p className="text-gray-600">Valor:</p>
                                    <p className="font-medium text-green-600">R$ {atividade.valor_total.toFixed(2)}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Single activity details */}
                      {result?.produtividade_alcancada && result?.nivel_atingido && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div className="bg-white/70 p-3 rounded-lg">
                            <p className="text-sm text-gray-600">Produtividade Alcançada</p>
                            <p className="text-lg font-semibold text-purple-600">
                              {result?.produtividade_alcancada?.toFixed(2)} {result?.unidade_medida}
                            </p>
                          </div>
                          <div className="bg-white/70 p-3 rounded-lg">
                            <p className="text-sm text-gray-600">Nível Atingido</p>
                            <p className="text-lg font-semibold text-blue-600">
                              {result?.nivel_atingido}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Valid tasks details */}
                      {result?.tarefas_validas !== undefined && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-700">Tarefas Válidas ({result?.tarefas_validas}):</span>
                          <span className="font-semibold text-purple-600">
                            R$ {result?.valor_tarefas?.toFixed(2) || '0.00'}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between items-center">
                        <span className="text-gray-700">Valor Bruto Atividades:</span>
                        <span className="font-semibold text-purple-600">
                          R$ {((result?.subtotalAtividades || 0) * 2).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700">Atividades (50%):</span>
                        <span className="font-semibold text-green-600">
                          R$ {(result?.subtotalAtividades || 0).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700">KPIs Atingidos:</span>
                        <span className="font-semibold text-blue-600">
                          {result?.kpisAtingidos?.length || 0}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700">Valor KPIs:</span>
                        <span className="font-semibold text-blue-600">
                          R$ {(result?.bonusKpis || 0).toFixed(2)}
                        </span>
                      </div>
                      {formData.input_adicional && formData.input_adicional > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-700">Atividades Extras:</span>
                          <span className="font-semibold text-orange-600">
                            R$ {formData.input_adicional.toFixed(2)}
                          </span>
                        </div>
                      )}
                      <div className="border-t pt-3">
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-semibold text-gray-900">Total Estimado do Dia:</span>
                          <span className="text-2xl font-bold text-gray-900">
                            R$ {(result?.remuneracaoTotal || 0).toFixed(2)}
                          </span>
                        </div>
                      </div>
                      {result?.kpisAtingidos && result.kpisAtingidos.length > 0 && (
                        <div className="mt-4">
                          <p className="text-sm text-gray-600 mb-2">KPIs Atingidos:</p>
                          <div className="flex flex-wrap gap-2 mb-3">
                            {result?.kpisAtingidos?.map((kpi, index) => (
                              <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                {kpi}
                              </span>
                            ))}
                          </div>
                          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                            <div className="flex items-start">
                              <div className="flex-shrink-0">
                                <svg className="h-4 w-4 text-amber-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                              </div>
                              <div className="ml-2">
                                <p className="text-xs text-amber-800">
                                  <strong>Limite diário:</strong> Máximo 1 lançamento de KPI por dia. Verifique se você já possui lançamentos para a data escolhida.
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Lançar Produtividade Button - Only for collaborators */}
                    <div className="mt-6 pt-4 border-t border-green-200">
                      <Button
                        onClick={handleOpenLancamento}
                        className="w-full bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white"
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Lançar Produtividade
                      </Button>
                    </div>
                  </div>
                )}

                {/* Lançamento Dialog */}
                {showLancamento && result && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Lançar Produtividade</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Selecione a data para lançar sua produtividade calculada de <strong>R$ {(result?.remuneracaoTotal || 0).toFixed(2)}</strong>
                      </p>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Data do Lançamento
                            {isOperadorEmpilhadeira && (
                              <span className="text-xs text-blue-600 ml-2">
                                (Travada pela data de referência das tarefas)
                              </span>
                            )}
                          </label>
                          <Input
                            type="date"
                            value={dataLancamento}
                            onChange={async (e) => {
                              const newDate = e.target.value;
                              setDataLancamento(newDate);
                              
                              // Check KPI limit for the new date if KPIs are selected
                              if (selectedKPIs.length > 0 && newDate) {
                                const canLaunch = await checkKPILimit(newDate);
                                if (!canLaunch) {
                                  alert('⚠️ Atenção: Você já possui 1 lançamento de KPI para esta data.\n\nPara prosseguir:\n• Remova os KPIs do cálculo atual, ou\n• Escolha uma data diferente');
                                }
                              }
                            }}
                            max={new Date().toISOString().split('T')[0]}
                            disabled={isOperadorEmpilhadeira}
                            className={isOperadorEmpilhadeira ? 'bg-gray-100 cursor-not-allowed' : ''}
                          />
                          {isOperadorEmpilhadeira && !wmsReferenceDate && (
                            <p className="text-xs text-amber-600 mt-1">
                              ⚠️ Selecione uma data de referência no analisador de tarefas WMS primeiro
                            </p>
                          )}
                        </div>
                        
                        <div className="flex space-x-3 pt-4">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setShowLancamento(false);
                              setDataLancamento('');
                            }}
                            className="flex-1"
                            disabled={lancando}
                          >
                            Cancelar
                          </Button>
                          <Button
                            onClick={handleLancarProdutividade}
                            disabled={!dataLancamento || lancando}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                          >
                            {lancando ? 'Lançando...' : 'Confirmar Lançamento'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {error && (
                  <Alert variant="destructive" className="mt-6">
                    <AlertTitle>Erro no Cálculo</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
