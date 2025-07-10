import { useState, useEffect, useCallback } from 'react';
import { membersService, Member, MemberDashboard, MemberSummary, PaginatedResponse } from '@/services/membersService';
import { toast } from 'sonner';

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
  // State
  const [members, setMembers] = useState<Member[]>([]);
  const [dashboard, setDashboard] = useState<MemberDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [membersLoading, setMembersLoading] = useState(false);
  const [totalMembers, setTotalMembers] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);
  
  const [filters, setFilters] = useState<MembersFilters>({
    search: '',
    status: '',
    ministerial_function: '',
    page: 1,
  });

  // Load dashboard data
  const loadDashboard = useCallback(async () => {
    try {
      setDashboardLoading(true);
      const dashboardData = await membersService.getDashboard();
      setDashboard(dashboardData);
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
      // Não mostrar toast para dashboard, pois pode não ter permissão
    } finally {
      setDashboardLoading(false);
    }
  }, []);

  // Load members data
  const loadMembers = useCallback(async () => {
    try {
      setMembersLoading(true);
      
      // Preparar parâmetros da API
      const params = {
        page: filters.page,
        search: filters.search || undefined,
        membership_status: filters.status || undefined,
        ministerial_function: filters.ministerial_function || undefined,
        ordering: 'full_name',
      };
      
      // Buscar lista de membros (MemberSummary)
      const membersData: PaginatedResponse<MemberSummary> = await membersService.getMembers(params);
      
      // Converter MemberSummary para Member completo
      const fullMembers = await Promise.all(
        membersData.results.map(async (summary) => {
          try {
            // Tentar buscar dados completos do membro
            return await membersService.getMember(summary.id);
          } catch (error) {
            console.warn(`Erro ao carregar membro ${summary.id}, usando dados básicos:`, error);
            
            // Se falhar, criar um Member básico a partir do summary
            return {
              ...summary,
              church: 0,
              church_name: summary.church_name,
              birth_date: '',
              gender: 'N' as const,
              marital_status: 'single' as const,
              full_address: '',
              membership_years: 0,
              transfer_letter: false,
              ministerial_function: 'member',
              accept_sms: true,
              accept_email: true,
              accept_whatsapp: true,
              created_at: '',
              updated_at: '',
            } as Member;
          }
        })
      );
      
      setMembers(fullMembers);
      setTotalMembers(membersData.count);
      setHasNext(!!membersData.next);
      setHasPrevious(!!membersData.previous);
      
    } catch (error) {
      console.error('Erro ao carregar membros:', error);
      toast.error('Erro ao carregar lista de membros');
      setMembers([]);
    } finally {
      setMembersLoading(false);
    }
  }, [filters.page, filters.search, filters.status, filters.ministerial_function]);

  // Refresh all data
  const refreshData = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      loadDashboard(),
      loadMembers(),
    ]);
    setLoading(false);
  }, [loadDashboard, loadMembers]);

  // Delete member
  const deleteMember = useCallback(async (id: number) => {
    try {
      await membersService.deleteMember(id);
      toast.success('Membro excluído com sucesso');
      
      // Refresh data after deletion
      await loadMembers();
    } catch (error) {
      console.error('Erro ao excluir membro:', error);
      toast.error('Erro ao excluir membro');
      throw error;
    }
  }, [loadMembers]);

  // Effect para carregar dados quando filtros mudarem
  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  // Effect para carregar dashboard apenas uma vez
  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // Effect inicial para definir loading como false após primeira carga
  useEffect(() => {
    const initialLoad = async () => {
      setLoading(true);
      try {
        await Promise.all([
          loadDashboard(),
          loadMembers(),
        ]);
      } finally {
        setLoading(false);
      }
    };

    initialLoad();
  }, []); // Executar apenas uma vez

  return {
    // Data
    members,
    dashboard,
    
    // Loading states
    loading,
    dashboardLoading,
    membersLoading,
    
    // Filters
    filters,
    setFilters,
    
    // Actions
    loadMembers,
    loadDashboard,
    refreshData,
    deleteMember,
    
    // Pagination
    totalMembers,
    hasNext,
    hasPrevious,
  };
}; 