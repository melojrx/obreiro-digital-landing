import AppLayout from '@/components/layout/AppLayout';
import { DataQualityCard } from '@/components/platform-admin/DataQualityCard';
import { usePlatformOverview } from '@/hooks/usePlatformAdmin';
import { useAuth } from '@/hooks/useAuth';
import { AlertTriangle } from 'lucide-react';

const SuperAdminQuality = () => {
  const { user } = useAuth();
  const isSuperAdmin = !!user?.is_superuser;

  const { data: overview, isLoading: overviewLoading } = usePlatformOverview(isSuperAdmin);

  if (!isSuperAdmin) {
    return (
      <AppLayout>
        <div className="flex h-full items-center justify-center py-20">
          <div className="text-center space-y-3">
            <div className="flex justify-center">
              <AlertTriangle className="h-10 w-10 text-amber-500" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900">
              Acesso restrito ao Super Admin
            </h2>
            <p className="text-sm text-slate-600">
              Somente usuários com permissão de plataforma podem acessar este painel.
            </p>
          </div>
        </div>
      </AppLayout>
    );
  }

  const dataQuality = overview?.data_quality;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Qualidade dos Dados</h1>
          <p className="text-sm text-slate-600">
            Completeza dos cadastros de membros e igrejas.
          </p>
        </div>

        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
          <DataQualityCard
            membersMissingBirth={dataQuality?.members_missing_birth_date}
            churchesMissingCnpj={dataQuality?.churches_missing_cnpj}
            isLoading={overviewLoading}
          />
        </div>
      </div>
    </AppLayout>
  );
};

export default SuperAdminQuality;
