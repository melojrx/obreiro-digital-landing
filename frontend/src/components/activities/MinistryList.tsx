import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { MinistryCard } from './MinistryCard';
import { 
  PlusIcon, 
  SearchIcon, 
  FilterIcon, 
  SortAscIcon,
  SortDescIcon,
  ChurchIcon,
  EyeIcon,
  EyeOffIcon
} from 'lucide-react';
import { Ministry } from '@/services/activityService';

interface MinistryListProps {
  ministries: Ministry[];
  isLoading?: boolean;
  onCreateNew: () => void;
  onEdit: (ministry: Ministry) => void;
  onDelete: (ministry: Ministry) => void;
  onViewActivities: (ministry: Ministry) => void;
}

type SortOption = 'name' | 'created_at' | 'total_activities' | 'total_members';
type SortDirection = 'asc' | 'desc';
type FilterOption = 'all' | 'active' | 'inactive' | 'public' | 'private' | 'with_leader' | 'without_leader';

export const MinistryList: React.FC<MinistryListProps> = ({
  ministries,
  isLoading = false,
  onCreateNew,
  onEdit,
  onDelete,
  onViewActivities,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [filter, setFilter] = useState<FilterOption>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Função para filtrar ministérios
  const filteredMinistries = ministries.filter((ministry) => {
    // Filtro de busca por nome ou descrição
    const matchesSearch = 
      ministry.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ministry.description && ministry.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (ministry.leader_name && ministry.leader_name.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    // Filtros específicos
    switch (filter) {
      case 'active':
        return ministry.is_active;
      case 'inactive':
        return !ministry.is_active;
      case 'public':
        return ministry.is_public;
      case 'private':
        return !ministry.is_public;
      case 'with_leader':
        return ministry.leader_name && ministry.leader_name.trim() !== '';
      case 'without_leader':
        return !ministry.leader_name || ministry.leader_name.trim() === '';
      default:
        return true;
    }
  });

  // Função para ordenar ministérios
  const sortedMinistries = [...filteredMinistries].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'created_at':
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        break;
      case 'total_activities':
        comparison = a.total_activities - b.total_activities;
        break;
      case 'total_members':
        comparison = a.total_members - b.total_members;
        break;
    }

    return sortDirection === 'asc' ? comparison : -comparison;
  });

  // Função para alternar direção de ordenação
  const toggleSortDirection = () => {
    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  // Estatísticas dos ministérios
  const stats = {
    total: ministries.length,
    active: ministries.filter(m => m.is_active).length,
    public: ministries.filter(m => m.is_public).length,
    withLeader: ministries.filter(m => m.leader_name).length,
  };

  return (
    <div className="space-y-6">
      {/* Header com estatísticas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total
                </p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <ChurchIcon className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Ativos
                </p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
              <div className="text-green-600">
                <ChurchIcon className="h-8 w-8" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Públicos
                </p>
                <p className="text-2xl font-bold text-purple-600">{stats.public}</p>
              </div>
              <EyeIcon className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Com Líder
                </p>
                <p className="text-2xl font-bold text-orange-600">{stats.withLeader}</p>
              </div>
              <div className="text-orange-600">
                <ChurchIcon className="h-8 w-8" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controles */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="flex items-center gap-2">
              <ChurchIcon className="h-5 w-5" />
              Ministérios
              <Badge variant="secondary">{sortedMinistries.length}</Badge>
            </CardTitle>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <FilterIcon className="h-4 w-4 mr-2" />
                {showFilters ? 'Ocultar' : 'Filtros'}
              </Button>
              <Button onClick={onCreateNew}>
                <PlusIcon className="h-4 w-4 mr-2" />
                Novo Ministério
              </Button>
            </div>
          </div>

          {/* Controles de busca e ordenação */}
          <div className="space-y-4">
            {/* Busca */}
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar por nome, descrição ou líder..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filtros avançados */}
            {showFilters && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    Filtrar por
                  </label>
                  <Select value={filter} onValueChange={(value) => setFilter(value as FilterOption)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os ministérios</SelectItem>
                      <SelectItem value="active">Apenas ativos</SelectItem>
                      <SelectItem value="inactive">Apenas inativos</SelectItem>
                      <SelectItem value="public">Apenas públicos</SelectItem>
                      <SelectItem value="private">Apenas privados</SelectItem>
                      <SelectItem value="with_leader">Com líder</SelectItem>
                      <SelectItem value="without_leader">Sem líder</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    Ordenar por
                  </label>
                  <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Nome</SelectItem>
                      <SelectItem value="created_at">Data de criação</SelectItem>
                      <SelectItem value="total_activities">Número de atividades</SelectItem>
                      <SelectItem value="total_members">Número de membros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    Direção
                  </label>
                  <Button
                    variant="outline"
                    onClick={toggleSortDirection}
                    className="w-full justify-start"
                  >
                    {sortDirection === 'asc' ? (
                      <>
                        <SortAscIcon className="h-4 w-4 mr-2" />
                        Crescente
                      </>
                    ) : (
                      <>
                        <SortDescIcon className="h-4 w-4 mr-2" />
                        Decrescente
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {/* Lista de ministérios */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i}>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <Skeleton className="h-12 w-12 rounded-lg" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-5 w-3/4" />
                          <Skeleton className="h-4 w-1/2" />
                          <Skeleton className="h-4 w-full" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <Skeleton className="h-16 rounded-lg" />
                        <Skeleton className="h-16 rounded-lg" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : sortedMinistries.length === 0 ? (
            <div className="text-center py-12">
              <ChurchIcon className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                {searchTerm || filter !== 'all' 
                  ? 'Nenhum ministério encontrado' 
                  : 'Nenhum ministério cadastrado'
                }
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || filter !== 'all'
                  ? 'Tente ajustar os filtros de busca'
                  : 'Comece criando o primeiro ministério da sua igreja'
                }
              </p>
              {(!searchTerm && filter === 'all') && (
                <Button onClick={onCreateNew}>
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Criar Primeiro Ministério
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedMinistries.map((ministry) => (
                <MinistryCard
                  key={ministry.id}
                  ministry={ministry}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onViewActivities={onViewActivities}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MinistryList;