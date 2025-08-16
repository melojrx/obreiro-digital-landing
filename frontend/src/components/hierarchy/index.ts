/**
 * Módulo de Gestão Hierárquica - Exportações
 * Ponto central de exportação dos componentes do módulo
 */

// Componentes de UI Base
export { DenominationStatsCard } from './DenominationStatsCard';
export { ChurchCard } from './ChurchCard';
export { HierarchyView } from './HierarchyView';

// Componentes de Dashboard
export { DenominationDashboard } from './DenominationDashboard';
export { DenominationDashboardProfessional } from './DenominationDashboardProfessional';
export { ChurchesOverview } from './ChurchesOverview';

// Componentes de Gestão
export { CreateChurchForm } from './CreateChurchForm';

// Re-exportar tipos importantes
export type {
  DenominationDetails,
  ChurchDetails,
  BranchDetails,
  DenominationStats,
  ChurchStats,
  BranchStats,
  HierarchyLevel,
  HierarchyPath,
  HierarchyContext,
  CreateChurchFormData,
  ChurchFilters,
  BranchFilters,
} from '@/types/hierarchy';

// Re-exportar hooks
export { useDenominations } from '@/hooks/useDenominations';
export { useHierarchy, HierarchyProvider } from '@/hooks/useHierarchy';
export { useDenominationStats } from '@/hooks/useDenominationStats';

// Re-exportar serviços
export { hierarchyServices } from '@/services/denominationService';