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

const events = [
    {
        name: 'Culto de Domingo',
        type: 'Culto',
        typeVariant: 'default',
        date: '18/06/2025',
        time: '10:00',
        location: 'Templo Principal',
        confirmed: 35
    },
    {
        name: 'Culto de Jovens',
        type: 'Culto',
        typeVariant: 'default',
        date: '22/06/2025',
        time: '19:00',
        location: 'Salão Multiuso',
        confirmed: 18
    },
    {
        name: 'Reunião de Líderes',
        type: 'Reunião',
        typeVariant: 'secondary',
        date: '24/06/2025',
        time: '20:00',
        location: 'Sala de Reuniões',
        confirmed: 8
    },
    {
        name: 'Festa Junina',
        type: 'Evento',
        typeVariant: 'outline',
        date: '29/06/2025',
        time: '18:00',
        location: 'Pátio da Igreja',
        confirmed: 45
    },
]

export function EventsTable() {
    return (
        <div className="space-y-6">
            <h3 className="text-lg font-semibold text-slate-800">Próximos Eventos</h3>
            
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
                                <TableRow key={event.name}>
                                    <TableCell className="font-medium">
                                        <div className="flex flex-col">
                                            <span>{event.name}</span>
                                            <Badge variant={event.typeVariant as "default" | "secondary" | "destructive" | "outline"} className="w-fit mt-1">{event.type}</Badge>
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
                    <div key={event.name} className="bg-white border rounded-lg p-4 space-y-3">
                        {/* Event Header */}
                        <div className="flex flex-col space-y-2">
                            <div className="flex items-start justify-between">
                                <h4 className="font-medium text-gray-900 pr-2">{event.name}</h4>
                                <Badge variant={event.typeVariant as "default" | "secondary" | "destructive" | "outline"} className="text-xs">
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
            
            <Button variant="outline" className="w-full">
                Ver todos os eventos
            </Button>
        </div>
    )
} 