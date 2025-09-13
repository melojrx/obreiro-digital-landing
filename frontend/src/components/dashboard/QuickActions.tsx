import { Button } from '@/components/ui/button';
import { PlusCircle, CalendarPlus, DollarSign, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';

const actions = [
  {
    label: 'Adicionar novo membro',
    icon: PlusCircle,
    color: 'from-blue-500 to-cyan-500',
    link: '/membros/novo'
  },
  {
    label: 'Criar novo visitante',
    icon: PlusCircle,
    color: 'from-pink-500 to-fuchsia-500',
    link: '/visitantes/novo'
  },
  {
    label: 'Realizar um pedido de oração',
    icon: MessageSquare,
    color: 'from-purple-600 to-indigo-500',
    link: '/pedidos-oracao'
  },
  {
    label: 'Criar nova atividade',
    icon: CalendarPlus,
    color: 'from-green-500 to-emerald-500',
    link: '/atividades'
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