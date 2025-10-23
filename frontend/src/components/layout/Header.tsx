import React, { useState } from 'react';
import { Bell, Search, User, ChevronDown, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { ChurchSelector } from "./ChurchSelector";
import { BranchSelector } from "./BranchSelector";

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  // Função para fazer logout
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  return (
    <header className="bg-white border-b border-gray-200">
      {/* Main Header */}
      <div className="px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Left side - Title */}
          <div className="flex items-center space-x-3">
            <div className="flex-1">
              <h2 className="text-lg sm:text-2xl font-semibold text-gray-800">Dashboard</h2>
            </div>
          </div>

          {/* Center - Selectors */}
          <div className="hidden lg:flex flex-1 justify-center gap-2">
            <ChurchSelector />
            <BranchSelector />
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Desktop Search */}
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="search"
                placeholder="Buscar..."
                className="pl-10 pr-4 py-2 w-64 bg-gray-50 border-gray-200 focus:bg-white"
              />
            </div>

            {/* Mobile Search Button */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden"
              onClick={() => setShowMobileSearch(!showMobileSearch)}
            >
              <Search className="h-5 w-5 text-gray-600" />
            </Button>

            {/* Notifications */}
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5 text-gray-600" />
              <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2 px-2 sm:px-3">
                  <UserAvatar size="sm" />
                  <div className="hidden sm:flex items-center space-x-1">
                    <span className="text-sm font-medium text-gray-700">
                      {user?.full_name || 'Usuário'}
                    </span>
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="cursor-pointer"
                  onClick={() => navigate('/perfil')}
                >
                  <User className="mr-2 h-4 w-4" />
                  <span>Perfil</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Bell className="mr-2 h-4 w-4" />
                  <span>Notificações</span>
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-red-600 cursor-pointer"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Mobile Search Bar */}
      {showMobileSearch && (
        <div className="px-4 pb-3 border-t border-gray-100 md:hidden">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="search"
              placeholder="Buscar..."
              className="pl-10 pr-10 py-2 w-full bg-gray-50 border-gray-200 focus:bg-white"
              autoFocus
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6"
              onClick={() => setShowMobileSearch(false)}
            >
              <X className="h-4 w-4 text-gray-400" />
            </Button>
          </div>
        </div>
      )}

      {/* Mobile Selectors */}
      <div className="px-4 py-3 border-t border-gray-100 lg:hidden">
        <div className="flex flex-col gap-2">
          <ChurchSelector />
          <BranchSelector />
        </div>
      </div>
    </header>
  );
};

export default Header; 
