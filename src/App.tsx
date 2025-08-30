import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import Home from './pages/Home';
import AdminRedirect from './pages/AdminRedirect';
import RootRedirect from './pages/RootRedirect'; // Importar o novo componente
import { AuthProvider } from './hooks/useAuth';
import AdminLayout from './components/AdminLayout';
import DashboardCollaborator from './pages/DashboardCollaborator';
import Validacao from './pages/Validacao';
import CadastroAtividades from './pages/CadastroAtividades';
import CadastroKPIs from './pages/CadastroKPIs';
import CadastroUsuarios from './pages/CadastroUsuarios';
import HistoricoAprovacoes from './pages/HistoricoAprovacoes';
import ExportacaoDados from './pages/ExportacaoDados';
import UserManagementStandalone from './pages/UserManagementStandalone';
import ProductivityDashboard from './components/ProductivityDashboard';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/dashboard" element={<DashboardCollaborator />} />
          <Route path="/calculadora" element={<Home />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminRedirect />} />
            <Route path="produtividade" element={<ProductivityDashboard />} />
            <Route path="validacao" element={<Validacao />} />
            <Route path="atividades" element={<CadastroAtividades />} />
            <Route path="kpis" element={<CadastroKPIs />} />
            <Route path="cadastro-usuarios" element={<CadastroUsuarios />} />
            <Route path="wms-users" element={<UserManagementStandalone />} />
            <Route path="historico" element={<HistoricoAprovacoes />} />
            <Route path="exportacao" element={<ExportacaoDados />} />
          </Route>
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
