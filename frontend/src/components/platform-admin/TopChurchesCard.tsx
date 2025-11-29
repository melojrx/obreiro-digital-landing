import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TopChurch } from '@/types/platformAdmin';

interface TopChurchesCardProps {
  data?: TopChurch[];
  isLoading?: boolean;
}

export function TopChurchesCard({ data, isLoading }: TopChurchesCardProps) {
  return (
    <Card className="border border-slate-200 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-slate-900">
          Top igrejas por membros
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading && (
          <div className="space-y-2">
            {[1, 2, 3, 4].map((key) => (
              <Skeleton key={key} className="h-12 w-full" />
            ))}
          </div>
        )}

        {!isLoading && data && data.length === 0 && (
          <p className="text-sm text-slate-500">Sem dados para exibir.</p>
        )}

        {!isLoading &&
          data &&
          data.map((church, index) => (
            <div
              key={church.id}
              className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2"
            >
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500 w-5 text-right">
                  #{index + 1}
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {church.short_name || church.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {church.city}/{church.state} • Plano {church.subscription_plan}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-900">
                  {church.members_count} membros
                </p>
                <p className="text-xs text-emerald-600">
                  +{church.new_members_month} no mês
                </p>
              </div>
            </div>
          ))}
      </CardContent>
    </Card>
  );
}
