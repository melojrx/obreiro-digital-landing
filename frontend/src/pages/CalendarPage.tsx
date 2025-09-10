import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ActivityCalendar } from '@/components/activities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  CalendarIcon, 
  ChurchIcon, 
  MapPinIcon, 
  FilterIcon,
  ExternalLinkIcon,
  InfoIcon
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { usePublicActivities } from '@/hooks/useActivities';
import { usePublicMinistries } from '@/hooks/useMinistries';
import { PublicActivityFilters } from '@/services/activityService';
import { toast } from 'sonner';

const CalendarPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const churchId = searchParams.get('church_id');
  
  const [filters, setFilters] = useState<PublicActivityFilters>({
    church_id: churchId ? parseInt(churchId) : 0,
    start_date: new Date().toISOString(),
    end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // Próximos 30 dias
  });

  const [showFilters, setShowFilters] = useState(false);

  // Queries
  const { 
    data: activities = [], 
    isLoading: activitiesLoading, 
    error: activitiesError 
  } = usePublicActivities(filters);
  
  const { 
    data: ministries = [], 
    isLoading: ministriesLoading 
  } = usePublicMinistries(filters.church_id);

  // Atualizar filtros quando church_id mudar na URL
  useEffect(() => {
    if (churchId) {
      setFilters(prev => ({
        ...prev,
        church_id: parseInt(churchId)
      }));
    }
  }, [churchId]);

  // Handle filter changes
  const handleFiltersChange = (newFilters: Partial<PublicActivityFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  // Handle activity click
  const handleActivityClick = (activity: any) => {
    toast.info(`${activity.name} - ${activity.ministry_name}`);
  };

  // Get church info from URL params or activities
  const churchName = searchParams.get('church_name') || 'Igreja';
  const churchAddress = searchParams.get('church_address');

  if (!churchId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <InfoIcon className="h-12 w-12 text-blue-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Parâmetros Necessários</h2>
            <p className="text-muted-foreground">
              Para visualizar o calendário, é necessário especificar o ID da igreja na URL.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Exemplo: /calendario?church_id=1&church_name=Minha%20Igreja
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      {/* Header */}
      <div className="bg-white border-b border-blue-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <ChurchIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                      Calendário de Atividades
                    </h1>
                    <p className="text-lg text-blue-600 font-medium">
                      {churchName}
                    </p>
                  </div>
                </div>
                {churchAddress && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPinIcon className="h-4 w-4" />
                    <span className="text-sm">{churchAddress}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2"
                >
                  <FilterIcon className="h-4 w-4" />
                  {showFilters ? 'Ocultar Filtros' : 'Filtros'}
                </Button>
                
                <Button
                  size="sm"
                  onClick={() => window.open('/', '_blank')}
                  className="flex items-center gap-2"
                >
                  <ExternalLinkIcon className="h-4 w-4" />
                  Visitar Site
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Stats and Filters */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Stats */}
            <div className="lg:col-span-3 grid grid-cols-2 sm:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Atividades Públicas
                      </p>
                      {activitiesLoading ? (
                        <Skeleton className="h-7 w-16 mt-1" />
                      ) : (
                        <p className="text-2xl font-bold text-blue-600">
                          {activities.length}
                        </p>
                      )}
                    </div>
                    <CalendarIcon className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Ministérios Ativos
                      </p>
                      {ministriesLoading ? (
                        <Skeleton className="h-7 w-16 mt-1" />
                      ) : (
                        <p className="text-2xl font-bold text-green-600">
                          {ministries.length}
                        </p>
                      )}
                    </div>
                    <ChurchIcon className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Próximos 7 dias
                      </p>
                      {activitiesLoading ? (
                        <Skeleton className="h-7 w-16 mt-1" />
                      ) : (
                        <p className="text-2xl font-bold text-purple-600">
                          {activities.filter(activity => {
                            const activityDate = new Date(activity.start_datetime);
                            const weekFromNow = new Date();
                            weekFromNow.setDate(weekFromNow.getDate() + 7);
                            return activityDate <= weekFromNow;
                          }).length}
                        </p>
                      )}
                    </div>
                    <CalendarIcon className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Ministry Filter */}
            {ministries.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Filtrar por Ministério</CardTitle>
                </CardHeader>
                <CardContent>
                  <Select
                    value={filters.ministry_id?.toString() || ''}
                    onValueChange={(value) => 
                      handleFiltersChange({ 
                        ministry_id: value ? parseInt(value) : undefined 
                      })
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
                              style={{ backgroundColor: ministry.color }}
                            />
                            {ministry.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Error State */}
          {activitiesError && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <p className="text-red-800">
                  Erro ao carregar atividades: {(activitiesError as any)?.message || 'Erro desconhecido'}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Calendar */}
          {activitiesLoading ? (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-7 gap-2">
                    {Array.from({ length: 35 }).map((_, i) => (
                      <Skeleton key={i} className="h-10" />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : activities.length === 0 ? (
            <Card>
              <CardContent className="pt-12 pb-12">
                <div className="text-center">
                  <CalendarIcon className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-muted-foreground mb-2">
                    Nenhuma atividade pública encontrada
                  </h3>
                  <p className="text-muted-foreground">
                    Esta igreja ainda não publicou atividades em seu calendário público.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <ActivityCalendar
              activities={activities}
              isLoading={activitiesLoading}
              isPublic={true}
              onActivityClick={handleActivityClick}
              className="bg-white rounded-lg shadow-sm"
            />
          )}

          {/* Ministry Legend */}
          {ministries.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Ministérios</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {ministries.map((ministry) => (
                    <Badge
                      key={ministry.id}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: ministry.color }}
                      />
                      {ministry.name}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Footer */}
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-sm text-muted-foreground">
                <p>
                  Calendário público de atividades da {churchName}
                </p>
                <p className="mt-1">
                  Última atualização: {format(new Date(), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CalendarPage;