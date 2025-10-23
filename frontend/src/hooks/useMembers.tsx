import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { membersService, Member, MemberDashboard, MemberSummary, PaginatedResponse } from '@/services/membersService';
import { toast } from 'sonner';
import { useCurrentActiveChurch } from '@/hooks/useActiveChurch';

interface MembersFilters {
  search: string;
  status: string;
  ministerial_function: string;
  page: number;
}

interface UseMembersResult {
  // Data
  members: Member[];
  dashboard: MemberDashboard | null;
  
  // Loading states
  loading: boolean;
  dashboardLoading: boolean;
  membersLoading: boolean;
  
  // Filters
  filters: MembersFilters;
  setFilters: (filters: MembersFilters) => void;
  
  // Actions
  loadMembers: () => Promise<void>;
  loadDashboard: () => Promise<void>;
  refreshData: () => Promise<void>;
  deleteMember: (id: number) => Promise<void>;
  
  // Pagination
  totalMembers: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export const useMembers = (): UseMembersResult => {
  const queryClient = useQueryClient();
  const activeChurch = useCurrentActiveChurch();

  const churchId = activeChurch?.id ?? null;
  const branchId = activeChurch?.active_branch?.id ?? null;

  const [filters, setFilters] = useState<MembersFilters>({
    search: '',
    status: '',
    ministerial_function: '',
    page: 1,
  });

  const params = useMemo(() => ({
    page: filters.page,
    search: filters.search || undefined,
    is_active: filters.status === 'active' ? true : filters.status === 'inactive' ? false : undefined,
    ministerial_function: filters.ministerial_function || undefined,
    ordering: 'full_name',
    // Se quiser forçar filtro explícito por branch no servidor
    ...(branchId ? { branch: branchId } : {}),
  }), [filters, branchId]);

  const dashboardQuery = useQuery<MemberDashboard>({
    queryKey: ['members', 'dashboard', { churchId, branchId }],
    queryFn: () => membersService.getDashboard(),
    enabled: !!churchId,
    staleTime: 30_000,
    retry: false,
  });

  const membersQuery = useQuery<PaginatedResponse<Member>>({
    queryKey: ['members', 'list', { churchId, branchId, params }],
    queryFn: async () => {
      const data: PaginatedResponse<MemberSummary> = await membersService.getMembers(params as any);
      const results = await Promise.all(
        data.results.map(async (summary) => {
          try {
            return await membersService.getMember(summary.id);
          } catch (error) {
            // Fallback mínimo em caso de erro no detalhe
            return {
              ...summary,
              church: 0,
              birth_date: '',
              gender: 'N' as const,
              marital_status: 'single' as const,
              full_address: '',
              membership_years: 0,
              transfer_letter: false,
              accept_sms: true,
              accept_email: true,
              accept_whatsapp: true,
              created_at: '',
              updated_at: '',
              is_active: true,
            } as Member;
          }
        })
      );
      return { ...data, results } as PaginatedResponse<Member>;
    },
    enabled: !!churchId,
    keepPreviousData: true,
    staleTime: 10_000,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => membersService.deleteMember(id),
    onSuccess: () => {
      toast.success('Membro excluído com sucesso');
      queryClient.invalidateQueries({ queryKey: ['members'] });
    },
    onError: () => {
      toast.error('Erro ao excluir membro');
    },
  });

  const deleteMember = async (id: number) => {
    await deleteMutation.mutateAsync(id);
  };

  const refreshData = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['members', 'dashboard'] }),
      queryClient.invalidateQueries({ queryKey: ['members', 'list'] }),
    ]);
  };

  const totalMembers = membersQuery.data?.count || 0;
  const hasNext = !!membersQuery.data?.next;
  const hasPrevious = !!membersQuery.data?.previous;
  const membersLoading = membersQuery.isLoading;
  const dashboardLoading = dashboardQuery.isLoading;
  const loading = membersLoading || dashboardLoading;

  return {
    members: membersQuery.data?.results || [],
    dashboard: dashboardQuery.data || null,
    loading,
    dashboardLoading,
    membersLoading,
    filters,
    setFilters,
    loadMembers: async () => { await membersQuery.refetch(); },
    loadDashboard: async () => { await dashboardQuery.refetch(); },
    refreshData,
    deleteMember,
    totalMembers,
    hasNext,
    hasPrevious,
  };
};
