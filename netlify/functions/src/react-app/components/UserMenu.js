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
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserMenu = UserMenu;
const react_1 = __importStar(require("react"));
const lucide_react_1 = require("lucide-react");
const react_router_1 = require("react-router");
const Button_1 = require("@/react-app/components/Button");
const Dialog_1 = require("@/react-app/components/Dialog");
const Input_1 = require("@/react-app/components/Input");
const Alert_1 = require("@/react-app/components/Alert");
const useAuth_1 = require("@/react-app/hooks/useAuth");
function UserMenu() {
    const { user, isAdmin, isCollaborator, userFunction, logout, updateUser } = (0, useAuth_1.useAuth)();
    const [showMenu, setShowMenu] = (0, react_1.useState)(false);
    const [showProfile, setShowProfile] = (0, react_1.useState)(false);
    const [nome, setNome] = (0, react_1.useState)(user?.nome || '');
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setError(null);
        if (!nome.trim()) {
            setError('Nome é obrigatório');
            return;
        }
        try {
            setLoading(true);
            await updateUser({ nome: nome.trim() });
            setShowProfile(false);
            setShowMenu(false);
        }
        catch (error) {
            setError('Erro ao salvar perfil');
        }
        finally {
            setLoading(false);
        }
    };
    const handleLogout = () => {
        logout();
        setShowMenu(false);
    };
    if (!user)
        return null;
    return (<>
      <div className="relative">
        <Button_1.Button variant="outline" size="sm" onClick={() => setShowMenu(!showMenu)} className="flex items-center space-x-2">
          <div className="h-6 w-6 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
            <lucide_react_1.User className="h-3 w-3 text-white"/>
          </div>
          <span className="max-w-24 truncate">{user.nome}</span>
          <lucide_react_1.ChevronDown className="h-4 w-4"/>
        </Button_1.Button>

        {showMenu && (<div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
            <div className="px-4 py-2 border-b border-gray-100">
              <p className="text-sm font-medium text-gray-900">{user.nome}</p>
              <p className="text-xs text-gray-500">{user.cpf}</p>
              {isAdmin && (<div className="flex items-center space-x-1 mt-1">
                  <lucide_react_1.Shield className="h-3 w-3 text-purple-600"/>
                  <span className="text-xs text-purple-600 font-medium">Administrador</span>
                </div>)}
            </div>
            
            {/* Colaborator Menu Items */}
            {isCollaborator && (<>
                <react_router_1.Link to="/" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900" onClick={() => setShowMenu(false)}>
                  <lucide_react_1.Calendar className="mr-3 h-4 w-4"/>
                  Calculadora
                </react_router_1.Link>
                <react_router_1.Link to="/dashboard" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900" onClick={() => setShowMenu(false)}>
                  <lucide_react_1.TrendingUp className="mr-3 h-4 w-4"/>
                  Dashboard
                </react_router_1.Link>
              </>)}
            
            {/* Admin Menu Items */}
            {isAdmin && (<>
                <react_router_1.Link to="/admin/atividades" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900" onClick={() => setShowMenu(false)}>
                  <lucide_react_1.Activity className="mr-3 h-4 w-4"/>
                  Cadastro de Atividades
                </react_router_1.Link>
                <react_router_1.Link to="/admin/kpis" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900" onClick={() => setShowMenu(false)}>
                  <lucide_react_1.Target className="mr-3 h-4 w-4"/>
                  Cadastro de KPIs
                </react_router_1.Link>
                <react_router_1.Link to="/admin/cadastro-usuarios" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900" onClick={() => setShowMenu(false)}>
                  <lucide_react_1.UserPlus className="mr-3 h-4 w-4"/>
                  Cadastro de Usuários
                </react_router_1.Link>
                <react_router_1.Link to="/admin/validacao" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900" onClick={() => setShowMenu(false)}>
                  <lucide_react_1.CheckCircle className="mr-3 h-4 w-4"/>
                  Validação de Lançamentos
                </react_router_1.Link>
                <react_router_1.Link to="/admin/historico" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900" onClick={() => setShowMenu(false)}>
                  <lucide_react_1.History className="mr-3 h-4 w-4"/>
                  Histórico de Aprovações
                </react_router_1.Link>
                <react_router_1.Link to="/admin/exportacao" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900" onClick={() => setShowMenu(false)}>
                  <lucide_react_1.Download className="mr-3 h-4 w-4"/>
                  Exportação de Dados
                </react_router_1.Link>
              </>)}
            <button onClick={() => {
                setShowProfile(true);
                setShowMenu(false);
            }} className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2">
              <lucide_react_1.Settings className="h-4 w-4"/>
              <span>Meu Perfil</span>
            </button>
            
            <button onClick={handleLogout} className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2">
              <lucide_react_1.LogOut className="h-4 w-4"/>
              <span>Sair</span>
            </button>
          </div>)}
      </div>

      {/* Profile Dialog */}
      <Dialog_1.Dialog open={showProfile} onOpenChange={setShowProfile}>
        <Dialog_1.DialogContent>
          <Dialog_1.DialogHeader>
            <Dialog_1.DialogTitle>Meu Perfil</Dialog_1.DialogTitle>
          </Dialog_1.DialogHeader>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Nome</label>
              <Input_1.Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Digite seu nome"/>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">CPF</label>
              <Input_1.Input value={user.cpf} disabled className="bg-gray-50"/>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Data de Nascimento</label>
              <Input_1.Input value={user.data_nascimento} disabled className="bg-gray-50"/>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Nível de Acesso</label>
              <div className="flex items-center space-x-2">
                {isAdmin ? (<>
                    <lucide_react_1.Shield className="h-4 w-4 text-purple-600"/>
                    <span className="text-sm text-purple-600 font-medium">Administrador</span>
                  </>) : (<>
                    <lucide_react_1.User className="h-4 w-4 text-gray-600"/>
                    <span className="text-sm text-gray-600">Colaborador</span>
                  </>)}
              </div>
            </div>

            {isCollaborator && (<div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Função</label>
                <div className="flex items-center space-x-2">
                  <lucide_react_1.User className="h-4 w-4 text-blue-600"/>
                  <span className="text-sm text-blue-600 font-medium">{userFunction}</span>
                </div>
              </div>)}

            {error && (<Alert_1.Alert variant="destructive">
                <Alert_1.AlertDescription>{error}</Alert_1.AlertDescription>
              </Alert_1.Alert>)}

            <div className="flex justify-end space-x-2 pt-4">
              <Button_1.Button type="button" variant="outline" onClick={() => setShowProfile(false)}>
                Cancelar
              </Button_1.Button>
              <Button_1.Button type="submit" disabled={loading}>
                {loading ? 'Salvando...' : 'Salvar'}
              </Button_1.Button>
            </div>
          </form>
        </Dialog_1.DialogContent>
      </Dialog_1.Dialog>

      {/* Backdrop */}
      {showMenu && (<div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)}/>)}
    </>);
}
exports.default = UserMenu;
