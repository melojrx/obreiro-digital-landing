/**
 * Componente Card para exibir informações de Igrejas
 * Design consistente com o padrão de cards do sistema
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import {
  Building2,
  MapPin,
  Users,
  Phone,
  Mail,
  Calendar,
  MoreVertical,
  Settings,
  Eye,
  Edit,
  Trash,
  Building,
  CheckCircle,
  XCircle,
  AlertCircle,
  Crown,
} from 'lucide-react';
import { ChurchDetails } from '@/types/hierarchy';

interface ChurchCardProps {
  // Dados da igreja
  church: ChurchDetails;
  
  // Estados visuais
  variant?: 'default' | 'compact' | 'detailed' | 'grid';
  size?: 'sm' | 'md' | 'lg';
  isSelected?: boolean;
  isLoading?: boolean;
  
  // Interações
  onClick?: (church: ChurchDetails) => void;
  onEdit?: (church: ChurchDetails) => void;
  onDelete?: (church: ChurchDetails) => void;
  onViewDetails?: (church: ChurchDetails) => void;
  onManageBranches?: (church: ChurchDetails) => void;
  onSettings?: (church: ChurchDetails) => void;
  
  // Permissões
  canEdit?: boolean;
  canDelete?: boolean;
  canManage?: boolean;
  canViewDetails?: boolean;
  
  // Customização
  showActions?: boolean;
  showStats?: boolean;
  showBadges?: boolean;
  className?: string;
}

// Helper para obter status visual
const getStatusConfig = (status: string, isActive: boolean) => {
  if (!isActive) {
    return {
      badge: 'Inativo',
      variant: 'destructive' as const,
      icon: <XCircle className="h-3 w-3" />,
    };
  }

  switch (status.toLowerCase()) {
    case 'active':
      return {
        badge: 'Ativo',
        variant: 'default' as const,
        icon: <CheckCircle className="h-3 w-3" />,
      };
    case 'trial':
      return {
        badge: 'Trial',
        variant: 'secondary' as const,
        icon: <AlertCircle className="h-3 w-3" />,
      };
    case 'suspended':
      return {
        badge: 'Suspenso',
        variant: 'destructive' as const,
        icon: <XCircle className="h-3 w-3" />,
      };
    default:
      return {
        badge: status,
        variant: 'outline' as const,
        icon: <AlertCircle className="h-3 w-3" />,
      };
  }
};

// Helper para formatar data
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('pt-BR');
};

// Skeleton loader
const ChurchCardSkeleton: React.FC<{ variant?: string }> = ({ variant = 'default' }) => (
  <Card className="shadow-sm">
    <CardHeader className="pb-2">
      <div className="flex items-start gap-3">
        <Skeleton className="h-12 w-12 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-8 w-8" />
      </div>
    </CardHeader>
    <CardContent className="space-y-3">
      <div className="flex gap-2">
        <Skeleton className="h-6 w-16" />
        <Skeleton className="h-6 w-20" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    </CardContent>
  </Card>
);

export const ChurchCard: React.FC<ChurchCardProps> = ({
  church,
  variant = 'default',
  size = 'md',
  isSelected = false,
  isLoading = false,
  onClick,
  onEdit,
  onDelete,
  onViewDetails,
  onManageBranches,
  onSettings,
  canEdit = false,
  canDelete = false,
  canManage = false,
  canViewDetails = true,
  showActions = true,
  showStats = true,
  showBadges = true,
  className,
}) => {
  // Loading state
  if (isLoading) {
    return <ChurchCardSkeleton variant={variant} />;
  }

  const statusConfig = getStatusConfig(church.subscription_status, church.is_active);

  // Helper para iniciais
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Renderização baseada na variante
  const renderVariant = () => {
    switch (variant) {
      case 'compact':
        return renderCompactVariant();
      case 'detailed':
        return renderDetailedVariant();
      case 'grid':
        return renderGridVariant();
      default:
        return renderDefaultVariant();
    }
  };

  // Variante padrão
  const renderDefaultVariant = () => (
    <>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1">
            <Avatar className="h-12 w-12">
              <AvatarImage src={church.logo} alt={church.name} />
              <AvatarFallback className="bg-blue-100 text-blue-600">
                {getInitials(church.name)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg font-semibold leading-none">
                {church.name}
              </CardTitle>
              {church.short_name && (
                <p className="text-sm text-muted-foreground mt-1">
                  {church.short_name}
                </p>
              )}
              
              <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{church.city}, {church.state}</span>
              </div>
            </div>
          </div>

          {showActions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {canViewDetails && (
                  <DropdownMenuItem onClick={() => onViewDetails?.(church)}>
                    <Eye className="h-4 w-4 mr-2" />
                    Ver Detalhes
                  </DropdownMenuItem>
                )}
                {canManage && (
                  <DropdownMenuItem onClick={() => onManageBranches?.(church)}>
                    <Building className="h-4 w-4 mr-2" />
                    Gerenciar Congregações
                  </DropdownMenuItem>
                )}
                {canEdit && (
                  <DropdownMenuItem onClick={() => onEdit?.(church)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </DropdownMenuItem>
                )}
                {canManage && (
                  <DropdownMenuItem onClick={() => onSettings?.(church)}>
                    <Settings className="h-4 w-4 mr-2" />
                    Configurações
                  </DropdownMenuItem>
                )}
                {canDelete && (
                  <>
                    <Separator />
                    <DropdownMenuItem 
                      onClick={() => onDelete?.(church)}
                      className="text-red-600"
                    >
                      <Trash className="h-4 w-4 mr-2" />
                      Excluir
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-4">
        {showBadges && (
          <div className="flex flex-wrap gap-2">
            <Badge variant={statusConfig.variant} className="flex items-center gap-1">
              {statusConfig.icon}
              {statusConfig.badge}
            </Badge>
            
            {church.denomination && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Crown className="h-3 w-3" />
                {church.denomination.name}
              </Badge>
            )}
            
            <Badge variant="secondary">
              {church.subscription_plan}
            </Badge>
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="h-4 w-4" />
            <span>{church.email}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Phone className="h-4 w-4" />
            <span>{church.phone}</span>
          </div>
          
          {church.main_pastor && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>Pastor: {church.main_pastor.full_name}</span>
            </div>
          )}
        </div>

        {showStats && (
          <>
            <Separator />
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-lg font-semibold">{church.total_members}</div>
                <div className="text-xs text-muted-foreground">Membros</div>
              </div>
              <div>
                <div className="text-lg font-semibold">{church.total_visitors}</div>
                <div className="text-xs text-muted-foreground">Visitantes</div>
              </div>
              <div>
                <div className="text-lg font-semibold">{church.branches_count || 0}</div>
                <div className="text-xs text-muted-foreground">Congregações</div>
              </div>
            </div>
          </>
        )}

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          <span>Criado em {formatDate(church.created_at)}</span>
        </div>
      </CardContent>
    </>
  );

  // Variante compacta
  const renderCompactVariant = () => (
    <>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={church.logo} alt={church.name} />
            <AvatarFallback className="bg-blue-100 text-blue-600">
              {getInitials(church.name)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="font-semibold truncate">{church.name}</div>
            <div className="text-sm text-muted-foreground truncate">
              {church.city}, {church.state}
            </div>
          </div>
          
          <div className="text-right">
            <Badge variant={statusConfig.variant} size="sm">
              {statusConfig.badge}
            </Badge>
            <div className="text-xs text-muted-foreground mt-1">
              {church.total_members} membros
            </div>
          </div>
        </div>
      </CardContent>
    </>
  );

  // Variante detalhada
  const renderDetailedVariant = () => (
    <>
      <CardHeader className="pb-3">
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={church.logo} alt={church.name} />
            <AvatarFallback className="bg-blue-100 text-blue-600 text-lg">
              {getInitials(church.name)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <CardTitle className="text-xl">{church.name}</CardTitle>
            {church.short_name && (
              <p className="text-muted-foreground">{church.short_name}</p>
            )}
            
            {church.description && (
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                {church.description}
              </p>
            )}
          </div>

          {showActions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {canViewDetails && (
                  <DropdownMenuItem onClick={() => onViewDetails?.(church)}>
                    <Eye className="h-4 w-4 mr-2" />
                    Ver Detalhes
                  </DropdownMenuItem>
                )}
                {canManage && (
                  <DropdownMenuItem onClick={() => onManageBranches?.(church)}>
                    <Building className="h-4 w-4 mr-2" />
                    Gerenciar Congregações
                  </DropdownMenuItem>
                )}
                {canEdit && (
                  <DropdownMenuItem onClick={() => onEdit?.(church)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {showBadges && (
          <div className="flex flex-wrap gap-2">
            <Badge variant={statusConfig.variant}>
              {statusConfig.icon}
              {statusConfig.badge}
            </Badge>
            
            {church.denomination && (
              <Badge variant="outline">
                <Crown className="h-3 w-3 mr-1" />
                {church.denomination.name}
              </Badge>
            )}
          </div>
        )}

        {/* Informações de contato */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{church.email}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{church.phone}</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{church.city}, {church.state}</span>
            </div>
            {church.main_pastor && (
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>{church.main_pastor.full_name}</span>
              </div>
            )}
          </div>
        </div>

        {showStats && (
          <>
            <Separator />
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">{church.total_members}</div>
                <div className="text-xs text-muted-foreground">Membros</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{church.total_visitors}</div>
                <div className="text-xs text-muted-foreground">Visitantes</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">{church.branches_count || 0}</div>
                <div className="text-xs text-muted-foreground">Congregações</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">{church.max_members}</div>
                <div className="text-xs text-muted-foreground">Limite</div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </>
  );

  // Variante grid
  const renderGridVariant = () => (
    <>
      <CardContent className="p-4 text-center space-y-3">
        <Avatar className="h-16 w-16 mx-auto">
          <AvatarImage src={church.logo} alt={church.name} />
          <AvatarFallback className="bg-blue-100 text-blue-600 text-lg">
            {getInitials(church.name)}
          </AvatarFallback>
        </Avatar>
        
        <div>
          <div className="font-semibold truncate">{church.name}</div>
          <div className="text-sm text-muted-foreground truncate">
            {church.city}, {church.state}
          </div>
        </div>
        
        {showBadges && (
          <Badge variant={statusConfig.variant} size="sm">
            {statusConfig.badge}
          </Badge>
        )}
        
        {showStats && (
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <div className="font-semibold">{church.total_members}</div>
              <div className="text-muted-foreground text-xs">Membros</div>
            </div>
            <div>
              <div className="font-semibold">{church.branches_count || 0}</div>
              <div className="text-muted-foreground text-xs">Congregações</div>
            </div>
          </div>
        )}
      </CardContent>
    </>
  );

  return (
    <Card 
      className={cn(
        'shadow-sm transition-all hover:shadow-md',
        isSelected && 'ring-2 ring-blue-500 ring-offset-2',
        onClick && 'cursor-pointer hover:scale-[1.02]',
        className
      )}
      onClick={() => onClick?.(church)}
    >
      {renderVariant()}
    </Card>
  );
};