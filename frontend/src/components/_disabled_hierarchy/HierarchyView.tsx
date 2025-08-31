/**
 * Componente de Visualização Hierárquica
 * Exibe a estrutura denominação → igreja → filiais de forma visual
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { cn } from '@/lib/utils';
import {
  ChevronRight,
  ChevronDown,
  Home,
  Building2,
  Building,
  MapPin,
  Users,
  Eye,
  Settings,
  Plus,
  Search,
  Filter,
} from 'lucide-react';
import {
  DenominationDetails,
  ChurchDetails,
  BranchDetails,
  HierarchyLevel,
  HierarchyPath,
} from '@/types/hierarchy';

// Tipos para os itens da hierarquia
interface HierarchyItem {
  id: number;
  name: string;
  type: 'denomination' | 'church' | 'branch';
  level: number;
  parent_id?: number;
  children?: HierarchyItem[];
  stats?: {
    members: number;
    visitors: number;
    activities: number;
  };
  is_expanded?: boolean;
  is_active: boolean;
  location?: string;
  manager?: string;
}

interface HierarchyViewProps {
  // Dados da hierarquia
  rootItems: HierarchyItem[];
  currentPath?: HierarchyPath;
  
  // Estados visuais
  variant?: 'tree' | 'list' | 'cards' | 'breadcrumb';
  size?: 'sm' | 'md' | 'lg';
  showStats?: boolean;
  showActions?: boolean;
  showSearch?: boolean;
  
  // Interações
  onItemClick?: (item: HierarchyItem) => void;
  onItemExpand?: (item: HierarchyItem) => void;
  onItemCollapse?: (item: HierarchyItem) => void;
  onNavigate?: (level: HierarchyLevel) => void;
  onAdd?: (parentItem: HierarchyItem) => void;
  onEdit?: (item: HierarchyItem) => void;
  onView?: (item: HierarchyItem) => void;
  onManage?: (item: HierarchyItem) => void;
  
  // Permissões
  canAdd?: (parentItem: HierarchyItem) => boolean;
  canEdit?: (item: HierarchyItem) => boolean;
  canManage?: (item: HierarchyItem) => boolean;
  
  // Filtros e busca
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  filters?: {
    show_inactive?: boolean;
    location_filter?: string;
    type_filter?: 'all' | 'denomination' | 'church' | 'branch';
  };
  
  // Customização
  className?: string;
  maxHeight?: string;
  isLoading?: boolean;
}

// Ícone baseado no tipo
const getTypeIcon = (type: HierarchyItem['type'], size = 'h-4 w-4') => {
  switch (type) {
    case 'denomination':
      return <Building2 className={cn(size, 'text-purple-600')} />;
    case 'church':
      return <Building className={cn(size, 'text-blue-600')} />;
    case 'branch':
      return <MapPin className={cn(size, 'text-green-600')} />;
    default:
      return <Building className={size} />;
  }
};

// Helper para cor do tipo
const getTypeColor = (type: HierarchyItem['type']) => {
  switch (type) {
    case 'denomination':
      return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'church':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'branch':
      return 'bg-green-50 text-green-700 border-green-200';
    default:
      return 'bg-gray-50 text-gray-700 border-gray-200';
  }
};

// Componente de item da árvore
interface TreeItemProps {
  item: HierarchyItem;
  level: number;
  onItemClick?: (item: HierarchyItem) => void;
  onItemExpand?: (item: HierarchyItem) => void;
  onItemCollapse?: (item: HierarchyItem) => void;
  onAdd?: (parentItem: HierarchyItem) => void;
  onEdit?: (item: HierarchyItem) => void;
  onView?: (item: HierarchyItem) => void;
  canAdd?: (item: HierarchyItem) => boolean;
  canEdit?: (item: HierarchyItem) => boolean;
  showStats?: boolean;
  showActions?: boolean;
}

const TreeItem: React.FC<TreeItemProps> = ({
  item,
  level,
  onItemClick,
  onItemExpand,
  onItemCollapse,
  onAdd,
  onEdit,
  onView,
  canAdd,
  canEdit,
  showStats = true,
  showActions = true,
}) => {
  const hasChildren = item.children && item.children.length > 0;
  const paddingLeft = `${level * 1.5}rem`;

  return (
    <div className="select-none">
      <div 
        className={cn(
          'flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors',
          !item.is_active && 'opacity-50'
        )}
        style={{ paddingLeft }}
      >
        {/* Expandir/Recolher */}
        <div className="w-4 h-4 flex items-center justify-center">
          {hasChildren && (
            <Button
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0"
              onClick={() => {
                if (item.is_expanded) {
                  onItemCollapse?.(item);
                } else {
                  onItemExpand?.(item);
                }
              }}
            >
              {item.is_expanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </Button>
          )}
        </div>

        {/* Ícone do tipo */}
        {getTypeIcon(item.type)}

        {/* Conteúdo principal */}
        <div 
          className="flex-1 flex items-center gap-2 cursor-pointer"
          onClick={() => onItemClick?.(item)}
        >
          <span className="font-medium">{item.name}</span>
          
          {!item.is_active && (
            <Badge variant="secondary" size="sm">
              Inativo
            </Badge>
          )}
        </div>

        {/* Estatísticas */}
        {showStats && item.stats && (
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              <span>{item.stats.members}</span>
            </div>
            {item.stats.visitors > 0 && (
              <div className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                <span>{item.stats.visitors}</span>
              </div>
            )}
          </div>
        )}

        {/* Ações */}
        {showActions && (
          <div className="flex items-center gap-1">
            {onView && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  onView(item);
                }}
              >
                <Eye className="h-3 w-3" />
              </Button>
            )}
            
            {canEdit?.(item) && onEdit && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(item);
                }}
              >
                <Settings className="h-3 w-3" />
              </Button>
            )}
            
            {canAdd?.(item) && onAdd && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  onAdd(item);
                }}
              >
                <Plus className="h-3 w-3" />
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Filhos */}
      {hasChildren && item.is_expanded && (
        <div className="mt-1">
          {item.children!.map((child) => (
            <TreeItem
              key={child.id}
              item={child}
              level={level + 1}
              onItemClick={onItemClick}
              onItemExpand={onItemExpand}
              onItemCollapse={onItemCollapse}
              onAdd={onAdd}
              onEdit={onEdit}
              onView={onView}
              canAdd={canAdd}
              canEdit={canEdit}
              showStats={showStats}
              showActions={showActions}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const HierarchyView: React.FC<HierarchyViewProps> = ({
  rootItems,
  currentPath,
  variant = 'tree',
  size = 'md',
  showStats = true,
  showActions = true,
  showSearch = true,
  onItemClick,
  onItemExpand,
  onItemCollapse,
  onNavigate,
  onAdd,
  onEdit,
  onView,
  onManage,
  canAdd,
  canEdit,
  canManage,
  searchQuery = '',
  onSearchChange,
  filters = {},
  className,
  maxHeight = '500px',
  isLoading = false,
}) => {
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);

  // Filtrar itens baseado na busca e filtros
  const filterItems = (items: HierarchyItem[]): HierarchyItem[] => {
    return items
      .filter(item => {
        // Filtro de busca
        const matchesSearch = !localSearchQuery || 
          item.name.toLowerCase().includes(localSearchQuery.toLowerCase()) ||
          item.location?.toLowerCase().includes(localSearchQuery.toLowerCase());
        
        // Filtro de tipo
        const matchesType = !filters.type_filter || 
          filters.type_filter === 'all' || 
          item.type === filters.type_filter;
        
        // Filtro de ativos/inativos
        const matchesActive = filters.show_inactive || item.is_active;
        
        return matchesSearch && matchesType && matchesActive;
      })
      .map(item => ({
        ...item,
        children: item.children ? filterItems(item.children) : undefined,
      }));
  };

  const filteredItems = filterItems(rootItems);

  // Renderização baseada na variante
  const renderContent = () => {
    switch (variant) {
      case 'breadcrumb':
        return renderBreadcrumbVariant();
      case 'list':
        return renderListVariant();
      case 'cards':
        return renderCardsVariant();
      default:
        return renderTreeVariant();
    }
  };

  // Variante árvore (padrão)
  const renderTreeVariant = () => (
    <div className="space-y-1">
      {filteredItems.map((item) => (
        <TreeItem
          key={item.id}
          item={item}
          level={0}
          onItemClick={onItemClick}
          onItemExpand={onItemExpand}
          onItemCollapse={onItemCollapse}
          onAdd={onAdd}
          onEdit={onEdit}
          onView={onView}
          canAdd={canAdd}
          canEdit={canEdit}
          showStats={showStats}
          showActions={showActions}
        />
      ))}
    </div>
  );

  // Variante breadcrumb
  const renderBreadcrumbVariant = () => (
    <div className="space-y-4">
      {currentPath && (
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigate?.({ type: 'denomination', id: 0, name: 'Raiz', can_manage: false })}
              >
                <Home className="h-4 w-4" />
              </Button>
            </BreadcrumbItem>
            
            {currentPath.levels.map((level, index) => (
              <React.Fragment key={level.id}>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  {index === currentPath.levels.length - 1 ? (
                    <BreadcrumbPage>{level.name}</BreadcrumbPage>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onNavigate?.(level)}
                    >
                      {getTypeIcon(level.type)}
                      {level.name}
                    </Button>
                  )}
                </BreadcrumbItem>
              </React.Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map((item) => (
          <Card key={item.id} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                {getTypeIcon(item.type, 'h-6 w-6')}
                <div className="flex-1">
                  <h4 className="font-medium">{item.name}</h4>
                  {item.location && (
                    <p className="text-sm text-muted-foreground">{item.location}</p>
                  )}
                  {showStats && item.stats && (
                    <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                      <span>{item.stats.members} membros</span>
                      {item.stats.visitors > 0 && (
                        <span>{item.stats.visitors} visitantes</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  // Variante lista
  const renderListVariant = () => (
    <div className="space-y-2">
      {filteredItems.map((item) => (
        <Card key={item.id} className="hover:shadow-sm transition-shadow">
          <CardContent className="p-3">
            <div className="flex items-center gap-3">
              {getTypeIcon(item.type)}
              <div className="flex-1">
                <div className="font-medium">{item.name}</div>
                {item.location && (
                  <div className="text-sm text-muted-foreground">{item.location}</div>
                )}
              </div>
              
              <Badge variant="outline" className={getTypeColor(item.type)}>
                {item.type === 'denomination' ? 'Denominação' : 
                 item.type === 'church' ? 'Igreja' : 'Filial'}
              </Badge>
              
              {showStats && item.stats && (
                <div className="text-sm text-muted-foreground">
                  {item.stats.members} membros
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  // Variante cards
  const renderCardsVariant = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {filteredItems.map((item) => (
        <Card key={item.id} className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              {getTypeIcon(item.type)}
              <CardTitle className="text-lg">{item.name}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {item.location && (
              <p className="text-sm text-muted-foreground mb-3">{item.location}</p>
            )}
            
            {showStats && item.stats && (
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="bg-blue-50 p-2 rounded-lg">
                  <div className="text-lg font-semibold text-blue-600">
                    {item.stats.members}
                  </div>
                  <div className="text-xs text-blue-600">Membros</div>
                </div>
                <div className="bg-green-50 p-2 rounded-lg">
                  <div className="text-lg font-semibold text-green-600">
                    {item.stats.visitors}
                  </div>
                  <div className="text-xs text-green-600">Visitantes</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-4 h-4 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 bg-gray-200 rounded flex-1 animate-pulse" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      {showSearch && (
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar na hierarquia..."
                className="w-full pl-8 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={localSearchQuery}
                onChange={(e) => {
                  setLocalSearchQuery(e.target.value);
                  onSearchChange?.(e.target.value);
                }}
              />
            </div>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-1" />
              Filtros
            </Button>
          </div>
        </CardHeader>
      )}
      
      <CardContent className="p-4">
        <ScrollArea className="w-full" style={{ maxHeight }}>
          {renderContent()}
          
          {filteredItems.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Nenhum item encontrado</p>
              {localSearchQuery && (
                <p className="text-sm">Tente ajustar os filtros de busca</p>
              )}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};