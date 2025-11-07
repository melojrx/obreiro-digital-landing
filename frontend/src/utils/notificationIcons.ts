/**
 * Helper para ícones de notificações
 * Retorna o ícone apropriado para cada tipo de notificação
 */

import {
  UserPlus,
  Users,
  UserCheck,
  ArrowRightLeft,
  UserCog,
  User,
  Camera,
  Lock,
  AlertCircle,
  Bell,
  type LucideIcon,
} from 'lucide-react';
import type { NotificationType } from '@/types/notification';

/**
 * Mapeamento de tipos de notificação para ícones
 */
export const NOTIFICATION_ICONS: Record<NotificationType, LucideIcon> = {
  new_visitor: UserPlus,
  visitor_converted: UserCheck,
  new_member: Users,
  member_transferred: ArrowRightLeft,
  member_status_changed: UserCog,
  profile_updated: User,
  avatar_updated: Camera,
  password_changed: Lock,
  system_alert: AlertCircle,
};

/**
 * Retorna o ícone para um tipo de notificação
 */
export const getNotificationIcon = (type: NotificationType): LucideIcon => {
  return NOTIFICATION_ICONS[type] || Bell;
};

/**
 * Mapeamento de cores de ícones por tipo
 */
export const NOTIFICATION_ICON_COLORS: Record<NotificationType, string> = {
  new_visitor: 'text-blue-600',
  visitor_converted: 'text-green-600',
  new_member: 'text-purple-600',
  member_transferred: 'text-indigo-600',
  member_status_changed: 'text-orange-600',
  profile_updated: 'text-gray-600',
  avatar_updated: 'text-pink-600',
  password_changed: 'text-red-600',
  system_alert: 'text-yellow-600',
};

/**
 * Retorna a cor do ícone para um tipo de notificação
 */
export const getNotificationIconColor = (type: NotificationType): string => {
  return NOTIFICATION_ICON_COLORS[type] || 'text-gray-600';
};

/**
 * Mapeamento de cores de fundo por tipo
 */
export const NOTIFICATION_BG_COLORS: Record<NotificationType, string> = {
  new_visitor: 'bg-blue-50',
  visitor_converted: 'bg-green-50',
  new_member: 'bg-purple-50',
  member_transferred: 'bg-indigo-50',
  member_status_changed: 'bg-orange-50',
  profile_updated: 'bg-gray-50',
  avatar_updated: 'bg-pink-50',
  password_changed: 'bg-red-50',
  system_alert: 'bg-yellow-50',
};

/**
 * Retorna a cor de fundo para um tipo de notificação
 */
export const getNotificationBgColor = (type: NotificationType): string => {
  return NOTIFICATION_BG_COLORS[type] || 'bg-gray-50';
};
