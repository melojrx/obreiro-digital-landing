import { useState, useEffect, useCallback } from 'react';
import { churchService } from '@/services/churchService';
import { ChurchDetails, ChurchFilters, PaginatedResponse, CreateChurchFormData } from '@/types/hierarchy';
import { toast } from '@/hooks/use-toast';

interface UseChurchesOptions {
  /**
   * Filtros iniciais
   */
  initialFilters?: ChurchFilters;
  
  /**
   * Tamanho da página inicial
   */
  initialPageSize?: number;
  
  /**
   * Se deve carregar automaticamente no mount
   */
  autoLoad?: boolean;
  
  /**
   * Callback quando dados são carregados
   */
  onLoad?: (data: PaginatedResponse<ChurchDetails>) => void;
  
  /**
   * Callback quando ocorre erro
   */
  onError?: (error: any) => void;
}

interface UseChurchesReturn {
  // Dados
  churches: ChurchDetails[];
  churchesData: PaginatedResponse<ChurchDetails> | null;
  
  // Estados de loading
  isLoading: boolean;
  isRefreshing: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  
  // Filtros e paginação
  filters: ChurchFilters;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  
  // Ações
  loadChurches: () => Promise<void>;
  refreshChurches: () => Promise<void>;
  createChurch: (data: CreateChurchFormData) => Promise<ChurchDetails>;
  updateChurch: (id: number, data: Partial<ChurchDetails>) => Promise<ChurchDetails>;
  deleteChurch: (id: number) => Promise<void>;
  searchChurches: (searchTerm: string) => Promise<void>;
  
  // Controle de filtros
  setFilters: (filters: Partial<ChurchFilters>) => void;
  clearFilters: () => void;
  
  // Controle de paginação
  setCurrentPage: (page: number) => void;
  setPageSize: (size: number) => void;
  goToNextPage: () => void;
  goToPreviousPage: () => void;
  
  // Seleção múltipla
  selectedChurches: number[];
  setSelectedChurches: (churches: number[]) => void;
  selectChurch: (id: number, selected: boolean) => void;
  selectAllChurches: (selected: boolean) => void;
  clearSelection: () => void;
  
  // Ações em lote
  bulkAction: (action: 'activate' | 'deactivate' | 'delete', churchIds?: number[]) => Promise<void>;
  
  // Export
  exportChurches: (format: 'csv' | 'xlsx' | 'pdf') => Promise<void>;
  
  // Estados auxiliares
  availableStates: Array<{ code: string; name: string }>;
  subscriptionPlans: Array<{
    code: string;
    name: string;
    max_members: number;
    max_branches: number;
    features: string[];
  }>;
}

export const useChurches = (options: UseChurchesOptions = {}): UseChurchesReturn => {
  const {
    initialFilters = {},
    initialPageSize = 20,
    autoLoad = true,
    onLoad,
    onError,
  } = options;

  // Estados de dados
  const [churchesData, setChurchesData] = useState<PaginatedResponse<ChurchDetails> | null>(null);
  const [availableStates, setAvailableStates] = useState<Array<{ code: string; name: string }>>([]);
  const [subscriptionPlans, setSubscriptionPlans] = useState<Array<{
    code: string;
    name: string;
    max_members: number;
    max_branches: number;
    features: string[];
  }>>([]);

  // Estados de loading
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Estados de controle
  const [filters, setFiltersState] = useState<ChurchFilters>(initialFilters);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(initialPageSize);
  const [selectedChurches, setSelectedChurches] = useState<number[]>([]);

  // Valores derivados
  const churches = churchesData?.results || [];
  const totalPages = Math.ceil((churchesData?.count || 0) / pageSize);

  // Carregar dados auxiliares
  const loadAuxiliaryData = useCallback(async () => {
    try {
      const [states, plans] = await Promise.all([
        churchService.getAvailableStates(),
        churchService.getSubscriptionPlans(),
      ]);
      
      setAvailableStates(states);
      setSubscriptionPlans(plans);
    } catch (error) {
      console.error('Erro ao carregar dados auxiliares:', error);
    }
  }, []);

  // Carregar igrejas
  const loadChurches = useCallback(async () => {
    try {
      setIsLoading(currentPage === 1);
      setIsRefreshing(currentPage > 1);

      const data = await churchService.getChurches(filters, currentPage, pageSize);
      setChurchesData(data);
      onLoad?.(data);
    } catch (error: any) {
      console.error('Erro ao carregar igrejas:', error);
      onError?.(error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar lista de igrejas. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [filters, currentPage, pageSize, onLoad, onError]);

  // Atualizar igrejas
  const refreshChurches = useCallback(async () => {
    setCurrentPage(1);
    await loadChurches();
  }, [loadChurches]);

  // Criar igreja
  const createChurch = useCallback(async (data: CreateChurchFormData): Promise<ChurchDetails> => {
    try {
      setIsCreating(true);
      const newChurch = await churchService.createChurch(data);
      
      toast({
        title: 'Sucesso!',
        description: 'Igreja criada com sucesso.',
      });
      
      await refreshChurches();
      return newChurch;
    } catch (error: any) {
      toast({
        title: 'Erro ao criar igreja',
        description: error.response?.data?.message || 'Erro interno. Tente novamente.',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsCreating(false);
    }
  }, [refreshChurches]);

  // Atualizar igreja
  const updateChurch = useCallback(async (id: number, data: Partial<ChurchDetails>): Promise<ChurchDetails> => {
    try {
      setIsUpdating(true);
      const updatedChurch = await churchService.patchChurch(id, data);
      
      toast({
        title: 'Sucesso!',
        description: 'Igreja atualizada com sucesso.',
      });
      
      await loadChurches();
      return updatedChurch;
    } catch (error: any) {
      toast({
        title: 'Erro ao atualizar igreja',
        description: error.response?.data?.message || 'Erro interno. Tente novamente.',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsUpdating(false);
    }
  }, [loadChurches]);

  // Deletar igreja
  const deleteChurch = useCallback(async (id: number): Promise<void> => {
    try {
      setIsDeleting(true);
      await churchService.deleteChurch(id);
      
      toast({
        title: 'Igreja removida',
        description: 'A igreja foi removida com sucesso.',
      });
      
      await loadChurches();
    } catch (error: any) {
      toast({
        title: 'Erro ao remover igreja',
        description: error.response?.data?.message || 'Erro interno. Tente novamente.',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsDeleting(false);
    }
  }, [loadChurches]);

  // Buscar igrejas
  const searchChurches = useCallback(async (searchTerm: string): Promise<void> => {
    setFiltersState(prev => ({ ...prev, search: searchTerm }));
    setCurrentPage(1);
  }, []);

  // Controle de filtros
  const setFilters = useCallback((newFilters: Partial<ChurchFilters>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }));
    setCurrentPage(1);
  }, []);

  const clearFilters = useCallback(() => {
    setFiltersState(initialFilters);
    setCurrentPage(1);
  }, [initialFilters]);

  // Controle de paginação
  const setPageSize = useCallback((size: number) => {
    setPageSizeState(size);
    setCurrentPage(1);
  }, []);

  const goToNextPage = useCallback(() => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  }, [currentPage, totalPages]);

  const goToPreviousPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  }, [currentPage]);

  // Seleção múltipla
  const selectChurch = useCallback((id: number, selected: boolean) => {
    if (selected) {
      setSelectedChurches(prev => [...prev, id]);
    } else {
      setSelectedChurches(prev => prev.filter(churchId => churchId !== id));
    }
  }, []);

  const selectAllChurches = useCallback((selected: boolean) => {
    if (selected) {
      setSelectedChurches(churches.map(church => church.id));
    } else {
      setSelectedChurches([]);
    }
  }, [churches]);

  const clearSelection = useCallback(() => {
    setSelectedChurches([]);
  }, []);

  // Ações em lote
  const bulkAction = useCallback(async (
    action: 'activate' | 'deactivate' | 'delete',
    churchIds?: number[]
  ): Promise<void> => {
    const ids = churchIds || selectedChurches;
    
    if (ids.length === 0) {
      toast({
        title: 'Nenhuma igreja selecionada',
        description: 'Selecione pelo menos uma igreja para realizar esta ação.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await churchService.batchAction({
        action,
        entity_ids: ids,
      });

      toast({
        title: 'Ação concluída',
        description: `${response.success_count} igreja(s) processada(s) com sucesso.`,
      });

      if (response.error_count > 0) {
        console.error('Erros na ação em lote:', response.errors);
      }

      clearSelection();
      await loadChurches();
    } catch (error: any) {
      toast({
        title: 'Erro na ação em lote',
        description: error.response?.data?.message || 'Erro interno. Tente novamente.',
        variant: 'destructive',
      });
      throw error;
    }
  }, [selectedChurches, loadChurches, clearSelection]);

  // Export
  const exportChurches = useCallback(async (format: 'csv' | 'xlsx' | 'pdf'): Promise<void> => {
    try {
      const blob = await churchService.exportChurches(format, filters);
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `igrejas-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: 'Exportação concluída',
        description: 'Os dados das igrejas foram exportados com sucesso.',
      });
    } catch (error) {
      toast({
        title: 'Erro na exportação',
        description: 'Erro ao exportar dados. Tente novamente.',
        variant: 'destructive',
      });
      throw error;
    }
  }, [filters]);

  // Effects
  useEffect(() => {
    loadAuxiliaryData();
  }, [loadAuxiliaryData]);

  useEffect(() => {
    if (autoLoad) {
      loadChurches();
    }
  }, [loadChurches, autoLoad]);

  return {
    // Dados
    churches,
    churchesData,
    
    // Estados de loading
    isLoading,
    isRefreshing,
    isCreating,
    isUpdating,
    isDeleting,
    
    // Filtros e paginação
    filters,
    currentPage,
    pageSize,
    totalPages,
    
    // Ações
    loadChurches,
    refreshChurches,
    createChurch,
    updateChurch,
    deleteChurch,
    searchChurches,
    
    // Controle de filtros
    setFilters,
    clearFilters,
    
    // Controle de paginação
    setCurrentPage,
    setPageSize,
    goToNextPage,
    goToPreviousPage,
    
    // Seleção múltipla
    selectedChurches,
    setSelectedChurches,
    selectChurch,
    selectAllChurches,
    clearSelection,
    
    // Ações em lote
    bulkAction,
    
    // Export
    exportChurches,
    
    // Estados auxiliares
    availableStates,
    subscriptionPlans,
  };
};

export default useChurches;