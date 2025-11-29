import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import SuperAdminDashboard from '../SuperAdminDashboard';

let currentUser: any = { is_superuser: true };

const mockOverview = {
  users: { total: 2, active_30d: 2, new_this_month: 1 },
  denominations: { total: 1 },
  churches: { total: 2, new_this_month: 1 },
  branches: { total: 0 },
  members: { total: 3, new_this_month: 2 },
  visitors: { total: 1, new_this_month: 1 },
  activity: { logins_24h: 2, logins_7d: 2, new_members_month: 2, new_users_month: 1 },
  data_quality: {},
};

const mockTopChurches = [
  {
    id: 1,
    name: 'Igreja A',
    short_name: 'A',
    city: 'SP',
    state: 'SP',
    subscription_plan: 'basic',
    members_count: 10,
    new_members_month: 2,
  },
];

const mockTopVisitors = [
  {
    id: 2,
    name: 'Igreja B',
    short_name: 'B',
    city: 'RJ',
    state: 'RJ',
    subscription_plan: 'basic',
    visitors_count: 5,
  },
];

const platformHooksMock = vi.hoisted(() => ({
  usePlatformOverview: vi.fn(),
  useTopChurches: vi.fn(),
  useTopChurchesVisitors: vi.fn(),
  useActivitySummary: vi.fn(),
  useGeoMapData: vi.fn(),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: currentUser }),
}));

vi.mock('@/hooks/usePlatformAdmin', () => platformHooksMock);

vi.mock('@/components/layout/AppLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="layout">{children}</div>,
}));

vi.mock('@/components/platform-admin/ActivitySummaryCard', () => ({
  ActivitySummaryCard: () => <div>ActivitySummary</div>,
}));

vi.mock('@/components/platform-admin/TopChurchesTable', () => ({
  TopChurchesTable: () => <div>TopChurchesTable</div>,
}));

vi.mock('@/components/platform-admin/TopVisitorsTable', () => ({
  TopVisitorsTable: () => <div>TopVisitorsTable</div>,
}));

vi.mock('@/components/platform-admin/StatCard', () => ({
  StatCard: ({ title, value }: { title: string; value: any }) => (
    <div>
      <span>{title}</span>
      <span>{value}</span>
    </div>
  ),
}));

describe('SuperAdminDashboard', () => {
  beforeEach(() => {
    currentUser = { is_superuser: true };
    platformHooksMock.usePlatformOverview.mockReturnValue({ data: mockOverview, isLoading: false });
    platformHooksMock.useTopChurches.mockReturnValue({ data: mockTopChurches, isLoading: false });
    platformHooksMock.useTopChurchesVisitors.mockReturnValue({ data: mockTopVisitors, isLoading: false });
    platformHooksMock.useActivitySummary.mockReturnValue({ data: mockOverview.activity, isLoading: false });
    platformHooksMock.useGeoMapData.mockReturnValue({ data: [], isLoading: false });
  });

  it('bloqueia acesso para não-superuser', () => {
    currentUser = { is_superuser: false };
    render(<SuperAdminDashboard />);
    expect(screen.getByText(/Acesso restrito ao Super Admin/i)).toBeInTheDocument();
  });

  it('renderiza KPIs quando superuser', () => {
    render(<SuperAdminDashboard />);
    expect(screen.getByText('Usuários')).toBeInTheDocument();
    expect(screen.getByText('Igrejas')).toBeInTheDocument();
    expect(screen.getAllByText('2').length).toBeGreaterThan(0);
    expect(screen.getAllByText('3').length).toBeGreaterThan(0);
  });

  it('gera snapshot básico', () => {
    const { asFragment } = render(<SuperAdminDashboard />);
    expect(asFragment()).toMatchSnapshot();
  });
});
