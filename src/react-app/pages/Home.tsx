import { useState, useEffect } from 'react';
import { Truck, TrendingUp, CheckCircle, Plus, Trash2, Play, Send } from 'lucide-react';
import { Link, Navigate } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/react-app/components/Card';
import { Button } from '@/react-app/components/Button';
import { Input } from '@/react-app/components/Input';
import { Select } from '@/react-app/components/Select';
import { Alert, AlertDescription, AlertTitle } from '@/react-app/components/Alert';
import { FileUpload } from '@/react-app/components/FileUpload';
import AuthGuard from '@/react-app/components/AuthGuard';
import UserMenu from '@/react-app/components/UserMenu';
import WMSTaskManager from '@/react-app/components/WMSTaskManager';

import { useAuth } from '@/react-app/hooks/useAuth';
import { useActivityNames, useFunctions, useCalculator } from '@/react-app/hooks/useApi';
import { CalculatorInputType, KPIType, MultipleActivityType, CreateLancamentoType } from '@/shared/types';
import { parseCSV, calculateValidTasks, parseDateTime, TASK_METAS, isOperatorMatch } from '@/react-app/utils/taskProcessor';

export default function Home() {
  const { user, isAdmin } = useAuth();
  const { activityNames, loading: activityNamesLoading } = useActivityNames();
  const { functions, loading: functionsLoading } = useFunctions();
  const { result, loading: calculating, error, calculate } = useCalculator();

  const [availableKPIs, setAvailableKPIs] = useState<KPIType[]>([]);
  const [selectedKPIs, setSelectedKPIs] = useState<string[]>([]);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [validTasksCount, setValidTasksCount] = useState<number>(0);
  const [validTasksDetails, setValidTasksDetails] = useState<any[]>([]);
  const [processingTasks, setProcessingTasks] = useState<boolean>(false);
  const [existingValidTasks, setExistingValidTasks] = useState<number>(0);
  const [loadingExistingTasks, setLoadingExistingTasks] = useState<boolean>(false);
  
  // Task statistics state
  const [taskStats, setTaskStats] = useState<any>(null);
  const [loadingTaskStats, setLoadingTaskStats] = useState<boolean>(false);
  
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
      setFormData(prev => ({
        ...prev,
        funcao: user.funcao
      }));
    }
  }, [user?.funcao]);
  
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

  // Função para buscar tarefas válidas existentes do operador
  const fetchExistingValidTasks = async (operatorName: string, date?: string) => {
    if (!operatorName.trim()) {
      setExistingValidTasks(0);
      return;
    }
    
    setLoadingExistingTasks(true);
    try {
      // Construir URL com parâmetro de data se fornecido
      let url = `/api/wms-tasks/operator/${encodeURIComponent(operatorName)}`;
      if (date) {
        url += `?date=${date}`;
      }
      
      const response = await fetch(url);
      const result = await response.json();
      
      if (result.success) {
        setExistingValidTasks(result.valid_tasks_count || 0);
        console.log(`Tarefas válidas existentes para ${operatorName}${date ? ` na data ${date}` : ''}:`, result.valid_tasks_count);
      } else {
        setExistingValidTasks(0);
        console.warn('Erro ao buscar tarefas existentes:', result.error);
      }
    } catch (error) {
      console.error('Erro ao buscar tarefas válidas existentes:', error);
      setExistingValidTasks(0);
    } finally {
      setLoadingExistingTasks(false);
    }
  };

  // Função para buscar estatísticas detalhadas das tarefas WMS
  const fetchTaskStats = async (operatorName: string) => {
    if (!operatorName.trim()) {
      setTaskStats(null);
      return;
    }
    
    setLoadingTaskStats(true);
    try {
      const response = await fetch(`/api/wms-tasks/operator/${encodeURIComponent(operatorName)}/stats`);
      const result = await response.json();
      
      if (result.success) {
        setTaskStats(result.estatisticas);
        console.log(`Estatísticas para ${operatorName}:`, result.estatisticas);
      } else {
        setTaskStats(null);
        console.warn('Erro ao buscar estatísticas:', result.error);
      }
    } catch (error) {
      console.error('Erro ao buscar estatísticas das tarefas:', error);
      setTaskStats(null);
    } finally {
      setLoadingTaskStats(false);
    }
  };

  // Função para listar todos os operadores do banco
  const listAllOperators = async () => {
    try {
      const response = await fetch('/api/wms-operators');
      const data = await response.json();
      
      if (data.success) {
        console.log('Operadores únicos no banco:', data.operadores);
        console.log('Total de operadores:', data.total);
        
        // Verificar se ALMIR existe e como está armazenado
        const almirVariations = data.operadores.filter(op => 
          op.toLowerCase().includes('almir')
        );
        console.log('Variações do nome ALMIR encontradas:', almirVariations);
        
        alert(`Total de operadores: ${data.total}\n\nVariações do ALMIR encontradas:\n${almirVariations.join('\n')}\n\nVerifique o console para ver todos os operadores.`);
      } else {
        console.error('Erro ao buscar operadores:', data.error);
        alert('Erro ao buscar operadores: ' + data.error);
      }
    } catch (error) {
      console.error('Erro ao buscar operadores:', error);
      alert('Erro ao buscar operadores: ' + error.message);
    }
  };

  const checkOperatorExists = async (operatorName: string) => {
    try {
      const response = await fetch(`/api/check-operator/${encodeURIComponent(operatorName)}`);
      const data = await response.json();
      
      if (data.success) {
        if (data.exists) {
          alert(`✅ Operador encontrado na tabela usuarios:\n\nID: ${data.operador.id}\nNome: ${data.operador.nome}\nFunção: ${data.operador.funcao}`);
        } else {
          const shouldRegister = confirm(`❌ Operador "${operatorName}" não encontrado na tabela usuarios.\n\nDeseja cadastrá-lo agora?`);
          if (shouldRegister) {
            await registerOperator(operatorName);
          }
        }
      } else {
        alert('Erro ao verificar operador: ' + data.error);
      }
    } catch (error) {
      console.error('Erro ao verificar operador:', error);
      alert('Erro ao conectar com o servidor');
    }
  };

  const registerOperator = async (operatorName: string) => {
    try {
      const response = await fetch('/api/register-operator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ nome_operador: operatorName })
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert(`✅ Operador cadastrado com sucesso!\n\nID: ${data.operador.id}\nNome: ${data.operador.nome}\nFunção: ${data.operador.funcao}`);
      } else {
        alert('Erro ao cadastrar operador: ' + data.error);
      }
    } catch (error) {
      console.error('Erro ao cadastrar operador:', error);
      alert('Erro ao conectar com o servidor');
    }
  };

  const testTaskImport = async () => {
    try {
      console.log('=== TESTE DE IMPORTAÇÃO DE TAREFAS ===');
      
      // Dados de teste simulando um CSV
      const testTasks = [
        {
          Tarefa: 'TEST001',
          Tipo: 'Picking',
          Usuário: 'ALMIR VICTOR ALENCAR DA ROCHA',
          'Concluída Task': '1',
          'Data Última Associação': '2025-01-20 08:00:00',
          'Data de Alteração': '2025-01-20 08:05:30',
          'Data de Criação': '2025-01-20 07:55:00',
          'Data de Liberação': '2025-01-20 07:58:00',
          Origem: 'A1-01-01',
          Destino: 'DOCK-01',
          Palete: 'PAL001',
          'Armazém Mapa': 'WH01',
          'Placa Carreta': null,
          'Placa Cavalo': null,
          Prioridade: 'Normal',
          Status: 'Concluída'
        }
      ];
      
      console.log('Enviando dados de teste:', {
        nome_operador: 'ALMIR VICTOR ALENCAR DA ROCHA',
        tarefas: testTasks
      });
      
      const response = await fetch('/api/wms-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome_operador: 'ALMIR VICTOR ALENCAR DA ROCHA',
          tarefas: testTasks
        })
      });
      
      const result = await response.json();
      console.log('Resultado do teste:', result);
      
      if (result.success) {
        alert(`✅ Teste de importação bem-sucedido!\n\nTarefas inseridas: ${result.tarefas_inseridas}\nTarefas válidas: ${result.tarefas_validas}\n\n${result.message}`);
      } else {
        alert(`❌ Erro no teste de importação:\n\n${result.error}`);
      }
    } catch (error) {
      console.error('Erro no teste de importação:', error);
      alert('Erro ao conectar com o servidor durante o teste');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.funcao) return;

    const submitData: CalculatorInputType = {
      ...formData,
      kpis_atingidos: selectedKPIs,
    };

    if (isAjudanteArmazem) {
      // Validate multiple activities
      const validActivities = multipleActivities.filter(
        act => act.nome_atividade && act.quantidade_produzida > 0 && act.tempo_horas > 0
      );
      if (validActivities.length === 0) return;
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
      
      console.log(`Tarefas válidas para cálculo: ${formData.valid_tasks_count || 0}`);
    } else {
      // Single activity validation
      if (!formData.nome_atividade || formData.quantidade_produzida! <= 0 || formData.tempo_horas! <= 0) return;
    }

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
    if (!result) return;
    
    // If user has selected KPIs, check if they can launch more for today
    if (selectedKPIs.length > 0) {
      const today = new Date().toISOString().split('T')[0];
      const canLaunch = await checkKPILimit(today);
      
      if (!canLaunch) {
        alert('❌ Limite diário de KPIs atingido!\n\n💡 Você já possui 1 lançamento de KPI para hoje.\n\nPara lançar novos KPIs:\n• Remova os KPIs do cálculo atual, ou\n• Escolha uma data diferente no modal de lançamento');
        return;
      }
    }
    
    // For forklift operators, set the launch date to the WMS reference date
    if (isOperadorEmpilhadeira && wmsReferenceDate) {
      setDataLancamento(wmsReferenceDate);
    }
    
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
        setUploadedFile(null);
        setValidTasksCount(0);
        setValidTasksDetails([]);
      }
    }
    
    // Reset valid tasks count when operator name changes and fetch existing tasks
    if (field === 'nome_operador') {
      setValidTasksCount(0);
      setValidTasksDetails([]);
      setExistingValidTasks(0);
      
      // Buscar tarefas válidas existentes do operador selecionado
      if (value && typeof value === 'string') {
        // Se há uma data selecionada no WMS, usar ela; caso contrário, buscar todas
        const currentDate = new Date().toISOString().split('T')[0]; // Data atual como fallback
        fetchExistingValidTasks(value, currentDate);
      }
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

  const handleFileUpload = async (file: File) => {
    setUploadedFile(file);
    setValidTasksCount(0); // Reset count when new file is uploaded
  };

  const processTaskFile = async () => {
    if (!uploadedFile || !formData.nome_operador) return;
    
    setProcessingTasks(true);
    try {
      const text = await uploadedFile.text();
      console.log('=== PROCESSAMENTO ARQUIVO TAREFAS ===');
      console.log('Nome do arquivo:', uploadedFile.name);
      console.log('Tamanho do arquivo:', text.length, 'caracteres');
      console.log('Operador selecionado:', formData.nome_operador);
      console.log('Conteúdo do arquivo (primeiros 2000 caracteres):', text.substring(0, 2000));
      
      const tasks = parseCSV(text);
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
      
      const validTasksResult = calculateValidTasks(tasks, formData.nome_operador);
      console.log('Resultado das tarefas válidas:', validTasksResult);
      
      setValidTasksCount(validTasksResult.total);
      setValidTasksDetails(validTasksResult.detalhes);
      
      if (validTasksResult.total === 0) {
        const operatorsInFile = uniqueOperators.join(', ');
        alert(`Nenhuma tarefa válida encontrada para o operador "${formData.nome_operador}".\n\nOperadores encontrados no arquivo:\n${operatorsInFile}\n\nVerifique se o nome do operador está correto.`);
        return;
      }
      
      // Salvar tarefas processadas no banco de dados
      if (validTasksResult.total > 0) {
        try {
          // Preparar dados das tarefas para salvar
          const tarefasParaSalvar = tasks
            .filter(task => {
              // Usar a mesma função de comparação que calculateValidTasks
              return task.Usuário && isOperatorMatch(task.Usuário, formData.nome_operador);
            })
            .filter(task => task['Concluída Task'] === '1') // Apenas tarefas concluídas
            .map(task => {
              const dataAssociacao = task['Data Última Associação'];
              const dataAlteracao = task['Data de Alteração'];
              
              // Calcular tempo de execução
              let tempoExecucao = 0;
              if (dataAssociacao && dataAlteracao) {
                const dateAssoc = parseDateTime(dataAssociacao);
                const dateAlt = parseDateTime(dataAlteracao);
                if (dateAssoc && dateAlt) {
                  tempoExecucao = Math.abs(dateAlt.getTime() - dateAssoc.getTime()) / 1000;
                }
              }
              
              // Verificar se tarefa é válida: >10s = válida, ≤10s = inválida
               // E também deve estar dentro da meta específica do tipo de tarefa
               const meta = TASK_METAS.find(m => m.tipo === task.Tipo);
               const tarefaValida = meta ? (tempoExecucao > 10 && tempoExecucao <= meta.meta_segundos) : false;
              
              return {
                // Campos obrigatórios
                tarefa: task.Tipo || '', // Usar o tipo como identificador da tarefa
                tipo: task.Tipo || '',
                usuario: formData.nome_operador,
                tempo_execucao: tempoExecucao,
                // tarefa_valida é calculada automaticamente pelo banco
                concluida_task: task['Concluída Task'] === '1',
                
                // Campos de data/hora (apenas os disponíveis na interface TaskRow)
                data_ultima_associacao: dataAssociacao,
                data_alteracao: dataAlteracao,
                
                // Campos opcionais (definir como null já que não estão na interface TaskRow)
                data_criacao: null,
                data_liberacao: null,
                origem: null,
                destino: null,
                palete: null,
                armazem_mapa: null,
                placa_carreta: null,
                placa_cavalo: null,
                prioridade: null,
                status: null
              };
            });
          
          console.log('Dados que serão enviados para a API:');
          console.log('Nome operador:', formData.nome_operador);
          console.log('Quantidade de tarefas para salvar:', tarefasParaSalvar.length);
          console.log('Primeiras 3 tarefas:', tarefasParaSalvar.slice(0, 3));
          
          const response = await fetch('/api/wms-tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              nome_operador: formData.nome_operador,
              tarefas: tarefasParaSalvar
            })
          });
          
          const result = await response.json();
          if (result.success) {
            console.log('Tarefas salvas no banco:', result);
            
            // Atualizar contagem de tarefas válidas
            const mensagemSucesso = [
              `✅ Processamento concluído com sucesso!`,
              ``,
              `📊 Resumo:`,
              `• Tarefas processadas: ${result.tarefas_inseridas || tarefasParaSalvar.length}`,
              `• Tarefas válidas: ${result.tarefas_validas || validTasksResult.total}`,
              `• Operador: ${formData.nome_operador}`,
              ``,
              `${result.message}`
            ].join('\n');
            
            alert(mensagemSucesso);
            
            // Buscar contagem atualizada de tarefas válidas do operador
            try {
              const countResponse = await fetch(`/api/wms-tasks/${encodeURIComponent(formData.nome_operador)}`);
              if (countResponse.ok) {
                const countResult = await countResponse.json();
                if (countResult.success) {
                  setValidTasksCount(countResult.valid_tasks_count);
                  console.log('Contagem atualizada de tarefas válidas:', countResult.valid_tasks_count);
                }
              }
            } catch (countError) {
              console.warn('Erro ao buscar contagem atualizada:', countError);
            }
            
            // Buscar estatísticas detalhadas das tarefas
            await fetchTaskStats(formData.nome_operador);
            
          } else {
            console.warn('Erro ao salvar tarefas:', result);
            const mensagemErro = [
              `❌ Erro ao processar tarefas:`,
              ``,
              `${result.error}`,
              result.details ? `\nDetalhes: ${result.details}` : ''
            ].join('\n');
            alert(mensagemErro);
          }
        } catch (saveError) {
          console.error('Erro ao salvar tarefas no banco:', saveError);
          alert(`❌ Erro ao salvar tarefas no banco:\n\n${saveError instanceof Error ? saveError.message : 'Erro desconhecido'}`);
        }
      }
      
    } catch (error) {
      console.error('Erro ao processar arquivo:', error);
      alert('Erro ao processar arquivo: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
      setValidTasksCount(0);
      setValidTasksDetails([]);
    } finally {
      setProcessingTasks(false);
    }
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    setValidTasksCount(0);
    setValidTasksDetails([]);
  };

  const fetchAvailableKPIs = async (funcao: string, turno: string) => {
    if (!funcao || !turno) return;
    
    try {
      const response = await fetch(`/api/kpis/available?funcao=${encodeURIComponent(funcao)}&turno=${encodeURIComponent(turno)}`);
      if (!response.ok) throw new Error('Failed to fetch KPIs');
      const data = await response.json();
      setAvailableKPIs(data);
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

  // Buscar tarefas válidas existentes e estatísticas quando operador for selecionado
  useEffect(() => {
    if (isOperadorEmpilhadeira && formData.nome_operador) {
      // Usar data atual como padrão para buscar tarefas do dia
      const currentDate = new Date().toISOString().split('T')[0];
      fetchExistingValidTasks(formData.nome_operador, currentDate);
      fetchTaskStats(formData.nome_operador);
    } else {
      setExistingValidTasks(0);
      setTaskStats(null);
    }
  }, [isOperadorEmpilhadeira, formData.nome_operador]);

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
                          R$ {((result?.subtotal_atividades || 0) * 2).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700">Atividades (50%):</span>
                        <span className="font-semibold text-green-600">
                          R$ {(result?.subtotal_atividades || 0).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700">KPIs Atingidos:</span>
                        <span className="font-semibold text-blue-600">
                          {result?.kpis_atingidos?.length || 0}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700">Valor KPIs:</span>
                        <span className="font-semibold text-blue-600">
                          R$ {(result?.bonus_kpis || 0).toFixed(2)}
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
                            R$ {(result?.remuneracao_total || 0).toFixed(2)}
                          </span>
                        </div>
                      </div>
                      {result?.kpis_atingidos && result.kpis_atingidos.length > 0 && (
                        <div className="mt-4">
                          <p className="text-sm text-gray-600 mb-2">KPIs Atingidos:</p>
                          <div className="flex flex-wrap gap-2 mb-3">
                            {result?.kpis_atingidos?.map((kpi, index) => (
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
                        Selecione a data para lançar sua produtividade calculada de <strong>R$ {(result?.remuneracao_total || 0).toFixed(2)}</strong>
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
