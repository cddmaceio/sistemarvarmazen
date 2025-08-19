"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = UserManagementStandalone;
const react_1 = require("react");
const lucide_react_1 = require("lucide-react");
const react_router_1 = require("react-router");
const Button_1 = require("@/react-app/components/Button");
const AuthGuard_1 = __importDefault(require("@/react-app/components/AuthGuard"));
const UserMenu_1 = __importDefault(require("@/react-app/components/UserMenu"));
const UserManagement_1 = __importDefault(require("@/react-app/pages/UserManagement"));
function UserManagementStandalone() {
    const [users, setUsers] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    (0, react_1.useEffect)(() => {
        loadUsers();
    }, []);
    const loadUsers = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/usuarios');
            if (response.ok) {
                const data = await response.json();
                setUsers(data);
            }
        }
        catch (error) {
            console.error('Error loading users:', error);
        }
        finally {
            setLoading(false);
        }
    };
    const createUser = async (userData) => {
        const response = await fetch('/api/usuarios', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
        if (response.ok) {
            const newUser = await response.json();
            setUsers(prev => [newUser, ...prev]);
        }
        else {
            throw new Error('Failed to create user');
        }
    };
    const updateUser = async (id, userData) => {
        const response = await fetch(`/api/usuarios/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
        if (response.ok) {
            const updatedUser = await response.json();
            setUsers(prev => prev.map(user => user.id === id ? updatedUser : user));
        }
        else {
            throw new Error('Failed to update user');
        }
    };
    const deleteUser = async (id) => {
        const response = await fetch(`/api/usuarios/${id}`, {
            method: 'DELETE'
        });
        if (response.ok) {
            setUsers(prev => prev.filter(user => user.id !== id));
        }
        else {
            throw new Error('Failed to delete user');
        }
    };
    return (<AuthGuard_1.default requireAdmin>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
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
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Gerenciar Usuários
                </h1>
              </div>
              <UserMenu_1.default />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          <UserManagement_1.default users={users} onAddUser={createUser} onUpdateUser={updateUser} onDeleteUser={deleteUser} loading={loading}/>
        </main>
      </div>
    </AuthGuard_1.default>);
}
