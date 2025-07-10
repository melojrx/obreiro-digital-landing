import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import { MemberDetails } from '@/components/members/MemberDetails';
import { membersService, Member } from '@/services/membersService';
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

const DetalhesMembro: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const permissions = usePermissions();
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const loadMember = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const memberData = await membersService.getMemberProfile(Number(id));
        setMember(memberData);
      } catch (error) {
        console.error('Erro ao carregar membro:', error);
        toast.error('Erro ao carregar dados do membro');
        navigate('/membros');
      } finally {
        setLoading(false);
      }
    };

    loadMember();
  }, [id, navigate]);

  const handleEdit = () => {
    navigate(`/membros/${id}/editar`);
  };

  const handleDelete = () => {
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!id) return;

    try {
      setDeleting(true);
      await membersService.deleteMember(Number(id));
      toast.success('Membro excluído com sucesso');
      navigate('/membros');
    } catch (error) {
      console.error('Erro ao excluir membro:', error);
      toast.error('Erro ao excluir membro. Tente novamente.');
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleBack = () => {
    navigate('/membros');
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando dados do membro...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!member) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900">Membro não encontrado</h2>
          <p className="text-gray-600 mt-2">O membro solicitado não foi encontrado.</p>
          <button
            onClick={handleBack}
            className="mt-4 text-blue-600 hover:text-blue-500"
          >
            Voltar para lista de membros
          </button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <MemberDetails
        member={member}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onBack={handleBack}
        canEdit={permissions.canEditMembers}
        canDelete={permissions.canDeleteMembers}
      />

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o membro <strong>{member.full_name}</strong>?
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
    </AppLayout>
  );
};

export default DetalhesMembro; 