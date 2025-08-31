/**
 * Hook especializado para estatísticas de denominações
 * Gerencia dados consolidados, métricas e dashboards
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import {
  DenominationStats,
  ChurchStats,
  BranchStats,
  ConsolidatedReport,
  MonthlyTrend,
  GeographicalData,
  BranchSummary,
} from '@/types/hierarchy';
import {
  denominationService,
  churchService,
  branchService,
  hierarchyReportService,
  HierarchyError,
} from '@/services/denominationService';
import { toast } from '@/hooks/use-toast';

// Interface para métricas consolidadas
interface ConsolidatedMetrics {
  total_entities: number;
  total_members: number;
  total_visitors: number;
  total_activities: number;
  growth_rate: number;
  conversion_rate: number;
  most_active_entity: string;
  top_performing_entities: Array<{
    id: number;
    name: string;
    metric_value: number;
    metric_type: string;
  }>;
}

// Interface para comparação de períodos
interface PeriodComparison {
  current_period: DenominationStats | ChurchStats | BranchStats;
  previous_period: DenominationStats | ChurchStats | BranchStats;
  comparison_metrics: {
    churches_growth: number;
    members_growth: number;
    visitors_growth: number;
    activities_growth: number;
  };
  trends: MonthlyTrend[];
}

// Interface do estado do hook
interface UseDenominationStatsState {
  // Estatísticas principais
  denominationStats: DenominationStats | null;
  churchesStats: ChurchStats[];
  branchesStats: BranchStats[];
  consolidatedMetrics: ConsolidatedMetrics | null;
  
  // Relatórios
  consolidatedReport: ConsolidatedReport | null;
  periodComparison: PeriodComparison | null;
  geographicalData: GeographicalData[];
  monthlyTrends: MonthlyTrend[];
  
  // Estados de carregamento
  isLoadingStats: boolean;
  isLoadingReport: boolean;
  isLoadingComparison: boolean;
  isLoadingGeoData: boolean;
  
  // Controle de erros
  error: string | null;
  reportError: string | null;
}

// Interface do retorno do hook
interface UseDenominationStatsReturn extends UseDenominationStatsState {
  // Carregamento de dados
  loadDenominationStats: (denominationId: number) => Promise<void>;
  loadChurchStats: (churchId: number) => Promise<void>;
  loadBranchStats: (branchId: number) => Promise<void>;
  loadConsolidatedReport: (entityType: 'denomination' | 'church', entityId: number, period?: string) => Promise<void>;
  loadPeriodComparison: (entityType: 'denomination' | 'church', entityId: number, currentPeriod: string, previousPeriod: string) => Promise<void>;
  
  // Refresh e atualizações
  refreshAllStats: (denominationId: number) => Promise<void>;
  refreshStatsForEntity: (entityType: 'denomination' | 'church' | 'branch', entityId: number) => Promise<void>;
  
  // Utilitários de cálculo
  calculateGrowthRate: (current: number, previous: number) => number;
  calculateConversionRate: (visitors: number, members: number) => number;
  formatMetricValue: (value: number, type: 'percentage' | 'currency' | 'number') => string;
  
  // Análises avançadas
  getTopPerformingEntities: (metric: 'members' | 'visitors' | 'activities', limit?: number) => Array<{
    id: number;
    name: string;
    value: number;
  }>;
  getTrendAnalysis: (metric: 'members' | 'visitors' | 'activities') => {
    trend: 'growing' | 'declining' | 'stable';
    percentage: number;
    isPositive: boolean;
  };
  getGeographicalInsights: () => {
    strongestRegions: GeographicalData[];
    emergingRegions: GeographicalData[];
    totalCoverage: number;
  };
  
  // Exportação
  exportStatsReport: (entityType: 'denomination' | 'church', entityId: number, format: 'xlsx' | 'pdf') => Promise<void>;
  
  // Utilitários
  clearError: () => void;
  clearReportError: () => void;
}

export const useDenominationStats = (): UseDenominationStatsReturn => {
  const { user, isAuthenticated } = useAuth();

  const [state, setState] = useState<UseDenominationStatsState>({
    denominationStats: null,
    churchesStats: [],
    branchesStats: [],
    consolidatedMetrics: null,
    consolidatedReport: null,
    periodComparison: null,
    geographicalData: [],
    monthlyTrends: [],
    isLoadingStats: false,
    isLoadingReport: false,
    isLoadingComparison: false,
    isLoadingGeoData: false,
    error: null,
    reportError: null,
  });

  // ===== CARREGAMENTO DE DADOS =====

  const loadDenominationStats = useCallback(async (denominationId: number) => {
    setState(prev => ({ ...prev, isLoadingStats: true, error: null }));

    try {
      const stats = await denominationService.getDenominationDashboard(denominationId);
      
      // Calcular métricas consolidadas
      const consolidatedMetrics: ConsolidatedMetrics = {
        total_entities: stats.total_churches,
        total_members: stats.total_members,
        total_visitors: stats.total_visitors,
        total_activities: stats.total_activities,
        growth_rate: stats.members_growth_rate || 0,
        conversion_rate: stats.visitors_conversion_rate || 0,
        most_active_entity: 'N/A', // Seria calculado baseado nos dados
        top_performing_entities: [], // Seria populado com dados reais
      };

      setState(prev => ({
        ...prev,
        denominationStats: stats,
        consolidatedMetrics,
        geographicalData: stats.geographical_distribution || [],
        monthlyTrends: stats.monthly_trends || [],
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

  const loadChurchStats = useCallback(async (churchId: number) => {
    try {
      const stats = await churchService.getChurchDashboard(churchId);
      
      setState(prev => ({
        ...prev,
        churchesStats: [...prev.churchesStats.filter(s => s !== stats), stats],
      }));
    } catch (error) {
      console.error('Erro ao carregar estatísticas da igreja:', error);
    }
  }, []);

  const loadBranchStats = useCallback(async (branchId: number) => {
    try {
      const stats = await branchService.getBranchDashboard(branchId);
      
      setState(prev => ({
        ...prev,
        branchesStats: [...prev.branchesStats.filter(s => s !== stats), stats],
      }));
    } catch (error) {
      console.error('Erro ao carregar estatísticas da filial:', error);
    }
  }, []);

  const loadConsolidatedReport = useCallback(async (
    entityType: 'denomination' | 'church',
    entityId: number,
    period?: string
  ) => {
    setState(prev => ({ ...prev, isLoadingReport: true, reportError: null }));

    try {
      const report = entityType === 'denomination'
        ? await hierarchyReportService.getDenominationConsolidatedReport(entityId, period)
        : await hierarchyReportService.getChurchBranchesSummary(entityId, period);

      setState(prev => ({
        ...prev,
        consolidatedReport: report,
        isLoadingReport: false,
      }));
    } catch (error) {
      const errorMessage = error instanceof HierarchyError 
        ? error.message 
        : 'Erro ao carregar relatório consolidado';
      
      setState(prev => ({
        ...prev,
        reportError: errorMessage,
        isLoadingReport: false,
      }));
    }
  }, []);

  const loadPeriodComparison = useCallback(async (
    entityType: 'denomination' | 'church',
    entityId: number,
    currentPeriod: string,
    previousPeriod: string
  ) => {
    setState(prev => ({ ...prev, isLoadingComparison: true }));

    try {
      // Carregar dados dos dois períodos
      const [currentReport, previousReport] = await Promise.all([
        entityType === 'denomination'
          ? hierarchyReportService.getDenominationConsolidatedReport(entityId, currentPeriod)
          : hierarchyReportService.getChurchBranchesSummary(entityId, currentPeriod),
        entityType === 'denomination'
          ? hierarchyReportService.getDenominationConsolidatedReport(entityId, previousPeriod)
          : hierarchyReportService.getChurchBranchesSummary(entityId, previousPeriod)
      ]);

      // Calcular comparação
      const comparison: PeriodComparison = {
        current_period: currentReport.denomination_data || currentReport.church_data!,
        previous_period: previousReport.denomination_data || previousReport.church_data!,
        comparison_metrics: {
          churches_growth: 0, // Seria calculado
          members_growth: 0,  // Seria calculado
          visitors_growth: 0, // Seria calculado
          activities_growth: 0, // Seria calculado
        },
        trends: currentReport.denomination_data?.monthly_trends || currentReport.church_data?.monthly_trends || [],
      };

      setState(prev => ({
        ...prev,
        periodComparison: comparison,
        isLoadingComparison: false,
      }));
    } catch (error) {
      console.error('Erro ao carregar comparação de períodos:', error);
      setState(prev => ({ ...prev, isLoadingComparison: false }));
    }
  }, []);

  // ===== REFRESH E ATUALIZAÇÕES =====

  const refreshAllStats = useCallback(async (denominationId: number) => {
    await loadDenominationStats(denominationId);
    
    // Recarregar estatísticas das igrejas e filiais se necessário
    // Esta lógica dependeria da implementação específica
  }, [loadDenominationStats]);

  const refreshStatsForEntity = useCallback(async (
    entityType: 'denomination' | 'church' | 'branch',
    entityId: number
  ) => {
    switch (entityType) {
      case 'denomination':
        await loadDenominationStats(entityId);
        break;
      case 'church':
        await loadChurchStats(entityId);
        break;
      case 'branch':
        await loadBranchStats(entityId);
        break;
    }
  }, [loadDenominationStats, loadChurchStats, loadBranchStats]);

  // ===== UTILITÁRIOS DE CÁLCULO =====

  const calculateGrowthRate = useCallback((current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }, []);

  const calculateConversionRate = useCallback((visitors: number, members: number): number => {
    if (visitors === 0) return 0;
    return (members / visitors) * 100;
  }, []);

  const formatMetricValue = useCallback((value: number, type: 'percentage' | 'currency' | 'number'): string => {
    switch (type) {
      case 'percentage':
        return `${value.toFixed(1)}%`;
      case 'currency':
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
      case 'number':
        return new Intl.NumberFormat('pt-BR').format(value);
      default:
        return value.toString();
    }
  }, []);

  // ===== ANÁLISES AVANÇADAS =====

  const getTopPerformingEntities = useCallback((
    metric: 'members' | 'visitors' | 'activities',
    limit = 5
  ) => {
    // Esta função seria implementada baseada nos dados reais
    // Por enquanto retorna array vazio
    return [];
  }, []);

  const getTrendAnalysis = useCallback((metric: 'members' | 'visitors' | 'activities') => {
    const trends = state.monthlyTrends;
    if (trends.length < 2) {
      return { trend: 'stable' as const, percentage: 0, isPositive: true };
    }

    // Análise simplificada da tendência
    const recent = trends.slice(-3);
    const average = recent.reduce((acc, trend) => acc + trend[metric], 0) / recent.length;
    const previousAverage = trends.slice(-6, -3).reduce((acc, trend) => acc + trend[metric], 0) / 3;

    const percentage = calculateGrowthRate(average, previousAverage);
    const isPositive = percentage >= 0;
    
    let trend: 'growing' | 'declining' | 'stable' = 'stable';
    if (Math.abs(percentage) > 5) {
      trend = percentage > 0 ? 'growing' : 'declining';
    }

    return { trend, percentage, isPositive };
  }, [state.monthlyTrends, calculateGrowthRate]);

  const getGeographicalInsights = useCallback(() => {
    const { geographicalData } = state;
    
    if (geographicalData.length === 0) {
      return {
        strongestRegions: [],
        emergingRegions: [],
        totalCoverage: 0,
      };
    }

    // Ordenar por número de membros
    const sorted = [...geographicalData].sort((a, b) => b.members_count - a.members_count);
    
    return {
      strongestRegions: sorted.slice(0, 3),
      emergingRegions: sorted.slice(-3).reverse(),
      totalCoverage: geographicalData.length,
    };
  }, [state.geographicalData]);

  // ===== EXPORTAÇÃO =====

  const exportStatsReport = useCallback(async (
    entityType: 'denomination' | 'church',
    entityId: number,
    format: 'xlsx' | 'pdf'
  ) => {
    try {
      const blob = await hierarchyReportService.exportData(
        entityType,
        entityId,
        format,
        'consolidated'
      );

      // Criar link para download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `relatorio-estatisticas-${entityType}-${entityId}.${format}`;
      link.click();
      
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Sucesso",
        description: "Relatório de estatísticas exportado com sucesso!",
        variant: "default",
      });
    } catch (error) {
      const errorMessage = error instanceof HierarchyError 
        ? error.message 
        : 'Erro ao exportar relatório';
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, []);

  // ===== UTILITÁRIOS =====

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const clearReportError = useCallback(() => {
    setState(prev => ({ ...prev, reportError: null }));
  }, []);

  return {
    // Estado
    ...state,
    
    // Carregamento
    loadDenominationStats,
    loadChurchStats,
    loadBranchStats,
    loadConsolidatedReport,
    loadPeriodComparison,
    
    // Refresh
    refreshAllStats,
    refreshStatsForEntity,
    
    // Cálculos
    calculateGrowthRate,
    calculateConversionRate,
    formatMetricValue,
    
    // Análises
    getTopPerformingEntities,
    getTrendAnalysis,
    getGeographicalInsights,
    
    // Exportação
    exportStatsReport,
    
    // Utilitários
    clearError,
    clearReportError,
  };
};