import { BrowserRouter as Router, Routes, Route } from "react-router";
import { AuthProvider } from "@/hooks/useAuth";
import HomePage from "@/pages/Home";

import UserManagementStandalone from "@/pages/UserManagementStandalone";
import Validacao from "@/pages/Validacao";
import HistoricoAprovacoes from "@/pages/HistoricoAprovacoes";
import DashboardCollaborator from "@/pages/DashboardCollaborator";
import AdminRedirect from "@/pages/AdminRedirect";
import Admin from "@/pages/Admin";
import CadastroAtividades from "@/pages/CadastroAtividades";
import CadastroUsuarios from "@/pages/CadastroUsuarios";
import CadastroKPIsStandalone from "@/pages/CadastroKPIsStandalone";
import ExportacaoDados from "@/pages/ExportacaoDados";

export default function App() {
  return (
    <div>
      <Router>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/dashboard" element={<DashboardCollaborator />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/admin-redirect" element={<AdminRedirect />} />
            <Route path="/admin/users" element={<UserManagementStandalone />} />
            <Route path="/admin/atividades" element={<CadastroAtividades />} />
            <Route path="/cadastro-atividades" element={<CadastroAtividades />} />
            <Route path="/admin/kpis" element={<CadastroKPIsStandalone />} />
            <Route path="/admin/cadastro-usuarios" element={<CadastroUsuarios />} />
            <Route path="/admin/validacao" element={<Validacao />} />
            <Route path="/admin/historico" element={<HistoricoAprovacoes />} />
            <Route path="/admin/exportacao" element={<ExportacaoDados />} />
          </Routes>
        </AuthProvider>
      </Router>
    </div>
  );
}
