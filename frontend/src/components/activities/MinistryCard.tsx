import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarInitials } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { 
  MoreVertical, 
  Edit3Icon, 
  TrashIcon, 
  EyeIcon, 
  EyeOffIcon, 
  UserIcon,
  CalendarIcon,
  UsersIcon,
  TrendingUpIcon,
  SettingsIcon
} from 'lucide-react';
import { Ministry } from '@/services/activityService';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface MinistryCardProps {
  ministry: Ministry;
  onEdit: (ministry: Ministry) => void;
  onDelete: (ministry: Ministry) => void;
  onViewActivities: (ministry: Ministry) => void;
  isLoading?: boolean;
}

export const MinistryCard: React.FC<MinistryCardProps> = ({
  ministry,
  onEdit,
  onDelete,
  onViewActivities,
  isLoading = false,
}) => {
  
  // Função para gerar iniciais do nome
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Função para obter status da atividade
  const getActivityLevel = () => {
    if (ministry.total_activities === 0) return { level: 'baixa', color: 'text-gray-500' };
    if (ministry.total_activities < 5) return { level: 'média', color: 'text-yellow-600' };
    return { level: 'alta', color: 'text-green-600' };
  };

  const activityLevel = getActivityLevel();

  return (
    <TooltipProvider>
      <Card className={`transition-all duration-200 hover:shadow-lg ${!ministry.is_active ? 'opacity-60' : ''}`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              {/* Avatar com cor do ministério */}
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-md"
                style={{ backgroundColor: ministry.color }}
              >
                {getInitials(ministry.name)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-lg truncate">
                    {ministry.name}
                  </h3>
                  <div className="flex items-center gap-1">
                    {ministry.is_public ? (
                      <Tooltip>
                        <TooltipTrigger>
                          <EyeIcon className="h-4 w-4 text-green-600" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Ministério público</p>
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <Tooltip>
                        <TooltipTrigger>
                          <EyeOffIcon className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Ministério privado</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                    {!ministry.is_active && (
                      <Badge variant="secondary" className="text-xs">
                        Inativo
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Líder */}
                {ministry.leader_name ? (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                    <UserIcon className="h-3 w-3" />
                    <span className="truncate">{ministry.leader_name}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                    <UserIcon className="h-3 w-3" />
                    <span className="italic">Sem líder definido</span>
                  </div>
                )}

                {/* Descrição */}
                {ministry.description ? (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {ministry.description}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    Sem descrição
                  </p>
                )}
              </div>
            </div>

            {/* Menu de ações */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(ministry)}>
                  <Edit3Icon className="h-4 w-4 mr-2" />
                  Editar Ministério
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onViewActivities(ministry)}>
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  Ver Atividades
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => onDelete(ministry)}
                  className="text-red-600 focus:text-red-600"
                >
                  <TrashIcon className="h-4 w-4 mr-2" />
                  Excluir Ministério
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {/* Estatísticas */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-center gap-1 mb-1">
                <CalendarIcon className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-600">Atividades</span>
              </div>
              <p className="text-xl font-bold text-blue-700">
                {ministry.total_activities}
              </p>
            </div>

            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="flex items-center justify-center gap-1 mb-1">
                <UsersIcon className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-600">Membros</span>
              </div>
              <p className="text-xl font-bold text-green-700">
                {ministry.total_members}
              </p>
            </div>
          </div>

          {/* Nível de Atividade */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1">
              <TrendingUpIcon className={`h-4 w-4 ${activityLevel.color}`} />
              <span className="text-muted-foreground">Atividade:</span>
              <span className={`font-medium ${activityLevel.color}`}>
                {activityLevel.level}
              </span>
            </div>

            <div className="text-xs text-muted-foreground">
              Criado em {format(new Date(ministry.created_at), "MMM yyyy", { locale: ptBR })}
            </div>
          </div>

          {/* Ações principais */}
          <div className="flex gap-2 mt-4">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onEdit(ministry)}
              className="flex-1"
              disabled={isLoading}
            >
              <Edit3Icon className="h-4 w-4 mr-2" />
              Editar
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onViewActivities(ministry)}
              disabled={isLoading}
            >
              <CalendarIcon className="h-4 w-4 mr-2" />
              Atividades
            </Button>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};

export default MinistryCard;