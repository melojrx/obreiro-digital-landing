/**
 * Tipos TypeScript para o Módulo de Gestão de Igrejas e Filiais
 * Extensão dos tipos existentes para suporte hierárquico
 */

// Base types para hierarquia
export interface BaseHierarchyEntity {
  id: number;
  uuid: string;
  name: string;
  short_name?: string;
  description?: string;
  email: string;
  phone: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Tipos estendidos para denominação
export interface DenominationDetails extends BaseHierarchyEntity {
  administrator_id?: number;
  administrator?: {
    id: number;
    full_name: string;
    email: string;
  };
  website?: string;
  headquarters_address?: string;
  headquarters_city?: string;
  headquarters_state?: string;
  headquarters_zipcode?: string;
  cnpj?: string;
  logo?: string;
  total_churches: number;
  total_members: number;
  allows_independent_churches?: boolean;
  max_churches?: number;
  features_enabled?: Record<string, boolean>;
}

// Tipos estendidos para igreja
export interface ChurchDetails extends BaseHierarchyEntity {
  denomination_id?: number;
  denomination?: {
    id: number;
    name: string;
    short_name?: string;
  };
  website?: string;
  address: string;
  city: string;
  state: string;
  zipcode: string;
  cnpj?: string;
  main_pastor_id?: number;
  main_pastor?: {
    id: number;
    full_name: string;
    email: string;
  };
  logo?: string;
  cover_image?: string;
  subscription_plan: string;
  subscription_status: string;
  subscription_start_date?: string;
  subscription_end_date?: string;
  trial_end_date?: string;
  max_members: number;
  max_branches: number;
  total_members: number;
  total_visitors: number;
  branches_count?: number;
}

// Tipos para filiais
export interface BranchDetails extends BaseHierarchyEntity {
  church_id: number;
  church?: {
    id: number;
    name: string;
    short_name?: string;
  };
  address: string;
  neighborhood?: string;
  city: string;
  state: string;
  zipcode: string;
  latitude?: number;
  longitude?: number;
  pastor_id?: number;
  pastor?: {
    id: number;
    full_name: string;
    email: string;
  };
  qr_code_uuid?: string;
  qr_code_image?: string;
  qr_code_active: boolean;
  allows_visitor_registration: boolean;
  requires_visitor_approval: boolean;
  total_visitors_registered: number;
  total_visitors: number;
  total_activities: number;
  branch_type?: 'main' | 'congregation' | 'mission' | 'cell';
  service_times?: ServiceTime[];
}

export interface ServiceTime {
  day_of_week: number; // 0-6 (domingo a sábado)
  start_time: string; // HH:MM format
  end_time: string; // HH:MM format
  service_type: string; // culto, reunião, célula, etc.
}

// Tipos para usuários administrativos
export interface AdminUser {
  id: number;
  full_name: string;
  email: string;
  phone?: string;
  role: string;
  role_label: string;
  can_access_admin: boolean;
  can_manage_members: boolean;
  can_manage_visitors: boolean;
  can_manage_activities: boolean;
  can_view_reports: boolean;
  can_manage_branches: boolean;
  can_manage_denomination?: boolean;
  can_create_churches?: boolean;
  can_manage_church_admins?: boolean;
  can_view_financial_reports?: boolean;
  joined_at: string;
  is_active: boolean;
}

// Tipos para estatísticas
export interface DenominationStats {
  total_churches: number;
  total_branches: number;
  total_members: number;
  total_visitors: number;
  total_activities: number;
  active_churches: number;
  churches_growth_rate?: number;
  members_growth_rate?: number;
  visitors_conversion_rate?: number;
  geographical_distribution?: GeographicalData[];
  monthly_trends?: MonthlyTrend[];
}

export interface ChurchStats {
  total_branches: number;
  total_members: number;
  total_visitors: number;
  total_activities: number;
  active_branches: number;
  branches_growth_rate?: number;
  members_growth_rate?: number;
  visitors_conversion_rate?: number;
  branch_statistics?: BranchSummary[];
  monthly_trends?: MonthlyTrend[];
}

export interface BranchStats {
  total_members: number;
  total_visitors: number;
  total_activities: number;
  visitors_this_month: number;
  activities_this_month: number;
  qr_code_scans: number;
  conversion_rate?: number;
  monthly_trends?: MonthlyTrend[];
}

export interface GeographicalData {
  state: string;
  city: string;
  churches_count: number;
  branches_count: number;
  members_count: number;
}

export interface MonthlyTrend {
  month: string; // YYYY-MM format
  churches?: number;
  branches?: number;
  members: number;
  visitors: number;
  activities: number;
}

export interface BranchSummary {
  id: number;
  name: string;
  city: string;
  state: string;
  total_members: number;
  total_visitors: number;
  total_activities: number;
  qr_code_active: boolean;
  pastor_name?: string;
}

// Tipos para formulários
export interface CreateChurchFormData {
  name: string;
  short_name?: string;
  description?: string;
  email: string;
  phone: string;
  website?: string;
  address: string;
  city: string;
  state: string;
  zipcode: string;
  cnpj?: string;
  main_pastor?: number; // ID do usuário que será o administrador principal
  max_members?: number;
  max_branches?: number;
  subscription_plan?: string;
  // Novos campos para delegação e status
  is_active?: boolean;
  responsible_member_id?: number; // ID do membro que será responsável
  set_as_active_church?: boolean; // Se deve definir como igreja ativa do usuário atual
}

export interface CreateBranchFormData {
  name: string;
  short_name?: string;
  description?: string;
  email: string;
  phone: string;
  address: string;
  neighborhood?: string;
  city: string;
  state: string;
  zipcode: string;
  pastor_name?: string;
  pastor_email?: string;
  pastor_phone?: string;
  branch_type?: string;
  allows_visitor_registration?: boolean;
  requires_visitor_approval?: boolean;
  service_times?: ServiceTime[];
}

export interface AssignAdminFormData {
  user_id: number;
  role: string;
  can_access_admin?: boolean;
  can_manage_members?: boolean;
  can_manage_visitors?: boolean;
  can_manage_activities?: boolean;
  can_view_reports?: boolean;
  can_manage_branches?: boolean;
  can_manage_denomination?: boolean;
  can_create_churches?: boolean;
  can_manage_church_admins?: boolean;
  can_view_financial_reports?: boolean;
  managed_branches?: number[];
}

// Tipos para navegação hierárquica
export interface HierarchyLevel {
  type: 'denomination' | 'church' | 'branch';
  id: number;
  name: string;
  can_manage: boolean;
}

export interface HierarchyPath {
  levels: HierarchyLevel[];
  current_level: HierarchyLevel;
  can_go_up: boolean;
  can_go_down: boolean;
}

// Tipos para filtros e pesquisa
export interface ChurchFilters {
  search?: string;
  state?: string;
  city?: string;
  subscription_plan?: string;
  subscription_status?: string;
  is_active?: boolean;
  has_branches?: boolean;
  order_by?: 'name' | 'created_at' | 'total_members' | 'total_branches';
  order_direction?: 'asc' | 'desc';
}

export interface BranchFilters {
  search?: string;
  city?: string;
  state?: string;
  branch_type?: string;
  has_pastor?: boolean;
  qr_code_active?: boolean;
  is_active?: boolean;
  order_by?: 'name' | 'created_at' | 'total_members' | 'total_visitors';
  order_direction?: 'asc' | 'desc';
}

// Tipos para paginação
export interface PaginatedResponse<T> {
  count: number;
  next?: string;
  previous?: string;
  results: T[];
}

// Tipos para relatórios consolidados
export interface ConsolidatedReport {
  period_start: string;
  period_end: string;
  denomination_data?: DenominationStats;
  church_data?: ChurchStats;
  branch_data?: BranchStats;
  comparative_data?: {
    previous_period: DenominationStats | ChurchStats | BranchStats;
    growth_rates: Record<string, number>;
  };
}

// Tipos para ações em batch
export interface BatchActionRequest {
  action: 'activate' | 'deactivate' | 'delete' | 'assign_admin' | 'update_permissions';
  entity_ids: number[];
  additional_data?: Record<string, any>;
}

export interface BatchActionResponse {
  success_count: number;
  error_count: number;
  errors?: Array<{
    entity_id: number;
    message: string;
  }>;
}

// Tipos para permissões específicas do módulo
export interface HierarchyPermissions {
  // Denominação
  canViewDenominationDashboard: boolean;
  canManageDenomination: boolean;
  canCreateChurches: boolean;
  canManageChurchAdmins: boolean;
  canViewDenominationReports: boolean;
  
  // Igreja
  canViewChurchDashboard: boolean;
  canManageChurch: boolean;
  canCreateBranches: boolean;
  canManageBranchManagers: boolean;
  canViewChurchReports: boolean;
  
  // Filiais
  canViewBranchDashboard: boolean;
  canManageBranch: boolean;
  canRegenerateQRCode: boolean;
  canViewBranchReports: boolean;
  
  // Consolidado
  canViewConsolidatedReports: boolean;
  canExportData: boolean;
  canManageHierarchy: boolean;
}

// Tipos para notificações hierárquicas
export interface HierarchyNotification {
  id: number;
  type: 'church_created' | 'branch_created' | 'admin_assigned' | 'stats_milestone' | 'subscription_alert';
  level: 'denomination' | 'church' | 'branch';
  entity_id: number;
  entity_name: string;
  message: string;
  is_read: boolean;
  created_at: string;
  priority: 'low' | 'medium' | 'high';
}

// Tipo para contexto hierárquico global
export interface HierarchyContext {
  current_denomination?: DenominationDetails;
  current_church?: ChurchDetails;
  current_branch?: BranchDetails;
  hierarchy_path: HierarchyPath;
  user_permissions: HierarchyPermissions;
  available_churches: ChurchDetails[];
  available_branches: BranchDetails[];
}