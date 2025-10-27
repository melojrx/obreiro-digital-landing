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
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <UserPlus className="h-5 w-5" />
            <span>Visitantes Recentes</span>
          </div>
          <Badge variant="secondary" className="text-xs">
            {visitors.length}
          </Badge>
        </CardTitle>
        <CardDescription>
          Últimos visitantes registrados via QR Code
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {visitors.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-sm font-medium text-gray-900 mb-2">
              Nenhum visitante ainda
            </h3>
            <p className="text-sm text-gray-500">
              Os visitantes que se registrarem via QR Code aparecerão aqui
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {visitors.map((visitor) => (
                <div 
                  key={visitor.id} 
                  className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="text-xs font-medium">
                      {getInitials(visitor.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {visitor.full_name}
                      </h4>
                      <div className="flex items-center space-x-1 text-xs text-gray-500">
                        <Clock className="h-3 w-3" />
                        <span>{formatRelativeTime(visitor.created_at)}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-1">
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate">
                          {visitor.branch_name || visitor.city}
                        </span>
                        {visitor.first_visit && (
                          <Badge variant="outline" className="text-xs py-0">
                            1ª visita
                          </Badge>
                        )}
                      </div>
                      
                      <Badge 
                        className={`text-xs py-0 ${getStatusColor(
                          visitor.follow_up_status, 
                          visitor.converted_to_member
                        )}`}
                      >
                        {visitor.converted_to_member 
                          ? 'Membro' 
                          : formatFollowUpStatus(visitor.follow_up_status)
                        }
                      </Badge>
                    </div>
                    
                    {/* Indicadores especiais */}
                    <div className="flex items-center space-x-2 mt-2">
                      {visitor.wants_prayer && (
                        <div className="flex items-center space-x-1 text-xs text-red-600">
                          <Heart className="h-3 w-3" />
                          <span>Oração</span>
                        </div>
                      )}
                      {visitor.wants_growth_group && (
                        <div className="flex items-center space-x-1 text-xs text-blue-600">
                          <Users className="h-3 w-3" />
                          <span>Grupo</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="pt-4 border-t">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
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
