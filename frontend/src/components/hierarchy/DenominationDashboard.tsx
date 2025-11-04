/**
 * Componente Dashboard Principal para Administradores de Denominação
 * Dashboard consolidado com estatísticas, gráficos e gestão
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
  Building2,
  Users,
  UserCheck,
  Activity,
  TrendingUp,
  MapPin,
  Calendar,
  Download,
  Plus,
  Settings,
  BarChart3,
  PieChart,
} from 'lucide-react';

// Hooks
import { useDenominations } from '@/hooks/useDenominations';
import { useDenominationKPIs } from '@/hooks/useDenominationStats';
import { usePermissions } from '@/hooks/usePermissions';

// Componentes
import { DenominationStatsCard } from './DenominationStatsCard';
import { ChurchCard } from './ChurchCard';

// Tipos
import { DenominationDetails, ChurchDetails, MonthlyTrend, GeographicalData } from '@/types/hierarchy';

interface DenominationDashboardProps {
  denominationId: number;
  className?: string;
}

// Componente de gráfico simples (seria substituído por Chart.js ou similar)
const SimpleChart: React.FC<{
  data: MonthlyTrend[];
  metric: keyof MonthlyTrend;
  title: string;
  color: string;
}> = ({ data, metric, title, color }) => {
  const maxValue = Math.max(...data.map(d => d[metric] as number));
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-1 h-32">
          {data.map((item, index) => {
            const value = item[metric] as number;
            const height = (value / maxValue) * 100;
            return (
              <div
                key={index}
                className="flex-1 flex flex-col items-center"
              >
                <div
                  className={cn('w-full rounded-t transition-all', color)}
                  style={{ height: `${height}%`, minHeight: '4px' }}
                />
                <div className="text-xs text-muted-foreground mt-1">
                  {new Date(item.month).toLocaleDateString('pt-BR', { month: 'short' })}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

// Componente de mapa de distribuição geográfica simplificado
const GeographicalDistribution: React.FC<{ data: GeographicalData[] }> = ({ data }) => {
  const topStates = data
    .sort((a, b) => b.churches_count - a.churches_count)
    .slice(0, 5);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          Distribuição Geográfica
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {topStates.map((state, index) => (
          <div key={state.state} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="w-8 h-6 justify-center">
                {index + 1}
              </Badge>
              <span className="text-sm font-medium">{state.state}</span>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold">{state.churches_count} igrejas</div>
              <div className="text-xs text-muted-foreground">{state.members_count} membros</div>
            </div>
          </div>
        ))}
        
        {data.length > 5 && (
          <div className="text-center pt-2 border-t">
            <Button variant="ghost" size="sm">
              Ver todos os {data.length} estados
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Componente de igrejas recentes
const RecentChurches: React.FC<{ churches: ChurchDetails[] }> = ({ churches }) => {
  const recentChurches = churches
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 3);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">Igrejas Recentes</CardTitle>
        <Button variant="ghost" size="sm">
          Ver todas
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {recentChurches.map((church) => (
          <div key={church.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
            <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Building2 className="h-4 w-4 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm truncate">{church.name}</div>
              <div className="text-xs text-muted-foreground">{church.city}, {church.state}</div>
            </div>
            <div className="text-xs text-muted-foreground">
              {new Date(church.created_at).toLocaleDateString('pt-BR')}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export const DenominationDashboard: React.FC<DenominationDashboardProps> = ({
  denominationId,
  className,
}) => {
  const permissions = usePermissions();
  
  const {
    currentDenomination,
    denominationChurches,
    isLoadingStats,
    loadDenominationDetails,
    loadDenominationChurches,
  } = useDenominations();

  const { kpis, isLoading, error, rawStats } = useDenominationKPIs();

  const [selectedPeriod, setSelectedPeriod] = useState('last_3_months');
  const [activeTab, setActiveTab] = useState('overview');

  // Carregar dados iniciais
  useEffect(() => {
    if (denominationId) {
      loadDenominationDetails(denominationId);
      loadDenominationChurches(denominationId, undefined, 1);
    }
  }, [denominationId, loadDenominationDetails, loadDenominationChurches]);

  // Handlers
  const handleRefresh = async () => {
    window.location.reload(); // Força reload dos dados
  };

  const handleExportReport = async (format: 'xlsx' | 'pdf') => {
    console.log(`Exportando relatório em ${format}...`);
  };

  // Preparar dados para cards de estatísticas usando dados reais
  const statsCards = [
    {
      title: 'Total de Igrejas',
      metrics: [
        {
          value: kpis.totalChurches,
          label: 'Igrejas vinculadas',
          change: kpis.churchesThisYear > 0 ? (kpis.churchesThisYear / Math.max(1, kpis.totalChurches - kpis.churchesThisYear)) * 100 : 0,
          format: 'number' as const,
        },
      ],
      icon: <Building2 className="h-4 w-4" />,
      color: 'blue' as const,
    },
    {
      title: 'Total de Membros',
      metrics: [
        {
          value: kpis.totalMembers,
          label: 'Membros somados',
          change: kpis.membersGrowth > 0 ? (kpis.membersGrowth / Math.max(1, kpis.totalMembers - kpis.membersGrowth)) * 100 : 0,
          format: 'number' as const,
        },
      ],
      icon: <Users className="h-4 w-4" />,
      color: 'green' as const,
    },
    {
      title: 'Total de Congregações',
      metrics: [
        {
          value: kpis.totalBranches,
          label: 'Congregações cadastradas',
          change: 0, // Calcular quando tiver dados de crescimento
          format: 'number' as const,
        },
      ],
      icon: <Building2 className="h-4 w-4" />,
      color: 'indigo' as const,
    },
    {
      title: 'Total de Visitantes',
      metrics: [
        {
          value: kpis.totalVisitors,
          label: 'Visitantes registrados',
          change: kpis.visitorsGrowth > 0 ? (kpis.visitorsGrowth / Math.max(1, kpis.totalVisitors - kpis.visitorsGrowth)) * 100 : 0,
          format: 'number' as const,
        },
      ],
      icon: <UserCheck className="h-4 w-4" />,
      color: 'purple' as const,
    },
  ];

  // Mostrar loading se dados estão carregando
  if (isLoading) {
    return (
      <div className={cn('space-y-6', className)}>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Carregando estatísticas...</p>
        </div>
      </div>
    );
  }

  // Mostrar erro se houve falha no carregamento
  if (error) {
    return (
      <div className={cn('space-y-6', className)}>
        <Card className="p-6 text-center">
          <div className="text-red-500 mb-2">
            <Building2 className="h-8 w-8 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Erro ao carregar dados</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Não foi possível carregar as estatísticas da denominação.
          </p>
          <Button onClick={handleRefresh} variant="outline">
            Tentar novamente
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {currentDenomination?.name || 'Dashboard da Denominação'}
          </h1>
          {currentDenomination?.short_name && (
            <p className="text-muted-foreground">{currentDenomination.short_name}</p>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last_month">Último mês</SelectItem>
              <SelectItem value="last_3_months">Últimos 3 meses</SelectItem>
              <SelectItem value="last_6_months">Últimos 6 meses</SelectItem>
              <SelectItem value="last_year">Último ano</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" onClick={handleRefresh}>
            <TrendingUp className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          
          <Button
            variant="outline"
            onClick={() => handleExportReport('xlsx')}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          
          {permissions.canManageBranches && (
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Igreja
            </Button>
          )}
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((card, index) => (
          <DenominationStatsCard
            key={index}
            title={card.title}
            metrics={card.metrics}
            icon={card.icon}
            color={card.color}
            isLoading={isLoadingStats}
            showTrends={true}
          />
        ))}
      </div>

      {/* Tabs principais */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="churches">Igrejas</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="management">Gestão</TabsTrigger>
        </TabsList>

        {/* Tab: Visão Geral */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 space-y-4">
              {/* Gráficos de tendência */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Crescimento de Membros
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{kpis.membersGrowth > 0 ? '+' : ''}{kpis.membersGrowth}</div>
                    <p className="text-xs text-muted-foreground">Novos membros este mês</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <UserCheck className="h-4 w-4" />
                      Crescimento de Visitantes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{kpis.visitorsGrowth > 0 ? '+' : ''}{kpis.visitorsGrowth}</div>
                    <p className="text-xs text-muted-foreground">Novos visitantes este mês</p>
                  </CardContent>
                </Card>
              </div>
              
              {/* Atividades e Performance */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Resumo de Atividades
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total de Atividades</span>
                    <span className="font-medium">{kpis.totalActivities}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Novas Igrejas (este ano)</span>
                    <span className="font-medium">{kpis.churchesThisYear}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="space-y-4">
              {/* Igrejas recentes */}
              {denominationChurches && (
                <RecentChurches churches={denominationChurches.results} />
              )}
              
              {/* Métricas consolidadas */}
              {rawStats && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Métricas Consolidadas</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Taxa de Retenção</span>
                      <Badge variant="default">
                        {kpis.memberRetentionRate.toFixed(1)}%
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Taxa de Conversão</span>
                      <Badge variant="secondary">
                        {kpis.visitorConversionRate.toFixed(1)}%
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Frequência Média</span>
                      <Badge variant="outline">
                        {kpis.averageAttendance.toLocaleString()} pessoas
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Igrejas Ativas</span>
                      <Badge variant="default">
                        {kpis.activeChurchesPercentage.toFixed(1)}%
                      </Badge>
                    </div>
                    {kpis.totalAlerts > 0 && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Alertas</span>
                        <Badge variant="destructive">
                          {kpis.totalAlerts} pendentes
                        </Badge>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Tab: Igrejas */}
        <TabsContent value="churches" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Igrejas da Denominação</h3>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Filtros
              </Button>
              {permissions.canManageBranches && (
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Igreja
                </Button>
              )}
            </div>
          </div>
          
          {denominationChurches && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {denominationChurches.results.map((church) => (
                <ChurchCard
                  key={church.id}
                  church={church}
                  variant="default"
                  showStats={true}
                  showActions={true}
                  canEdit={permissions.canManageChurch}
                  canManage={permissions.canManageBranches}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tab: Analytics */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Análise de Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  Análises detalhadas de performance seriam exibidas aqui.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-4 w-4" />
                  Distribuição por Região
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  Gráficos de distribuição regional seriam exibidos aqui.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab: Gestão */}
        <TabsContent value="management" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Ações Administrativas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Nova Igreja
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Users className="h-4 w-4 mr-2" />
                  Gerenciar Administradores
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Settings className="h-4 w-4 mr-2" />
                  Configurações da Denominação
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Download className="h-4 w-4 mr-2" />
                  Relatórios Consolidados
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Hierarquia Organizacional</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Aqui seria exibido o HierarchyView */}
                <p className="text-muted-foreground text-sm">
                  Visualização da hierarquia organizacional seria exibida aqui.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};