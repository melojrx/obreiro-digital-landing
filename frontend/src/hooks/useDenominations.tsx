/**
 * Hook especializado para gestão de denominações
 * Integra-se com o contexto de autenticação e sistema de permissões
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { usePermissions } from './usePermissions';
import {
  DenominationDetails,
  DenominationStats,
  ChurchDetails,
  ChurchFilters,
  PaginatedResponse,
  CreateChurchFormData,
} from '@/types/hierarchy';
import {
  denominationService,
  hierarchyReportService,
  HierarchyError,
} from '@/services/denominationService';
import { toast } from '@/hooks/use-toast';

// Interface para estado do hook
interface UseDenominationsState {
  // Dados principais
  denominations: DenominationDetails[];
  currentDenomination: DenominationDetails | null;
  denominationStats: DenominationStats | null;
  denominationChurches: PaginatedResponse<ChurchDetails> | null;
  
  // Estados de carregamento
  isLoadingDenominations: boolean;
  isLoadingStats: boolean;
  isLoadingChurches: boolean;
  isCreatingChurch: boolean;
  
  // Controle de erros
  error: string | null;
  churchesError: string | null;
}

// Interface do retorno do hook
interface UseDenominationsReturn extends UseDenominationsState {
  // Ações principais
  loadDenominations: () => Promise<void>;
  loadDenominationDetails: (denominationId: number) => Promise<void>;
  loadDenominationStats: (denominationId: number) => Promise<void>;
  loadDenominationChurches: (denominationId: number, filters?: ChurchFilters, page?: number) => Promise<void>;
  createChurch: (denominationId: number, churchData: CreateChurchFormData) => Promise<ChurchDetails | null>;
  refreshCurrentDenomination: () => Promise<void>;
  
  // Utilitários
  clearError: () => void;
  getDenominationById: (id: number) => DenominationDetails | undefined;
  canManageDenomination: (denominationId?: number) => boolean;
  exportDenominationData: (denominationId: number, format: 'xlsx' | 'pdf') => Promise<void>;
}

export const useDenominations = (): UseDenominationsReturn => {
  const { user, isAuthenticated } = useAuth();
  const permissions = usePermissions();

  // Estado do hook
  const [state, setState] = useState<UseDenominationsState>({
    denominations: [],
    currentDenomination: null,
    denominationStats: null,
    denominationChurches: null,
    isLoadingDenominations: false,
    isLoadingStats: false,
    isLoadingChurches: false,
    isCreatingChurch: false,
    error: null,
    churchesError: null,
  });

  // ===== FUNÇÕES DE CARREGAMENTO =====

  const loadDenominations = useCallback(async () => {
    if (!isAuthenticated || !permissions.canViewDashboard) return;

    setState(prev => ({ ...prev, isLoadingDenominations: true, error: null }));

    try {
      const denominations = await denominationService.getDenominations();
      setState(prev => ({
        ...prev,
        denominations,
        isLoadingDenominations: false,
      }));
    } catch (error) {
      const errorMessage = error instanceof HierarchyError 
        ? error.message 
        : 'Erro ao carregar denominações';
      
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isLoadingDenominations: false,
      }));
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [isAuthenticated, permissions.canViewDashboard]);

  const loadDenominationDetails = useCallback(async (denominationId: number) => {
    setState(prev => ({ ...prev, error: null }));

    try {
      const denominationDetails = await denominationService.getDenominationDetails(denominationId);
      setState(prev => ({
        ...prev,
        currentDenomination: denominationDetails,
      }));
    } catch (error) {
      const errorMessage = error instanceof HierarchyError 
        ? error.message 
        : 'Erro ao carregar detalhes da denominação';
      
      setState(prev => ({ ...prev, error: errorMessage }));
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, []);

  const loadDenominationStats = useCallback(async (denominationId: number) => {
    setState(prev => ({ ...prev, isLoadingStats: true, error: null }));

    try {
      const stats = await denominationService.getDenominationDashboard(denominationId);
      setState(prev => ({
        ...prev,
        denominationStats: stats,
        isLoadingStats: false,
      }));
    } catch (error) {
      const errorMessage = error instanceof HierarchyError 
        ? error.message 
        : 'Erro ao carregar estatísticas da denominação';
      
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isLoadingStats: false,
      }));
    }
  }, []);

  const loadDenominationChurches = useCallback(async (
    denominationId: number, 
    filters?: ChurchFilters, 
    page = 1
  ) => {
    setState(prev => ({ ...prev, isLoadingChurches: true, churchesError: null }));

    try {
      const churches = await denominationService.getDenominationChurches(
        denominationId, 
        filters, 
        page
      );
      setState(prev => ({
        ...prev,
        denominationChurches: churches,
        isLoadingChurches: false,
      }));
    } catch (error) {
      const errorMessage = error instanceof HierarchyError 
        ? error.message 
        : 'Erro ao carregar igrejas da denominação';
      
      setState(prev => ({
        ...prev,
        churchesError: errorMessage,
        isLoadingChurches: false,
      }));
    }
  }, []);

  // ===== AÇÕES PRINCIPAIS =====

  const createChurch = useCallback(async (
    denominationId: number, 
    churchData: CreateChurchFormData
  ): Promise<ChurchDetails | null> => {
    setState(prev => ({ ...prev, isCreatingChurch: true, error: null }));

    try {
      const newChurch = await denominationService.createChurch(denominationId, churchData);
      
      // Atualizar lista de igrejas se já carregada
      if (state.denominationChurches) {
        setState(prev => ({
          ...prev,
          denominationChurches: {
            ...prev.denominationChurches!,
            results: [newChurch, ...prev.denominationChurches!.results],
            count: prev.denominationChurches!.count + 1,
          },
        }));
      }
      
      setState(prev => ({ ...prev, isCreatingChurch: false }));
      
      toast({
        title: "Sucesso",
        description: `Igreja "${newChurch.name}" criada com sucesso!`,
        variant: "default",
      });
      
      return newChurch;
    } catch (error) {
      const errorMessage = error instanceof HierarchyError 
        ? error.message 
        : 'Erro ao criar igreja';
      
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isCreatingChurch: false,
      }));
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
      
      return null;
    }
  }, [state.denominationChurches]);

  const refreshCurrentDenomination = useCallback(async () => {
    if (state.currentDenomination) {
      await loadDenominationDetails(state.currentDenomination.id);
      await loadDenominationStats(state.currentDenomination.id);
    }
  }, [state.currentDenomination, loadDenominationDetails, loadDenominationStats]);

  // ===== UTILITÁRIOS =====

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null, churchesError: null }));
  }, []);

  const getDenominationById = useCallback((id: number): DenominationDetails | undefined => {
    return state.denominations.find(denomination => denomination.id === id);
  }, [state.denominations]);

  const canManageDenomination = useCallback((denominationId?: number): boolean => {
    // Super admin pode gerenciar qualquer denominação
    if (permissions.isAdmin) return true;
    
    // Verifica se é admin da denominação específica
    // TODO: Implementar lógica baseada nas permissões reais do usuário
    return permissions.isChurchAdmin;
  }, [permissions]);

  const exportDenominationData = useCallback(async (
    denominationId: number, 
    format: 'xlsx' | 'pdf'
  ) => {
    try {
      const blob = await hierarchyReportService.exportData(
        'denomination', 
        denominationId, 
        format, 
        'consolidated'
      );
      
      // Criar link para download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `denominacao-${denominationId}-relatorio.${format}`;
      link.click();
      
      // Limpar URL temporária
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Sucesso",
        description: `Relatório exportado com sucesso!`,
        variant: "default",
      });
    } catch (error) {
      const errorMessage = error instanceof HierarchyError 
        ? error.message 
        : 'Erro ao exportar dados';
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, []);

  // ===== EFEITOS =====

  // Carregar denominações automaticamente quando autenticado
  useEffect(() => {
    if (isAuthenticated && permissions.canViewDashboard) {
      loadDenominations();
    }
  }, [isAuthenticated, permissions.canViewDashboard, loadDenominations]);

  // Retorno do hook
  return {
    // Estado
    ...state,
    
    // Ações
    loadDenominations,
    loadDenominationDetails,
    loadDenominationStats,
    loadDenominationChurches,
    createChurch,
    refreshCurrentDenomination,
    
    // Utilitários
    clearError,
    getDenominationById,
    canManageDenomination,
    exportDenominationData,
  };
};