import { api, API_ENDPOINTS } from '@/config/api';
import {
  ActivitySummary,
  PlanDistribution,
  PlatformOverview,
  SubscriptionAlerts,
  TopChurch,
  TopChurchVisitors,
  GeoStateData,
} from '@/types/platformAdmin';

export const platformAdminService = {
  async getOverview(): Promise<PlatformOverview> {
    const response = await api.get<PlatformOverview>(API_ENDPOINTS.platform.overview);
    return response.data;
  },

  async getPlanDistribution(): Promise<PlanDistribution> {
    const response = await api.get<PlanDistribution>(
      API_ENDPOINTS.platform.planDistribution
    );
    return response.data;
  },

  async getTopChurches(): Promise<TopChurch[]> {
    const response = await api.get<TopChurch[]>(API_ENDPOINTS.platform.topChurches);
    return response.data;
  },

  async getTopChurchesVisitors(): Promise<TopChurchVisitors[]> {
    const response = await api.get<TopChurchVisitors[]>(
      API_ENDPOINTS.platform.topChurchesVisitors
    );
    return response.data;
  },

  async getActivitySummary(): Promise<ActivitySummary> {
    const response = await api.get<ActivitySummary>(
      API_ENDPOINTS.platform.activitySummary
    );
    return response.data;
  },

  async getSubscriptionAlerts(): Promise<SubscriptionAlerts> {
    const response = await api.get<SubscriptionAlerts>(
      API_ENDPOINTS.platform.subscriptions
    );
    return response.data;
  },

  async getGeoMapData(): Promise<GeoStateData[]> {
    const response = await api.get<GeoStateData[]>(API_ENDPOINTS.platform.geoMap);
    return response.data;
  },
};
