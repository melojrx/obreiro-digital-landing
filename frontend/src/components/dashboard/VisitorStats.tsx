/**
 * Componente de Estatísticas de Visitantes para Dashboard
 * Mostra métricas detalhadas do sistema de QR Code
 */

import React, { useEffect, useState } from 'react';
import { Users, UserPlus, Heart, TrendingUp, QrCode, UserCheck } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Skeleton } from '../ui/skeleton';
import { getDashboardStats, type DashboardStats } from '../../services/visitorsService';

interface VisitorStatsProps {
  className?: string;
}

export const VisitorStats: React.FC<VisitorStatsProps> = ({ className }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getDashboardStats();
        setStats(data);
      } catch (err) {
        console.error('Erro ao buscar estatísticas de visitantes:', err);
        setError('Erro ao carregar estatísticas');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Visitantes</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardContent>
      </Card>
    );
  }

  if (error || !stats) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Visitantes</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">{error || 'Dados não disponíveis'}</p>
        </CardContent>
      </Card>
    );
  }

  const conversionRate = stats.conversion_rate || 0;
  const pendingFollowUpPercentage = stats.total_visitors > 0 
    ? (stats.pending_follow_up / stats.total_visitors) * 100 
    : 0;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex flex-col gap-2 text-base sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center space-x-2">
            <QrCode className="h-5 w-5" />
            <span>Visitantes via QR Code (este mês)</span>
          </div>
          <Badge variant="secondary" className="text-xs self-start sm:self-auto">
            Total: {stats.total_visitors}
          </Badge>
        </CardTitle>
        <CardDescription>
          Estatísticas do sistema de registro por QR Code do mês atual
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Métricas principais */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <UserPlus className="h-6 w-6 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-blue-700">{stats.this_month}</div>
            <div className="text-xs text-blue-600">Este mês</div>
          </div>
          
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <UserCheck className="h-6 w-6 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-green-700">{stats.converted_to_members}</div>
            <div className="text-xs text-green-600">Convertidos</div>
          </div>
        </div>

        {/* Taxa de conversão */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Taxa de Conversão</span>
            <span className="text-sm text-gray-600">{conversionRate.toFixed(1)}%</span>
          </div>
          <Progress value={conversionRate} className="h-2" />
          <p className="text-xs text-gray-500">
            {stats.converted_to_members} de {stats.total_visitors} visitantes se tornaram membros
          </p>
        </div>

        {/* Follow-up pendente */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium flex items-center space-x-1">
              <Heart className="h-4 w-4 text-orange-500" />
              <span>Aguardando Follow-up</span>
            </span>
            <span className="text-sm text-gray-600">{stats.pending_follow_up}</span>
          </div>
          <Progress value={pendingFollowUpPercentage} className="h-2" />
          <p className="text-xs text-gray-500">
            {stats.pending_follow_up} visitantes precisam de acompanhamento
          </p>
        </div>

        {/* Gráfico mensal simples */}
        {stats.monthly_data && stats.monthly_data.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center space-x-1">
              <TrendingUp className="h-4 w-4" />
              <span>Últimos meses</span>
            </h4>
            <div className="space-y-2">
              {stats.monthly_data.slice(-3).map((month, index) => {
                const maxVisitors = Math.max(...stats.monthly_data.map(m => m.visitors));
                const percentage = maxVisitors > 0 ? (month.visitors / maxVisitors) * 100 : 0;
                
                return (
                  <div key={`${month.month}-${index}`} className="flex items-center space-x-3">
                    <div className="text-xs text-gray-500 w-16">
                      {new Date(month.month + '-01').toLocaleDateString('pt-BR', { 
                        month: 'short' 
                      })}
                    </div>
                    <div className="flex-1">
                      <Progress value={percentage} className="h-1.5" />
                    </div>
                    <div className="text-xs font-medium w-8 text-right">
                      {month.visitors}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Ações rápidas */}
        <div className="pt-2 border-t">
          <div className="flex flex-col gap-2 text-xs sm:flex-row sm:items-center sm:justify-between">
            <button 
              className="text-blue-600 hover:text-blue-800 font-medium"
              onClick={() => window.location.href = '/visitantes'}
            >
              Ver todos visitantes →
            </button>
            <button 
              className="text-orange-600 hover:text-orange-800 font-medium"
              onClick={() => window.location.href = '/visitantes?status=pending'}
            >
              Follow-up pendente →
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
