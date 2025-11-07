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

  // Construir URL do avatar com cache-busting
  // O Vite proxy irá redirecionar /media/ para http://backend:8000/media/
  const avatarUrl = React.useMemo(() => {
    if (!user?.profile?.avatar) return '';
    
    // Usar URL diretamente do backend + cache-busting
    const timestamp = Date.now();
    return `${user.profile.avatar}?t=${timestamp}`;
  }, [user?.profile?.avatar]);

  // Debug: log quando o avatar muda
  React.useEffect(() => {
    console.log('👤 UserAvatar re-renderizado:', {
      rawAvatar: user?.profile?.avatar,
      builtAvatarUrl: avatarUrl,
      name: user?.full_name,
      size,
      userId: user?.id
    });
  }, [user?.profile?.avatar, user?.full_name, size, user?.id, avatarUrl]);

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
      <Avatar className={`${sizeClasses[size]} ${className}`} key={`avatar-${user?.id}-${avatarUrl}`}>
        <AvatarImage 
          src={avatarUrl} 
          alt={user?.full_name || 'Avatar'}
          onError={(e) => {
            console.log('❌ Erro ao carregar avatar:', avatarUrl);
            // Fallback para mostrar as iniciais
            e.currentTarget.style.display = 'none';
          }}
          onLoad={() => {
            console.log('✅ Avatar carregado com sucesso:', avatarUrl);
          }}
        />
        <AvatarFallback className={`bg-gradient-to-br from-blue-500 to-fuchsia-500 text-white ${textSizeClasses[size]}`}>
          {user?.full_name ? getInitials(user.full_name) : 'U'}
        </AvatarFallback>
      </Avatar>
    );
}; 