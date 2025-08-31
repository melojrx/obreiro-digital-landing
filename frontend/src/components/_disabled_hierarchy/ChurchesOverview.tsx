/**
 * Componente de Visão Geral das Igrejas
 * Lista e gerencia igrejas de uma denominação
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import {
  Search,
  Filter,
  SortAsc,
  SortDesc,
  Grid3X3,
  List,
  Plus,
  Download,
  MoreHorizontal,
  Building2,
  MapPin,
  Users,
  Calendar,
  Eye,
  Edit,
  Trash,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from 'lucide-react';

// Hooks e tipos
import { useDenominations } from '@/hooks/useDenominations';
import { usePermissions } from '@/hooks/usePermissions';
import { ChurchDetails, ChurchFilters } from '@/types/hierarchy';
import { ChurchCard } from './ChurchCard';

interface ChurchesOverviewProps {
  denominationId: number;
  variant?: 'grid' | 'list' | 'table';
  showFilters?: boolean;
  showSearch?: boolean;
  showActions?: boolean;
  className?: string;
  onChurchClick?: (church: ChurchDetails) => void;
  onChurchEdit?: (church: ChurchDetails) => void;
  onChurchDelete?: (church: ChurchDetails) => void;
}

// Componente de filtros
const ChurchFilters: React.FC<{
  filters: ChurchFilters;
  onFiltersChange: (filters: ChurchFilters) => void;
  onClearFilters: () => void;
}> = ({ filters, onFiltersChange, onClearFilters }) => {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Filtros</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClearFilters}>
            Limpar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Estado</label>
          <Select 
            value={filters.state || ''} 
            onValueChange={(value) => onFiltersChange({ ...filters, state: value || undefined })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecionar estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos os estados</SelectItem>
              <SelectItem value="SP">São Paulo</SelectItem>
              <SelectItem value="RJ">Rio de Janeiro</SelectItem>
              <SelectItem value="MG">Minas Gerais</SelectItem>
              <SelectItem value="RS">Rio Grande do Sul</SelectItem>
              <SelectItem value="PR">Paraná</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Plano</label>
          <Select 
            value={filters.subscription_plan || ''} 
            onValueChange={(value) => onFiltersChange({ ...filters, subscription_plan: value || undefined })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecionar plano" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos os planos</SelectItem>
              <SelectItem value="basic">Básico</SelectItem>
              <SelectItem value="premium">Premium</SelectItem>
              <SelectItem value="enterprise">Enterprise</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Status</label>
          <Select 
            value={filters.subscription_status || ''} 
            onValueChange={(value) => onFiltersChange({ ...filters, subscription_status: value || undefined })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecionar status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos os status</SelectItem>
              <SelectItem value="active">Ativo</SelectItem>
              <SelectItem value="trial">Trial</SelectItem>
              <SelectItem value="suspended">Suspenso</SelectItem>
              <SelectItem value="expired">Expirado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="has-branches"
              checked={filters.has_branches}
              onCheckedChange={(checked) => onFiltersChange({ ...filters, has_branches: checked as boolean })}
            />
            <label htmlFor="has-branches" className="text-sm">Tem filiais</label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="is-active"
              checked={filters.is_active}
              onCheckedChange={(checked) => onFiltersChange({ ...filters, is_active: checked as boolean })}
            />
            <label htmlFor="is-active" className="text-sm">Apenas ativas</label>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Componente de cabeçalho com ações
const ChurchesHeader: React.FC<{
  totalCount: number;
  selectedCount: number;
  viewMode: 'grid' | 'list' | 'table';
  onViewModeChange: (mode: 'grid' | 'list' | 'table') => void;
  onExport: () => void;
  onBulkAction: (action: string) => void;
  canCreate: boolean;
  onCreateNew: () => void;
}> = ({ 
  totalCount, 
  selectedCount, 
  viewMode, 
  onViewModeChange, 
  onExport, 
  onBulkAction,
  canCreate,
  onCreateNew,
}) => {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold">Igrejas ({totalCount})</h2>
        
        {selectedCount > 0 && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{selectedCount} selecionadas</Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  Ações em lote
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => onBulkAction('activate')}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Ativar selecionadas
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onBulkAction('deactivate')}>
                  <XCircle className="h-4 w-4 mr-2" />
                  Desativar selecionadas
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onBulkAction('export')}>
                  <Download className="h-4 w-4 mr-2" />
                  Exportar selecionadas
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
      
      <div className="flex items-center gap-2">
        <div className="flex items-center bg-gray-100 rounded-lg p-1">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange('grid')}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
        
        <Button variant="outline" onClick={onExport}>
          <Download className="h-4 w-4 mr-2" />
          Exportar
        </Button>
        
        {canCreate && (
          <Button onClick={onCreateNew}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Igreja
          </Button>
        )}
      </div>
    </div>
  );
};

export const ChurchesOverview: React.FC<ChurchesOverviewProps> = ({
  denominationId,
  variant = 'grid',
  showFilters = true,
  showSearch = true,
  showActions = true,
  className,
  onChurchClick,
  onChurchEdit,
  onChurchDelete,
}) => {
  const permissions = usePermissions();
  
  const {
    denominationChurches,
    isLoadingChurches,
    loadDenominationChurches,
    createChurch,
  } = useDenominations();

  // Estados locais
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'table'>(variant);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<ChurchFilters>({});
  const [selectedChurches, setSelectedChurches] = useState<number[]>([]);
  const [sortBy, setSortBy] = useState<'name' | 'created_at' | 'total_members'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);

  // Carregar igrejas quando filtros mudarem
  useEffect(() => {
    const searchFilters: ChurchFilters = {
      ...filters,
      search: searchQuery || undefined,
      order_by: sortBy,
      order_direction: sortDirection,
    };

    loadDenominationChurches(denominationId, searchFilters, currentPage);
  }, [denominationId, filters, searchQuery, sortBy, sortDirection, currentPage, loadDenominationChurches]);

  // Handlers
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handleFiltersChange = (newFilters: ChurchFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setFilters({});
    setSearchQuery('');
    setCurrentPage(1);
  };

  const handleSort = (field: 'name' | 'created_at' | 'total_members') => {
    if (sortBy === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const handleChurchSelection = (churchId: number, selected: boolean) => {
    if (selected) {
      setSelectedChurches([...selectedChurches, churchId]);
    } else {
      setSelectedChurches(selectedChurches.filter(id => id !== churchId));
    }
  };

  const handleBulkAction = async (action: string) => {
    console.log('Bulk action:', action, 'for churches:', selectedChurches);
    // Implementar ações em lote
  };

  const handleExport = async () => {
    console.log('Exporting churches data...');
    // Implementar exportação
  };

  const handleCreateNew = () => {
    console.log('Create new church...');
    // Implementar criação de nova igreja
  };

  // Renderização baseada no modo de visualização
  const renderChurchesGrid = () => {
    if (!denominationChurches) return null;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {denominationChurches.results.map((church) => (
          <div key={church.id} className="relative">
            {showActions && (
              <div className="absolute top-2 left-2 z-10">
                <Checkbox
                  checked={selectedChurches.includes(church.id)}
                  onCheckedChange={(checked) => handleChurchSelection(church.id, checked as boolean)}
                />
              </div>
            )}
            <ChurchCard
              church={church}
              variant="default"
              showStats={true}
              showActions={true}
              canEdit={permissions.canManageChurch}
              canManage={permissions.canManageBranches}
              onClick={() => onChurchClick?.(church)}
              onEdit={() => onChurchEdit?.(church)}
              onDelete={() => onChurchDelete?.(church)}
            />
          </div>
        ))}
      </div>
    );
  };

  const renderChurchesList = () => {
    if (!denominationChurches) return null;

    return (
      <div className="space-y-2">
        {denominationChurches.results.map((church) => (
          <div key={church.id} className="relative">
            {showActions && (
              <div className="absolute top-4 left-4 z-10">
                <Checkbox
                  checked={selectedChurches.includes(church.id)}
                  onCheckedChange={(checked) => handleChurchSelection(church.id, checked as boolean)}
                />
              </div>
            )}
            <ChurchCard
              church={church}
              variant="compact"
              showStats={true}
              showActions={true}
              canEdit={permissions.canManageChurch}
              canManage={permissions.canManageBranches}
              onClick={() => onChurchClick?.(church)}
              onEdit={() => onChurchEdit?.(church)}
              onDelete={() => onChurchDelete?.(church)}
              className="ml-6"
            />
          </div>
        ))}
      </div>
    );
  };

  if (isLoadingChurches && !denominationChurches) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-64 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Barra de busca e filtros */}
      {(showSearch || showFilters) && (
        <div className="flex gap-4">
          {showSearch && (
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar igrejas..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          )}
          
          {showFilters && (
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  Filtros
                  {Object.keys(filters).length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {Object.keys(filters).length}
                    </Badge>
                  )}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Filtros de Igrejas</DialogTitle>
                </DialogHeader>
                <ChurchFilters
                  filters={filters}
                  onFiltersChange={handleFiltersChange}
                  onClearFilters={handleClearFilters}
                />
              </DialogContent>
            </Dialog>
          )}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                {sortDirection === 'asc' ? <SortAsc className="h-4 w-4 mr-2" /> : <SortDesc className="h-4 w-4 mr-2" />}
                Ordenar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleSort('name')}>
                Nome {sortBy === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSort('created_at')}>
                Data de criação {sortBy === 'created_at' && (sortDirection === 'asc' ? '↑' : '↓')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSort('total_members')}>
                Número de membros {sortBy === 'total_members' && (sortDirection === 'asc' ? '↑' : '↓')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Header com ações */}
      {showActions && denominationChurches && (
        <ChurchesHeader
          totalCount={denominationChurches.count}
          selectedCount={selectedChurches.length}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onExport={handleExport}
          onBulkAction={handleBulkAction}
          canCreate={permissions.canManageBranches}
          onCreateNew={handleCreateNew}
        />
      )}

      {/* Lista de igrejas */}
      {viewMode === 'grid' ? renderChurchesGrid() : renderChurchesList()}

      {/* Paginação */}
      {denominationChurches && denominationChurches.count > 20 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Mostrando {(currentPage - 1) * 20 + 1} a {Math.min(currentPage * 20, denominationChurches.count)} de {denominationChurches.count} igrejas
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
            >
              Anterior
            </Button>
            
            <div className="flex items-center gap-1">
              {[...Array(Math.ceil(denominationChurches.count / 20))].slice(
                Math.max(0, currentPage - 3),
                Math.min(Math.ceil(denominationChurches.count / 20), currentPage + 2)
              ).map((_, index) => {
                const pageNumber = Math.max(0, currentPage - 3) + index + 1;
                return (
                  <Button
                    key={pageNumber}
                    variant={pageNumber === currentPage ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCurrentPage(pageNumber)}
                  >
                    {pageNumber}
                  </Button>
                );
              })}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= Math.ceil(denominationChurches.count / 20)}
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}

      {/* Estado vazio */}
      {denominationChurches && denominationChurches.results.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma igreja encontrada</h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchQuery || Object.keys(filters).length > 0
                ? 'Não há igrejas que correspondam aos filtros selecionados.'
                : 'Esta denominação ainda não possui igrejas cadastradas.'
              }
            </p>
            {permissions.canManageBranches && (
              <Button onClick={handleCreateNew}>
                <Plus className="h-4 w-4 mr-2" />
                Cadastrar Primeira Igreja
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};