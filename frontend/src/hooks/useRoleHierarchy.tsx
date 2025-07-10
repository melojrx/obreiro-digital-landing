import { useState, useEffect, useCallback } from 'react';
import { AxiosError } from 'axios';
import { api } from '@/config/api';

export interface RoleOption {
  value: string;
  label: string;
  description: string;
}

export interface RoleHierarchyData {
  user_role: string;
  user_role_label: string;
  available_roles: RoleOption[];
  can_assign_roles: boolean;
}

export interface UseRoleHierarchyReturn {
  roleHierarchy: RoleHierarchyData | null;
  availableRoles: RoleOption[];
  canAssignRoles: boolean;
  userRole: string | null;
  userRoleLabel: string | null;
  isLoading: boolean;
  error: string | null;
  loadRoleHierarchy: () => Promise<void>;
}

export const useRoleHierarchy = (): UseRoleHierarchyReturn => {
  const [roleHierarchy, setRoleHierarchy] = useState<RoleHierarchyData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRoleHierarchy = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await api.get('/auth/available-roles/');
      setRoleHierarchy(response.data);
    } catch (err) {
      console.error('Erro ao carregar hierarquia de papéis:', err);
      const axiosError = err as AxiosError<{ error?: string }>;
      setError(axiosError?.response?.data?.error || 'Erro ao carregar papéis disponíveis');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRoleHierarchy();
  }, [loadRoleHierarchy]);

  return {
    roleHierarchy,
    availableRoles: roleHierarchy?.available_roles || [],
    canAssignRoles: roleHierarchy?.can_assign_roles || false,
    userRole: roleHierarchy?.user_role || null,
    userRoleLabel: roleHierarchy?.user_role_label || null,
    isLoading,
    error,
    loadRoleHierarchy,
  };
}; 