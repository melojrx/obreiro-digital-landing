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
}

export interface ActiveChurch {
  id: number;
  name: string;
  short_name: string;
  denomination_name: string | null;
  city: string;
  state: string;
}

export interface UserChurchesResponse {
  count: number;
  churches: UserChurch[];
}

export interface SetActiveChurchRequest {
  church_id: number;
}

export interface SetActiveChurchResponse {
  message: string;
  active_church: {
    id: number;
    name: string;
    short_name: string;
  };
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
  async setActiveChurch(churchId: number): Promise<SetActiveChurchResponse> {
    const response = await api.post<SetActiveChurchResponse>('/auth/set-active-church/', {
      church_id: churchId,
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