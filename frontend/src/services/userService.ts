/**
 * Service para gerenciamento de usuários
 */

import { api } from '@/config/api';

export interface EligibleAdmin {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  current_system_roles: Array<{
    role: string;
    role_display: string;
  }>;
  ministerial_function?: string;
  ministerial_function_display?: string;
  avatar?: string;
  is_current_pastor?: boolean;
  role_explanation?: string;
}

export interface EligibleAdminsResponse {
  count: number;
  results: EligibleAdmin[];
}

class UserService {
  /**
   * Busca usuários elegíveis para serem administradores de igreja
   */
  async getEligibleAdmins(denominationId?: number): Promise<EligibleAdminsResponse> {
    const params = denominationId ? { denomination_id: denominationId } : {};
    const response = await api.get('/churches/eligible-admins/', { params });
    return response.data;
  }

  /**
   * Busca usuários elegíveis para serem administradores de uma igreja específica
   */
  async getEligibleAdminsForChurch(churchId: number): Promise<EligibleAdminsResponse> {
    const response = await api.get(`/churches/${churchId}/eligible-admins/`);
    return response.data;
  }

  /**
   * Busca detalhes de um usuário específico
   */
  async getUser(userId: number) {
    const response = await api.get(`/accounts/users/${userId}/`);
    return response.data;
  }

  /**
   * Busca usuários por termo de pesquisa
   */
  async searchUsers(query: string, limit = 10) {
    const response = await api.get('/accounts/users/', {
      params: {
        search: query,
        limit,
        is_active: true
      }
    });
    return response.data;
  }
}

export const userService = new UserService();