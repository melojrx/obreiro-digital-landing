import React from 'react';
import { BulkImportResult } from '@/types/import';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ImportReportProps {
  result: BulkImportResult;
}

export const ImportReport: React.FC<ImportReportProps> = ({ result }) => {
  const hasErrors = result.errors.length > 0;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Resumo da Importação</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <dt className="text-slate-500">Linhas processadas</dt>
              <dd className="text-lg font-semibold text-slate-900">
                {result.total_rows}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Sucessos</dt>
              <dd className="text-lg font-semibold text-emerald-600">
                {result.success_count}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Erros</dt>
              <dd className="text-lg font-semibold text-red-600">
                {result.error_count}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Duplicados ignorados</dt>
              <dd className="text-lg font-semibold text-amber-600">
                {result.duplicates_skipped}
              </dd>
            </div>
            {result.branch_id && (
              <div>
                <dt className="text-slate-500">Filial destino</dt>
                <dd className="text-lg font-semibold">{result.branch_id}</dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>

      {hasErrors && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Linhas com erro</CardTitle>
              <Badge variant="destructive">{result.errors.length}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {result.errors.map((error) => (
              <div
                key={error.line}
                className="border border-red-100 rounded-md p-3 bg-red-50"
              >
                <p className="text-sm font-semibold text-red-700">
                  Linha {error.line}
                </p>
                <ul className="text-sm text-red-600 list-disc list-inside">
                  {error.messages.map((message, idx) => (
                    <li key={idx}>{message}</li>
                  ))}
                </ul>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ImportReport;
