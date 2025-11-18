import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/config/api';
import { useCurrentActiveChurch } from './useActiveChurch';

export interface DashboardData {
  members: { total: number; change: number };
  visitors: { total: number; change: number };
  events: { total: number; change: number };
  tithes: { total: number; change: number };
  offerings?: { total: number; change: number };
}

export interface DashboardChartsData {
  members_evolution: Array<{
    month: string;
    full_date: string;
    new_members: number;
    total_members: number;
  }>;
  visitors_stats: Array<{
    month: string;
    full_date: string;
    visitors: number;
    converted: number;
  }>;
}

// Query Keys para cache
export const DASHBOARD_QUERY_KEYS = {
  all: ['dashboard'] as const,
  mainDashboard: () => [...DASHBOARD_QUERY_KEYS.all, 'main'] as const,
};

/**
 * Hook para buscar dados do dashboard principal
 */
export const useMainDashboard = () => {
  const activeChurch = useCurrentActiveChurch();

  return useQuery({
    queryKey: [...DASHBOARD_QUERY_KEYS.mainDashboard(), activeChurch?.id, activeChurch?.active_branch?.id],
    queryFn: async () => {
      const response = await api.get<DashboardData>('/churches/main-dashboard/');
      return response.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
    enabled: !!activeChurch, // Só executa se tiver igreja ativa
  });
};

/**
 * Hook para invalidar dados do dashboard
 */
export const useInvalidateDashboard = () => {
  const queryClient = useQueryClient();

  return {
    invalidateAll: () => {
      queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEYS.all });
    },
    invalidateMainDashboard: () => {
      queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEYS.mainDashboard() });
    },
  };
};

/**
 * Hook para buscar dados dos gráficos do dashboard
 */
export const useDashboardCharts = () => {
  const activeChurch = useCurrentActiveChurch();

  return useQuery({
    queryKey: [...DASHBOARD_QUERY_KEYS.all, 'charts', activeChurch?.id],
    queryFn: async () => {
      const response = await api.get<DashboardChartsData>('core/dashboard/charts/');
      return response.data;
    },
    staleTime: 1000 * 60 * 15, // 15 minutos
    enabled: !!activeChurch,
  });
};
