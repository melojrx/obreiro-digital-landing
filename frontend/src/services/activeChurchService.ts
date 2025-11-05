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
    
    // Salvar no localStorage para que os cabeçalhos HTTP sejam adicionados automaticamente
    localStorage.setItem('active_church', String(churchId));
    if (branchId) {
      localStorage.setItem('active_branch', String(branchId));
    } else {
      localStorage.removeItem('active_branch');
    }
    
    console.log(' ✅ Igreja/Branch ativa salva no localStorage:', { churchId, branchId });
    
    return response.data;
  },

  /**
   * Busca a igreja ativa atual do usuário
   */
  async getActiveChurch(): Promise<ActiveChurchResponse> {
    const response = await api.get<ActiveChurchResponse>('/auth/active-church/');
    
    // Salvar no localStorage para que os cabeçalhos HTTP sejam adicionados automaticamente
    if (response.data.active_church) {
      localStorage.setItem('active_church', String(response.data.active_church.id));
      
      if (response.data.active_church.active_branch) {
        localStorage.setItem('active_branch', String(response.data.active_church.active_branch.id));
      } else {
        localStorage.removeItem('active_branch');
      }
      
      console.log('✅ Igreja/Branch ativa carregada no localStorage:', { 
        churchId: response.data.active_church.id, 
        branchId: response.data.active_church.active_branch?.id 
      });
    }
    
    return response.data;
  },
};
