import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useMainDashboard } from '@/hooks/useDashboard';
import { useActivities } from '@/hooks/useActivities';
import { usePermissions } from '@/hooks/usePermissions';
import AppLayout from '@/components/layout/AppLayout';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { RecentActivities } from '@/components/dashboard/RecentActivities';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { EventsTable } from '@/components/dashboard/EventsTable';
import { VisitorStats } from '@/components/dashboard/VisitorStats';
import { RecentVisitors } from '@/components/dashboard/RecentVisitors';
import { Users, UserPlus, Calendar, DollarSign, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const Dashboard = () => {
    const { user, userChurch, getUserChurch } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const { toast } = useToast();
    const { data, isLoading, error } = useMainDashboard();
    const { data: activities = [], isLoading: activitiesLoading } = useActivities({});
    const permissions = usePermissions();
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Redirecionar para onboarding se necessário
    useEffect(() => {
        if (user && user.needs_church_setup) {
            console.log('🔄 Usuário precisa criar igreja, redirecionando para onboarding...');
            navigate('/onboarding', { replace: true });
        }
    }, [user, navigate]);

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

    const handleRefreshUserChurch = async () => {
        setIsRefreshing(true);
        try {
            await getUserChurch();
            toast({
                title: "Atualizado!",
                description: "Dados da igreja foram recarregados.",
            });
        } catch (error) {
            toast({
                title: "Erro",
                description: "Não foi possível recarregar os dados.",
                variant: "destructive",
            });
        } finally {
            setIsRefreshing(false);
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(value);
    };

    return (
        <AppLayout>
            <div className="space-y-8">
                {/* Debug Card - Remover após resolver o problema */}
                <Card className="p-4 bg-yellow-50 border-yellow-200">
                    <div className="space-y-3">
                        <h3 className="font-semibold text-yellow-900">🔍 Debug de Permissões</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
                            <div>
                                <strong>Email:</strong> {user?.email || 'N/A'}
                            </div>
                            <div>
                                <strong>Perfil Completo:</strong> {user?.is_profile_complete ? '✅ Sim' : '❌ Não'}
                            </div>
                            <div>
                                <strong>Igreja (userChurch):</strong> {userChurch ? `✅ ${userChurch.name}` : '❌ Null'}
                            </div>
                            <div>
                                <strong>Role Label:</strong> {userChurch?.role || 'N/A'}
                            </div>
                            <div>
                                <strong>Role Code:</strong> <code className="bg-yellow-100 px-1 rounded">{userChurch?.user_role || 'N/A'}</code>
                            </div>
                            <div>
                                <strong>canViewHierarchyMenu:</strong> {permissions.canViewHierarchyMenu ? '✅ Sim' : '❌ Não'}
                            </div>
                            <div>
                                <strong>canCreateChurches:</strong> <span className="font-bold">{permissions.canCreateChurches ? '✅ Sim' : '❌ Não'}</span>
                            </div>
                            <div>
                                <strong>canCreateBranches:</strong> {permissions.canCreateBranches ? '✅ Sim' : '❌ Não'}
                            </div>
                            <div>
                                <strong>canCreateMembers:</strong> {permissions.canCreateMembers ? '✅ Sim' : '❌ Não'}
                            </div>
                            <div>
                                <strong>isChurchAdmin:</strong> <span className="font-bold">{permissions.isChurchAdmin ? '✅ Sim' : '❌ Não'}</span>
                            </div>
                        </div>
                        <div className="pt-2 border-t border-yellow-300">
                            <p className="text-xs text-yellow-800 mb-2">
                                <strong>💡 Seu papel atual:</strong> {userChurch?.role || 'Não identificado'}
                            </p>
                            <p className="text-xs text-yellow-800 font-semibold">
                                {permissions.isChurchAdmin && permissions.canCreateChurches 
                                    ? '✅ Você é CHURCH ADMIN - Pode criar múltiplas igrejas na sua denominação'
                                    : permissions.canCreateBranches
                                    ? '✅ Você pode criar filiais/congregações'
                                    : '⚠️ Permissões limitadas - verifique seu papel'}
                            </p>
                        </div>
                        <Button 
                            onClick={handleRefreshUserChurch}
                            disabled={isRefreshing}
                            size="sm"
                            variant="outline"
                            className="w-full md:w-auto"
                        >
                            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                            Recarregar Dados da Igreja
                        </Button>
                    </div>
                </Card>

                <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                        Dashboard
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Bem-vindo, {user?.full_name?.split(' ')[0] || 'admin'}! Aqui está o resumo da sua igreja.
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
            </div>
        </AppLayout>
    );
};

export default Dashboard; 