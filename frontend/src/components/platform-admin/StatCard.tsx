import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface StatCardProps {
  title: string;
  value: string | number;
  helper?: string;
}

export function StatCard({ title, value, helper }: StatCardProps) {
  return (
    <Card className="border border-slate-200 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-slate-600">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-slate-900">{value}</div>
        {helper && <p className="text-xs text-slate-500 mt-1">{helper}</p>}
      </CardContent>
    </Card>
  );
}
