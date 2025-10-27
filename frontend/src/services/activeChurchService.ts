import { api } from '@/config/api';

export interface UserChurch {
  id: number;
  name: string;
  short_name: string;
  denomination_name: string | null;
  role: string;
  role_code: string;
  is_active: boolean;
  city: string;
  state: string;
  active_branch?: {
    id: number;
    name: string;
  } | null;
}

export interface ActiveChurch {
  id: number;
  name: string;
  short_name: string;
  denomination_name: string | null;
  city: string;
  state: string;
  active_branch?: {
    id: number;
    name: string;
  } | null;
}

export interface UserChurchesResponse {
  count: number;
  churches: UserChurch[];
}

export interface SetActiveChurchRequest {
  churchId: number;
  branchId?: number;
}

export interface SetActiveChurchResponse {
  message: string;
  active_church: ActiveChurch;
}

export interface ActiveChurchResponse {
  active_church: ActiveChurch;
}

export const activeChurchService = {
  /**
   * Busca todas as igrejas do usuário
   */
  async getUserChurches(): Promise<UserChurchesResponse> {
    const response = await api.get<UserChurchesResponse>('/auth/my-churches/');
    return response.data;
  },

  /**
   * Define qual igreja é ativa para o usuário
   */
  async setActiveChurch({ churchId, branchId }: SetActiveChurchRequest): Promise<SetActiveChurchResponse> {
    const response = await api.post<SetActiveChurchResponse>('/auth/set-active-church/', {
      church_id: churchId,
      branch_id: branchId,
    });
    return response.data;
  },

  /**
   * Busca a igreja ativa atual do usuário
   */
  async getActiveChurch(): Promise<ActiveChurchResponse> {
    const response = await api.get<ActiveChurchResponse>('/auth/active-church/');
    return response.data;
  },
};
