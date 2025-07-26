/**
 * Serviço para gerenciamento de visitantes
 * Sistema de QR Code para registro de visitantes
 */

import { api, API_ENDPOINTS, API_BASE_URL } from '../config/api';

// =====================================
// TIPOS E INTERFACES
// =====================================

export interface Visitor {
  id: number;
  uuid: string;
  church: number;
  church_name?: string;
  branch: number;
  branch_name?: string;
  full_name: string;
  email: string;
  phone: string;
  birth_date?: string;
  age?: number;
  gender?: 'M' | 'F';
  cpf?: string;
  zipcode: string;
  address: string;
  city: string;
  state: string;
  neighborhood: string;
  marital_status: 'single' | 'married' | 'divorced' | 'widowed' | 'other';
  ministry_interest?: string;
  first_visit: boolean;
  wants_prayer: boolean;
  wants_growth_group: boolean;
  observations?: string;
  qr_code_used?: string;
  registration_source: string;
  user_agent?: string;
  ip_address?: string;
  converted_to_member: boolean;
  converted_member?: number;
  converted_member_name?: string;
  conversion_date?: string;
  conversion_notes?: string;
  contact_attempts: number;
  last_contact_date?: string;
  follow_up_status: 'pending' | 'contacted' | 'interested' | 'not_interested' | 'converted';
  follow_up_status_display?: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface VisitorPublicRegistration {
  full_name: string;
  email: string;
  phone?: string;
  birth_date?: string;
  gender?: 'M' | 'F';
  cpf?: string;
  zipcode?: string;
  address?: string;
  city: string;
  state: string;
  neighborhood?: string;
  marital_status: 'single' | 'married' | 'divorced' | 'widowed' | 'other';
  ministry_interest?: string;
  first_visit: boolean;
  wants_prayer: boolean;
  wants_growth_group: boolean;
  observations?: string;
}

export interface QRCodeValidation {
  valid: boolean;
  branch?: {
    id: number;
    name: string;
    church_name: string;
    address: string;
    allows_registration: boolean;
  };
  error?: string;
}

export interface VisitorStats {
  total: number;
  last_30_days: number;
  last_7_days: number;
  pending_conversion: number;
  converted_to_members: number;
  conversion_rate: number;
  follow_up_needed: number;
  first_time_visitors: number;
}

export interface BranchVisitorStats {
  branch_id: number;
  branch_name: string;
  total_visitors: number;
  last_30_days: number;
  conversion_rate: number;
  pending_follow_up: number;
}

export interface VisitorRegistrationResponse {
  success: boolean;
  message: string;
  visitor?: {
    id: number;
    full_name: string;
    branch_name: string;
    church_name: string;
  };
  error?: string;
  details?: any;
}

export interface BulkAction {
  visitor_ids: number[];
  action: 'update_status' | 'bulk_follow_up' | 'export';
  follow_up_status?: 'pending' | 'contacted' | 'interested' | 'not_interested';
  notes?: string;
}

export interface DashboardStats {
  total_visitors: number;
  this_month: number;
  pending_follow_up: number;
  converted_to_members: number;
  conversion_rate: number;
  monthly_data: Array<{
    month: string;
    visitors: number;
  }>;
}

// =====================================
// SERVIÇOS PÚBLICOS (Sem autenticação)
// =====================================

/**
 * Valida se um QR Code é válido e retorna informações da filial
 */
export const validateQRCode = async (uuid: string): Promise<QRCodeValidation> => {
  try {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.visitors.validateQR(uuid)}`);
    const data = await response.json();
    
    if (!response.ok) {
      return {
        valid: false,
        error: data.error || 'QR Code inválido'
      };
    }
    
    return data;
  } catch (error) {
    console.error('Erro ao validar QR Code:', error);
    return {
      valid: false,
      error: 'Erro de conexão'
    };
  }
};

/**
 * Registra um visitante via QR Code (endpoint público)
 */
export const registerVisitorPublic = async (
  uuid: string, 
  visitorData: VisitorPublicRegistration
): Promise<VisitorRegistrationResponse> => {
  try {
    console.log('[DEBUG] Sending visitor data:', visitorData);
    console.log('[DEBUG] URL:', `${API_BASE_URL}${API_ENDPOINTS.visitors.registerPublic(uuid)}`);
    
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.visitors.registerPublic(uuid)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(visitorData),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        message: 'Erro ao registrar visitante',
        error: data.error || 'Erro desconhecido',
        details: data.details
      };
    }
    
    return data;
  } catch (error) {
    console.error('Erro ao registrar visitante:', error);
    return {
      success: false,
      message: 'Erro de conexão',
      error: 'Não foi possível conectar ao servidor'
    };
  }
};

// =====================================
// SERVIÇOS ADMINISTRATIVOS (Com autenticação)
// =====================================

/**
 * Lista visitantes com filtros opcionais
 */
export const getVisitors = async (params?: any): Promise<Visitor[]> => {
  const response = await api.get(API_ENDPOINTS.visitors.list, { params });
  return response.data.results || response.data;
};

/**
 * Obtém detalhes de um visitante específico
 */
export const getVisitor = async (id: number): Promise<Visitor> => {
  const response = await api.get(API_ENDPOINTS.visitors.detail(id));
  return response.data;
};

/**
 * Cria um novo visitante (via painel administrativo)
 */
export const createVisitor = async (visitorData: Partial<Visitor>): Promise<Visitor> => {
  const response = await api.post(API_ENDPOINTS.visitors.create, visitorData);
  return response.data;
};

/**
 * Atualiza dados de um visitante
 */
export const updateVisitor = async (id: number, visitorData: Partial<Visitor>): Promise<Visitor> => {
  const response = await api.patch(API_ENDPOINTS.visitors.update(id), visitorData);
  return response.data;
};

/**
 * Remove um visitante
 */
export const deleteVisitor = async (id: number): Promise<void> => {
  await api.delete(API_ENDPOINTS.visitors.delete(id));
};

/**
 * Obtém estatísticas gerais de visitantes
 */
export const getVisitorStats = async (): Promise<VisitorStats> => {
  const response = await api.get(API_ENDPOINTS.visitors.stats);
  return response.data;
};

/**
 * Obtém estatísticas de visitantes por filial
 */
export const getVisitorStatsByBranch = async (): Promise<BranchVisitorStats[]> => {
  const response = await api.get(API_ENDPOINTS.visitors.byBranch);
  return response.data;
};

/**
 * Lista visitantes que precisam de follow-up
 */
export const getPendingFollowUpVisitors = async (): Promise<Visitor[]> => {
  const response = await api.get(API_ENDPOINTS.visitors.pendingFollowUp);
  return response.data;
};

/**
 * Lista visitantes recentes
 */
export const getRecentVisitors = async (): Promise<Visitor[]> => {
  const response = await api.get(API_ENDPOINTS.visitors.recent);
  return response.data;
};

/**
 * Obtém estatísticas para o dashboard
 */
export const getDashboardStats = async (): Promise<DashboardStats> => {
  const response = await api.get(API_ENDPOINTS.visitors.dashboardStats);
  return response.data;
};

/**
 * Converte visitante em membro
 */
export const convertVisitorToMember = async (
  id: number, 
  notes?: string
): Promise<{ success: boolean; message: string; member_id?: number }> => {
  const response = await api.patch(API_ENDPOINTS.visitors.convertToMember(id), {
    conversion_notes: notes || ''
  });
  return response.data;
};

/**
 * Atualiza status de follow-up de um visitante
 */
export const updateVisitorFollowUp = async (
  id: number,
  followUpStatus: string,
  notes?: string
): Promise<Visitor> => {
  const response = await api.patch(API_ENDPOINTS.visitors.updateFollowUp(id), {
    follow_up_status: followUpStatus,
    conversion_notes: notes || ''
  });
  return response.data;
};

/**
 * Executa ações em lote com visitantes
 */
export const bulkActionVisitors = async (
  bulkData: BulkAction
): Promise<{ success: boolean; message: string }> => {
  const response = await api.post(API_ENDPOINTS.visitors.bulkAction, bulkData);
  return response.data;
};

// =====================================
// UTILITÁRIOS
// =====================================

/**
 * Formata o status de follow-up para exibição
 */
export const formatFollowUpStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    pending: 'Pendente',
    contacted: 'Contatado',
    interested: 'Interessado',
    not_interested: 'Não Interessado',
    converted: 'Convertido'
  };
  
  return statusMap[status] || status;
};

/**
 * Formata o estado civil para exibição
 */
export const formatMaritalStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    single: 'Solteiro(a)',
    married: 'Casado(a)',
    divorced: 'Divorciado(a)',
    widowed: 'Viúvo(a)',
    other: 'Outro'
  };
  
  return statusMap[status] || status;
};

/**
 * Calcula a idade baseada na data de nascimento
 */
export const calculateAge = (birthDate: string): number | null => {
  if (!birthDate) return null;
  
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
};

/**
 * Valida dados de visitante para registro público
 */
export const validateVisitorData = (data: VisitorPublicRegistration): string[] => {
  const errors: string[] = [];
  
  if (!data.full_name?.trim()) {
    errors.push('Nome completo é obrigatório');
  }
  
  if (!data.email?.trim()) {
    errors.push('E-mail é obrigatório');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('E-mail inválido');
  }
  
  if (!data.city?.trim()) {
    errors.push('Cidade é obrigatória');
  }
  
  if (!data.state?.trim()) {
    errors.push('Estado é obrigatório');
  }
  
  if (data.cpf && !/^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(data.cpf)) {
    errors.push('CPF deve estar no formato XXX.XXX.XXX-XX');
  }
  
  if (data.phone && !/^\(\d{2}\)\s\d{4,5}-\d{4}$/.test(data.phone)) {
    errors.push('Telefone deve estar no formato (XX) XXXXX-XXXX');
  }
  
  return errors;
};