import { api } from '@/config/api';

export interface DenominationStats {
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

export interface DenominationHierarchy {
  id: string;
  name: string;
  type: 'denomination' | 'church' | 'branch';
  level: number;
  data: {
    id: number;
    uuid: string;
    name: string;
    short_name: string;
    total_churches?: number;
    total_members: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
  };
  children: DenominationHierarchy[];
  expanded: boolean;
  stats: {
    members: number;
    visitors: number;
    activities: number;
    branches_count: number;
    health_score: number;
    growth_rate: number;
    engagement_rate: number;
  };
  insights: {
    trend: 'growing' | 'declining' | 'stable';
    priority: 'high' | 'medium' | 'low';
    recommendations: string[];
    alerts: string[];
  };
}

export const denominationStatsService = {
  /**
   * Busca estatísticas consolidadas da denominação do usuário atual
   */
  async getDenominationStats(): Promise<DenominationStats> {
    const response = await api.get<DenominationStats>('/denominations/stats/');
    return response.data;
  },

  /**
   * Busca dados hierárquicos completos da denominação
   */
  async getDenominationHierarchy(): Promise<DenominationHierarchy[]> {
    const response = await api.get<DenominationHierarchy[]>('/denominations/hierarchy/');
    return response.data;
  },

  /**
   * Busca estatísticas de uma denominação específica
   */
  async getDenominationStatsById(denominationId: number): Promise<DenominationStats> {
    const response = await api.get<DenominationStats>(`/denominations/${denominationId}/stats/`);
    return response.data;
  },

  /**
   * Força atualização das estatísticas de uma denominação
   */
  async updateDenominationStats(denominationId: number): Promise<{ message: string; total_churches: number; total_members: number }> {
    const response = await api.post(`/denominations/${denominationId}/update_statistics/`);
    return response.data;
  },

  /**
   * Busca dashboard consolidado do administrador de denominação
   */
  async getDenominationDashboard(denominationId: number): Promise<any> {
    const response = await api.get(`/denominations/${denominationId}/dashboard_data/`);
    return response.data;
  },

  /**
   * Busca igrejas da denominação com filtros
   */
  async getDenominationChurches(denominationId: number, filters?: {
    state?: string;
    search?: string;
  }): Promise<any[]> {
    const params = new URLSearchParams();
    if (filters?.state) params.append('state', filters.state);
    if (filters?.search) params.append('search', filters.search);
    
    const response = await api.get(`/denominations/${denominationId}/churches/?${params.toString()}`);
    return response.data;
  },

  /**
   * Busca denominações do usuário atual
   */
  async getMyDenominations(): Promise<any[]> {
    const response = await api.get('/denominations/my_denominations/');
    return response.data;
  },
};