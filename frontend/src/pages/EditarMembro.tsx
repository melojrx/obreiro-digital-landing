import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import { MemberForm } from '@/components/members/MemberForm';
import { membersService, CreateMemberData, Member } from '@/services/membersService';
import { toast } from 'sonner';
import { usePermissions } from '@/hooks/usePermissions';

const EditarMembro: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const permissions = usePermissions();

  useEffect(() => {
    const loadMember = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const memberData = await membersService.getMember(Number(id));
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

  const handleSubmit = async (data: CreateMemberData) => {
    if (!id) return;

    try {
      setSaving(true);
      const { create_system_user, system_role, user_email, user_password, church, ...memberUpdateData } = (data as any);
      await membersService.updateMember(Number(id), memberUpdateData);

      // Se for para criar usuário do sistema e o membro ainda não tem usuário vinculado
      if (member && !member.user && create_system_user) {
        if (system_role && user_email && user_password) {
          const normalizedRole = system_role === 'denomination_admin' ? 'church_admin' : system_role;
          const res = await membersService.createSystemUser(Number(id), { system_role: normalizedRole, user_email, user_password });
          // Feedback explícito quando e-mail já existia (backend retorna 'atualizado' na mensagem)
          const roleLabel = (role: string) => (
            role === 'denomination_admin' ? 'Administrador da Denominação (Nível 3)' :
            role === 'church_admin' ? 'Administrador da Igreja (Nível 2)' :
            role === 'secretary' ? 'Secretário(a) (Nível 1)' : role
          );
          const chosenLabel = roleLabel(system_role);
          if ((res?.message || '').toLowerCase().includes('atualiz')) {
            toast.success(`E-mail já existia: senha atualizada e usuário vinculado como ${chosenLabel}.`);
          } else {
            toast.success(`Usuário do sistema criado e vinculado como ${chosenLabel}.`);
          }
        }
      }
      toast.success('Membro atualizado com sucesso!');
      navigate(`/membros/${id}`);
    } catch (error) {
      console.error('Erro ao atualizar membro:', error);
      // Tentar extrair mensagem do backend
      let message = 'Erro ao atualizar membro. Verifique os campos obrigatórios e tente novamente.';
      if (typeof (error as any)?.message === 'string') {
        message = (error as any).message;
      }
      const resp = (error as any)?.response;
      if (resp?.data) {
        const data = resp.data;
        if (typeof data === 'string') message = data;
        else if (data.detail) message = data.detail;
        else {
          // Agregar primeiros erros de campo
          const firstKey = Object.keys(data)[0];
          if (firstKey && Array.isArray(data[firstKey]) && data[firstKey].length > 0) {
            message = `${firstKey}: ${data[firstKey][0]}`;
          }
        }
      }
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate(`/membros/${id}`);
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
            onClick={() => navigate('/membros')}
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
      {!permissions.canEditMembers ? (
        <div className="p-6">
          <h2 className="text-lg font-semibold">Acesso negado</h2>
          <p className="text-sm text-gray-600">Você não tem permissão para editar membros.</p>
          <div className="mt-4">
            <button className="text-blue-600" onClick={handleCancel}>Voltar</button>
          </div>
        </div>
      ) : (
        <MemberForm
          member={member}
          title={`Editar Membro - ${member.full_name}`}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={saving}
        />
      )}
    </AppLayout>
  );
};

export default EditarMembro; 
