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
            <div className="border rounded-lg">
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
             <Button variant="outline" className="w-full">
                Ver todos os eventos
            </Button>
        </div>
    )
} 