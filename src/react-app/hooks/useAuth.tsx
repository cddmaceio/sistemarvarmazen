import { useState, useEffect, useContext, createContext, ReactNode } from 'react';
import { UserType } from '@/shared/types';
import { supabaseQueries } from '@/lib/supabase';
import { FUNCAO_DB_TO_UI } from '@/shared/utils/encoding';

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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for reset parameter to clear all data
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('reset') === 'true') {
      // Clear all authentication data
      localStorage.clear();
      sessionStorage.clear();
      // Clear cookies
      document.cookie.split(";").forEach(cookie => {
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
      });
      // Remove reset parameter from URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    // Check if user is already logged in (localStorage)
    const savedUser = localStorage.getItem('logibonus_user');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        // Verify user data integrity
        if (userData && userData.id && userData.cpf && userData.nome) {
          setUser(userData);
        } else {
          // Invalid user data, clear it
          localStorage.removeItem('logibonus_user');
        }
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('logibonus_user');
      }
    }
    setLoading(false);
  }, []);



  const login = async (cpf: string, dataNascimento: string) => {
    try {
      setLoading(true);
      
      const userData = await supabaseQueries.login(cpf, dataNascimento);
      setUser(userData);
      localStorage.setItem('logibonus_user', JSON.stringify(userData));
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    try {
      // 1. Clear user state
      setUser(null);
      
      // 2. Clear all localStorage
      localStorage.clear();
      
      // 3. Clear all sessionStorage
      sessionStorage.clear();
      
      // 4. Clear authentication cookies
      document.cookie.split(";").forEach(cookie => {
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.${window.location.hostname}`;
      });
      
      // 5. No need to call server logout with Supabase
      
      // 6. Force redirect to prevent back navigation
      window.location.replace('/');
      
    } catch (error) {
      console.error('Error during logout:', error);
      // Fallback: force redirect anyway
      window.location.href = '/';
    }
  };

  const updateUser = async (data: Partial<UserType>) => {
    if (!user || !user.id) return;

    try {
      const updatedUser = await supabaseQueries.updateUsuario(user.id, data);
      setUser(updatedUser);
      localStorage.setItem('logibonus_user', JSON.stringify(updatedUser));
    } catch (error) {
      console.error('Failed to update user:', error);
      throw error;
    }
  };

  const isAdmin = user?.tipo_usuario === 'administrador';
  const isCollaborator = user?.tipo_usuario === 'colaborador';
  // Convert user function from DB format to UI format
  const userFunction = user?.funcao ? (FUNCAO_DB_TO_UI[user.funcao] || user.funcao) : '';
  // Get user turno (NULL para administradores)
  const userTurno = user?.turno || null;

  const authValue = {
    user,
    loading,
    isAdmin,
    isCollaborator,
    userFunction,
    userTurno,
    login,
    logout,
    updateUser
  };

  return (
    <AuthContext.Provider value={authValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthProvider;
