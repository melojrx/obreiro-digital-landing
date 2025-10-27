import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, ArrowRight, User, FileText } from 'lucide-react';
import { MembershipStatusLogItem, MembershipStatusLogResponse } from '@/services/memberHistoryService';

interface MembershipStatusLogTimelineProps {
  data: MembershipStatusLogResponse | null;
  isLoading?: boolean;
  memberName?: string; // fallback para nome
  membershipDate?: string; // para registro inicial
}

const formatDateTime = (iso?: string) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
};

export const MembershipStatusLogTimeline: React.FC<MembershipStatusLogTimelineProps> = ({ data, isLoading = false, memberName, membershipDate }) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Status de Membresia</CardTitle>
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

  const history: MembershipStatusLogItem[] = data?.history || [];
  const name = data?.member_name || memberName || '—';
  const syntheticInitial: MembershipStatusLogItem | null = (!history.length && data?.current_status && data?.current_status_display)
    ? {
        id: -1,
        member: 0,
        member_name: name,
        old_status: '',
        old_status_display: 'Início',
        new_status: data.current_status,
        new_status_display: data.current_status_display,
        reason: 'Status inicial',
        changed_by: null,
        changed_by_name: '',
        created_at: membershipDate || '',
      }
    : null;
  const list = history.length ? history : (syntheticInitial ? [syntheticInitial] : []);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Histórico de Status de Membresia</CardTitle>
            <CardDescription>
              Mudanças no status de {name}
            </CardDescription>
          </div>
          {data?.current_status_display && (
            <Badge className="text-xs">Atual: {data.current_status_display}</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {list.length === 0 ? (
          <div className="text-center py-8 text-sm text-gray-600">Nenhuma alteração de status registrada.</div>
        ) : (
          <div className="relative">
            {list.map((entry, idx) => (
              <div key={entry.id} className="relative">
                {idx < list.length - 1 && (
                  <div className="absolute left-6 top-12 bottom-0 w-px bg-gray-200" />
                )}
                <div className="relative flex items-start space-x-4 pb-6">
                  <div className={`flex items-center justify-center w-12 h-12 rounded-full text-sm bg-gray-100 text-gray-700`}>⚙️</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 font-medium">
                      <span>{entry.old_status_display}</span>
                      <ArrowRight className="h-4 w-4 text-gray-500" />
                      <span>{entry.new_status_display}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{formatDateTime(entry.created_at)}</span>
                      </div>
                    </div>
                    {(entry.reason || entry.changed_by_name) && (
                      <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        {entry.reason && (
                          <div className="flex items-start gap-2">
                            <FileText className="h-4 w-4 text-gray-500 mt-0.5" />
                            <div>
                              <div className="text-gray-500">Motivo</div>
                              <div className="text-gray-800 whitespace-pre-wrap">{entry.reason}</div>
                            </div>
                          </div>
                        )}
                        {entry.changed_by_name && (
                          <div className="flex items-start gap-2">
                            <User className="h-4 w-4 text-gray-500 mt-0.5" />
                            <div>
                              <div className="text-gray-500">Alterado por</div>
                              <div className="text-gray-800">{entry.changed_by_name}</div>
                            </div>
                          </div>
                        )}
                      </div>
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

export default MembershipStatusLogTimeline;
