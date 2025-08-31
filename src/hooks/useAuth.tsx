import { useState, useEffect, useContext, createContext } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { UserType } from '@/shared/types';
import { FUNCAO_DB_TO_UI } from '@/shared/utils/encoding';

const API_BASE = '/api';

interface AuthContextType {
  user: UserType | null;
  loading: boolean;
  isAdmin: boolean;
  isCollaborator: boolean;
  userFunction: string;
  userTurno: string | null;
  login: (cpf: string, dataNascimento: string) => Promise<void>;
  logout: () => void;
  updateUser: (data: Partial<UserType>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const isAdmin = user?.tipo_usuario?.toLowerCase() === 'administrador';
  const isCollaborator = user?.tipo_usuario?.toLowerCase() === 'colaborador';
  const userFunction = user?.funcao ? FUNCAO_DB_TO_UI[user.funcao] || user.funcao : '';
  const userTurno = user?.turno || null;

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('reset') === 'true') {
      localStorage.removeItem('user');
      setUser(null);
      setLoading(false);
      return;
    }

    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error('Erro ao carregar usuário do localStorage:', error);
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (cpf: string, dataNascimento: string) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cpf, data_nascimento: dataNascimento }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro no login');
      }

      const userData = await response.json();
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));

      // Redirecionar administradores para a página de validação após um pequeno delay
      if (userData.tipo_usuario?.toLowerCase() === 'administrador') {
        setTimeout(() => {
          navigate('/admin/validacao');
        }, 100);
      }
    } catch (error) {
      console.error('Erro no login:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const updateUser = async (data: Partial<UserType>) => {
    if (!user) return;

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/usuarios/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to update user');
      }

      const updatedUser = await response.json();
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    isAdmin,
    isCollaborator,
    userFunction,
    userTurno,
    login,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}

export { AuthContext };
