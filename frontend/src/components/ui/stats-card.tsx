import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardContent } from './card';
import { Badge } from './badge';
import { Skeleton } from './skeleton';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  /**
   * Título/label da métrica
   */
  title: string;
  
  /**
   * Valor principal da métrica
   */
  value: string | number;
  
  /**
   * Ícone da métrica
   */
  icon: LucideIcon;
  
  /**
   * Cor do ícone e outros elementos
   */
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'gray' | 'indigo' | 'pink' | 'orange';
  
  /**
   * Variação/mudança da métrica (percentual)
   */
  change?: number;
  
  /**
   * Período da variação (ex: "vs mês anterior")
   */
  changePeriod?: string;
  
  /**
   * Descrição adicional
   */
  description?: string;
  
  /**
   * Valor secundário (ex: meta, limite, etc.)
   */
  secondaryValue?: {
    label: string;
    value: string | number;
  };
  
  /**
   * Se está em estado de loading
   */
  isLoading?: boolean;
  
  /**
   * Callback quando clicado
   */
  onClick?: () => void;
  
  /**
   * Classe CSS adicional
   */
  className?: string;
  
  /**
   * Tamanho do card
   */
  size?: 'sm' | 'md' | 'lg';
  
  /**
   * Layout do card
   */
  layout?: 'horizontal' | 'vertical';
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon: Icon,
  color = 'blue',
  change,
  changePeriod,
  description,
  secondaryValue,
  isLoading = false,
  onClick,
  className,
  size = 'md',
  layout = 'horizontal',
}) => {
  const getColorClasses = (color: string) => {
    const colorMap = {
      blue: 'text-blue-600 bg-blue-100',
      green: 'text-green-600 bg-green-100',
      yellow: 'text-yellow-600 bg-yellow-100',
      red: 'text-red-600 bg-red-100',
      purple: 'text-purple-600 bg-purple-100',
      gray: 'text-gray-600 bg-gray-100',
      indigo: 'text-indigo-600 bg-indigo-100',
      pink: 'text-pink-600 bg-pink-100',
      orange: 'text-orange-600 bg-orange-100',
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return {
          card: 'p-4',
          icon: 'h-6 w-6 p-1',
          iconContainer: 'w-8 h-8',
          value: 'text-lg',
          title: 'text-sm',
          description: 'text-xs',
        };
      case 'lg':
        return {
          card: 'p-6',
          icon: 'h-10 w-10 p-2',
          iconContainer: 'w-12 h-12',
          value: 'text-3xl',
          title: 'text-base',
          description: 'text-sm',
        };
      default:
        return {
          card: 'p-4',
          icon: 'h-8 w-8 p-1.5',
          iconContainer: 'w-10 h-10',
          value: 'text-2xl',
          title: 'text-sm',
          description: 'text-sm',
        };
    }
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return TrendingUp;
    if (change < 0) return TrendingDown;
    return Minus;
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600 bg-green-50';
    if (change < 0) return 'text-red-600 bg-red-50';
    return 'text-gray-600 bg-gray-50';
  };

  const sizeClasses = getSizeClasses();
  const colorClasses = getColorClasses(color);

  if (isLoading) {
    return (
      <Card className={cn(className)}>
        <CardContent className={sizeClasses.card}>
          <div className={cn(
            layout === 'horizontal' ? 'flex items-center' : 'space-y-3'
          )}>
            <Skeleton className={cn(sizeClasses.iconContainer, 'rounded-lg')} />
            <div className={cn(
              layout === 'horizontal' ? 'ml-4 flex-1' : 'space-y-2'
            )}>
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatValue = (val: string | number) => {
    if (typeof val === 'number') {
      return val.toLocaleString('pt-BR');
    }
    return val;
  };

  return (
    <Card 
      className={cn(
        onClick && 'cursor-pointer hover:shadow-md transition-shadow',
        className
      )}
      onClick={onClick}
    >
      <CardContent className={sizeClasses.card}>
        <div className={cn(
          layout === 'horizontal' 
            ? 'flex items-center' 
            : 'flex flex-col items-center text-center space-y-3'
        )}>
          {/* Ícone */}
          <div className={cn(
            sizeClasses.iconContainer,
            'rounded-lg flex items-center justify-center',
            colorClasses
          )}>
            <Icon className={sizeClasses.icon} />
          </div>

          {/* Conteúdo */}
          <div className={cn(
            layout === 'horizontal' ? 'ml-4 flex-1' : 'w-full'
          )}>
            {/* Título */}
            <p className={cn(
              'font-medium text-gray-600 mb-1',
              sizeClasses.title
            )}>
              {title}
            </p>

            {/* Valor principal */}
            <p className={cn(
              'font-bold text-gray-900 mb-2',
              sizeClasses.value
            )}>
              {formatValue(value)}
            </p>

            {/* Valor secundário */}
            {secondaryValue && (
              <p className="text-xs text-gray-500 mb-2">
                {secondaryValue.label}: {formatValue(secondaryValue.value)}
              </p>
            )}

            {/* Descrição */}
            {description && (
              <p className={cn(
                'text-gray-500 mb-2',
                sizeClasses.description
              )}>
                {description}
              </p>
            )}

            {/* Variação */}
            {change !== undefined && (
              <div className="flex items-center gap-2">
                <Badge 
                  variant="secondary"
                  className={cn(
                    'text-xs px-2 py-1',
                    getChangeColor(change)
                  )}
                >
                  <div className="flex items-center gap-1">
                    {React.createElement(getChangeIcon(change), { 
                      className: 'h-3 w-3' 
                    })}
                    {Math.abs(change).toFixed(1)}%
                  </div>
                </Badge>
                {changePeriod && (
                  <span className="text-xs text-gray-500">
                    {changePeriod}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Componente para grade de cards de estatísticas
 */
interface StatsGridProps {
  stats: Omit<StatsCardProps, 'className'>[];
  columns?: 1 | 2 | 3 | 4;
  className?: string;
}

export const StatsGrid: React.FC<StatsGridProps> = ({
  stats,
  columns = 4,
  className,
}) => {
  const getGridColumns = () => {
    switch (columns) {
      case 1: return 'grid-cols-1';
      case 2: return 'grid-cols-1 md:grid-cols-2';
      case 3: return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
      case 4: return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4';
      default: return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4';
    }
  };

  return (
    <div className={cn(
      'grid gap-4',
      getGridColumns(),
      className
    )}>
      {stats.map((stat, index) => (
        <StatsCard key={index} {...stat} />
      ))}
    </div>
  );
};

/**
 * Card de estatística com comparação
 */
interface ComparisonStatsCardProps extends Omit<StatsCardProps, 'change' | 'changePeriod'> {
  currentPeriod: {
    label: string;
    value: string | number;
  };
  previousPeriod: {
    label: string;
    value: string | number;
  };
}

export const ComparisonStatsCard: React.FC<ComparisonStatsCardProps> = ({
  currentPeriod,
  previousPeriod,
  ...props
}) => {
  const currentVal = typeof currentPeriod.value === 'string' 
    ? parseFloat(currentPeriod.value.replace(/[^\d.-]/g, '')) 
    : currentPeriod.value;
  
  const previousVal = typeof previousPeriod.value === 'string'
    ? parseFloat(previousPeriod.value.replace(/[^\d.-]/g, ''))
    : previousPeriod.value;

  const change = previousVal !== 0 
    ? ((currentVal - previousVal) / previousVal) * 100 
    : 0;

  return (
    <StatsCard
      {...props}
      value={currentPeriod.value}
      change={change}
      changePeriod={`vs ${previousPeriod.label}`}
      secondaryValue={{
        label: previousPeriod.label,
        value: previousPeriod.value,
      }}
    />
  );
};

export default StatsCard;