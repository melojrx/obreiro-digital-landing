import React from 'react';
import { Search, Filter, Download, Plus, Users, Loader2 } from 'lucide-react';
import { MINISTERIAL_FUNCTION_CHOICES, membersService } from '@/services/membersService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

interface FiltersType {
  search: string;
  status: string;
  ministerial_function: string;
  page: number;
}

interface MembersFiltersProps {
  filters: FiltersType;
  onFiltersChange: (filters: FiltersType) => void;
  loading?: boolean;
}

export const MembersFilters: React.FC<MembersFiltersProps> = ({
  filters,
  onFiltersChange,
  loading = false,
}) => {
  const [exporting, setExporting] = React.useState(false);

  const handleSearchChange = (value: string) => {
    onFiltersChange({
      ...filters,
      search: value,
      page: 1,
    });
  };

  const handleStatusChange = (value: string) => {
    onFiltersChange({
      ...filters,
      status: value === 'all' ? '' : value,
      page: 1,
    });
  };

  const handleMinisterialFunctionChange = (value: string) => {
    onFiltersChange({
      ...filters,
      ministerial_function: value === 'all' ? '' : value,
      page: 1,
    });
  };

  const handleClearFilters = () => {
    onFiltersChange({
      search: '',
      status: '',
      ministerial_function: '',
      page: 1,
    });
  };

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const blob = await membersService.exportMembersCSV({
        search: filters.search,
        status: filters.status,
        ministerial_function: filters.ministerial_function
      });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `membros_${Date.now()}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
      
      toast.success('Membros exportados com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar membros:', error);
      toast.error('Erro ao exportar membros');
    } finally {
      setExporting(false);
    }
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="space-y-1">
        <CardTitle>Filtros e Busca</CardTitle>
        <CardDescription>
          Encontre membros específicos usando os filtros abaixo
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Busca */}
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar por nome, email ou telefone..."
                value={filters.search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
                disabled={loading}
              />
            </div>
          </div>

          {/* Filtro por Status */}
          <div>
            <Select 
              value={filters.status || 'all'} 
              onValueChange={handleStatusChange}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="inactive">Inativo</SelectItem>
                <SelectItem value="transferred">Transferido</SelectItem>
                <SelectItem value="deceased">Falecido</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Filtro por Função Ministerial */}
          <div>
            <Select 
              value={filters.ministerial_function || 'all'} 
              onValueChange={handleMinisterialFunctionChange}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Função" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as funções</SelectItem>
                {Object.entries(MINISTERIAL_FUNCTION_CHOICES).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

        </div>

        {/* Ações */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleClearFilters}
              disabled={loading}
              className="w-full sm:w-auto"
            >
              Limpar Filtros
            </Button>
          </div>
          
          <div className="flex flex-col gap-2 sm:flex-row">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={loading || exporting}
                  className="w-full sm:w-auto"
                >
                  {exporting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  {exporting ? 'Exportando...' : 'Exportar'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem disabled>Exportar Excel</DropdownMenuItem>
                <DropdownMenuItem disabled>Exportar PDF</DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportCSV}>Exportar CSV</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Componente para estado vazio
interface EmptyStateProps {
  searchTerm: string;
  onNewMember: () => void;
}

export const MembersEmptyState: React.FC<EmptyStateProps> = ({
  searchTerm,
  onNewMember,
}) => {
  return (
    <div className="text-center py-12">
      <Users className="mx-auto h-12 w-12 text-gray-400" />
      <h3 className="mt-2 text-sm font-semibold text-gray-900">Nenhum membro encontrado</h3>
      <p className="mt-1 text-sm text-gray-500">
        {searchTerm ? 'Tente ajustar sua busca ou filtros.' : 'Comece adicionando um novo membro.'}
      </p>
      {!searchTerm && (
        <div className="mt-6">
          <Button className="flex items-center gap-2" onClick={onNewMember}>
            <Plus className="h-4 w-4" />
            Adicionar primeiro membro
          </Button>
        </div>
      )}
    </div>
  );
};

// Componente para paginação
interface PaginationProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  hasNext: boolean;
  hasPrevious: boolean;
  onPageChange: (page: number) => void;
}

export const MembersPagination: React.FC<PaginationProps> = ({
  currentPage,
  totalItems,
  itemsPerPage,
  hasNext,
  hasPrevious,
  onPageChange,
}) => {
  return (
    <div className="flex items-center justify-between px-2 py-4">
      <div className="text-sm text-muted-foreground">
        Mostrando {Math.min(itemsPerPage, totalItems)} de {totalItems} membros
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!hasPrevious}
        >
          Anterior
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!hasNext}
        >
          Próximo
        </Button>
      </div>
    </div>
  );
}; 
