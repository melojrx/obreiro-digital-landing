import React, { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { 
  useActivities, 
  useUpcomingActivities, 
  useCreateActivity, 
  useUpdateActivity, 
  useDeleteActivity 
} from '@/hooks/useActivities';
import { useMinistries } from '@/hooks/useMinistries';
import { ActivityCalendar, ActivityFilter, ActivityForm } from '@/components/activities';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CalendarIcon, 
  PlusIcon, 
  ListIcon, 
  TrendingUpIcon,
  FilterIcon,
  SettingsIcon
} from 'lucide-react';
import { ActivityFilters, Activity, CreateActivityData } from '@/services/activityService';
import { toast } from 'sonner';

const ActivitiesPage: React.FC = () => {
  const { user, userChurch } = useAuth();
  const currentChurch = userChurch?.church;
  const [filters, setFilters] = useState<ActivityFilters>({
    church_id: currentChurch?.id,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState<'calendar' | 'upcoming' | 'manage'>('calendar');
  const [activityForm, setActivityForm] = useState<{
    isOpen: boolean;
    activity?: Activity;
  }>({ isOpen: false });

  // Queries
  const { data: activities = [], isLoading: activitiesLoading, error: activitiesError } = useActivities(filters);
  const { data: upcomingActivities = [], isLoading: upcomingLoading } = useUpcomingActivities();
  const { data: ministries = [], isLoading: ministriesLoading } = useMinistries({ 
    church_id: currentChurch?.id,
    is_active: true 
  });

  // Mutations
  const createActivityMutation = useCreateActivity();
  const updateActivityMutation = useUpdateActivity();
  const deleteActivityMutation = useDeleteActivity();

  // Mock branches data (você pode substituir por um hook real quando implementar)
  const branches = [
    { id: 1, name: 'Sede' },
    { id: 2, name: 'Filial Norte' },
    { id: 3, name: 'Filial Sul' },
  ];

  // Calculate stats
  const stats = useMemo(() => {
    console.log('🔍 ActivitiesPage - activities:', activities);
    console.log('🔍 ActivitiesPage - activities.length:', activities.length);
    console.log('🔍 ActivitiesPage - public activities:', activities.filter(a => a.is_public));
    
    const today = new Date();
    const thisWeek = new Date();
    thisWeek.setDate(today.getDate() + 7);
    
    const totalActivities = activities.length;
    const publicActivities = activities.filter(a => a.is_public).length;
    const thisWeekActivities = activities.filter(a => {
      const activityDate = new Date(a.start_datetime);
      return activityDate >= today && activityDate <= thisWeek;
    }).length;
    
    return {
      total: totalActivities,
      public: publicActivities,
      thisWeek: thisWeekActivities,
      ministries: ministries.length,
    };
  }, [activities, ministries]);

  // Handle filter changes
  const handleFiltersChange = (newFilters: Partial<ActivityFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  // Handle activity actions
  const handleCreateActivity = () => {
    setActivityForm({ isOpen: true });
  };

  const handleEditActivity = (activity: Activity) => {
    setActivityForm({ isOpen: true, activity });
  };

  const handleManageMinistries = () => {
    window.location.href = '/ministerios';
  };

  const handleActivityClick = (activity: Activity) => {
    handleEditActivity(activity);
  };

  const handleActivityFormSubmit = async (data: CreateActivityData) => {
    try {
      if (activityForm.activity) {
        // Editando atividade existente
        await updateActivityMutation.mutateAsync({
          id: activityForm.activity.id,
          data: data
        });
      } else {
        // Criando nova atividade
        await createActivityMutation.mutateAsync(data);
      }
      setActivityForm({ isOpen: false });
    } catch (error) {
      console.error('Erro ao salvar atividade:', error);
      // O toast de erro já é mostrado pelo hook
    }
  };

  const handleCloseActivityForm = () => {
    setActivityForm({ isOpen: false });
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <CalendarIcon className="h-8 w-8" />
              Atividades
            </h1>
            <p className="text-gray-600 mt-1">
              Gerencie eventos, cultos e atividades da sua igreja
            </p>
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
              variant="outline"
              size="sm"
              onClick={handleManageMinistries}
              className="flex items-center gap-2"
            >
              <SettingsIcon className="h-4 w-4" />
              Ministérios
            </Button>
            <Button
              onClick={handleCreateActivity}
              className="flex items-center gap-2"
            >
              <PlusIcon className="h-4 w-4" />
              Nova Atividade
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Total de Atividades
                  </p>
                  {activitiesLoading ? (
                    <Skeleton className="h-7 w-16 mt-1" />
                  ) : (
                    <p className="text-2xl font-bold">{stats.total}</p>
                  )}
                </div>
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Esta Semana
                  </p>
                  {activitiesLoading ? (
                    <Skeleton className="h-7 w-16 mt-1" />
                  ) : (
                    <p className="text-2xl font-bold text-green-600">{stats.thisWeek}</p>
                  )}
                </div>
                <TrendingUpIcon className="h-4 w-4 text-green-600" />
              </div>
            </CardContent>
          </Card>

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
                    <p className="text-2xl font-bold text-blue-600">{stats.public}</p>
                  )}
                </div>
                <Badge variant="outline" className="text-xs">
                  {stats.total > 0 ? Math.round((stats.public / stats.total) * 100) : 0}%
                </Badge>
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
                    <p className="text-2xl font-bold text-purple-600">{stats.ministries}</p>
                  )}
                </div>
                <SettingsIcon className="h-4 w-4 text-purple-600" />
              </div>
            </CardContent>
          </Card>
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

        {/* Filters */}
        {showFilters && (
          <ActivityFilter
            filters={filters}
            onFiltersChange={handleFiltersChange}
            ministries={ministries}
            isLoading={activitiesLoading || ministriesLoading}
          />
        )}

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              Calendário
            </TabsTrigger>
            <TabsTrigger value="upcoming" className="flex items-center gap-2">
              <ListIcon className="h-4 w-4" />
              Próximas
            </TabsTrigger>
            <TabsTrigger value="manage" className="flex items-center gap-2">
              <SettingsIcon className="h-4 w-4" />
              Gerenciar
            </TabsTrigger>
          </TabsList>

          <TabsContent value="calendar" className="mt-6">
            <ActivityCalendar
              activities={activities}
              isLoading={activitiesLoading}
              onActivityClick={handleActivityClick}
              filters={filters}
              onFiltersChange={handleFiltersChange}
              showFilters={false} // We have our own filter component
            />
          </TabsContent>

          <TabsContent value="upcoming" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ListIcon className="h-5 w-5" />
                  Próximas Atividades
                </CardTitle>
              </CardHeader>
              <CardContent>
                {upcomingLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map(i => (
                      <div key={i} className="flex items-center gap-4">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="space-y-2 flex-1">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-1/2" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : upcomingActivities.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                    <h3 className="text-lg font-medium mb-2">Nenhuma atividade próxima</h3>
                    <p className="text-sm">
                      Comece criando uma nova atividade para aparecer aqui
                    </p>
                    <Button
                      onClick={handleCreateActivity}
                      className="mt-4"
                      size="sm"
                    >
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Criar Primeira Atividade
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {upcomingActivities.map((activity) => (
                      <div
                        key={activity.id}
                        className="flex items-center gap-4 p-4 border rounded-lg hover:bg-accent/50 cursor-pointer transition-colors"
                        onClick={() => handleActivityClick(activity)}
                      >
                        <div className="flex-shrink-0">
                          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <CalendarIcon className="h-6 w-6 text-primary" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">
                            {activity.name}
                          </h4>
                          <div className="flex items-center gap-4 mt-1">
                            <p className="text-sm text-muted-foreground">
                              {activity.ministry_name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(activity.start_datetime).toLocaleDateString('pt-BR')}
                            </p>
                            {activity.participants_count > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                {activity.participants_count} inscritos
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="manage" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Gestão Rápida</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    onClick={handleCreateActivity}
                    className="w-full justify-start"
                    variant="outline"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Criar Nova Atividade
                  </Button>
                  <Button
                    onClick={handleManageMinistries}
                    className="w-full justify-start"
                    variant="outline"
                  >
                    <SettingsIcon className="h-4 w-4 mr-2" />
                    Gerenciar Ministérios
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Ministérios</CardTitle>
                </CardHeader>
                <CardContent>
                  {ministriesLoading ? (
                    <div className="space-y-2">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="flex items-center gap-2">
                          <Skeleton className="h-3 w-3 rounded-full" />
                          <Skeleton className="h-4 flex-1" />
                        </div>
                      ))}
                    </div>
                  ) : ministries.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground">
                      <p className="text-sm">Nenhum ministério encontrado</p>
                      <Button
                        onClick={handleManageMinistries}
                        size="sm"
                        variant="outline"
                        className="mt-2"
                      >
                        Criar Primeiro Ministério
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {ministries.map((ministry) => (
                        <div
                          key={ministry.id}
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50"
                        >
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: ministry.color }}
                          />
                          <div className="flex-1">
                            <p className="font-medium text-sm">{ministry.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {ministry.total_activities} atividades
                            </p>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {ministry.is_public ? 'Público' : 'Privado'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Activity Form Dialog */}
        <ActivityForm
          isOpen={activityForm.isOpen}
          onClose={handleCloseActivityForm}
          onSubmit={handleActivityFormSubmit}
          activity={activityForm.activity}
          ministries={ministries}
          branches={branches}
          isLoading={createActivityMutation.isPending || updateActivityMutation.isPending}
        />
      </div>
    </AppLayout>
  );
};

export default ActivitiesPage;