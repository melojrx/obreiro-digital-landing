import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useMainDashboard } from '@/hooks/useDashboard';
import { useActivities } from '@/hooks/useActivities';
import { useCurrentActiveChurch } from '@/hooks/useActiveChurch';
import { api } from '@/config/api';
import { membersService } from '@/services/membersService';
import AppLayout from '@/components/layout/AppLayout';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { RecentActivities } from '@/components/dashboard/RecentActivities';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { EventsTable } from '@/components/dashboard/EventsTable';
import { VisitorStats } from '@/components/dashboard/VisitorStats';
import { RecentVisitors } from '@/components/dashboard/RecentVisitors';
import { ConvertAdminToMemberModal } from '@/components/members/ConvertAdminToMemberModal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, UserPlus, Calendar, DollarSign, UserCheck } from 'lucide-react';
import type { Member } from '@/services/membersService';

interface MemberSearchResponse {
    results?: Array<Pick<Member, 'id' | 'user' | 'email'>>;
}

const Dashboard = () => {
    const { user, userChurch } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const { toast } = useToast();
    const { data, isLoading, error } = useMainDashboard();
    const { data: activities = [], isLoading: activitiesLoading } = useActivities({});
    const [showConvertModal, setShowConvertModal] = useState(false);
    const [shouldShowConvertButton, setShouldShowConvertButton] = useState(false);
    const [showTransferCard, setShowTransferCard] = useState(false);
    const [transferring, setTransferring] = useState(false);
    const activeChurchInfo = useCurrentActiveChurch();
    
    // Verificar se o usuário é Church Admin
    const isChurchAdmin = userChurch?.user_role === 'church_admin' || userChurch?.role === 'CHURCH_ADMIN';
    
    // Verificar se já tem registro de membro
    useEffect(() => {
        const checkMemberStatus = async () => {
            console.log('🔍 Verificando se deve mostrar card de conversão:', {
                isChurchAdmin,
                userEmail: user?.email,
                userId: user?.id,
                userChurch
            });
            
            if (!isChurchAdmin || !user?.email || !user?.id) {
                console.log('❌ Não deve mostrar card: isChurchAdmin =', isChurchAdmin, 'user.email =', user?.email, 'user.id =', user?.id);
                setShouldShowConvertButton(false);
                return;
            }

            // Fallback rápido: se já marcamos localmente que este usuário virou membro
            // nesta igreja, escondemos o card imediatamente (evita flicker e casos de
            // busca paginada/por filial não retornando o membro recém-criado).
            const localFlagKey = `ov_has_member_user_${user.id}_church_${userChurch?.id || 'unknown'}`;
            const localFlag = localStorage.getItem(localFlagKey);
            if (localFlag === '1') {
                console.log('✅ Flag local indica que usuário já é membro. Ocultando card.');
                setShouldShowConvertButton(false);
                // Não retornamos aqui para permitir revalidação assíncrona via API;
                // se o backend indicar que não é membro, limpamos a flag mais abaixo.
            }
            
            try {
                console.log('🔍 Consultando status de membresia (por usuário): /members/me/status');
                const status = await membersService.getMyMembershipStatus();
                console.log('✅ Status de membresia:', status);

                const hasMemberRecord = !!status.is_member;
                setShouldShowConvertButton(!hasMemberRecord);

                // Mostrar card de transferência quando for membro e a filial ativa diferir
                const activeBranchId = activeChurchInfo?.active_branch?.id;
                const memberBranchId = status.branch?.id ?? null;
                const shouldSuggestTransfer = hasMemberRecord && !!activeBranchId && memberBranchId !== activeBranchId;
                setShowTransferCard(!!shouldSuggestTransfer);

                if (hasMemberRecord) {
                    localStorage.setItem(localFlagKey, '1');
                }
            } catch (error) {
                console.error('❌ Erro ao verificar status de membro:', error);
                setShouldShowConvertButton(false);
            }
        };
        
        checkMemberStatus();
    }, [isChurchAdmin, user, userChurch]);

    useEffect(() => {
        if (error) {
            console.error("Erro ao buscar dados do dashboard:", error);
            toast({
                title: "Erro",
                description: "Não foi possível carregar os dados do dashboard.",
                variant: "destructive",
            });
        }
    }, [error, toast]);

    useEffect(() => {
        if (location.state?.successMessage) {
            toast({
                title: "Bem-vindo!",
                description: location.state.successMessage,
                duration: 5000,
            });
            window.history.replaceState({}, document.title);
        }
    }, [location, toast]);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(value);
    };

    return (
        <AppLayout>
            <div className="space-y-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                        Dashboard
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Bem-vindo, {user?.full_name?.split(' ')[0] || 'admin'}! {activeChurchInfo ? `Você está visualizando a igreja ${activeChurchInfo.short_name || activeChurchInfo.name}${activeChurchInfo.active_branch ? ` • Filial ${activeChurchInfo.active_branch.name}` : ''}.` : 'Aqui está o resumo da sua igreja.'}
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                    <StatsCard
                        title="Membros"
                        value={data?.members.total ?? 0}
                        change={data?.members.change}
                        icon={<Users className="h-5 w-5" />}
                        isLoading={isLoading}
                        color="bg-gradient-to-r from-blue-500 to-cyan-400"
                    />
                    <StatsCard
                        title="Visitantes"
                        value={data?.visitors.total ?? 0}
                        change={data?.visitors.change}
                        icon={<UserPlus className="h-5 w-5" />}
                        isLoading={isLoading}
                        color="bg-gradient-to-r from-green-500 to-emerald-400"
                    />
                    <StatsCard
                        title="Atividades"
                        value={activities.length}
                        change={undefined}
                        icon={<Calendar className="h-5 w-5" />}
                        isLoading={activitiesLoading}
                        color="bg-gradient-to-r from-yellow-500 to-amber-400"
                    />
                    <StatsCard
                        title="Dízimos (mês)"
                        value={formatCurrency(data?.tithes.total ?? 0)}
                        change={data?.tithes.change}
                        icon={<DollarSign className="h-5 w-5" />}
                        isLoading={isLoading}
                        color="bg-gradient-to-r from-purple-500 to-fuchsia-400"
                    />
                </div>

                {/* Card de Conversão de Admin para Membro */}
                {shouldShowConvertButton && (
                    <Card className="border-blue-200 bg-blue-50">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-blue-900">
                                <UserCheck className="h-5 w-5" />
                                Torne-se Membro da Igreja
                            </CardTitle>
                            <CardDescription>
                                Como administrador, você pode criar um registro de membro vinculado
                                à sua conta. Isso não afetará suas permissões administrativas.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button 
                                onClick={() => setShowConvertModal(true)}
                                className="w-full sm:w-auto"
                            >
                                <UserCheck className="mr-2 h-4 w-4" />
                                Criar Registro de Membro
                            </Button>
                        </CardContent>
                    </Card>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start">
                    <div className="lg:col-span-2 space-y-6 lg:space-y-8">
                        <EventsTable />
                        <VisitorStats />
                    </div>
                    <div className="lg:col-span-1 space-y-6 lg:space-y-8">
                        <QuickActions />
                        <RecentVisitors />
                        <RecentActivities />
                    </div>
                </div>

                {/* Modal de Conversão */}
                <ConvertAdminToMemberModal 
                    isOpen={showConvertModal}
                    onClose={() => {
                        setShowConvertModal(false);
                        // Recarregar verificação após fechar modal
                        setShouldShowConvertButton(false);
                    }}
                    onConverted={(member) => {
                        // Persistir flag local para este usuário/igreja e esconder o card
                        if (user?.id && userChurch?.id) {
                            const localFlagKey = `ov_has_member_user_${user.id}_church_${userChurch.id}`;
                            localStorage.setItem(localFlagKey, '1');
                        }
                        setShouldShowConvertButton(false);
                        setShowTransferCard(false);
                    }}
                />

                {/* Card de Transferência de Filial */}
                {showTransferCard && activeChurchInfo?.active_branch && (
                    <Card className="border-amber-200 bg-amber-50">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-amber-900">
                                <UserCheck className="h-5 w-5" />
                                Transferir minha lotação para esta filial
                            </CardTitle>
                            <CardDescription>
                                Sua lotação atual é diferente da filial ativa. Você pode transferir sua lotação para a filial "{activeChurchInfo.active_branch.name}".
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button 
                                onClick={async () => {
                                    if (!activeChurchInfo?.active_branch?.id) return;
                                    try {
                                        setTransferring(true);
                                        const result = await membersService.transferMyMembership(activeChurchInfo.active_branch.id);
                                        toast({ title: 'Sucesso', description: result.message });
                                        setShowTransferCard(false);
                                    } catch (e) {
                                        console.error('Erro ao transferir lotação:', e);
                                        toast({ title: 'Erro', description: 'Não foi possível transferir sua lotação.', variant: 'destructive' });
                                    } finally {
                                        setTransferring(false);
                                    }
                                }}
                                disabled={transferring}
                                className="w-full sm:w-auto"
                            >
                                {transferring ? 'Transferindo...' : 'Transferir para esta filial'}
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
};

export default Dashboard; 
