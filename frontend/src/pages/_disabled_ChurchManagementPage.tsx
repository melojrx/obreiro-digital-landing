import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2,
  Building,
  Plus,
  Search,
  Filter,
  MapPin,
  Users,
  Calendar,
  Settings,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  Download,
  RefreshCw,
  CheckSquare,
  X,
  Loader2,
  SortAsc,
  SortDesc,
  AlertTriangle
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Pagination, 
  PaginationContent, 
  PaginationEllipsis, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from '@/components/ui/pagination';
import { toast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/useDebounce';

import AppLayout from '@/components/layout/AppLayout';
import { usePermissions } from '@/hooks/usePermissions';
import { ChurchDetails, ChurchFilters, PaginatedResponse } from '@/types/hierarchy';
import { churchService } from '@/services/churchService';

const ChurchManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const permissions = usePermissions();

  // State para dados
  const [churchesData, setChurchesData] = useState<PaginatedResponse<ChurchDetails> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedChurches, setSelectedChurches] = useState<number[]>([]);
  const [availableStates, setAvailableStates] = useState<Array<{ code: string; name: string }>>([]);
  
  // State para filtros e busca
  const [searchTerm, setSearchTerm] = useState('');
  const [filterState, setFilterState] = useState('all');
  const [filterPlan, setFilterPlan] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'created_at' | 'total_members' | 'total_branches'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Debounce do termo de busca
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Verificar permissões
  useEffect(() => {
    if (!permissions.canManageDenomination && !permissions.canCreateChurches) {
      navigate('/dashboard');
      return;
    }
    
    loadInitialData();
  }, [permissions, navigate]);

  // Recarregar dados quando filtros mudarem
  useEffect(() => {
    loadChurches();
  }, [
    debouncedSearchTerm,
    filterState,
    filterPlan,
    filterStatus,
    sortBy,
    sortDirection,
    currentPage,
    pageSize
  ]);

  const loadInitialData = async () => {
    try {
      const states = await churchService.getAvailableStates();
      setAvailableStates(states);
    } catch (error) {
      console.error('Erro ao carregar dados auxiliares:', error);
    }
  };

  const loadChurches = async () => {
    if (!permissions.canManageDenomination && !permissions.canCreateChurches) {
      return;
    }

    try {
      setIsLoading(currentPage === 1);
      setIsRefreshing(currentPage > 1);

      const filters: ChurchFilters = {
        search: debouncedSearchTerm || undefined,
        state: filterState !== 'all' ? filterState : undefined,
        subscription_plan: filterPlan !== 'all' ? filterPlan : undefined,
        subscription_status: filterStatus !== 'all' ? filterStatus : undefined,
        order_by: sortBy,
        order_direction: sortDirection,
      };

      const data = await churchService.getChurches(filters, currentPage, pageSize);
      setChurchesData(data);
    } catch (error: any) {
      console.error('Erro ao carregar igrejas:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar lista de igrejas. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setCurrentPage(1);
    loadChurches();
  };

  const handleCreateChurch = () => {
    navigate('/denominacao/churches/create');
  };

  const handleViewChurch = (id: number) => {
    navigate(`/denominacao/churches/${id}`);
  };

  const handleEditChurch = (id: number) => {
    navigate(`/denominacao/churches/${id}/edit`);
  };

  const handleDeleteChurch = async (id: number, name: string) => {
    try {
      await churchService.deleteChurch(id);
      toast({
        title: 'Igreja removida',
        description: `A igreja "${name}" foi removida com sucesso.`,
      });
      loadChurches();
    } catch (error: any) {
      toast({
        title: 'Erro ao remover igreja',
        description: error.response?.data?.message || 'Erro interno. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const handleBulkAction = async (action: 'activate' | 'deactivate' | 'delete') => {
    if (selectedChurches.length === 0) {
      toast({
        title: 'Nenhuma igreja selecionada',
        description: 'Selecione pelo menos uma igreja para realizar esta ação.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await churchService.batchAction({
        action,
        entity_ids: selectedChurches,
      });

      toast({
        title: 'Ação concluída',
        description: `${response.success_count} igreja(s) processada(s) com sucesso.`,
      });

      if (response.error_count > 0) {
        console.error('Erros na ação em lote:', response.errors);
      }

      setSelectedChurches([]);
      loadChurches();
    } catch (error: any) {
      toast({
        title: 'Erro na ação em lote',
        description: error.response?.data?.message || 'Erro interno. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const handleExportData = async () => {
    try {
      const filters: ChurchFilters = {
        search: debouncedSearchTerm || undefined,
        state: filterState !== 'all' ? filterState : undefined,
        subscription_plan: filterPlan !== 'all' ? filterPlan : undefined,
        subscription_status: filterStatus !== 'all' ? filterStatus : undefined,
      };

      const blob = await churchService.exportChurches('xlsx', filters);
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `igrejas-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: 'Exportação concluída',
        description: 'Os dados das igrejas foram exportados com sucesso.',
      });
    } catch (error) {
      toast({
        title: 'Erro na exportação',
        description: 'Erro ao exportar dados. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const handleSelectChurch = (churchId: number, selected: boolean) => {
    if (selected) {
      setSelectedChurches([...selectedChurches, churchId]);
    } else {
      setSelectedChurches(selectedChurches.filter(id => id !== churchId));
    }
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected && churchesData?.results) {
      setSelectedChurches(churchesData.results.map(church => church.id));
    } else {
      setSelectedChurches([]);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      active: 'default',
      inactive: 'secondary',
      suspended: 'destructive',
      trial: 'outline'
    };
    
    const labels: Record<string, string> = {
      active: 'Ativa',
      inactive: 'Inativa', 
      suspended: 'Suspensa',
      trial: 'Período Trial'
    };

    return (
      <Badge variant={variants[status] || 'outline'}>
        {labels[status] || status}
      </Badge>
    );
  };

  const getPlanBadge = (plan: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      premium: 'default',
      basic: 'secondary',
      trial: 'outline'
    };
    
    const labels: Record<string, string> = {
      premium: 'Premium',
      basic: 'Básico',
      trial: 'Trial'
    };

    return (
      <Badge variant={variants[plan] || 'outline'}>
        {labels[plan] || plan}
      </Badge>
    );
  };

  const getSortIcon = (column: typeof sortBy) => {
    if (sortBy !== column) return null;
    return sortDirection === 'asc' ? 
      <SortAsc className="h-4 w-4" /> : 
      <SortDesc className="h-4 w-4" />;
  };

  const totalPages = Math.ceil((churchesData?.count || 0) / pageSize);
  const churches = churchesData?.results || [];
  const allSelected = churches.length > 0 && selectedChurches.length === churches.length;
  const someSelected = selectedChurches.length > 0 && selectedChurches.length < churches.length;

  if (!permissions.canManageDenomination && !permissions.canCreateChurches) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Acesso Restrito
            </h2>
            <p className="text-gray-600">
              Você não tem permissão para acessar a gestão de igrejas.
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Building2 className="h-7 w-7 text-blue-600" />
              Gerenciar Igrejas
            </h1>
            <p className="text-gray-600 mt-1">
              Gerencie todas as igrejas da sua denominação
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading || isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Ações</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleExportData}>
                  <Download className="h-4 w-4 mr-2" />
                  Exportar Dados
                </DropdownMenuItem>
                {selectedChurches.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Ações em Lote ({selectedChurches.length})</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => handleBulkAction('activate')}>
                      <CheckSquare className="h-4 w-4 mr-2" />
                      Ativar Selecionadas
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkAction('deactivate')}>
                      <X className="h-4 w-4 mr-2" />
                      Desativar Selecionadas
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleBulkAction('delete')}
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remover Selecionadas
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {permissions.canCreateChurches && (
              <Button onClick={handleCreateChurch}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Igreja
              </Button>
            )}
          </div>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Buscar por nome, cidade ou email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Select value={filterState} onValueChange={setFilterState}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Todos os estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os estados</SelectItem>
                  {availableStates.map((state) => (
                    <SelectItem key={state.code} value={state.code}>
                      {state.name} ({state.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterPlan} onValueChange={setFilterPlan}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Todos os planos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os planos</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="basic">Básico</SelectItem>
                  <SelectItem value="trial">Trial</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="active">Ativas</SelectItem>
                  <SelectItem value="inactive">Inativas</SelectItem>
                  <SelectItem value="suspended">Suspensas</SelectItem>
                  <SelectItem value="trial">Período Trial</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Estatísticas */}
        {!isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <Building2 className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total de Igrejas</p>
                    <p className="text-2xl font-bold text-gray-900">{churchesData?.count || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total de Membros</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {churches.reduce((sum, church) => sum + church.total_members, 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <MapPin className="h-8 w-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total de Filiais</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {churches.reduce((sum, church) => sum + (church.branches_count || 0), 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <Calendar className="h-8 w-8 text-orange-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Visitantes (Total)</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {churches.reduce((sum, church) => sum + church.total_visitors, 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabela de Igrejas */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Lista de Igrejas</CardTitle>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Select value={String(pageSize)} onValueChange={(value) => {
                  setPageSize(Number(value));
                  setCurrentPage(1);
                }}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
                <span>por página</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
            ) : churches.length > 0 ? (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={allSelected}
                          onCheckedChange={handleSelectAll}
                          {...(someSelected ? { indeterminate: true } : {})}
                        />
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => handleSort('name')}
                      >
                        <div className="flex items-center gap-2">
                          Igreja
                          {getSortIcon('name')}
                        </div>
                      </TableHead>
                      <TableHead>Localização</TableHead>
                      <TableHead>Plano</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => handleSort('total_members')}
                      >
                        <div className="flex items-center gap-2">
                          Membros
                          {getSortIcon('total_members')}
                        </div>
                      </TableHead>
                      <TableHead>Filiais</TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => handleSort('created_at')}
                      >
                        <div className="flex items-center gap-2">
                          Criada em
                          {getSortIcon('created_at')}
                        </div>
                      </TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {churches.map((church) => (
                      <TableRow key={church.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedChurches.includes(church.id)}
                            onCheckedChange={(checked) => 
                              handleSelectChurch(church.id, checked as boolean)
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {church.logo ? (
                              <img
                                src={church.logo}
                                alt={`Logo da ${church.name}`}
                                className="w-10 h-10 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                <Building2 className="h-5 w-5 text-blue-600" />
                              </div>
                            )}
                            <div>
                              <div className="font-medium">{church.name}</div>
                              <div className="text-sm text-gray-500">{church.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 text-gray-400 mr-1" />
                            {church.city}, {church.state}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getPlanBadge(church.subscription_plan)}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(church.subscription_status)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Users className="h-4 w-4 text-gray-400 mr-1" />
                            <span>{church.total_members}</span>
                            <span className="text-xs text-gray-500 ml-1">
                              /{church.max_members}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Building className="h-4 w-4 text-gray-400 mr-1" />
                            <span>{church.branches_count || 0}</span>
                            <span className="text-xs text-gray-500 ml-1">
                              /{church.max_branches}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(church.created_at).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewChurch(church.id)}
                              title="Ver detalhes"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {permissions.canManageChurch && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditChurch(church.id)}
                                title="Editar"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleViewChurch(church.id)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Ver Detalhes
                                </DropdownMenuItem>
                                {permissions.canManageChurch && (
                                  <DropdownMenuItem onClick={() => handleEditChurch(church.id)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Editar
                                  </DropdownMenuItem>
                                )}
                                {permissions.canManageChurch && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <DropdownMenuItem 
                                          onSelect={(e) => e.preventDefault()}
                                          className="text-red-600"
                                        >
                                          <Trash2 className="h-4 w-4 mr-2" />
                                          Remover
                                        </DropdownMenuItem>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Confirmar remoção</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            Tem certeza de que deseja remover a igreja "{church.name}"? 
                                            Esta ação não pode ser desfeita.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                          <AlertDialogAction
                                            onClick={() => handleDeleteChurch(church.id, church.name)}
                                            className="bg-red-600 hover:bg-red-700"
                                          >
                                            Remover
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Paginação */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-gray-600">
                      Mostrando {(currentPage - 1) * pageSize + 1} até {Math.min(currentPage * pageSize, churchesData?.count || 0)} de {churchesData?.count || 0} resultados
                    </div>
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious 
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              if (currentPage > 1) setCurrentPage(currentPage - 1);
                            }}
                            className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                          />
                        </PaginationItem>
                        
                        {[...Array(Math.min(5, totalPages))].map((_, i) => {
                          const page = currentPage <= 3 ? i + 1 : currentPage - 2 + i;
                          if (page > totalPages) return null;
                          
                          return (
                            <PaginationItem key={page}>
                              <PaginationLink
                                href="#"
                                onClick={(e) => {
                                  e.preventDefault();
                                  setCurrentPage(page);
                                }}
                                isActive={currentPage === page}
                              >
                                {page}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        })}
                        
                        <PaginationItem>
                          <PaginationNext 
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                            }}
                            className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhuma igreja encontrada
                </h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm || filterState !== 'all' || filterPlan !== 'all' || filterStatus !== 'all'
                    ? 'Tente ajustar os filtros de busca.'
                    : 'Comece criando sua primeira igreja.'}
                </p>
                {permissions.canCreateChurches && !searchTerm && filterState === 'all' && filterPlan === 'all' && filterStatus === 'all' && (
                  <Button onClick={handleCreateChurch}>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Primeira Igreja
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default ChurchManagementPage;