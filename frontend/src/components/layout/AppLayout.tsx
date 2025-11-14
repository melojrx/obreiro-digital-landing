import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useSidebar } from '@/hooks/useSidebar';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children?: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { isCollapsed } = useSidebar();

  return (
    <div className="min-h-screen bg-gray-50 flex w-full">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content Area */}
      <div className={cn(
        "flex-1 flex flex-col transition-all duration-300 min-w-0",
        isCollapsed ? "ml-0" : "ml-0"
      )}>
        {/* Header */}
        <Header />
        
        {/* Page Content */}
        <main className={cn(
          "flex-1 p-3 sm:p-4 lg:p-6 overflow-y-auto transition-all duration-300 min-w-0",
          // Adiciona mais espaço quando a sidebar está recolhida
          isCollapsed ? "max-w-full" : "max-w-full"
        )}>
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
};

export default AppLayout; 
