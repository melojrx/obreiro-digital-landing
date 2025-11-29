type SubscriptionPlan =
  | 'basic'
  | 'professional'
  | 'enterprise'
  | 'denomination'
  | string;

export interface CountWithNew {
  total: number;
  new_this_month?: number;
  active_30d?: number;
}

export interface SimpleCount {
  total: number;
}

export interface PlanDistributionItem {
  plan: SubscriptionPlan;
  label?: string | null;
  count: number;
  percentage: number;
}

export interface PlanDistribution {
  total: number;
  plans: PlanDistributionItem[];
}

export interface ActivitySummary {
  logins_24h: number;
  logins_7d: number;
  new_members_month: number;
  new_users_month: number;
}

export interface SubscriptionAlertItem {
  id: number;
  name: string;
  short_name?: string | null;
  subscription_plan: SubscriptionPlan;
  subscription_end_date: string;
  denomination?: string | null;
}

export interface SubscriptionAlerts {
  expiring_count: number;
  expired_count: number;
  expiring: SubscriptionAlertItem[];
  days_window: number;
}

export interface TopChurch {
  id: number;
  name: string;
  short_name?: string | null;
  city: string;
  state: string;
  subscription_plan: SubscriptionPlan;
  members_count: number;
  new_members_month: number;
}

export interface TopChurchVisitors {
  id: number;
  name: string;
  short_name?: string | null;
  city: string;
  state: string;
  subscription_plan: SubscriptionPlan;
  visitors_count: number;
}

export interface GeoStateData {
  code: string;
  churches_count: number;
  total_users: number;
  active_members: number;
}

export interface PlatformOverview {
  users: CountWithNew;
  denominations: SimpleCount;
  churches: CountWithNew;
  branches: SimpleCount;
  members: CountWithNew;
  visitors: CountWithNew;
  plans: PlanDistribution;
  subscriptions: SubscriptionAlerts;
  activity: ActivitySummary;
}
