"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = App;
const react_router_1 = require("react-router");
const useAuth_1 = require("@/react-app/hooks/useAuth");
const Home_1 = __importDefault(require("@/react-app/pages/Home"));
const UserManagementStandalone_1 = __importDefault(require("@/react-app/pages/UserManagementStandalone"));
const Validacao_1 = __importDefault(require("@/react-app/pages/Validacao"));
const HistoricoAprovacoes_1 = __importDefault(require("@/react-app/pages/HistoricoAprovacoes"));
const DashboardCollaborator_1 = __importDefault(require("@/react-app/pages/DashboardCollaborator"));
const AdminRedirect_1 = __importDefault(require("@/react-app/pages/AdminRedirect"));
const CadastroAtividades_1 = __importDefault(require("@/react-app/pages/CadastroAtividades"));
const CadastroUsuarios_1 = __importDefault(require("@/react-app/pages/CadastroUsuarios"));
const CadastroKPIsStandalone_1 = __importDefault(require("@/react-app/pages/CadastroKPIsStandalone"));
const ExportacaoDados_1 = __importDefault(require("@/react-app/pages/ExportacaoDados"));
function App() {
    return (<useAuth_1.AuthProvider>
      <react_router_1.BrowserRouter>
        <react_router_1.Routes>
          <react_router_1.Route path="/" element={<Home_1.default />}/>
          <react_router_1.Route path="/dashboard" element={<DashboardCollaborator_1.default />}/>
          <react_router_1.Route path="/admin" element={<AdminRedirect_1.default />}/>
          <react_router_1.Route path="/admin/users" element={<UserManagementStandalone_1.default />}/>
          <react_router_1.Route path="/admin/atividades" element={<CadastroAtividades_1.default />}/>
          <react_router_1.Route path="/admin/kpis" element={<CadastroKPIsStandalone_1.default />}/>
          <react_router_1.Route path="/admin/cadastro-usuarios" element={<CadastroUsuarios_1.default />}/>
          <react_router_1.Route path="/admin/validacao" element={<Validacao_1.default />}/>
          <react_router_1.Route path="/admin/historico" element={<HistoricoAprovacoes_1.default />}/>
          <react_router_1.Route path="/admin/exportacao" element={<ExportacaoDados_1.default />}/>
        </react_router_1.Routes>
      </react_router_1.BrowserRouter>
    </useAuth_1.AuthProvider>);
}
