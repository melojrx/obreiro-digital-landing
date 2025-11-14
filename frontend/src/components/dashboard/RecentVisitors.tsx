/**
 * Componente de Visitantes Recentes para Dashboard
 * Lista os visitantes mais recentes registrados via QR Code
 */

import React, { useEffect, useState } from 'react';
import { UserPlus, Clock, MapPin, Heart, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Skeleton } from '../ui/skeleton';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { getVisitors, formatFollowUpStatus, type Visitor } from '../../services/visitorsService';
import { usePermissions } from '@/hooks/usePermissions';

interface RecentVisitorsProps {
  className?: string;
  limit?: number;
}

export const RecentVisitors: React.FC<RecentVisitorsProps> = ({ 
  className, 
  limit = 5 
}) => {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const permissions = usePermissions();

  useEffect(() => {
    const fetchVisitors = async () => {
      try {
        setIsLoading(true);
        setError(null);
        if (!permissions.canViewVisitors) {
          setVisitors([]);
          return;
        }
        // Buscar visitantes mais recentes respeitando escopo de backend
        const data = await getVisitors({ ordering: '-created_at', page_size: limit });
        setVisitors(Array.isArray(data) ? data.slice(0, limit) : []);
      } catch (err) {
        console.error('Erro ao buscar visitantes recentes:', err);
        setError('Erro ao carregar visitantes');
      } finally {
        setIsLoading(false);
      }
    };

    fetchVisitors();
  }, [limit, permissions.canViewVisitors]);

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Agora mesmo';
    } else if (diffInHours < 24) {
      return `${diffInHours}h atrás`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d atrás`;
    }
  };

  const getStatusColor = (status: string, converted: boolean): string => {
    if (converted) return 'bg-green-100 text-green-800';
    
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'contacted': return 'bg-blue-100 text-blue-800';
      case 'interested': return 'bg-purple-100 text-purple-800';
      case 'not_interested': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <UserPlus className="h-5 w-5" />
            <span>Visitantes Recentes</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center space-x-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <UserPlus className="h-5 w-5" />
            <span>Visitantes Recentes</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center space-x-2">
            <UserPlus className="h-5 w-5" />
            <span>Visitantes Recentes</span>
          </div>
          <div className="flex w-full sm:w-auto justify-end">
            <Badge variant="secondary" className="text-xs shrink-0">
              {visitors.length}
            </Badge>
          </div>
        </CardTitle>
        <CardDescription>
          Últimos visitantes registrados via QR Code
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {visitors.length === 0 ? (
          <div className="text-center py-6">
            <Users className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <h3 className="text-sm font-medium text-gray-900 mb-1">
              Nenhum visitante ainda
            </h3>
            <p className="text-xs text-gray-500">
              Os visitantes que se registrarem via QR Code aparecerão aqui
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {visitors.map((visitor) => (
                <div 
                  key={visitor.id} 
                  className="flex items-start gap-3 p-2.5 hover:bg-gray-50 rounded-lg transition-colors border border-transparent hover:border-gray-200"
                >
                  <Avatar className="h-9 w-9 shrink-0">
                    <AvatarFallback className="text-xs font-medium bg-gradient-to-br from-blue-500 to-cyan-400 text-white">
                      {getInitials(visitor.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0 space-y-1">
                    {/* Linha 1: Nome e Tempo */}
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-medium text-gray-900 truncate leading-tight">
                        {visitor.full_name}
                      </h4>
                      <div className="flex items-center gap-1 text-xs text-gray-500 shrink-0">
                        <Clock className="h-3 w-3" />
                        <span className="whitespace-nowrap">{formatRelativeTime(visitor.created_at)}</span>
                      </div>
                    </div>
                    
                    {/* Linha 2: Localização */}
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span className="truncate">
                        {visitor.branch_name || visitor.city}
                      </span>
                    </div>
                    
                    {/* Linha 3: Badges e Indicadores */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      {/* Badge de Status Principal */}
                      <Badge 
                        className={`text-[10px] px-1.5 py-0 leading-tight shrink-0 ${getStatusColor(
                          visitor.follow_up_status, 
                          visitor.converted_to_member
                        )}`}
                      >
                        {visitor.converted_to_member 
                          ? 'Membro' 
                          : formatFollowUpStatus(visitor.follow_up_status)
                        }
                      </Badge>
                      
                      {/* Badge Primeira Visita */}
                      {visitor.first_visit && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 leading-tight shrink-0">
                          1ª visita
                        </Badge>
                      )}
                      
                      {/* Indicadores Especiais */}
                      {visitor.wants_prayer && (
                        <div className="flex items-center gap-1 text-[10px] text-red-600 shrink-0">
                          <Heart className="h-3 w-3" />
                          <span>Oração</span>
                        </div>
                      )}
                      {visitor.wants_growth_group && (
                        <div className="flex items-center gap-1 text-[10px] text-blue-600 shrink-0">
                          <Users className="h-3 w-3" />
                          <span>Grupo</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="pt-2 border-t">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full text-xs h-8"
                onClick={() => window.location.href = '/visitantes'}
              >
                Ver todos visitantes
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
