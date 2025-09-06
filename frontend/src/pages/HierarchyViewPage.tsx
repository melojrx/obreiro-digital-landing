import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TreePine,
  Building2,
  Church,
  Users,
  MapPin,
  ChevronRight,
  ChevronDown,
  Eye,
  Settings,
  BarChart3,
  Filter,
  Search,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Download,
  RefreshCw,
  Target,
  Activity,
  DollarSign,
  Zap,
  Brain
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/components/layout/AppLayout';
import { usePermissions } from '@/hooks/usePermissions';
import { DenominationDetails, ChurchDetails, BranchDetails } from '@/types/hierarchy';
import { hierarchyService, HierarchyNode, HierarchyStats, ChurchInsights } from '@/services/hierarchyService';
import { toast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';

// Interface movida para hierarchyService.ts

const HierarchyViewPage: React.FC = () => {
  const navigate = useNavigate();
  const permissions = usePermissions();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [hierarchyData, setHierarchyData] = useState<HierarchyNode[]>([]);
  const [hierarchyStats, setHierarchyStats] = useState<HierarchyStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedChurch, setSelectedChurch] = useState<ChurchInsights | null>(null);
  const [isInsightsDialogOpen, setIsInsightsDialogOpen] = useState(false);

  // Carregar dados reais da API
  useEffect(() => {
    loadHierarchyData();
  }, []);

  const loadHierarchyData = async () => {
    try {
      setIsLoading(true);
      const [hierarchyData, stats] = await Promise.all([
        hierarchyService.getHierarchyData(),
        hierarchyService.getDenominationStats()
      ]);
      
      setHierarchyData(hierarchyData);
      setHierarchyStats(stats);
      
      toast({
        title: 'Dados carregados',
        description: 'Dados da hierarquia carregados com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao carregar dados hierárquicos:', error);
      
      toast({
        title: 'Erro ao carregar dados',
        description: 'Não foi possível carregar os dados da hierarquia. Verifique sua conexão e tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Verificar permissões
  useEffect(() => {
    if (!permissions.canViewHierarchy && !permissions.canManageDenomination) {
      navigate('/dashboard');
    }
  }, [permissions, navigate]);

  const toggleNode = (nodeId: string) => {
    const updateNode = (nodes: HierarchyNode[]): HierarchyNode[] => {
      return nodes.map(node => ({
        ...node,
        expanded: node.id === nodeId ? !node.expanded : node.expanded,
        children: updateNode(node.children)
      }));
    };
    setHierarchyData(updateNode(hierarchyData));
  };

  const getNodeIcon = (type: string, expanded: boolean) => {
    switch (type) {
      case 'denomination':
        return <TreePine className="h-5 w-5 text-green-600" />;
      case 'church':
        return <Church className="h-5 w-5 text-blue-600" />;
      case 'branch':
        return <Building2 className="h-5 w-5 text-purple-600" />;
      default:
        return <Building2 className="h-5 w-5 text-gray-600" />;
    }
  };

  const getExpandIcon = (hasChildren: boolean, expanded: boolean) => {
    if (!hasChildren) return <div className="w-4 h-4" />;
    return expanded ? 
      <ChevronDown className="h-4 w-4 text-gray-500" /> : 
      <ChevronRight className="h-4 w-4 text-gray-500" />;
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      denomination: 'Denominação',
      church: 'Igreja',
      branch: 'Filial'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getTypeBadge = (type: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      denomination: 'default',
      church: 'secondary',
      branch: 'outline'
    };

    return (
      <Badge variant={variants[type] || 'outline'} className="text-xs">
        {getTypeLabel(type)}
      </Badge>
    );
  };

  const handleViewDetails = (node: HierarchyNode) => {
    switch (node.type) {
      case 'denomination':
        // Navegar para a página específica da denominação ao invés do dashboard
        navigate(`/denominacao/${(node.data as DenominationDetails).id}/dashboard`);
        break;
      case 'church':
        navigate(`/denominacao/churches/${(node.data as ChurchDetails).id}`);
        break;
      case 'branch':
        navigate(`/denominacao/branches/${(node.data as BranchDetails).id}`);
        break;
    }
  };

  const handleViewInsights = async (node: HierarchyNode) => {
    if (node.type !== 'church') return;
    
    try {
      const insights = await hierarchyService.getChurchInsights((node.data as ChurchDetails).id);
      setSelectedChurch(insights);
      setIsInsightsDialogOpen(true);
    } catch (error) {
      toast({
        title: 'Erro ao carregar insights',
        description: 'Não foi possível carregar os insights da igreja.',
        variant: 'destructive',
      });
    }
  };

  const handleExportReport = async () => {
    try {
      const blob = await hierarchyService.exportHierarchyReport('pdf', {
        include_insights: true,
        include_financial: true,
        date_range: {
          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          end: new Date().toISOString()
        }
      });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `relatorio-hierarquico-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: 'Relatório exportado',
        description: 'O relatório hierárquico foi gerado com sucesso.',
      });
    } catch (error) {
      toast({
        title: 'Erro na exportação',
        description: 'Não foi possível gerar o relatório. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'growing':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'declining':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      high: 'destructive',
      medium: 'default',
      low: 'secondary'
    };
    
    return (
      <Badge variant={variants[priority]} className="text-xs">
        {priority === 'high' ? 'Alta' : priority === 'medium' ? 'Média' : 'Baixa'}
      </Badge>
    );
  };

  const renderNode = (node: HierarchyNode) => {
    return (
      <div key={node.id} className="select-none">
        <div 
          className="flex items-center py-2 sm:py-3 px-2 sm:px-3 hover:bg-gray-50 rounded-lg cursor-pointer group border-l-4 border-transparent hover:border-blue-200"
          style={{ paddingLeft: `${6 + node.level * 12}px` }}
        >
          <button
            onClick={() => toggleNode(node.id)}
            className="mr-1 sm:mr-2 p-1"
          >
            {getExpandIcon(node.children.length > 0, node.expanded)}
          </button>
          
          <div className="shrink-0">
            {getNodeIcon(node.type, node.expanded)}
          </div>
          
          <div className="flex-1 ml-2 sm:ml-3 min-w-0">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2">
              <div className="flex flex-col xs:flex-row xs:items-start xs:gap-3 min-w-0">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                    <span className="font-medium text-gray-900 text-sm sm:text-base truncate">{node.name}</span>
                    {getTypeBadge(node.type)}
                    <div className="hidden xs:flex items-center gap-1">
                      {node.insights && getTrendIcon(node.insights.trend)}
                      {node.insights && getPriorityBadge(node.insights.priority)}
                    </div>
                  </div>
                  {node.type === 'church' && (
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-1 text-[10px] sm:text-xs text-gray-500">
                      <span>Saúde: {node.stats.health_score}%</span>
                      <span>Crescimento: {node.stats.growth_rate > 0 ? '+' : ''}{node.stats.growth_rate}%</span>
                      <span className="hidden sm:inline">Engajamento: {node.stats.engagement_rate}%</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Stats - always visible on mobile, hover on desktop */}
              <div className="flex items-center gap-2 sm:gap-4 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span className="text-[10px] sm:text-xs">{node.stats.members?.toLocaleString() || 0}</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Total de membros</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span className="text-[10px] sm:text-xs">{node.stats.visitors?.toLocaleString() || 0}</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Visitantes este mês</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <div className="hidden sm:flex">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <div className="flex items-center gap-1">
                            <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span className="text-[10px] sm:text-xs">{node.stats.activities || 0}</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Atividades ativas</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  
                  {node.type === 'church' && node.stats.branches_count !== undefined && (
                    <div className="hidden lg:flex">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <div className="flex items-center gap-1">
                              <Building2 className="h-3 w-3 sm:h-4 sm:w-4" />
                              <span className="text-[10px] sm:text-xs">{node.stats.branches_count}</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Filiais</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleViewDetails(node)}
                    title="Ver detalhes"
                    className="h-6 w-6 sm:h-8 sm:w-8 p-0"
                  >
                    <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                  
                  {node.type === 'church' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewInsights(node)}
                      title="Ver insights"
                      className="h-6 w-6 sm:h-8 sm:w-8 p-0"
                    >
                      <Brain className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                  )}
                  
                  {permissions.canManageDenomination && (
                    <Button
                      variant="ghost"
                      size="sm"
                      title="Configurações"
                      onClick={() => navigate(`/denominacao/churches/${(node.data as ChurchDetails).id}/settings`)}
                      className="hidden sm:flex h-6 w-6 sm:h-8 sm:w-8 p-0"
                    >
                      <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
            
            {node.insights && node.insights.alerts.length > 0 && (
              <div className="mt-2">
                <Alert className="py-2">
                  <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <AlertDescription className="text-[10px] sm:text-xs leading-relaxed">
                    {node.insights.alerts[0]} {node.insights.alerts.length > 1 && `e mais ${node.insights.alerts.length - 1} alerta(s)`}
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </div>
        </div>
        
        {node.expanded && node.children.map(child => renderNode(child))}
      </div>
    );
  };

  const flattenNodes = (nodes: HierarchyNode[]): HierarchyNode[] => {
    const result: HierarchyNode[] = [];
    const traverse = (nodeList: HierarchyNode[]) => {
      nodeList.forEach(node => {
        result.push(node);
        traverse(node.children);
      });
    };
    traverse(nodes);
    return result;
  };

  const filteredNodes = () => {
    const allNodes = flattenNodes(hierarchyData);
    return allNodes.filter(node => {
      const matchesSearch = node.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'all' || node.type === filterType;
      return matchesSearch && matchesType;
    });
  };

  if (!permissions.canViewHierarchy) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <TreePine className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Acesso Restrito
            </h2>
            <p className="text-gray-600">
              Você não tem permissão para visualizar a hierarquia.
            </p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="text-center lg:text-left">
            <h1 className="text-xl sm:text-2xl lg:text-2xl font-bold text-gray-900 flex items-center justify-center lg:justify-start gap-2">
              <TreePine className="h-6 w-6 sm:h-7 sm:w-7 text-green-600" />
              Visão Hierárquica
            </h1>
            <p className="text-gray-600 mt-1 text-xs sm:text-sm lg:text-base">
              Navegue pela estrutura completa da denominação com insights em tempo real
            </p>
          </div>
          
          <div className="flex items-center gap-2 justify-center lg:justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={loadHierarchyData}
              disabled={isLoading}
              className="flex-1 xs:flex-none"
            >
              <RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 ${isLoading ? 'animate-spin' : ''} mr-1 sm:mr-0`} />
              <span className="xs:hidden">Atualizar</span>
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportReport}
              className="flex-1 xs:flex-none"
            >
              <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden xs:inline">Exportar</span>
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-3 w-3 sm:h-4 sm:w-4" />
                  <Input
                    placeholder="Buscar na hierarquia..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 sm:pl-10 text-sm h-9 sm:h-10"
                  />
                </div>
              </div>
              
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-full sm:w-48 h-9 sm:h-10 text-sm">
                  <SelectValue placeholder="Filtrar por tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="denomination">Denominações</SelectItem>
                  <SelectItem value="church">Igrejas</SelectItem>
                  <SelectItem value="branch">Filiais</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Estatísticas Resumidas */}
        {hierarchyStats && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center">
                  <Church className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
                  <div className="ml-2 sm:ml-4 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Total de Igrejas</p>
                    <p className="text-lg sm:text-2xl font-bold text-gray-900">{hierarchyStats.total_churches?.toLocaleString() || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center">
                  <Building2 className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600" />
                  <div className="ml-2 sm:ml-4 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Total de Filiais</p>
                    <p className="text-lg sm:text-2xl font-bold text-gray-900">{hierarchyStats.total_branches?.toLocaleString() || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center">
                  <Users className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
                  <div className="ml-2 sm:ml-4 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Total de Membros</p>
                    <p className="text-lg sm:text-2xl font-bold text-gray-900">{hierarchyStats.total_members?.toLocaleString() || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Árvore Hierárquica */}
        <Card>
          <CardHeader>
            <CardTitle>Estrutura Organizacional</CardTitle>
          </CardHeader>
          <CardContent>
            {searchTerm || filterType !== 'all' ? (
              // Modo de busca - lista plana
              <div className="space-y-2">
                {filteredNodes().map(node => (
                  <div key={node.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-lg gap-2">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="shrink-0">
                        {getNodeIcon(node.type, false)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-sm sm:text-base truncate">{node.name}</div>
                        <div className="text-xs sm:text-sm text-gray-500">
                          {getTypeLabel(node.type)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:gap-4">
                      <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span>{node.stats.members}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span>{node.stats.visitors}</span>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(node)}
                        className="h-7 sm:h-9 px-2 sm:px-3"
                      >
                        <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="sr-only sm:not-sr-only sm:ml-1">Ver</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Modo árvore
              <div className="space-y-1 overflow-x-auto">
                <div className="min-w-[500px] sm:min-w-0">
                  {hierarchyData.map(node => renderNode(node))}
                </div>
              </div>
            )}

            {(searchTerm || filterType !== 'all') && filteredNodes().length === 0 && (
              <div className="text-center py-8">
                <TreePine className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhum resultado encontrado
                </h3>
                <p className="text-gray-600">
                  Tente ajustar os filtros de busca.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dialog de Insights da Igreja */}
        <Dialog open={isInsightsDialogOpen} onOpenChange={setIsInsightsDialogOpen}>
          <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] sm:max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Brain className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                <span className="truncate">Insights - {selectedChurch?.name}</span>
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                Análise detalhada de desempenho e recomendações estratégicas
              </DialogDescription>
            </DialogHeader>
            
            {selectedChurch && (
              <div className="space-y-6">
                {/* Score de Saúde */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                  <Card>
                    <CardHeader className="pb-2 sm:pb-6">
                      <CardTitle className="text-sm sm:text-base lg:text-lg">Score de Saúde</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-center">
                        <div className="relative w-24 h-24 sm:w-32 sm:h-32">
                          <div className={`w-24 h-24 sm:w-32 sm:h-32 rounded-full flex items-center justify-center text-lg sm:text-2xl font-bold ${
                            selectedChurch.health_score >= 80 ? 'bg-green-100 text-green-800' :
                            selectedChurch.health_score >= 60 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {selectedChurch.health_score}%
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2 sm:pb-6">
                      <CardTitle className="text-sm sm:text-base lg:text-lg">Métricas de Crescimento</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 sm:space-y-3">
                      <div className="flex justify-between text-xs sm:text-sm">
                        <span className="truncate pr-2">Crescimento de Membros:</span>
                        <span className={`font-medium ${selectedChurch.growth_metrics.member_growth_rate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {selectedChurch.growth_metrics.member_growth_rate > 0 ? '+' : ''}{selectedChurch.growth_metrics.member_growth_rate}%
                        </span>
                      </div>
                      <div className="flex justify-between text-xs sm:text-sm">
                        <span className="truncate pr-2">Crescimento de Visitantes:</span>
                        <span className={`font-medium ${selectedChurch.growth_metrics.visitor_growth_rate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {selectedChurch.growth_metrics.visitor_growth_rate > 0 ? '+' : ''}{selectedChurch.growth_metrics.visitor_growth_rate}%
                        </span>
                      </div>
                      <div className="flex justify-between text-xs sm:text-sm">
                        <span className="truncate pr-2">Taxa de Retenção:</span>
                        <span className="font-medium">{selectedChurch.growth_metrics.retention_rate}%</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Saúde Financeira */}
                <Card>
                  <CardHeader className="pb-2 sm:pb-6">
                    <CardTitle className="text-sm sm:text-base lg:text-lg flex items-center gap-2">
                      <DollarSign className="h-4 w-4 sm:h-5 sm:w-5" />
                      Saúde Financeira
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
                      <div className="text-center space-y-1">
                        <div className="text-sm sm:text-xl lg:text-2xl font-bold text-green-600">
                          R$ {selectedChurch.financial_health.monthly_income.toLocaleString()}
                        </div>
                        <div className="text-[10px] sm:text-xs lg:text-sm text-gray-500 leading-tight">Receita Mensal</div>
                      </div>
                      <div className="text-center space-y-1">
                        <div className="text-sm sm:text-xl lg:text-2xl font-bold text-red-600">
                          R$ {selectedChurch.financial_health.monthly_expenses.toLocaleString()}
                        </div>
                        <div className="text-[10px] sm:text-xs lg:text-sm text-gray-500 leading-tight">Despesas Mensais</div>
                      </div>
                      <div className="text-center space-y-1">
                        <div className="text-sm sm:text-xl lg:text-2xl font-bold text-blue-600">
                          {selectedChurch.financial_health.tithe_consistency}%
                        </div>
                        <div className="text-[10px] sm:text-xs lg:text-sm text-gray-500 leading-tight">Consistência Dízimos</div>
                      </div>
                      <div className="text-center space-y-1">
                        <div className="text-sm sm:text-xl lg:text-2xl font-bold text-purple-600">
                          {selectedChurch.financial_health.budget_adherence}%
                        </div>
                        <div className="text-[10px] sm:text-xs lg:text-sm text-gray-500 leading-tight">Adesão ao Orçamento</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Recomendações */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Zap className="h-5 w-5" />
                      Recomendações Estratégicas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {selectedChurch.recommendations.map((rec, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold">{rec.title}</h4>
                            <div className="flex items-center gap-2">
                              {getPriorityBadge(rec.priority)}
                              <Badge variant="outline" className="text-xs">
                                {rec.category === 'growth' ? 'Crescimento' :
                                 rec.category === 'financial' ? 'Financeiro' :
                                 rec.category === 'leadership' ? 'Liderança' : 'Engajamento'}
                              </Badge>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">{rec.description}</p>
                          <div className="space-y-1">
                            <p className="text-sm font-medium">Ações Sugeridas:</p>
                            <ul className="text-sm text-gray-600 list-disc list-inside">
                              {rec.action_items.map((action, actionIndex) => (
                                <li key={actionIndex}>{action}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Alertas */}
                {selectedChurch.alerts.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                        Alertas
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {selectedChurch.alerts.map((alert, index) => (
                          <Alert key={index} variant={alert.type === 'error' ? 'destructive' : 'default'}>
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>{alert.title}</AlertTitle>
                            <AlertDescription>
                              {alert.description}
                              {alert.deadline && (
                                <div className="mt-1 text-xs">
                                  Prazo: {new Date(alert.deadline).toLocaleDateString('pt-BR')}
                                </div>
                              )}
                            </AlertDescription>
                          </Alert>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default HierarchyViewPage;