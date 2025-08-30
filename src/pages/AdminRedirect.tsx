import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function AdminRedirect() {
  const { isAdmin, isCollaborator, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  // Redirect based on user role
  if (isAdmin) {
    return <Navigate to="/admin/validacao" replace />;
  } else if (isCollaborator) {
    return <Navigate to="/calculadora" replace />;
  } else {
    // Fallback to calculator page for unauthenticated users
    return <Navigate to="/calculadora" replace />;
  }
}
