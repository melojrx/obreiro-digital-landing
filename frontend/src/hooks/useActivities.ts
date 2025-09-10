import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { 
  activityService, 
  Activity, 
  PublicActivity, 
  ActivitySummary, 
  CreateActivityData,
  ActivityFilters,
  PublicActivityFilters
} from '@/services/activityService';

// Query Keys para cache
export const ACTIVITY_QUERY_KEYS = {
  all: ['activities'] as const,
  lists: () => [...ACTIVITY_QUERY_KEYS.all, 'list'] as const,
  list: (filters: ActivityFilters) => [...ACTIVITY_QUERY_KEYS.lists(), filters] as const,
  details: () => [...ACTIVITY_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: number) => [...ACTIVITY_QUERY_KEYS.details(), id] as const,
  upcoming: () => [...ACTIVITY_QUERY_KEYS.all, 'upcoming'] as const,
  public: () => [...ACTIVITY_QUERY_KEYS.all, 'public'] as const,
  publicCalendar: (filters: PublicActivityFilters) => [...ACTIVITY_QUERY_KEYS.public(), filters] as const,
  participants: (activityId: number) => [...ACTIVITY_QUERY_KEYS.all, 'participants', activityId] as const,
};

// ========== QUERIES ==========

/**
 * Hook para buscar lista de atividades (autenticado)
 */
export const useActivities = (filters: ActivityFilters = {}) => {
  return useQuery({
    queryKey: ACTIVITY_QUERY_KEYS.list(filters),
    queryFn: () => activityService.getActivities(filters),
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
};

/**
 * Hook para buscar atividades públicas para o calendário
 */
export const usePublicActivities = (filters: PublicActivityFilters) => {
  return useQuery({
    queryKey: ACTIVITY_QUERY_KEYS.publicCalendar(filters),
    queryFn: () => activityService.getPublicActivities(filters),
    staleTime: 1000 * 60 * 10, // 10 minutos
    enabled: !!filters.church_id, // Só executa se church_id estiver presente
  });
};

/**
 * Hook para buscar próximas atividades
 */
export const useUpcomingActivities = () => {
  return useQuery({
    queryKey: ACTIVITY_QUERY_KEYS.upcoming(),
    queryFn: () => activityService.getUpcomingActivities(),
    staleTime: 1000 * 60 * 2, // 2 minutos
  });
};

/**
 * Hook para buscar detalhes de uma atividade
 */
export const useActivity = (id: number) => {
  return useQuery({
    queryKey: ACTIVITY_QUERY_KEYS.detail(id),
    queryFn: () => activityService.getActivity(id),
    enabled: !!id,
  });
};

/**
 * Hook para buscar participantes de uma atividade
 */
export const useActivityParticipants = (activityId: number) => {
  return useQuery({
    queryKey: ACTIVITY_QUERY_KEYS.participants(activityId),
    queryFn: () => activityService.getActivityParticipants(activityId),
    enabled: !!activityId,
  });
};

// ========== MUTATIONS ==========

/**
 * Hook para criar nova atividade
 */
export const useCreateActivity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateActivityData) => activityService.createActivity(data),
    onSuccess: (newActivity) => {
      // Invalidar listas de atividades
      queryClient.invalidateQueries({ queryKey: ACTIVITY_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: ACTIVITY_QUERY_KEYS.upcoming() });
      queryClient.invalidateQueries({ queryKey: ACTIVITY_QUERY_KEYS.public() });
      
      toast.success('Atividade criada com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro ao criar atividade:', error);
      const message = error.response?.data?.message || 'Erro ao criar atividade';
      toast.error(message);
    },
  });
};

/**
 * Hook para atualizar atividade
 */
export const useUpdateActivity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateActivityData> }) =>
      activityService.updateActivity(id, data),
    onSuccess: (updatedActivity, { id }) => {
      // Atualizar cache da atividade específica
      queryClient.setQueryData(ACTIVITY_QUERY_KEYS.detail(id), updatedActivity);
      
      // Invalidar listas
      queryClient.invalidateQueries({ queryKey: ACTIVITY_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: ACTIVITY_QUERY_KEYS.upcoming() });
      queryClient.invalidateQueries({ queryKey: ACTIVITY_QUERY_KEYS.public() });
      
      toast.success('Atividade atualizada com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro ao atualizar atividade:', error);
      const message = error.response?.data?.message || 'Erro ao atualizar atividade';
      toast.error(message);
    },
  });
};

/**
 * Hook para deletar atividade
 */
export const useDeleteActivity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => activityService.deleteActivity(id),
    onSuccess: (_, id) => {
      // Remover do cache
      queryClient.removeQueries({ queryKey: ACTIVITY_QUERY_KEYS.detail(id) });
      
      // Invalidar listas
      queryClient.invalidateQueries({ queryKey: ACTIVITY_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: ACTIVITY_QUERY_KEYS.upcoming() });
      queryClient.invalidateQueries({ queryKey: ACTIVITY_QUERY_KEYS.public() });
      
      toast.success('Atividade removida com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro ao deletar atividade:', error);
      const message = error.response?.data?.message || 'Erro ao remover atividade';
      toast.error(message);
    },
  });
};

/**
 * Hook para registrar participante em uma atividade
 */
export const useRegisterParticipant = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ activityId, participantData }: { activityId: number; participantData?: any }) =>
      activityService.registerParticipant(activityId, participantData),
    onSuccess: (_, { activityId }) => {
      // Invalidar participantes e atividade
      queryClient.invalidateQueries({ queryKey: ACTIVITY_QUERY_KEYS.participants(activityId) });
      queryClient.invalidateQueries({ queryKey: ACTIVITY_QUERY_KEYS.detail(activityId) });
      queryClient.invalidateQueries({ queryKey: ACTIVITY_QUERY_KEYS.lists() });
      
      toast.success('Inscrito na atividade com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro ao registrar participante:', error);
      const message = error.response?.data?.message || 'Erro ao se inscrever na atividade';
      toast.error(message);
    },
  });
};

// ========== HELPERS ==========

/**
 * Hook para invalidar queries relacionadas a atividades
 */
export const useInvalidateActivities = () => {
  const queryClient = useQueryClient();

  return {
    invalidateAll: () => {
      queryClient.invalidateQueries({ queryKey: ACTIVITY_QUERY_KEYS.all });
    },
    invalidateLists: () => {
      queryClient.invalidateQueries({ queryKey: ACTIVITY_QUERY_KEYS.lists() });
    },
    invalidateUpcoming: () => {
      queryClient.invalidateQueries({ queryKey: ACTIVITY_QUERY_KEYS.upcoming() });
    },
    invalidatePublic: () => {
      queryClient.invalidateQueries({ queryKey: ACTIVITY_QUERY_KEYS.public() });
    },
    invalidateActivity: (id: number) => {
      queryClient.invalidateQueries({ queryKey: ACTIVITY_QUERY_KEYS.detail(id) });
    },
  };
};

/**
 * Hook customizado para gerenciar estado de atividades com filtros
 */
export const useActivitiesWithFilters = (initialFilters: ActivityFilters = {}) => {
  const [filters, setFilters] = useState(initialFilters);
  const activitiesQuery = useActivities(filters);
  
  const updateFilters = (newFilters: Partial<ActivityFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };
  
  const resetFilters = () => {
    setFilters(initialFilters);
  };
  
  return {
    ...activitiesQuery,
    filters,
    updateFilters,
    resetFilters,
    setFilters,
  };
};