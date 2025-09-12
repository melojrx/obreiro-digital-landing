import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { 
  activityService, 
  Ministry, 
  PublicMinistry, 
  ActivitySummary, 
  CreateMinistryData
} from '@/services/activityService';
import { api } from '@/config/api';

// Query Keys para cache
export const MINISTRY_QUERY_KEYS = {
  all: ['ministries'] as const,
  lists: () => [...MINISTRY_QUERY_KEYS.all, 'list'] as const,
  list: (filters?: { church_id?: number; is_active?: boolean }) => [...MINISTRY_QUERY_KEYS.lists(), filters] as const,
  details: () => [...MINISTRY_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: number) => [...MINISTRY_QUERY_KEYS.details(), id] as const,
  public: () => [...MINISTRY_QUERY_KEYS.all, 'public'] as const,
  publicList: (churchId: number) => [...MINISTRY_QUERY_KEYS.public(), churchId] as const,
  stats: (id: number) => [...MINISTRY_QUERY_KEYS.all, 'stats', id] as const,
  activities: (id: number) => [...MINISTRY_QUERY_KEYS.all, 'activities', id] as const,
};

// ========== QUERIES ==========

/**
 * Hook para buscar lista de ministérios (autenticado)
 */
export const useMinistries = (filters?: { church_id?: number; is_active?: boolean }) => {
  return useQuery({
    queryKey: MINISTRY_QUERY_KEYS.list(filters),
    queryFn: () => activityService.getMinistries(filters),
    staleTime: 1000 * 60 * 10, // 10 minutos
  });
};

/**
 * Hook para buscar ministérios públicos (sem autenticação)
 */
export const usePublicMinistries = (churchId: number) => {
  return useQuery({
    queryKey: MINISTRY_QUERY_KEYS.publicList(churchId),
    queryFn: () => activityService.getPublicMinistries(churchId),
    staleTime: 1000 * 60 * 15, // 15 minutos
    enabled: !!churchId,
  });
};

/**
 * Hook para buscar detalhes de um ministério
 */
export const useMinistry = (id: number) => {
  return useQuery({
    queryKey: MINISTRY_QUERY_KEYS.detail(id),
    queryFn: () => activityService.getMinistry(id),
    enabled: !!id,
  });
};

/**
 * Hook para buscar estatísticas de um ministério
 */
export const useMinistryStats = (ministryId: number) => {
  return useQuery({
    queryKey: MINISTRY_QUERY_KEYS.stats(ministryId),
    queryFn: () => activityService.getMinistryStats(ministryId),
    enabled: !!ministryId,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
};

/**
 * Hook para buscar atividades de um ministério
 */
export const useMinistryActivities = (ministryId: number) => {
  return useQuery({
    queryKey: MINISTRY_QUERY_KEYS.activities(ministryId),
    queryFn: () => activityService.getMinistryActivities(ministryId),
    enabled: !!ministryId,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
};

// ========== MUTATIONS ==========

/**
 * Hook para criar novo ministério
 */
export const useCreateMinistry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateMinistryData) => activityService.createMinistry(data),
    onSuccess: (newMinistry) => {
      // Invalidar listas de ministérios
      queryClient.invalidateQueries({ queryKey: MINISTRY_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: MINISTRY_QUERY_KEYS.public() });
      
      toast.success('Ministério criado com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro ao criar ministério:', error);
      const message = error.response?.data?.message || 'Erro ao criar ministério';
      toast.error(message);
    },
  });
};

/**
 * Hook para atualizar ministério
 */
export const useUpdateMinistry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateMinistryData> }) =>
      activityService.updateMinistry(id, data),
    onSuccess: (updatedMinistry, { id }) => {
      // Atualizar cache do ministério específico
      queryClient.setQueryData(MINISTRY_QUERY_KEYS.detail(id), updatedMinistry);
      
      // Invalidar listas
      queryClient.invalidateQueries({ queryKey: MINISTRY_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: MINISTRY_QUERY_KEYS.public() });
      
      toast.success('Ministério atualizado com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro ao atualizar ministério:', error);
      const message = error.response?.data?.message || 'Erro ao atualizar ministério';
      toast.error(message);
    },
  });
};

/**
 * Hook para deletar ministério
 */
export const useDeleteMinistry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => activityService.deleteMinistry(id),
    onSuccess: (_, id) => {
      // Remover do cache
      queryClient.removeQueries({ queryKey: MINISTRY_QUERY_KEYS.detail(id) });
      queryClient.removeQueries({ queryKey: MINISTRY_QUERY_KEYS.stats(id) });
      queryClient.removeQueries({ queryKey: MINISTRY_QUERY_KEYS.activities(id) });
      
      // Invalidar listas
      queryClient.invalidateQueries({ queryKey: MINISTRY_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: MINISTRY_QUERY_KEYS.public() });
      
      toast.success('Ministério removido com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro ao deletar ministério:', error);
      const message = error.response?.data?.message || 'Erro ao remover ministério';
      toast.error(message);
    },
  });
};

// ========== HOOKS AUXILIARES ==========

/**
 * Hook para buscar membros que podem ser líderes de ministérios
 */
export const useAvailableLeaders = () => {
  return useQuery({
    queryKey: ['available-leaders'],
    queryFn: async () => {
      try {
        // Usar endpoint específico para líderes no ViewSet
        const response = await api.get('members/leaders/');
        
        // Backend retorna: {count: X, results: [...]}
        const results = response.data.results || [];
        
        return results.map((leader: any) => {
          // Backend agora retorna User IDs diretamente, não precisamos extrair
          return {
            id: leader.id, // Já é User ID que pode ser usado diretamente
            name: leader.name,
            role: leader.role,
            type: leader.type,
            email: leader.email,
            source: leader.source,
            member_id: leader.member_id, // ID do Member se disponível
            churchuser_id: leader.churchuser_id // ID do ChurchUser se disponível
          };
        });
      } catch (error) {
        console.error('Erro ao buscar líderes disponíveis:', error);
        return [];
      }
    },
    staleTime: 1000 * 60 * 10, // 10 minutos
    retry: 3,
  });
};

// ========== HELPERS ==========

/**
 * Hook para invalidar queries relacionadas a ministérios
 */
export const useInvalidateMinistries = () => {
  const queryClient = useQueryClient();

  return {
    invalidateAll: () => {
      queryClient.invalidateQueries({ queryKey: MINISTRY_QUERY_KEYS.all });
    },
    invalidateLists: () => {
      queryClient.invalidateQueries({ queryKey: MINISTRY_QUERY_KEYS.lists() });
    },
    invalidatePublic: () => {
      queryClient.invalidateQueries({ queryKey: MINISTRY_QUERY_KEYS.public() });
    },
    invalidateMinistry: (id: number) => {
      queryClient.invalidateQueries({ queryKey: MINISTRY_QUERY_KEYS.detail(id) });
    },
  };
};

/**
 * Hook para obter cores disponíveis para ministérios
 */
export const useMinistryColors = () => {
  const COLORS = [
    { value: '#3b82f6', name: 'Azul', preview: 'bg-blue-500' },
    { value: '#10b981', name: 'Verde', preview: 'bg-emerald-500' },
    { value: '#f59e0b', name: 'Amarelo', preview: 'bg-amber-500' },
    { value: '#ef4444', name: 'Vermelho', preview: 'bg-red-500' },
    { value: '#8b5cf6', name: 'Roxo', preview: 'bg-violet-500' },
    { value: '#06b6d4', name: 'Ciano', preview: 'bg-cyan-500' },
    { value: '#84cc16', name: 'Lima', preview: 'bg-lime-500' },
    { value: '#f97316', name: 'Laranja', preview: 'bg-orange-500' },
    { value: '#ec4899', name: 'Rosa', preview: 'bg-pink-500' },
    { value: '#6b7280', name: 'Cinza', preview: 'bg-gray-500' },
  ];

  return { colors: COLORS };
};

/**
 * Hook para filtrar ministérios ativos
 */
export const useActiveMinistries = (churchId?: number) => {
  return useMinistries({ 
    church_id: churchId,
    is_active: true 
  });
};

/**
 * Hook combinado para buscar ministérios e suas atividades
 */
export const useMinistriesWithActivities = (churchId?: number) => {
  const ministriesQuery = useActiveMinistries(churchId);
  
  // Buscar atividades de cada ministério
  const ministriesWithActivities = useQuery({
    queryKey: [...MINISTRY_QUERY_KEYS.all, 'with-activities', churchId],
    queryFn: async () => {
      if (!ministriesQuery.data) return [];
      
      const ministriesWithActivitiesData = await Promise.allSettled(
        ministriesQuery.data.map(async (ministry) => {
          try {
            const activities = await activityService.getMinistryActivities(ministry.id);
            return { ...ministry, activities };
          } catch (error) {
            console.warn(`Erro ao carregar atividades do ministério ${ministry.id}:`, error);
            return { ...ministry, activities: [] };
          }
        })
      );
      
      return ministriesWithActivitiesData
        .filter((result): result is PromiseFulfilledResult<Ministry & { activities: ActivitySummary[] }> => 
          result.status === 'fulfilled'
        )
        .map(result => result.value);
    },
    enabled: !!ministriesQuery.data && ministriesQuery.data.length > 0,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
  
  return {
    ...ministriesWithActivities,
    isLoadingMinistries: ministriesQuery.isLoading,
    ministriesError: ministriesQuery.error,
  };
};