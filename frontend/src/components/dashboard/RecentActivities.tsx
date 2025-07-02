import React from 'react';
import { Clock, Calendar, UserPlus, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Activity {
  id: number;
  type: 'visitor' | 'event' | 'donation' | 'member';
  title: string;
  description: string;
  time: string;
  icon?: React.ElementType;
  iconColor?: string;
  iconBg?: string;
}

const activities: Activity[] = [
  {
    id: 1,
    type: 'visitor',
    title: 'Novo visitante registrado',
    description: 'Maria Santos visitou o culto de domingo',
    time: 'Hoje, 10:30',
    icon: UserPlus,
    iconColor: 'text-blue-600',
    iconBg: 'bg-blue-100'
  },
  {
    id: 2,
    type: 'event',
    title: 'Novo evento criado',
    description: 'Culto de Jovens - Próximo sábado, 19h',
    time: 'Ontem, 15:45',
    icon: Calendar,
    iconColor: 'text-green-600',
    iconBg: 'bg-green-100'
  },
  {
    id: 3,
    type: 'donation',
    title: 'Dízimo registrado',
    description: 'Carlos Oliveira - R$ 250,00',
    time: '2 dias atrás',
    icon: DollarSign,
    iconColor: 'text-yellow-600',
    iconBg: 'bg-yellow-100'
  }
];

const RecentActivities: React.FC = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Atividades Recentes</h3>
        <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
          Ver todas as atividades
        </button>
      </div>

      <div className="space-y-4">
        {activities.map((activity) => {
          const Icon = activity.icon || Clock;
          
          return (
            <div key={activity.id} className="flex items-start space-x-4 p-3 hover:bg-gray-50 rounded-lg transition-colors">
              <div className={cn(
                "p-2 rounded-lg flex-shrink-0",
                activity.iconBg || 'bg-gray-100'
              )}>
                <Icon className={cn(
                  "h-5 w-5",
                  activity.iconColor || 'text-gray-600'
                )} />
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {activity.title}
                </p>
                <p className="text-sm text-gray-500 truncate">
                  {activity.description}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {activity.time}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RecentActivities; 