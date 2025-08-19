"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthGuard = AuthGuard;
const react_1 = __importStar(require("react"));
const useAuth_1 = require("@/react-app/hooks/useAuth");
const Card_1 = require("@/react-app/components/Card");
const Button_1 = require("@/react-app/components/Button");
const Input_1 = require("@/react-app/components/Input");
const Alert_1 = require("@/react-app/components/Alert");
const lucide_react_1 = require("lucide-react");
const ResetButton_1 = __importDefault(require("@/react-app/components/ResetButton"));
function LoginForm() {
    const { login } = (0, useAuth_1.useAuth)();
    const [cpf, setCpf] = (0, react_1.useState)('');
    const [dataNascimento, setDataNascimento] = (0, react_1.useState)('');
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    const formatCPF = (value) => {
        const numbers = value.replace(/\D/g, '');
        if (numbers.length <= 11) {
            return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
        }
        return value;
    };
    const handleCPFChange = (e) => {
        const formatted = formatCPF(e.target.value);
        setCpf(formatted);
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        if (!cpf || !dataNascimento) {
            setError('CPF e data de nascimento são obrigatórios');
            return;
        }
        try {
            setLoading(true);
            await login(cpf, dataNascimento);
        }
        catch (error) {
            setError(error instanceof Error ? error.message : 'Erro no login');
        }
        finally {
            setLoading(false);
        }
    };
    return (<div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center p-4">
      <ResetButton_1.default />
      <Card_1.Card className="w-full max-w-md shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <Card_1.CardHeader className="text-center">
          <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center mx-auto mb-4">
            <lucide_react_1.Truck className="h-8 w-8 text-white"/>
          </div>
          <Card_1.CardTitle className="text-2xl bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
            RV Armazém CDD Maceió
          </Card_1.CardTitle>
          <p className="text-gray-600 mt-2">
            Sistema de Remuneração Variável
          </p>
        </Card_1.CardHeader>
        <Card_1.CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                CPF
              </label>
              <Input_1.Input value={cpf} onChange={handleCPFChange} placeholder="000.000.000-00" maxLength={14} required/>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Data de Nascimento
              </label>
              <Input_1.Input type="date" value={dataNascimento} onChange={(e) => setDataNascimento(e.target.value)} required/>
            </div>

            {error && (<Alert_1.Alert variant="destructive">
                <Alert_1.AlertDescription>{error}</Alert_1.AlertDescription>
              </Alert_1.Alert>)}

            <Button_1.Button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900">
              <lucide_react_1.LogIn className="h-4 w-4 mr-2"/>
              {loading ? 'Entrando...' : 'Entrar'}
            </Button_1.Button>
          </form>
        </Card_1.CardContent>
      </Card_1.Card>
    </div>);
}
function AuthGuard({ children, requireAdmin = false, fallback }) {
    const { user, loading, isAdmin } = (0, useAuth_1.useAuth)();
    if (loading) {
        return (<div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>);
    }
    if (!user) {
        if (fallback)
            return <>{fallback}</>;
        return <LoginForm />;
    }
    if (requireAdmin && !isAdmin) {
        if (fallback)
            return <>{fallback}</>;
        return (<div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center p-4">
        <Card_1.Card className="w-full max-w-md shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <Card_1.CardHeader className="text-center">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center mx-auto mb-4">
              <lucide_react_1.Shield className="h-6 w-6 text-white"/>
            </div>
            <Card_1.CardTitle className="text-xl">Acesso Restrito</Card_1.CardTitle>
          </Card_1.CardHeader>
          <Card_1.CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              Você não tem permissão para acessar esta área. 
              Entre em contato com um administrador.
            </p>
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
              <lucide_react_1.User className="h-4 w-4"/>
              <span>{user?.nome}</span>
            </div>
            <Button_1.Button onClick={() => window.location.href = '/'} variant="outline" className="w-full">
              Voltar ao Início
            </Button_1.Button>
          </Card_1.CardContent>
        </Card_1.Card>
      </div>);
    }
    return <>{children}</>;
}
exports.default = AuthGuard;
