import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { activeChurchService, UserChurch, ActiveChurch, SetActiveChurchRequest, SetActiveChurchResponse } from '@/services/activeChurchService';

// Query Keys
export const ACTIVE_CHURCH_QUERY_KEYS = {
  all: ['active-church'] as const,
  userChurches: () => [...ACTIVE_CHURCH_QUERY_KEYS.all, 'user-churches'] as const,
  activeChurch: () => [...ACTIVE_CHURCH_QUERY_KEYS.all, 'current'] as const,
};

/**
 * Hook para buscar todas as igrejas do usuário
 */
export const useUserChurches = () => {
  return useQuery({
    queryKey: ACTIVE_CHURCH_QUERY_KEYS.userChurches(),
    queryFn: () => activeChurchService.getUserChurches(),
    staleTime: 0, // CRÍTICO: Sem cache para prevenir vazamento de dados entre usuários
    gcTime: 0, // Limpar imediatamente quando não usado
  });
};

/**
 * Hook para buscar a igreja ativa atual
 */
export const useActiveChurch = () => {
  return useQuery({
    queryKey: ACTIVE_CHURCH_QUERY_KEYS.activeChurch(),
    queryFn: () => activeChurchService.getActiveChurch(),
    staleTime: 0, // CRÍTICO: Sem cache para prevenir vazamento de dados entre usuários
    gcTime: 0, // Limpar imediatamente quando não usado
    retry: false, // Não fazer retry se der erro (usuário pode não ter igreja ativa)
  });
};

/**
 * Hook para definir igreja ativa
 */
export const useSetActiveChurch = () => {
  const queryClient = useQueryClient();

  return useMutation<SetActiveChurchResponse, unknown, SetActiveChurchRequest>({
    mutationFn: (variables: SetActiveChurchRequest) => activeChurchService.setActiveChurch(variables),
    onSuccess: (data) => {
      // Invalidar todas as queries relacionadas à igreja ativa
      queryClient.invalidateQueries({ queryKey: ACTIVE_CHURCH_QUERY_KEYS.all });
      
      // Invalidar todos os dados que dependem da igreja ativa
      // Ministérios
      queryClient.invalidateQueries({ queryKey: ['ministries'] });
      queryClient.invalidateQueries({ queryKey: ['available-leaders'] });
      
      // Membros (tanto o hook antigo quanto o novo)
      queryClient.invalidateQueries({ queryKey: ['members'] });
      queryClient.invalidateQueries({ queryKey: ['member'] });
      
      // Dashboard e estatísticas
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['church-stats'] });
      queryClient.invalidateQueries({ queryKey: ['church-summary'] });
      
      // Atividades
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      queryClient.invalidateQueries({ queryKey: ['activity'] });
      
      // Visitantes
      queryClient.invalidateQueries({ queryKey: ['visitors'] });
      queryClient.invalidateQueries({ queryKey: ['visitor'] });
      
      // Congregações
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      queryClient.invalidateQueries({ queryKey: ['branch'] });
      
      // Perfil e dados da igreja
      queryClient.invalidateQueries({ queryKey: ['user-me'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      
      // Prayers/Pedidos de oração
      queryClient.invalidateQueries({ queryKey: ['prayers'] });
      queryClient.invalidateQueries({ queryKey: ['prayer-requests'] });
      
      toast.success(data.message);
    },
    onError: (error: any) => {
      console.error('Erro ao definir igreja ativa:', error);
      const message = error.response?.data?.error || 'Erro ao definir igreja ativa';
      toast.error(message);
    },
  });
};

/**
 * Hook helper para verificar se usuário tem múltiplas igrejas
 */
export const useHasMultipleChurches = () => {
  const { data: userChurches } = useUserChurches();
  return userChurches && userChurches.count > 1;
};

/**
 * Hook helper para obter a igreja ativa
 */
export const useCurrentActiveChurch = (): ActiveChurch | null => {
  const { data: activeChurchData } = useActiveChurch();
  return activeChurchData?.active_church || null;
};

/**
 * Hook para invalidar dados relacionados à igreja ativa
 */
export const useInvalidateActiveChurchData = () => {
  const queryClient = useQueryClient();

  return {
    invalidateAll: () => {
      queryClient.invalidateQueries({ queryKey: ACTIVE_CHURCH_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ['ministries'] });
      queryClient.invalidateQueries({ queryKey: ['members'] });
      queryClient.invalidateQueries({ queryKey: ['available-leaders'] });
    },
    invalidateActiveChurch: () => {
      queryClient.invalidateQueries({ queryKey: ACTIVE_CHURCH_QUERY_KEYS.activeChurch() });
    },
    invalidateUserChurches: () => {
      queryClient.invalidateQueries({ queryKey: ACTIVE_CHURCH_QUERY_KEYS.userChurches() });
    },
    // Forçar atualização imediata dos dados de igreja ativa
    forceRefreshActiveChurch: () => {
      console.log('🔄 Forçando atualização dos dados de igreja ativa...');
      queryClient.removeQueries({ queryKey: ACTIVE_CHURCH_QUERY_KEYS.activeChurch() });
      queryClient.refetchQueries({ queryKey: ACTIVE_CHURCH_QUERY_KEYS.activeChurch() });
    },
    // Limpar todo o cache relacionado à igreja
    clearAllChurchCache: () => {
      console.log('🧹 Limpando todo o cache de igreja...');
      queryClient.removeQueries({ queryKey: ACTIVE_CHURCH_QUERY_KEYS.all });
      queryClient.removeQueries({ queryKey: ['ministries'] });
      queryClient.removeQueries({ queryKey: ['members'] });
      queryClient.removeQueries({ queryKey: ['available-leaders'] });
      // Refetch dados essenciais
      queryClient.refetchQueries({ queryKey: ACTIVE_CHURCH_QUERY_KEYS.activeChurch() });
    },
  };
};
