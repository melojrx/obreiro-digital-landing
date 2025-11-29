import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { SubscriptionAlerts } from '@/types/platformAdmin';
import { format, parseISO } from 'date-fns';

interface SubscriptionAlertsCardProps {
  data?: SubscriptionAlerts;
  isLoading?: boolean;
}

export function SubscriptionAlertsCard({
  data,
  isLoading,
}: SubscriptionAlertsCardProps) {
  return (
    <Card className="border border-slate-200 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-slate-900">
            Assinaturas vencendo
          </CardTitle>
          {data && (
            <Badge variant="secondary" className="text-xs">
              {data.expiring_count} na janela de {data.days_window}d
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading && (
          <div className="space-y-2">
            {[1, 2, 3].map((key) => (
              <Skeleton key={key} className="h-12 w-full" />
            ))}
          </div>
        )}

        {!isLoading && data && data.expiring.length === 0 && (
          <p className="text-sm text-slate-500">
            Nenhuma assinatura vence nos próximos {data.days_window} dias.
          </p>
        )}

        {!isLoading &&
          data &&
          data.expiring.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2"
            >
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {item.short_name || item.name}
                </p>
                <p className="text-xs text-slate-500">
                  Plano {item.subscription_plan}
                  {item.denomination ? ` • ${item.denomination}` : ''}
                </p>
              </div>
              <div className="text-xs text-slate-600 text-right">
                {format(parseISO(item.subscription_end_date), 'dd/MM/yyyy')}
              </div>
            </div>
          ))}

        {!isLoading && data && (
          <div className="pt-2 text-xs text-slate-500">
            {data.expired_count} igrejas já expiradas.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
