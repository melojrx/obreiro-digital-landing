import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import { MemberForm } from '@/components/members/MemberForm';
import { membersService, CreateMemberData, Member, MEMBERSHIP_STATUS_CHOICES, MINISTERIAL_FUNCTION_CHOICES } from '@/services/membersService';
import { toast } from 'sonner';
import { usePermissions } from '@/hooks/usePermissions';

const getStatusLabel = (status?: string | null) => {
  if (!status) {
    return 'Sem status definido';
  }
  return (
    MEMBERSHIP_STATUS_CHOICES[status as keyof typeof MEMBERSHIP_STATUS_CHOICES] ?? status
  );
};

const getFunctionLabel = (func?: string | null) => {
  if (!func) {
    return 'Sem função definida';
  }
  return (
    MINISTERIAL_FUNCTION_CHOICES[func as keyof typeof MINISTERIAL_FUNCTION_CHOICES] ?? func
  );
};

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
      // NOTA: user_password removido - senha gerada automaticamente pelo backend
      const { create_system_user, system_role, user_email, remove_system_access, church, ...memberUpdateData } = (data as any);
      const previousStatus = member?.membership_status ?? null;
      const previousFunction = member?.ministerial_function ?? null;
      const memberHadSystemUser = Boolean(member?.user);
      
      // Preparar dados de atualização
      const updateData: any = { ...memberUpdateData };
      
      const normalizedRole = system_role === 'denomination_admin' ? 'church_admin' : system_role;
      const accessRevoked = Boolean(memberHadSystemUser && remove_system_access);
      const roleChanged = Boolean(
        memberHadSystemUser &&
        !remove_system_access &&
        normalizedRole &&
        normalizedRole !== (member?.system_user_role || '')
      );

      // Se for para conceder acesso ao sistema, adicionar campos necessários
      if (!memberHadSystemUser && create_system_user && system_role && user_email) {
        updateData.grant_system_access = true;
        updateData.system_role = normalizedRole;
        updateData.user_email = user_email;
      } else if (memberHadSystemUser) {
        if (remove_system_access) {
          updateData.revoke_system_access = true;
        } else if (roleChanged && normalizedRole) {
          updateData.system_role = normalizedRole;
        }
      }
      
      // Atualizar membro (e conceder acesso se solicitado)
      const updatedMember = await membersService.updateMember(Number(id), updateData);
      const newStatus = updatedMember?.membership_status ?? null;
      const newFunction = updatedMember?.ministerial_function ?? null;
      const statusChanged = (previousStatus ?? null) !== (newStatus ?? null);
      const functionChanged = (previousFunction ?? null) !== (newFunction ?? null);

      // Feedback de criação de usuário do sistema
      if (!memberHadSystemUser && updatedMember.user && create_system_user) {
        const roleLabel = (role: string) => (
          role === 'denomination_admin' ? 'Administrador da Denominação (Nível 3)' :
          role === 'church_admin' ? 'Administrador da Igreja (Nível 2)' :
          role === 'secretary' ? 'Secretário(a) (Nível 1)' : role
        );
        const chosenLabel = roleLabel(system_role);
        toast.success(`Usuário do sistema criado como ${chosenLabel}!`, {
          description: `Credenciais enviadas para ${user_email}.`
        });
      } else if (accessRevoked) {
        toast.success('Acesso ao sistema removido', {
          description: 'O membro não poderá mais fazer login até que o acesso seja reativado.'
        });
      } else if (roleChanged) {
        const roleLabel = (role: string) => (
          role === 'denomination_admin' ? 'Administrador da Denominação (Nível 3)' :
          role === 'church_admin' ? 'Administrador da Igreja (Nível 2)' :
          role === 'secretary' ? 'Secretário(a) (Nível 1)' : role
        );
        toast.success('Papel de acesso atualizado', {
          description: `Novo papel: ${roleLabel(normalizedRole ?? '')}.`
        });
      }

      if (statusChanged) {
        const previousStatusLabel = getStatusLabel(previousStatus);
        const newStatusLabel = getStatusLabel(newStatus);

        toast.success('Membro atualizado com sucesso!', {
          description: `Status alterado de ${previousStatusLabel} para ${newStatusLabel}.`,
          duration: 10000,
          action: previousStatus !== null ? {
            label: 'Desfazer',
            onClick: () => {
              membersService.updateMember(Number(id), {
                membership_status: previousStatus ?? undefined,
              }).then(() => {
                toast.success(`Status revertido para ${previousStatusLabel}.`);
              }).catch((undoError) => {
                console.error('Erro ao desfazer mudança de status:', undoError);
                toast.error('Não foi possível desfazer a alteração do status.');
              });
            },
          } : undefined,
        });
      } else if (functionChanged) {
        const previousFunctionLabel = getFunctionLabel(previousFunction);
        const newFunctionLabel = getFunctionLabel(newFunction);

        toast.success('Membro atualizado com sucesso!', {
          description: `Função ministerial alterada de ${previousFunctionLabel} para ${newFunctionLabel}.`,
          duration: 10000,
          action: previousFunction !== null ? {
            label: 'Desfazer',
            onClick: () => {
              membersService.updateMember(Number(id), {
                ministerial_function: previousFunction ?? undefined,
              }).then(() => {
                toast.success(`Função revertida para ${previousFunctionLabel}.`);
              }).catch((undoError) => {
                console.error('Erro ao desfazer mudança de função:', undoError);
                toast.error('Não foi possível desfazer a alteração da função.');
              });
            },
          } : undefined,
        });
      } else {
        toast.success('Membro atualizado com sucesso!');
      }

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
