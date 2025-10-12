import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useMainDashboard } from '@/hooks/useDashboard';
import { useActivities } from '@/hooks/useActivities';
import AppLayout from '@/components/layout/AppLayout';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { RecentActivities } from '@/components/dashboard/RecentActivities';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { EventsTable } from '@/components/dashboard/EventsTable';
import { VisitorStats } from '@/components/dashboard/VisitorStats';
import { RecentVisitors } from '@/components/dashboard/RecentVisitors';
import { Users, UserPlus, Calendar, DollarSign } from 'lucide-react';

const Dashboard = () => {
    const { user } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const { toast } = useToast();
    const { data, isLoading, error } = useMainDashboard();
    const { data: activities = [], isLoading: activitiesLoading } = useActivities({});

    // Redirecionar para onboarding se necessário
    useEffect(() => {
        if (user && user.needs_church_setup) {
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