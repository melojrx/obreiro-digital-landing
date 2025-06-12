import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
}

/**
 * Componente para proteger rotas e gerenciar redirecionamentos
 * requireAuth: true = só usuários autenticados (dashboard)
 * requireAuth: false = só usuários NÃO autenticados (login/cadastro)
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAuth = true,
  redirectTo = requireAuth ? '/login' : '/dashboard'
}) => {
  const { isAuthenticated } = useAuth();
  
  // Se precisa estar autenticado mas não está -> login
  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // Se NÃO deve estar autenticado mas está -> dashboard
  if (!requireAuth && isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
}; 