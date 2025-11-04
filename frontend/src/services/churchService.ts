import { api } from '@/config/api';
import {
  ChurchDetails,
  CreateChurchFormData,
  ChurchFilters,
  PaginatedResponse,
  ChurchStats,
  AdminUser,
  BranchDetails,
  BatchActionRequest,
  BatchActionResponse,
} from '@/types/hierarchy';

export interface ChurchSubscriptionData {
  subscription_plan: string;
  subscription_status: string;
  subscription_start_date?: string;
  subscription_end_date?: string;
  trial_end_date?: string;
  max_members: number;
  max_branches: number;
}

export interface AssignAdminRequest {
  user_id: number;
  role: string;
}

export interface RemoveAdminRequest {
  user_id: number;
}

export interface BulkCreateRequest {
  churches: Omit<CreateChurchFormData, 'pastor_name' | 'pastor_email' | 'pastor_phone'>[];
}

export interface UploadImageResponse {
  url: string;
  filename: string;
}

class ChurchService {
  private baseURL = '/churches';
  private _citiesCache = new Map<string, string[]>();
  private _citiesPromiseCache = new Map<string, Promise<string[]>>();

  /**
   * Lista igrejas com filtros e paginação
   */
  async getChurches(
    filters?: ChurchFilters,
    page = 1,
    pageSize = 20
  ): Promise<PaginatedResponse<ChurchDetails>> {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }
    
    params.append('page', String(page));
    params.append('page_size', String(pageSize));

    const response = await api.get(`${this.baseURL}/?${params.toString()}`);
    return response.data;
  }

  /**
   * Busca igrejas por termo
   */
  async searchChurches(
    searchTerm: string,
    filters?: Partial<ChurchFilters>
  ): Promise<PaginatedResponse<ChurchDetails>> {
    const params = new URLSearchParams();
    params.append('search', searchTerm);
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }

    const response = await api.get(`${this.baseURL}/?${params.toString()}`);
    return response.data;
  }

  /**
   * Obtém detalhes de uma igreja
   */
  async getChurch(id: number): Promise<ChurchDetails> {
    const response = await api.get(`${this.baseURL}/${id}/`);
    return response.data;
  }

  /**
   * Cria uma nova igreja
   */
  async createChurch(data: CreateChurchFormData): Promise<ChurchDetails> {
    const response = await api.post(`${this.baseURL}/`, data);
    return response.data;
  }

  /**
   * Atualiza uma igreja (completo)
   */
  async updateChurch(id: number, data: Partial<ChurchDetails>): Promise<ChurchDetails> {
    const response = await api.put(`${this.baseURL}/${id}/`, data);
    return response.data;
  }

  /**
   * Atualiza uma igreja (parcial)
   */
  async patchChurch(id: number, data: Partial<ChurchDetails>): Promise<ChurchDetails> {
    const response = await api.patch(`${this.baseURL}/${id}/`, data);
    return response.data;
  }

  /**
   * Remove uma igreja (soft delete)
   */
  async deleteChurch(id: number): Promise<void> {
    await api.delete(`${this.baseURL}/${id}/`);
  }

  /**
   * Obtém igrejas do usuário atual
   */
  async getMyChurches(page = 1, pageSize = 20): Promise<PaginatedResponse<ChurchDetails>> {
    const params = new URLSearchParams();
    params.append('page', String(page));
    params.append('page_size', String(pageSize));

    const response = await api.get(`${this.baseURL}/my-churches/?${params.toString()}`);
    return response.data;
  }

  /**
   * Obtém igrejas por denominação
   */
  async getChurchesByDenomination(
    denominationId: number,
    page = 1,
    pageSize = 20
  ): Promise<PaginatedResponse<ChurchDetails>> {
    const params = new URLSearchParams();
    params.append('page', String(page));
    params.append('page_size', String(pageSize));

    const response = await api.get(
      `${this.baseURL}/by-denomination/${denominationId}/?${params.toString()}`
    );
    return response.data;
  }

  /**
   * Criação em lote de igrejas
   */
  async bulkCreateChurches(data: BulkCreateRequest): Promise<{ created: ChurchDetails[]; errors: unknown[] }> {
    const response = await api.post(`${this.baseURL}/bulk-create/`, data);
    return response.data;
  }

  /**
   * Obtém estatísticas detalhadas da igreja
   */
  async getChurchStatistics(id: number): Promise<ChurchStats> {
    const response = await api.get(`${this.baseURL}/${id}/statistics/`);
    return response.data;
  }

  /**
   * Obtém congregações da igreja
   */
  async getChurchBranches(id: number): Promise<BranchDetails[]> {
    const response = await api.get(`${this.baseURL}/${id}/branches/`);
    const data = response.data;

    if (Array.isArray(data)) {
      return data;
    }

    if (Array.isArray(data?.results)) {
      return data.results;
    }

    if (Array.isArray(data?.branches)) {
      return data.branches;
    }

    return [];
  }

  /**
   * Força atualização das estatísticas
   */
  async updateChurchStatistics(id: number): Promise<ChurchStats> {
    const response = await api.post(`${this.baseURL}/${id}/update-statistics/`);
    return response.data;
  }

  /**
   * Obtém dados da assinatura
   */
  async getChurchSubscription(id: number): Promise<ChurchSubscriptionData> {
    const response = await api.get(`${this.baseURL}/${id}/subscription/`);
    return response.data;
  }

  /**
   * Atualiza dados da assinatura
   */
  async updateChurchSubscription(
    id: number, 
    data: Partial<ChurchSubscriptionData>
  ): Promise<ChurchSubscriptionData> {
    const response = await api.patch(`${this.baseURL}/${id}/subscription/`, data);
    return response.data;
  }

  /**
   * Atribui administrador à igreja
   */
  async assignAdmin(id: number, data: AssignAdminRequest): Promise<void> {
    await api.post(`${this.baseURL}/${id}/assign-admin/`, data);
  }

  /**
   * Remove administrador da igreja
   */
  async removeAdmin(id: number, data: RemoveAdminRequest): Promise<void> {
    await api.post(`${this.baseURL}/${id}/remove-admin/`, data);
  }

  /**
   * Obtém lista de administradores da igreja
   */
  async getChurchAdmins(id: number): Promise<AdminUser[]> {
    const response = await api.get(`${this.baseURL}/${id}/admins/`);
    return response.data;
  }

  /**
   * Ações em lote (ativar/desativar/deletar múltiplas igrejas)
   */
  async batchAction(data: BatchActionRequest): Promise<BatchActionResponse> {
    const response = await api.post(`${this.baseURL}/batch-action/`, data);
    return response.data;
  }

  /**
   * Upload de logo da igreja
   */
  async uploadLogo(id: number, file: File): Promise<UploadImageResponse> {
    const formData = new FormData();
    formData.append('logo', file);
    
    const response = await api.post(
      `${this.baseURL}/${id}/upload-logo/`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  }

  /**
   * Upload de imagem de capa da igreja
   */
  async uploadCoverImage(id: number, file: File): Promise<UploadImageResponse> {
    const formData = new FormData();
    formData.append('cover_image', file);
    
    const response = await api.post(
      `${this.baseURL}/${id}/upload-cover/`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  }

  /**
   * Remove logo da igreja
   */
  async removeLogo(id: number): Promise<void> {
    await api.delete(`${this.baseURL}/${id}/logo/`);
  }

  /**
   * Remove imagem de capa da igreja
   */
  async removeCoverImage(id: number): Promise<void> {
    await api.delete(`${this.baseURL}/${id}/cover-image/`);
  }

  /**
   * Valida CNPJ
   */
  async validateCNPJ(cnpj: string, churchId?: number): Promise<{ valid: boolean; message?: string }> {
    const params = new URLSearchParams();
    params.append('cnpj', cnpj);
    if (churchId) {
      params.append('exclude_church_id', String(churchId));
    }

    const response = await api.get(`${this.baseURL}/validate-cnpj/?${params.toString()}`);
    return response.data;
  }

  /**
   * Valida email único por denominação
   */
  async validateEmail(
    email: string, 
    denominationId: number, 
    churchId?: number
  ): Promise<{ valid: boolean; message?: string }> {
    const params = new URLSearchParams();
    params.append('email', email);
    params.append('denomination_id', String(denominationId));
    if (churchId) {
      params.append('exclude_church_id', String(churchId));
    }

    const response = await api.get(`${this.baseURL}/validate-email/?${params.toString()}`);
    return response.data;
  }

  /**
   * Obtém estados disponíveis no sistema
   */
  async getAvailableStates(): Promise<Array<{ code: string; name: string }>> {
    const response = await api.get(`${this.baseURL}/available-states/`);
    return response.data;
  }

  /**
   * Obtém cidades por estado.
   * Primeiro tenta o backend; se não houver dados ou ocorrer falha, usa fallback público do IBGE.
   */
  async getCitiesByState(state: string): Promise<string[]> {
    const normalizedState = String(state || '').trim().toUpperCase();
    if (!normalizedState) {
      return [];
    }

    const cacheKey = `cities-${normalizedState}`;
    if (this._citiesCache.has(cacheKey)) {
      return this._citiesCache.get(cacheKey)!;
    }

    if (this._citiesPromiseCache.has(cacheKey)) {
      return this._citiesPromiseCache.get(cacheKey)!;
    }

    const loadPromise = (async () => {
      let result: string[] = [];
      const collected = new Set<string>();
      const pushCities = (list: unknown) => {
        if (!Array.isArray(list)) {
          return;
        }
        list
          .map((city) => (typeof city === 'string' ? city : ''))
          .map((city) => city.trim())
          .filter((city) => city.length > 0)
          .forEach((city) => {
            const normalizedCity = city.replace(/\s+/g, ' ');
            collected.add(normalizedCity);
          });
      };

      try {
        const response = await api.get(`${this.baseURL}/cities-by-state/?state=${normalizedState}`);
        pushCities(response.data);
      } catch (backendError) {
        console.error(`Erro ao carregar cidades via backend para estado ${normalizedState}:`, backendError);
      }

      if (collected.size === 0) {
        try {
          const ibgeResponse = await fetch(
            `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${normalizedState}/municipios`
          );

          if (ibgeResponse.ok) {
            const ibgeData: Array<{ nome?: string }> = await ibgeResponse.json();
            pushCities(ibgeData.map((item) => item?.nome).filter(Boolean));
          } else {
            console.error(`Fallback IBGE retornou status ${ibgeResponse.status} para estado ${normalizedState}`);
          }
        } catch (fallbackError) {
          console.error(`Erro ao buscar cidades no IBGE (fallback) para estado ${normalizedState}:`, fallbackError);
        }
      }

      result = Array.from(collected);
      const collator = new Intl.Collator('pt-BR', { sensitivity: 'base' });
      result.sort((a, b) => collator.compare(a, b));

      if (result.length > 0) {
        this._citiesCache.set(cacheKey, result);
      } else {
        this._citiesCache.delete(cacheKey);
      }
      return result;
    })().finally(() => {
      this._citiesPromiseCache.delete(cacheKey);
    });

    this._citiesPromiseCache.set(cacheKey, loadPromise);
    return loadPromise;
  }

  /**
   * Obtém planos de assinatura disponíveis
   */
  async getSubscriptionPlans(): Promise<Array<{
    code: string;
    name: string;
    max_members: number;
    max_branches: number;
    features: string[];
  }>> {
    const response = await api.get(`${this.baseURL}/subscription-plans/`);
    return response.data;
  }

  /**
   * Verifica disponibilidade para criar igreja
   */
  async checkCreateAvailability(denominationId: number): Promise<{
    can_create: boolean;
    remaining_slots: number;
    max_allowed: number;
    message?: string;
  }> {
    const response = await api.get(`${this.baseURL}/check-create-availability/?denomination_id=${denominationId}`);
    return response.data;
  }

  /**
   * Obtém histórico de alterações da igreja
   */
  async getChurchHistory(id: number): Promise<Array<{
    id: number;
    action: string;
    field: string;
    old_value: string;
    new_value: string;
    user: string;
    timestamp: string;
  }>> {
    const response = await api.get(`${this.baseURL}/${id}/history/`);
    return response.data;
  }

  /**
   * Obtém membros de uma igreja específica
   */
  async getChurchMembers(id: number, search?: string): Promise<{ count: number; results: unknown[] }> {
    const params = new URLSearchParams();
    if (search) {
      params.append('search', search);
    }
    
    const response = await api.get(`${this.baseURL}/${id}/members/?${params.toString()}`);
    return response.data;
  }

  /**
   * Transfere membro entre igrejas
   */
  async transferMember(memberId: number, targetChurchId: number): Promise<void> {
    await api.post(`${this.baseURL}/transfer-member/`, {
      member_id: memberId,
      target_church_id: targetChurchId
    });
  }

  /**
   * Obtém igrejas gerenciadas pelo usuário (para dropdown)
   */
  async getManagedChurches(): Promise<{ count: number; results: Array<{ id: number; name: string; city: string; state: string }> }> {
    const response = await api.get(`${this.baseURL}/managed-churches/`);
    return response.data;
  }


}

export const churchService = new ChurchService();
export default churchService;
