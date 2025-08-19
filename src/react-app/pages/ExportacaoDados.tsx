import { useState, useEffect } from 'react';
import { Download, FileText, FileSpreadsheet, Calendar, Filter, Eye, Trash2, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/react-app/components/Card';
import { Button } from '@/react-app/components/Button';
import { Input } from '@/react-app/components/Input';
import { Select } from '@/react-app/components/Select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/react-app/components/Table';
import AuthGuard from '@/react-app/components/AuthGuard';
import UserMenu from '@/react-app/components/UserMenu';
import { useAuth } from '@/react-app/hooks/useAuth';
import { ExportFilterType, ExportLogType } from '@/shared/types';

interface ExportData {
  mes: string;
  cpf: string;
  nome: string;
  funcao: string;
  valor_rv: number;
  total_lancamentos: number;
}

interface ExportPreview {
  dados: ExportData[];
  total_registros: number;
  valor_total: number;
  valor_medio: number;
}

export default function ExportacaoDados() {
  const { user } = useAuth();
  const [filtros, setFiltros] = useState<ExportFilterType>({
    periodo_inicio: '',
    periodo_fim: '',
    funcao: '',
    colaborador_id: undefined,
    status: 'aprovado',
  });

  const [formato, setFormato] = useState<'csv' | 'xlsx' | 'pdf'>('csv');
  const [preview, setPreview] = useState<ExportPreview | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  
  // Data for filters
  const [colaboradores, setColaboradores] = useState<{ id: number; nome: string; funcao: string }[]>([]);
  const [funcoes, setFuncoes] = useState<string[]>([]);
  const [logs, setLogs] = useState<ExportLogType[]>([]);

  useEffect(() => {
    loadFilterData();
    loadExportLogs();
  }, []);

  const loadFilterData = async () => {
    try {
      // Load colaboradores
      const colabResponse = await fetch('/api/usuarios');
      if (colabResponse.ok) {
        const colabData = await colabResponse.json();
        setColaboradores(colabData.filter((u: any) => u.role === 'user' && u.is_active));
      }

      // Load funcoes
      const funcResponse = await fetch('/api/functions');
      if (funcResponse.ok) {
        const funcData = await funcResponse.json();
        setFuncoes(funcData.map((f: any) => f.funcao));
      }
    } catch (error) {
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
    } catch (error) {
      console.error('Erro ao carregar logs de exportação:', error);
    }
  };

  const handleFilterChange = (field: keyof ExportFilterType, value: any) => {
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

      if (!response.ok) throw new Error('Erro ao gerar preview');

      const data = await response.json();
      setPreview(data);
      setShowPreview(true);
    } catch (error) {
      console.error('Erro no preview:', error);
      alert('Erro ao gerar preview dos dados');
    } finally {
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

      if (!response.ok) throw new Error('Erro na exportação');

      // Handle file download based on format
      if (formato === 'csv') {
        const text = await response.text();
        downloadCSV(text);
      } else if (formato === 'xlsx') {
        const blob = await response.blob();
        downloadFile(blob, 'xlsx');
      } else if (formato === 'pdf') {
        const blob = await response.blob();
        downloadFile(blob, 'pdf');
      }

      // Reload logs after export
      loadExportLogs();
      alert('Dados exportados com sucesso!');
    } catch (error) {
      console.error('Erro na exportação:', error);
      alert('Erro ao exportar dados');
    } finally {
      setExporting(false);
    }
  };

  const downloadCSV = (content: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const filename = `produtividade_${getDateString()}.csv`;
    downloadBlob(blob, filename);
  };

  const downloadFile = (blob: Blob, extension: string) => {
    const filename = `produtividade_${getDateString()}.${extension}`;
    downloadBlob(blob, filename);
  };

  const downloadBlob = (blob: Blob, filename: string) => {
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

  const maskCPF = (cpf: string) => {
    if (!cpf || cpf.length < 11) return cpf;
    return `***.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-**`;
  };

  return (
    <AuthGuard requireAdmin>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
        {/* Header */}
        <header className="border-b bg-white/70 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Link to="/admin">
                  <Button variant="outline" size="sm">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Voltar
                  </Button>
                </Link>
                <div className="flex items-center space-x-2">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-green-600 to-blue-600 flex items-center justify-center">
                    <Download className="h-5 w-5 text-white" />
                  </div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                    Exportação de Dados
                  </h1>
                </div>
              </div>
              <UserMenu />
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <div className="space-y-8">
            {/* Filtros */}
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Filter className="h-5 w-5 text-green-600" />
                  <span>Filtros de Exportação</span>
                </CardTitle>
                <CardDescription>
                  Configure os filtros para selecionar os dados que deseja exportar
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Período */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      Data Início
                    </label>
                    <Input
                      type="date"
                      value={filtros.periodo_inicio}
                      onChange={(e) => handleFilterChange('periodo_inicio', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      Data Fim
                    </label>
                    <Input
                      type="date"
                      value={filtros.periodo_fim}
                      onChange={(e) => handleFilterChange('periodo_fim', e.target.value)}
                    />
                  </div>
                </div>

                {/* Função e Colaborador */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Função</label>
                    <Select
                      value={filtros.funcao || ''}
                      onChange={(e) => handleFilterChange('funcao', e.target.value || undefined)}
                    >
                      <option value="">Todas as Funções</option>
                      {funcoes.map((funcao) => (
                        <option key={funcao} value={funcao}>
                          {funcao}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Colaborador</label>
                    <Select
                      value={filtros.colaborador_id || ''}
                      onChange={(e) => handleFilterChange('colaborador_id', e.target.value ? parseInt(e.target.value) : undefined)}
                    >
                      <option value="">Todos os Colaboradores</option>
                      {colaboradores.map((colab) => (
                        <option key={colab.id} value={colab.id}>
                          {colab.nome} ({colab.funcao})
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>

                {/* Status */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Status dos Lançamentos</label>
                  <Select
                    value={filtros.status}
                    onChange={(e) => handleFilterChange('status', e.target.value as any)}
                  >
                    <option value="aprovado">Aprovados</option>
                    <option value="pendente">Pendentes</option>
                    <option value="reprovado">Reprovados</option>
                    <option value="todos">Todos</option>
                  </Select>
                </div>

                {/* Formato de Exportação */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700">Formato de Exportação</label>
                  <div className="flex space-x-4">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="formato"
                        value="csv"
                        checked={formato === 'csv'}
                        onChange={(e) => setFormato(e.target.value as any)}
                        className="text-green-600"
                      />
                      <FileText className="h-4 w-4 text-gray-600" />
                      <span className="text-sm">CSV (.csv)</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="formato"
                        value="xlsx"
                        checked={formato === 'xlsx'}
                        onChange={(e) => setFormato(e.target.value as any)}
                        className="text-green-600"
                      />
                      <FileSpreadsheet className="h-4 w-4 text-gray-600" />
                      <span className="text-sm">Excel (.xlsx)</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="formato"
                        value="pdf"
                        checked={formato === 'pdf'}
                        onChange={(e) => setFormato(e.target.value as any)}
                        className="text-green-600"
                      />
                      <FileText className="h-4 w-4 text-gray-600" />
                      <span className="text-sm">PDF (Relatório)</span>
                    </label>
                  </div>
                </div>

                {/* Botões de Ação */}
                <div className="flex flex-wrap gap-3 pt-4 border-t">
                  <Button
                    onClick={gerarPreview}
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    {loading ? 'Carregando...' : 'Visualizar Preview'}
                  </Button>
                  
                  {showPreview && preview && (
                    <Button
                      onClick={exportarDados}
                      disabled={exporting || !preview.dados.length}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      {exporting ? 'Exportando...' : 'Exportar Dados'}
                    </Button>
                  )}
                  
                  <Button
                    onClick={limparFiltros}
                    variant="outline"
                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Limpar Filtros
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Preview dos Dados */}
            {showPreview && preview && (
              <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Eye className="h-5 w-5 text-blue-600" />
                    <span>Preview dos Dados</span>
                  </CardTitle>
                  <CardDescription>
                    {preview.total_registros} registros encontrados | 
                    Valor Total: R$ {preview.valor_total.toFixed(2)} | 
                    Valor Médio: R$ {preview.valor_medio.toFixed(2)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {preview.dados.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      Nenhum dado encontrado com os filtros aplicados
                    </div>
                  ) : (
                    <>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Período</TableHead>
                            <TableHead>CPF</TableHead>
                            <TableHead>Nome</TableHead>
                            <TableHead>Função</TableHead>
                            <TableHead className="text-right">Valor RV</TableHead>
                            <TableHead className="text-right">Lançamentos</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {preview.dados.slice(0, 10).map((item, index) => (
                            <TableRow key={index}>
                              <TableCell>{item.mes}</TableCell>
                              <TableCell className="font-mono text-sm">{maskCPF(item.cpf)}</TableCell>
                              <TableCell className="font-medium">{item.nome}</TableCell>
                              <TableCell>{item.funcao}</TableCell>
                              <TableCell className="text-right font-semibold text-green-600">
                                R$ {item.valor_rv.toFixed(2)}
                              </TableCell>
                              <TableCell className="text-right text-gray-600">
                                {item.total_lancamentos}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      
                      {preview.dados.length > 10 && (
                        <div className="text-center mt-4 text-sm text-gray-500">
                          ... e mais {preview.dados.length - 10} registros
                        </div>
                      )}
                      
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
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Histórico de Exportações */}
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-purple-600" />
                  <span>Histórico de Exportações</span>
                </CardTitle>
                <CardDescription>
                  Últimas exportações realizadas pelos administradores
                </CardDescription>
              </CardHeader>
              <CardContent>
                {logs.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Nenhuma exportação realizada ainda
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data/Hora</TableHead>
                        <TableHead>Administrador</TableHead>
                        <TableHead>Formato</TableHead>
                        <TableHead className="text-right">Registros</TableHead>
                        <TableHead>Arquivo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logs.slice(0, 10).map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="font-mono text-sm">
                            {new Date(log.data_exportacao || '').toLocaleString('pt-BR')}
                          </TableCell>
                          <TableCell className="font-medium">{log.admin_nome}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              log.formato_exportacao === 'csv' ? 'bg-blue-100 text-blue-800' :
                              log.formato_exportacao === 'xlsx' ? 'bg-green-100 text-green-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {log.formato_exportacao.toUpperCase()}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">{log.total_registros}</TableCell>
                          <TableCell className="font-mono text-sm text-gray-600">
                            {log.nome_arquivo || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
