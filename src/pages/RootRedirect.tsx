import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const RootRedirect = () => {
  const { isAdmin, isCollaborator, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div>Carregando...</div>
      </div>
    );
  }

  if (isCollaborator) {
    return <Navigate to="/calculadora" replace />;
  }

  if (isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  // Fallback for unauthenticated users, redirecting to the calculator page
  // which is protected by AuthGuard and will trigger the login flow.
  return <Navigate to="/calculadora" replace />;
};

export default RootRedirect;
