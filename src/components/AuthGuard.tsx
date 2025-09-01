import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Alert, AlertDescription } from '@/components/Alert';
import { LogIn, Shield, User, Truck } from 'lucide-react';
import ResetButton from '@/components/ResetButton';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  fallback?: React.ReactNode;
}

function LoginForm() {
  const { login } = useAuth();
  const [cpf, setCpf] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    return value;
  };

  const formatDate = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 8) {
      return numbers.replace(/(\d{2})(\d{2})(\d{4})/, '$1/$2/$3');
    }
    return value;
  };

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCPF(e.target.value);
    setCpf(formatted);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatDate(e.target.value);
    setDataNascimento(formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!cpf || !dataNascimento) {
      setError('CPF e data de nascimento são obrigatórios');
      return;
    }

    try {
      setLoading(true);
      await login(cpf, dataNascimento);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erro no login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center p-4">
      <ResetButton />
      <Card className="w-full max-w-md shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center mx-auto mb-4">
            <Truck className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
            RV Armazém CDD Maceió
          </CardTitle>
          <p className="text-gray-600 mt-2">
            Sistema de Remuneração Variável
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                CPF
              </label>
              <Input
                value={cpf}
                onChange={handleCPFChange}
                placeholder="000.000.000-00"
                maxLength={14}
                required
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Data de Nascimento
              </label>
              <Input
                type="text"
                value={dataNascimento}
                onChange={handleDateChange}
                placeholder="dd/mm/aaaa"
                maxLength={10}
                required
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900"
            >
              <LogIn className="h-4 w-4 mr-2" />
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export function AuthGuard({ children, requireAdmin = false, fallback }: AuthGuardProps) {
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    if (fallback) return <>{fallback}</>;
    return <LoginForm />;
  }

  if (requireAdmin && !isAdmin) {
    if (fallback) return <>{fallback}</>;
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center mx-auto mb-4">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <CardTitle className="text-xl">Acesso Restrito</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              Você não tem permissão para acessar esta área. 
              Entre em contato com um administrador.
            </p>
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
              <User className="h-4 w-4" />
              <span>{user?.nome}</span>
            </div>
            <Button 
              onClick={() => window.location.href = '/'}
              variant="outline"
              className="w-full"
            >
              Voltar ao Início
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}

export default AuthGuard;
