import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';

interface UserAvatarProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({ 
  size = 'md', 
  className = '' 
}) => {
  const { user } = useAuth();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Debug: log quando o avatar muda
  React.useEffect(() => {
    console.log('👤 UserAvatar re-renderizado:', {
      avatar: user?.profile?.avatar,
      name: user?.full_name,
      size
    });
  }, [user?.profile?.avatar, user?.full_name, size]);

  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-24 w-24'
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-xl'
  };

  return (
    <Avatar className={`${sizeClasses[size]} ${className}`}>
      <AvatarImage 
        src={user?.profile?.avatar || ''} 
        alt={user?.full_name || 'Avatar'}
        key={user?.profile?.avatar} // Forçar re-render quando avatar mudar
      />
      <AvatarFallback className={`bg-gradient-to-br from-blue-500 to-fuchsia-500 text-white ${textSizeClasses[size]}`}>
        {user?.full_name ? getInitials(user.full_name) : 'U'}
      </AvatarFallback>
    </Avatar>
  );
}; 