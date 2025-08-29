import React from 'react';
import { Link, useLocation } from 'react-router';
import { Activity, BarChart3, Settings, Home, Database, TrendingUp } from 'lucide-react';
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarRail, SidebarTrigger, } from '@/react-app/components/ui/sidebar';
import UserMenu from '@/react-app/components/UserMenu';
const menuItems = [
    {
        id: 'dashboard',
        title: 'Dashboard',
        icon: Home,
        url: '/admin'
    },
    {
        id: 'productivity',
        title: 'Dashboard de Produtividade',
        icon: TrendingUp,
        url: '/admin?tab=productivity'
    },
    {
        id: 'activities',
        title: 'Cadastro de Atividades',
        icon: Activity,
        url: '/admin?tab=activities'
    },
    {
        id: 'kpis',
        title: 'Cadastro de KPIs',
        icon: BarChart3,
        url: '/admin?tab=kpis'
    },
    {
        id: 'wms',
        title: 'Usuários WMS',
        icon: Database,
        url: '/admin?tab=wms'
    }
];
export default function AdminLayout({ children, activeTab, onTabChange }) {
    const location = useLocation();
    const currentPath = location.pathname + location.search;
    const handleMenuClick = (item) => {
        if (item.url.startsWith('/admin?tab=') && onTabChange) {
            const tab = new URLSearchParams(item.url.split('?')[1]).get('tab');
            if (tab) {
                onTabChange(tab);
            }
        }
    };
    return (<SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar variant="inset">
          <SidebarHeader>
            <div className="flex items-center gap-2 px-4 py-2">
              <Settings className="h-6 w-6 text-blue-600"/>
              <span className="font-bold text-lg bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Admin Panel
              </span>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Gerenciamento</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item) => {
            const isActive = Boolean(currentPath === item.url ||
                (activeTab && item.id === activeTab));
            return (<SidebarMenuItem key={item.id}>
                        {item.url.startsWith('/admin?tab=') ? (<SidebarMenuButton onClick={() => handleMenuClick(item)} isActive={isActive} className="w-full justify-start">
                            <item.icon className="h-4 w-4"/>
                            <span>{item.title}</span>
                          </SidebarMenuButton>) : (<SidebarMenuButton asChild isActive={isActive}>
                            <Link to={item.url} className="flex items-center gap-2">
                              <item.icon className="h-4 w-4"/>
                              <span>{item.title}</span>
                            </Link>
                          </SidebarMenuButton>)}
                      </SidebarMenuItem>);
        })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarRail />
        </Sidebar>
        
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1"/>
            <div className="flex flex-1 items-center justify-between">
              <h1 className="text-xl font-semibold">Painel Administrativo</h1>
              <UserMenu />
            </div>
          </header>
          
          <main className="flex-1 overflow-auto p-4">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>);
}
