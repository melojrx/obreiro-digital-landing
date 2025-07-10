import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const activities = [
    {
        type: 'Novo visitante registrado',
        person: 'Maria Santos',
        details: 'visitou o culto de domingo',
        time: 'Hoje, 10:30',
        avatar: '/avatars/01.png',
        fallback: 'MS'
    },
    {
        type: 'Novo evento criado',
        person: 'Culto de Jovens',
        details: 'Próximo sábado, 19h',
        time: 'Ontem, 15:45',
        avatar: '',
        fallback: 'CJ'
    },
    {
        type: 'Dízimo registrado',
        person: 'Carlos Oliveira',
        details: 'R$ 250,00',
        time: '2 dias atrás',
        avatar: '/avatars/02.png',
        fallback: 'CO'
    },
];

export function RecentActivities() {
    return (
        <div className="space-y-6">
             <h3 className="text-lg font-semibold text-slate-800">Atividades Recentes</h3>
            <div className="space-y-4">
                {activities.map((activity, index) => (
                    <div key={index} className="flex items-center gap-4 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                        <Avatar className="h-10 w-10">
                            <AvatarImage src={activity.avatar} alt={activity.person} />
                            <AvatarFallback>{activity.fallback}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <p className="text-sm font-medium text-slate-800">
                                {activity.type}
                            </p>
                            <p className="text-sm text-slate-600">
                                <span className="font-semibold">{activity.person}</span> {activity.details}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-slate-400">{activity.time}</p>
                        </div>
                    </div>
                ))}
            </div>
            <Button variant="outline" className="w-full">
                Ver todas as atividades
            </Button>
        </div>
    );
} 