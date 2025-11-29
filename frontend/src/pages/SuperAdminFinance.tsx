import AppLayout from '@/components/layout/AppLayout';
import { PlanDistributionCard } from '@/components/platform-admin/PlanDistributionCard';
import { SubscriptionAlertsCard } from '@/components/platform-admin/SubscriptionAlertsCard';
import {
  usePlanDistribution,
  useSubscriptionAlerts,
  usePlatformOverview,
} from '@/hooks/usePlatformAdmin';
import { useAuth } from '@/hooks/useAuth';
import { AlertTriangle } from 'lucide-react';

const SuperAdminFinance = () => {
  const { user } = useAuth();
  const isSuperAdmin = !!user?.is_superuser;

  const { data: overview, isLoading: overviewLoading } = usePlatformOverview(isSuperAdmin);
  const { data: planDistribution, isLoading: planLoading } = usePlanDistribution(isSuperAdmin);
  const { data: subscriptionAlerts, isLoading: subscriptionsLoading } =
    useSubscriptionAlerts(isSuperAdmin);

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

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Financeiro</h1>
          <p className="text-sm text-slate-600">Distribuição de planos e assinaturas.</p>
        </div>

        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
          <PlanDistributionCard
            data={planDistribution ?? overview?.plans}
            isLoading={planLoading || overviewLoading}
          />
          <SubscriptionAlertsCard
            data={subscriptionAlerts ?? overview?.subscriptions}
            isLoading={subscriptionsLoading || overviewLoading}
          />
        </div>
      </div>
    </AppLayout>
  );
};

export default SuperAdminFinance;
