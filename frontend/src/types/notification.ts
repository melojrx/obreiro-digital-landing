/**
 * Types para o Sistema de Notificações
 * Define interfaces e tipos para notificações do ObreiroVirtual
 */

/**
 * Tipos de notificação disponíveis no sistema
 */
export type NotificationType =
  | 'new_visitor'
  | 'visitor_converted'
  | 'new_member'
  | 'member_transferred'
  | 'member_status_changed'
  | 'profile_updated'
  | 'avatar_updated'
  | 'password_changed'
  | 'system_alert';

/**
 * Níveis de prioridade das notificações
 */
export type NotificationPriority = 'low' | 'medium' | 'high' | 'critical';

/**
 * Metadados genéricos das notificações
 */
export interface NotificationMetadata {
  [key: string]: unknown;
  visitor_id?: number;
  visitor_name?: string;
  member_id?: number;
  member_name?: string;
  branch_id?: number;
  branch_name?: string;
  old_status?: string;
  new_status?: string;
  changed_fields?: string[];
  wants_prayer?: boolean;
}

/**
 * Interface principal de uma notificação
 */
export interface Notification {
  id: number;
  uuid: string;
  user: number;
  church: number;
  notification_type: NotificationType;
  title: string;
  message: string;
  is_read: boolean;
  read_at: string | null;
  metadata: NotificationMetadata;
  action_url: string | null;
  priority: NotificationPriority;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

/**
 * Interface otimizada para listagem de notificações
 */
export interface NotificationListItem {
  id: number;
  notification_type: NotificationType;
  title: string;
  message: string;
  is_read: boolean;
  priority: NotificationPriority;
  created_at: string;
  action_url: string | null;
  metadata: NotificationMetadata;
}

/**
 * Response de contagem de notificações não lidas
 */
export interface UnreadCountResponse {
  unread_count: number;
}

/**
 * Request para marcar notificação como lida/não lida
 */
export interface MarkAsReadRequest {
  is_read: boolean;
}

/**
 * Request para marcar múltiplas notificações
 */
export interface BulkMarkAsReadRequest {
  notification_ids: number[];
  is_read: boolean;
}

/**
 * Response paginada de notificações
 */
export interface NotificationListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: NotificationListItem[];
}

/**
 * Filtros para busca de notificações
 */
export interface NotificationFilters {
  is_read?: boolean;
  notification_type?: NotificationType;
  priority?: NotificationPriority;
  page?: number;
  page_size?: number;
}

/**
 * Configurações de polling de notificações
 */
export interface NotificationPollingConfig {
  enabled: boolean;
  interval: number; // em milissegundos
  onError?: (error: Error) => void;
}

/**
 * Estado do contexto de notificações
 */
export interface NotificationContextState {
  notifications: NotificationListItem[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  pollingEnabled: boolean;
}

/**
 * Ações do contexto de notificações
 */
export interface NotificationContextActions {
  fetchNotifications: (filters?: NotificationFilters) => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (notificationId: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  bulkMarkAsRead: (notificationIds: number[]) => Promise<void>;
  clearAll: () => Promise<void>;
  startPolling: () => void;
  stopPolling: () => void;
}

/**
 * Props do componente NotificationDropdown
 */
export interface NotificationDropdownProps {
  className?: string;
  maxItems?: number;
}

/**
 * Props do componente NotificationItem
 */
export interface NotificationItemProps {
  notification: NotificationListItem;
  onClick?: (notification: NotificationListItem) => void;
  onMarkAsRead?: (notificationId: number) => void;
  compact?: boolean;
}

/**
 * Mapeamento de tipos para labels em português
 */
export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  new_visitor: 'Novo Visitante',
  visitor_converted: 'Visitante Convertido',
  new_member: 'Novo Membro',
  member_transferred: 'Membro Transferido',
  member_status_changed: 'Status Alterado',
  profile_updated: 'Perfil Atualizado',
  avatar_updated: 'Avatar Atualizado',
  password_changed: 'Senha Alterada',
  system_alert: 'Alerta do Sistema',
};

/**
 * Mapeamento de prioridades para labels
 */
export const NOTIFICATION_PRIORITY_LABELS: Record<NotificationPriority, string> = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
  critical: 'Crítica',
};

/**
 * Cores das prioridades (Tailwind)
 */
export const NOTIFICATION_PRIORITY_COLORS: Record<NotificationPriority, string> = {
  low: 'text-gray-600 bg-gray-100',
  medium: 'text-blue-600 bg-blue-100',
  high: 'text-orange-600 bg-orange-100',
  critical: 'text-red-600 bg-red-100',
};

/**
 * Helper para formatar tempo relativo
 */
export const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'agora mesmo';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} min atrás`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h atrás`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays}d atrás`;
  }

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks} sem atrás`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  return `${diffInMonths} mês${diffInMonths > 1 ? 'es' : ''} atrás`;
};
