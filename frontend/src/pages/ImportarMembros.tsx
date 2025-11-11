import React, { useEffect, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { CsvUploader } from '@/components/members/CsvUploader';
import { ImportReport } from '@/components/members/ImportReport';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCurrentActiveChurch } from '@/hooks/useActiveChurch';
import { usePermissions } from '@/hooks/usePermissions';
import { toast } from 'sonner';
import { membersService } from '@/services/membersService';
import branchService from '@/services/branchService';
import { BranchDetails } from '@/types/hierarchy';
import { BulkImportResult } from '@/types/import';
import { Loader2, DownloadCloud } from 'lucide-react';

const MAX_PREVIEW_LINES = 5;

const ImportarMembros: React.FC = () => {
  const permissions = usePermissions();
  const activeChurch = useCurrentActiveChurch();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewRows, setPreviewRows] = useState<string[][]>([]);
  const [branchOptions, setBranchOptions] = useState<BranchDetails[]>([]);
  const [branchId, setBranchId] = useState<number | undefined>(undefined);
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [loading, setLoading] = useState(false);
  const [fetchingBranches, setFetchingBranches] = useState(false);
  const [result, setResult] = useState<BulkImportResult | null>(null);

  const canImport = permissions.canManageMembers || permissions.canCreateMembers;

  useEffect(() => {
    if (!activeChurch?.id) return;
    setFetchingBranches(true);
    branchService
      .getBranchesByChurch(activeChurch.id, 1, 100)
      .then((response) => {
        const options = response.results ?? [];
        setBranchOptions(options);
        if (activeChurch.active_branch) {
          const defaultBranchId = activeChurch.active_branch.id;
          const exists = options.some(
            (branch) => branch.id === defaultBranchId
          );
          setBranchId((prev) => {
            if (prev && options.some((branch) => branch.id === prev)) {
              return prev;
            }
            return exists ? defaultBranchId : undefined;
          });
        } else {
          setBranchId((prev) =>
            prev && options.some((branch) => branch.id === prev) ? prev : undefined
          );
        }
      })
      .catch(() => {
        toast.error('Não foi possível carregar as filiais.');
      })
      .finally(() => setFetchingBranches(false));
  }, [activeChurch?.id, activeChurch?.active_branch?.id]);

  const makePreview = async (file: File) => {
    const text = await file.text();
    const lines = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(0, MAX_PREVIEW_LINES);

    const parsed = lines.map((line) => line.split(/[;,]/));
    setPreviewRows(parsed);
  };

  const handleFileSelect = async (file: File) => {
    setSelectedFile(file);
    setResult(null);
    try {
      await makePreview(file);
    } catch (error) {
      console.error(error);
      toast.error('Não foi possível gerar preview do arquivo.');
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      toast.error('Selecione um arquivo antes de importar.');
      return;
    }

    setLoading(true);
    try {
      const response = await membersService.bulkUpload({
        file: selectedFile,
        branchId,
        skipDuplicates,
      });
      setResult(response);
      toast.success('Importação finalizada.');
    } catch (error: any) {
      console.error(error);
      const message =
        error?.response?.data?.detail ||
        error?.response?.data?.error ||
        'Falha ao importar membros.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = () => {
    window.open('/templates/importacao_membros.csv', '_blank', 'noopener');
  };

  const AUTO_BRANCH_VALUE = '__auto__';
  const branchValue = branchOptions.some((branch) => branch.id === branchId)
    ? String(branchId)
    : AUTO_BRANCH_VALUE;

  if (!canImport) {
    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-8 text-center">
          <h1 className="text-2xl font-semibold text-slate-900">Acesso restrito</h1>
          <p className="mt-3 text-slate-600">
            Você precisa de permissão para gerenciar membros para acessar esta funcionalidade.
          </p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Importar Membros</h1>
            <p className="text-slate-600 mt-1">
              Faça upload de um arquivo CSV/TXT seguindo o template oficial.
            </p>
          </div>
          <Button variant="outline" onClick={handleDownloadTemplate}>
            <DownloadCloud className="w-4 h-4 mr-2" />
            Baixar template
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Arquivo</CardTitle>
          </CardHeader>
          <CardContent>
            <CsvUploader onFileSelect={handleFileSelect} disabled={loading} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Configurações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Filial destino</Label>
                <Select
                  value={branchValue}
                  onValueChange={(value) =>
                    setBranchId(value === AUTO_BRANCH_VALUE ? undefined : Number(value))
                  }
                  disabled={fetchingBranches || loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a filial" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={AUTO_BRANCH_VALUE}>Matriz automática</SelectItem>
                    {branchOptions.map((branch) => (
                      <SelectItem key={branch.id} value={String(branch.id)}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between border rounded-lg px-4 py-3">
                <div>
                  <Label>Pular duplicados</Label>
                  <p className="text-xs text-slate-500">
                    Ignora registros repetidos por CPF ou email + data de nascimento.
                  </p>
                </div>
                <Switch
                  checked={skipDuplicates}
                  onCheckedChange={setSkipDuplicates}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSubmit} disabled={!selectedFile || loading}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Importar membros
              </Button>
            </div>
          </CardContent>
        </Card>

        {previewRows.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Prévia do arquivo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <tbody>
                    {previewRows.map((row, rowIndex) => (
                      <tr key={rowIndex} className={rowIndex === 0 ? 'font-semibold text-slate-800' : ''}>
                        {row.map((cell, cellIndex) => (
                          <td key={cellIndex} className="border border-slate-100 px-3 py-2">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {result && <ImportReport result={result} />}
      </div>
    </AppLayout>
  );
};

export default ImportarMembros;
