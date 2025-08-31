import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  level: 'public' | 'auth_incomplete' | 'auth_complete';
}

/**
 * Componente para proteger rotas e gerenciar redirecionamentos
 * requireAuth: true = só usuários autenticados (dashboard)
 * requireAuth: false = só usuários NÃO autenticados (login/cadastro)
 * Baseado nas melhores práticas do React Router oficial
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  level,
}) => {
  const { user, isAuthenticated, isInitializing } = useAuth();
  const location = useLocation();
  
  console.log('🛡️ ProtectedRoute:', { 
    level, 
    isAuthenticated, 
    isInitializing,
    pathname: location.pathname,
  });
  
  // Aguardar inicialização antes de redirecionar
  if (isInitializing) {
    console.log('⏳ ProtectedRoute aguardando inicialização...');
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-fuchsia-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Carregando...</p>
        </div>
      </div>
    );
  }
  
  const profileComplete = user?.is_profile_complete || false;

  // 1. Rota para Perfil Completo (ex: /dashboard)
  if (level === 'auth_complete') {
    if (!isAuthenticated) {
      console.log('❌ ProtectedRoute: Precisa estar autenticado, redirecionando para login');
      return <Navigate to="/login" state={{ from: location }} replace />;
    }
    if (isAuthenticated && !profileComplete) {
      console.log('✅ ProtectedRoute: Já autenticado, mas perfil incompleto, redirecionando para etapa-2');
      return <Navigate to="/cadastro/etapa-2" replace />;
    }
    console.log('✅ ProtectedRoute: Permitindo acesso');
    return <>{children}</>;
  }

  // 2. Rota para Cadastro Incompleto (ex: /cadastro/etapa-2)
  if (level === 'auth_incomplete') {
    if (!isAuthenticated) {
      console.log('❌ ProtectedRoute: Precisa estar autenticado, redirecionando para login');
      return <Navigate to="/login" state={{ from: location }} replace />;
    }
    if (isAuthenticated && profileComplete) {
      console.log('✅ ProtectedRoute: Já autenticado, mas perfil completo, redirecionando para dashboard');
      return <Navigate to="/dashboard" replace />;
    }
    console.log('✅ ProtectedRoute: Permitindo acesso');
    return <>{children}</>;
  }

  // 3. Rota Pública com restrição para logados (ex: /login, /cadastro)
  if (level === 'public') {
    if (isAuthenticated && profileComplete) {
      console.log('✅ ProtectedRoute: Já autenticado, mas perfil completo, redirecionando para dashboard');
      return <Navigate to="/dashboard" replace />;
    }
    // Permitir acesso às rotas de cadastro para usuários autenticados ou não autenticados
    // O fluxo das 3 etapas deve ser preservado
    console.log('✅ ProtectedRoute: Permitindo acesso');
    return <>{children}</>;
  }

  return <>{children}</>;
}; 