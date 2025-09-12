import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { 
  denominationStatsService, 
  DenominationStats, 
  DenominationHierarchy 
} from '@/services/denominationStatsService';

// Query Keys para cache
export const DENOMINATION_STATS_QUERY_KEYS = {
  all: ['denomination-stats'] as const,
  stats: () => [...DENOMINATION_STATS_QUERY_KEYS.all, 'stats'] as const,
  hierarchy: () => [...DENOMINATION_STATS_QUERY_KEYS.all, 'hierarchy'] as const,
  dashboard: (id: number) => [...DENOMINATION_STATS_QUERY_KEYS.all, 'dashboard', id] as const,
  churches: (id: number, filters?: any) => [...DENOMINATION_STATS_QUERY_KEYS.all, 'churches', id, filters] as const,
  myDenominations: () => [...DENOMINATION_STATS_QUERY_KEYS.all, 'my-denominations'] as const,
};

/**
 * Hook para buscar estatísticas consolidadas da denominação do usuário atual
 */
export const useDenominationStats = () => {
  return useQuery({
    queryKey: DENOMINATION_STATS_QUERY_KEYS.stats(),
    queryFn: () => denominationStatsService.getDenominationStats(),
    staleTime: 1000 * 60 * 5, // 5 minutos
    retry: 1,
  });
};

/**
 * Hook para buscar dados hierárquicos da denominação
 */
export const useDenominationHierarchy = () => {
  return useQuery({
    queryKey: DENOMINATION_STATS_QUERY_KEYS.hierarchy(),
    queryFn: () => denominationStatsService.getDenominationHierarchy(),
    staleTime: 1000 * 60 * 10, // 10 minutos
    retry: 1,
  });
};

/**
 * Hook para buscar estatísticas de uma denominação específica
 */
export const useDenominationStatsById = (denominationId: number) => {
  return useQuery({
    queryKey: [...DENOMINATION_STATS_QUERY_KEYS.stats(), denominationId],
    queryFn: () => denominationStatsService.getDenominationStatsById(denominationId),
    enabled: !!denominationId,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
};

/**
 * Hook para buscar dashboard da denominação
 */
export const useDenominationDashboard = (denominationId: number) => {
  return useQuery({
    queryKey: DENOMINATION_STATS_QUERY_KEYS.dashboard(denominationId),
    queryFn: () => denominationStatsService.getDenominationDashboard(denominationId),
    enabled: !!denominationId,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
};

/**
 * Hook para buscar igrejas da denominação
 */
export const useDenominationChurches = (denominationId: number, filters?: {
  state?: string;
  search?: string;
}) => {
  return useQuery({
    queryKey: DENOMINATION_STATS_QUERY_KEYS.churches(denominationId, filters),
    queryFn: () => denominationStatsService.getDenominationChurches(denominationId, filters),
    enabled: !!denominationId,
    staleTime: 1000 * 60 * 10, // 10 minutos
  });
};

/**
 * Hook para buscar denominações do usuário atual
 */
export const useMyDenominations = () => {
  return useQuery({
    queryKey: DENOMINATION_STATS_QUERY_KEYS.myDenominations(),
    queryFn: () => denominationStatsService.getMyDenominations(),
    staleTime: 1000 * 60 * 15, // 15 minutos
  });
};

/**
 * Hook para atualizar estatísticas de uma denominação
 */
export const useUpdateDenominationStats = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (denominationId: number) => 
      denominationStatsService.updateDenominationStats(denominationId),
    onSuccess: (data, denominationId) => {
      // Invalidar cache das estatísticas
      queryClient.invalidateQueries({ 
        queryKey: DENOMINATION_STATS_QUERY_KEYS.stats() 
      });
      queryClient.invalidateQueries({ 
        queryKey: [...DENOMINATION_STATS_QUERY_KEYS.stats(), denominationId] 
      });
      queryClient.invalidateQueries({ 
        queryKey: DENOMINATION_STATS_QUERY_KEYS.hierarchy() 
      });
      
      toast.success(`Estatísticas atualizadas: ${data.total_churches} igrejas, ${data.total_members} membros`);
    },
    onError: (error: any) => {
      console.error('Erro ao atualizar estatísticas:', error);
      const message = error.response?.data?.error || 'Erro ao atualizar estatísticas';
      toast.error(message);
    },
  });
};

/**
 * Hook para invalidar cache das estatísticas
 */
export const useInvalidateDenominationStats = () => {
  const queryClient = useQueryClient();

  return {
    invalidateAll: () => {
      queryClient.invalidateQueries({ queryKey: DENOMINATION_STATS_QUERY_KEYS.all });
    },
    invalidateStats: () => {
      queryClient.invalidateQueries({ queryKey: DENOMINATION_STATS_QUERY_KEYS.stats() });
    },
    invalidateHierarchy: () => {
      queryClient.invalidateQueries({ queryKey: DENOMINATION_STATS_QUERY_KEYS.hierarchy() });
    },
    invalidateDashboard: (denominationId: number) => {
      queryClient.invalidateQueries({ queryKey: DENOMINATION_STATS_QUERY_KEYS.dashboard(denominationId) });
    },
  };
};

/**
 * Hook helper para verificar se usuário é denomination admin
 */
export const useIsDenominationAdmin = () => {
  const { data: denominations } = useMyDenominations();
  return denominations && denominations.length > 0;
};

/**
 * Hook helper para obter KPIs principais
 */
export const useDenominationKPIs = () => {
  const { data: stats, isLoading, error } = useDenominationStats();

  const kpis = {
    totalChurches: stats?.total_churches || 0,
    totalMembers: stats?.total_members || 0,
    totalBranches: stats?.total_branches || 0,
    totalVisitors: stats?.total_visitors || 0,
    totalActivities: stats?.total_activities || 0,
    // Métricas de crescimento
    membersGrowth: stats?.growth_metrics ? 
      stats.growth_metrics.members_this_month - stats.growth_metrics.members_last_month : 0,
    visitorsGrowth: stats?.growth_metrics ? 
      stats.growth_metrics.visitors_this_month - stats.growth_metrics.visitors_last_month : 0,
    churchesThisYear: stats?.growth_metrics?.churches_this_year || 0,
    // Indicadores de saúde
    averageAttendance: stats?.health_indicators?.average_attendance || 0,
    activeChurchesPercentage: stats?.health_indicators?.active_churches_percentage || 0,
    memberRetentionRate: stats?.health_indicators?.member_retention_rate || 0,
    visitorConversionRate: stats?.health_indicators?.visitor_conversion_rate || 0,
    // Alertas
    totalAlerts: stats?.alerts ? 
      Object.values(stats.alerts).reduce((sum: number, count: number) => sum + count, 0) : 0,
  };

  return {
    kpis,
    isLoading,
    error,
    rawStats: stats,
  };
};