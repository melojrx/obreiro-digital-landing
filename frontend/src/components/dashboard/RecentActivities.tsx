import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarIcon } from "lucide-react";
import { useUpcomingActivities } from "@/hooks/useActivities";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

export function RecentActivities() {
    const { data: upcomingActivities = [], isLoading } = useUpcomingActivities();
    const navigate = useNavigate();

    const handleViewAll = () => {
        navigate('/atividades');
    };

    if (isLoading) {
        return (
            <div className="space-y-6">
                <h3 className="text-lg font-semibold text-slate-800">Próximos Eventos</h3>
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center gap-4 p-2">
                            <Skeleton className="h-10 w-10 rounded-full" />
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-4 w-3/4" />
                                <Skeleton className="h-3 w-1/2" />
                            </div>
                            <Skeleton className="h-3 w-16" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h3 className="text-lg font-semibold text-slate-800">Próximos Eventos</h3>
            <div className="space-y-4">
                {upcomingActivities.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                        <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                        <p className="text-sm">Nenhum evento próximo</p>
                        <p className="text-xs text-slate-400 mt-1">Crie uma nova atividade para aparecer aqui</p>
                    </div>
                ) : (
                    upcomingActivities.slice(0, 5).map((activity) => {
                        const startDate = new Date(activity.start_datetime);
                        const isToday = startDate.toDateString() === new Date().toDateString();
                        const isTomorrow = startDate.toDateString() === new Date(Date.now() + 86400000).toDateString();
                        
                        let timeText = format(startDate, "dd/MM 'às' HH:mm", { locale: ptBR });
                        if (isToday) timeText = `Hoje às ${format(startDate, "HH:mm")}`;
                        if (isTomorrow) timeText = `Amanhã às ${format(startDate, "HH:mm")}`;
                        
                        const initials = activity.name.split(' ').map(word => word[0]).join('').substring(0, 2).toUpperCase();
                        
                        return (
                            <div key={activity.id} className="flex items-center gap-4 p-2 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                                 onClick={() => navigate('/atividades')}>
                                <Avatar className="h-10 w-10">
                                    <AvatarFallback className="bg-blue-100 text-blue-600">{initials}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-slate-800">
                                        {activity.name}
                                    </p>
                                    <p className="text-sm text-slate-600">
                                        <span className="font-semibold">{activity.ministry_name}</span>
                                        {activity.participants_count > 0 && (
                                            <span className="ml-2 text-xs bg-slate-100 px-2 py-1 rounded">
                                                {activity.participants_count} inscritos
                                            </span>
                                        )}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-slate-400">{timeText}</p>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
            <Button variant="outline" className="w-full" onClick={handleViewAll}>
                Ver todas as atividades
            </Button>
        </div>
    );
} 