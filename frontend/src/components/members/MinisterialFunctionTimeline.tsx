import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock } from 'lucide-react';
import { MINISTERIAL_FUNCTION_CHOICES } from '@/services/membersService';
import { MinisterialFunctionHistoryItem } from '@/services/memberHistoryService';

interface MinisterialFunctionTimelineProps {
  items: MinisterialFunctionHistoryItem[];
  memberName: string;
  isLoading?: boolean;
}

const getFunctionIcon = (fn: string) => {
  switch (fn) {
    case 'pastor':
      return '🙏';
    case 'elder':
      return '👨‍💼';
    case 'deacon':
    case 'deaconess':
      return '🤝';
    case 'evangelist':
      return '📢';
    case 'missionary':
      return '🌍';
    case 'leader':
      return '👥';
    default:
      return '👤';
  }
};

const formatDate = (dateString?: string | null) => {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  });
};

const calcDuration = (start?: string, end?: string | null) => {
  if (!start) return '—';
  const s = new Date(start);
  const e = end ? new Date(end) : new Date();
  const diff = Math.abs(e.getTime() - s.getTime());
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (days < 30) return `${days} dia(s)`;
  if (days < 365) return `${Math.floor(days / 30)} mês(es)`;
  const years = Math.floor(days / 365);
  const months = Math.floor((days % 365) / 30);
  return years > 0 ? `${years} ano(s)${months > 0 ? ` e ${months} mês(es)` : ''}` : `${months} mês(es)`;
};

export const MinisterialFunctionTimeline: React.FC<MinisterialFunctionTimelineProps> = ({ items, memberName, isLoading = false }) => {
  const list = Array.isArray(items) ? items : [];
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Função Ministerial</CardTitle>
          <CardDescription>Carregando histórico...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1,2,3].map(i => (
              <div key={i} className="flex items-center space-x-4 animate-pulse">
                <div className="w-12 h-12 bg-gray-200 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Histórico de Função Ministerial</CardTitle>
        <CardDescription>Mudanças na função de {memberName}</CardDescription>
      </CardHeader>
      <CardContent>
        {list.length === 0 ? (
          <div className="text-center py-8 text-sm text-gray-600">Nenhum histórico de função encontrado.</div>
        ) : (
          <div className="relative">
            {list.map((it, idx) => (
              <div key={it.id} className="relative">
                {idx < list.length - 1 && (
                  <div className="absolute left-6 top-12 bottom-0 w-px bg-gray-200" />
                )}
                <div className="relative flex items-start space-x-4 pb-6">
                  <div className={`flex items-center justify-center w-12 h-12 rounded-full text-lg ${it.is_current ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'}`}>
                    {getFunctionIcon(it.function)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <h4 className="text-lg font-semibold">
                        {it.function_display || MINISTERIAL_FUNCTION_CHOICES[it.function as keyof typeof MINISTERIAL_FUNCTION_CHOICES] || it.function}
                      </h4>
                      {it.is_current && <Badge className="text-xs">Atual</Badge>}
                    </div>
                    <div className="mt-1 flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {formatDate(it.start_date)}
                          {it.end_date ? ` - ${formatDate(it.end_date)}` : ' - Atual'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{calcDuration(it.start_date, it.end_date || undefined)}</span>
                      </div>
                    </div>
                    {it.notes && (
                      <div className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">{it.notes}</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MinisterialFunctionTimeline;
