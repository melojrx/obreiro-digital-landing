import React, { useState, useEffect } from 'react';
import { QrCode, RefreshCw, AlertCircle, Download } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { BranchQRCard } from '@/components/branches/BranchQRCard';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { usePermissions } from '@/hooks/usePermissions';
import { api } from '@/config/api';
import { toast } from 'sonner';

interface Branch {
  id: number;
  name: string;
  church_name: string;
  city: string;
  state: string;
  qr_code_uuid: string;
  qr_code_image: string;
  qr_code_active: boolean;
  total_visitors_registered: number;
  allows_visitor_registration: boolean;
}

const QRCodesPage: React.FC = () => {
  const permissions = usePermissions();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBranches = async () => {
    try {
      const response = await api.get('/branches/qr_codes/');
      setBranches(response.data);
    } catch (error) {
      console.error('Erro ao buscar QR Codes:', error);
      toast.error('Erro ao carregar QR Codes');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchBranches();
  };

  const handleToggleQR = async (branchId: number) => {
    try {
      await api.post(`/branches/${branchId}/toggle_qr_code/`);
      toast.success('Status do QR Code atualizado');
      fetchBranches();
    } catch (error) {
      console.error('Erro ao alterar status do QR Code:', error);
      toast.error('Erro ao alterar status do QR Code');
    }
  };

  const handleDownloadAll = () => {
    branches.forEach((branch) => {
      if (branch.qr_code_image) {
        const link = document.createElement('a');
        link.href = branch.qr_code_image;
        link.download = `qrcode-${branch.name.replace(/\s+/g, '-').toLowerCase()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Delay entre downloads para não sobrecarregar
        setTimeout(() => {}, 100);
      }
    });
    toast.success(`${branches.length} QR Code${branches.length > 1 ? 's' : ''} baixado${branches.length > 1 ? 's' : ''}`);
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando QR Codes...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
              <QrCode className="h-7 w-7 sm:h-8 sm:w-8" />
              QR Codes de Visitantes
            </h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">
              {permissions.canManageChurches
                ? 'Gerencie os QR Codes de todas as congregações da denominação'
                : permissions.canCreateBranches
                ? 'Visualize e gerencie os QR Codes das suas congregações'
                : 'Visualize os QR Codes disponíveis para registro de visitantes'}
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            
            {branches.length > 0 && (
              <Button
                variant="default"
                onClick={handleDownloadAll}
              >
                <Download className="h-4 w-4 mr-2" />
                Baixar Todos
              </Button>
            )}
          </div>
        </div>

        {/* Info Alert */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Sobre os QR Codes</AlertTitle>
          <AlertDescription>
            Os QR Codes permitem que visitantes se registrem facilmente ao escanear o código.
            Cada congregação possui seu próprio QR Code único. Você pode imprimi-los e colocá-los
            em locais estratégicos da igreja.
          </AlertDescription>
        </Alert>

        {/* QR Codes Grid */}
        {branches.length === 0 ? (
          <div className="text-center py-12">
            <QrCode className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum QR Code disponível
            </h3>
            <p className="text-gray-600 mb-4">
              {permissions.canCreateBranches
                ? 'Crie uma congregação para gerar QR Codes automaticamente.'
                : 'Entre em contato com o administrador para criar congregações.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {branches.map((branch) => (
              <BranchQRCard
                key={branch.id}
                branch={branch}
                onToggleQR={permissions.canManageChurches || permissions.canCreateBranches ? handleToggleQR : undefined}
                canManage={permissions.canManageChurches || permissions.canCreateBranches}
              />
            ))}
          </div>
        )}

        {/* Footer Info */}
        {branches.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">Dicas de uso:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-blue-800">
              <li>Imprima os QR Codes em tamanho A4 para melhor visibilidade</li>
              <li>Coloque-os na entrada da igreja, recepção e áreas de convivência</li>
              <li>Teste sempre o QR Code após imprimir para garantir que funciona</li>
              <li>Você pode desativar temporariamente um QR Code sem precisar removê-lo</li>
              <li>Monitore os visitantes registrados através do painel de Visitantes</li>
            </ul>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default QRCodesPage;
