import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Building2,
  ArrowLeft,
  Edit,
  Share2,
  MoreHorizontal,
  MapPin,
  Phone,
  Mail,
  Globe,
  Users,
  Calendar,
  TrendingUp,
  Building,
  UserCheck,
  Settings,
  Eye,
  PlusCircle,
  Download,
  AlertCircle,
  CheckCircle,
  Clock,
  History,
  UserPlus,
  BarChart3,
  FileText,
  User
} from 'lucide-react';

import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';
import { translateRole } from '@/utils/roleTranslations';
import { churchService } from '@/services/churchService';
import { branchService } from '@/services/branchService';
import EditBranchModal from '@/components/modals/EditBranchModal';
import { usePermissions } from '@/hooks/usePermissions';
import { ChurchDetails, ChurchStats, AdminUser, BranchDetails } from '@/types/hierarchy';

interface ChurchHistoryEntry {
  id: number | string;
  timestamp: string;
  user: string;
  action: string;
  field: string;
  old_value?: string | null;
  new_value?: string | null;
}

// Importar os novos componentes modais
import CreateBranchModal from '@/components/modals/CreateBranchModal';
import ShareChurchModal from '@/components/modals/ShareChurchModal';
import ExportChurchDataModal from '@/components/modals/ExportChurchDataModal';
import ChurchMembersCard from '@/components/church/ChurchMembersCard';

const ChurchDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const permissions = usePermissions();
  
  const [isLoading, setIsLoading] = useState(true);
  const [church, setChurch] = useState<ChurchDetails | null>(null);
  const [statistics, setStatistics] = useState<ChurchStats | null>(null);
  const [branches, setBranches] = useState<BranchDetails[]>([]);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [history, setHistory] = useState<ChurchHistoryEntry[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Estados para os modais
  const [isCreateBranchModalOpen, setIsCreateBranchModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isEditBranchModalOpen, setIsEditBranchModalOpen] = useState(false);
  const [branchToEdit, setBranchToEdit] = useState<BranchDetails | null>(null);
  const [branchToDelete, setBranchToDelete] = useState<BranchDetails | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadChurchData = useCallback(async () => {
    if (!id || isNaN(Number(id))) {
      navigate('/denominacao/churches');
      return;
    }

    try {
      setIsLoading(true);
      const churchData = await churchService.getChurch(Number(id));
      setChurch(churchData);
    } catch (error) {
      console.error('Erro ao carregar igreja:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar dados da igreja. Tente novamente.',
        variant: 'destructive',
      });
      navigate('/denominacao/churches');
    } finally {
      setIsLoading(false);
    }
  }, [id, navigate]);

  const loadStatistics = useCallback(async () => {
    if (!id) return;

    try {
      const stats = await churchService.getChurchStatistics(Number(id));
      setStatistics(stats);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  }, [id]);

  const loadBranches = useCallback(async () => {
    if (!id) return;
    try {
      // Usar o endpoint de branches para garantir campos de QR (qr_code_active, etc.)
      const paginated = await branchService.getBranchesByChurch(Number(id), 1, 100);
      const items = Array.isArray((paginated as any).results) ? (paginated as any).results : (paginated as any).branches || [];
      setBranches(items as BranchDetails[]);
    } catch (error) {
      console.error('Erro ao carregar congregações:', error);
    }
  }, [id]);

  const loadAdmins = useCallback(async () => {
    if (!id) return;

    try {
      const adminsData = await churchService.getChurchAdmins(Number(id));
      setAdmins(adminsData);
    } catch (error) {
      console.error('Erro ao carregar administradores:', error);
    }
  }, [id]);

  const loadHistory = useCallback(async () => {
    if (!id) return;

    try {
      const historyData = await churchService.getChurchHistory(Number(id));
      const normalized = Array.isArray(historyData) ? historyData : [];
      setHistory(normalized);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    }
  }, [id]);

  useEffect(() => {
    loadChurchData();
  }, [loadChurchData]);

  useEffect(() => {
    if (activeTab === 'statistics' && !statistics) {
      loadStatistics();
    } else if (activeTab === 'branches' && branches.length === 0) {
      loadBranches();
    } else if (activeTab === 'admins' && admins.length === 0) {
      loadAdmins();
    } else if (activeTab === 'history' && history.length === 0) {
      loadHistory();
    }
  }, [
    activeTab,
    statistics,
    branches.length,
    admins.length,
    history.length,
    loadStatistics,
    loadBranches,
    loadAdmins,
    loadHistory,
  ]);

  const handleEdit = () => {
    if (church) {
      navigate(`/denominacao/churches/${church.id}/edit`);
    }
  };

  const handleCreateBranch = () => {
    setIsCreateBranchModalOpen(true);
  };

  const handleShareChurch = () => {
    setIsShareModalOpen(true);
  };

  const handleOpenExportModal = () => {
    setIsExportModalOpen(true);
  };

  const handleBranchCreated = (newBranch: BranchDetails) => {
    setBranches(prev => (Array.isArray(prev) ? [...prev, newBranch] : [newBranch]));
    // Recarregar dados da igreja para atualizar contadores
    if (church) {
      loadChurchData();
    }
  };

  // Função simplificada que abre o modal
  const handleExportData = () => {
    setIsExportModalOpen(true);
  };

  const updateBranchInState = (updated: BranchDetails) => {
    setBranches(prev => prev.map(b => (b.id === updated.id ? { ...b, ...updated } : b)) as BranchDetails[]);
  };

  const orderedBranches = useMemo(() => {
    return [...branches].sort((a: any, b: any) => {
      const aMain = (a as any).is_main || (a as any).is_headquarters ? 1 : 0;
      const bMain = (b as any).is_main || (b as any).is_headquarters ? 1 : 0;
      return bMain - aMain;
    });
  }, [branches]);

  const handleViewBranch = (b: BranchDetails) => {
    navigate(`/denominacao/branches/${b.id}`);
  };

  const handleOpenEditBranch = (b: BranchDetails) => {
    setBranchToEdit(b);
    setIsEditBranchModalOpen(true);
  };

  const handleToggleQRCode = async (b: BranchDetails) => {
    try {
      const { data } = await branchService.toggleQRCode(b.id);
      updateBranchInState(data as unknown as BranchDetails);
      toast({ title: `QR Code ${data.qr_code_active ? 'ativado' : 'desativado'} com sucesso` });
    } catch (error) {
      console.error('Erro ao alternar QR Code:', error);
      toast({ title: 'Erro ao alternar QR Code', variant: 'destructive' });
    }
  };

  const handleRegenerateQRCode = async (b: BranchDetails) => {
    try {
      const { data } = await branchService.regenerateQRCode(b.id);
      updateBranchInState(data as unknown as BranchDetails);
      toast({ title: 'QR Code regenerado com sucesso' });
    } catch (error) {
      console.error('Erro ao regenerar QR Code:', error);
      toast({ title: 'Erro ao regenerar QR Code', variant: 'destructive' });
    }
  };

  const handleRequestDeleteBranch = (b: BranchDetails) => {
    setBranchToDelete(b);
  };

  const handleConfirmDeleteBranch = async () => {
    if (!branchToDelete) return;
    setIsDeleting(true);
    try {
      await branchService.deleteBranch(branchToDelete.id);
      setBranches(prev => prev.filter(x => x.id !== branchToDelete.id));
      toast({ title: 'Filial excluída com sucesso' });
      // Atualiza contadores da igreja
      loadChurchData();
    } catch (error) {
      console.error('Erro ao excluir congregação:', error);
      toast({ title: 'Erro ao excluir congregação', variant: 'destructive' });
    } finally {
      setIsDeleting(false);
      setBranchToDelete(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      active: 'default',
      inactive: 'secondary',
      suspended: 'destructive',
      trial: 'outline'
    };
    
    const labels: Record<string, string> = {
      active: 'Ativa',
      inactive: 'Inativa', 
      suspended: 'Suspensa',
      trial: 'Período Trial'
    };

    return (
      <Badge variant={variants[status] || 'outline'}>
        {labels[status] || status}
      </Badge>
    );
  };

  const getPlanBadge = (plan: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      premium: 'default',
      basic: 'secondary',
      trial: 'outline'
    };
    
    const labels: Record<string, string> = {
      premium: 'Premium',
      basic: 'Básico',
      trial: 'Trial'
    };

    return (
      <Badge variant={variants[plan] || 'outline'}>
        {labels[plan] || plan}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          {/* Header Skeleton */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Skeleton className="h-10 w-24" />
              <div>
                <Skeleton className="h-8 w-64 mb-2" />
                <Skeleton className="h-4 w-48" />
              </div>
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-10 w-20" />
              <Skeleton className="h-10 w-20" />
            </div>
          </div>

          {/* Content Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-96 w-full" />
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!church) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Igreja não encontrada
            </h2>
            <p className="text-gray-600 mb-4">
              A igreja solicitada não existe ou você não tem permissão para visualizá-la.
            </p>
            <Button onClick={() => navigate('/denominacao/churches')}>
              Voltar para Lista
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  const totalMembers = church.members_count ?? church.total_members ?? 0;
  const branchesCount = church.branches_count ?? 0;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/denominacao/churches')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            
            <div className="flex items-center gap-4">
              {/* Logo da Igreja */}
              {church.logo ? (
                <img
                  src={church.logo}
                  alt={`Logo da ${church.name}`}
                  className="w-12 h-12 rounded-lg object-cover border"
                />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center border">
                  <Building2 className="h-6 w-6 text-blue-600" />
                </div>
              )}
              
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  {church.name}
                  {church.short_name && (
                    <Badge variant="outline">
                      {church.short_name}
                    </Badge>
                  )}
                </h1>
                <div className="flex items-center gap-4 mt-1">
                  <span className="text-gray-600 flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {church.city}, {church.state}
                  </span>
                  {getStatusBadge(church.subscription_status)}
                  {getPlanBadge(church.subscription_plan)}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {permissions.canManageChurch && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleEdit}
              >
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Ações</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleExportData}>
                  <Download className="h-4 w-4 mr-2" />
                  Exportar Dados
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleShareChurch}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Compartilhar
                </DropdownMenuItem>
                {permissions.canCreateBranches && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleCreateBranch}>
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Nova Congregação
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Imagem de Capa */}
        {church.cover_image && (
          <div className="relative h-64 rounded-lg overflow-hidden">
            <img
              src={church.cover_image}
              alt={`Capa da ${church.name}`}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black bg-opacity-40 flex items-end">
              <div className="p-6 text-white">
                <h2 className="text-2xl font-bold">{church.name}</h2>
                <p className="text-white/90">{church.description}</p>
              </div>
            </div>
          </div>
        )}

        {/* Métricas Rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Membros</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {totalMembers}
                  </p>
                  <p className="text-xs text-gray-500">
                    de {church.max_members} permitidos
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Building className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Congregações</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {branchesCount}
                  </p>
                  <p className="text-xs text-gray-500">
                    de {church.max_branches} permitidas
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <UserCheck className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Visitantes</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {church.total_visitors}
                  </p>
                  <p className="text-xs text-gray-500">este mês</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Criada em</p>
                  <p className="text-lg font-bold text-gray-900">
                    {new Date(church.created_at).toLocaleDateString('pt-BR')}
                  </p>
                  <p className="text-xs text-gray-500">
                    {Math.floor((Date.now() - new Date(church.created_at).getTime()) / (1000 * 60 * 60 * 24 * 365))} anos
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs Principal */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="statistics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Estatísticas
            </TabsTrigger>
            <TabsTrigger value="branches" className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              Congregações
            </TabsTrigger>
            <TabsTrigger value="admins" className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Administradores
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Histórico
            </TabsTrigger>
          </TabsList>

          {/* Tab: Visão Geral */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Informações Principais */}
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-blue-600" />
                      Informações da Igreja
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {church.description && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Descrição</h4>
                        <p className="text-gray-600">{church.description}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Contato</h4>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-4 w-4 text-gray-400" />
                            <span>{church.email}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-4 w-4 text-gray-400" />
                            <span>{church.phone}</span>
                          </div>
                          {church.website && (
                            <div className="flex items-center gap-2 text-sm">
                              <Globe className="h-4 w-4 text-gray-400" />
                              <a
                                href={church.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                {church.website}
                              </a>
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Localização</h4>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>{church.address}</p>
                          <p>{church.city}, {church.state}</p>
                          <p>CEP: {church.zipcode}</p>
                        </div>
                      </div>
                    </div>

                    {church.cnpj && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Documentação</h4>
                        <p className="text-sm text-gray-600">CNPJ: {church.cnpj}</p>
                      </div>
                    )}

                    {church.main_pastor && church.main_pastor.full_name && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Pastor Principal</h4>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>
                              {church.main_pastor.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{church.main_pastor.full_name}</p>
                            {church.main_pastor.email && (
                              <p className="text-sm text-gray-600">{church.main_pastor.email}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Card de Membros */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-blue-600" />
                      Membros da Igreja
                      <Badge variant="outline">{totalMembers}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChurchMembersCard churchId={church.id} />
                  </CardContent>
                </Card>
              </div>

              {/* Painel Lateral */}
              <div className="space-y-6">
                {/* Status da Assinatura */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Status da Assinatura</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Plano:</span>
                      {getPlanBadge(church.subscription_plan)}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Status:</span>
                      {getStatusBadge(church.subscription_status)}
                    </div>

                    {church.subscription_end_date && (
                      <div>
                        <span className="text-sm font-medium">Vencimento:</span>
                        <p className="text-sm text-gray-600">
                          {formatDate(church.subscription_end_date)}
                        </p>
                      </div>
                    )}

                    <Separator />

                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Membros</span>
                          <span>{totalMembers}/{church.max_members}</span>
                        </div>
                        <Progress 
                          value={church.max_members > 0 ? (totalMembers / church.max_members) * 100 : 0} 
                          className="h-2"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Congregações</span>
                          <span>{branchesCount}/{church.max_branches}</span>
                        </div>
                        <Progress 
                          value={church.max_branches > 0 ? (branchesCount / church.max_branches) * 100 : 0} 
                          className="h-2"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Ações Rápidas */}
                {permissions.canManageChurch && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Ações Rápidas</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button 
                        variant="outline" 
                        className="w-full justify-start" 
                        size="sm"
                        onClick={() => navigate('/membros')}
                      >
                        <Users className="h-4 w-4 mr-2" />
                        Gerenciar Membros
                      </Button>
                      
                      {permissions.canCreateBranches && (
                        <Button 
                          variant="outline" 
                          className="w-full justify-start" 
                          size="sm"
                          onClick={handleCreateBranch}
                        >
                          <PlusCircle className="h-4 w-4 mr-2" />
                          Nova Congregação
                        </Button>
                      )}

                      <Button 
                        variant="outline" 
                        className="w-full justify-start" 
                        size="sm"
                        onClick={() => navigate(`/denominacao/churches/${church.id}/reports`)}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Relatórios
                      </Button>

                      <Button 
                        variant="outline" 
                        className="w-full justify-start" 
                        size="sm"
                        onClick={() => navigate(`/denominacao/churches/${church.id}/settings`)}
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Configurações
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Tab: Estatísticas */}
          <TabsContent value="statistics" className="space-y-6">
            {statistics ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                      Crescimento
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium">Membros</p>
                        <p className="text-2xl font-bold text-green-600">
                          +{statistics.members_growth_rate || 0}%
                        </p>
                        <p className="text-xs text-gray-500">nos últimos 30 dias</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Visitantes</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {statistics.total_visitors}
                        </p>
                        <p className="text-xs text-gray-500">este mês</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Adicionar mais cards de estatísticas conforme necessário */}
              </div>
            ) : (
              <div className="text-center py-8">
                <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Carregando Estatísticas
                </h3>
                <p className="text-gray-600">
                  Por favor, aguarde enquanto carregamos os dados estatísticos.
                </p>
              </div>
            )}
          </TabsContent>

          {/* Tab: Congregações */}
          <TabsContent value="branches" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Congregações da Igreja</h3>
              {permissions.canCreateBranches && (
                <Button onClick={handleCreateBranch}>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Nova Congregação
                </Button>
              )}
            </div>

            {branches.length > 0 ? (
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Congregação</TableHead>
                      <TableHead>Localização</TableHead>
                      <TableHead>QRCode</TableHead>
                      <TableHead>Criada em</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orderedBranches.map((branch) => (
                      <TableRow key={branch.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium flex items-center gap-2">
                              {branch.name}
                              {((branch as any).is_main || (branch as any).is_headquarters) && (
                                <Badge variant="default">Matriz</Badge>
                              )}
                            </span>
                            {branch.email && (
                              <span className="text-xs text-muted-foreground">{branch.email}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-gray-700">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            <span>{branch.city}, {branch.state}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={branch.qr_code_active ? 'default' : 'secondary'}>
                            {branch.qr_code_active ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(branch.created_at).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Ações</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleViewBranch(branch)}>
                                <Eye className="h-4 w-4 mr-2" />
                                Ver detalhes
                              </DropdownMenuItem>
                              {(permissions.canManageBranches || permissions.canManageChurch) && (
                                <DropdownMenuItem onClick={() => handleOpenEditBranch(branch)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Editar
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              {(permissions.canManageBranches || permissions.canManageChurch) && (
                              <DropdownMenuItem onClick={() => handleToggleQRCode(branch)}>
                                <UserCheck className="h-4 w-4 mr-2" />
                                {branch.qr_code_active ? 'Desativar QR' : 'Ativar QR'}
                              </DropdownMenuItem>
                              )}
                              {(permissions.canManageBranches || permissions.canManageChurch) && (
                              <DropdownMenuItem onClick={() => handleRegenerateQRCode(branch)}>
                                <History className="h-4 w-4 mr-2" />
                                Regenerar QR
                              </DropdownMenuItem>
                              )}
                              {permissions.canManageChurch && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="text-red-600" onClick={() => handleRequestDeleteBranch(branch)}>
                                    <AlertCircle className="h-4 w-4 mr-2" />
                                    Excluir
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            ) : (
              <div className="text-center py-8">
                <Building className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhuma congregação encontrada
                </h3>
                <p className="text-gray-600 mb-4">
                  Esta igreja ainda não possui congregações cadastradas.
                </p>
                {permissions.canCreateBranches && (
                  <Button onClick={handleCreateBranch}>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Criar Primeira Filial
                  </Button>
                )}
              </div>
            )}
          </TabsContent>

          {/* Tab: Administradores */}
          <TabsContent value="admins" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Administradores da Igreja</h3>
              {permissions.canManageChurchAdmins && (
                <Button>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Adicionar Administrador
                </Button>
              )}
            </div>

            {admins.length > 0 ? (
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Cargo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Adicionado em</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {admins.map((admin) => (
                      <TableRow key={admin.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarFallback>
                                {admin.full_name ? admin.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'AD'}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{admin.full_name || 'Sem nome'}</span>
                          </div>
                        </TableCell>
                        <TableCell>{admin.email || '-'}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {translateRole(admin.role)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={admin.is_active ? 'default' : 'secondary'}>
                            {admin.is_active ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(admin.joined_at)}</TableCell>
                        <TableCell>
                          {permissions.canManageChurchAdmins && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Editar Permissões
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-red-600">
                                  <UserPlus className="h-4 w-4 mr-2" />
                                  Remover Acesso
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            ) : (
              <div className="text-center py-8">
                <UserPlus className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhum administrador encontrado
                </h3>
                <p className="text-gray-600 mb-4">
                  Esta igreja ainda não possui administradores adicionais.
                </p>
                {permissions.canManageChurchAdmins && (
                  <Button>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Adicionar Primeiro Administrador
                  </Button>
                )}
              </div>
            )}
          </TabsContent>

          {/* Tab: Histórico */}
          <TabsContent value="history" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Histórico de Alterações</h3>
            </div>

            {history.length > 0 ? (
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data/Hora</TableHead>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Ação</TableHead>
                      <TableHead>Campo</TableHead>
                      <TableHead>Alteração</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>{formatDate(entry.timestamp)}</TableCell>
                        <TableCell>{entry.user}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {entry.action}
                          </Badge>
                        </TableCell>
                        <TableCell>{entry.field}</TableCell>
                        <TableCell className="max-w-xs">
                          <div className="text-sm">
                            <div className="text-red-600 line-through">
                              {entry.old_value || 'N/A'}
                            </div>
                            <div className="text-green-600">
                              {entry.new_value || 'N/A'}
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            ) : (
              <div className="text-center py-8">
                <History className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhum histórico encontrado
                </h3>
                <p className="text-gray-600">
                  Nenhuma alteração foi registrada para esta igreja ainda.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Modais */}
      {church && (
        <>
          <CreateBranchModal
            isOpen={isCreateBranchModalOpen}
            onClose={() => setIsCreateBranchModalOpen(false)}
            churchId={church.id}
            churchName={church.name}
            onSuccess={handleBranchCreated}
          />

          {/* Editar Filial */}
          <EditBranchModal
            isOpen={isEditBranchModalOpen}
            branch={branchToEdit}
            onClose={() => setIsEditBranchModalOpen(false)}
            onSuccess={(updated) => {
              updateBranchInState(updated);
              // Atualiza métricas da igreja após edição, se necessário
              loadChurchData();
            }}
          />

          <ShareChurchModal
            isOpen={isShareModalOpen}
            onClose={() => setIsShareModalOpen(false)}
            church={church}
          />

          <ExportChurchDataModal
            isOpen={isExportModalOpen}
            onClose={() => setIsExportModalOpen(false)}
            church={church}
          />
        </>
      )}

      {/* Confirmação de Exclusão de Filial */}
      <AlertDialog open={!!branchToDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir congregação?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A congregação será removida do sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setBranchToDelete(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDeleteBranch} disabled={isDeleting}>
              {isDeleting ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
};

export default ChurchDetailsPage;
