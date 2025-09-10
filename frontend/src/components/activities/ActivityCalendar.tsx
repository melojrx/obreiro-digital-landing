import React, { useState, useMemo } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  CalendarIcon, 
  ClockIcon, 
  MapPinIcon, 
  UsersIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FilterIcon
} from 'lucide-react';
import { format, isSameDay, startOfMonth, endOfMonth, parseISO, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Activity, PublicActivity, ActivityFilters, PublicActivityFilters } from '@/services/activityService';
import { cn } from '@/lib/utils';

interface ActivityCalendarProps {
  activities: Activity[] | PublicActivity[];
  isLoading?: boolean;
  isPublic?: boolean;
  onActivityClick?: (activity: Activity | PublicActivity) => void;
  onDateSelect?: (date: Date) => void;
  filters?: ActivityFilters | PublicActivityFilters;
  onFiltersChange?: (filters: Partial<ActivityFilters | PublicActivityFilters>) => void;
  showFilters?: boolean;
  className?: string;
}

export const ActivityCalendar: React.FC<ActivityCalendarProps> = ({
  activities = [],
  isLoading = false,
  isPublic = false,
  onActivityClick,
  onDateSelect,
  filters = {},
  onFiltersChange,
  showFilters = true,
  className,
}) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [detailsDialog, setDetailsDialog] = useState<{
    isOpen: boolean;
    activity: Activity | PublicActivity | null;
  }>({ isOpen: false, activity: null });

  // Current month for navigation
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Get activities for selected date
  const selectedDateActivities = useMemo(() => {
    return activities.filter(activity => 
      isSameDay(parseISO(activity.start_datetime), selectedDate)
    );
  }, [activities, selectedDate]);

  // Get activities for current month with colors
  const monthActivities = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    
    return activities.filter(activity => {
      const activityDate = parseISO(activity.start_datetime);
      return activityDate >= monthStart && activityDate <= monthEnd;
    });
  }, [activities, currentMonth]);

  // Group activities by date
  const activitiesByDate = useMemo(() => {
    const grouped: Record<string, (Activity | PublicActivity)[]> = {};
    
    monthActivities.forEach(activity => {
      const dateKey = format(parseISO(activity.start_datetime), 'yyyy-MM-dd');
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(activity);
    });
    
    return grouped;
  }, [monthActivities]);

  // Handle date selection
  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      onDateSelect?.(date);
    }
  };

  // Handle activity click
  const handleActivityClick = (activity: Activity | PublicActivity) => {
    if (onActivityClick) {
      onActivityClick(activity);
    } else {
      setDetailsDialog({ isOpen: true, activity });
    }
  };

  // Navigate month
  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(current => 
      direction === 'prev' ? subMonths(current, 1) : addMonths(current, 1)
    );
  };

  // Format time
  const formatTime = (datetime: string) => {
    return format(parseISO(datetime), 'HH:mm', { locale: ptBR });
  };

  // Get ministry color
  const getMinistryColor = (activity: Activity | PublicActivity) => {
    if ('ministry_color' in activity) {
      return activity.ministry_color;
    }
    return '#3b82f6'; // fallback color
  };

  // Custom day content for calendar
  const renderDayContent = (date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    const dayActivities = activitiesByDate[dateKey] || [];
    
    return (
      <div className="relative w-full h-full">
        <div className="flex items-center justify-center h-8">
          {date.getDate()}
        </div>
        {dayActivities.length > 0 && (
          <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 flex gap-0.5">
            {dayActivities.slice(0, 3).map((activity, index) => (
              <div
                key={index}
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: getMinistryColor(activity) }}
              />
            ))}
            {dayActivities.length > 3 && (
              <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header with controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode('calendar')}
            className={cn(viewMode === 'calendar' && 'bg-primary text-primary-foreground')}
          >
            <CalendarIcon className="w-4 h-4 mr-2" />
            Calendário
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode('list')}
            className={cn(viewMode === 'list' && 'bg-primary text-primary-foreground')}
          >
            Lista
          </Button>
        </div>

        {showFilters && onFiltersChange && (
          <Button variant="outline" size="sm">
            <FilterIcon className="w-4 h-4 mr-2" />
            Filtros
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar View */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-lg">
                {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
              </CardTitle>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateMonth('prev')}
                >
                  <ChevronLeftIcon className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateMonth('next')}
                >
                  <ChevronRightIcon className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {viewMode === 'calendar' ? (
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  month={currentMonth}
                  onMonthChange={setCurrentMonth}
                  className="w-full"
                  modifiers={{
                    hasActivities: (date) => {
                      const dateKey = format(date, 'yyyy-MM-dd');
                      return (activitiesByDate[dateKey]?.length || 0) > 0;
                    }
                  }}
                  modifiersStyles={{
                    hasActivities: {
                      fontWeight: 'bold',
                    }
                  }}
                />
              ) : (
                <ScrollArea className="h-96">
                  <div className="space-y-2">
                    {monthActivities.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        Nenhuma atividade encontrada para este mês
                      </div>
                    ) : (
                      monthActivities.map((activity) => (
                        <div
                          key={activity.id}
                          className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-accent/50 transition-colors"
                          onClick={() => handleActivityClick(activity)}
                        >
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: getMinistryColor(activity) }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{activity.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {activity.ministry_name} • {formatTime(activity.start_datetime)}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {format(parseISO(activity.start_datetime), 'dd/MM')}
                          </Badge>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Selected Date Activities */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-80">
                {selectedDateActivities.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhuma atividade para esta data
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedDateActivities.map((activity) => (
                      <div
                        key={activity.id}
                        className="p-3 border rounded-lg cursor-pointer hover:bg-accent/50 transition-colors"
                        onClick={() => handleActivityClick(activity)}
                      >
                        <div className="flex items-start gap-2">
                          <div
                            className="w-3 h-3 rounded-full mt-1 flex-shrink-0"
                            style={{ backgroundColor: getMinistryColor(activity) }}
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm leading-tight mb-1">
                              {activity.name}
                            </h4>
                            <p className="text-xs text-muted-foreground mb-2">
                              {activity.ministry_name}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <ClockIcon className="w-3 h-3" />
                                {formatTime(activity.start_datetime)} - {formatTime(activity.end_datetime)}
                              </span>
                            </div>
                            {activity.location && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                <MapPinIcon className="w-3 h-3" />
                                {activity.location}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Activity Details Dialog */}
      <Dialog 
        open={detailsDialog.isOpen} 
        onOpenChange={(open) => setDetailsDialog({ isOpen: open, activity: null })}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{detailsDialog.activity?.name}</DialogTitle>
          </DialogHeader>
          {detailsDialog.activity && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: getMinistryColor(detailsDialog.activity) }}
                />
                <span className="font-medium">{detailsDialog.activity.ministry_name}</span>
              </div>

              {detailsDialog.activity.description && (
                <div>
                  <h4 className="font-medium mb-1">Descrição</h4>
                  <p className="text-sm text-muted-foreground">
                    {detailsDialog.activity.description}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <CalendarIcon className="w-4 h-4" />
                  <span>
                    {format(parseISO(detailsDialog.activity.start_datetime), 'dd/MM/yyyy', { locale: ptBR })}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <ClockIcon className="w-4 h-4" />
                  <span>
                    {formatTime(detailsDialog.activity.start_datetime)} - {formatTime(detailsDialog.activity.end_datetime)}
                  </span>
                </div>

                {detailsDialog.activity.location && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPinIcon className="w-4 h-4" />
                    <span>{detailsDialog.activity.location}</span>
                  </div>
                )}

                {'participants_count' in detailsDialog.activity && (
                  <div className="flex items-center gap-2 text-sm">
                    <UsersIcon className="w-4 h-4" />
                    <span>
                      {detailsDialog.activity.participants_count} participante(s)
                      {detailsDialog.activity.max_participants && 
                        ` de ${detailsDialog.activity.max_participants}`
                      }
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {detailsDialog.activity.activity_type_display}
                </Badge>
                {'branch_name' in detailsDialog.activity && (
                  <Badge variant="secondary">
                    {detailsDialog.activity.branch_name}
                  </Badge>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ActivityCalendar;