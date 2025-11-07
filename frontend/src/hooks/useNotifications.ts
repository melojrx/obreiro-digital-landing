/**
 * Hook customizado para gerenciar notificações
 * 
 * Suporta duas estratégias de atualização em tempo real:
 * 1. SSE (Server-Sent Events) - Padrão, notificações instantâneas
 * 2. Polling - Fallback caso SSE não esteja disponível
 * 
 * SSE é preferível pois consome menos recursos e entrega notificações
 * em menos de 1 segundo (vs 60s do polling).
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { notificationService, createNotificationPoller } from '@/services/notificationService';
import { useSSE } from './useSSE';
import { NOTIFICATIONS_CONFIG } from '@/config/api';
import type {
  NotificationListItem,
  NotificationFilters,
  NotificationContextState,
} from '@/types/notification';

/**
 * Configurações do hook
 */
interface UseNotificationsOptions {
  autoFetch?: boolean; // Buscar notificações ao montar
  enablePolling?: boolean; // Ativar polling automático (fallback se SSE falhar)
  pollingInterval?: number; // Intervalo do polling em ms (padrão: 60000 = 60s)
  filters?: NotificationFilters; // Filtros iniciais
  useSSE?: boolean; // Usar SSE para tempo real (padrão: true)
}

/**
 * Hook para gerenciar notificações
 * 
 * Prioriza SSE para tempo real, com fallback automático para polling
 */
export const useNotifications = (options: UseNotificationsOptions = {}) => {
  const {
    autoFetch = true,
    enablePolling = true, // Usado como fallback se SSE falhar
    pollingInterval = NOTIFICATIONS_CONFIG.pollingInterval, // 60 segundos padrão
    filters: initialFilters,
    useSSE: enableSSE = NOTIFICATIONS_CONFIG.enableSSE, // Auto-detecta ambiente
  } = options;

  // Estado
  const [state, setState] = useState<NotificationContextState>({
    notifications: [],
    unreadCount: 0,
    loading: false,
    error: null,
    pollingEnabled: false,
  });

  const pollerRef = useRef<ReturnType<typeof createNotificationPoller> | null>(null);
  const mountedRef = useRef(true);
  const [sseEnabled, setSSEEnabled] = useState(enableSSE);

  /**
   * SSE para notificações em tempo real
   * Recebe eventos de contagem de notificações não lidas
   * 
   * ⚠️ PRODUÇÃO: SSE desabilitado por padrão (NOTIFICATIONS_CONFIG.enableSSE = false)
   * Motivo: Requer Gunicorn+Gevent ou servidor ASGI para não bloquear workers
   * Polling é usado como estratégia principal em produção (estável e confiável)
   */
  const {
    data: sseData,
    isConnected: sseConnected,
    error: sseError,
  } = useSSE<{ count: number; timestamp: number }>({
    url: NOTIFICATIONS_CONFIG.sseStreamUrl,
    eventName: 'notification_count',
    enabled: sseEnabled,
    autoReconnect: true,
    reconnectDelay: 5000,
    maxReconnectAttempts: 3, // Após 3 falhas, desiste e usa polling
    onMessage: (data) => {
      if (mountedRef.current) {
        setState((prev) => ({ ...prev, unreadCount: data.count }));
      }
    },
    onConnect: () => {
      console.log('[useNotifications] SSE conectado - notificações em tempo real ativas');
      // Parar polling se estava ativo (SSE tem prioridade)
      stopPolling();
    },
    onError: (error) => {
      console.warn('[useNotifications] Erro no SSE, usando polling como fallback');
      
      // Se SSE falhar múltiplas vezes, desabilitar e usar polling
      if (enablePolling) {
        setSSEEnabled(false);
        startPolling();
      }
    },
  });

  /**
   * Busca lista de notificações
   */
  const fetchNotifications = useCallback(
    async (filters?: NotificationFilters) => {
      if (!mountedRef.current) return;

      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const response = await notificationService.getNotifications({
          ...initialFilters,
          ...filters,
        });

        if (mountedRef.current) {
          setState((prev) => ({
            ...prev,
            notifications: response.results,
            loading: false,
          }));
        }
      } catch (error) {
        console.error('Erro ao buscar notificações:', error);
        if (mountedRef.current) {
          setState((prev) => ({
            ...prev,
            loading: false,
            error: 'Erro ao carregar notificações',
          }));
        }
      }
    },
    [initialFilters]
  );

  /**
   * Busca contagem de não lidas
   */
  const fetchUnreadCount = useCallback(async () => {
    if (!mountedRef.current) return;

    try {
      const count = await notificationService.getUnreadCount();
      if (mountedRef.current) {
        setState((prev) => ({ ...prev, unreadCount: count }));
      }
    } catch (error) {
      console.error('Erro ao buscar contagem de notificações:', error);
    }
  }, []);

  /**
   * Marca uma notificação como lida
   */
  const markAsRead = useCallback(
    async (notificationId: number) => {
      try {
        await notificationService.markAsRead(notificationId, true);

        if (mountedRef.current) {
          // Atualizar estado local
          setState((prev) => ({
            ...prev,
            notifications: prev.notifications.map((notif) =>
              notif.id === notificationId ? { ...notif, is_read: true } : notif
            ),
            unreadCount: Math.max(0, prev.unreadCount - 1),
          }));
        }
      } catch (error) {
        console.error('Erro ao marcar notificação como lida:', error);
        throw error;
      }
    },
    []
  );

  /**
   * Marca todas as notificações como lidas
   */
  const markAllAsRead = useCallback(async () => {
    try {
      await notificationService.markAllAsRead();

      if (mountedRef.current) {
        // Atualizar estado local
        setState((prev) => ({
          ...prev,
          notifications: prev.notifications.map((notif) => ({
            ...notif,
            is_read: true,
          })),
          unreadCount: 0,
        }));
      }
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
      throw error;
    }
  }, []);

  /**
   * Marca múltiplas notificações como lidas
   */
  const bulkMarkAsRead = useCallback(async (notificationIds: number[]) => {
    try {
      await notificationService.bulkMarkAsRead(notificationIds, true);

      if (mountedRef.current) {
        // Atualizar estado local
        setState((prev) => ({
          ...prev,
          notifications: prev.notifications.map((notif) =>
            notificationIds.includes(notif.id)
              ? { ...notif, is_read: true }
              : notif
          ),
          unreadCount: Math.max(0, prev.unreadCount - notificationIds.length),
        }));
      }
    } catch (error) {
      console.error('Erro ao marcar múltiplas notificações:', error);
      throw error;
    }
  }, []);

  /**
   * Limpa todas as notificações
   */
  const clearAll = useCallback(async () => {
    try {
      await notificationService.clearAll();

      if (mountedRef.current) {
        setState((prev) => ({
          ...prev,
          notifications: [],
          unreadCount: 0,
        }));
      }
    } catch (error) {
      console.error('Erro ao limpar notificações:', error);
      throw error;
    }
  }, []);

  /**
   * Inicia o polling
   */
  const startPolling = useCallback(() => {
    if (pollerRef.current || !mountedRef.current) return;

    pollerRef.current = createNotificationPoller(
      (count) => {
        if (mountedRef.current) {
          setState((prev) => ({ ...prev, unreadCount: count }));
        }
      },
      pollingInterval
    );

    pollerRef.current.start();
    setState((prev) => ({ ...prev, pollingEnabled: true }));
  }, [pollingInterval]);

  /**
   * Para o polling
   */
  const stopPolling = useCallback(() => {
    if (pollerRef.current) {
      pollerRef.current.stop();
      pollerRef.current = null;
      setState((prev) => ({ ...prev, pollingEnabled: false }));
    }
  }, []);

  /**
   * Efeito de montagem
   */
  useEffect(() => {
    mountedRef.current = true;

    // Buscar dados iniciais
    if (autoFetch) {
      fetchNotifications();
      fetchUnreadCount();
    }

    // SSE é iniciado automaticamente pelo hook useSSE
    // Polling só é iniciado se:
    // 1. SSE está desabilitado, OU
    // 2. SSE falhou e enablePolling = true (fallback)
    if (!enableSSE && enablePolling) {
      startPolling();
    }

    // Cleanup
    return () => {
      mountedRef.current = false;
      stopPolling();
    };
  }, [autoFetch, enableSSE, enablePolling, startPolling, stopPolling, fetchNotifications, fetchUnreadCount]);

  return {
    // Estado
    notifications: state.notifications,
    unreadCount: state.unreadCount,
    loading: state.loading,
    error: state.error,
    pollingEnabled: state.pollingEnabled,
    
    // Estado SSE
    sseConnected,
    sseEnabled,

    // Ações
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    bulkMarkAsRead,
    clearAll,
    startPolling,
    stopPolling,
  };
};

export default useNotifications;
