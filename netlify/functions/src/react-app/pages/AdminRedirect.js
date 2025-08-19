"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = AdminRedirect;
const react_router_1 = require("react-router");
const useAuth_1 = require("@/react-app/hooks/useAuth");
function AdminRedirect() {
    const { isAdmin, isCollaborator, loading } = (0, useAuth_1.useAuth)();
    if (loading) {
        return (<div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando permissões...</p>
        </div>
      </div>);
    }
    // Redirect based on user role
    if (isAdmin) {
        return <react_router_1.Navigate to="/admin/atividades" replace/>;
    }
    else if (isCollaborator) {
        return <react_router_1.Navigate to="/" replace/>;
    }
    else {
        // Fallback to login if no valid role
        return <react_router_1.Navigate to="/" replace/>;
    }
}
