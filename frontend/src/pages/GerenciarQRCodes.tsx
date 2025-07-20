import React, { useState, useEffect } from 'react';
import { QrCode, Download, Eye, EyeOff, RotateCcw, Copy, ExternalLink } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

interface Branch {
  id: number;
  name: string;
  qr_code_uuid: string;
  qr_code_active: boolean;
  qr_code_image?: string;
  visitor_registration_url: string;
  total_visitors_registered: number;
}

const GerenciarQRCodes: React.FC = () => {
  const { userChurch } = useAuth();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simular dados das branches (substituir por chamada à API real)
    const mockBranches: Branch[] = [
      {
        id: 1,
        name: 'Sede Principal',
        qr_code_uuid: 'c647ef08-8340-43da-930c-9ab4db2f3a11',
        qr_code_active: true,
        visitor_registration_url: `${window.location.origin}/visit/c647ef08-8340-43da-930c-9ab4db2f3a11`,
        total_visitors_registered: 45
      },
      {
        id: 2,
        name: 'Filial Norte',
        qr_code_uuid: 'b2709083-f47d-4684-b84d-18fae50bcf80',
        qr_code_active: true,
        visitor_registration_url: `${window.location.origin}/visit/b2709083-f47d-4684-b84d-18fae50bcf80`,
        total_visitors_registered: 23
      },
      {
        id: 3,
        name: 'Filial Sul',
        qr_code_uuid: 'd7a47f26-7b90-4c0e-bf03-716b95eb314b',
        qr_code_active: false,
        visitor_registration_url: `${window.location.origin}/visit/d7a47f26-7b90-4c0e-bf03-716b95eb314b`,
        total_visitors_registered: 12
      }
    ];

    setTimeout(() => {
      setBranches(mockBranches);
      setLoading(false);
    }, 1000);
  }, []);

  const handleToggleQRCode = async (branchId: number, active: boolean) => {
    try {
      // Aqui faria a chamada para a API para ativar/desativar o QR code
      setBranches(prev => 
        prev.map(branch => 
          branch.id === branchId 
            ? { ...branch, qr_code_active: active }
            : branch
        )
      );
      toast.success(`QR Code ${active ? 'ativado' : 'desativado'} com sucesso`);
    } catch (error) {
      toast.error('Erro ao alterar status do QR Code');
    }
  };

  const handleCopyURL = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('URL copiada para a área de transferência');
  };

  const handleRegenerateQRCode = async (branchId: number) => {
    try {
      // Aqui faria a chamada para a API para regenerar o QR code
      const newUuid = crypto.randomUUID();
      setBranches(prev => 
        prev.map(branch => 
          branch.id === branchId 
            ? { 
                ...branch, 
                qr_code_uuid: newUuid,
                visitor_registration_url: `${window.location.origin}/visit/${newUuid}`
              }
            : branch
        )
      );
      toast.success('QR Code regenerado com sucesso');
    } catch (error) {
      toast.error('Erro ao regenerar QR Code');
    }
  };

  const handleDownloadQRCode = (branch: Branch) => {
    // Gerar QR code e fazer download
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(branch.visitor_registration_url)}`;
    
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `qr-code-${branch.name.toLowerCase().replace(/\s+/g, '-')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('QR Code baixado com sucesso');
  };

  const handleTestURL = (url: string) => {
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600 mx-auto"></div>
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
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gerenciar QR Codes</h1>
          <p className="text-gray-600 mt-1">
            Configure e monitore os QR Codes para registro de visitantes
          </p>
        </div>

        {/* Cards dos QR Codes */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {branches.map((branch) => (
            <Card key={branch.id} className="relative">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{branch.name}</CardTitle>
                  <Badge 
                    variant={branch.qr_code_active ? "default" : "secondary"}
                    className={branch.qr_code_active ? "bg-green-500" : ""}
                  >
                    {branch.qr_code_active ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
                <CardDescription>
                  {branch.total_visitors_registered} visitantes registrados
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Preview do QR Code */}
                <div className="flex justify-center">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(branch.visitor_registration_url)}`}
                      alt={`QR Code ${branch.name}`}
                      className="w-32 h-32"
                    />
                  </div>
                </div>

                {/* URL do QR Code */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">URL de Registro</Label>
                  <div className="flex gap-2">
                    <Input
                      value={branch.visitor_registration_url}
                      readOnly
                      className="text-xs"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyURL(branch.visitor_registration_url)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {/* Controles */}
                <div className="space-y-3">
                  {/* Ativar/Desativar */}
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">QR Code Ativo</Label>
                    <Switch
                      checked={branch.qr_code_active}
                      onCheckedChange={(checked) => handleToggleQRCode(branch.id, checked)}
                    />
                  </div>

                  {/* Botões de ação */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadQRCode(branch)}
                      className="flex-1"
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Baixar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTestURL(branch.visitor_registration_url)}
                      className="flex-1"
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Testar
                    </Button>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRegenerateQRCode(branch.id)}
                    className="w-full text-orange-600 border-orange-200 hover:bg-orange-50"
                  >
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Regenerar QR Code
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Instruções */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Como usar os QR Codes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm text-gray-600">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">1. Ativar QR Code</h4>
                <p>Ative o QR Code da filial para permitir que visitantes se registrem através dele.</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">2. Baixar e Imprimir</h4>
                <p>Baixe a imagem do QR Code e imprima para colocar em locais visíveis na igreja.</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">3. Visitantes Escaneiam</h4>
                <p>Quando os visitantes escanearem o QR Code, serão direcionados para o formulário de registro.</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">4. Acompanhar Registros</h4>
                <p>Monitore os registros na página de visitantes e faça o acompanhamento adequado.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default GerenciarQRCodes;