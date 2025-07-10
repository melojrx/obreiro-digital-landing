import { useMemo } from 'react';
import { useAuth } from './useAuth';

export interface UserPermissions {
  // Membros
  canViewMembers: boolean;
  canCreateMembers: boolean;
  canEditMembers: boolean;
  canDeleteMembers: boolean;
  canManageMembers: boolean;
  
  // Visitantes
  canViewVisitors: boolean;
  canCreateVisitors: boolean;
  canEditVisitors: boolean;
  canDeleteVisitors: boolean;
  canManageVisitors: boolean;
  
  // Atividades
  canViewActivities: boolean;
  canCreateActivities: boolean;
  canEditActivities: boolean;
  canDeleteActivities: boolean;
  canManageActivities: boolean;
  
  // Filiais
  canViewBranches: boolean;
  canCreateBranches: boolean;
  canEditBranches: boolean;
  canDeleteBranches: boolean;
  canManageBranches: boolean;
  
  // Relatórios
  canViewReports: boolean;
  canViewDashboard: boolean;
  
  // Administração
  canManageChurch: boolean;
  canManageUsers: boolean;
  canManageSettings: boolean;
  
  // Sistema
  isAdmin: boolean;
  isChurchAdmin: boolean;
  isPastor: boolean;
  isSecretary: boolean;
  isLeader: boolean;
  isMember: boolean;
}

// Mapeamento de papéis para permissões (baseado no sistema do backend)
const ROLE_PERMISSIONS = {
  SUPER_ADMIN: {
    canViewMembers: true,
    canCreateMembers: true,
    canEditMembers: true,
    canDeleteMembers: true,
    canManageMembers: true,
    canViewVisitors: true,
    canCreateVisitors: true,
    canEditVisitors: true,
    canDeleteVisitors: true,
    canManageVisitors: true,
    canViewActivities: true,
    canCreateActivities: true,
    canEditActivities: true,
    canDeleteActivities: true,
    canManageActivities: true,
    canViewBranches: true,
    canCreateBranches: true,
    canEditBranches: true,
    canDeleteBranches: true,
    canManageBranches: true,
    canViewReports: true,
    canViewDashboard: true,
    canManageChurch: true,
    canManageUsers: true,
    canManageSettings: true,
    isAdmin: true,
    isChurchAdmin: true,
    isPastor: false,
    isSecretary: false,
    isLeader: false,
    isMember: false,
  },
  
  DENOMINATION_ADMIN: {
    canViewMembers: true,
    canCreateMembers: true,
    canEditMembers: true,
    canDeleteMembers: true,
    canManageMembers: true,
    canViewVisitors: true,
    canCreateVisitors: true,
    canEditVisitors: true,
    canDeleteVisitors: true,
    canManageVisitors: true,
    canViewActivities: true,
    canCreateActivities: true,
    canEditActivities: true,
    canDeleteActivities: true,
    canManageActivities: true,
    canViewBranches: true,
    canCreateBranches: true,
    canEditBranches: true,
    canDeleteBranches: true,
    canManageBranches: true,
    canViewReports: true,
    canViewDashboard: true,
    canManageChurch: true,
    canManageUsers: true,
    canManageSettings: true,
    isAdmin: true,
    isChurchAdmin: true,
    isPastor: false,
    isSecretary: false,
    isLeader: false,
    isMember: false,
  },
  
  CHURCH_ADMIN: {
    canViewMembers: true,
    canCreateMembers: true,
    canEditMembers: true,
    canDeleteMembers: true,
    canManageMembers: true,
    canViewVisitors: true,
    canCreateVisitors: true,
    canEditVisitors: true,
    canDeleteVisitors: true,
    canManageVisitors: true,
    canViewActivities: true,
    canCreateActivities: true,
    canEditActivities: true,
    canDeleteActivities: true,
    canManageActivities: true,
    canViewBranches: true,
    canCreateBranches: true,
    canEditBranches: true,
    canDeleteBranches: true,
    canManageBranches: true,
    canViewReports: true,
    canViewDashboard: true,
    canManageChurch: true,
    canManageUsers: true,
    canManageSettings: true,
    isAdmin: false,
    isChurchAdmin: true,
    isPastor: false,
    isSecretary: false,
    isLeader: false,
    isMember: false,
  },
  
  PASTOR: {
    canViewMembers: true,
    canCreateMembers: true,
    canEditMembers: true,
    canDeleteMembers: false,
    canManageMembers: true,
    canViewVisitors: true,
    canCreateVisitors: true,
    canEditVisitors: true,
    canDeleteVisitors: false,
    canManageVisitors: true,
    canViewActivities: true,
    canCreateActivities: true,
    canEditActivities: true,
    canDeleteActivities: true,
    canManageActivities: true,
    canViewBranches: true,
    canCreateBranches: false,
    canEditBranches: false,
    canDeleteBranches: false,
    canManageBranches: false,
    canViewReports: true,
    canViewDashboard: true,
    canManageChurch: false,
    canManageUsers: false,
    canManageSettings: false,
    isAdmin: false,
    isChurchAdmin: false,
    isPastor: true,
    isSecretary: false,
    isLeader: false,
    isMember: false,
  },
  
  SECRETARY: {
    canViewMembers: true,
    canCreateMembers: true,
    canEditMembers: true,
    canDeleteMembers: false,
    canManageMembers: true,
    canViewVisitors: true,
    canCreateVisitors: true,
    canEditVisitors: true,
    canDeleteVisitors: false,
    canManageVisitors: true,
    canViewActivities: true,
    canCreateActivities: false,
    canEditActivities: false,
    canDeleteActivities: false,
    canManageActivities: false,
    canViewBranches: true,
    canCreateBranches: false,
    canEditBranches: false,
    canDeleteBranches: false,
    canManageBranches: false,
    canViewReports: true,
    canViewDashboard: true,
    canManageChurch: false,
    canManageUsers: false,
    canManageSettings: false,
    isAdmin: false,
    isChurchAdmin: false,
    isPastor: false,
    isSecretary: true,
    isLeader: false,
    isMember: false,
  },
  
  LEADER: {
    canViewMembers: true,
    canCreateMembers: false,
    canEditMembers: false,
    canDeleteMembers: false,
    canManageMembers: false,
    canViewVisitors: true,
    canCreateVisitors: true,
    canEditVisitors: true,
    canDeleteVisitors: false,
    canManageVisitors: true,
    canViewActivities: true,
    canCreateActivities: true,
    canEditActivities: true,
    canDeleteActivities: false,
    canManageActivities: true,
    canViewBranches: true,
    canCreateBranches: false,
    canEditBranches: false,
    canDeleteBranches: false,
    canManageBranches: false,
    canViewReports: false,
    canViewDashboard: false,
    canManageChurch: false,
    canManageUsers: false,
    canManageSettings: false,
    isAdmin: false,
    isChurchAdmin: false,
    isPastor: false,
    isSecretary: false,
    isLeader: true,
    isMember: false,
  },
  
  MEMBER: {
    canViewMembers: true,
    canCreateMembers: false,
    canEditMembers: false,
    canDeleteMembers: false,
    canManageMembers: false,
    canViewVisitors: false,
    canCreateVisitors: false,
    canEditVisitors: false,
    canDeleteVisitors: false,
    canManageVisitors: false,
    canViewActivities: true,
    canCreateActivities: false,
    canEditActivities: false,
    canDeleteActivities: false,
    canManageActivities: false,
    canViewBranches: true,
    canCreateBranches: false,
    canEditBranches: false,
    canDeleteBranches: false,
    canManageBranches: false,
    canViewReports: false,
    canViewDashboard: false,
    canManageChurch: false,
    canManageUsers: false,
    canManageSettings: false,
    isAdmin: false,
    isChurchAdmin: false,
    isPastor: false,
    isSecretary: false,
    isLeader: false,
    isMember: true,
  },
} as const;

// Permissões padrão para usuários não autenticados ou sem papel definido
const DEFAULT_PERMISSIONS: UserPermissions = {
  canViewMembers: false,
  canCreateMembers: false,
  canEditMembers: false,
  canDeleteMembers: false,
  canManageMembers: false,
  canViewVisitors: false,
  canCreateVisitors: false,
  canEditVisitors: false,
  canDeleteVisitors: false,
  canManageVisitors: false,
  canViewActivities: false,
  canCreateActivities: false,
  canEditActivities: false,
  canDeleteActivities: false,
  canManageActivities: false,
  canViewBranches: false,
  canCreateBranches: false,
  canEditBranches: false,
  canDeleteBranches: false,
  canManageBranches: false,
  canViewReports: false,
  canViewDashboard: false,
  canManageChurch: false,
  canManageUsers: false,
  canManageSettings: false,
  isAdmin: false,
  isChurchAdmin: false,
  isPastor: false,
  isSecretary: false,
  isLeader: false,
  isMember: false,
};

export const usePermissions = (): UserPermissions => {
  const { user, userChurch } = useAuth();

  const permissions = useMemo((): UserPermissions => {
    // Se não há usuário autenticado, retornar permissões padrão
    if (!user || !user.is_active) {
      return DEFAULT_PERMISSIONS;
    }

    // Temporariamente, para desenvolvimento, dar permissões de CHURCH_ADMIN para todos
    // TODO: Implementar lógica real baseada no userChurch e papéis do usuário
    if (process.env.NODE_ENV === 'development') {
      return ROLE_PERMISSIONS.CHURCH_ADMIN;
    }

    // Lógica real de permissões (será implementada quando tivermos dados completos do usuário)
    // Por enquanto, verificar se é admin baseado em características básicas
    const isAdmin = user.email?.includes('admin') || false;
    
    if (isAdmin) {
      return ROLE_PERMISSIONS.CHURCH_ADMIN;
    }

    // Para membros comuns
    return ROLE_PERMISSIONS.MEMBER;
  }, [user, userChurch]);

  return permissions;
};

// Hook auxiliar para verificar permissões específicas
export const useHasPermission = (permission: keyof UserPermissions): boolean => {
  const permissions = usePermissions();
  return permissions[permission];
};

// Hook auxiliar para verificar múltiplas permissões
export const useHasAnyPermission = (permissionsList: (keyof UserPermissions)[]): boolean => {
  const permissions = usePermissions();
  return permissionsList.some(permission => permissions[permission]);
};

// Hook auxiliar para verificar se tem todas as permissões
export const useHasAllPermissions = (permissionsList: (keyof UserPermissions)[]): boolean => {
  const permissions = usePermissions();
  return permissionsList.every(permission => permissions[permission]);
}; 