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
  ChevronDown,
  Church,
  Heart,
  BarChart3
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

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
  const [expandedItems, setExpandedItems] = React.useState<string[]>(['PRINCIPAL']);

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

  const toggleExpanded = (title: string) => {
    setExpandedItems(prev => 
      prev.includes(title) 
        ? prev.filter(item => item !== title)
        : [...prev, title]
    );
  };

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  const isActive = (href: string) => location.pathname === href;

  return (
    <div className="w-64 bg-gradient-to-b from-blue-900 to-blue-800 text-white min-h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-blue-700">
        <div className="flex items-center space-x-2">
          <Church className="h-8 w-8 text-white" />
          <div>
            <h1 className="text-lg font-bold">Obreiro Virtual</h1>
            <p className="text-xs text-blue-200">Sistema de Gestão</p>
          </div>
        </div>
      </div>

      {/* Informações da Igreja */}
      {userChurch && (
        <div className="px-6 py-4 border-b border-blue-700">
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
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigation.map((section) => (
          <div key={section.title} className="mb-4">
            <button
              onClick={() => toggleExpanded(section.title)}
              className="w-full flex items-center justify-between text-xs font-semibold text-blue-200 uppercase tracking-wider mb-2 hover:text-white transition-colors"
            >
              <span>{section.title}</span>
              <ChevronDown 
                className={cn(
                  "h-4 w-4 transition-transform",
                  expandedItems.includes(section.title) ? "transform rotate-180" : ""
                )}
              />
            </button>
            
            {(expandedItems.includes(section.title) || section.title === 'PRINCIPAL') && (
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
            )}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-blue-700">
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-3 py-2 text-blue-100 hover:bg-white/10 hover:text-white rounded-lg transition-all duration-200"
        >
          <LogOut className="h-5 w-5" />
          <span className="text-sm font-medium">Sair</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar; 