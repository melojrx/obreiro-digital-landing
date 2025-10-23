import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { VisitorForm, VisitorFormData } from '@/components/visitors/VisitorForm';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { createVisitor } from '@/services/visitorsService';
import { useCurrentActiveChurch } from '@/hooks/useActiveChurch';

const NovoVisitante: React.FC = () => {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const activeChurch = useCurrentActiveChurch();

  const handleSubmit = async (data: VisitorFormData) => {
    try {
      const branchId = activeChurch?.active_branch?.id;
      if (!branchId) {
        toast.error('Defina uma filial ativa antes de cadastrar visitantes.');
        return;
      }

      setSaving(true);
      const visitor = await createVisitor({ ...data, branch: branchId });
      toast.success('Visitante cadastrado com sucesso!');
      navigate(`/visitantes/${visitor.id}`);
    } catch (error) {
      console.error('Erro ao criar visitante:', error);
      toast.error('Erro ao cadastrar visitante. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    navigate('/visitantes');
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Novo Visitante</h1>
              <p className="text-gray-600">
                Cadastre um novo visitante no sistema
              </p>
            </div>
          </div>
        </div>

        {/* Formulário */}
        <div className="max-w-4xl">
          <VisitorForm
            onSubmit={handleSubmit}
            isSubmitting={saving}
            submitLabel="Cadastrar Visitante"
            title="Dados do Novo Visitante"
            description="Preencha as informações do visitante para cadastrá-lo no sistema"
          />
        </div>
      </div>
    </AppLayout>
  );
};

export default NovoVisitante;
