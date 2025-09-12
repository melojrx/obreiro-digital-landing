import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { CalendarIcon } from "lucide-react"
import { useUpcomingActivities } from "@/hooks/useActivities"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useNavigate } from "react-router-dom"
import { ACTIVITY_TYPES } from "@/services/activityService"

const getActivityTypeVariant = (type: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (type) {
        case 'worship': return 'default';
        case 'meeting': return 'secondary';
        case 'event': return 'outline';
        case 'prayer': return 'secondary';
        case 'study': return 'secondary';
        default: return 'outline';
    }
};

export function EventsTable() {
    const { data: upcomingActivities = [], isLoading } = useUpcomingActivities();
    const navigate = useNavigate();

    const handleViewAll = () => {
        navigate('/atividades');
    };

    if (isLoading) {
        return (
            <div className="space-y-6">
                <h3 className="text-lg font-semibold text-slate-800">Próximos Eventos</h3>
                <div className="border rounded-lg overflow-hidden">
                    <div className="p-4 space-y-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="flex items-center gap-4">
                                <div className="flex-1 space-y-2">
                                    <Skeleton className="h-4 w-3/4" />
                                    <Skeleton className="h-3 w-1/2" />
                                </div>
                                <Skeleton className="h-3 w-16" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    const events = upcomingActivities.slice(0, 10).map(activity => {
        const startDate = new Date(activity.start_datetime);
        return {
            id: activity.id,
            name: activity.name,
            type: ACTIVITY_TYPES[activity.activity_type as keyof typeof ACTIVITY_TYPES] || activity.activity_type,
            typeVariant: getActivityTypeVariant(activity.activity_type),
            date: format(startDate, "dd/MM/yyyy", { locale: ptBR }),
            time: format(startDate, "HH:mm"),
            location: activity.location || 'Local padrão',
            confirmed: activity.participants_count
        };
    });

    return (
        <div className="space-y-6">
            <h3 className="text-lg font-semibold text-slate-800">Próximos Eventos</h3>
            
            {events.length === 0 ? (
                <div className="border rounded-lg p-8 text-center">
                    <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                    <p className="text-slate-500 mb-2">Nenhum evento próximo</p>
                    <p className="text-sm text-slate-400">Crie uma nova atividade para aparecer aqui</p>
                </div>
            ) : (
                <>
                    {/* Layout Desktop (md+) */}
                    <div className="hidden md:block border rounded-lg overflow-hidden">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Evento</TableHead>
                                        <TableHead>Data</TableHead>
                                        <TableHead>Horário</TableHead>
                                        <TableHead>Local</TableHead>
                                        <TableHead className="text-right">Confirmados</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {events.map((event) => (
                                        <TableRow key={event.id} className="cursor-pointer hover:bg-slate-50" onClick={() => navigate('/atividades')}>
                                            <TableCell className="font-medium">
                                                <div className="flex flex-col">
                                                    <span>{event.name}</span>
                                                    <Badge variant={event.typeVariant} className="w-fit mt-1">{event.type}</Badge>
                                                </div>
                                            </TableCell>
                                            <TableCell>{event.date}</TableCell>
                                            <TableCell>{event.time}</TableCell>
                                            <TableCell>{event.location}</TableCell>
                                            <TableCell className="text-right">{event.confirmed}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>

                    {/* Layout Mobile (< md) */}
                    <div className="md:hidden space-y-3">
                        {events.map((event) => (
                            <div key={event.id} className="bg-white border rounded-lg p-4 space-y-3 cursor-pointer hover:bg-slate-50" onClick={() => navigate('/atividades')}>
                                {/* Event Header */}
                                <div className="flex flex-col space-y-2">
                                    <div className="flex items-start justify-between">
                                        <h4 className="font-medium text-gray-900 pr-2">{event.name}</h4>
                                        <Badge variant={event.typeVariant} className="text-xs">
                                            {event.type}
                                        </Badge>
                                    </div>
                                </div>

                                {/* Event Details Grid */}
                                <div className="grid grid-cols-1 xs:grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-gray-500 block">Data:</span>
                                        <span className="text-gray-900 font-medium">{event.date}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500 block">Horário:</span>
                                        <span className="text-gray-900 font-medium">{event.time}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500 block">Local:</span>
                                        <span className="text-gray-900 font-medium">{event.location}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500 block">Confirmados:</span>
                                        <span className="text-gray-900 font-medium">{event.confirmed}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
            
            <Button variant="outline" className="w-full" onClick={handleViewAll}>
                Ver todos os eventos
            </Button>
        </div>
    )
} 