import { useQuery } from '@tanstack/react-query';
import { platformAdminService } from '@/services/platformAdminService';
import { useToast } from './use-toast';

function usePlatformAdminQuery<T>(key: unknown[], fn: () => Promise<T>, enabled = true) {
  const { toast } = useToast();

  return useQuery({
    queryKey: key,
    queryFn: fn,
    staleTime: 5 * 60 * 1000,
    enabled,
    onError: () => {
      toast({
        title: 'Não foi possível carregar os dados da plataforma.',
        description: 'Tente novamente em instantes.',
        variant: 'destructive',
      });
    },
  });
}

export const usePlatformOverview = (enabled = true) =>
  usePlatformAdminQuery(['platform', 'overview'], platformAdminService.getOverview, enabled);

export const usePlanDistribution = (enabled = true) =>
  usePlatformAdminQuery(
    ['platform', 'plan-distribution'],
    platformAdminService.getPlanDistribution,
    enabled
  );

export const useTopChurches = (enabled = true) =>
  usePlatformAdminQuery(['platform', 'top-churches'], platformAdminService.getTopChurches, enabled);

export const useTopChurchesVisitors = (enabled = true) =>
  usePlatformAdminQuery(
    ['platform', 'top-churches-visitors'],
    platformAdminService.getTopChurchesVisitors,
    enabled
  );

export const useActivitySummary = (enabled = true) =>
  usePlatformAdminQuery(
    ['platform', 'activity-summary'],
    platformAdminService.getActivitySummary,
    enabled
  );

export const useSubscriptionAlerts = (enabled = true) =>
  usePlatformAdminQuery(
    ['platform', 'subscriptions'],
    platformAdminService.getSubscriptionAlerts,
    enabled
  );

export const useGeoMapData = (enabled = true) =>
  usePlatformAdminQuery(['platform', 'geo-map'], platformAdminService.getGeoMapData, enabled);
