import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ActivitySummary } from '@/types/platformAdmin';

interface ActivitySummaryCardProps {
  data?: ActivitySummary;
  isLoading?: boolean;
}

export function ActivitySummaryCard({ data, isLoading }: ActivitySummaryCardProps) {
  const metrics = [
    { label: 'Logins 24h', value: data?.logins_24h },
    { label: 'Logins 7d', value: data?.logins_7d },
    { label: 'Novos membros no mês', value: data?.new_members_month },
    { label: 'Novos usuários no mês', value: data?.new_users_month },
  ];

  return (
    <Card className="border border-slate-200 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-slate-900">
          Atividade recente
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading && (
          <div className="space-y-2">
            {[1, 2, 3, 4].map((key) => (
              <Skeleton key={key} className="h-10 w-full" />
            ))}
          </div>
        )}

        {!isLoading &&
          metrics.map((metric) => (
            <div
              key={metric.label}
              className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2"
            >
              <span className="text-sm text-slate-600">{metric.label}</span>
              <span className="text-sm font-semibold text-slate-900">
                {metric.value ?? '—'}
              </span>
            </div>
          ))}
      </CardContent>
    </Card>
  );
}
