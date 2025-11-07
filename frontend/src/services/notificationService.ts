/**
 * Service para gerenciar notificações
 * Integração com a API de notificações do backend
 */

import { api } from '@/config/api';
import type {
  Notification,
  NotificationListItem,
  NotificationListResponse,
  NotificationFilters,
  UnreadCountResponse,
  MarkAsReadRequest,
  BulkMarkAsReadRequest,
} from '@/types/notification';

const NOTIFICATIONS_BASE_URL = '/notifications/';

/**
 * Service de Notificações
 */
export const notificationService = {
  /**
   * Busca lista de notificações com filtros opcionais
   */
  async getNotifications(
    filters?: NotificationFilters
  ): Promise<NotificationListResponse> {
    const params = new URLSearchParams();

    if (filters?.is_read !== undefined) {
      params.append('is_read', String(filters.is_read));
    }
    if (filters?.notification_type) {
      params.append('notification_type', filters.notification_type);
    }
    if (filters?.priority) {
      params.append('priority', filters.priority);
    }
    if (filters?.page) {
      params.append('page', String(filters.page));
    }
    if (filters?.page_size) {
      params.append('page_size', String(filters.page_size));
    }

    const url = params.toString()
      ? `${NOTIFICATIONS_BASE_URL}?${params.toString()}`
      : NOTIFICATIONS_BASE_URL;

    const response = await api.get<NotificationListResponse>(url);
    return response.data;
  },

  /**
   * Busca notificações recentes (últimos 7 dias)
   */
  async getRecentNotifications(): Promise<NotificationListItem[]> {
    const response = await api.get<NotificationListItem[]>(
      `${NOTIFICATIONS_BASE_URL}recent/`
    );
    return response.data;
  },

  /**
   * Busca uma notificação específica por ID
   */
  async getNotification(id: number): Promise<Notification> {
    const response = await api.get<Notification>(
      `${NOTIFICATIONS_BASE_URL}${id}/`
    );
    return response.data;
  },

  /**
   * Busca contagem de notificações não lidas
   */
  async getUnreadCount(): Promise<number> {
    const response = await api.get<{ count: number }>(
      `${NOTIFICATIONS_BASE_URL}unread_count/`
    );
    return response.data.count;  // Backend retorna 'count', não 'unread_count'
  },

  /**
   * Marca uma notificação como lida ou não lida
   */
  async markAsRead(
    id: number,
    isRead: boolean = true
  ): Promise<Notification> {
    const data: MarkAsReadRequest = { is_read: isRead };
    const response = await api.post<Notification>(
      `${NOTIFICATIONS_BASE_URL}${id}/mark_read/`,
      data
    );
    return response.data;
  },

  /**
   * Marca todas as notificações como lidas
   */
  async markAllAsRead(): Promise<{ message: string; updated: number }> {
    const response = await api.post<{ message: string; updated: number }>(
      `${NOTIFICATIONS_BASE_URL}mark_all_read/`
    );
    return response.data;
  },

  /**
   * Marca múltiplas notificações como lidas/não lidas
   */
  async bulkMarkAsRead(
    notificationIds: number[],
    isRead: boolean = true
  ): Promise<{ message: string; updated: number }> {
    const data: BulkMarkAsReadRequest = {
      notification_ids: notificationIds,
      is_read: isRead,
    };
    const response = await api.post<{ message: string; updated: number }>(
      `${NOTIFICATIONS_BASE_URL}bulk_mark_read/`,
      data
    );
    return response.data;
  },

  /**
   * Limpa todas as notificações (marca como inativas)
   */
  async clearAll(): Promise<{ message: string; deleted: number }> {
    const response = await api.post<{ message: string; deleted: number }>(
      `${NOTIFICATIONS_BASE_URL}clear_all/`
    );
    return response.data;
  },

  /**
   * Deleta uma notificação específica
   */
  async deleteNotification(id: number): Promise<void> {
    await api.delete(`${NOTIFICATIONS_BASE_URL}${id}/`);
  },
};

/**
 * Hook helper para polling de notificações
 */
export const createNotificationPoller = (
  onUpdate: (unreadCount: number) => void,
  interval: number = 30000 // 30 segundos por padrão
) => {
  let intervalId: NodeJS.Timeout | null = null;

  const start = () => {
    if (intervalId) return; // Já está rodando

    // Buscar imediatamente
    notificationService
      .getUnreadCount()
      .then(onUpdate)
      .catch((error) => {
        console.error('Erro ao buscar contagem de notificações:', error);
      });

    // Configurar polling
    intervalId = setInterval(() => {
      notificationService
        .getUnreadCount()
        .then(onUpdate)
        .catch((error) => {
          console.error('Erro no polling de notificações:', error);
        });
    }, interval);
  };

  const stop = () => {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  };

  return { start, stop };
};

export default notificationService;
