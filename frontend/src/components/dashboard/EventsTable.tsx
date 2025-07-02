import React from 'react';
import { Calendar, MapPin, Users } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Event {
  id: number;
  name: string;
  date: string;
  time: string;
  location: string;
  confirmed: number;
  type: 'culto' | 'evento' | 'reuniao';
}

const events: Event[] = [
  {
    id: 1,
    name: 'Culto de Domingo',
    date: '18/06/2025',
    time: '10:00',
    location: 'Templo Principal',
    confirmed: 35,
    type: 'culto'
  },
  {
    id: 2,
    name: 'Culto de Jovens',
    date: '22/06/2025',
    time: '19:00',
    location: 'Salão Multiuso',
    confirmed: 18,
    type: 'culto'
  },
  {
    id: 3,
    name: 'Reunião de Líderes',
    date: '24/06/2025',
    time: '20:00',
    location: 'Sala de Reuniões',
    confirmed: 8,
    type: 'reuniao'
  },
  {
    id: 4,
    name: 'Festa Junina',
    date: '29/06/2025',
    time: '18:00',
    location: 'Pátio da Igreja',
    confirmed: 45,
    type: 'evento'
  }
];

const EventsTable: React.FC = () => {
  const getTypeColor = (type: Event['type']) => {
    switch (type) {
      case 'culto':
        return 'bg-blue-100 text-blue-800';
      case 'evento':
        return 'bg-green-100 text-green-800';
      case 'reuniao':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeLabel = (type: Event['type']) => {
    switch (type) {
      case 'culto':
        return 'Culto';
      case 'evento':
        return 'Evento';
      case 'reuniao':
        return 'Reunião';
      default:
        return type;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="p-6 border-b border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900">Próximos Eventos</h3>
      </div>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>EVENTO</TableHead>
              <TableHead>DATA</TableHead>
              <TableHead>HORÁRIO</TableHead>
              <TableHead>LOCAL</TableHead>
              <TableHead className="text-right">CONFIRMADOS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map((event) => (
              <TableRow key={event.id} className="hover:bg-gray-50">
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">{event.name}</p>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getTypeColor(event.type)}`}>
                        {getTypeLabel(event.type)}
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-gray-600">{event.date}</TableCell>
                <TableCell className="text-gray-600">{event.time}</TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2 text-gray-600">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span>{event.location}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end space-x-2">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span className="font-medium text-gray-900">{event.confirmed}</span>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      <div className="p-4 border-t border-gray-100">
        <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
          Ver todos os eventos →
        </button>
      </div>
    </div>
  );
};

export default EventsTable; 