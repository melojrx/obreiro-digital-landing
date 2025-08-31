import { api } from '@/config/api';
import { DenominationDetails, ChurchDetails, BranchDetails } from '@/types/hierarchy';

export interface HierarchyStats {
  total_churches: number;
  total_branches: number;
  total_members: number;
  total_visitors: number;
  total_activities: number;
  growth_metrics: {
    members_this_month: number;
    members_last_month: number;
    visitors_this_month: number;
    visitors_last_month: number;
    churches_this_year: number;
    branches_this_year: number;
  };
  health_indicators: {
    average_attendance: number;
    active_churches_percentage: number;
    member_retention_rate: number;
    visitor_conversion_rate: number;
  };
  financial_summary: {
    total_tithes_this_month: number;
    total_offerings_this_month: number;
    total_expenses_this_month: number;
    budget_variance_percentage: number;
  };
  alerts: {
    inactive_churches: number;
    low_attendance_churches: number;
    overdue_reports: number;
    subscription_expiring: number;
  };
}

export interface HierarchyNode {
  id: string;
  name: string;
  type: 'denomination' | 'church' | 'branch';
  level: number;
  data: DenominationDetails | ChurchDetails | BranchDetails;
  children: HierarchyNode[];
  expanded: boolean;
  stats: {
    members: number;
    visitors: number;
    activities: number;
    branches_count?: number;
    health_score: number; // 0-100
    growth_rate: number; // percentage
    engagement_rate: number; // percentage
  };
  insights: {
    trend: 'growing' | 'stable' | 'declining';
    priority: 'high' | 'medium' | 'low';
    recommendations: string[];
    alerts: string[];
  };
}

export interface ChurchInsights {
  id: number;
  name: string;
  health_score: number;
  growth_metrics: {
    member_growth_rate: number;
    visitor_growth_rate: number;
    activity_engagement_rate: number;
    retention_rate: number;
  };
  financial_health: {
    monthly_income: number;
    monthly_expenses: number;
    tithe_consistency: number;
    budget_adherence: number;
  };
  operational_metrics: {
    leadership_capacity: number;
    volunteer_engagement: number;
    program_diversity: number;
    community_impact: number;
  };
  recommendations: Array<{
    category: 'growth' | 'financial' | 'leadership' | 'engagement';
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    action_items: string[];
  }>;
  alerts: Array<{
    type: 'warning' | 'error' | 'info';
    title: string;
    description: string;
    deadline?: string;
  }>;
}

export interface DenominationAnalytics {
  overview: {
    total_churches: number;
    total_branches: number;
    total_members: number;
    total_staff: number;
    coverage_states: number;
    coverage_cities: number;
  };
  performance: {
    top_performing_churches: Array<{
      id: number;
      name: string;
      health_score: number;
      growth_rate: number;
    }>;
    churches_needing_attention: Array<{
      id: number;
      name: string;
      issues: string[];
      priority: 'high' | 'medium' | 'low';
    }>;
    monthly_trends: Array<{
      month: string;
      members: number;
      visitors: number;
      activities: number;
      income: number;
    }>;
  };
  strategic_insights: {
    expansion_opportunities: Array<{
      city: string;
      state: string;
      population: number;
      competition_level: 'low' | 'medium' | 'high';
      opportunity_score: number;
    }>;
    resource_allocation: {
      understaffed_churches: number;
      budget_discrepancies: number;
      training_needs: string[];
    };
    sustainability_metrics: {
      financial_stability_score: number;
      leadership_pipeline_health: number;
      member_satisfaction_index: number;
    };
  };
}

class HierarchyService {
  /**
   * Obtém estatísticas gerais da denominação
   */
  async getDenominationStats(denominationId?: number): Promise<HierarchyStats> {
    // Usar a rota /denominations/stats/ que retorna a estrutura HierarchyStats correta
    const response = await api.get('/denominations/stats/');
    return response.data;
  }

  /**
   * Obtém dados hierárquicos completos
   */
  async getHierarchyData(denominationId?: number): Promise<HierarchyNode[]> {
    // Usar a rota /denominations/hierarchy/ que retorna dados hierárquicos completos
    try {
      const response = await api.get('/denominations/hierarchy/');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar dados hierárquicos:', error);
      return [];
    }
  }

  /**
   * Obtém insights detalhados de uma igreja
   */
  async getChurchInsights(churchId: number): Promise<ChurchInsights> {
    const response = await api.get(`/churches/${churchId}/insights/`);
    return response.data;
  }

  /**
   * Obtém analytics da denominação
   */
  async getDenominationAnalytics(): Promise<DenominationAnalytics> {
    const response = await api.get('/denominations/analytics/');
    return response.data;
  }

  /**
   * Obtém comparativo entre igrejas
   */
  async getChurchesComparison(churchIds: number[]): Promise<{
    churches: Array<{
      id: number;
      name: string;
      metrics: {
        members: number;
        visitors: number;
        activities: number;
        income: number;
        health_score: number;
      };
    }>;
    benchmarks: {
      avg_members: number;
      avg_visitors: number;
      avg_health_score: number;
      best_practices: string[];
    };
  }> {
    const response = await api.post('/churches/compare/', { church_ids: churchIds });
    return response.data;
  }

  /**
   * Obtém projeções e tendências
   */
  async getGrowthProjections(): Promise<{
    projections: {
      next_quarter: {
        expected_members: number;
        expected_churches: number;
        expected_income: number;
      };
      next_year: {
        expected_members: number;
        expected_churches: number;
        expected_income: number;
      };
    };
    recommendations: Array<{
      category: string;
      title: string;
      impact: 'high' | 'medium' | 'low';
      effort: 'low' | 'medium' | 'high';
      description: string;
    }>;
  }> {
    const response = await api.get('/denominations/projections/');
    return response.data;
  }

  /**
   * Obtém alertas e notificações
   */
  async getAlerts(): Promise<Array<{
    id: number;
    type: 'church_inactive' | 'low_attendance' | 'financial_issue' | 'subscription_expiring' | 'leadership_gap';
    severity: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    description: string;
    church_id?: number;
    church_name?: string;
    created_at: string;
    deadline?: string;
    action_url?: string;
  }>> {
    const response = await api.get('/denominations/alerts/');
    return response.data;
  }

  /**
   * Obtém dados para mapa de cobertura geográfica
   */
  async getGeographicalCoverage(): Promise<{
    states: Array<{
      state: string;
      state_name: string;
      churches_count: number;
      branches_count: number;
      total_members: number;
      coverage_percentage: number;
    }>;
    cities: Array<{
      city: string;
      state: string;
      churches_count: number;
      members_count: number;
      coordinates: { lat: number; lng: number };
    }>;
    expansion_suggestions: Array<{
      city: string;
      state: string;
      population: number;
      churches_nearby: number;
      opportunity_score: number;
      reasons: string[];
    }>;
  }> {
    const response = await api.get('/denominations/geographical-coverage/');
    return response.data;
  }

  /**
   * Atualiza configurações de uma igreja
   */
  async updateChurchSettings(churchId: number, settings: {
    auto_reports: boolean;
    notification_preferences: string[];
    goals: {
      members_target: number;
      visitors_target: number;
      income_target: number;
    };
    thresholds: {
      low_attendance_threshold: number;
      budget_variance_threshold: number;
    };
  }): Promise<void> {
    await api.patch(`/churches/${churchId}/settings/`, settings);
  }

  /**
   * Exporta relatório hierárquico
   */
  async exportHierarchyReport(format: 'pdf' | 'xlsx', options: {
    include_insights: boolean;
    include_financial: boolean;
    date_range: {
      start: string;
      end: string;
    };
  }): Promise<Blob> {
    const response = await api.post('/denominations/export-hierarchy/', options, {
      params: { format },
      responseType: 'blob',
    });
    return response.data;
  }
}

export const hierarchyService = new HierarchyService();
export default hierarchyService;