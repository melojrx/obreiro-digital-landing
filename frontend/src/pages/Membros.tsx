import React from 'react';
import { Plus, Users, UserCheck, UserX, TrendingUp, UploadCloud } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { MembersTable } from '@/components/members/MembersTable';
import { MembersFilters } from '@/components/members/MembersFilters';
import { Button } from '@/components/ui/button';
import { useMembers } from '@/hooks/useMembers';
import { useCurrentActiveChurch } from '@/hooks/useActiveChurch';
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

const Membros: React.FC = () => {
  const navigate = useNavigate();
  const permissions = usePermissions();
  const activeChurch = useCurrentActiveChurch();
  
  console.log('🔍 Membros - Permissões do usuário:', permissions);
  console.log('🔍 Membros - canCreateMembers:', permissions.canCreateMembers);
  
  const {
    members,
    dashboard,
    loading,
    dashboardLoading,
    membersLoading,
    filters,
    setFilters,
    refreshData,
    deleteMember,
    totalMembers,
  } = useMembers();

  const [memberToDelete, setMemberToDelete] = React.useState<number | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  const handleCreateMember = () => {
    navigate('/membros/novo');
  };

  const handleImportMembers = () => {
    navigate('/membros/importar');
  };

  const handleDeleteMember = (memberId: number) => {
    setMemberToDelete(memberId);
  };

  const confirmDelete = async () => {
    if (!memberToDelete) return;

    try {
      setDeleting(true);
      await deleteMember(memberToDelete);
      setMemberToDelete(null);
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
            <p className="mt-4 text-gray-600">Carregando dados dos membros...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Membros</h1>
            <p className="text-gray-600 mt-1">
              Gerencie os membros da sua igreja
            </p>
            {activeChurch?.active_branch && (
              <p className="mt-1 text-xs text-muted-foreground">
                Filial ativa: <span className="font-medium">{activeChurch.active_branch.name}</span>
              </p>
            )}
          </div>
          <div className="flex gap-2">
            {permissions.canManageMembers && (
              <Button variant="outline" onClick={handleImportMembers}>
                <UploadCloud className="h-4 w-4 mr-2" />
                Importar CSV
              </Button>
            )}
            {(permissions.canCreateMembers || process.env.NODE_ENV === 'development') && (
              <Button onClick={handleCreateMember} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Novo Membro
              </Button>
            )}
            {process.env.NODE_ENV === 'development' && !permissions.canCreateMembers && (
              <Button onClick={handleCreateMember} variant="outline" className="border-orange-500 text-orange-600">
                <Plus className="h-4 w-4 mr-2" />
                Novo Membro (Dev)
              </Button>
            )}
          </div>
        </div>

        {/* Dashboard KPIs */}
        {permissions.canViewDashboard && dashboard && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatsCard
              title="Total de Membros"
              value={dashboard.total_members}
              change={dashboard.growth_rate}
              icon={<Users className="h-5 w-5" />}
              isLoading={dashboardLoading}
              color="bg-gradient-to-r from-blue-500 to-cyan-400"
            />
            <StatsCard
              title="Membros Ativos"
              value={dashboard.active_members}
              change={dashboard.total_members > 0 ? ((dashboard.active_members / dashboard.total_members) * 100) : 0}
              icon={<UserCheck className="h-5 w-5" />}
              isLoading={dashboardLoading}
              color="bg-gradient-to-r from-green-500 to-emerald-400"
            />
            <StatsCard
              title="Membros Inativos"
              value={dashboard.inactive_members}
              icon={<UserX className="h-5 w-5" />}
              isLoading={dashboardLoading}
              color="bg-gradient-to-r from-orange-500 to-amber-400"
            />
            <StatsCard
              title="Novos este Mês"
              value={dashboard.new_members_month}
              change={dashboard.growth_rate}
              icon={<TrendingUp className="h-5 w-5" />}
              isLoading={dashboardLoading}
              color="bg-gradient-to-r from-purple-500 to-fuchsia-400"
            />
          </div>
        )}

        {/* Filtros */}
        <MembersFilters
          filters={filters}
          onFiltersChange={setFilters}
          loading={membersLoading}
        />

        {/* Tabela de Membros */}
        <div className="bg-white rounded-lg shadow">
          {membersLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Carregando membros...</p>
              </div>
            </div>
          ) : (
            <MembersTable
              members={members}
              onDelete={permissions.canDeleteMembers ? (member) => handleDeleteMember(member.id) : undefined}
              onTransferSuccess={async () => {
                await refreshData();
              }}
            />
          )}
        </div>

        {/* Informações de Paginação */}
        {totalMembers > 0 && (
          <div className="flex justify-between items-center text-sm text-gray-600 px-2">
            <span>
              Mostrando {members.length} de {totalMembers} membros
            </span>
            {filters.search && (
              <span>
                Filtrado por: "{filters.search}"
              </span>
            )}
          </div>
        )}

        {/* Dialog de Confirmação de Exclusão */}
        <AlertDialog open={!!memberToDelete} onOpenChange={() => setMemberToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir este membro?
                Esta ação não pode ser desfeita e todos os dados do membro serão permanentemente removidos.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                disabled={deleting}
                className="bg-red-600 hover:bg-red-700"
              >
                {deleting ? 'Excluindo...' : 'Excluir Membro'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
};

export default Membros; 
