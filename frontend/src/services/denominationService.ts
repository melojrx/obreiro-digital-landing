/**
 * Serviço para APIs de Gestão Hierárquica - Denominações
 * Integra-se com o sistema de autenticação existente
 */

import { api } from '@/config/api';
import { AxiosError } from 'axios';
import {
  DenominationDetails,
  ChurchDetails,
  BranchDetails,
  DenominationStats,
  ChurchStats,
  BranchStats,
  AdminUser,
  CreateChurchFormData,
  CreateBranchFormData,
  AssignAdminFormData,
  ChurchFilters,
  BranchFilters,
  PaginatedResponse,
  ConsolidatedReport,
  BatchActionRequest,
  BatchActionResponse,
  HierarchyNotification,
} from '@/types/hierarchy';

// Classe de erro para o módulo hierárquico
export class HierarchyError extends Error {
  status: number;
  errors?: Record<string, string[]>;

  constructor(message: string, status: number, errors?: Record<string, string[]>) {
    super(message);
    this.name = 'HierarchyError';
    this.status = status;
    this.errors = errors;
  }
}

// Helper para tratar erros da API
function handleApiError(error: unknown): HierarchyError {
  const axiosError = error as AxiosError<Record<string, string[] | string>>;

  if (axiosError.response) {
    const data = axiosError.response.data;
    let errorMessage = 'Ocorreu um erro na operação.';

    if (data) {
      if (typeof data.detail === 'string') {
        errorMessage = data.detail;
      } else if (typeof data.message === 'string') {
        errorMessage = data.message;
      } else {
        const firstErrorKey = Object.keys(data)[0];
        if (firstErrorKey && Array.isArray(data[firstErrorKey]) && data[firstErrorKey].length > 0) {
          errorMessage = data[firstErrorKey][0];
        }
      }
    }
    
    return new HierarchyError(errorMessage, axiosError.response.status, data as Record<string, string[]>);
  } else if (axiosError.request) {
    return new HierarchyError('Sem resposta do servidor. Verifique sua conexão.', 0);
  } else {
    const genericError = error as Error;
    return new HierarchyError(genericError.message || 'Erro desconhecido', 0);
  }
}

// ===== SERVIÇOS DE DENOMINAÇÃO =====

export const denominationService = {
  /**
   * Lista denominações que o usuário pode gerenciar
   */
  async getDenominations(): Promise<DenominationDetails[]> {
    try {
      const response = await api.get('/denominations/');
      return response.data.results || response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Obtém detalhes de uma denominação específica
   */
  async getDenominationDetails(denominationId: number): Promise<DenominationDetails> {
    try {
      const response = await api.get(`/denominations/${denominationId}/`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Atualiza dados de uma denominação
   */
  async updateDenomination(denominationId: number, data: Partial<DenominationDetails>): Promise<DenominationDetails> {
    try {
      const response = await api.patch(`/denominations/${denominationId}/`, data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Dashboard consolidado da denominação
   */
  async getDenominationDashboard(denominationId: number): Promise<DenominationStats> {
    try {
      const response = await api.get(`/denominations/${denominationId}/dashboard/`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Lista igrejas de uma denominação
   */
  async getDenominationChurches(
    denominationId: number, 
    filters?: ChurchFilters,
    page = 1,
    page_size = 20
  ): Promise<PaginatedResponse<ChurchDetails>> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: page_size.toString(),
        ...filters,
      });

      const response = await api.get(`/denominations/${denominationId}/churches/?${params}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Cria nova igreja vinculada à denominação
   */
  async createChurch(denominationId: number, churchData: CreateChurchFormData): Promise<ChurchDetails> {
    try {
      const response = await api.post(`/denominations/${denominationId}/churches/`, churchData);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
};

// ===== SERVIÇOS DE IGREJA =====

export const churchService = {
  /**
   * Lista igrejas que o usuário pode gerenciar
   */
  async getManagedChurches(): Promise<ChurchDetails[]> {
    try {
      const response = await api.get('/churches/my-managed-churches/');
      return response.data.results || response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Obtém detalhes de uma igreja específica
   */
  async getChurchDetails(churchId: number): Promise<ChurchDetails> {
    try {
      const response = await api.get(`/churches/${churchId}/`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Atualiza dados de uma igreja
   */
  async updateChurch(churchId: number, data: Partial<ChurchDetails>): Promise<ChurchDetails> {
    try {
      const response = await api.patch(`/churches/${churchId}/`, data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Dashboard da igreja
   */
  async getChurchDashboard(churchId: number): Promise<ChurchStats> {
    try {
      const response = await api.get(`/churches/${churchId}/dashboard/`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Lista filiais de uma igreja
   */
  async getChurchBranches(
    churchId: number, 
    filters?: BranchFilters,
    page = 1,
    page_size = 20
  ): Promise<PaginatedResponse<BranchDetails>> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: page_size.toString(),
        ...filters,
      });

      const response = await api.get(`/churches/${churchId}/branches/?${params}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Cria nova filial
   */
  async createBranch(churchId: number, branchData: CreateBranchFormData): Promise<BranchDetails> {
    try {
      const response = await api.post(`/churches/${churchId}/branches/`, branchData);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Designar administrador para igreja
   */
  async assignChurchAdmin(churchId: number, adminData: AssignAdminFormData): Promise<AdminUser> {
    try {
      const response = await api.post(`/churches/${churchId}/assign-admin/`, adminData);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Lista usuários da igreja
   */
  async getChurchUsers(churchId: number): Promise<AdminUser[]> {
    try {
      const response = await api.get(`/churches/${churchId}/users/`);
      return response.data.results || response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
};

// ===== SERVIÇOS DE FILIAIS =====

export const branchService = {
  /**
   * Lista filiais que o usuário pode gerenciar
   */
  async getManagedBranches(): Promise<BranchDetails[]> {
    try {
      const response = await api.get('/branches/my-managed-branches/');
      return response.data.results || response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Obtém detalhes de uma filial específica
   */
  async getBranchDetails(branchId: number): Promise<BranchDetails> {
    try {
      const response = await api.get(`/branches/${branchId}/`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Atualiza dados de uma filial
   */
  async updateBranch(branchId: number, data: Partial<BranchDetails>): Promise<BranchDetails> {
    try {
      const response = await api.patch(`/branches/${branchId}/`, data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Dashboard da filial
   */
  async getBranchDashboard(branchId: number): Promise<BranchStats> {
    try {
      const response = await api.get(`/branches/${branchId}/dashboard/`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Regenerar QR code da filial
   */
  async regenerateQRCode(branchId: number): Promise<{ qr_code_uuid: string; qr_code_image: string }> {
    try {
      const response = await api.post(`/branches/${branchId}/regenerate-qr/`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Designar gestor para filial
   */
  async assignBranchManager(branchId: number, managerData: AssignAdminFormData): Promise<AdminUser> {
    try {
      const response = await api.post(`/branches/${branchId}/assign-manager/`, managerData);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
};

// ===== SERVIÇOS DE ADMINISTRAÇÃO DE USUÁRIOS =====

export const hierarchyUserService = {
  /**
   * Promover usuário a administrador
   */
  async promoteToAdmin(data: AssignAdminFormData): Promise<AdminUser> {
    try {
      const response = await api.post('/users/promote-to-admin/', data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Designar usuário para gerenciar filial
   */
  async assignToBranch(data: {
    user_id: number;
    branch_id: number;
    permissions: Partial<AssignAdminFormData>;
  }): Promise<AdminUser> {
    try {
      const response = await api.post('/users/assign-to-branch/', data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Atualizar permissões de usuário
   */
  async updateUserPermissions(
    userId: number, 
    churchId: number, 
    permissions: Partial<AssignAdminFormData>
  ): Promise<AdminUser> {
    try {
      const response = await api.patch(`/users/${userId}/church-permissions/${churchId}/`, permissions);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Buscar usuários disponíveis para promoção
   */
  async searchUsers(query: string, churchId?: number): Promise<AdminUser[]> {
    try {
      const params = new URLSearchParams({ search: query });
      if (churchId) params.append('church_id', churchId.toString());

      const response = await api.get(`/users/search/?${params}`);
      return response.data.results || response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
};

// ===== SERVIÇOS DE RELATÓRIOS =====

export const hierarchyReportService = {
  /**
   * Relatório consolidado da denominação
   */
  async getDenominationConsolidatedReport(
    denominationId: number,
    period?: string,
    metrics?: string[]
  ): Promise<ConsolidatedReport> {
    try {
      const params = new URLSearchParams();
      if (period) params.append('period', period);
      if (metrics) params.append('metrics', metrics.join(','));

      const response = await api.get(`/reports/denomination/${denominationId}/consolidated/?${params}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Resumo de filiais da igreja
   */
  async getChurchBranchesSummary(
    churchId: number,
    period?: string
  ): Promise<ConsolidatedReport> {
    try {
      const params = new URLSearchParams();
      if (period) params.append('period', period);

      const response = await api.get(`/reports/church/${churchId}/branches-summary/?${params}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Exportar dados para Excel/PDF
   */
  async exportData(
    type: 'denomination' | 'church' | 'branch',
    entityId: number,
    format: 'xlsx' | 'pdf',
    reportType: 'dashboard' | 'consolidated' | 'branches-summary'
  ): Promise<Blob> {
    try {
      const response = await api.get(
        `/reports/${type}/${entityId}/export/${reportType}/?format=${format}`,
        { responseType: 'blob' }
      );
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
};

// ===== SERVIÇOS DE NOTIFICAÇÕES =====

export const hierarchyNotificationService = {
  /**
   * Listar notificações hierárquicas
   */
  async getHierarchyNotifications(
    level?: 'denomination' | 'church' | 'branch',
    entityId?: number,
    unreadOnly = false
  ): Promise<HierarchyNotification[]> {
    try {
      const params = new URLSearchParams();
      if (level) params.append('level', level);
      if (entityId) params.append('entity_id', entityId.toString());
      if (unreadOnly) params.append('unread_only', 'true');

      const response = await api.get(`/notifications/hierarchy/?${params}`);
      return response.data.results || response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Marcar notificação como lida
   */
  async markNotificationAsRead(notificationId: number): Promise<void> {
    try {
      await api.patch(`/notifications/${notificationId}/mark-read/`);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Marcar todas as notificações como lidas
   */
  async markAllNotificationsAsRead(level?: string, entityId?: number): Promise<void> {
    try {
      const params = new URLSearchParams();
      if (level) params.append('level', level);
      if (entityId) params.append('entity_id', entityId.toString());

      await api.post(`/notifications/mark-all-read/?${params}`);
    } catch (error) {
      throw handleApiError(error);
    }
  },
};

// ===== SERVIÇOS DE AÇÕES EM BATCH =====

export const hierarchyBatchService = {
  /**
   * Executar ação em batch em igrejas
   */
  async batchActionChurches(request: BatchActionRequest): Promise<BatchActionResponse> {
    try {
      const response = await api.post('/churches/batch-action/', request);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Executar ação em batch em filiais
   */
  async batchActionBranches(request: BatchActionRequest): Promise<BatchActionResponse> {
    try {
      const response = await api.post('/branches/batch-action/', request);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Executar ação em batch em usuários
   */
  async batchActionUsers(request: BatchActionRequest): Promise<BatchActionResponse> {
    try {
      const response = await api.post('/users/batch-action/', request);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
};

// Exportação consolidada dos serviços
export const hierarchyServices = {
  denomination: denominationService,
  church: churchService,
  branch: branchService,
  user: hierarchyUserService,
  report: hierarchyReportService,
  notification: hierarchyNotificationService,
  batch: hierarchyBatchService,
};