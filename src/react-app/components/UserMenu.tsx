import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { User, Settings, LogOut, Shield, ChevronDown, TrendingUp, Calendar, CheckCircle, History, UserPlus, Activity, Download, Target } from 'lucide-react';
import { Link } from 'react-router';
import { Button } from '@/react-app/components/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/react-app/components/Dialog';
import { Input } from '@/react-app/components/Input';
import { Alert, AlertDescription } from '@/react-app/components/Alert';
import { useAuth } from '@/react-app/hooks/useAuth';

export function UserMenu() {
  const { user, isAdmin, isCollaborator, userFunction, logout, updateUser } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [nome, setNome] = useState(user?.nome || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);

  const calculateMenuPosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right
      });
    }
  };

  const toggleMenu = () => {
    if (!showMenu) {
      calculateMenuPosition();
    }
    setShowMenu(!showMenu);
  };

  // Close menu on window resize to prevent positioning issues
  useEffect(() => {
    const handleResize = () => {
      if (showMenu) {
        setShowMenu(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [showMenu]);

  const handleSaveProfile = async (e: React.FormEvent) => {
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
    } catch (error) {
      setError('Erro ao salvar perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    setShowMenu(false);
  };

  if (!user) return null;

  return (
    <>
      <div className="relative">
        <Button
          ref={buttonRef}
          variant="outline"
          size="sm"
          onClick={toggleMenu}
          className="flex items-center space-x-2"
        >
          <div className="h-6 w-6 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
            <User className="h-3 w-3 text-white" />
          </div>
          <span className="max-w-24 truncate">{user.nome}</span>
          <ChevronDown className="h-4 w-4" />
        </Button>

        {showMenu && createPortal(
          <>
            <div 
              className="fixed inset-0 z-[999998]"
              onClick={() => setShowMenu(false)}
            />
            <div 
              className="fixed w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-[999999]"
              style={{
                top: `${menuPosition.top}px`,
                right: `${menuPosition.right}px`
              }}
            >
              <div className="px-4 py-2 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-900">{user.nome}</p>
                <p className="text-xs text-gray-500">{user.cpf}</p>
                {isAdmin && (
                  <div className="flex items-center space-x-1 mt-1">
                    <Shield className="h-3 w-3 text-purple-600" />
                    <span className="text-xs text-purple-600 font-medium">Administrador</span>
                  </div>
                )}
              </div>
            
            {/* Colaborator Menu Items */}
            {isCollaborator && (
              <>
                <Link
                  to="/"
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  onClick={() => setShowMenu(false)}
                >
                  <Calendar className="mr-3 h-4 w-4" />
                  Calculadora
                </Link>
                <Link
                  to="/dashboard"
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  onClick={() => setShowMenu(false)}
                >
                  <TrendingUp className="mr-3 h-4 w-4" />
                  Dashboard
                </Link>
              </>
            )}
            
            {/* Admin Menu Items */}
            {isAdmin && (
              <>
                <Link
                  to="/admin/atividades"
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  onClick={() => setShowMenu(false)}
                >
                  <Activity className="mr-3 h-4 w-4" />
                  Cadastro de Atividades
                </Link>
                <Link
                  to="/admin/kpis"
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  onClick={() => setShowMenu(false)}
                >
                  <Target className="mr-3 h-4 w-4" />
                  Cadastro de KPIs
                </Link>
                <Link
                  to="/admin/cadastro-usuarios"
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  onClick={() => setShowMenu(false)}
                >
                  <UserPlus className="mr-3 h-4 w-4" />
                  Cadastro de Usuários
                </Link>
                <Link
                  to="/admin/validacao"
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  onClick={() => setShowMenu(false)}
                >
                  <CheckCircle className="mr-3 h-4 w-4" />
                  Validação de Lançamentos
                </Link>
                <Link
                  to="/admin/historico"
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  onClick={() => setShowMenu(false)}
                >
                  <History className="mr-3 h-4 w-4" />
                  Histórico de Aprovações
                </Link>
                <Link
                  to="/admin/exportacao"
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  onClick={() => setShowMenu(false)}
                >
                  <Download className="mr-3 h-4 w-4" />
                  Exportação de Dados
                </Link>
              </>
            )}
            <button
              onClick={() => {
                setShowProfile(true);
                setShowMenu(false);
              }}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
            >
              <Settings className="h-4 w-4" />
              <span>Meu Perfil</span>
            </button>
            
            <button
              onClick={handleLogout}
              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
            >
              <LogOut className="h-4 w-4" />
              <span>Sair</span>
            </button>
            </div>
          </>,
          document.body
        )}
      </div>

      {/* Profile Dialog */}
      <Dialog open={showProfile} onOpenChange={setShowProfile}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Meu Perfil</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Nome</label>
              <Input 
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Digite seu nome"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">CPF</label>
              <Input value={user.cpf} disabled className="bg-gray-50" />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Data de Nascimento</label>
              <Input value={user.data_nascimento} disabled className="bg-gray-50" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Nível de Acesso</label>
              <div className="flex items-center space-x-2">
                {isAdmin ? (
                  <>
                    <Shield className="h-4 w-4 text-purple-600" />
                    <span className="text-sm text-purple-600 font-medium">Administrador</span>
                  </>
                ) : (
                  <>
                    <User className="h-4 w-4 text-gray-600" />
                    <span className="text-sm text-gray-600">Colaborador</span>
                  </>
                )}
              </div>
            </div>

            {isCollaborator && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Função</label>
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-blue-600 font-medium">{userFunction}</span>
                </div>
              </div>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowProfile(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>


    </>
  );
}

export default UserMenu;
