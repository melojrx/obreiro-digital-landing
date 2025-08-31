import { api } from '@/config/api';
import { 
  BranchDetails, 
  CreateBranchFormData,
  BranchFilters,
  PaginatedResponse,
  BranchStats,
  BatchActionRequest,
  BatchActionResponse 
} from '@/types/hierarchy';

export interface CreateBranchRequest {
  church_id: number;
  name: string;
  email?: string;
  phone?: string;
  address: string;
  city: string;
  state: string;
  zipcode: string;
  allows_visitor_registration: boolean;
  requires_visitor_approval: boolean;
  qr_code_active: boolean;
  capacity?: number;
  description?: string;
}

export interface BranchQRCode {
  id: number;
  name: string;
  church_name: string;
  qr_code_uuid: string;
  qr_code_image: string;
  qr_code_active: boolean;
  qr_code_url: string | null;
  visitor_registration_url: string;
  allows_visitor_registration: boolean;
  total_visitors_registered: number;
}

export interface AssignManagerRequest {
  user_id: number;
  role: string;
}

export interface RemoveManagerRequest {
  user_id: number;
}

class BranchService {
  private baseURL = '/branches';

  /**
   * Lista filiais com filtros e paginação
   */
  async getBranches(
    filters?: BranchFilters,
    page = 1,
    pageSize = 20
  ): Promise<PaginatedResponse<BranchDetails>> {
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
   * Busca filiais por termo
   */
  async searchBranches(
    searchTerm: string,
    filters?: Partial<BranchFilters>
  ): Promise<PaginatedResponse<BranchDetails>> {
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
   * Obtém detalhes de uma filial
   */
  async getBranch(id: number): Promise<BranchDetails> {
    const response = await api.get(`${this.baseURL}/${id}/`);
    return response.data;
  }

  /**
   * Cria uma nova filial
   */
  async createBranch(data: CreateBranchFormData): Promise<BranchDetails> {
    const response = await api.post(`${this.baseURL}/`, data);
    return response.data;
  }

  /**
   * Atualiza uma filial (completo)
   */
  async updateBranch(id: number, data: Partial<BranchDetails>): Promise<BranchDetails> {
    const response = await api.put(`${this.baseURL}/${id}/`, data);
    return response.data;
  }

  /**
   * Atualiza uma filial (parcial)
   */
  async patchBranch(id: number, data: Partial<BranchDetails>): Promise<BranchDetails> {
    const response = await api.patch(`${this.baseURL}/${id}/`, data);
    return response.data;
  }

  /**
   * Remove uma filial (soft delete)
   */
  async deleteBranch(id: number): Promise<void> {
    await api.delete(`${this.baseURL}/${id}/`);
  }

  /**
   * Lista todas as filiais com informações de QR Code
   */
  async getBranchesQRCodes(): Promise<BranchQRCode[]> {
    const response = await api.get(`${this.baseURL}/qr_codes/`);
    return response.data;
  }

  /**
   * Alterna status do QR Code de uma filial
   */
  async toggleQRCode(branchId: number): Promise<{
    message: string;
    data: BranchQRCode;
  }> {
    const response = await api.post(`${this.baseURL}/${branchId}/toggle_qr_code/`);
    return response.data;
  }

  /**
   * Regenera QR Code de uma filial
   */
  async regenerateQRCode(branchId: number): Promise<{
    message: string;
    data: BranchQRCode;
  }> {
    const response = await api.post(`${this.baseURL}/${branchId}/regenerate_qr_code/`);
    return response.data;
  }

  /**
   * Obtém estatísticas de visitantes de uma filial
   */
  async getVisitorStats(branchId: number): Promise<{
    branch_id: number;
    branch_name: string;
    stats: any;
  }> {
    const response = await api.get(`${this.baseURL}/${branchId}/visitor_stats/`);
    return response.data;
  }

  /**
   * Obtém estatísticas detalhadas da filial
   */
  async getBranchStatistics(id: number): Promise<BranchStats> {
    const response = await api.get(`${this.baseURL}/${id}/statistics/`);
    return response.data;
  }

  /**
   * Força atualização das estatísticas
   */
  async updateBranchStatistics(id: number): Promise<BranchStats> {
    const response = await api.post(`${this.baseURL}/${id}/update-statistics/`);
    return response.data;
  }

  /**
   * Obtém filiais de uma igreja
   */
  async getBranchesByChurch(
    churchId: number,
    page = 1,
    pageSize = 20
  ): Promise<PaginatedResponse<BranchDetails>> {
    const params = new URLSearchParams();
    params.append('church', String(churchId));
    params.append('page', String(page));
    params.append('page_size', String(pageSize));

    const response = await api.get(`${this.baseURL}/?${params.toString()}`);
    return response.data;
  }

  /**
   * Atribui gerente à filial
   */
  async assignManager(id: number, data: AssignManagerRequest): Promise<void> {
    await api.post(`${this.baseURL}/${id}/assign-manager/`, data);
  }

  /**
   * Remove gerente da filial
   */
  async removeManager(id: number, data: RemoveManagerRequest): Promise<void> {
    await api.post(`${this.baseURL}/${id}/remove-manager/`, data);
  }

  /**
   * Ações em lote (ativar/desativar/deletar múltiplas filiais)
   */
  async batchAction(data: BatchActionRequest): Promise<BatchActionResponse> {
    const response = await api.post(`${this.baseURL}/batch-action/`, data);
    return response.data;
  }

  /**
   * Valida disponibilidade para criar filial
   */
  async checkCreateAvailability(churchId: number): Promise<{
    can_create: boolean;
    remaining_slots: number;
    max_allowed: number;
    current_count: number;
    subscription_plan: string;
    message?: string;
  }> {
    const response = await api.get(`${this.baseURL}/check-create-availability/?church_id=${churchId}`);
    return response.data;
  }

  /**
   * Obtém cidades por estado
   */
  async getCitiesByState(state: string): Promise<string[]> {
    const response = await api.get(`${this.baseURL}/cities-by-state/?state=${state}`);
    return response.data;
  }

  /**
   * Exporta dados das filiais
   */
  async exportBranches(
    format: 'csv' | 'xlsx' | 'pdf',
    filters?: BranchFilters
  ): Promise<Blob> {
    const params = new URLSearchParams();
    params.append('format', format);
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }

    const response = await api.get(`${this.baseURL}/export/?${params.toString()}`, {
      responseType: 'blob',
    });
    
    return response.data;
  }
}

export const branchService = new BranchService();
export default branchService;