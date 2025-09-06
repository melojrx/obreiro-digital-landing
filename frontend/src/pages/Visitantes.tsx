import React from 'react';
import { UserPlus, Users, UserCheck, Heart, TrendingUp, QrCode } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { VisitorsTable } from '@/components/visitors/VisitorsTable';
import { VisitorsFilters } from '@/components/visitors/VisitorsFilters';
import { Button } from '@/components/ui/button';
import { useVisitors } from '@/hooks/useVisitors';
import { usePermissions } from '@/hooks/usePermissions';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const Visitantes: React.FC = () => {
  const navigate = useNavigate();
  const permissions = usePermissions();
  
  console.log('🔍 Visitantes - Permissões do usuário:', permissions);
  console.log('🔍 Visitantes - canManageVisitors:', permissions.canManageVisitors);
  
  const {
    visitors,
    stats,
    loading,
    statsLoading,
    visitorsLoading,
    filters,
    setFilters,
    deleteVisitor,
    totalVisitors,
  } = useVisitors();

  const [visitorToDelete, setVisitorToDelete] = React.useState<number | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  const handleCreateVisitor = () => {
    navigate('/visitantes/novo');
  };

  const handleDeleteVisitor = (visitorId: number) => {
    setVisitorToDelete(visitorId);
  };

  const confirmDelete = async () => {
    if (!visitorToDelete) return;

    try {
      setDeleting(true);
      await deleteVisitor(visitorToDelete);
      setVisitorToDelete(null);
    } catch (error) {
      // Erro já tratado no hook
    } finally {
      setDeleting(false);
    }
  };

  // Loading inicial
  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando dados dos visitantes...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 truncate">Visitantes</h1>
            <p className="text-gray-600 mt-1 text-xs sm:text-sm lg:text-base">
              Gerencie os visitantes registrados via QR Code
            </p>
          </div>
          <div className="flex flex-col xs:flex-row gap-2 xs:justify-start xl:justify-end">
            <Button
              variant="outline"
              onClick={() => navigate('/configuracoes/qr-codes')}
              className="border-purple-500 text-purple-600 text-xs sm:text-sm h-8 sm:h-9 w-full xs:w-auto"
            >
              <QrCode className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden xs:inline lg:hidden">QR Codes</span>
              <span className="xs:hidden lg:inline">Gerenciar QR Codes</span>
            </Button>
            {(permissions.canManageVisitors || process.env.NODE_ENV === 'development') && (
              <Button onClick={handleCreateVisitor} className="bg-blue-600 hover:bg-blue-700 text-xs sm:text-sm h-8 sm:h-9 w-full xs:w-auto">
                <UserPlus className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                <span className="xs:inline lg:hidden">Novo</span>
                <span className="hidden lg:inline">Novo Visitante</span>
              </Button>
            )}
          </div>
        </div>

        {/* Dashboard KPIs */}
        {permissions.canViewDashboard && stats && (
          <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            <StatsCard
              title="Total de Visitantes"
              value={stats.total}
              change={stats.last_30_days > 0 ? ((stats.last_30_days / stats.total) * 100) : 0}
              icon={<Users className="h-5 w-5" />}
              isLoading={statsLoading}
              color="bg-gradient-to-r from-blue-500 to-cyan-400"
            />
            <StatsCard
              title="Últimos 30 dias"
              value={stats.last_30_days}
              change={stats.last_7_days > 0 ? ((stats.last_7_days / stats.last_30_days) * 100) : 0}
              icon={<TrendingUp className="h-5 w-5" />}
              isLoading={statsLoading}
              color="bg-gradient-to-r from-green-500 to-emerald-400"
            />
            <StatsCard
              title="Convertidos"
              value={stats.converted_to_members}
              change={stats.conversion_rate}
              icon={<UserCheck className="h-5 w-5" />}
              isLoading={statsLoading}
              color="bg-gradient-to-r from-purple-500 to-fuchsia-400"
            />
            <StatsCard
              title="Aguardando Follow-up"
              value={stats.follow_up_needed}
              icon={<Heart className="h-5 w-5" />}
              isLoading={statsLoading}
              color="bg-gradient-to-r from-orange-500 to-amber-400"
            />
          </div>
        )}

        {/* Filtros */}
        <VisitorsFilters
          filters={filters}
          onFiltersChange={setFilters}
          loading={visitorsLoading}
        />

        {/* Tabela de Visitantes */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {visitorsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Carregando visitantes...</p>
              </div>
            </div>
          ) : (
            <VisitorsTable
              visitors={visitors}
              onDelete={permissions.canManageVisitors ? (visitor) => handleDeleteVisitor(visitor.id) : undefined}
            />
          )}
        </div>

        {/* Informações de Paginação */}
        {totalVisitors > 0 && (
          <div className="flex flex-col xs:flex-row xs:justify-between xs:items-center gap-2 text-xs sm:text-sm text-gray-600 px-2">
            <span>
              <span className="hidden xs:inline">Mostrando </span>{visitors.length} de {totalVisitors} visitantes
            </span>
            {filters.search && (
              <span className="text-center xs:text-right">
                <span className="hidden sm:inline">Filtrado por: </span>"{filters.search}"
              </span>
            )}
          </div>
        )}

        {/* Dialog de Confirmação de Exclusão */}
        <AlertDialog open={!!visitorToDelete} onOpenChange={() => setVisitorToDelete(null)}>
          <AlertDialogContent className="w-[95vw] max-w-md mx-auto">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-base sm:text-lg">Confirmar Exclusão</AlertDialogTitle>
              <AlertDialogDescription className="text-sm">
                Tem certeza que deseja excluir este visitante?
                Esta ação não pode ser desfeita e todos os dados do visitante serão permanentemente removidos.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex flex-col-reverse xs:flex-row gap-2">
              <AlertDialogCancel disabled={deleting} className="w-full xs:w-auto text-sm">
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                disabled={deleting}
                className="bg-red-600 hover:bg-red-700 w-full xs:w-auto text-sm"
              >
                {deleting ? 'Excluindo...' : 'Excluir Visitante'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
};

export default Visitantes;