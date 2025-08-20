"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Home;
const react_1 = require("react");
const lucide_react_1 = require("lucide-react");
const react_router_1 = require("react-router");
const Card_1 = require("@/react-app/components/Card");
const Button_1 = require("@/react-app/components/Button");
const Input_1 = require("@/react-app/components/Input");
const Select_1 = require("@/react-app/components/Select");
const Alert_1 = require("@/react-app/components/Alert");
const FileUpload_1 = require("@/react-app/components/FileUpload");
const AuthGuard_1 = __importDefault(require("@/react-app/components/AuthGuard"));
const UserMenu_1 = __importDefault(require("@/react-app/components/UserMenu"));
const useAuth_1 = require("@/react-app/hooks/useAuth");
const useApi_1 = require("@/react-app/hooks/useApi");
const taskProcessor_1 = require("@/react-app/utils/taskProcessor");
function Home() {
    const { user, isAdmin } = (0, useAuth_1.useAuth)();
    const { activityNames, loading: activityNamesLoading } = (0, useApi_1.useActivityNames)();
    const { functions, loading: functionsLoading } = (0, useApi_1.useFunctions)();
    const { result, loading: calculating, error, calculate } = (0, useApi_1.useCalculator)();
    const [availableKPIs, setAvailableKPIs] = (0, react_1.useState)([]);
    const [selectedKPIs, setSelectedKPIs] = (0, react_1.useState)([]);
    const [uploadedFile, setUploadedFile] = (0, react_1.useState)(null);
    const [validTasksCount, setValidTasksCount] = (0, react_1.useState)(0);
    const [validTasksDetails, setValidTasksDetails] = (0, react_1.useState)([]);
    const [processingTasks, setProcessingTasks] = (0, react_1.useState)(false);
    // Lançamento states
    const [showLancamento, setShowLancamento] = (0, react_1.useState)(false);
    const [dataLancamento, setDataLancamento] = (0, react_1.useState)('');
    const [lancando, setLancando] = (0, react_1.useState)(false);
    // Multiple activities for Ajudantes de Armazém
    const [multipleActivities, setMultipleActivities] = (0, react_1.useState)([
        { nome_atividade: '', quantidade_produzida: 0, tempo_horas: 0 }
    ]);
    const [formData, setFormData] = (0, react_1.useState)({
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
    // Available operators list
    const availableOperators = [
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
    ];
    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.funcao)
            return;
        const submitData = {
            ...formData,
            kpis_atingidos: selectedKPIs,
        };
        if (isAjudanteArmazem) {
            // Validate multiple activities
            const validActivities = multipleActivities.filter(act => act.nome_atividade && act.quantidade_produzida > 0 && act.tempo_horas > 0);
            if (validActivities.length === 0)
                return;
            // Map to the expected schema format
            submitData.multiple_activities = validActivities.map(act => ({
                nome: act.nome_atividade,
                quantidade: act.quantidade_produzida,
                tempo: act.tempo_horas
            }));
        }
        else if (isOperadorEmpilhadeira) {
            // For Operador de Empilhadeira, include valid tasks count
            submitData.valid_tasks_count = validTasksCount;
            submitData.nome_operador = formData.nome_operador;
        }
        else {
            // Single activity validation
            if (!formData.nome_atividade || formData.quantidade_produzida <= 0 || formData.tempo_horas <= 0)
                return;
        }
        calculate(submitData);
    };
    const checkKPILimit = async (date) => {
        if (!user?.id || !selectedKPIs.length)
            return true; // No KPIs selected, no need to check
        try {
            const response = await fetch('/api/kpis/check-limit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: user.id,
                    data_lancamento: date
                }),
            });
            if (!response.ok)
                return true; // If check fails, allow the attempt
            const data = await response.json();
            return data.can_launch;
        }
        catch (err) {
            console.error('Erro ao verificar limite de KPIs:', err);
            return true; // If check fails, allow the attempt
        }
    };
    const handleOpenLancamento = async () => {
        if (!result)
            return;
        // If user has selected KPIs, check if they can launch more for today
        if (selectedKPIs.length > 0) {
            const today = new Date().toISOString().split('T')[0];
            const canLaunch = await checkKPILimit(today);
            if (!canLaunch) {
                alert('❌ Limite diário de KPIs atingido!\n\n💡 Você já possui 1 lançamento de KPI para hoje.\n\nPara lançar novos KPIs:\n• Remova os KPIs do cálculo atual, ou\n• Escolha uma data diferente no modal de lançamento');
                return;
            }
        }
        setShowLancamento(true);
    };
    const handleLancarProdutividade = async () => {
        if (!result || !dataLancamento)
            return;
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
            const lancamentoData = {
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
        }
        catch (err) {
            console.error('Erro ao lançar produtividade:', err);
            alert('Erro ao lançar produtividade. Tente novamente.');
        }
        finally {
            setLancando(false);
        }
    };
    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
        // Reset KPIs and activities when function or shift changes
        if (field === 'funcao' || field === 'turno') {
            setSelectedKPIs([]);
            if (field === 'funcao') {
                setMultipleActivities([{ nome_atividade: '', quantidade_produzida: 0, tempo_horas: 0 }]);
                setUploadedFile(null);
                setValidTasksCount(0);
                setValidTasksDetails([]);
            }
        }
        // Reset valid tasks count when operator name changes
        if (field === 'nome_operador') {
            setValidTasksCount(0);
            setValidTasksDetails([]);
        }
    };
    const addActivity = () => {
        setMultipleActivities(prev => [
            ...prev,
            { nome_atividade: '', quantidade_produzida: 0, tempo_horas: 0 }
        ]);
    };
    const removeActivity = (index) => {
        setMultipleActivities(prev => prev.filter((_, i) => i !== index));
    };
    const updateActivity = (index, field, value) => {
        setMultipleActivities(prev => prev.map((act, i) => i === index ? { ...act, [field]: value } : act));
    };
    const handleFileUpload = async (file) => {
        setUploadedFile(file);
        setValidTasksCount(0); // Reset count when new file is uploaded
    };
    const processTaskFile = async () => {
        if (!uploadedFile || !formData.nome_operador)
            return;
        setProcessingTasks(true);
        try {
            const text = await uploadedFile.text();
            console.log('=== PROCESSAMENTO ARQUIVO TAREFAS ===');
            console.log('Nome do arquivo:', uploadedFile.name);
            console.log('Tamanho do arquivo:', text.length, 'caracteres');
            console.log('Operador selecionado:', formData.nome_operador);
            console.log('Conteúdo do arquivo (primeiros 2000 caracteres):', text.substring(0, 2000));
            const tasks = (0, taskProcessor_1.parseCSV)(text);
            console.log('Tarefas parseadas do CSV:', tasks.length);
            if (tasks.length === 0) {
                alert('Nenhuma tarefa foi encontrada no arquivo. Verifique o formato do arquivo e tente novamente.');
                return;
            }
            // Show sample of parsed tasks
            console.log('Exemplo das primeiras 5 tarefas parseadas:', tasks.slice(0, 5));
            // Show unique operators found in file
            const uniqueOperators = [...new Set(tasks.map(t => t.Usuário?.trim()).filter(Boolean))];
            console.log('Operadores únicos no arquivo:', uniqueOperators);
            const validTasksResult = (0, taskProcessor_1.calculateValidTasks)(tasks, formData.nome_operador);
            console.log('Resultado das tarefas válidas:', validTasksResult);
            setValidTasksCount(validTasksResult.total);
            setValidTasksDetails(validTasksResult.detalhes);
            if (validTasksResult.total === 0) {
                const operatorsInFile = uniqueOperators.join(', ');
                alert(`Nenhuma tarefa válida encontrada para o operador "${formData.nome_operador}".\n\nOperadores encontrados no arquivo:\n${operatorsInFile}\n\nVerifique se o nome do operador está correto.`);
            }
        }
        catch (error) {
            console.error('Erro ao processar arquivo:', error);
            alert('Erro ao processar arquivo: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
            setValidTasksCount(0);
            setValidTasksDetails([]);
        }
        finally {
            setProcessingTasks(false);
        }
    };
    const handleRemoveFile = () => {
        setUploadedFile(null);
        setValidTasksCount(0);
        setValidTasksDetails([]);
    };
    const fetchAvailableKPIs = async (funcao, turno) => {
        if (!funcao || !turno)
            return;
        try {
            const response = await fetch(`/api/kpis/available?funcao=${encodeURIComponent(funcao)}&turno=${encodeURIComponent(turno)}`);
            if (!response.ok)
                throw new Error('Failed to fetch KPIs');
            const data = await response.json();
            setAvailableKPIs(data);
        }
        catch (err) {
            console.error('Error fetching KPIs:', err);
            setAvailableKPIs([]);
        }
    };
    const toggleKPI = (kpiName) => {
        setSelectedKPIs(prev => prev.includes(kpiName)
            ? prev.filter(name => name !== kpiName)
            : [...prev, kpiName]);
    };
    (0, react_1.useEffect)(() => {
        if (formData.funcao && formData.turno) {
            fetchAvailableKPIs(formData.funcao, formData.turno);
        }
    }, [formData.funcao, formData.turno]);
    // Redirect admins to validation page directly - admins don't use calculator
    if (isAdmin) {
        return <react_router_1.Navigate to="/admin/validacao" replace/>;
    }
    return (<AuthGuard_1.default>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
        {/* Header */}
        <header className="border-b bg-white/70 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
                  <lucide_react_1.Truck className="h-5 w-5 text-white"/>
                </div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                  RV Armazém CDD Maceió
                </h1>
              </div>
              <div className="flex items-center space-x-3">
                <react_router_1.Link to="/dashboard">
                  <Button_1.Button variant="outline" size="sm">
                    <lucide_react_1.TrendingUp className="h-4 w-4 mr-2"/>
                    Dashboard
                  </Button_1.Button>
                </react_router_1.Link>
                <UserMenu_1.default />
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
            <Card_1.Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <Card_1.CardHeader>
                <Card_1.CardTitle className="flex items-center space-x-2">
                  <lucide_react_1.TrendingUp className="h-5 w-5 text-blue-600"/>
                  <span>Cálculo Diário</span>
                </Card_1.CardTitle>
                <Card_1.CardDescription>
                  Preencha os dados da sua produção do dia para calcular sua remuneração
                </Card_1.CardDescription>
              </Card_1.CardHeader>
              <Card_1.CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Função</label>
                      <Select_1.Select value={formData.funcao} onChange={(e) => handleInputChange('funcao', e.target.value)} placeholder="Selecione sua função" disabled={functionsLoading}>
                        {functions.map((func) => (<option key={func.funcao} value={func.funcao}>
                            {func.funcao}
                          </option>))}
                      </Select_1.Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Turno</label>
                      <Select_1.Select value={formData.turno} onChange={(e) => handleInputChange('turno', e.target.value)}>
                        <option value="Manhã">Manhã</option>
                        <option value="Tarde">Tarde</option>
                        <option value="Noite">Noite</option>
                      </Select_1.Select>
                    </div>
                  </div>

                  {/* Multiple Activities for Ajudantes de Armazém */}
                  {isAjudanteArmazem && (<div className="space-y-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-gray-900">Atividades Realizadas</h4>
                        <Button_1.Button type="button" variant="outline" size="sm" onClick={addActivity} className="text-amber-600 border-amber-300 hover:bg-amber-100">
                          <lucide_react_1.Plus className="h-4 w-4 mr-1"/>
                          Adicionar
                        </Button_1.Button>
                      </div>
                      <p className="text-sm text-gray-600">Adicione todas as atividades realizadas no dia:</p>
                      
                      {multipleActivities.map((activity, index) => (<div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3 bg-white rounded-lg border">
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-gray-600">Atividade</label>
                            <Select_1.Select value={activity.nome_atividade} onChange={(e) => updateActivity(index, 'nome_atividade', e.target.value)} placeholder="Selecione" disabled={activityNamesLoading}>
                              {activityNames.map((act) => (<option key={act.nome_atividade} value={act.nome_atividade}>
                                  {act.nome_atividade}
                                </option>))}
                            </Select_1.Select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-gray-600">Quantidade</label>
                            <Input_1.Input type="number" min="0" step="1" value={activity.quantidade_produzida || ''} onChange={(e) => updateActivity(index, 'quantidade_produzida', parseInt(e.target.value) || 0)} placeholder="Ex: 83"/>
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-gray-600">Tempo (h)</label>
                            <Input_1.Input type="number" min="0.1" step="0.1" value={activity.tempo_horas || ''} onChange={(e) => updateActivity(index, 'tempo_horas', parseFloat(e.target.value) || 0)} placeholder="Ex: 3"/>
                          </div>
                          <div className="flex items-end">
                            {multipleActivities.length > 1 && (<Button_1.Button type="button" variant="destructive" size="sm" onClick={() => removeActivity(index)} className="w-full">
                                <lucide_react_1.Trash2 className="h-4 w-4"/>
                              </Button_1.Button>)}
                          </div>
                        </div>))}
                    </div>)}

                  {/* Single Activity for other functions */}
                  {!isAjudanteArmazem && !isOperadorEmpilhadeira && (<>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Atividade Realizada</label>
                        <Select_1.Select value={formData.nome_atividade || ''} onChange={(e) => handleInputChange('nome_atividade', e.target.value)} placeholder="Selecione a atividade" disabled={activityNamesLoading}>
                          {activityNames.map((activity) => (<option key={activity.nome_atividade} value={activity.nome_atividade}>
                              {activity.nome_atividade}
                            </option>))}
                        </Select_1.Select>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">Quantidade Produzida</label>
                          <Input_1.Input type="number" min="0" step="1" value={formData.quantidade_produzida || ''} onChange={(e) => handleInputChange('quantidade_produzida', parseInt(e.target.value) || 0)} placeholder="Ex: 83"/>
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">Tempo Trabalhado (horas)</label>
                          <Input_1.Input type="number" min="0.1" step="0.1" value={formData.tempo_horas || ''} onChange={(e) => handleInputChange('tempo_horas', parseFloat(e.target.value) || 0)} placeholder="Ex: 3"/>
                        </div>
                      </div>
                    </>)}

                  {/* Valid Tasks for Operador de Empilhadeira */}
                  {isOperadorEmpilhadeira && (<div className="space-y-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                      <h4 className="font-medium text-gray-900">Tarefas Válidas do Operador</h4>
                      <p className="text-sm text-gray-600">
                        Faça upload do arquivo de tarefas e informe o nome do operador para calcular as tarefas válidas:
                      </p>
                      
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">Nome do Operador</label>
                          <Select_1.Select value={formData.nome_operador || ''} onChange={(e) => handleInputChange('nome_operador', e.target.value)} placeholder="Selecione o operador">
                            {availableOperators.map((operator) => (<option key={operator} value={operator}>
                                {operator}
                              </option>))}
                          </Select_1.Select>
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">Arquivo de Tarefas</label>
                          <FileUpload_1.FileUpload onFileUpload={handleFileUpload} accept=".csv,.xlsx,.xls" uploadedFileName={uploadedFile?.name} onRemoveFile={handleRemoveFile}/>
                        </div>

                        {uploadedFile && formData.nome_operador && (<div className="flex justify-center">
                            <Button_1.Button type="button" onClick={processTaskFile} disabled={processingTasks} className="bg-purple-600 hover:bg-purple-700 text-white">
                              <lucide_react_1.Play className="h-4 w-4 mr-2"/>
                              {processingTasks ? 'Processando...' : 'Processar Arquivo de Tarefas'}
                            </Button_1.Button>
                          </div>)}

                        {validTasksCount > 0 && (<div className="space-y-3">
                            <div className="p-3 bg-green-100 border border-green-300 rounded-lg">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-green-800">
                                  Total de Tarefas Válidas:
                                </span>
                                <span className="text-lg font-bold text-green-900">
                                  {validTasksCount} tarefas
                                </span>
                              </div>
                              <p className="text-xs text-green-700 mt-1">
                                Valor: R$ {(validTasksCount * 0.093).toFixed(2)} (R$ 0,093 por tarefa)
                              </p>
                            </div>

                            {validTasksDetails.length > 0 && (<div className="bg-white border border-gray-200 rounded-lg">
                                <div className="p-3 border-b border-gray-200">
                                  <h5 className="text-sm font-medium text-gray-900">Tarefas Válidas por Tipo</h5>
                                </div>
                                <div className="p-3 space-y-2">
                                  {validTasksDetails.map((detail, index) => (<div key={index} className="flex justify-between items-center text-sm">
                                      <div>
                                        <span className="font-medium text-gray-900">{detail.tipo}</span>
                                        <span className="text-gray-500 ml-2">(Meta: {detail.meta_segundos}s)</span>
                                      </div>
                                      <div className="text-right">
                                        <span className="font-semibold text-purple-600">{detail.quantidade} tarefas</span>
                                        <div className="text-xs text-gray-500">
                                          R$ {(detail.quantidade * 0.093).toFixed(2)}
                                        </div>
                                      </div>
                                    </div>))}
                                </div>
                              </div>)}
                          </div>)}
                      </div>
                    </div>)}

                  {/* Extra Activities Input */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Atividades Extras (R$)</label>
                    <Input_1.Input type="number" min="0" step="0.01" value={formData.input_adicional || ''} onChange={(e) => handleInputChange('input_adicional', parseFloat(e.target.value) || 0)} placeholder="Ex: 15.50"/>
                  </div>

                  {/* KPIs Section */}
                  {availableKPIs.length > 0 && (<div className="space-y-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h4 className="font-medium text-gray-900">KPIs Disponíveis para sua Função/Turno</h4>
                      <p className="text-sm text-gray-600">Selecione os KPIs que você atingiu hoje:</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {availableKPIs.map((kpi) => (<div key={`${kpi.nome_kpi}-${kpi.turno_kpi}`} className={`p-3 rounded-lg border cursor-pointer transition-all ${selectedKPIs.includes(kpi.nome_kpi)
                    ? 'bg-green-100 border-green-300 shadow-sm'
                    : 'bg-white border-gray-200 hover:border-blue-300'}`} onClick={() => toggleKPI(kpi.nome_kpi)}>
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-gray-900">{kpi.nome_kpi}</p>
                                <p className="text-sm text-gray-500">Meta: {kpi.valor_meta_kpi}% | R$ {kpi.peso_kpi.toFixed(2)}</p>
                              </div>
                              {selectedKPIs.includes(kpi.nome_kpi) && (<lucide_react_1.CheckCircle className="h-5 w-5 text-green-600"/>)}
                            </div>
                          </div>))}
                      </div>
                    </div>)}

                  <Button_1.Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900" disabled={calculating || !formData.funcao}>
                    {calculating ? 'Calculando...' : 'Calcular Remuneração'}
                  </Button_1.Button>
                </form>

                {/* Results */}
                {result && (<div className="mt-6 p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Resultado do Cálculo</h3>
                    <div className="space-y-3">
                      
                      {/* Multiple activities details */}
                      {result.atividades_detalhes && result.atividades_detalhes.length > 0 && (<div className="mb-4">
                          <h4 className="font-medium text-gray-800 mb-2">Detalhes das Atividades:</h4>
                          <div className="space-y-2">
                            {result.atividades_detalhes.map((atividade, index) => (<div key={index} className="bg-white/70 p-3 rounded-lg border">
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
                              </div>))}
                          </div>
                        </div>)}

                      {/* Single activity details */}
                      {result.produtividade_alcancada && result.nivel_atingido && (<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div className="bg-white/70 p-3 rounded-lg">
                            <p className="text-sm text-gray-600">Produtividade Alcançada</p>
                            <p className="text-lg font-semibold text-purple-600">
                              {result.produtividade_alcancada.toFixed(2)} {result.unidade_medida}
                            </p>
                          </div>
                          <div className="bg-white/70 p-3 rounded-lg">
                            <p className="text-sm text-gray-600">Nível Atingido</p>
                            <p className="text-lg font-semibold text-blue-600">
                              {result.nivel_atingido}
                            </p>
                          </div>
                        </div>)}

                      {/* Valid tasks details */}
                      {result.tarefas_validas !== undefined && (<div className="flex justify-between items-center">
                          <span className="text-gray-700">Tarefas Válidas ({result.tarefas_validas}):</span>
                          <span className="font-semibold text-purple-600">
                            R$ {result.valor_tarefas?.toFixed(2) || '0.00'}
                          </span>
                        </div>)}

                      <div className="flex justify-between items-center">
                        <span className="text-gray-700">Valor Bruto Atividades:</span>
                        <span className="font-semibold text-purple-600">
                          R$ {(result.subtotal_atividades * 2).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700">Atividades (50%):</span>
                        <span className="font-semibold text-green-600">
                          R$ {result.subtotal_atividades.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700">KPIs Atingidos:</span>
                        <span className="font-semibold text-blue-600">
                          R$ {result.bonus_kpis.toFixed(2)}
                        </span>
                      </div>
                      {formData.input_adicional && formData.input_adicional > 0 && (<div className="flex justify-between items-center">
                          <span className="text-gray-700">Atividades Extras:</span>
                          <span className="font-semibold text-orange-600">
                            R$ {formData.input_adicional.toFixed(2)}
                          </span>
                        </div>)}
                      <div className="border-t pt-3">
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-semibold text-gray-900">Total Estimado do Dia:</span>
                          <span className="text-2xl font-bold text-gray-900">
                            R$ {result.remuneracao_total.toFixed(2)}
                          </span>
                        </div>
                      </div>
                      {result.kpis_atingidos.length > 0 && (<div className="mt-4">
                          <p className="text-sm text-gray-600 mb-2">KPIs Atingidos:</p>
                          <div className="flex flex-wrap gap-2 mb-3">
                            {result.kpis_atingidos.map((kpi, index) => (<span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                {kpi}
                              </span>))}
                          </div>
                          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                            <div className="flex items-start">
                              <div className="flex-shrink-0">
                                <svg className="h-4 w-4 text-amber-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                                </svg>
                              </div>
                              <div className="ml-2">
                                <p className="text-xs text-amber-800">
                                  <strong>Limite diário:</strong> Máximo 1 lançamento de KPI por dia. Verifique se você já possui lançamentos para a data escolhida.
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>)}
                    </div>
                    
                    {/* Lançar Produtividade Button - Only for collaborators */}
                    <div className="mt-6 pt-4 border-t border-green-200">
                      <Button_1.Button onClick={handleOpenLancamento} className="w-full bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white">
                        <lucide_react_1.Send className="h-4 w-4 mr-2"/>
                        Lançar Produtividade
                      </Button_1.Button>
                    </div>
                  </div>)}

                {/* Lançamento Dialog */}
                {showLancamento && result && (<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Lançar Produtividade</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Selecione a data para lançar sua produtividade calculada de <strong>R$ {result.remuneracao_total.toFixed(2)}</strong>
                      </p>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Data do Lançamento
                          </label>
                          <Input_1.Input type="date" value={dataLancamento} onChange={async (e) => {
                const newDate = e.target.value;
                setDataLancamento(newDate);
                // Check KPI limit for the new date if KPIs are selected
                if (selectedKPIs.length > 0 && newDate) {
                    const canLaunch = await checkKPILimit(newDate);
                    if (!canLaunch) {
                        alert('⚠️ Atenção: Você já possui 1 lançamento de KPI para esta data.\n\nPara prosseguir:\n• Remova os KPIs do cálculo atual, ou\n• Escolha uma data diferente');
                    }
                }
            }} max={new Date().toISOString().split('T')[0]}/>
                        </div>
                        
                        <div className="flex space-x-3 pt-4">
                          <Button_1.Button variant="outline" onClick={() => {
                setShowLancamento(false);
                setDataLancamento('');
            }} className="flex-1" disabled={lancando}>
                            Cancelar
                          </Button_1.Button>
                          <Button_1.Button onClick={handleLancarProdutividade} disabled={!dataLancamento || lancando} className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                            {lancando ? 'Lançando...' : 'Confirmar Lançamento'}
                          </Button_1.Button>
                        </div>
                      </div>
                    </div>
                  </div>)}

                {error && (<Alert_1.Alert variant="destructive" className="mt-6">
                    <Alert_1.AlertTitle>Erro no Cálculo</Alert_1.AlertTitle>
                    <Alert_1.AlertDescription>{error}</Alert_1.AlertDescription>
                  </Alert_1.Alert>)}
              </Card_1.CardContent>
            </Card_1.Card>
          </div>
        </main>
      </div>
    </AuthGuard_1.default>);
}
