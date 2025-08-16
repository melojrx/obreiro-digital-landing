import React from 'react';
import { 
  Church, 
  Users, 
  DollarSign, 
  Activity,
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  Target,
  MapPin,
  BarChart3,
  Award,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  FileText,
  Settings,
  UserPlus,
  Eye
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { useDenominationMockData, DenominationExecutiveData } from '@/hooks/useDenominationMockData';

const DenominationDashboardProfessional: React.FC = () => {
  const { data, isLoading } = useDenominationMockData();

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (!data) {
    return <div>Erro ao carregar dados</div>;
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header Executivo */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Denominacional</h1>
        <p className="text-gray-600">Visão executiva consolidada • Última atualização: agora</p>
      </div>

      {/* KPIs Executivos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <ExecutiveKPICard
          title="Total de Igrejas"
          value={data.overview.totalChurches}
          change={data.overview.churchesGrowth}
          icon={<Church className="h-6 w-6" />}
          color="bg-blue-500"
          format="number"
        />
        <ExecutiveKPICard
          title="Total de Membros"
          value={data.overview.totalMembers}
          change={data.overview.memberGrowth}
          icon={<Users className="h-6 w-6" />}
          color="bg-green-500"
          format="number"
        />
        <ExecutiveKPICard
          title="Receita Mensal"
          value={data.overview.monthlyRevenue}
          change={data.overview.revenueGrowth}
          icon={<DollarSign className="h-6 w-6" />}
          color="bg-purple-500"
          format="currency"
        />
        <HealthScoreCard
          score={data.overview.overallHealth}
          change={data.overview.growthRate}
        />
      </div>

      {/* Alertas Críticos */}
      <CriticalAlerts alerts={data.alerts} />

      {/* Grid Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance das Igrejas */}
        <div className="lg:col-span-2">
          <ChurchPerformanceRanking churches={data.churchPerformance} />
        </div>

        {/* Quick Actions */}
        <QuickActions />
      </div>

      {/* Análise Geográfica e Financeira */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GeographicAnalysis regions={data.geographicDistribution} />
        <FinancialAnalytics trends={data.financialTrends} />
      </div>

      {/* Insights Inteligentes */}
      <IntelligentInsights insights={data.insights} />
    </div>
  );
};

// Componente KPI Executivo
const ExecutiveKPICard: React.FC<{
  title: string;
  value: number;
  change: number;
  icon: React.ReactNode;
  color: string;
  format: 'number' | 'currency';
}> = ({ title, value, change, icon, color, format }) => {
  const isPositive = change >= 0;
  const formattedValue = format === 'currency' 
    ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
    : value.toLocaleString('pt-BR');

  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-3xl font-bold text-gray-900">{formattedValue}</p>
          </div>
          <div className={`p-3 rounded-lg ${color} text-white`}>
            {icon}
          </div>
        </div>
        
        {change !== 0 && (
          <div className="flex items-center mt-4 space-x-2">
            {isPositive ? (
              <ArrowUpRight className="h-4 w-4 text-green-600" />
            ) : (
              <ArrowDownRight className="h-4 w-4 text-red-600" />
            )}
            <span className={`text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {Math.abs(change)}% vs mês anterior
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Health Score Card
const HealthScoreCard: React.FC<{ score: number; change: number }> = ({ score, change }) => {
  const getHealthColor = (score: number) => {
    if (score >= 85) return 'text-green-600 border-green-200 bg-green-50';
    if (score >= 70) return 'text-yellow-600 border-yellow-200 bg-yellow-50';
    return 'text-red-600 border-red-200 bg-red-50';
  };

  return (
    <Card className={`border-2 ${getHealthColor(score)}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium">Saúde Geral</p>
            <p className="text-3xl font-bold">{score}%</p>
          </div>
          <div className="p-3 rounded-lg bg-white">
            <Activity className="h-6 w-6" />
          </div>
        </div>
        
        <div className="mt-4">
          <Progress value={score} className="h-2" />
        </div>
        
        <div className="flex items-center mt-4 space-x-2">
          <TrendingUp className="h-4 w-4 text-green-600" />
          <span className="text-sm font-medium text-green-600">
            +{change}% vs mês anterior
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

// Alertas Críticos
const CriticalAlerts: React.FC<{ alerts: DenominationExecutiveData['alerts'] }> = ({ alerts }) => {
  if (alerts.length === 0) return null;

  const criticalAlerts = alerts.filter(alert => alert.type === 'critical');
  const warningAlerts = alerts.filter(alert => alert.type === 'warning');

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-900">Alertas Críticos</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {alerts.map((alert) => (
          <Alert 
            key={alert.id} 
            variant={alert.type === 'critical' ? 'destructive' : 'default'}
            className="cursor-pointer hover:shadow-md transition-shadow"
          >
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle className="flex items-center justify-between">
              {alert.title}
              <Badge variant={alert.priority === 'high' ? 'destructive' : 'secondary'}>
                {alert.priority === 'high' ? 'Alta' : alert.priority === 'medium' ? 'Média' : 'Baixa'}
              </Badge>
            </AlertTitle>
            <AlertDescription>
              {alert.description}
              {alert.action && (
                <div className="mt-2">
                  <Button variant="outline" size="sm">
                    {alert.action}
                  </Button>
                </div>
              )}
            </AlertDescription>
          </Alert>
        ))}
      </div>
    </div>
  );
};

// Ranking de Performance das Igrejas
const ChurchPerformanceRanking: React.FC<{ churches: DenominationExecutiveData['churchPerformance'] }> = ({ churches }) => {
  const getStatusBadge = (status: string) => {
    const variants = {
      excellent: 'bg-green-100 text-green-800',
      good: 'bg-blue-100 text-blue-800',
      average: 'bg-yellow-100 text-yellow-800',
      poor: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800'
    };
    
    const labels = {
      excellent: 'Excelente',
      good: 'Bom',
      average: 'Médio',
      poor: 'Baixo',
      critical: 'Crítico'
    };

    return (
      <Badge className={variants[status as keyof typeof variants]}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5" />
          Ranking de Performance das Igrejas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {churches.map((church) => (
            <div 
              key={church.id} 
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <div className="flex items-center space-x-4">
                <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full font-bold">
                  {church.rank}
                </div>
                <div>
                  <h4 className="font-semibold">{church.name}</h4>
                  <p className="text-sm text-gray-600">{church.city}, {church.state}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-6">
                <div className="text-center">
                  <p className="text-sm font-medium">{church.members}</p>
                  <p className="text-xs text-gray-500">Membros</p>
                </div>
                
                <div className="text-center">
                  <p className="text-sm font-medium">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(church.monthlyRevenue)}
                  </p>
                  <p className="text-xs text-gray-500">Receita</p>
                </div>
                
                <div className="text-center">
                  <p className={`text-sm font-medium ${church.growthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {church.growthRate > 0 ? '+' : ''}{church.growthRate}%
                  </p>
                  <p className="text-xs text-gray-500">Crescimento</p>
                </div>
                
                <div className="text-center">
                  <p className="text-sm font-medium">{church.healthScore}%</p>
                  <p className="text-xs text-gray-500">Saúde</p>
                  <Progress value={church.healthScore} className="w-16 h-1 mt-1" />
                </div>
                
                {getStatusBadge(church.status)}
                
                <Button variant="ghost" size="sm">
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// Quick Actions
const QuickActions: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Ações Rápidas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button className="w-full justify-start" variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Nova Igreja
        </Button>
        <Button className="w-full justify-start" variant="outline">
          <FileText className="h-4 w-4 mr-2" />
          Relatórios
        </Button>
        <Button className="w-full justify-start" variant="outline">
          <UserPlus className="h-4 w-4 mr-2" />
          Gestão de Líderes
        </Button>
        <Button className="w-full justify-start" variant="outline">
          <Settings className="h-4 w-4 mr-2" />
          Configurações
        </Button>
        <Button className="w-full justify-start" variant="outline">
          <BarChart3 className="h-4 w-4 mr-2" />
          Exportar Excel
        </Button>
      </CardContent>
    </Card>
  );
};

// Análise Geográfica
const GeographicAnalysis: React.FC<{ regions: DenominationExecutiveData['geographicDistribution'] }> = ({ regions }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Distribuição Geográfica
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Gráfico Pizza */}
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={regions}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="members"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {regions.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    `${value.toLocaleString()} membros`, 
                    'Membros'
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Métricas por Região */}
          <div className="space-y-4">
            {regions.map((region) => (
              <div key={region.region} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{region.region}</span>
                  <span className="text-sm text-gray-600">
                    {region.churches} igrejas • {region.members.toLocaleString()} membros
                  </span>
                </div>
                <div className="flex items-center space-x-4">
                  <Progress value={region.penetration} className="flex-1" />
                  <span className="text-sm font-medium">{region.penetration}%</span>
                </div>
                <div className="flex justify-between text-xs text-gray-600">
                  <span>R$ {region.revenuePerMember}/membro</span>
                  <span className={region.growthRate >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {region.growthRate > 0 ? '+' : ''}{region.growthRate}% crescimento
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Analytics Financeiro
const FinancialAnalytics: React.FC<{ trends: DenominationExecutiveData['financialTrends'] }> = ({ trends }) => {
  const currentMonth = trends[trends.length - 1];
  const previousMonth = trends[trends.length - 2];
  const revenueGrowth = ((currentMonth.revenue - previousMonth.revenue) / previousMonth.revenue) * 100;
  const margin = (currentMonth.netResult / currentMonth.revenue) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Analytics Financeiro
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Métricas Resumidas */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">
                +{revenueGrowth.toFixed(1)}%
              </p>
              <p className="text-sm text-green-600">Crescimento Mensal</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">
                {margin.toFixed(1)}%
              </p>
              <p className="text-sm text-blue-600">Margem de Resultado</p>
            </div>
          </div>

          {/* Gráfico de Tendências */}
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis 
                  tickFormatter={(value) => 
                    new Intl.NumberFormat('pt-BR', { 
                      style: 'currency', 
                      currency: 'BRL',
                      notation: 'compact'
                    }).format(value)
                  }
                />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value),
                    name === 'revenue' ? 'Receita' : name === 'expenses' ? 'Despesas' : 'Resultado'
                  ]}
                />
                <Legend 
                  formatter={(value) => 
                    value === 'revenue' ? 'Receita' : value === 'expenses' ? 'Despesas' : 'Resultado'
                  }
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stackId="1" 
                  stroke="#3B82F6" 
                  fill="#3B82F6" 
                  fillOpacity={0.3}
                />
                <Area 
                  type="monotone" 
                  dataKey="expenses" 
                  stackId="2" 
                  stroke="#EF4444" 
                  fill="#EF4444" 
                  fillOpacity={0.3}
                />
                <Line 
                  type="monotone" 
                  dataKey="netResult" 
                  stroke="#10B981" 
                  strokeWidth={3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Insights Inteligentes
const IntelligentInsights: React.FC<{ insights: DenominationExecutiveData['insights'] }> = ({ insights }) => {
  const getInsightIcon = (iconName: string) => {
    const icons = {
      TrendingUp: <TrendingUp className="h-5 w-5" />,
      AlertTriangle: <AlertTriangle className="h-5 w-5" />,
      Target: <Target className="h-5 w-5" />,
      DollarSign: <DollarSign className="h-5 w-5" />
    };
    return icons[iconName as keyof typeof icons] || <Activity className="h-5 w-5" />;
  };

  const getInsightColor = (type: string) => {
    const colors = {
      opportunity: 'border-green-200 bg-green-50',
      risk: 'border-red-200 bg-red-50',
      achievement: 'border-blue-200 bg-blue-50',
      recommendation: 'border-yellow-200 bg-yellow-50'
    };
    return colors[type as keyof typeof colors] || 'border-gray-200 bg-gray-50';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Insights Inteligentes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {insights.map((insight) => (
            <div 
              key={insight.id} 
              className={`p-4 border rounded-lg ${getInsightColor(insight.type)}`}
            >
              <div className="flex items-start space-x-3">
                <div className="p-2 rounded-lg bg-white">
                  {getInsightIcon(insight.icon)}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{insight.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">{insight.description}</p>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-medium bg-white px-2 py-1 rounded">
                        {insight.confidence}% confiança
                      </span>
                      <Badge variant={insight.impact === 'high' ? 'destructive' : insight.impact === 'medium' ? 'default' : 'secondary'}>
                        {insight.impact === 'high' ? 'Alto' : insight.impact === 'medium' ? 'Médio' : 'Baixo'} impacto
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// Skeleton de Loading
const DashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 p-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardContent className="p-6">
            <Skeleton className="h-96 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-96 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DenominationDashboardProfessional;