import React from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface VisitorFilters {
  search?: string;
  branch?: string;
  follow_up_status?: string;
  first_visit?: string;
  converted_to_member?: string;
}

interface VisitorsFiltersProps {
  filters: VisitorFilters;
  onFiltersChange: (filters: VisitorFilters) => void;
  loading?: boolean;
}

export const VisitorsFilters: React.FC<VisitorsFiltersProps> = ({
  filters,
  onFiltersChange,
  loading = false,
}) => {
  const [showAdvancedFilters, setShowAdvancedFilters] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState(filters.search || '');

  // Debounce search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (searchValue !== filters.search) {
        onFiltersChange({ ...filters, search: searchValue });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchValue]);

  const handleClearFilters = () => {
    setSearchValue('');
    onFiltersChange({});
    setShowAdvancedFilters(false);
  };

  const activeFiltersCount = Object.keys(filters).filter(
    key => filters[key as keyof VisitorFilters] && key !== 'page' && key !== 'per_page'
  ).length;

  return (
    <div className="space-y-4">
      {/* Barra de busca principal */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Buscar por nome, email ou telefone..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="pl-10"
            disabled={loading}
          />
        </div>
        <Button
          variant="outline"
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          className={showAdvancedFilters ? 'bg-gray-100' : ''}
        >
          <Filter className="h-4 w-4 mr-2" />
          Filtros
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </div>

      {/* Filtros avançados */}
      {showAdvancedFilters && (
        <div className="p-4 bg-gray-50 rounded-lg space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Status de Follow-up */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Status de Follow-up</label>
              <Select
                value={filters.follow_up_status || 'all'}
                onValueChange={(value) =>
                  onFiltersChange({
                    ...filters,
                    follow_up_status: value === 'all' ? undefined : value,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="contacted">Contatado</SelectItem>
                  <SelectItem value="interested">Interessado</SelectItem>
                  <SelectItem value="not_interested">Não Interessado</SelectItem>
                  <SelectItem value="converted">Convertido</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Primeira Visita */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Primeira Visita</label>
              <Select
                value={filters.first_visit || 'all'}
                onValueChange={(value) =>
                  onFiltersChange({
                    ...filters,
                    first_visit: value === 'all' ? undefined : value,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="true">Sim</SelectItem>
                  <SelectItem value="false">Não</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Convertido em Membro */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Convertido em Membro</label>
              <Select
                value={filters.converted_to_member || 'all'}
                onValueChange={(value) =>
                  onFiltersChange({
                    ...filters,
                    converted_to_member: value === 'all' ? undefined : value,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="true">Sim</SelectItem>
                  <SelectItem value="false">Não</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filial */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Filial</label>
              <Select
                value={filters.branch || 'all'}
                onValueChange={(value) =>
                  onFiltersChange({
                    ...filters,
                    branch: value === 'all' ? undefined : value,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Filiais</SelectItem>
                  {/* TODO: Carregar filiais dinamicamente */}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Botão limpar filtros */}
          {activeFiltersCount > 0 && (
            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="text-gray-600"
              >
                <X className="h-4 w-4 mr-2" />
                Limpar filtros
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Tags de filtros ativos */}
      {activeFiltersCount > 0 && !showAdvancedFilters && (
        <div className="flex flex-wrap gap-2">
          {filters.search && (
            <Badge variant="secondary" className="gap-1">
              Busca: {filters.search}
              <X
                className="h-3 w-3 ml-1 cursor-pointer"
                onClick={() => {
                  setSearchValue('');
                  onFiltersChange({ ...filters, search: undefined });
                }}
              />
            </Badge>
          )}
          {filters.follow_up_status && (
            <Badge variant="secondary" className="gap-1">
              Status: {filters.follow_up_status}
              <X
                className="h-3 w-3 ml-1 cursor-pointer"
                onClick={() => onFiltersChange({ ...filters, follow_up_status: undefined })}
              />
            </Badge>
          )}
          {filters.first_visit && (
            <Badge variant="secondary" className="gap-1">
              Primeira visita: {filters.first_visit === 'true' ? 'Sim' : 'Não'}
              <X
                className="h-3 w-3 ml-1 cursor-pointer"
                onClick={() => onFiltersChange({ ...filters, first_visit: undefined })}
              />
            </Badge>
          )}
          {filters.converted_to_member && (
            <Badge variant="secondary" className="gap-1">
              Convertido: {filters.converted_to_member === 'true' ? 'Sim' : 'Não'}
              <X
                className="h-3 w-3 ml-1 cursor-pointer"
                onClick={() => onFiltersChange({ ...filters, converted_to_member: undefined })}
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};