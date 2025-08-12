import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  UserPlus, 
  Calendar,
  MessageSquare,
  FileText,
  DollarSign,
  Settings,
  LogOut,
  Church,
  Heart,
  BarChart3,
  Menu,
  ChevronLeft
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSidebar } from '@/hooks/useSidebar';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface NavItem {
  title: string;
  icon: React.ElementType;
  href: string;
  badge?: number;
  children?: NavItem[];
}

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { user, userChurch, logout } = useAuth();
  const { isCollapsed, toggleSidebar } = useSidebar();

  const navigation: NavItem[] = [
    {
      title: 'PRINCIPAL',
      icon: LayoutDashboard,
      href: '/dashboard',
      children: [
        { title: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
        { title: 'Membros', icon: Users, href: '/membros' },
        { title: 'Visitantes', icon: UserPlus, href: '/visitantes' },
        { title: 'Eventos', icon: Calendar, href: '/eventos' },
      ]
    },
    {
      title: 'COMUNICAÇÃO',
      icon: MessageSquare,
      href: '#',
      children: [
        { title: 'Devocionais', icon: Heart, href: '/devocionais' },
        { title: 'Mensagens', icon: MessageSquare, href: '/mensagens', badge: 5 },
      ]
    },
    {
      title: 'ADMINISTRAÇÃO',
      icon: Settings,
      href: '#',
      children: [
        { title: 'Financeiro', icon: DollarSign, href: '/financeiro' },
        { title: 'Relatórios', icon: BarChart3, href: '/relatorios' },
        { title: 'Configurações', icon: Settings, href: '/configuracoes' },
      ]
    }
  ];

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  const isActive = (href: string) => location.pathname === href;

  return (
    <TooltipProvider>
      <div className={cn(
        "bg-gradient-to-b from-blue-900 to-blue-800 text-white min-h-screen flex flex-col transition-all duration-300 ease-in-out",
        isCollapsed ? "w-16" : "w-64"
      )}>
        {/* Header com Logo e Toggle */}
        <div className="border-b border-blue-700">
          <div className={cn(
            "flex items-center transition-all duration-300",
            isCollapsed ? "justify-center p-4" : "justify-between p-6"
          )}>
            <div className={cn(
              "flex items-center transition-all duration-300",
              isCollapsed ? "space-x-0" : "space-x-2"
            )}>
              {!isCollapsed && (
                <>
                  <Church className="h-8 w-8 text-white flex-shrink-0" />
                  <div className="transition-all duration-300 opacity-100">
                    <h1 className="text-lg font-bold">Obreiro Virtual</h1>
                    <p className="text-xs text-blue-200">Sistema de Gestão Eclesiástica</p>
                  </div>
                </>
              )}
            </div>
            
            {/* Botão de Toggle */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={toggleSidebar}
                  className={cn(
                    "p-2 rounded-lg hover:bg-white/10 transition-all duration-200",
                    isCollapsed && "mt-0"
                  )}
                >
                  {isCollapsed ? (
                    <Menu className="h-5 w-5 text-blue-200" />
                  ) : (
                    <ChevronLeft className="h-5 w-5 text-blue-200" />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>{isCollapsed ? 'Expandir sidebar' : 'Recolher sidebar'}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Informações da Igreja */}
        {userChurch && (
          <div className={cn(
            "border-b border-blue-700 transition-all duration-300",
            isCollapsed ? "px-2 py-2" : "px-6 py-4"
          )}>
            {isCollapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex justify-center">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                      <Church className="h-4 w-4 text-white" />
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <div className="space-y-1">
                    <p className="font-semibold">{userChurch.name}</p>
                    {userChurch.cnpj && (
                      <p className="text-xs">CNPJ: {userChurch.cnpj}</p>
                    )}
                    <p className="text-xs">{userChurch.city}, {userChurch.state}</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            ) : (
              <div className="space-y-1">
                <h2 className="text-sm font-semibold text-white truncate" title={userChurch.name}>
                  {userChurch.name}
                </h2>
                {userChurch.cnpj && (
                  <p className="text-xs text-blue-200">
                    CNPJ: {userChurch.cnpj}
                  </p>
                )}
                <p className="text-xs text-blue-300">
                  {userChurch.city}, {userChurch.state}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <nav className={cn(
          "flex-1 space-y-2 transition-all duration-300",
          isCollapsed ? "px-2 py-4" : "px-4 py-6"
        )}>
          {isCollapsed ? (
            // Navegação recolhida - apenas ícones
            <div className="space-y-2">
              {navigation.flatMap(section => 
                section.children?.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  
                  return (
                    <Tooltip key={item.href}>
                      <TooltipTrigger asChild>
                        <Link
                          to={item.href}
                          className={cn(
                            "flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200",
                            active 
                              ? "bg-white/20 text-white shadow-lg" 
                              : "text-blue-100 hover:bg-white/10 hover:text-white"
                          )}
                        >
                          <Icon className="h-5 w-5" />
                          {item.badge && (
                            <span className="absolute -top-1 -right-1 bg-fuchsia-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <p>{item.title}</p>
                      </TooltipContent>
                    </Tooltip>
                  );
                }) || []
              )}
            </div>
                     ) : (
             // Navegação expandida - layout completo
             navigation.map((section) => (
               <div key={section.title} className="mb-4">
                 <div className="text-xs font-semibold text-blue-200 uppercase tracking-wider mb-2">
                   {section.title}
                 </div>
                 
                 <div className="space-y-1">
                   {section.children?.map((item) => {
                     const Icon = item.icon;
                     const active = isActive(item.href);
                     
                     return (
                       <Link
                         key={item.href}
                         to={item.href}
                         className={cn(
                           "flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-200",
                           active 
                             ? "bg-white/20 text-white shadow-lg" 
                             : "text-blue-100 hover:bg-white/10 hover:text-white"
                         )}
                       >
                         <div className="flex items-center space-x-3">
                           <Icon className="h-5 w-5" />
                           <span className="text-sm font-medium">{item.title}</span>
                         </div>
                         {item.badge && (
                           <span className="bg-fuchsia-500 text-white text-xs px-2 py-1 rounded-full">
                             {item.badge}
                           </span>
                         )}
                       </Link>
                     );
                   })}
                 </div>
               </div>
             ))
           )}
        </nav>

        {/* Footer */}
        <div className={cn(
          "border-t border-blue-700 transition-all duration-300",
          isCollapsed ? "p-2" : "p-4"
        )}>
          {isCollapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleLogout}
                  className="w-10 h-10 flex items-center justify-center text-blue-100 hover:bg-white/10 hover:text-white rounded-lg transition-all duration-200"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Sair</p>
              </TooltipContent>
            </Tooltip>
          ) : (
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-3 py-2 text-blue-100 hover:bg-white/10 hover:text-white rounded-lg transition-all duration-200"
            >
              <LogOut className="h-5 w-5" />
              <span className="text-sm font-medium">Sair</span>
            </button>
          )}
        </div>
    </div>
    </TooltipProvider>
  );
};

export default Sidebar; 