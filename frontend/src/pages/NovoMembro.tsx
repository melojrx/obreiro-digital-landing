import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AxiosError } from 'axios';
import AppLayout from '@/components/layout/AppLayout';
import { MemberForm } from '@/components/members/MemberForm';
import { membersService, CreateMemberData } from '@/services/membersService';
import { toast } from 'sonner';
import { usePermissions } from '@/hooks/usePermissions';

const NovoMembro: React.FC = () => {
  const navigate = useNavigate();
  const permissions = usePermissions();

  const handleSubmit = async (data: CreateMemberData) => {
    try {
      console.log('Dados enviados para API:', data);
      await membersService.createMember(data);
      
      // Mensagem de sucesso diferenciada se criou usuário
      if (data.create_system_user && data.user_email) {
        toast.success('Membro cadastrado! Credenciais de acesso enviadas por e-mail.', {
          description: `Um e-mail foi enviado para ${data.user_email} com a senha de acesso.`
        });
      } else {
        toast.success('Membro cadastrado com sucesso!');
      }
      
      navigate('/membros');
    } catch (error) {
      console.error('Erro ao criar membro:', error);
      
      const axiosError = error as AxiosError<any>;
      console.error('Response data:', JSON.stringify(axiosError?.response?.data, null, 2));
      console.error('Response status:', axiosError?.response?.status);
      console.error('Response headers:', axiosError?.response?.headers);
      
      // Mostrar erro específico se disponível
      const errorData = axiosError?.response?.data;
      let errorMessage = 'Erro ao cadastrar membro. Tente novamente.';
      
      if (errorData) {
        if (typeof errorData === 'string') {
          errorMessage = errorData;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.detail) {
          errorMessage = errorData.detail;
        } else if (errorData.non_field_errors) {
          errorMessage = errorData.non_field_errors.join(', ');
        } else {
          // Mostrar erros de campo específicos
          const fieldErrors = Object.entries(errorData)
            .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
            .join('; ');
          if (fieldErrors) {
            errorMessage = fieldErrors;
          }
        }
      }
      
      toast.error(errorMessage);
    }
  };

  const handleCancel = () => {
    navigate('/membros');
  };

  return (
    <AppLayout>
      {!permissions.canCreateMembers ? (
        <div className="p-6">
          <h2 className="text-lg font-semibold">Acesso negado</h2>
          <p className="text-sm text-gray-600">Você não tem permissão para cadastrar membros.</p>
          <div className="mt-4">
            <button className="text-blue-600" onClick={handleCancel}>Voltar</button>
          </div>
        </div>
      ) : (
        <MemberForm
          title="Novo Membro"
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      )}
    </AppLayout>
  );
};

export default NovoMembro; 
