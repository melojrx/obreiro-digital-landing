import { useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { authService } from '../services/auth';

/**
 * Hook para detectar inatividade e fazer logout automático
 */
export const useInactivityLogout = () => {
  const { logout, isAuthenticated } = useAuth();

  // Lista de eventos que indicam atividade do usuário
  const activityEvents = [
    'mousedown',
    'mousemove', 
    'keypress',
    'scroll',
    'touchstart',
    'click'
  ];

  // Callback para atualizar atividade
  const updateActivity = useCallback(() => {
    if (isAuthenticated) {
      authService.updateActivity();
    }
  }, [isAuthenticated]);

  // Verificar expiração da sessão periodicamente
  const checkSessionExpiry = useCallback(() => {
    if (isAuthenticated && !authService.isAuthenticated()) {
      console.log('🚪 Fazendo logout automático por inatividade');
      logout();
    }
  }, [isAuthenticated, logout]);

  useEffect(() => {
    if (!isAuthenticated) return;

    // Adicionar listeners de atividade
    activityEvents.forEach(event => {
      document.addEventListener(event, updateActivity, true);
    });

    // Verificar expiração a cada minuto
    const checkInterval = setInterval(checkSessionExpiry, 60000);

    // Cleanup
    return () => {
      activityEvents.forEach(event => {
        document.removeEventListener(event, updateActivity, true);
      });
      clearInterval(checkInterval);
    };
  }, [isAuthenticated, updateActivity, checkSessionExpiry]);
}; 