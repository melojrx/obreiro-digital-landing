/**
 * Hook para navegação e contexto hierárquico
 * Gerencia a navegação entre denominação → igreja → filiais
 */

import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import { useAuth } from './useAuth';
import { usePermissions } from './usePermissions';
import {
  DenominationDetails,
  ChurchDetails,
  BranchDetails,
  HierarchyLevel,
  HierarchyPath,
  HierarchyContext,
  HierarchyPermissions,
} from '@/types/hierarchy';
import {
  denominationService,
  churchService,
  branchService,
  HierarchyError,
} from '@/services/denominationService';

// ===== CONTEXTO HIERÁRQUICO =====

const HierarchyContextProvider = createContext<HierarchyContext | undefined>(undefined);

export const useHierarchyContext = (): HierarchyContext => {
  const context = useContext(HierarchyContextProvider);
  if (context === undefined) {
    throw new Error('useHierarchyContext deve ser usado dentro de um HierarchyProvider');
  }
  return context;
};

// ===== PROVIDER HIERÁRQUICO =====

interface HierarchyProviderProps {
  children: ReactNode;
}

export const HierarchyProvider: React.FC<HierarchyProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const permissions = usePermissions();
  
  const [hierarchyContext, setHierarchyContext] = useState<HierarchyContext>({
    current_denomination: undefined,
    current_church: undefined,
    current_branch: undefined,
    hierarchy_path: {
      levels: [],
      current_level: { type: 'denomination', id: 0, name: '', can_manage: false },
      can_go_up: false,
      can_go_down: false,
    },
    user_permissions: {} as HierarchyPermissions,
    available_churches: [],
    available_branches: [],
  });

  // Atualizar contexto quando dados mudarem
  useEffect(() => {
    const updateHierarchyPermissions = (): HierarchyPermissions => ({
      // Denominação
      canViewDenominationDashboard: permissions.isAdmin || permissions.isChurchAdmin,
      canManageDenomination: permissions.isAdmin,
      canCreateChurches: permissions.isAdmin,
      canManageChurchAdmins: permissions.isAdmin,
      canViewDenominationReports: permissions.isAdmin || permissions.isChurchAdmin,
      
      // Igreja
      canViewChurchDashboard: permissions.canViewDashboard,
      canManageChurch: permissions.canManageChurch,
      canCreateBranches: permissions.canManageBranches,
      canManageBranchManagers: permissions.canManageUsers,
      canViewChurchReports: permissions.canViewReports,
      
      // Filiais
      canViewBranchDashboard: permissions.canViewDashboard,
      canManageBranch: permissions.canManageBranches,
      canRegenerateQRCode: permissions.canManageBranches,
      canViewBranchReports: permissions.canViewReports,
      
      // Consolidado
      canViewConsolidatedReports: permissions.canViewReports,
      canExportData: permissions.canViewReports,
      canManageHierarchy: permissions.isAdmin || permissions.isChurchAdmin,
    });

    setHierarchyContext(prev => ({
      ...prev,
      user_permissions: updateHierarchyPermissions(),
    }));
  }, [permissions]);

  const value: HierarchyContext = {
    ...hierarchyContext,
  };

  return (
    <HierarchyContextProvider.Provider value={value}>
      {children}
    </HierarchyContextProvider.Provider>
  );
};

// ===== HOOK PRINCIPAL =====

interface UseHierarchyState {
  currentLevel: HierarchyLevel;
  hierarchyPath: HierarchyLevel[];
  availableChurches: ChurchDetails[];
  availableBranches: BranchDetails[];
  isLoading: boolean;
  error: string | null;
}

interface UseHierarchyReturn extends UseHierarchyState {
  // Navegação
  navigateToDenomination: (denominationId: number) => Promise<void>;
  navigateToChurch: (churchId: number) => Promise<void>;
  navigateToBranch: (branchId: number) => Promise<void>;
  navigateUp: () => void;
  navigateToRoot: () => void;
  
  // Carregamento de dados
  loadChurchesForDenomination: (denominationId: number) => Promise<void>;
  loadBranchesForChurch: (churchId: number) => Promise<void>;
  
  // Utilitários
  getCurrentEntityDetails: () => DenominationDetails | ChurchDetails | BranchDetails | null;
  canNavigateUp: () => boolean;
  canNavigateDown: () => boolean;
  getNavigationTitle: () => string;
  clearError: () => void;
}

export const useHierarchy = (): UseHierarchyReturn => {
  const { user } = useAuth();
  const hierarchyContext = useHierarchyContext();

  const [state, setState] = useState<UseHierarchyState>({
    currentLevel: { type: 'denomination', id: 0, name: 'Denominações', can_manage: false },
    hierarchyPath: [],
    availableChurches: [],
    availableBranches: [],
    isLoading: false,
    error: null,
  });

  // ===== NAVEGAÇÃO =====

  const navigateToDenomination = useCallback(async (denominationId: number) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const denomination = await denominationService.getDenominationDetails(denominationId);
      const churches = await denominationService.getDenominationChurches(denominationId);

      const newLevel: HierarchyLevel = {
        type: 'denomination',
        id: denominationId,
        name: denomination.name,
        can_manage: hierarchyContext.user_permissions.canManageDenomination,
      };

      setState(prev => ({
        ...prev,
        currentLevel: newLevel,
        hierarchyPath: [newLevel],
        availableChurches: churches.results,
        availableBranches: [],
        isLoading: false,
      }));
    } catch (error) {
      const errorMessage = error instanceof HierarchyError 
        ? error.message 
        : 'Erro ao navegar para denominação';
      
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isLoading: false,
      }));
    }
  }, [hierarchyContext.user_permissions.canManageDenomination]);

  const navigateToChurch = useCallback(async (churchId: number) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const church = await churchService.getChurchDetails(churchId);
      const branches = await churchService.getChurchBranches(churchId);

      const newLevel: HierarchyLevel = {
        type: 'church',
        id: churchId,
        name: church.name,
        can_manage: hierarchyContext.user_permissions.canManageChurch,
      };

      // Adicionar denominação ao path se não estiver
      let newPath = [...state.hierarchyPath];
      if (church.denomination && !newPath.find(level => level.type === 'denomination')) {
        const denominationLevel: HierarchyLevel = {
          type: 'denomination',
          id: church.denomination.id,
          name: church.denomination.name,
          can_manage: hierarchyContext.user_permissions.canManageDenomination,
        };
        newPath = [denominationLevel];
      }
      newPath.push(newLevel);

      setState(prev => ({
        ...prev,
        currentLevel: newLevel,
        hierarchyPath: newPath,
        availableBranches: branches.results,
        isLoading: false,
      }));
    } catch (error) {
      const errorMessage = error instanceof HierarchyError 
        ? error.message 
        : 'Erro ao navegar para igreja';
      
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isLoading: false,
      }));
    }
  }, [state.hierarchyPath, hierarchyContext.user_permissions]);

  const navigateToBranch = useCallback(async (branchId: number) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const branch = await branchService.getBranchDetails(branchId);

      const newLevel: HierarchyLevel = {
        type: 'branch',
        id: branchId,
        name: branch.name,
        can_manage: hierarchyContext.user_permissions.canManageBranch,
      };

      // Construir path completo
      let newPath = [...state.hierarchyPath];
      
      // Adicionar igreja ao path se não estiver
      if (branch.church && !newPath.find(level => level.type === 'church')) {
        const churchLevel: HierarchyLevel = {
          type: 'church',
          id: branch.church.id,
          name: branch.church.name,
          can_manage: hierarchyContext.user_permissions.canManageChurch,
        };
        newPath.push(churchLevel);
      }
      
      newPath.push(newLevel);

      setState(prev => ({
        ...prev,
        currentLevel: newLevel,
        hierarchyPath: newPath,
        isLoading: false,
      }));
    } catch (error) {
      const errorMessage = error instanceof HierarchyError 
        ? error.message 
        : 'Erro ao navegar para filial';
      
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isLoading: false,
      }));
    }
  }, [state.hierarchyPath, hierarchyContext.user_permissions]);

  const navigateUp = useCallback(() => {
    if (state.hierarchyPath.length > 1) {
      const newPath = state.hierarchyPath.slice(0, -1);
      const parentLevel = newPath[newPath.length - 1];
      
      setState(prev => ({
        ...prev,
        currentLevel: parentLevel,
        hierarchyPath: newPath,
      }));
    }
  }, [state.hierarchyPath]);

  const navigateToRoot = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentLevel: { type: 'denomination', id: 0, name: 'Denominações', can_manage: false },
      hierarchyPath: [],
      availableChurches: [],
      availableBranches: [],
    }));
  }, []);

  // ===== CARREGAMENTO DE DADOS =====

  const loadChurchesForDenomination = useCallback(async (denominationId: number) => {
    try {
      const churches = await denominationService.getDenominationChurches(denominationId);
      setState(prev => ({
        ...prev,
        availableChurches: churches.results,
      }));
    } catch (error) {
      console.error('Erro ao carregar igrejas:', error);
    }
  }, []);

  const loadBranchesForChurch = useCallback(async (churchId: number) => {
    try {
      const branches = await churchService.getChurchBranches(churchId);
      setState(prev => ({
        ...prev,
        availableBranches: branches.results,
      }));
    } catch (error) {
      console.error('Erro ao carregar filiais:', error);
    }
  }, []);

  // ===== UTILITÁRIOS =====

  const getCurrentEntityDetails = useCallback((): DenominationDetails | ChurchDetails | BranchDetails | null => {
    // Esta função deveria retornar os detalhes completos da entidade atual
    // Por enquanto retorna null, mas pode ser implementada conforme necessário
    return null;
  }, []);

  const canNavigateUp = useCallback((): boolean => {
    return state.hierarchyPath.length > 1;
  }, [state.hierarchyPath]);

  const canNavigateDown = useCallback((): boolean => {
    if (state.currentLevel.type === 'denomination') return state.availableChurches.length > 0;
    if (state.currentLevel.type === 'church') return state.availableBranches.length > 0;
    return false;
  }, [state.currentLevel, state.availableChurches, state.availableBranches]);

  const getNavigationTitle = useCallback((): string => {
    const pathNames = state.hierarchyPath.map(level => level.name).join(' > ');
    return pathNames || 'Gestão Hierárquica';
  }, [state.hierarchyPath]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    // Estado
    ...state,
    
    // Navegação
    navigateToDenomination,
    navigateToChurch,
    navigateToBranch,
    navigateUp,
    navigateToRoot,
    
    // Carregamento
    loadChurchesForDenomination,
    loadBranchesForChurch,
    
    // Utilitários
    getCurrentEntityDetails,
    canNavigateUp,
    canNavigateDown,
    getNavigationTitle,
    clearError,
  };
};