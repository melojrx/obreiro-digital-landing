import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { membersService, Member, MemberDashboard } from '@/services/membersService';
import { useCurrentActiveChurch } from './useActiveChurch';

export interface MembersFilters {
  search?: string;
  status?: string;
  ministerial_function?: string;
  page?: number;
}

// Query Keys para cache
export const MEMBERS_QUERY_KEYS = {
  all: ['members'] as const,
  lists: () => [...MEMBERS_QUERY_KEYS.all, 'list'] as const,
  list: (filters?: MembersFilters) => [...MEMBERS_QUERY_KEYS.lists(), filters] as const,
  details: () => [...MEMBERS_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: number) => [...MEMBERS_QUERY_KEYS.details(), id] as const,
  dashboard: () => [...MEMBERS_QUERY_KEYS.all, 'dashboard'] as const,
  availableSpouses: () => [...MEMBERS_QUERY_KEYS.all, 'available-spouses'] as const,
};

/**
 * Hook para buscar lista de membros (com contexto da igreja ativa)
 */
export const useMembersQuery = (filters?: MembersFilters) => {
  const activeChurch = useCurrentActiveChurch();

  return useQuery({
    queryKey: [...MEMBERS_QUERY_KEYS.list(filters), activeChurch?.id],
    queryFn: () => membersService.getMembers(filters),
    staleTime: 1000 * 60 * 5, // 5 minutos
    enabled: !!activeChurch, // Só executa se tiver igreja ativa
  });
};

/**
 * Hook para buscar dashboard de membros (com contexto da igreja ativa)
 */
export const useMembersDashboard = () => {
  const activeChurch = useCurrentActiveChurch();

  return useQuery({
    queryKey: [...MEMBERS_QUERY_KEYS.dashboard(), activeChurch?.id],
    queryFn: () => membersService.getDashboard(),
    staleTime: 1000 * 60 * 5, // 5 minutos
    enabled: !!activeChurch, // Só executa se tiver igreja ativa
  });
};

/**
 * Hook para buscar detalhes de um membro
 */
export const useMemberQuery = (id: number) => {
  return useQuery({
    queryKey: MEMBERS_QUERY_KEYS.detail(id),
    queryFn: () => membersService.getMember(id),
    enabled: !!id,
  });
};

/**
 * Hook para buscar cônjuges disponíveis
 */
export const useAvailableSpouses = () => {
  const activeChurch = useCurrentActiveChurch();

  return useQuery({
    queryKey: [...MEMBERS_QUERY_KEYS.availableSpouses(), activeChurch?.id],
    queryFn: () => membersService.getAvailableSpouses(),
    staleTime: 1000 * 60 * 10, // 10 minutos
    enabled: !!activeChurch,
  });
};

/**
 * Hook para criar membro
 */
export const useCreateMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => membersService.createMember(data),
    onSuccess: (newMember) => {
      // Invalidar listas de membros
      queryClient.invalidateQueries({ queryKey: MEMBERS_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: MEMBERS_QUERY_KEYS.dashboard() });
      queryClient.invalidateQueries({ queryKey: MEMBERS_QUERY_KEYS.availableSpouses() });
      
      toast.success('Membro criado com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro ao criar membro:', error);
      const message = error.response?.data?.message || 'Erro ao criar membro';
      toast.error(message);
    },
  });
};

/**
 * Hook para atualizar membro
 */
export const useUpdateMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      membersService.updateMember(id, data),
    onSuccess: (updatedMember, { id }) => {
      // Atualizar cache do membro específico
      queryClient.setQueryData(MEMBERS_QUERY_KEYS.detail(id), updatedMember);
      
      // Invalidar listas
      queryClient.invalidateQueries({ queryKey: MEMBERS_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: MEMBERS_QUERY_KEYS.dashboard() });
      queryClient.invalidateQueries({ queryKey: MEMBERS_QUERY_KEYS.availableSpouses() });
      
      toast.success('Membro atualizado com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro ao atualizar membro:', error);
      const message = error.response?.data?.message || 'Erro ao atualizar membro';
      toast.error(message);
    },
  });
};

/**
 * Hook para deletar membro
 */
export const useDeleteMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => membersService.deleteMember(id),
    onSuccess: (_, id) => {
      // Remover do cache
      queryClient.removeQueries({ queryKey: MEMBERS_QUERY_KEYS.detail(id) });
      
      // Invalidar listas
      queryClient.invalidateQueries({ queryKey: MEMBERS_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: MEMBERS_QUERY_KEYS.dashboard() });
      queryClient.invalidateQueries({ queryKey: MEMBERS_QUERY_KEYS.availableSpouses() });
      
      toast.success('Membro removido com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro ao deletar membro:', error);
      const message = error.response?.data?.message || 'Erro ao remover membro';
      toast.error(message);
    },
  });
};

/**
 * Hook para invalidar dados de membros
 */
export const useInvalidateMembers = () => {
  const queryClient = useQueryClient();

  return {
    invalidateAll: () => {
      queryClient.invalidateQueries({ queryKey: MEMBERS_QUERY_KEYS.all });
    },
    invalidateLists: () => {
      queryClient.invalidateQueries({ queryKey: MEMBERS_QUERY_KEYS.lists() });
    },
    invalidateDashboard: () => {
      queryClient.invalidateQueries({ queryKey: MEMBERS_QUERY_KEYS.dashboard() });
    },
    invalidateMember: (id: number) => {
      queryClient.invalidateQueries({ queryKey: MEMBERS_QUERY_KEYS.detail(id) });
    },
  };
};