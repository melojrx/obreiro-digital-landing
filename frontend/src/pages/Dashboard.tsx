import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import AppLayout from '@/components/layout/AppLayout';
import StatsCard from '@/components/dashboard/StatsCard';
import RecentActivities from '@/components/dashboard/RecentActivities';
import QuickActions from '@/components/dashboard/QuickActions';
import EventsTable from '@/components/dashboard/EventsTable';
import { Users, UserPlus, Calendar, DollarSign } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const location = useLocation();
  const { toast } = useToast();

  // Mostrar mensagem de sucesso se vier do cadastro
  useEffect(() => {
    if (location.state?.successMessage) {
      toast({
        title: "Bem-vindo!",
        description: location.state.successMessage,
        duration: 5000,
      });
      // Limpar o state para não mostrar novamente
      window.history.replaceState({}, document.title);
    }
  }, [location, toast]);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Bem-vindo, {user?.full_name?.split(' ')[0] || 'admin'}!
          </h1>
          <p className="text-gray-600 mt-1">
            Este é o seu painel de controle do Obreiro Virtual. Aqui você pode gerenciar todos os aspectos da sua igreja.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Membros"
            value="42"
            icon={Users}
            iconColor="text-blue-600"
            iconBg="bg-blue-100"
            trend={{ value: 5, isPositive: true }}
          />
          <StatsCard
            title="Visitantes (mês)"
            value="12"
            icon={UserPlus}
            iconColor="text-green-600"
            iconBg="bg-green-100"
            trend={{ value: 20, isPositive: true }}
          />
          <StatsCard
            title="Eventos Ativos"
            value="3"
            icon={Calendar}
            iconColor="text-yellow-600"
            iconBg="bg-yellow-100"
          />
          <StatsCard
            title="Dízimos (mês)"
            value="R$ 3.250"
            icon={DollarSign}
            iconColor="text-purple-600"
            iconBg="bg-purple-100"
            trend={{ value: 15, isPositive: true }}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activities - 2 columns */}
          <div className="lg:col-span-2">
            <RecentActivities />
          </div>
          
          {/* Quick Actions - 1 column */}
          <div>
            <QuickActions />
          </div>
        </div>

        {/* Events Table */}
        <EventsTable />
      </div>
    </AppLayout>
  );
};

export default Dashboard; 