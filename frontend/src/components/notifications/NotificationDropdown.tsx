/**
 * Componente NotificationDropdown
 * Dropdown de notificações para exibir no Header
 */

import React, { useState } from 'react';
import { Bell, Check, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { NotificationItem } from './NotificationItem';
import { useNotifications } from '@/hooks/useNotifications';
import type { NotificationDropdownProps } from '@/types/notification';
import { cn } from '@/lib/utils';

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  className,
  maxItems = 5,
}) => {
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    clearAll,
  } = useNotifications({
    enablePolling: true, // ✅ REATIVADO - max_connections aumentado para 200/300
    pollingInterval: 60000, // 60 segundos (aumentado para reduzir carga)
  });

  const [isOpen, setIsOpen] = useState(false);

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
    }
  };

  const handleClearAll = async () => {
    try {
      await clearAll();
    } catch (error) {
      console.error('Erro ao limpar notificações:', error);
    }
  };

  const displayNotifications = notifications.slice(0, maxItems);
  const hasNotifications = displayNotifications.length > 0;

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn('relative', className)}
          aria-label={`Notificações ${unreadCount > 0 ? `(${unreadCount} não lidas)` : ''}`}
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-96 p-0">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <DropdownMenuLabel className="p-0 text-base font-semibold">
            Notificações
          </DropdownMenuLabel>

          {hasNotifications && (
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  className="h-8 text-xs"
                >
                  <Check className="w-3 h-3 mr-1" />
                  Marcar todas como lidas
                </Button>
              )}

              <Button
                variant="ghost"
                size="icon"
                onClick={handleClearAll}
                className="h-8 w-8"
                title="Limpar todas"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          )}
        </div>

        {/* Lista de Notificações */}
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : hasNotifications ? (
          <ScrollArea className="max-h-[400px]">
            {displayNotifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={markAsRead}
                onClick={() => setIsOpen(false)}
              />
            ))}
          </ScrollArea>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <Bell className="w-12 h-12 text-gray-300 mb-3" />
            <p className="text-sm text-gray-500 font-medium">
              Nenhuma notificação
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Você está em dia com todas as suas notificações
            </p>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationDropdown;
