import { api, API_ENDPOINTS } from '@/config/api';

// Tipos para histórico de função ministerial
export interface MinisterialFunctionHistoryItem {
  id: number;
  member: number;
  member_name: string;
  function: string; // chave (ex: 'pastor')
  start_date: string; // YYYY-MM-DD
  end_date?: string | null; // YYYY-MM-DD ou null
  is_current: boolean;
  notes?: string;
}

// Tipos para histórico de status de membresia (auditoria de mudanças)
export interface MembershipStatusLogItem {
  id: number;
  member: number;
  member_name: string;
  old_status: string;
  old_status_display: string;
  new_status: string;
  new_status_display: string;
  reason?: string;
  changed_by?: number | null;
  changed_by_name?: string;
  created_at: string; // ISO datetime
}

export interface MembershipStatusLogResponse {
  member_name: string;
  current_status: string;
  current_status_display: string;
  history: MembershipStatusLogItem[];
  total_changes: number;
}

type DRFPaginated<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export const ministerialFunctionHistoryService = {
  async listByMember(memberId: number): Promise<MinisterialFunctionHistoryItem[]> {
    // Usar querystring explícita para evitar problemas de params não logados
    const url = `${API_ENDPOINTS.ministerialFunctionHistory.list}?member=${memberId}`;
    const response = await api.get(url);
    const data = response.data as DRFPaginated<MinisterialFunctionHistoryItem> | MinisterialFunctionHistoryItem[];
    if (Array.isArray(data)) return data;
    if (data && Array.isArray((data as any).results)) return (data as DRFPaginated<MinisterialFunctionHistoryItem>).results;
    return [];
  },
};

export const membershipStatusLogService = {
  async getMemberStatusLog(memberId: number): Promise<MembershipStatusLogResponse> {
    const response = await api.get(API_ENDPOINTS.members.statusHistory(memberId));
    const data = response.data as MembershipStatusLogResponse | DRFPaginated<MembershipStatusLogResponse> | { results: MembershipStatusLogResponse };
    // Desembrulhar paginação do DRF quando presente
    if (data && (data as any).results) {
      const inner = (data as any).results as MembershipStatusLogResponse;
      return inner;
    }
    return data as MembershipStatusLogResponse;
  },
};
