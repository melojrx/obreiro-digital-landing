/**
 * Dashboard Específico para Administradores de Denominação
 * Dashboard com métricas, gráficos e funcionalidades hierárquicas
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { cn } from '@/lib/utils';
import {
  TreePine,
  Building2,
  Home,
  Users,
  TrendingUp,
  TrendingDown,
  MapPin,
  UserPlus,
  DollarSign,
  Calendar,
  AlertTriangle,
  Plus,
  RefreshCw,
  BarChart3,
  Eye,
  Activity,
} from 'lucide-react';

// Componentes do módulo hierárquico
import {
  CreateChurchForm,
  useDenominations,
  useHierarchy,
  HierarchyProvider,
} from '@/components/hierarchy';

// Hooks
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { toast } from '@/hooks/use-toast';

// Tipos
import { ChurchDetails } from '@/types/hierarchy';

// Dados mockados para demonstração
const mockMetrics = {
  totalChurches: 45,
  totalBranches: 128,
  totalMembers: 12567,
  totalVisitors: 387,
  monthlyGrowth: 8.5,
  monthlyRevenue: 89750.00,
  previousMonthMembers: 11890,
  previousMonthVisitors: 312,
};

const mockChurchGrowthData = [
  { month: 'Jan', igrejas: 38, membros: 10234 },
  { month: 'Fev', igrejas: 40, membros: 10789 },
  { month: 'Mar', igrejas: 42, membros: 11245 },
  { month: 'Abr', igrejas: 43, membros: 11567 },
  { month: 'Mai', igrejas: 44, membros: 11890 },
  { month: 'Jun', igrejas: 45, membros: 12567 },
];

const mockGeographicData = [
  { state: 'SP', churches: 18, color: '#2563eb' },
  { state: 'RJ', churches: 12, color: '#059669' },
  { state: 'MG', churches: 8, color: '#dc2626' },
  { state: 'RS', churches: 4, color: '#7c3aed' },
  { state: 'Outros', churches: 3, color: '#ea580c' },
];

const mockTopChurches = [
  { name: 'Igreja Central - São Paulo', members: 1234, pastor: 'Pr. João Silva', growth: 12.5 },
  { name: 'Igreja Esperança - Rio de Janeiro', members: 987, pastor: 'Pr. Maria Santos', growth: 8.3 },
  { name: 'Igreja Vida Nova - Belo Horizonte', members: 756, pastor: 'Pr. Pedro Costa', growth: 15.2 },
  { name: 'Igreja Fé e Esperança - Porto Alegre', members: 623, pastor: 'Pr. Ana Oliveira', growth: -2.1 },
  { name: 'Igreja Renovação - Curitiba', members: 543, pastor: 'Pr. Carlos Lima', growth: 6.7 },
];

const mockRecentChurches = [
  { id: 1, name: 'Igreja Nova Aliança', city: 'Campinas, SP', createdAt: '2024-12-15', status: 'active' },
  { id: 2, name: 'Igreja Refúgio', city: 'Santos, SP', createdAt: '2024-12-10', status: 'pending' },
  { id: 3, name: 'Igreja Comunhão', city: 'Niterói, RJ', createdAt: '2024-12-05', status: 'active' },
];

const mockAlerts = [
  { id: 1, type: 'warning', message: 'Igreja São João - Relatório mensal pendente há 15 dias' },
  { id: 2, type: 'info', message: '3 igrejas precisam atualizar dados de contato' },
  { id: 3, type: 'success', message: 'Meta de crescimento mensal atingida!' },
];

const DenominationDashboardPageContent: React.FC = () => {
  const { denominationId } = useParams<{ denominationId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const permissions = usePermissions();
  
  const {
    currentDenomination,
    denominationChurches,
    loadDenominationDetails,
    loadDenominationChurches,
  } = useDenominations();

  const {
    navigateToDenomination,
    navigateToChurch,
  } = useHierarchy();

  // Estados locais
  const [showCreateChurch, setShowCreateChurch] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('6months');
  const [isLoading, setIsLoading] = useState(true);

  // Carregar dados iniciais
  useEffect(() => {
    const id = parseInt(denominationId || '0');
    if (id && id > 0) {
      loadDenominationDetails(id);
      navigateToDenomination(id);
      // Simular carregamento
      setTimeout(() => setIsLoading(false), 1500);
    } else {
      navigate('/dashboard');
    }
  }, [denominationId, loadDenominationDetails, navigateToDenomination, navigate]);

  // Verificar permissões
  useEffect(() => {
    if (!permissions.canViewDashboard && !permissions.isAdmin) {
      toast({
        title: "Acesso negado",
        description: "Você não tem permissão para acessar esta página.",
        variant: "destructive",
      });
      navigate('/dashboard');
    }
  }, [permissions, navigate]);

  // Handlers
  const handleCreateChurchSuccess = (newChurch: ChurchDetails) => {
    setShowCreateChurch(false);
    
    // Recarregar lista de igrejas
    if (currentDenomination) {
      loadDenominationChurches(currentDenomination.id);
    }
    
    toast({
      title: "Igreja criada!",
      description: `A igreja "${newChurch.name}" foi criada com sucesso.`,
    });
  };

  const handleRefreshData = () => {
    setIsLoading(true);
    if (currentDenomination) {
      loadDenominationDetails(currentDenomination.id);
      loadDenominationChurches(currentDenomination.id);
    }
    // Simular refresh
    setTimeout(() => setIsLoading(false), 1000);
  };

  if (!denominationId || !currentDenomination) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Carregando denominação...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb de navegação */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
              <Home className="h-4 w-4" />
              Dashboard
            </Button>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="flex items-center gap-2">
              <TreePine className="h-4 w-4" />
              Dashboard da Denominação
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header específico */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <TreePine className="h-8 w-8 text-blue-600" />
            Dashboard da Denominação
          </h1>
          <p className="text-lg text-muted-foreground mt-1">
            {currentDenomination.name} - Visão geral e métricas
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1month">1 mês</SelectItem>
              <SelectItem value="3months">3 meses</SelectItem>
              <SelectItem value="6months">6 meses</SelectItem>
              <SelectItem value="1year">1 ano</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" onClick={handleRefreshData} disabled={isLoading}>
            <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
            Atualizar
          </Button>
          
          {permissions.canManageChurch && (
            <Button onClick={() => setShowCreateChurch(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Igreja
            </Button>
          )}
        </div>
      </div>

      {/* Cards de métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Igrejas</CardTitle>
            <Building2 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-blue-600">{mockMetrics.totalChurches}</div>
            )}
            <p className="text-xs text-muted-foreground">
              Igrejas ativas na rede
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Filiais Consolidadas</CardTitle>
            <Building2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-green-600">{mockMetrics.totalBranches}</div>
            )}
            <p className="text-xs text-muted-foreground">
              Total de congregações
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Membros Ativos</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold text-purple-600">{mockMetrics.totalMembers.toLocaleString()}</div>
            )}
            <p className="text-xs text-muted-foreground">
              +{(mockMetrics.totalMembers - mockMetrics.previousMonthMembers).toLocaleString()} este mês
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Visitantes do Mês</CardTitle>
            <UserPlus className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-orange-600">{mockMetrics.totalVisitors}</div>
            )}
            <p className="text-xs text-muted-foreground">
              +{mockMetrics.totalVisitors - mockMetrics.previousMonthVisitors} vs mês anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Crescimento</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-green-600">+{mockMetrics.monthlyGrowth}%</div>
            )}
            <p className="text-xs text-muted-foreground">
              Taxa mensal
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contribuições</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold text-green-600">
                {mockMetrics.monthlyRevenue.toLocaleString('pt-BR', { 
                  style: 'currency', 
                  currency: 'BRL',
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0
                })}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Total do mês
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos e Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de crescimento */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Crescimento de Igrejas e Membros
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ChartContainer
                config={{
                  igrejas: {
                    label: "Igrejas",
                    color: "#2563eb",
                  },
                  membros: {
                    label: "Membros",
                    color: "#059669",
                  },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={mockChurchGrowthData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area
                      yAxisId="right"
                      type="monotone"
                      dataKey="membros"
                      stackId="1"
                      stroke="#059669"
                      fill="#059669"
                      fillOpacity={0.1}
                    />
                    <Bar yAxisId="left" dataKey="igrejas" fill="#2563eb" />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Distribuição geográfica */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Distribuição por Estado
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[250px] w-full" />
            ) : (
              <ChartContainer
                config={{
                  churches: {
                    label: "Igrejas",
                  },
                }}
                className="h-[250px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={mockGeographicData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ state, churches }) => `${state}: ${churches}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="churches"
                    >
                      {mockGeographicData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Top 5 igrejas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Top 5 Igrejas por Membros
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {mockTopChurches.map((church, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{church.name}</h4>
                      <p className="text-xs text-muted-foreground">{church.pastor}</p>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{church.members.toLocaleString()}</div>
                      <div className={cn(
                        "text-xs flex items-center gap-1",
                        church.growth >= 0 ? "text-green-600" : "text-red-600"
                      )}>
                        {church.growth >= 0 ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        {Math.abs(church.growth)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Seções específicas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Últimas igrejas criadas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Últimas Igrejas Criadas
              </span>
              <Button variant="ghost" size="sm">
                <Eye className="h-4 w-4" />
                Ver todas
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {mockRecentChurches.map((church) => (
                  <div key={church.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{church.name}</h4>
                      <p className="text-sm text-muted-foreground">{church.city}</p>
                    </div>
                    <div className="text-right">
                      <Badge 
                        variant={church.status === 'active' ? 'default' : 'secondary'}
                      >
                        {church.status === 'active' ? 'Ativa' : 'Pendente'}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(church.createdAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Alertas e notificações */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Alertas e Notificações
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {mockAlerts.map((alert) => (
                  <Alert key={alert.id} className={cn(
                    alert.type === 'warning' && 'border-orange-500',
                    alert.type === 'success' && 'border-green-500',
                    alert.type === 'info' && 'border-blue-500'
                  )}>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      {alert.message}
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Ações rápidas */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {permissions.canManageChurch && (
              <Button variant="outline" className="h-20 flex-col gap-2" onClick={() => setShowCreateChurch(true)}>
                <Plus className="h-6 w-6" />
                Nova Igreja
              </Button>
            )}
            <Button variant="outline" className="h-20 flex-col gap-2">
              <BarChart3 className="h-6 w-6" />
              Relatórios
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <Users className="h-6 w-6" />
              Gestão de Usuários
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <Building2 className="h-6 w-6" />
              Status das Igrejas
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Dialog para criar nova igreja */}
      <CreateChurchForm
        denominationId={currentDenomination.id}
        isOpen={showCreateChurch}
        onClose={() => setShowCreateChurch(false)}
        onSuccess={handleCreateChurchSuccess}
      />
    </div>
  );
};

// Página principal com Provider
export const DenominationDashboardPage: React.FC = () => {
  return (
    <HierarchyProvider>
      <DenominationDashboardPageContent />
    </HierarchyProvider>
  );
};