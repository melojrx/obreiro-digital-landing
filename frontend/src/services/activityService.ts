import { api, API_ENDPOINTS } from '@/config/api';

// Tipos para Activities
export interface Ministry {
  id: number;
  church: number;
  church_name: string;
  name: string;
  description?: string;
  leader?: number;
  leader_name?: string;
  color: string;
  is_public: boolean;
  total_members: number;
  total_activities: number;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface PublicMinistry {
  id: number;
  name: string;
  color: string;
}

export interface Activity {
  id: number;
  church: number;
  church_name: string;
  branch: number;
  branch_name: string;
  ministry: number;
  ministry_name: string;
  name: string;
  description?: string;
  activity_type: string;
  activity_type_display: string;
  start_datetime: string;
  end_datetime: string;
  duration_hours: number;
  location?: string;
  max_participants?: number;
  participants_count: number;
  requires_registration: boolean;
  is_public: boolean;
  responsible?: number;
  responsible_name?: string;
  is_recurring: boolean;
  recurrence_pattern?: string;
  recurrence_end_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface PublicActivity {
  id: number;
  name: string;
  description?: string;
  ministry_name: string;
  ministry_color: string;
  activity_type: string;
  activity_type_display: string;
  start_datetime: string;
  end_datetime: string;
  location?: string;
  branch_name: string;
}

export interface ActivitySummary {
  id: number;
  name: string;
  ministry_name: string;
  activity_type: string;
  activity_type_display: string;
  start_datetime: string;
  participants_count: number;
  max_participants?: number;
  is_active: boolean;
}

// Types para criação/edição
export interface CreateMinistryData {
  church: number;
  name: string;
  description?: string;
  leader?: number;
  color: string;
  is_public: boolean;
}

export interface CreateActivityData {
  church: number;
  branch: number;
  ministry: number;
  name: string;
  description?: string;
  activity_type: string;
  start_datetime: string;
  end_datetime: string;
  location?: string;
  max_participants?: number;
  requires_registration: boolean;
  is_public: boolean;
  responsible?: number;
  is_recurring: boolean;
  recurrence_pattern?: string;
  recurrence_end_date?: string;
  notes?: string;
}

// Parâmetros de filtros
export interface ActivityFilters {
  church_id?: number;
  ministry_id?: number;
  branch_id?: number;
  activity_type?: string;
  start_date?: string;
  end_date?: string;
  is_public?: boolean;
  is_active?: boolean;
}

export interface PublicActivityFilters {
  church_id: number;
  ministry_id?: number;
  branch_id?: number;
  start_date?: string;
  end_date?: string;
}

// Classe do serviço
class ActivityService {
  // ========== MINISTÉRIOS ==========
  
  /**
   * Lista ministérios (requer autenticação)
   */
  async getMinistries(filters?: { church_id?: number; is_active?: boolean }): Promise<Ministry[]> {
    const params = new URLSearchParams();
    
    if (filters?.church_id) {
      params.append('church', filters.church_id.toString());
    }
    if (filters?.is_active !== undefined) {
      params.append('is_active', filters.is_active.toString());
    }
    
    const queryString = params.toString();
    const url = queryString ? `/activities/ministries/?${queryString}` : '/activities/ministries/';
    
    const response = await api.get(url);
    return response.data.results || response.data;
  }

  /**
   * Lista ministérios públicos (sem autenticação)
   */
  async getPublicMinistries(churchId: number): Promise<PublicMinistry[]> {
    const response = await api.get(`/activities/ministries/public/?church_id=${churchId}`);
    return response.data;
  }

  /**
   * Obtém um ministério específico
   */
  async getMinistry(id: number): Promise<Ministry> {
    const response = await api.get(`/activities/ministries/${id}/`);
    return response.data;
  }

  /**
   * Cria um novo ministério
   */
  async createMinistry(data: CreateMinistryData): Promise<Ministry> {
    const response = await api.post('/activities/ministries/', data);
    return response.data;
  }

  /**
   * Atualiza um ministério
   */
  async updateMinistry(id: number, data: Partial<CreateMinistryData>): Promise<Ministry> {
    const response = await api.patch(`/activities/ministries/${id}/`, data);
    return response.data;
  }

  /**
   * Remove um ministério
   */
  async deleteMinistry(id: number): Promise<void> {
    await api.delete(`/activities/ministries/${id}/`);
  }

  // ========== ATIVIDADES ==========

  /**
   * Lista atividades (requer autenticação)
   */
  async getActivities(filters?: ActivityFilters): Promise<Activity[]> {
    const params = new URLSearchParams();
    
    Object.entries(filters || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });
    
    const queryString = params.toString();
    const url = queryString ? `/activities/activities/?${queryString}` : '/activities/activities/';
    
    const response = await api.get(url);
    return response.data.results || response.data;
  }

  /**
   * Lista atividades públicas para calendário público (sem autenticação)
   */
  async getPublicActivities(filters: PublicActivityFilters): Promise<PublicActivity[]> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });
    
    const queryString = params.toString();
    const response = await api.get(`/activities/activities/public_calendar/?${queryString}`);
    return response.data;
  }

  /**
   * Lista próximas atividades
   */
  async getUpcomingActivities(): Promise<ActivitySummary[]> {
    const response = await api.get('/activities/activities/upcoming/');
    return response.data;
  }

  /**
   * Obtém uma atividade específica
   */
  async getActivity(id: number): Promise<Activity> {
    const response = await api.get(`/activities/activities/${id}/`);
    return response.data;
  }

  /**
   * Cria uma nova atividade
   */
  async createActivity(data: CreateActivityData): Promise<Activity> {
    const response = await api.post('/activities/activities/', data);
    return response.data;
  }

  /**
   * Atualiza uma atividade
   */
  async updateActivity(id: number, data: Partial<CreateActivityData>): Promise<Activity> {
    const response = await api.patch(`/activities/activities/${id}/`, data);
    return response.data;
  }

  /**
   * Remove uma atividade
   */
  async deleteActivity(id: number): Promise<void> {
    await api.delete(`/activities/activities/${id}/`);
  }

  /**
   * Registra participante em uma atividade
   */
  async registerParticipant(activityId: number, participantData?: any): Promise<any> {
    const response = await api.post(`/activities/activities/${activityId}/register_participant/`, participantData);
    return response.data;
  }

  /**
   * Lista participantes de uma atividade
   */
  async getActivityParticipants(activityId: number): Promise<any> {
    const response = await api.get(`/activities/activities/${activityId}/participants/`);
    return response.data;
  }

  // ========== ESTATÍSTICAS ==========

  /**
   * Obtém estatísticas de um ministério
   */
  async getMinistryStats(ministryId: number): Promise<any> {
    const response = await api.get(`/activities/ministries/${ministryId}/stats/`);
    return response.data;
  }

  /**
   * Obtém atividades de um ministério
   */
  async getMinistryActivities(ministryId: number): Promise<ActivitySummary[]> {
    const response = await api.get(`/activities/ministries/${ministryId}/activities/`);
    return response.data;
  }
}

// Instância singleton do serviço
export const activityService = new ActivityService();

// Constantes úteis
export const ACTIVITY_TYPES = {
  worship: 'Culto',
  prayer: 'Oração',
  study: 'Estudo Bíblico',
  cell: 'Célula',
  rehearsal: 'Ensaio',
  meeting: 'Reunião',
  event: 'Evento',
  conference: 'Conferência',
  seminar: 'Seminário',
  training: 'Treinamento',
  outreach: 'Evangelismo',
  service: 'Ação Social',
  youth: 'Jovens',
  children: 'Infantil',
  other: 'Outro',
} as const;

export type ActivityType = keyof typeof ACTIVITY_TYPES;

// Cores padrão para ministérios
export const MINISTRY_COLORS = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#06b6d4', // cyan
  '#84cc16', // lime
  '#f97316', // orange
  '#ec4899', // pink
  '#6b7280', // gray
] as const;