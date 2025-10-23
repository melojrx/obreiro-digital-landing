import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getVisitors,
  getVisitorStats,
  deleteVisitor as deleteVisitorService,
  type Visitor,
  type VisitorStats
} from '@/services/visitorsService';
import { useCurrentActiveChurch } from '@/hooks/useActiveChurch';

interface VisitorFilters {
  search?: string;
  branch?: string;
  follow_up_status?: string;
  first_visit?: string;
  converted_to_member?: string;
  page?: number;
  per_page?: number;
}

interface UseVisitorsReturn {
  visitors: Visitor[];
  stats: VisitorStats | null;
  loading: boolean;
  statsLoading: boolean;
  visitorsLoading: boolean;
  filters: VisitorFilters;
  setFilters: (filters: VisitorFilters) => void;
  deleteVisitor: (visitorId: number) => Promise<void>;
  totalVisitors: number;
  refetch: () => void;
}

export const useVisitors = (): UseVisitorsReturn => {
  const queryClient = useQueryClient();
  const activeChurch = useCurrentActiveChurch();

  const churchId = activeChurch?.id ?? null;
  const branchId = activeChurch?.active_branch?.id ?? null;

  const [filters, setFilters] = useState<VisitorFilters>({
    page: 1,
    per_page: 10,
  });

  const sanitizedFilters = useMemo(() => ({
    ...filters,
    // Se quiser forçar filtro explícito por branch no servidor (além do middleware)
    ...(branchId ? { branch: String(branchId) } : {}),
  }), [filters, branchId]);

  const statsQuery = useQuery<VisitorStats>({
    queryKey: ['visitors', 'stats', { churchId, branchId }],
    queryFn: () => getVisitorStats(),
    enabled: !!churchId, // só busca após conhecer a active church
    staleTime: 30_000,
  });

  const visitorsQuery = useQuery<Visitor[]>({
    queryKey: ['visitors', 'list', { churchId, branchId, filters: sanitizedFilters }],
    queryFn: () => getVisitors(sanitizedFilters),
    enabled: !!churchId,
    keepPreviousData: true,
    staleTime: 10_000,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteVisitorService(id),
    onSuccess: () => {
      toast.success('Visitante excluído com sucesso');
      queryClient.invalidateQueries({ queryKey: ['visitors'] });
    },
    onError: () => {
      toast.error('Erro ao excluir visitante');
    },
  });

  const totalVisitors = statsQuery.data?.total || 0;
  const loading = statsQuery.isLoading || visitorsQuery.isLoading;
  const statsLoading = statsQuery.isLoading;
  const visitorsLoading = visitorsQuery.isLoading;

  const deleteVisitor = async (visitorId: number) => {
    await deleteMutation.mutateAsync(visitorId);
  };

  const refetch = () => {
    queryClient.invalidateQueries({ queryKey: ['visitors'] });
  };

  return {
    visitors: visitorsQuery.data || [],
    stats: statsQuery.data || null,
    loading,
    statsLoading,
    visitorsLoading,
    filters,
    setFilters,
    deleteVisitor,
    totalVisitors,
    refetch,
  };
};
