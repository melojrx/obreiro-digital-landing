import { Button } from '@/components/ui/button';
import { PlusCircle, CalendarPlus, DollarSign, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';

const actions = [
  {
    label: 'Adicionar novo membro',
    icon: PlusCircle,
    color: 'from-blue-500 to-cyan-500',
    link: '/members/new'
  },
  {
    label: 'Criar novo evento',
    icon: CalendarPlus,
    color: 'from-green-500 to-emerald-500',
    link: '/events/new'
  },
  {
    label: 'Registrar entrada financeira',
    icon: DollarSign,
    color: 'from-yellow-500 to-amber-500',
    link: '/finance/new'
  },
  {
    label: 'Enviar mensagem aos membros',
    icon: MessageSquare,
    color: 'from-purple-500 to-fuchsia-500',
    link: '/messages/new'
  },
];

export const QuickActions = () => {
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-slate-800 mb-4">Ações Rápidas</h3>
      {actions.map((action) => (
        <Button
          key={action.label}
          asChild
          className={`w-full justify-start text-white font-bold py-6 text-left bg-gradient-to-r ${action.color} transition-all duration-300 transform hover:scale-105 hover:shadow-lg`}
        >
          <Link to={action.link}>
            <action.icon className="h-5 w-5 mr-4" />
            {action.label}
          </Link>
        </Button>
      ))}
    </div>
  );
}; 