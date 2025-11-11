import React from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { usePermissions } from '@/hooks/usePermissions';
import { UploadCloud } from 'lucide-react';

const Configuracoes: React.FC = () => {
  const navigate = useNavigate();
  const permissions = usePermissions();
  const canImportMembers = permissions.canManageMembers || permissions.canCreateMembers;

  const handleOpenImport = () => {
    navigate('/membros/importar');
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold text-slate-900">Configurações</h1>
          <p className="text-slate-600 max-w-3xl">
            Centralize os atalhos administrativos do Obreiro Virtual. Use esta página para acessar rapidamente
            recursos avançados como importação em lote, auditorias e integrações (em breve).
          </p>
        </div>

        <Separator />

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
            <UploadCloud className="h-5 w-5 text-blue-600" />
            Importação de Membros
          </h2>
          <p className="text-sm text-slate-600 max-w-3xl">
            Cadastre rapidamente bases de membros já existentes utilizando arquivos CSV/TXT no formato padrão.
            O processo valida CPF, telefone, multi-tenant e gera um relatório detalhado com duplicidades e erros
            de formatação.
          </p>

          <Card>
            <CardHeader>
              <CardTitle>Importar via CSV</CardTitle>
              <CardDescription>
                Utilize o assistente de importação para processar até 1000 registros por arquivo com validações
                automáticas e relatório de auditoria.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm text-slate-700">
                  Recomendado para migração inicial ou atualizações periódicas. Você poderá baixar o template,
                  escolher a filial destino e acompanhar os resultados em tempo real.
                </p>
                {!canImportMembers && (
                  <p className="text-sm text-amber-600 mt-2">
                    Seu perfil atual não possui permissão para importar membros. Solicite a um administrador da igreja.
                  </p>
                )}
              </div>
              <Button onClick={handleOpenImport} disabled={!canImportMembers}>
                <UploadCloud className="h-4 w-4 mr-2" />
                Abrir importação em lote
              </Button>
            </CardContent>
          </Card>
        </section>
      </div>
    </AppLayout>
  );
};

export default Configuracoes;
