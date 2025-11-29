import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

type DataQualityItem = {
  label: string;
  count: number;
  percentage: number;
};

interface DataQualityCardProps {
  membersMissingBirth?: { count: number; percentage: number };
  churchesMissingCnpj?: { count: number; percentage: number };
  isLoading?: boolean;
}

export function DataQualityCard({
  membersMissingBirth,
  churchesMissingCnpj,
  isLoading,
}: DataQualityCardProps) {
  const items: DataQualityItem[] = [
    {
      label: 'Membros sem data de nascimento',
      count: membersMissingBirth?.count ?? 0,
      percentage: membersMissingBirth?.percentage ?? 0,
    },
    {
      label: 'Igrejas sem CNPJ',
      count: churchesMissingCnpj?.count ?? 0,
      percentage: churchesMissingCnpj?.percentage ?? 0,
    },
  ];

  return (
    <Card className="border border-slate-200 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-slate-900">
          Qualidade dos Dados
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading && (
          <div className="space-y-2">
            {[1, 2].map((key) => (
              <Skeleton key={key} className="h-10 w-full" />
            ))}
          </div>
        )}

        {!isLoading &&
          items.map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2"
            >
              <div>
                <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                <p className="text-xs text-slate-500">{item.percentage}% do total</p>
              </div>
              <span className="text-sm font-semibold text-slate-900">{item.count}</span>
            </div>
          ))}
      </CardContent>
    </Card>
  );
}
