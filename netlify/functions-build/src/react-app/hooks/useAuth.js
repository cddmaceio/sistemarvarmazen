import { useState, useEffect, useContext, createContext } from 'react';
import { FUNCAO_DB_TO_UI } from '@/shared/utils/encoding';
const API_BASE = '/api';
const AuthContext = createContext(null);
export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
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
                }
                else {
                    // Invalid user data, clear it
                    localStorage.removeItem('logibonus_user');
                }
            }
            catch (error) {
                console.error('Error parsing saved user:', error);
                localStorage.removeItem('logibonus_user');
            }
        }
        setLoading(false);
    }, []);
    const login = async (cpf, dataNascimento) => {
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
                throw new Error(errorData.error || 'Login failed');
            }
            const user = await response.json();
            setUser(user);
            localStorage.setItem('logibonus_user', JSON.stringify(user));
        }
        catch (error) {
            console.error('Login failed:', error);
            throw error;
        }
        finally {
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
        }
        catch (error) {
            console.error('Error during logout:', error);
            // Fallback: force redirect anyway
            window.location.href = '/';
        }
    };
    const updateUser = async (data) => {
        if (!user || !user.id)
            return;
        try {
            const response = await fetch(`${API_BASE}/usuarios/${user.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update user');
            }
            const updatedUser = await response.json();
            setUser(updatedUser);
            localStorage.setItem('logibonus_user', JSON.stringify(updatedUser));
        }
        catch (error) {
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
    return (<AuthContext.Provider value={authValue}>
      {children}
    </AuthContext.Provider>);
}
export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
export default AuthProvider;
