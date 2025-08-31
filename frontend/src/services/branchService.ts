import { api } from '@/config/api';

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

class BranchService {
  private baseURL = '/branches';

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
   * Cria uma nova filial
   */
  async createBranch(data: CreateBranchRequest): Promise<any> {
    const response = await api.post(`${this.baseURL}/`, data);
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
}

export const branchService = new BranchService();
export default branchService;