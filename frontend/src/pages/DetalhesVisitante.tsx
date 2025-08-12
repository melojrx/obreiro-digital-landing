import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import { VisitorDetails } from '@/components/visitors/VisitorDetails';
import { getVisitor, deleteVisitor, convertVisitorToMember, updateVisitorFollowUp, type Visitor } from '@/services/visitorsService';
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

const DetalhesVisitante: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const permissions = usePermissions();
  const [visitor, setVisitor] = useState<Visitor | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const loadVisitor = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const visitorData = await getVisitor(Number(id));
        setVisitor(visitorData);
      } catch (error) {
        console.error('Erro ao carregar visitante:', error);
        toast.error('Erro ao carregar dados do visitante');
        navigate('/visitantes');
      } finally {
        setLoading(false);
      }
    };

    loadVisitor();
  }, [id, navigate]);

  const handleEdit = () => {
    navigate(`/visitantes/${id}/editar`);
  };

  const handleDelete = () => {
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!id) return;

    try {
      setDeleting(true);
      await deleteVisitor(Number(id));
      toast.success('Visitante excluído com sucesso');
      navigate('/visitantes');
    } catch (error) {
      console.error('Erro ao excluir visitante:', error);
      toast.error('Erro ao excluir visitante. Tente novamente.');
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleConvertToMember = async (notes?: string) => {
    if (!id || !visitor) return;

    try {
      const result = await convertVisitorToMember(Number(id), notes);
      toast.success(result.message);
      
      // Recarregar dados do visitante
      const updatedVisitor = await getVisitor(Number(id));
      setVisitor(updatedVisitor);
    } catch (error: any) {
      console.error('Erro ao converter visitante:', error);
      
      // Verificar se há mensagem de erro específica da API
      const errorMessage = error?.response?.data?.error || 
                          error?.response?.data?.message || 
                          'Erro ao converter visitante em membro';
      
      toast.error(errorMessage);
    }
  };

  const handleUpdateFollowUp = async (status: string, notes?: string) => {
    if (!id || !visitor) return;

    try {
      const updatedVisitor = await updateVisitorFollowUp(Number(id), status, notes);
      setVisitor(updatedVisitor);
      toast.success('Status de follow-up atualizado com sucesso');
    } catch (error) {
      console.error('Erro ao atualizar follow-up:', error);
      toast.error('Erro ao atualizar status de follow-up');
    }
  };

  const handleBack = () => {
    navigate('/visitantes');
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando dados do visitante...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!visitor) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900">Visitante não encontrado</h2>
          <p className="text-gray-600 mt-2">O visitante solicitado não foi encontrado.</p>
          <button
            onClick={handleBack}
            className="mt-4 text-blue-600 hover:text-blue-500"
          >
            Voltar para lista de visitantes
          </button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <VisitorDetails
        visitor={visitor}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onBack={handleBack}
        onConvertToMember={handleConvertToMember}
        onUpdateFollowUp={handleUpdateFollowUp}
        canEdit={permissions.canManageVisitors}
        canDelete={permissions.canManageVisitors}
        canConvert={permissions.canManageMembers}
      />

      {/* Dialog de confirmação para excluir */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o visitante <strong>{visitor.full_name}</strong>? 
              Esta ação não pode ser desfeita.
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
              {deleting ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
};

export default DetalhesVisitante;