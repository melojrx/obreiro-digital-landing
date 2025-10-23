import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { VisitorForm, VisitorFormData } from '@/components/visitors/VisitorForm';
import { getVisitor, updateVisitor, type Visitor } from '@/services/visitorsService';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const EditarVisitante: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [visitor, setVisitor] = useState<Visitor | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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

  const handleSubmit = async (data: VisitorFormData) => {
    if (!id) return;

    try {
      setSaving(true);
      await updateVisitor(Number(id), {
        ...data,
        branch: data.branch ?? visitor?.branch,
      });
      toast.success('Visitante atualizado com sucesso!');
      navigate(`/visitantes/${id}`);
    } catch (error) {
      console.error('Erro ao atualizar visitante:', error);
      toast.error('Erro ao atualizar visitante. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    navigate(`/visitantes/${id}`);
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
          <Button
            onClick={() => navigate('/visitantes')}
            className="mt-4"
            variant="outline"
          >
            Voltar para lista de visitantes
          </Button>
        </div>
      </AppLayout>
    );
  }

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
              <h1 className="text-3xl font-bold text-gray-900">Editar Visitante</h1>
              <p className="text-gray-600">
                Editando dados de {visitor.full_name}
              </p>
            </div>
          </div>
        </div>

        {/* Formulário */}
        <div className="max-w-4xl">
          <VisitorForm
            initialData={visitor}
            onSubmit={handleSubmit}
            isSubmitting={saving}
            submitLabel="Atualizar Visitante"
            title="Editar Dados do Visitante"
            description="Atualize as informações do visitante abaixo"
          />
        </div>
      </div>
    </AppLayout>
  );
};

export default EditarVisitante;
