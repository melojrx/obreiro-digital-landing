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
import { branchService, BranchQRCode } from '@/services/branchService';


const GerenciarQRCodes: React.FC = () => {
  const [branches, setBranches] = useState<BranchQRCode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBranches();
  }, []);

  const loadBranches = async () => {
    try {
      setLoading(true);
      const data = await branchService.getBranchesQRCodes();
      setBranches(data);
    } catch (error: any) {
      console.error('Erro ao carregar filiais:', error);
      toast.error(error.message || 'Erro ao carregar filiais');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleQRCode = async (branchId: number, active: boolean) => {
    try {
      const result = await branchService.toggleQRCode(branchId);
      
      // Atualizar o estado local com os novos dados
      setBranches(prev => 
        prev.map(branch => 
          branch.id === branchId ? result.data : branch
        )
      );
      
      toast.success(result.message);
    } catch (error: any) {
      console.error('Erro ao alterar status do QR Code:', error);
      toast.error(error.message || 'Erro ao alterar status do QR Code');
    }
  };

  const handleCopyURL = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('URL copiada para a área de transferência');
  };

  const handleRegenerateQRCode = async (branchId: number) => {
    try {
      const result = await branchService.regenerateQRCode(branchId);
      
      // Atualizar o estado local com os novos dados
      setBranches(prev => 
        prev.map(branch => 
          branch.id === branchId ? result.data : branch
        )
      );
      
      toast.success(result.message);
    } catch (error: any) {
      console.error('Erro ao regenerar QR Code:', error);
      toast.error(error.message || 'Erro ao regenerar QR Code');
    }
  };

  const handleDownloadQRCode = (branch: BranchQRCode) => {
    // Usar a imagem do QR Code do backend se disponível, senão gerar via API externa
    const qrCodeUrl = branch.qr_code_url || 
      `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(branch.visitor_registration_url)}`;
    
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
        <div className="text-center sm:text-left">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Gerenciar QR Codes</h1>
          <p className="text-gray-600 mt-1 text-xs sm:text-sm lg:text-base">
            Configure e monitore os QR Codes de todas as igrejas e filiais que você tem acesso
          </p>
        </div>

        {/* Cards dos QR Codes */}
        {branches.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <QrCode className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum QR Code encontrado</h3>
              <p className="text-gray-600 text-center max-w-md">
                Não há filiais com QR Codes disponíveis para as igrejas que você tem acesso. 
                Entre em contato com o administrador para criar filiais.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Agrupar por igreja */}
            {Object.entries(
              branches.reduce((groups, branch) => {
                const churchName = branch.church_name;
                if (!groups[churchName]) {
                  groups[churchName] = [];
                }
                groups[churchName].push(branch);
                return groups;
              }, {} as Record<string, BranchQRCode[]>)
            ).map(([churchName, churchBranches]) => (
              <div key={churchName} className="space-y-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-gray-900">{churchName}</h2>
                  <Badge variant="outline" className="text-xs">
                    {churchBranches.length} filial{churchBranches.length !== 1 ? 'is' : ''}
                  </Badge>
                </div>
                <div className="grid gap-3 sm:gap-4 lg:gap-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
                  {churchBranches.map((branch) => (
            <Card key={branch.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-sm sm:text-base lg:text-lg leading-tight truncate pr-2">{branch.name}</CardTitle>
                  <Badge 
                    variant={branch.qr_code_active ? "default" : "secondary"}
                    className={`shrink-0 text-xs ${branch.qr_code_active ? "bg-green-500" : ""}`}
                  >
                    {branch.qr_code_active ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
                <CardDescription className="text-xs sm:text-sm">
                  {branch.total_visitors_registered} visitante{branch.total_visitors_registered !== 1 ? 's' : ''} registrado{branch.total_visitors_registered !== 1 ? 's' : ''}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-3 sm:space-y-4">
                {/* Preview do QR Code */}
                <div className="flex justify-center">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-2 sm:p-3 lg:p-4">
                    <img
                      src={branch.qr_code_url || `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(branch.visitor_registration_url)}`}
                      alt={`QR Code ${branch.name}`}
                      className="w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32"
                      onError={(e) => {
                        // Fallback para API externa se a imagem do backend falhar
                        const target = e.target as HTMLImageElement;
                        if (!target.src.includes('api.qrserver.com')) {
                          target.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(branch.visitor_registration_url)}`;
                        }
                      }}
                    />
                  </div>
                </div>

                {/* URL do QR Code */}
                <div className="space-y-1 sm:space-y-2">
                  <Label className="text-xs sm:text-sm font-medium">URL de Registro</Label>
                  <div className="flex gap-1 sm:gap-2">
                    <Input
                      value={branch.visitor_registration_url}
                      readOnly
                      className="text-[10px] sm:text-xs overflow-hidden"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyURL(branch.visitor_registration_url)}
                      className="shrink-0 h-8 sm:h-9"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {/* Controles */}
                <div className="space-y-2 sm:space-y-3">
                  {/* Ativar/Desativar */}
                  <div className="flex items-center justify-between">
                    <Label className="text-xs sm:text-sm">QR Code Ativo</Label>
                    <Switch
                      checked={branch.qr_code_active}
                      onCheckedChange={(checked) => handleToggleQRCode(branch.id, checked)}
                    />
                  </div>

                  {/* Botões de ação */}
                  <div className="grid grid-cols-2 gap-1 sm:gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadQRCode(branch)}
                      className="text-[10px] sm:text-xs h-7 sm:h-8"
                    >
                      <Download className="h-3 w-3 mr-0.5 sm:mr-1" />
                      <span className="hidden xs:inline">Baixar</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTestURL(branch.visitor_registration_url)}
                      className="text-[10px] sm:text-xs h-7 sm:h-8"
                    >
                      <ExternalLink className="h-3 w-3 mr-0.5 sm:mr-1" />
                      <span className="hidden xs:inline">Testar</span>
                    </Button>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRegenerateQRCode(branch.id)}
                    className="w-full text-orange-600 border-orange-200 hover:bg-orange-50 text-[10px] sm:text-xs h-7 sm:h-8"
                  >
                    <RotateCcw className="h-3 w-3 mr-0.5 sm:mr-1" />
                    <span className="hidden xs:inline">Regenerar QR Code</span>
                    <span className="xs:hidden">Regenerar</span>
                  </Button>
                </div>
              </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Instruções */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <QrCode className="h-4 w-4 sm:h-5 sm:w-5" />
              Como usar os QR Codes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900 text-xs sm:text-sm">1. Ativar QR Code</h4>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">Ative o QR Code da filial para permitir que visitantes se registrem através dele.</p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900 text-xs sm:text-sm">2. Baixar e Imprimir</h4>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">Baixe a imagem do QR Code e imprima para colocar em locais visíveis na igreja.</p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900 text-xs sm:text-sm">3. Visitantes Escaneiam</h4>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">Quando os visitantes escanearem o QR Code, serão direcionados para o formulário de registro.</p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900 text-xs sm:text-sm">4. Acompanhar Registros</h4>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">Monitore os registros na página de visitantes e faça o acompanhamento adequado.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default GerenciarQRCodes;