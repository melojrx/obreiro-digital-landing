import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  MapPin,
  Mail,
  Phone,
  Edit,
  MoreHorizontal,
  History,
  AlertCircle,
  CheckCircle,
  Users,
  Calendar,
  Clock,
  TrendingUp,
  UserCheck,
} from 'lucide-react';

import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { branchService } from '@/services/branchService';
import type { BranchDetails } from '@/types/hierarchy';
import EditBranchModal from '@/components/modals/EditBranchModal';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { buildMediaUrl, SERVER_BASE_URL } from '@/config/api';
import { QrCode, Download, ExternalLink, RotateCcw, Copy } from 'lucide-react';

const BranchDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [branch, setBranch] = useState<BranchDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [visitorStats, setVisitorStats] = useState<any>(null);

  const loadBranch = useCallback(async () => {
    if (!id || isNaN(Number(id))) {
      navigate('/denominacao/churches');
      return;
    }
    try {
      setIsLoading(true);
      const data = await branchService.getBranch(Number(id));
      setBranch(data);
    } catch (error) {
      console.error('Erro ao carregar filial:', error);
      toast({ title: 'Erro ao carregar filial', variant: 'destructive' });
      navigate('/denominacao/churches');
    } finally {
      setIsLoading(false);
    }
  }, [id, navigate]);

  const loadVisitorStats = useCallback(async () => {
    if (!id) return;
    try {
      const stats = await branchService.getVisitorStats(Number(id));
      setVisitorStats(stats);
    } catch (error) {
      // Não é crítico para a página
      console.warn('Não foi possível carregar estatísticas da filial.');
    }
  }, [id]);

  useEffect(() => {
    loadBranch();
  }, [loadBranch]);

  useEffect(() => {
    loadVisitorStats();
  }, [loadVisitorStats]);

  const handleBack = () => {
    const churchId = (branch as any)?.church_id || (branch as any)?.church;
    if (churchId) {
      navigate(`/denominacao/churches/${churchId}`);
    } else {
      navigate('/denominacao/churches');
    }
  };

  const handleEdit = () => setIsEditOpen(true);

  const handleToggleQR = async () => {
    if (!branch) return;
    try {
      const { data } = await branchService.toggleQRCode(branch.id);
      setBranch(prev => (prev ? { ...prev, ...data } : prev));
      toast({ title: `QR Code ${data.qr_code_active ? 'ativado' : 'desativado'} com sucesso` });
    } catch (error) {
      toast({ title: 'Erro ao alternar QR Code', variant: 'destructive' });
    }
  };

  const handleRegenerateQR = async () => {
    if (!branch) return;
    try {
      const { data } = await branchService.regenerateQRCode(branch.id);
      setBranch(prev => (prev ? { ...prev, ...data } : prev));
      toast({ title: 'QR Code regenerado com sucesso' });
    } catch (error) {
      toast({ title: 'Erro ao regenerar QR Code', variant: 'destructive' });
    }
  };

  const registrationUrl = (branch as any)?.visitor_registration_url ||
    `${window.location.origin}/visit/${branch?.qr_code_uuid}`;

  const qrCodeUrl = (branch as any)?.qr_code_url
    || (branch as any)?.qr_code_image ? buildMediaUrl((branch as any).qr_code_image) :
    `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(registrationUrl)}`;

  const handleCopyURL = () => {
    try {
      navigator.clipboard.writeText(registrationUrl);
      toast({ title: 'URL copiada para a área de transferência' });
    } catch (_) {
      // noop
    }
  };

  const handleDownloadQRCode = () => {
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `qr-code-${branch?.name?.toLowerCase().replace(/\s+/g, '-')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: 'QR Code baixado com sucesso' });
  };

  const handleTestURL = () => {
    window.open(registrationUrl, '_blank');
  };

  const handleDelete = async () => {
    if (!branch) return;
    setIsDeleting(true);
    try {
      await branchService.deleteBranch(branch.id);
      toast({ title: 'Filial excluída com sucesso' });
      handleBack();
    } catch (error) {
      toast({ title: 'Erro ao excluir filial', variant: 'destructive' });
    } finally {
      setIsDeleting(false);
      setConfirmDelete(false);
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="p-6">Carregando filial...</div>
      </AppLayout>
    );
  }

  if (!branch) {
    return (
      <AppLayout>
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Button variant="outline" size="sm" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
            </Button>
            <span className="text-muted-foreground">Filial não encontrada</span>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
            </Button>
            <div>
              <h1 className="text-xl font-semibold flex items-center gap-2">
                {branch.name}
                {((branch as any).is_main || (branch as any).is_headquarters) && (
                  <Badge variant="default">Matriz</Badge>
                )}
              </h1>
              <p className="text-sm text-gray-600 flex items-center gap-1">
                <MapPin className="h-4 w-4" /> {branch.city}, {branch.state}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleEdit}>
              <Edit className="h-4 w-4 mr-2" /> Editar
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Ações</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleToggleQR}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {branch.qr_code_active ? 'Desativar QR' : 'Ativar QR'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleRegenerateQR}>
                  <History className="h-4 w-4 mr-2" /> Regenerar QR
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600" onClick={() => setConfirmDelete(true)}>
                  <AlertCircle className="h-4 w-4 mr-2" /> Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Estatísticas de Visitantes (cards) – agora no topo */}
        {visitorStats && (
          <Card>
            <CardHeader>
              <CardTitle>Estatísticas de Visitantes</CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const s = (visitorStats?.stats as any) || visitorStats || {};
                const total = s.total ?? 0;
                const last30 = s.last_30_days ?? 0;
                const last7 = s.last_7_days ?? 0;
                const converted = s.converted_to_members ?? 0;
                const rate = s.conversion_rate ?? 0;
                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="p-4 border rounded-md bg-white">
                      <div className="flex items-center gap-3">
                        <Users className="h-6 w-6 text-blue-600" />
                        <div>
                          <div className="text-xs text-gray-500">Total</div>
                          <div className="text-xl font-semibold">{total}</div>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 border rounded-md bg-white">
                      <div className="flex items-center gap-3">
                        <Calendar className="h-6 w-6 text-purple-600" />
                        <div>
                          <div className="text-xs text-gray-500">Últimos 30 dias</div>
                          <div className="text-xl font-semibold">{last30}</div>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 border rounded-md bg-white">
                      <div className="flex items-center gap-3">
                        <Clock className="h-6 w-6 text-orange-600" />
                        <div>
                          <div className="text-xs text-gray-500">Últimos 7 dias</div>
                          <div className="text-xl font-semibold">{last7}</div>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 border rounded-md bg-white">
                      <div className="flex items-center gap-3">
                        <UserCheck className="h-6 w-6 text-green-600" />
                        <div>
                          <div className="text-xs text-gray-500">Convertidos em membros</div>
                          <div className="text-xl font-semibold">{converted}</div>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 border rounded-md bg-white">
                      <div className="flex items-center gap-3">
                        <TrendingUp className="h-6 w-6 text-emerald-600" />
                        <div>
                          <div className="text-xs text-gray-500">Taxa de conversão</div>
                          <div className="text-xl font-semibold">{rate}%</div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        )}

        {/* Info principal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-600" />
              Informações da Filial
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-gray-500">Email</div>
                <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-gray-400" /> {branch.email || '-'}</div>
              </div>
              <div>
                <div className="text-gray-500">Telefone</div>
                <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-gray-400" /> {branch.phone || '-'}</div>
              </div>
              <div>
                <div className="text-gray-500">QR Code</div>
                <Badge variant={branch.qr_code_active ? 'default' : 'secondary'}>
                  {branch.qr_code_active ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
            </div>
            <Separator />
            <div>
              <div className="text-gray-500">Endereço</div>
              <div>{branch.address}</div>
              <div className="text-sm text-gray-600">CEP {branch.zipcode}</div>
            </div>
          </CardContent>
        </Card>

        {/* QR Code – estilo unificado (como na página de visitantes) */}
        <Card className="relative">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="text-base lg:text-lg leading-tight pr-2">{branch.name}</CardTitle>
              <Badge 
                variant={branch.qr_code_active ? 'default' : 'secondary'}
                className={`shrink-0 text-xs ${branch.qr_code_active ? 'bg-green-500' : ''}`}
              >
                {branch.qr_code_active ? 'Ativo' : 'Inativo'}
              </Badge>
            </div>
            <div className="text-xs text-gray-600">
              {(branch as any).total_visitors_registered || 0} visitante{((branch as any).total_visitors_registered || 0) === 1 ? '' : 's'} registrado{((branch as any).total_visitors_registered || 0) === 1 ? '' : 's'}
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Preview */}
            <div className="flex justify-center">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                <img
                  src={qrCodeUrl}
                  alt={`QR Code ${branch.name}`}
                  className="w-32 h-32"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (!target.src.includes('api.qrserver.com')) {
                      target.src = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(registrationUrl)}`;
                    }
                  }}
                />
              </div>
            </div>

            {/* URL */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">URL de Registro</Label>
              <div className="flex gap-2">
                <Input value={registrationUrl} readOnly className="text-xs" />
                <Button variant="outline" size="sm" onClick={handleCopyURL} className="shrink-0 h-9">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Controles */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm">QR Code Ativo</Label>
                <Switch checked={!!branch.qr_code_active} onCheckedChange={handleToggleQR} />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" onClick={handleDownloadQRCode}>
                  <Download className="h-4 w-4 mr-1" /> Baixar
                </Button>
                <Button variant="outline" size="sm" onClick={handleTestURL}>
                  <ExternalLink className="h-4 w-4 mr-1" /> Testar
                </Button>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleRegenerateQR}
                className="w-full text-orange-600 border-orange-200 hover:bg-orange-50"
              >
                <RotateCcw className="h-4 w-4 mr-1" /> Regenerar QR Code
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Ajuda – Como usar os QR Codes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" /> Como usar os QR Codes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="font-semibold">1. Ativar QR Code</div>
                <div className="text-gray-600">Ative o QR Code da filial para permitir que visitantes se registrem.</div>
              </div>
              <div>
                <div className="font-semibold">2. Baixar e Imprimir</div>
                <div className="text-gray-600">Baixe a imagem do QR Code e imprima para colocar em locais visíveis.</div>
              </div>
              <div>
                <div className="font-semibold">3. Visitantes Escaneiam</div>
                <div className="text-gray-600">Ao escanear, visitantes são direcionados ao formulário de registro.</div>
              </div>
              <div>
                <div className="font-semibold">4. Acompanhar Registros</div>
                <div className="text-gray-600">Monitore os registros na página de visitantes e faça acompanhamento.</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Estatísticas removidas do final (já renderizadas no topo) */}
      </div>

      {/* Modal de edição */}
      <EditBranchModal
        isOpen={isEditOpen}
        branch={branch}
        onClose={() => setIsEditOpen(false)}
        onSuccess={(updated) => {
          setBranch(prev => (prev ? { ...prev, ...updated } : updated));
        }}
      />

      {/* Confirmação de exclusão */}
      <AlertDialog open={confirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir filial?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A filial será removida do sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmDelete(false)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
};

export default BranchDetailsPage;
