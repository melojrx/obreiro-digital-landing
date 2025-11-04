import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { CalendarIcon, FilterXIcon, SearchIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { ActivityFilters, PublicActivityFilters, ACTIVITY_TYPES } from '@/services/activityService';
import { Ministry, PublicMinistry } from '@/services/activityService';

interface ActivityFilterProps {
  filters: ActivityFilters | PublicActivityFilters;
  onFiltersChange: (filters: Partial<ActivityFilters | PublicActivityFilters>) => void;
  ministries?: Ministry[] | PublicMinistry[];
  branches?: Array<{ id: number; name: string }>;
  isPublic?: boolean;
  isLoading?: boolean;
  className?: string;
}

export const ActivityFilter: React.FC<ActivityFilterProps> = ({
  filters,
  onFiltersChange,
  ministries = [],
  branches = [],
  isPublic = false,
  isLoading = false,
  className,
}) => {
  const [startDate, setStartDate] = React.useState<Date | undefined>(
    filters.start_date ? new Date(filters.start_date) : undefined
  );
  const [endDate, setEndDate] = React.useState<Date | undefined>(
    filters.end_date ? new Date(filters.end_date) : undefined
  );
  const [showAdvanced, setShowAdvanced] = React.useState(false);

  // Handle date changes
  const handleStartDateChange = (date: Date | undefined) => {
    setStartDate(date);
    onFiltersChange({
      start_date: date ? date.toISOString() : undefined,
    });
  };

  const handleEndDateChange = (date: Date | undefined) => {
    setEndDate(date);
    onFiltersChange({
      end_date: date ? date.toISOString() : undefined,
    });
  };

  // Clear filters
  const clearFilters = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    onFiltersChange({
      ministry_id: undefined,
      branch_id: undefined,
      activity_type: undefined,
      start_date: undefined,
      end_date: undefined,
      is_public: undefined,
      is_active: undefined,
    });
  };

  // Count active filters
  const activeFiltersCount = Object.values(filters).filter(
    value => value !== undefined && value !== '' && value !== null
  ).length;

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <SearchIcon className="w-4 h-4" />
          Filtros
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {activeFiltersCount}
            </Badge>
          )}
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            {showAdvanced ? 'Básico' : 'Avançado'}
          </Button>
          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-muted-foreground"
            >
              <FilterXIcon className="w-4 h-4 mr-1" />
              Limpar
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Basic Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Ministry Filter */}
          {ministries.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="ministry">Ministério</Label>
              <Select
                value={filters.ministry_id?.toString() || ''}
                onValueChange={(value) => 
                  onFiltersChange({ ministry_id: value ? parseInt(value) : undefined })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os ministérios" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os ministérios</SelectItem>
                  {ministries.map((ministry) => (
                    <SelectItem key={ministry.id} value={ministry.id.toString()}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ 
                            backgroundColor: 'color' in ministry ? ministry.color : '#3b82f6'
                          }}
                        />
                        {ministry.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Branch Filter */}
          {!isPublic && branches.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="branch">Filial</Label>
              <Select
                value={filters.branch_id?.toString() || ''}
                onValueChange={(value) => 
                  onFiltersChange({ branch_id: value ? parseInt(value) : undefined })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas as congregações" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas as congregações</SelectItem>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id.toString()}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Date Range Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Data Inicial</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={handleStartDateChange}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>Data Final</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    !endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={handleEndDateChange}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Advanced Filters */}
        {showAdvanced && (
          <div className="space-y-4 pt-4 border-t">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Activity Type Filter */}
              <div className="space-y-2">
                <Label htmlFor="activity_type">Tipo de Atividade</Label>
                <Select
                  value={(filters as ActivityFilters).activity_type || ''}
                  onValueChange={(value) => 
                    onFiltersChange({ activity_type: value || undefined })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os tipos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos os tipos</SelectItem>
                    {Object.entries(ACTIVITY_TYPES).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Status Filters for internal views */}
              {!isPublic && (
                <div className="space-y-2">
                  <Label>Status</Label>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="is_active"
                        checked={(filters as ActivityFilters).is_active !== false}
                        onCheckedChange={(checked) => 
                          onFiltersChange({ is_active: checked ? undefined : false })
                        }
                      />
                      <Label htmlFor="is_active" className="text-sm">
                        Apenas ativas
                      </Label>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Date Presets */}
            <div className="space-y-2">
              <Label>Períodos Rápidos</Label>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const today = new Date();
                    handleStartDateChange(today);
                    handleEndDateChange(today);
                  }}
                >
                  Hoje
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const today = new Date();
                    const weekFromNow = new Date();
                    weekFromNow.setDate(today.getDate() + 7);
                    handleStartDateChange(today);
                    handleEndDateChange(weekFromNow);
                  }}
                >
                  Próximos 7 dias
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const today = new Date();
                    const monthFromNow = new Date();
                    monthFromNow.setMonth(today.getMonth() + 1);
                    handleStartDateChange(today);
                    handleEndDateChange(monthFromNow);
                  }}
                >
                  Próximos 30 dias
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ActivityFilter;