import { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/Button';
import AuthGuard from '@/components/AuthGuard';
import UserMenu from '@/components/UserMenu';
import UserManagement from '@/pages/UserManagement';
import { UserType } from '@/shared/types';

export default function UserManagementStandalone() {
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const createUser = async (userData: Omit<UserType, 'id' | 'created_at' | 'updated_at'>) => {
    const response = await fetch('/api/usuarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    if (response.ok) {
      const newUser = await response.json();
      setUsers(prev => [newUser, ...prev]);
    } else {
      throw new Error('Failed to create user');
    }
  };

  const updateUser = async (id: number, userData: Partial<UserType>) => {
    const response = await fetch(`/api/usuarios/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    if (response.ok) {
      const updatedUser = await response.json();
      setUsers(prev => prev.map(user => user.id === id ? updatedUser : user));
    } else {
      throw new Error('Failed to update user');
    }
  };

  const deleteUser = async (id: number) => {
    const response = await fetch(`/api/usuarios/${id}`, {
      method: 'DELETE'
    });
    if (response.ok) {
      setUsers(prev => prev.filter(user => user.id !== id));
    } else {
      throw new Error('Failed to delete user');
    }
  };

  return (
    <AuthGuard requireAdmin>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
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
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Gerenciar Usuários
                </h1>
              </div>
              <UserMenu />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          <UserManagement
            users={users}
            onAddUser={createUser}
            onUpdateUser={updateUser}
            onDeleteUser={deleteUser}
            loading={loading}
          />
        </main>
      </div>
    </AuthGuard>
  );
}
