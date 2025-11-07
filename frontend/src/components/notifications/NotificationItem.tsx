/**
 * Componente NotificationItem
 * Exibe um item individual de notificação
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { formatRelativeTime } from '@/types/notification';
import {
  getNotificationIcon,
  getNotificationIconColor,
  getNotificationBgColor,
} from '@/utils/notificationIcons';
import type { NotificationItemProps } from '@/types/notification';

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onClick,
  onMarkAsRead,
  compact = false,
}) => {
  const navigate = useNavigate();
  const Icon = getNotificationIcon(notification.notification_type);

  const handleClick = () => {
    // Marcar como lida se tiver callback
    if (!notification.is_read && onMarkAsRead) {
      onMarkAsRead(notification.id);
    }

    // Callback customizado
    if (onClick) {
      onClick(notification);
    }

    // Navegar para a URL de ação se existir
    if (notification.action_url) {
      navigate(notification.action_url);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        'flex items-start gap-3 p-3 transition-colors cursor-pointer',
        'hover:bg-gray-50 border-b border-gray-100 last:border-0',
        !notification.is_read && 'bg-blue-50/50',
        compact && 'p-2 gap-2'
      )}
    >
      {/* Ícone */}
      <div
        className={cn(
          'flex-shrink-0 rounded-full p-2',
          getNotificationBgColor(notification.notification_type)
        )}
      >
        <Icon
          className={cn(
            'w-4 h-4',
            getNotificationIconColor(notification.notification_type)
          )}
        />
      </div>

      {/* Conteúdo */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h4
            className={cn(
              'text-sm font-medium text-gray-900 line-clamp-1',
              !notification.is_read && 'font-semibold'
            )}
          >
            {notification.title}
          </h4>

          {!notification.is_read && (
            <div className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-1.5" />
          )}
        </div>

        {!compact && (
          <p className="text-sm text-gray-600 line-clamp-2 mt-0.5">
            {notification.message}
          </p>
        )}

        <p className="text-xs text-gray-500 mt-1">
          {formatRelativeTime(notification.created_at)}
        </p>
      </div>
    </div>
  );
};

export default NotificationItem;
