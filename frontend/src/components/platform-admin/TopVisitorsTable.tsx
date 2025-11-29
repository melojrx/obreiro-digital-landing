import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { TopChurchVisitors } from '@/types/platformAdmin';

interface TopVisitorsTableProps {
  data?: TopChurchVisitors[];
  isLoading?: boolean;
}

export function TopVisitorsTable({ data, isLoading }: TopVisitorsTableProps) {
  return (
    <Card className="border border-slate-200 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-slate-900">
          Top 10 igrejas por visitantes
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="space-y-2">
            {[1, 2, 3, 4].map((key) => (
              <Skeleton key={key} className="h-8 w-full" />
            ))}
          </div>
        )}

        {!isLoading && data && data.length === 0 && (
          <p className="text-sm text-slate-500">Sem dados para exibir.</p>
        )}

        {!isLoading && data && data.length > 0 && (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Igreja</TableHead>
                  <TableHead>Local</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead className="text-right">Visitantes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((church, index) => (
                  <TableRow key={church.id}>
                    <TableCell className="text-xs text-slate-500">#{index + 1}</TableCell>
                    <TableCell className="font-semibold text-slate-900">
                      {church.short_name || church.name}
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">
                      {church.city}/{church.state}
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">
                      {church.subscription_plan}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-slate-900">
                      {church.visitors_count}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
