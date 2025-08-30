import { NavLink } from 'react-router-dom';
import {
  ClipboardList,
  CheckSquare,
  Users,
  History,
  Download,
  BarChart2,
  LayoutDashboard,
  UserCog,
} from 'lucide-react';

const Sidebar = () => {
  return (
    <aside className="w-64 bg-gray-800 text-white flex flex-col">
      <div className="p-4 font-bold text-lg border-b border-gray-700">
        Admin RV
      </div>
      <nav className="flex flex-col p-2 space-y-1">
        <NavLink
          to="/admin/produtividade"
          className={({ isActive }: { isActive: boolean }) =>
            `flex items-center p-2 rounded-md transition-colors ${
              isActive
                ? 'bg-gray-700 text-white'
                : 'text-gray-400 hover:bg-gray-700 hover:text-white'
            }`
          }
        >
          <BarChart2 className="mr-3 h-5 w-5" />
          Produtividade
        </NavLink>
        <NavLink
          to="/admin/validacao"
          className={({ isActive }: { isActive: boolean }) =>
            `flex items-center p-2 rounded-md transition-colors ${
              isActive
                ? 'bg-gray-700 text-white'
                : 'text-gray-400 hover:bg-gray-700 hover:text-white'
            }`
          }
        >
          <CheckSquare className="mr-3 h-5 w-5" />
          Validação
        </NavLink>
        <NavLink
          to="/admin/atividades"
          className={({ isActive }: { isActive: boolean }) =>
            `flex items-center p-2 rounded-md transition-colors ${
              isActive
                ? 'bg-gray-700 text-white'
                : 'text-gray-400 hover:bg-gray-700 hover:text-white'
            }`
          }
        >
          <ClipboardList className="mr-3 h-5 w-5" />
          Atividades
        </NavLink>
        <NavLink
          to="/admin/kpis"
          className={({ isActive }: { isActive: boolean }) =>
            `flex items-center p-2 rounded-md transition-colors ${
              isActive
                ? 'bg-gray-700 text-white'
                : 'text-gray-400 hover:bg-gray-700 hover:text-white'
            }`
          }
        >
          <BarChart2 className="mr-3 h-5 w-5" />
          KPIs
        </NavLink>
        <NavLink
          to="/admin/cadastro-usuarios"
          className={({ isActive }: { isActive: boolean }) =>
            `flex items-center p-2 rounded-md transition-colors ${
              isActive
                ? 'bg-gray-700 text-white'
                : 'text-gray-400 hover:bg-gray-700 hover:text-white'
            }`
          }
        >
          <Users className="mr-3 h-5 w-5" />
          Usuários
        </NavLink>
        <NavLink
          to="/admin/wms-users"
          className={({ isActive }: { isActive: boolean }) =>
            `flex items-center p-2 rounded-md transition-colors ${
              isActive
                ? 'bg-gray-700 text-white'
                : 'text-gray-400 hover:bg-gray-700 hover:text-white'
            }`
          }
        >
          <UserCog className="mr-3 h-5 w-5" />
          Usuários WMS
        </NavLink>
        <NavLink
          to="/admin/historico"
          className={({ isActive }: { isActive: boolean }) =>
            `flex items-center p-2 rounded-md transition-colors ${
              isActive
                ? 'bg-gray-700 text-white'
                : 'text-gray-400 hover:bg-gray-700 hover:text-white'
            }`
          }
        >
          <History className="mr-3 h-5 w-5" />
          Histórico
        </NavLink>
        <NavLink
          to="/admin/exportacao"
          className={({ isActive }: { isActive: boolean }) =>
            `flex items-center p-2 rounded-md transition-colors ${
              isActive
                ? 'bg-gray-700 text-white'
                : 'text-gray-400 hover:bg-gray-700 hover:text-white'
            }`
          }
        >
          <Download className="mr-3 h-5 w-5" />
          Exportação
        </NavLink>
      </nav>
    </aside>
  );
};

export default Sidebar;
