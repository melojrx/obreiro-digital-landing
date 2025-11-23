import { api, API_ENDPOINTS } from '@/config/api';
import { BulkImportResult } from '@/types/import';

// Novos tipos para MembershipStatus
export interface MembershipStatus {
  id: number;
  member: number;
  branch?: number | null;
  member_name: string;
  status: string;
  status_display: string;
  effective_date: string;
  end_date?: string;
  reason?: string;
  changed_by?: number;
  changed_by_name?: string;
  is_current: boolean;
  migrated_from_member: boolean;
  created_at: string;
  updated_at: string;
  // Campos de compatibilidade
  termination_date?: string;
  observation?: string;
  is_active: boolean;
}

// Definição constante das funções ministeriais (sincronizada com backend)
export const MINISTERIAL_FUNCTION_CHOICES = {
  member: 'Membro',
  deacon: 'Diácono',
  deaconess: 'Diaconisa',
  elder: 'Presbítero',
  evangelist: 'Evangelista',
  pastor: 'Pastor',
  missionary: 'Missionário',
  leader: 'Líder',
  cooperator: 'Cooperador',
  auxiliary: 'Auxiliar',
} as const;

// Choices para status de membresia
export const MEMBERSHIP_STATUS_CHOICES = {
  active: 'Ativo',
  inactive: 'Inativo',
  transferred: 'Transferido',
  disciplined: 'Disciplinado',
  deceased: 'Falecido',
} as const;

export interface MinisterialFunctionChoices {
  MEMBER: 'member';
  DEACON: 'deacon';
  DEACONESS: 'deaconess';
  ELDER: 'elder';
  EVANGELIST: 'evangelist';
  PASTOR: 'pastor';
  MISSIONARY: 'missionary';
  LEADER: 'leader';
  COOPERATOR: 'cooperator';
  AUXILIARY: 'auxiliary';
}



// Tipos para Membros
export interface Member {
  id: number;
  church: number;
  church_name: string;
  branch?: number | null;
  branch_name?: string;
  user?: number;  // ID do usuário vinculado (opcional)
  // Acesso ao sistema (campos derivados do backend)
  has_system_access?: boolean;
  system_user_email?: string | null;
  system_user_role?: string | null;
  system_user_role_label?: string | null;
  full_name: string;
  cpf?: string;
  rg?: string;
  birth_date: string;
  age: number;
  gender: 'M' | 'F' | 'N';
  marital_status: 'single' | 'married' | 'divorced' | 'widowed' | 'other';
  email?: string;
  phone?: string;
  phone_secondary?: string;
  address?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipcode?: string;
  full_address: string;
  membership_date: string;
  membership_years: number;
  baptism_date?: string;
  previous_church?: string;
  transfer_letter: boolean;
  
  // Campos ministeriais
  membership_status: string;
  ministerial_function: string;
  
  // Novos campos da estrutura MembershipStatus
  membership_statuses: MembershipStatus[];
  current_status?: string;
  current_status_display?: string;
  profession?: string;
  education_level?: string;
  photo?: string;
  notes?: string;
  accept_sms: boolean;
  accept_email: boolean;
  accept_whatsapp: boolean;
  
  // Campos do cônjuge
  spouse?: number | null;
  spouse_name?: string | null;
  
  // Dados familiares
  children_count?: number;
  
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface MemberSummary {
  id: number;
  full_name: string;
  email?: string;
  phone?: string;
  age: number;
  church_name: string;
  branch_name?: string;
  membership_date: string;
  is_active: boolean;
}

export interface MemberDashboard {
  total_members: number;
  active_members: number;
  inactive_members: number;
  new_members_month: number;
  growth_rate: number;
  status_distribution: Array<{
    status: string;
    count: number;
  }>;
  gender_distribution: Array<{
    gender: string;
    count: number;
  }>;
  age_distribution: {
    children: number;
    youth: number;
    adults: number;
    elderly: number;
  };
}

export interface MemberStatistics {
  ministerial_distribution: Array<{
      count: number;
  }>;
  marital_distribution: Array<{
    marital_status: string;
    count: number;
  }>;
  baptism_stats: {
    baptized: number;
    not_baptized: number;
  };
  monthly_growth: Array<{
    month: string;
    count: number;
  }>;
}

export interface CreateMembershipStatusData {
  member: number;
  status: string;
  effective_date?: string;
  end_date?: string;
  // Novos campos compatíveis com o backend
  ordination_start_date?: string;
  ordination_end_date?: string;
  branch?: number;
  reason?: string;
  // Campos de compatibilidade
  termination_date?: string;
  observation?: string;
}

export interface CreateMemberData {
  church: number;
  // Associar congregação na criação (se ausente, backend tenta usar congregação ativa do usuário)
  branch?: number;
  full_name: string;
  cpf?: string;
  rg?: string;
  birth_date: string;
  gender: 'M' | 'F' | 'N';
  marital_status?: string;
  email?: string;
  phone?: string;
  phone_secondary?: string;
  address?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipcode?: string;
  baptism_date?: string;
  previous_church?: string;
  transfer_letter?: boolean;
  
  // Campos ministeriais restaurados
  membership_status?: string;
  ministerial_function?: string;
  
  profession?: string;
  education_level?: string;
  photo?: File;
  notes?: string;
  accept_sms?: boolean;
  accept_email?: boolean;
  accept_whatsapp?: boolean;
  
  // Campos do cônjuge
  spouse?: number;
  
  // Dados familiares
  children_count?: number;
  
  // Campos de papel do sistema
  create_system_user?: boolean;
  system_role?: string;
  user_email?: string;
  revoke_system_access?: boolean;
  user_password?: string;
  
  // Novo campo para status ministerial inicial
  initial_ministerial_status?: string;
  initial_status_reason?: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next?: string;
  previous?: string;
  results: T[];
}

// Serviço de Membros
export const membersService = {
  // Listar membros
  async getMembers(params?: {
    page?: number;
    search?: string;
    church?: number;
    is_active?: boolean;
    gender?: string;
    marital_status?: string;
      ordering?: string;
  }): Promise<PaginatedResponse<MemberSummary>> {
    const response = await api.get(API_ENDPOINTS.members.list, { params });
    return response.data;
  },

  // Obter dashboard
  async getDashboard(): Promise<MemberDashboard> {
    const response = await api.get(API_ENDPOINTS.members.dashboard);
    return response.data;
  },

  // Obter estatísticas
  async getStatistics(): Promise<MemberStatistics> {
    const response = await api.get(API_ENDPOINTS.members.statistics);
    return response.data;
  },

  // Obter membro por ID
  async getMember(id: number): Promise<Member> {
    const response = await api.get(API_ENDPOINTS.members.detail(id));
    return response.data;
  },

  // Obter perfil completo do membro
  async getMemberProfile(id: number): Promise<Member & { family_members: Member[]; ministries_list: string[] }> {
    const response = await api.get(API_ENDPOINTS.members.profile(id));
    return response.data;
  },

  // Criar membro
  async createMember(data: CreateMemberData): Promise<Member> {
    console.log('🔍 membersService.createMember - Dados recebidos:', data);
    
    // Se há foto, usar FormData
    if (data.photo && data.photo instanceof File) {
      console.log('📷 Enviando com FormData (foto presente)');
      const formData = new FormData();
      
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (key === 'photo' && value instanceof File) {
            formData.append(key, value);
          } else {
            formData.append(key, String(value));
          }
        }
      });

      const response = await api.post(API_ENDPOINTS.members.create, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } else {
      console.log('📄 Enviando com JSON (sem foto)');
      // Se não há foto, usar JSON
      const { photo, ...jsonData } = data; // Remove photo do objeto
      
      // Limpar apenas valores undefined/null, mantendo strings vazias
      const cleanData = Object.fromEntries(
        Object.entries(jsonData).filter(([_, value]) => value !== undefined && value !== null)
      );

      console.log('📤 Dados limpos enviados:', cleanData);

      const response = await api.post(API_ENDPOINTS.members.create, cleanData, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    }
  },

  // Atualizar membro
  async updateMember(id: number, data: Partial<CreateMemberData>): Promise<Member> {
    console.log('🔍 updateMember - ID:', id);
    console.log('🔍 updateMember - Dados recebidos:', data);
    
    // Se há foto, usar FormData
    if (data.photo && data.photo instanceof File) {
      const formData = new FormData();
      
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (key === 'photo' && value instanceof File) {
            formData.append(key, value);
          } else {
            formData.append(key, String(value));
          }
        }
      });

      console.log('📤 updateMember - Enviando FormData');

      const response = await api.patch(API_ENDPOINTS.members.update(id), formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } else {
      // Se não há foto, usar JSON
      const { photo, ...jsonData } = data; // Remove photo do objeto
      
      // Limpar apenas valores undefined/null, mantendo strings vazias
      const cleanData = Object.fromEntries(
        Object.entries(jsonData).filter(([_, value]) => value !== undefined && value !== null)
      );

      console.log('📤 updateMember - Dados limpos para envio:', cleanData);
      console.log('📤 updateMember - Campos específicos:', {
        number: cleanData.number,
        complement: cleanData.complement,
        address: cleanData.address,
        zipcode: cleanData.zipcode
      });

      const response = await api.patch(API_ENDPOINTS.members.update(id), cleanData, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log('✅ updateMember - Resposta do servidor:', response.data);
      return response.data;
    }
  },

  // Atualizar status do membro
  async updateMemberStatus(id: number, status: string, reason?: string): Promise<{ message: string; new_status: string }> {
    const response = await api.patch(API_ENDPOINTS.members.updateStatus(id), {
      status,
      reason,
    });
    return response.data;
  },

  // Deletar membro
  async deleteMember(id: number): Promise<void> {
    await api.delete(API_ENDPOINTS.members.delete(id));
  },

  // Exportar membros
  async exportMembers(): Promise<{ members: Member[]; total: number; exported_at: string }> {
    const response = await api.get(API_ENDPOINTS.members.export);
    return response.data;
  },

  // Exportar membros em formato CSV
  async exportMembersCSV(filters?: {
    search?: string;
    status?: string;
    ministerial_function?: string;
  }): Promise<Blob> {
    const response = await api.get(API_ENDPOINTS.members.exportCsv, {
      params: filters,
      responseType: 'blob',
    });
    return response.data;
  },

  // Buscar membros disponíveis para vinculação de cônjuge
  async getAvailableForSpouse(params?: {
    exclude_member_id?: number;
    search?: string;
  }): Promise<{ count: number; results: Array<{
    id: number;
    full_name: string;
    cpf?: string;
    birth_date: string;
    age: number;
    gender: string;
    membership_date: string;
  }> }> {
    const response = await api.get(API_ENDPOINTS.members.availableForSpouse, { params });
    return response.data;
  },

  // Obter opções de funções ministeriais
  getMinisterialFunctionChoices() {
    return MINISTERIAL_FUNCTION_CHOICES;
  },
  
  // Obter opções de status de membresia
  getMembershipStatusChoices() {
    return MEMBERSHIP_STATUS_CHOICES;
  },

  async bulkUpload(params: { file: File; branchId?: number; skipDuplicates?: boolean }): Promise<BulkImportResult> {
    const formData = new FormData();
    formData.append('file', params.file);
    if (params.branchId) {
      formData.append('branch_id', String(params.branchId));
    }
    formData.append('skip_duplicates', String(params.skipDuplicates ?? true));

    const response = await api.post(API_ENDPOINTS.members.bulkUpload, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Converter Church Admin em Membro (simplificado)
  async convertAdminToMember(data: {
    ministerial_function: string;
    marital_status: string;
    phone?: string;
    cpf?: string;
    birth_date?: string;
    gender?: string;
  }): Promise<{ message: string; member: Member }> {
    const payload = Object.fromEntries(
      Object.entries(data).filter(([, value]) => value !== undefined && value !== null && value !== '')
    );
    const response = await api.post(
      `${API_ENDPOINTS.members.list}convert-admin-to-member/`, 
      payload
    );
    return response.data;
  },

  // Verificar status de membresia do usuário atual (sem filtrar por congregação)
  async getMyMembershipStatus(): Promise<{
    church_id: number;
    is_member: boolean;
    member_id?: number | null;
    branch?: { id: number; name: string } | null;
    active_branch?: { id: number; name: string } | null;
    can_transfer: boolean;
    target_branch_id?: number | null;
  }> {
    const response = await api.get(API_ENDPOINTS.members.me.status);
    return response.data;
  },

  // Transferir lotação do membro do usuário atual para outra congregação
  async transferMyMembership(branchId: number): Promise<{ message: string; member: Member }> {
    const response = await api.post(API_ENDPOINTS.members.me.transferBranch, {
      branch_id: branchId,
    });
    return response.data;
  },

  // Transferência assistida de um membro (admin/secretário) para outra congregação da mesma igreja
  async transferBranch(memberId: number, branchId: number, reason?: string): Promise<{ message: string; member: Member }> {
    const response = await api.post(API_ENDPOINTS.members.transferBranch(memberId), {
      branch_id: branchId,
      reason: reason || '',
    });
    return response.data;
  },
};

// Serviço para MembershipStatus
export const membershipStatusService = {
  // Listar status de membresia
  async getStatuses(params?: {
    member?: number;
    status?: string;
    is_current?: boolean;
    page?: number;
  }): Promise<PaginatedResponse<MembershipStatus>> {
    const response = await api.get(API_ENDPOINTS.membershipStatus.list, { params });
    return response.data;
  },

  // Obter histórico de um membro específico
  async getMemberHistory(memberId: number): Promise<MembershipStatus[]> {
    const response = await api.get(API_ENDPOINTS.membershipStatus.memberHistory(memberId));
    return response.data;
  },

  // Obter status atual de um membro
  async getCurrentStatus(memberId: number): Promise<MembershipStatus | null> {
    const response = await api.get(API_ENDPOINTS.membershipStatus.currentStatus(memberId));
    return response.data;
  },

  // Criar novo status
  async createStatus(data: CreateMembershipStatusData): Promise<MembershipStatus> {
    console.log('🔍 membershipStatusService.createStatus - Dados enviados:', data);
    const payload = { ...data } as any;
    // Compat: se vier termination_date, mapear para end_date se end_date ausente
    if (payload.termination_date && !payload.end_date) payload.end_date = payload.termination_date;
    const response = await api.post(API_ENDPOINTS.membershipStatus.create, payload);
    return response.data;
  },

  // Atualizar status existente
  async updateStatus(id: number, data: Partial<CreateMembershipStatusData>): Promise<MembershipStatus> {
    const payload = { ...data } as any;
    if (payload.termination_date && !payload.end_date) payload.end_date = payload.termination_date;
    const response = await api.patch(API_ENDPOINTS.membershipStatus.update(id), payload);
    return response.data;
  },

  // Finalizar status atual e criar novo
  async changeStatus(memberId: number, newStatus: string, reason?: string): Promise<MembershipStatus> {
    console.log('🔍 membershipStatusService.changeStatus:', { memberId, newStatus, reason });
    const response = await api.post(API_ENDPOINTS.membershipStatus.changeStatus(memberId), {
      status: newStatus,
      reason: reason || ''
    });
    return response.data;
  },

  // Deletar status
  async deleteStatus(id: number): Promise<void> {
    await api.delete(API_ENDPOINTS.membershipStatus.delete(id));
  },
}; 
