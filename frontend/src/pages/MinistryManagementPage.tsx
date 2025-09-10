import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { 
  useMinistries, 
  useCreateMinistry, 
  useUpdateMinistry, 
  useDeleteMinistry,
  useAvailableLeaders
} from '@/hooks/useMinistries';
import { MinistryList, MinistryForm } from '@/components/activities';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
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
import { 
  ChurchIcon, 
  AlertTriangleIcon,
  TrendingUpIcon,
  CalendarIcon,
  UsersIcon
} from 'lucide-react';
import { Ministry, CreateMinistryData } from '@/services/activityService';
import { toast } from 'sonner';

const MinistryManagementPage: React.FC = () => {
  const { userChurch, user } = useAuth();
  
  // Debug logs
  console.log('🔍 MinistryManagementPage - userChurch:', userChurch);
  console.log('🔍 MinistryManagementPage - user:', user);
  
  const currentChurch = userChurch?.church;
  const [ministryForm, setMinistryForm] = useState<{
    isOpen: boolean;
    ministry?: Ministry;
  }>({ isOpen: false });

  
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    ministry?: Ministry;
  }>({ isOpen: false });

  // Queries e Mutations
  const { 
    data: ministries = [], 
    isLoading: ministriesLoading, 
    error: ministriesError 
  } = useMinistries({ 
    church_id: currentChurch?.id,
  });

  const createMinistryMutation = useCreateMinistry();
  const updateMinistryMutation = useUpdateMinistry();
  const deleteMinistryMutation = useDeleteMinistry();

  // Hook para buscar líderes disponíveis
  const { data: availableLeaders = [], isLoading: leadersLoading } = useAvailableLeaders();

  // Estatísticas gerais
  const stats = {
    total: ministries.length,
    active: ministries.filter(m => m.is_active).length,
    totalActivities: ministries.reduce((sum, m) => sum + m.total_activities, 0),
    totalMembers: ministries.reduce((sum, m) => sum + m.total_members, 0),
    avgActivitiesPerMinistry: ministries.length > 0 
      ? Math.round(ministries.reduce((sum, m) => sum + m.total_activities, 0) / ministries.length) 
      : 0,
    public: ministries.filter(m => m.is_public).length,
  };

  // Handlers
  const handleCreateMinistry = () => {
    setMinistryForm({ isOpen: true });
  };

  const handleEditMinistry = (ministry: Ministry) => {
    setMinistryForm({ isOpen: true, ministry });
  };

  const handleDeleteMinistry = (ministry: Ministry) => {
    setDeleteConfirmation({ isOpen: true, ministry });
  };

  const handleViewActivities = (ministry: Ministry) => {
    // Redirecionar para página de atividades com filtro do ministério
    toast.info(`Visualizando atividades de ${ministry.name}`);
    // Implementar navegação para atividades filtradas
  };

  const handleMinistryFormSubmit = async (data: CreateMinistryData) => {
    try {
      if (ministryForm.ministry) {
        // Editando ministério existente
        await updateMinistryMutation.mutateAsync({
          id: ministryForm.ministry.id,
          data: data
        });
      } else {
        // Criando novo ministério
        await createMinistryMutation.mutateAsync(data);
      }
      setMinistryForm({ isOpen: false });
    } catch (error) {
      console.error('Erro ao salvar ministério:', error);
      // O toast de erro já é mostrado pelo hook
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmation.ministry) return;

    try {
      await deleteMinistryMutation.mutateAsync(deleteConfirmation.ministry.id);
      setDeleteConfirmation({ isOpen: false });
    } catch (error) {
      console.error('Erro ao deletar ministério:', error);
      // O toast de erro já é mostrado pelo hook
    }
  };

  const handleCloseMinistryForm = () => {
    setMinistryForm({ isOpen: false });
  };

  const handleCloseDeleteConfirmation = () => {
    setDeleteConfirmation({ isOpen: false });
  };

  return (
    <>
      <AppLayout>
        <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <ChurchIcon className="h-8 w-8" />
            Gestão de Ministérios
          </h1>
          <p className="text-gray-600 mt-1">
            Gerencie os ministérios da sua igreja e seus líderes
          </p>
        </div>

        {/* Estatísticas Gerais */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Total de Ministérios
                  </p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.active} ativos
                  </p>
                </div>
                <ChurchIcon className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Total de Atividades
                  </p>
                  <p className="text-2xl font-bold text-green-600">{stats.totalActivities}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    ~{stats.avgActivitiesPerMinistry} por ministério
                  </p>
                </div>
                <CalendarIcon className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Total de Membros
                  </p>
                  <p className="text-2xl font-bold text-purple-600">{stats.totalMembers}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Em todos os ministérios
                  </p>
                </div>
                <UsersIcon className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Ministérios Públicos
                  </p>
                  <p className="text-2xl font-bold text-orange-600">{stats.public}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Visíveis para visitantes
                  </p>
                </div>
                <TrendingUpIcon className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Error State */}
        {ministriesError && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-red-800">
                Erro ao carregar ministérios: {(ministriesError as any)?.message || 'Erro desconhecido'}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Lista de Ministérios */}
        <MinistryList
          ministries={ministries}
          isLoading={ministriesLoading}
          onCreateNew={handleCreateMinistry}
          onEdit={handleEditMinistry}
          onDelete={handleDeleteMinistry}
          onViewActivities={handleViewActivities}
        />

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteConfirmation.isOpen} onOpenChange={handleCloseDeleteConfirmation}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangleIcon className="h-5 w-5 text-red-600" />
                Confirmar Exclusão
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-3">
                <p>
                  Tem certeza que deseja excluir o ministério{' '}
                  <strong>"{deleteConfirmation.ministry?.name}"</strong>?
                </p>
                
                {deleteConfirmation.ministry && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <AlertTriangleIcon className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm space-y-1">
                        <p className="font-medium text-yellow-800">
                          Esta ação afetará:
                        </p>
                        <ul className="list-disc list-inside text-yellow-700 space-y-1">
                          <li>{deleteConfirmation.ministry.total_activities} atividade(s) associada(s)</li>
                          <li>{deleteConfirmation.ministry.total_members} membro(s) vinculado(s)</li>
                          <li>Histórico e estatísticas do ministério</li>
                        </ul>
                        <p className="font-medium text-yellow-800 mt-2">
                          Esta ação não pode ser desfeita.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDelete}
                className="bg-red-600 hover:bg-red-700"
                disabled={deleteMinistryMutation.isPending}
              >
                {deleteMinistryMutation.isPending ? 'Excluindo...' : 'Excluir Ministério'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        </div>
      </AppLayout>

      {/* Ministry Form Dialog - Fora do AppLayout para evitar conflitos de z-index */}
      <MinistryForm
        isOpen={ministryForm.isOpen}
        onClose={handleCloseMinistryForm}
        onSubmit={handleMinistryFormSubmit}
        ministry={ministryForm.ministry}
        availableLeaders={availableLeaders}
        isLoading={
          createMinistryMutation.isPending || 
          updateMinistryMutation.isPending
        }
      />
    </>
  );
};

export default MinistryManagementPage;