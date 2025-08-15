/**
 * Componente de Card de Estatísticas para Denominações
 * Reutiliza o padrão do StatsCard existente com extensões específicas
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Info,
  MapPin,
  Users,
  Building2,
  BarChart3,
  UserCheck,
  Activity
} from 'lucide-react';

// Tipos específicos para o componente
interface StatMetric {
  value: number;
  label: string;
  change?: number;
  target?: number;
  format?: 'number' | 'percentage' | 'currency';
}

interface DenominationStatsCardProps {
  // Dados principais
  title: string;
  subtitle?: string;
  metrics: StatMetric[];
  
  // Visualização
  icon?: React.ReactNode;
  variant?: 'default' | 'compact' | 'detailed' | 'geographic';
  size?: 'sm' | 'md' | 'lg';
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red';
  
  // Estados
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
  
  // Interação
  onClick?: () => void;
  onMetricClick?: (metric: StatMetric, index: number) => void;
  showTrends?: boolean;
  showProgress?: boolean;
  showTooltips?: boolean;
  
  // Customização
  className?: string;
  contentClassName?: string;
}

// Mapa de cores para ícones
const colorMap = {
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  purple: 'bg-purple-500',
  orange: 'bg-orange-500',
  red: 'bg-red-500',
};

// Ícones padrão por tipo de métrica
const getDefaultIcon = (title: string) => {
  const titleLower = title.toLowerCase();
  if (titleLower.includes('igreja') || titleLower.includes('church')) return <Building2 className="h-4 w-4" />;
  if (titleLower.includes('membro') || titleLower.includes('member')) return <Users className="h-4 w-4" />;
  if (titleLower.includes('visitante') || titleLower.includes('visitor')) return <UserCheck className="h-4 w-4" />;
  if (titleLower.includes('atividade') || titleLower.includes('activity')) return <Activity className="h-4 w-4" />;
  if (titleLower.includes('localização') || titleLower.includes('location')) return <MapPin className="h-4 w-4" />;
  return <BarChart3 className="h-4 w-4" />;
};

// Helper para formatar valores
const formatMetricValue = (value: number, format: StatMetric['format'] = 'number'): string => {
  switch (format) {
    case 'percentage':
      return `${value.toFixed(1)}%`;
    case 'currency':
      return new Intl.NumberFormat('pt-BR', { 
        style: 'currency', 
        currency: 'BRL',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);
    case 'number':
    default:
      return new Intl.NumberFormat('pt-BR').format(value);
  }
};

// Helper para obter cor da tendência
const getTrendColor = (change: number) => {
  if (change > 0) return 'text-green-600';
  if (change < 0) return 'text-red-600';
  return 'text-gray-500';
};

// Helper para ícone da tendência
const getTrendIcon = (change: number) => {
  if (change > 0) return <TrendingUp className="h-3 w-3" />;
  if (change < 0) return <TrendingDown className="h-3 w-3" />;
  return <Minus className="h-3 w-3" />;
};

export const DenominationStatsCard: React.FC<DenominationStatsCardProps> = ({
  title,
  subtitle,
  metrics,
  icon,
  variant = 'default',
  size = 'md',
  color = 'blue',
  isLoading = false,
  isError = false,
  errorMessage,
  onClick,
  onMetricClick,
  showTrends = true,
  showProgress = false,
  showTooltips = true,
  className,
  contentClassName,
}) => {
  // Calcular tamanhos baseados na prop size
  const sizeClasses = {
    sm: 'min-h-[120px]',
    md: 'min-h-[140px]',
    lg: 'min-h-[180px]',
  };

  // Estados de loading
  if (isLoading) {
    return (
      <Card className={cn('shadow-sm', sizeClasses[size], className)}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="space-y-1">
            <Skeleton className="h-4 w-24" />
            {subtitle && <Skeleton className="h-3 w-16" />}
          </div>
          <Skeleton className="h-8 w-8 rounded-full" />
        </CardHeader>
        <CardContent className="space-y-2">
          {metrics.map((_, index) => (
            <div key={index} className="space-y-1">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  // Estados de erro
  if (isError) {
    return (
      <Card className={cn('shadow-sm border-red-200 bg-red-50', sizeClasses[size], className)}>
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center text-red-600">
            <div className="text-sm font-medium">Erro ao carregar dados</div>
            {errorMessage && (
              <div className="text-xs text-red-500 mt-1">{errorMessage}</div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Renderização principal baseada na variante
  const renderContent = () => {
    switch (variant) {
      case 'compact':
        return renderCompactVariant();
      case 'detailed':
        return renderDetailedVariant();
      case 'geographic':
        return renderGeographicVariant();
      default:
        return renderDefaultVariant();
    }
  };

  // Variante padrão
  const renderDefaultVariant = () => (
    <>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
        <div className={cn('h-8 w-8 rounded-full flex items-center justify-center text-white', colorMap[color])}>
          {icon || getDefaultIcon(title)}
        </div>
      </CardHeader>
      <CardContent className={cn('space-y-2', contentClassName)}>
        {metrics.map((metric, index) => (
          <div
            key={index}
            className={cn(
              'flex items-center justify-between',
              onMetricClick && 'cursor-pointer hover:bg-gray-50 p-1 rounded'
            )}
            onClick={() => onMetricClick?.(metric, index)}
          >
            <div className="space-y-1">
              <div className="text-lg font-bold">
                {formatMetricValue(metric.value, metric.format)}
              </div>
              <div className="text-xs text-muted-foreground">
                {metric.label}
              </div>
            </div>
            
            {showTrends && metric.change !== undefined && (
              <div className={cn('flex items-center gap-1 text-xs', getTrendColor(metric.change))}>
                {getTrendIcon(metric.change)}
                <span>{Math.abs(metric.change).toFixed(1)}%</span>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </>
  );

  // Variante compacta
  const renderCompactVariant = () => (
    <>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className={cn('h-6 w-6 rounded-full flex items-center justify-center text-white text-xs', colorMap[color])}>
            {icon || getDefaultIcon(title)}
          </div>
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 gap-2">
          {metrics.slice(0, 2).map((metric, index) => (
            <div key={index} className="text-center">
              <div className="text-lg font-bold">
                {formatMetricValue(metric.value, metric.format)}
              </div>
              <div className="text-xs text-muted-foreground">
                {metric.label}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </>
  );

  // Variante detalhada
  const renderDetailedVariant = () => (
    <>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base font-semibold">{title}</CardTitle>
            {subtitle && (
              <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
          <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center text-white', colorMap[color])}>
            {icon || getDefaultIcon(title)}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {metrics.map((metric, index) => (
          <div key={index} className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xl font-bold">
                  {formatMetricValue(metric.value, metric.format)}
                </div>
                <div className="text-sm text-muted-foreground flex items-center gap-1">
                  {metric.label}
                  {showTooltips && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-3 w-3" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Detalhes sobre {metric.label}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              </div>
              
              {showTrends && metric.change !== undefined && (
                <Badge variant={metric.change >= 0 ? 'default' : 'destructive'}>
                  <div className="flex items-center gap-1">
                    {getTrendIcon(metric.change)}
                    {Math.abs(metric.change).toFixed(1)}%
                  </div>
                </Badge>
              )}
            </div>
            
            {showProgress && metric.target && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Progresso</span>
                  <span>{((metric.value / metric.target) * 100).toFixed(1)}%</span>
                </div>
                <Progress 
                  value={(metric.value / metric.target) * 100} 
                  className="h-2"
                />
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </>
  );

  // Variante geográfica
  const renderGeographicVariant = () => (
    <>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {metrics.map((metric, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
              <div className="text-sm font-medium">{metric.label}</div>
              <div className="text-right">
                <div className="text-sm font-bold">
                  {formatMetricValue(metric.value, metric.format)}
                </div>
                {metric.change !== undefined && (
                  <div className={cn('text-xs flex items-center gap-1', getTrendColor(metric.change))}>
                    {getTrendIcon(metric.change)}
                    {Math.abs(metric.change).toFixed(1)}%
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </>
  );

  return (
    <Card 
      className={cn(
        'shadow-sm transition-all hover:shadow-lg',
        onClick && 'cursor-pointer hover:-translate-y-1',
        sizeClasses[size],
        className
      )}
      onClick={onClick}
    >
      {renderContent()}
    </Card>
  );
};