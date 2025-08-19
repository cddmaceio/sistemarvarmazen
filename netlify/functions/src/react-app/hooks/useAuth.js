"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthProvider = AuthProvider;
exports.useAuth = useAuth;
const react_1 = require("react");
const AuthContext = (0, react_1.createContext)(null);
function AuthProvider({ children }) {
    const [user, setUser] = (0, react_1.useState)(null);
    const [loading, setLoading] = (0, react_1.useState)(true);
    (0, react_1.useEffect)(() => {
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
    const formatCPF = (cpf) => {
        // Remove all non-numeric characters
        const numbers = cpf.replace(/\D/g, '');
        // Add formatting
        return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    };
    const login = async (cpf, dataNascimento) => {
        try {
            setLoading(true);
            // Format CPF for consistency
            const formattedCPF = formatCPF(cpf);
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cpf: formattedCPF,
                    data_nascimento: dataNascimento
                })
            });
            if (response.ok) {
                const userData = await response.json();
                setUser(userData);
                localStorage.setItem('logibonus_user', JSON.stringify(userData));
            }
            else {
                const error = await response.json();
                throw new Error(error.message || 'Erro no login');
            }
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
            // 5. Call server logout endpoint
            fetch('/api/auth/logout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            }).catch(() => {
                // Ignore server errors during logout
            });
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
        if (!user)
            return;
        try {
            const response = await fetch(`/api/usuarios/${user.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (response.ok) {
                const updatedUser = await response.json();
                setUser(updatedUser);
                localStorage.setItem('logibonus_user', JSON.stringify(updatedUser));
            }
        }
        catch (error) {
            console.error('Failed to update user:', error);
            throw error;
        }
    };
    const isAdmin = user?.role === 'admin' && user?.is_active;
    const isCollaborator = user?.role === 'user' && user?.is_active;
    const userFunction = user?.funcao || 'Ajudante de Armazém';
    const authValue = {
        user,
        loading,
        isAdmin,
        isCollaborator,
        userFunction,
        login,
        logout,
        updateUser
    };
    return (<AuthContext.Provider value={authValue}>
      {children}
    </AuthContext.Provider>);
}
function useAuth() {
    const context = (0, react_1.useContext)(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
exports.default = AuthProvider;
