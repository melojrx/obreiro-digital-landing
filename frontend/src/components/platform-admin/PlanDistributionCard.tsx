import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { PlanDistribution } from '@/types/platformAdmin';
import { Pie, PieChart, Cell, Legend } from 'recharts';

interface PlanDistributionCardProps {
  data?: PlanDistribution;
  isLoading?: boolean;
}

const COLORS = ['#1d4ed8', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444'];

export function PlanDistributionCard({ data, isLoading }: PlanDistributionCardProps) {
  const chartData =
    data?.plans.map((plan, idx) => ({
      name: plan.label || plan.plan,
      value: plan.percentage,
      count: plan.count,
      fill: COLORS[idx % COLORS.length],
    })) || [];

  return (
    <Card className="border border-slate-200 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-slate-900">
          Distribuição por Plano
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading && (
          <div className="space-y-2">
            {[1, 2, 3].map((key) => (
              <Skeleton key={key} className="h-10 w-full" />
            ))}
          </div>
        )}

        {!isLoading && data && data.plans.length === 0 && (
          <p className="text-sm text-slate-500">Nenhum dado disponível.</p>
        )}

        {!isLoading && data && data.plans.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2">
            <ChartContainer
              config={{
                plans: { label: 'Planos' },
              }}
              className="min-h-[220px]"
            >
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value, name, item) => [
                        `${value}% • ${item.payload.count} igrejas`,
                        item.payload.name,
                      ]}
                    />
                  }
                />
                <Legend />
              </PieChart>
            </ChartContainer>

            <div className="space-y-2">
              {data.plans.map((plan, idx) => (
                <div
                  key={plan.plan}
                  className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                    />
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {plan.label || plan.plan}
                      </p>
                      <p className="text-xs text-slate-500">
                        {plan.count} igrejas
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-slate-900">
                    {plan.percentage}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
