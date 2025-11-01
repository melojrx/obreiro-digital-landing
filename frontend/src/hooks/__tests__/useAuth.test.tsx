import React from 'react';
import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { AuthProvider, useAuth } from '../useAuth';

const mockAuthService = vi.hoisted(() => ({
  getToken: vi.fn(),
  isAuthenticated: vi.fn(),
  getCurrentUser: vi.fn(),
  getUserChurch: vi.fn(),
  logout: vi.fn(),
  updateActivity: vi.fn(),
  login: vi.fn(),
  register: vi.fn(),
  savePartialProfile: vi.fn(),
  completeProfile: vi.fn(),
  finalizeRegistration: vi.fn(),
  getAvailableChurches: vi.fn(),
  getAvailableDenominations: vi.fn(),
  updatePersonalData: vi.fn(),
  updateChurchData: vi.fn(),
  uploadAvatar: vi.fn(),
  deleteAccount: vi.fn(),
}));

vi.mock('@/services/auth', () => ({
  authService: mockAuthService,
}));

const initialUser = {
  id: 1,
  email: 'user@test.com',
  full_name: 'Test User',
  first_name: 'Test',
  last_name: 'User',
  phone: '(11) 90000-0000',
  is_active: true,
  date_joined: '2024-01-01T00:00:00Z',
  is_profile_complete: false,
  subscription_plan: null,
  profile: {},
  intended_role: null,
  intended_denomination: null,
  has_church: true,
  needs_church_setup: false,
};

const updatedUser = {
  ...initialUser,
  full_name: 'Updated User',
  is_profile_complete: true,
};

const initialChurch = {
  id: 10,
  name: 'Igreja Teste',
  short_name: 'IT',
  cnpj: '',
  email: 'igreja@test.com',
  phone: '(11) 95555-0000',
  address: 'Rua A, 123',
  city: 'São Paulo',
  state: 'SP',
  zipcode: '01000-000',
  subscription_plan: 'basic',
  role: 'Administrador',
  role_label: 'Administrador',
  user_role: 'CHURCH_ADMIN',
  active_branch: null,
};

const updatedChurch = {
  ...initialChurch,
  id: 11,
  name: 'Igreja Atualizada',
};

const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('useAuth church loading behaviour', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    mockAuthService.getToken.mockReturnValue('token');
    mockAuthService.isAuthenticated.mockReturnValue(true);
    mockAuthService.logout.mockImplementation(() => {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
    });
  });

  it('carrega dados da igreja mesmo com perfil incompleto', async () => {
    mockAuthService.getCurrentUser
      .mockResolvedValueOnce(initialUser);
    mockAuthService.getUserChurch
      .mockResolvedValueOnce(initialChurch);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.user?.id).toBe(initialUser.id);
      expect(result.current.userChurch?.id).toBe(initialChurch.id);
    });

    expect(mockAuthService.getUserChurch).toHaveBeenCalledTimes(1);
  });

  it('refreshUserData atualiza localStorage e igreja', async () => {
    mockAuthService.getCurrentUser
      .mockResolvedValueOnce(initialUser)
      .mockResolvedValueOnce(updatedUser);

    mockAuthService.getUserChurch
      .mockResolvedValueOnce(initialChurch)
      .mockResolvedValueOnce(updatedChurch);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.user?.id).toBe(initialUser.id);
    });

    await act(async () => {
      await result.current.refreshUserData();
    });

    expect(mockAuthService.getCurrentUser).toHaveBeenCalledTimes(2);
    expect(mockAuthService.getUserChurch).toHaveBeenCalledTimes(2);
    expect(localStorage.getItem('user')).toEqual(JSON.stringify(updatedUser));
    expect(result.current.userChurch?.id).toBe(updatedChurch.id);
  });
});
