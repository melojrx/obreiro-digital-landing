import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import { MemberForm } from '@/components/members/MemberForm';
import { membersService, CreateMemberData, Member } from '@/services/membersService';
import { toast } from 'sonner';

const EditarMembro: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
      await membersService.updateMember(Number(id), data);
      toast.success('Membro atualizado com sucesso!');
      navigate(`/membros/${id}`);
    } catch (error) {
      console.error('Erro ao atualizar membro:', error);
      toast.error('Erro ao atualizar membro. Tente novamente.');
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
      <MemberForm
        member={member}
        title={`Editar Membro - ${member.full_name}`}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={saving}
      />
    </AppLayout>
  );
};

export default EditarMembro; 