import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  getVisitors,
  getVisitorStats,
  deleteVisitor as deleteVisitorService,
  type Visitor,
  type VisitorStats
} from '@/services/visitorsService';

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
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [stats, setStats] = useState<VisitorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);
  const [visitorsLoading, setVisitorsLoading] = useState(false);
  const [totalVisitors, setTotalVisitors] = useState(0);
  const [filters, setFilters] = useState<VisitorFilters>({
    page: 1,
    per_page: 10,
  });

  // Buscar estatísticas
  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const data = await getVisitorStats();
      setStats(data);
      setTotalVisitors(data.total);
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      toast.error('Erro ao carregar estatísticas dos visitantes');
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // Buscar visitantes
  const fetchVisitors = useCallback(async () => {
    try {
      setVisitorsLoading(true);
      const data = await getVisitors(filters);
      setVisitors(data);
    } catch (error) {
      console.error('Erro ao buscar visitantes:', error);
      toast.error('Erro ao carregar visitantes');
    } finally {
      setVisitorsLoading(false);
    }
  }, [filters]);

  // Buscar dados iniciais
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      await Promise.all([fetchStats(), fetchVisitors()]);
      setLoading(false);
    };

    fetchInitialData();
  }, []);

  // Buscar visitantes quando filtros mudarem
  useEffect(() => {
    if (!loading) {
      fetchVisitors();
    }
  }, [filters, loading]);

  // Deletar visitante
  const deleteVisitor = async (visitorId: number) => {
    try {
      await deleteVisitorService(visitorId);
      toast.success('Visitante excluído com sucesso');
      
      // Atualizar lista local
      setVisitors(prev => prev.filter(v => v.id !== visitorId));
      setTotalVisitors(prev => prev - 1);
      
      // Recarregar estatísticas
      fetchStats();
    } catch (error) {
      console.error('Erro ao excluir visitante:', error);
      toast.error('Erro ao excluir visitante');
      throw error;
    }
  };

  // Refetch
  const refetch = () => {
    fetchStats();
    fetchVisitors();
  };

  return {
    visitors,
    stats,
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