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

class BranchService {
  private baseURL = '/branches';

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