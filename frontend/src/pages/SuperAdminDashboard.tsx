import AppLayout from '@/components/layout/AppLayout';
import { ActivitySummaryCard } from '@/components/platform-admin/ActivitySummaryCard';
import { StatCard } from '@/components/platform-admin/StatCard';
import { TopChurchesTable } from '@/components/platform-admin/TopChurchesTable';
import { TopVisitorsTable } from '@/components/platform-admin/TopVisitorsTable';
import { BrazilMapCard } from '@/components/platform-admin/BrazilMapCard';
import {
  useActivitySummary,
  usePlatformOverview,
  useTopChurches,
  useTopChurchesVisitors,
  useGeoMapData,
} from '@/hooks/usePlatformAdmin';
import { useAuth } from '@/hooks/useAuth';
import { AlertTriangle } from 'lucide-react';

const SuperAdminDashboard = () => {
  const { user } = useAuth();
  const isSuperAdmin = !!user?.is_superuser;

  const { data: overview, isLoading: overviewLoading } = usePlatformOverview(isSuperAdmin);
  const { data: topChurches, isLoading: topLoading } = useTopChurches(isSuperAdmin);
  const { data: topVisitors, isLoading: topVisitorsLoading } = useTopChurchesVisitors(isSuperAdmin);
  const { data: activitySummary, isLoading: activityLoading } = useActivitySummary(isSuperAdmin);
  const { data: geoMap, isLoading: geoLoading } = useGeoMapData(isSuperAdmin);

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

  const cards = [
    {
      title: 'Usuários',
      value: overview?.users.total ?? '—',
      helper: `Ativos 30d: ${overview?.users.active_30d ?? 0}`,
    },
    {
      title: 'Denominações',
      value: overview?.denominations.total ?? '—',
    },
    {
      title: 'Igrejas',
      value: overview?.churches.total ?? '—',
      helper: `Novas no mês: ${overview?.churches.new_this_month ?? 0}`,
    },
    {
      title: 'Filiais',
      value: overview?.branches.total ?? '—',
    },
    {
      title: 'Membros',
      value: overview?.members.total ?? '—',
      helper: `Novos no mês: ${overview?.members.new_this_month ?? 0}`,
    },
    {
      title: 'Visitantes',
      value: overview?.visitors.total ?? '—',
      helper: `Novos no mês: ${overview?.visitors.new_this_month ?? 0}`,
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard Super Admin</h1>
          <p className="text-sm text-slate-600">
            Visão consolidada da plataforma para monitoramento rápido.
          </p>
        </div>

        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => (
            <StatCard
              key={card.title}
              title={card.title}
              value={overviewLoading ? '...' : card.value}
              helper={card.helper}
            />
          ))}
        </div>

        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
          <ActivitySummaryCard
            data={activitySummary ?? overview?.activity}
            isLoading={activityLoading || overviewLoading}
          />
          <BrazilMapCard data={geoMap} isLoading={geoLoading} />
        </div>

        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
          <TopChurchesTable data={topChurches} isLoading={topLoading} />
          <TopVisitorsTable data={topVisitors} isLoading={topVisitorsLoading} />
        </div>

      </div>
    </AppLayout>
  );
};

export default SuperAdminDashboard;
