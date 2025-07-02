import React from 'react';
import { UserPlus, Calendar, MessageSquare, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface QuickAction {
  id: number;
  title: string;
  icon: React.ElementType;
  color: string;
  onClick: () => void;
}

const QuickActions: React.FC = () => {
  const actions: QuickAction[] = [
    {
      id: 1,
      title: 'Adicionar novo membro',
      icon: UserPlus,
      color: 'bg-blue-500 hover:bg-blue-600',
      onClick: () => console.log('Adicionar membro')
    },
    {
      id: 2,
      title: 'Criar novo evento',
      icon: Calendar,
      color: 'bg-green-500 hover:bg-green-600',
      onClick: () => console.log('Criar evento')
    },
    {
      id: 3,
      title: 'Registrar entrada financeira',
      icon: DollarSign,
      color: 'bg-yellow-500 hover:bg-yellow-600',
      onClick: () => console.log('Registrar entrada')
    },
    {
      id: 4,
      title: 'Enviar mensagem aos membros',
      icon: MessageSquare,
      color: 'bg-purple-500 hover:bg-purple-600',
      onClick: () => console.log('Enviar mensagem')
    }
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Ações Rápidas</h3>
      
      <div className="grid grid-cols-1 gap-3">
        {actions.map((action) => {
          const Icon = action.icon;
          
          return (
            <Button
              key={action.id}
              onClick={action.onClick}
              className={`w-full justify-start text-white ${action.color} border-0`}
              variant="default"
            >
              <Icon className="h-4 w-4 mr-2" />
              {action.title}
            </Button>
          );
        })}
      </div>
    </div>
  );
};

export default QuickActions; 