"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ExportacaoDados;
const react_1 = require("react");
const lucide_react_1 = require("lucide-react");
const react_router_1 = require("react-router");
const Card_1 = require("@/react-app/components/Card");
const Button_1 = require("@/react-app/components/Button");
const Input_1 = require("@/react-app/components/Input");
const Select_1 = require("@/react-app/components/Select");
const Table_1 = require("@/react-app/components/Table");
const AuthGuard_1 = __importDefault(require("@/react-app/components/AuthGuard"));
const UserMenu_1 = __importDefault(require("@/react-app/components/UserMenu"));
const useAuth_1 = require("@/react-app/hooks/useAuth");
function ExportacaoDados() {
    const { user } = (0, useAuth_1.useAuth)();
    const [filtros, setFiltros] = (0, react_1.useState)({
        periodo_inicio: '',
        periodo_fim: '',
        funcao: '',
        colaborador_id: undefined,
        status: 'aprovado',
    });
    const [formato, setFormato] = (0, react_1.useState)('csv');
    const [preview, setPreview] = (0, react_1.useState)(null);
    const [showPreview, setShowPreview] = (0, react_1.useState)(false);
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [exporting, setExporting] = (0, react_1.useState)(false);
    // Data for filters
    const [colaboradores, setColaboradores] = (0, react_1.useState)([]);
    const [funcoes, setFuncoes] = (0, react_1.useState)([]);
    const [logs, setLogs] = (0, react_1.useState)([]);
    (0, react_1.useEffect)(() => {
        loadFilterData();
        loadExportLogs();
    }, []);
    const loadFilterData = async () => {
        try {
            // Load colaboradores
            const colabResponse = await fetch('/api/usuarios');
            if (colabResponse.ok) {
                const colabData = await colabResponse.json();
                setColaboradores(colabData.filter((u) => u.role === 'user' && u.is_active));
            }
            // Load funcoes
            const funcResponse = await fetch('/api/functions');
            if (funcResponse.ok) {
                const funcData = await funcResponse.json();
                setFuncoes(funcData.map((f) => f.funcao));
            }
        }
        catch (error) {
            console.error('Erro ao carregar dados dos filtros:', error);
        }
    };
    const loadExportLogs = async () => {
        try {
            const response = await fetch('/api/export-logs');
            if (response.ok) {
                const data = await response.json();
                setLogs(data);
            }
        }
        catch (error) {
            console.error('Erro ao carregar logs de exportação:', error);
        }
    };
    const handleFilterChange = (field, value) => {
        setFiltros(prev => ({
            ...prev,
            [field]: value
        }));
        setShowPreview(false); // Hide preview when filters change
    };
    const gerarPreview = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/export-preview', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(filtros)
            });
            if (!response.ok)
                throw new Error('Erro ao gerar preview');
            const data = await response.json();
            setPreview(data);
            setShowPreview(true);
        }
        catch (error) {
            console.error('Erro no preview:', error);
            alert('Erro ao gerar preview dos dados');
        }
        finally {
            setLoading(false);
        }
    };
    const exportarDados = async () => {
        if (!preview || preview.dados.length === 0) {
            alert('Nenhum dado para exportar. Gere um preview primeiro.');
            return;
        }
        setExporting(true);
        try {
            const response = await fetch('/api/export-data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    filtros,
                    formato,
                    admin_id: user?.id,
                    admin_nome: user?.nome
                })
            });
            if (!response.ok)
                throw new Error('Erro na exportação');
            // Handle file download based on format
            if (formato === 'csv') {
                const text = await response.text();
                downloadCSV(text);
            }
            else if (formato === 'xlsx') {
                const blob = await response.blob();
                downloadFile(blob, 'xlsx');
            }
            else if (formato === 'pdf') {
                const blob = await response.blob();
                downloadFile(blob, 'pdf');
            }
            // Reload logs after export
            loadExportLogs();
            alert('Dados exportados com sucesso!');
        }
        catch (error) {
            console.error('Erro na exportação:', error);
            alert('Erro ao exportar dados');
        }
        finally {
            setExporting(false);
        }
    };
    const downloadCSV = (content) => {
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        const filename = `produtividade_${getDateString()}.csv`;
        downloadBlob(blob, filename);
    };
    const downloadFile = (blob, extension) => {
        const filename = `produtividade_${getDateString()}.${extension}`;
        downloadBlob(blob, filename);
    };
    const downloadBlob = (blob, filename) => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    };
    const getDateString = () => {
        return new Date().toISOString().slice(0, 19).replace(/[:-]/g, '').replace('T', '_');
    };
    const limparFiltros = () => {
        setFiltros({
            periodo_inicio: '',
            periodo_fim: '',
            funcao: '',
            colaborador_id: undefined,
            status: 'aprovado',
        });
        setShowPreview(false);
        setPreview(null);
    };
    const maskCPF = (cpf) => {
        if (!cpf || cpf.length < 11)
            return cpf;
        return `***.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-**`;
    };
    return (<AuthGuard_1.default requireAdmin>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
        {/* Header */}
        <header className="border-b bg-white/70 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <react_router_1.Link to="/admin">
                  <Button_1.Button variant="outline" size="sm">
                    <lucide_react_1.ArrowLeft className="h-4 w-4 mr-2"/>
                    Voltar
                  </Button_1.Button>
                </react_router_1.Link>
                <div className="flex items-center space-x-2">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-green-600 to-blue-600 flex items-center justify-center">
                    <lucide_react_1.Download className="h-5 w-5 text-white"/>
                  </div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                    Exportação de Dados
                  </h1>
                </div>
              </div>
              <UserMenu_1.default />
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <div className="space-y-8">
            {/* Filtros */}
            <Card_1.Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <Card_1.CardHeader>
                <Card_1.CardTitle className="flex items-center space-x-2">
                  <lucide_react_1.Filter className="h-5 w-5 text-green-600"/>
                  <span>Filtros de Exportação</span>
                </Card_1.CardTitle>
                <Card_1.CardDescription>
                  Configure os filtros para selecionar os dados que deseja exportar
                </Card_1.CardDescription>
              </Card_1.CardHeader>
              <Card_1.CardContent className="space-y-6">
                {/* Período */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center">
                      <lucide_react_1.Calendar className="h-4 w-4 mr-1"/>
                      Data Início
                    </label>
                    <Input_1.Input type="date" value={filtros.periodo_inicio} onChange={(e) => handleFilterChange('periodo_inicio', e.target.value)}/>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center">
                      <lucide_react_1.Calendar className="h-4 w-4 mr-1"/>
                      Data Fim
                    </label>
                    <Input_1.Input type="date" value={filtros.periodo_fim} onChange={(e) => handleFilterChange('periodo_fim', e.target.value)}/>
                  </div>
                </div>

                {/* Função e Colaborador */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Função</label>
                    <Select_1.Select value={filtros.funcao || ''} onChange={(e) => handleFilterChange('funcao', e.target.value || undefined)}>
                      <option value="">Todas as Funções</option>
                      {funcoes.map((funcao) => (<option key={funcao} value={funcao}>
                          {funcao}
                        </option>))}
                    </Select_1.Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Colaborador</label>
                    <Select_1.Select value={filtros.colaborador_id || ''} onChange={(e) => handleFilterChange('colaborador_id', e.target.value ? parseInt(e.target.value) : undefined)}>
                      <option value="">Todos os Colaboradores</option>
                      {colaboradores.map((colab) => (<option key={colab.id} value={colab.id}>
                          {colab.nome} ({colab.funcao})
                        </option>))}
                    </Select_1.Select>
                  </div>
                </div>

                {/* Status */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Status dos Lançamentos</label>
                  <Select_1.Select value={filtros.status} onChange={(e) => handleFilterChange('status', e.target.value)}>
                    <option value="aprovado">Aprovados</option>
                    <option value="pendente">Pendentes</option>
                    <option value="reprovado">Reprovados</option>
                    <option value="todos">Todos</option>
                  </Select_1.Select>
                </div>

                {/* Formato de Exportação */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700">Formato de Exportação</label>
                  <div className="flex space-x-4">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input type="radio" name="formato" value="csv" checked={formato === 'csv'} onChange={(e) => setFormato(e.target.value)} className="text-green-600"/>
                      <lucide_react_1.FileText className="h-4 w-4 text-gray-600"/>
                      <span className="text-sm">CSV (.csv)</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input type="radio" name="formato" value="xlsx" checked={formato === 'xlsx'} onChange={(e) => setFormato(e.target.value)} className="text-green-600"/>
                      <lucide_react_1.FileSpreadsheet className="h-4 w-4 text-gray-600"/>
                      <span className="text-sm">Excel (.xlsx)</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input type="radio" name="formato" value="pdf" checked={formato === 'pdf'} onChange={(e) => setFormato(e.target.value)} className="text-green-600"/>
                      <lucide_react_1.FileText className="h-4 w-4 text-gray-600"/>
                      <span className="text-sm">PDF (Relatório)</span>
                    </label>
                  </div>
                </div>

                {/* Botões de Ação */}
                <div className="flex flex-wrap gap-3 pt-4 border-t">
                  <Button_1.Button onClick={gerarPreview} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
                    <lucide_react_1.Eye className="h-4 w-4 mr-2"/>
                    {loading ? 'Carregando...' : 'Visualizar Preview'}
                  </Button_1.Button>
                  
                  {showPreview && preview && (<Button_1.Button onClick={exportarDados} disabled={exporting || !preview.dados.length} className="bg-green-600 hover:bg-green-700 text-white">
                      <lucide_react_1.Download className="h-4 w-4 mr-2"/>
                      {exporting ? 'Exportando...' : 'Exportar Dados'}
                    </Button_1.Button>)}
                  
                  <Button_1.Button onClick={limparFiltros} variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50">
                    <lucide_react_1.Trash2 className="h-4 w-4 mr-2"/>
                    Limpar Filtros
                  </Button_1.Button>
                </div>
              </Card_1.CardContent>
            </Card_1.Card>

            {/* Preview dos Dados */}
            {showPreview && preview && (<Card_1.Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                <Card_1.CardHeader>
                  <Card_1.CardTitle className="flex items-center space-x-2">
                    <lucide_react_1.Eye className="h-5 w-5 text-blue-600"/>
                    <span>Preview dos Dados</span>
                  </Card_1.CardTitle>
                  <Card_1.CardDescription>
                    {preview.total_registros} registros encontrados | 
                    Valor Total: R$ {preview.valor_total.toFixed(2)} | 
                    Valor Médio: R$ {preview.valor_medio.toFixed(2)}
                  </Card_1.CardDescription>
                </Card_1.CardHeader>
                <Card_1.CardContent>
                  {preview.dados.length === 0 ? (<div className="text-center py-8 text-gray-500">
                      Nenhum dado encontrado com os filtros aplicados
                    </div>) : (<>
                      <Table_1.Table>
                        <Table_1.TableHeader>
                          <Table_1.TableRow>
                            <Table_1.TableHead>Período</Table_1.TableHead>
                            <Table_1.TableHead>CPF</Table_1.TableHead>
                            <Table_1.TableHead>Nome</Table_1.TableHead>
                            <Table_1.TableHead>Função</Table_1.TableHead>
                            <Table_1.TableHead className="text-right">Valor RV</Table_1.TableHead>
                            <Table_1.TableHead className="text-right">Lançamentos</Table_1.TableHead>
                          </Table_1.TableRow>
                        </Table_1.TableHeader>
                        <Table_1.TableBody>
                          {preview.dados.slice(0, 10).map((item, index) => (<Table_1.TableRow key={index}>
                              <Table_1.TableCell>{item.mes}</Table_1.TableCell>
                              <Table_1.TableCell className="font-mono text-sm">{maskCPF(item.cpf)}</Table_1.TableCell>
                              <Table_1.TableCell className="font-medium">{item.nome}</Table_1.TableCell>
                              <Table_1.TableCell>{item.funcao}</Table_1.TableCell>
                              <Table_1.TableCell className="text-right font-semibold text-green-600">
                                R$ {item.valor_rv.toFixed(2)}
                              </Table_1.TableCell>
                              <Table_1.TableCell className="text-right text-gray-600">
                                {item.total_lancamentos}
                              </Table_1.TableCell>
                            </Table_1.TableRow>))}
                        </Table_1.TableBody>
                      </Table_1.Table>
                      
                      {preview.dados.length > 10 && (<div className="text-center mt-4 text-sm text-gray-500">
                          ... e mais {preview.dados.length - 10} registros
                        </div>)}
                      
                      <div className="mt-4 pt-4 border-t bg-gray-50 rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                          <div>
                            <p className="text-2xl font-bold text-blue-600">{preview.total_registros}</p>
                            <p className="text-sm text-gray-600">Total de Registros</p>
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-green-600">R$ {preview.valor_total.toFixed(2)}</p>
                            <p className="text-sm text-gray-600">Valor Total</p>
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-purple-600">R$ {preview.valor_medio.toFixed(2)}</p>
                            <p className="text-sm text-gray-600">Valor Médio</p>
                          </div>
                        </div>
                      </div>
                    </>)}
                </Card_1.CardContent>
              </Card_1.Card>)}

            {/* Histórico de Exportações */}
            <Card_1.Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <Card_1.CardHeader>
                <Card_1.CardTitle className="flex items-center space-x-2">
                  <lucide_react_1.FileText className="h-5 w-5 text-purple-600"/>
                  <span>Histórico de Exportações</span>
                </Card_1.CardTitle>
                <Card_1.CardDescription>
                  Últimas exportações realizadas pelos administradores
                </Card_1.CardDescription>
              </Card_1.CardHeader>
              <Card_1.CardContent>
                {logs.length === 0 ? (<div className="text-center py-8 text-gray-500">
                    Nenhuma exportação realizada ainda
                  </div>) : (<Table_1.Table>
                    <Table_1.TableHeader>
                      <Table_1.TableRow>
                        <Table_1.TableHead>Data/Hora</Table_1.TableHead>
                        <Table_1.TableHead>Administrador</Table_1.TableHead>
                        <Table_1.TableHead>Formato</Table_1.TableHead>
                        <Table_1.TableHead className="text-right">Registros</Table_1.TableHead>
                        <Table_1.TableHead>Arquivo</Table_1.TableHead>
                      </Table_1.TableRow>
                    </Table_1.TableHeader>
                    <Table_1.TableBody>
                      {logs.slice(0, 10).map((log) => (<Table_1.TableRow key={log.id}>
                          <Table_1.TableCell className="font-mono text-sm">
                            {new Date(log.data_exportacao || '').toLocaleString('pt-BR')}
                          </Table_1.TableCell>
                          <Table_1.TableCell className="font-medium">{log.admin_nome}</Table_1.TableCell>
                          <Table_1.TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${log.formato_exportacao === 'csv' ? 'bg-blue-100 text-blue-800' :
                    log.formato_exportacao === 'xlsx' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'}`}>
                              {log.formato_exportacao.toUpperCase()}
                            </span>
                          </Table_1.TableCell>
                          <Table_1.TableCell className="text-right">{log.total_registros}</Table_1.TableCell>
                          <Table_1.TableCell className="font-mono text-sm text-gray-600">
                            {log.nome_arquivo || '-'}
                          </Table_1.TableCell>
                        </Table_1.TableRow>))}
                    </Table_1.TableBody>
                  </Table_1.Table>)}
              </Card_1.CardContent>
            </Card_1.Card>
          </div>
        </main>
      </div>
    </AuthGuard_1.default>);
}
