import { BrowserRouter as Router, Routes, Route } from "react-router";
import { AuthProvider } from "@/react-app/hooks/useAuth";
import HomePage from "@/react-app/pages/Home";

import UserManagementStandalone from "@/react-app/pages/UserManagementStandalone";
import Validacao from "@/react-app/pages/Validacao";
import HistoricoAprovacoes from "@/react-app/pages/HistoricoAprovacoes";
import DashboardCollaborator from "@/react-app/pages/DashboardCollaborator";
import AdminRedirect from "@/react-app/pages/AdminRedirect";
import CadastroAtividades from "@/react-app/pages/CadastroAtividades";
import CadastroUsuarios from "@/react-app/pages/CadastroUsuarios";
import CadastroKPIsStandalone from "@/react-app/pages/CadastroKPIsStandalone";
import ExportacaoDados from "@/react-app/pages/ExportacaoDados";

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/dashboard" element={<DashboardCollaborator />} />
          <Route path="/admin" element={<AdminRedirect />} />
          <Route path="/admin/users" element={<UserManagementStandalone />} />
          <Route path="/admin/atividades" element={<CadastroAtividades />} />
          <Route path="/admin/kpis" element={<CadastroKPIsStandalone />} />
          <Route path="/admin/cadastro-usuarios" element={<CadastroUsuarios />} />
          <Route path="/admin/validacao" element={<Validacao />} />
          <Route path="/admin/historico" element={<HistoricoAprovacoes />} />
          <Route path="/admin/exportacao" element={<ExportacaoDados />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
