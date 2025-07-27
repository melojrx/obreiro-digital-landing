import { api, API_ENDPOINTS } from '@/config/api';
import { AxiosError } from 'axios';

// =====================================
// TIPOS TYPESCRIPT
// =====================================

export interface Branch {
  id: number;
  church: number;
  church_name: string;
  name: string;
  short_name?: string;
  description?: string;
  address: string;
  neighborhood: string;
  city: string;
  state: string;
  zipcode: string;
  phone?: string;
  email?: string;
  latitude?: number | null;
  longitude?: number | null;
  pastor?: number | null;
  full_address: string;
  
  // Campos de QR Code
  qr_code_uuid: string;
  qr_code_image?: string;
  qr_code_active: boolean;
  qr_code_url?: string;
  visitor_registration_url: string;
  allows_visitor_registration: boolean;
  requires_visitor_approval: boolean;
  total_visitors_registered: number;
  
  // Estatísticas
  total_visitors: number;
  total_activities: number;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface BranchQRCode {
  id: number;
  name: string;
  church_name: string;
  qr_code_uuid: string;
  qr_code_image?: string;
  qr_code_active: boolean;
  qr_code_url?: string;
  visitor_registration_url: string;
  allows_visitor_registration: boolean;
  total_visitors_registered: number;
}

export interface BranchVisitorStats {
  branch_id: number;
  branch_name: string;
  stats: {
    total: number;
    last_30_days: number;
    last_7_days: number;
    converted_to_members: number;
    conversion_rate: number;
  };
}

// =====================================
// CLASSE DE ERRO
// =====================================

export class BranchServiceError extends Error {
  constructor(
    message: string,
    public status?: number,
    public errors?: Record<string, string[]>
  ) {
    super(message);
    this.name = 'BranchServiceError';
  }
}

// =====================================
// HELPERS
// =====================================

function handleApiError(error: unknown): BranchServiceError {
  const axiosError = error as AxiosError<{
    error?: string;
    detail?: string;
    [key: string]: any;
  }>;

  if (axiosError.response) {
    const data = axiosError.response.data;
    let message = 'Erro desconhecido';
    
    if (data?.error) {
      message = data.error;
    } else if (data?.detail) {
      message = data.detail;
    } else if (typeof data === 'string') {
      message = data;
    }
    
    return new BranchServiceError(
      message,
      axiosError.response.status,
      data as Record<string, string[]>
    );
  }
  
  return new BranchServiceError('Erro de conexão com o servidor');
}

// =====================================
// SERVIÇO PRINCIPAL
// =====================================

export const branchService = {
  /**
   * Listar todas as filiais
   */
  async getBranches(): Promise<Branch[]> {
    try {
      const response = await api.get(API_ENDPOINTS.branches.list);
      return response.data.results || response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
  
  /**
   * Buscar filial específica
   */
  async getBranch(id: number): Promise<Branch> {
    try {
      const response = await api.get(API_ENDPOINTS.branches.detail(id));
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
  
  /**
   * Criar nova filial
   */
  async createBranch(data: Partial<Branch>): Promise<Branch> {
    try {
      const response = await api.post(API_ENDPOINTS.branches.create, data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
  
  /**
   * Atualizar filial
   */
  async updateBranch(id: number, data: Partial<Branch>): Promise<Branch> {
    try {
      const response = await api.patch(API_ENDPOINTS.branches.update(id), data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
  
  /**
   * Excluir filial
   */
  async deleteBranch(id: number): Promise<void> {
    try {
      await api.delete(API_ENDPOINTS.branches.delete(id));
    } catch (error) {
      throw handleApiError(error);
    }
  },
  
  // ====================================
  // QR CODE ESPECÍFICOS
  // ====================================
  
  /**
   * Listar filiais com informações de QR Code
   */
  async getBranchesQRCodes(): Promise<BranchQRCode[]> {
    try {
      const response = await api.get(API_ENDPOINTS.branches.qrCodes);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
  
  /**
   * Regenerar QR Code de uma filial
   */
  async regenerateQRCode(branchId: number): Promise<{ message: string; data: BranchQRCode }> {
    try {
      const response = await api.post(API_ENDPOINTS.branches.regenerateQRCode(branchId));
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
  
  /**
   * Ativar/Desativar QR Code
   */
  async toggleQRCode(branchId: number): Promise<{ message: string; data: BranchQRCode }> {
    try {
      const response = await api.post(API_ENDPOINTS.branches.toggleQRCode(branchId));
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
  
  /**
   * Buscar estatísticas de visitantes da filial
   */
  async getVisitorStats(branchId: number): Promise<BranchVisitorStats> {
    try {
      const response = await api.get(API_ENDPOINTS.branches.visitorStats(branchId));
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }
};