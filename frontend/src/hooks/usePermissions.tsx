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
  
  // Hierarquia e Denominações  
  canViewDenominations: boolean;
  canCreateDenominations: boolean;
  canEditDenominations: boolean;
  canDeleteDenominations: boolean;
  canManageDenominations: boolean;
  canManageDenomination: boolean; // Singular para compatibilidade backend
  canViewDenominationStats: boolean;
  canManageDenominationChurches: boolean;
  
  // Igrejas
  canViewChurches: boolean;
  canCreateChurches: boolean;
  canEditChurches: boolean;
  canDeleteChurches: boolean;
  canManageChurches: boolean;
  canViewChurchStats: boolean;
  
  // Hierarquia geral
  canViewHierarchy: boolean;
  canManageHierarchy: boolean;
  canNavigateHierarchy: boolean;
  
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
// IMPORTANTE: SUPER_ADMIN é APENAS para desenvolvedores da plataforma!
const ROLE_PERMISSIONS = {
  // SUPER_ADMIN: Removido - apenas para desenvolvedores via comando Django
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
    // Permissões hierárquicas
    canViewDenominations: true,
    canCreateDenominations: true,
    canEditDenominations: true,
    canDeleteDenominations: true,
    canManageDenominations: true,
    canManageDenomination: true, // Permissão específica backend
    canViewDenominationStats: true,
    canManageDenominationChurches: true,
    canViewChurches: true,
    canCreateChurches: true,
    canEditChurches: true,
    canDeleteChurches: true,
    canManageChurches: true,
    canViewChurchStats: true,
    canViewHierarchy: true,
    canManageHierarchy: true,
    canNavigateHierarchy: true,
    // Outras permissões
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
    // Permissões hierárquicas - Admin de igreja tem acesso limitado
    canViewDenominations: true,
    canCreateDenominations: false,
    canEditDenominations: false,
    canDeleteDenominations: false,
    canManageDenominations: false,
    canManageDenomination: false, // Singular para compatibilidade backend
    canViewDenominationStats: true,
    canManageDenominationChurches: false,
    canViewChurches: true,
    canCreateChurches: false, // Só denominação cria igrejas
    canEditChurches: true, // Pode editar sua própria igreja
    canDeleteChurches: false,
    canManageChurches: false,
    canViewChurchStats: true,
    canViewHierarchy: true,
    canManageHierarchy: false,
    canNavigateHierarchy: true,
    // Outras permissões
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
    // Permissões hierárquicas - Pastor tem acesso limitado apenas de visualização
    canViewDenominations: true,
    canCreateDenominations: false,
    canEditDenominations: false,
    canDeleteDenominations: false,
    canManageDenominations: false,
    canManageDenomination: false, // Singular para compatibilidade backend
    canViewDenominationStats: true,
    canManageDenominationChurches: false,
    canViewChurches: true,
    canCreateChurches: false,
    canEditChurches: false,
    canDeleteChurches: false,
    canManageChurches: false,
    canViewChurchStats: true,
    canViewHierarchy: true,
    canManageHierarchy: false,
    canNavigateHierarchy: true,
    // Outras permissões
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
    // Permissões hierárquicas - Secretário tem acesso limitado de visualização
    canViewDenominations: true,
    canCreateDenominations: false,
    canEditDenominations: false,
    canDeleteDenominations: false,
    canManageDenominations: false,
    canManageDenomination: false, // Singular para compatibilidade backend
    canViewDenominationStats: true,
    canManageDenominationChurches: false,
    canViewChurches: true,
    canCreateChurches: false,
    canEditChurches: false,
    canDeleteChurches: false,
    canManageChurches: false,
    canViewChurchStats: true,
    canViewHierarchy: true,
    canManageHierarchy: false,
    canNavigateHierarchy: true,
    // Outras permissões
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
    // Permissões hierárquicas - Líder tem acesso muito limitado
    canViewDenominations: false,
    canCreateDenominations: false,
    canEditDenominations: false,
    canDeleteDenominations: false,
    canManageDenominations: false,
    canManageDenomination: false, // Singular para compatibilidade backend
    canViewDenominationStats: false,
    canManageDenominationChurches: false,
    canViewChurches: false,
    canCreateChurches: false,
    canEditChurches: false,
    canDeleteChurches: false,
    canManageChurches: false,
    canViewChurchStats: false,
    canViewHierarchy: false,
    canManageHierarchy: false,
    canNavigateHierarchy: false,
    // Outras permissões
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
    // Permissões hierárquicas - Membro não tem acesso hierárquico
    canViewDenominations: false,
    canCreateDenominations: false,
    canEditDenominations: false,
    canDeleteDenominations: false,
    canManageDenominations: false,
    canManageDenomination: false, // Singular para compatibilidade backend
    canViewDenominationStats: false,
    canManageDenominationChurches: false,
    canViewChurches: false,
    canCreateChurches: false,
    canEditChurches: false,
    canDeleteChurches: false,
    canManageChurches: false,
    canViewChurchStats: false,
    canViewHierarchy: false,
    canManageHierarchy: false,
    canNavigateHierarchy: false,
    // Outras permissões
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
  // Permissões hierárquicas
  canViewDenominations: false,
  canCreateDenominations: false,
  canEditDenominations: false,
  canDeleteDenominations: false,
  canManageDenominations: false,
  canManageDenomination: false, // Singular para compatibilidade backend
  canViewDenominationStats: false,
  canManageDenominationChurches: false,
  canViewChurches: false,
  canCreateChurches: false,
  canEditChurches: false,
  canDeleteChurches: false,
  canManageChurches: false,
  canViewChurchStats: false,
  canViewHierarchy: false,
  canManageHierarchy: false,
  canNavigateHierarchy: false,
  // Outras permissões
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

    // Lógica baseada no email do usuário para desenvolvimento e produção
    // Em produção será baseada nos dados reais do backend
    
    // Verificar se é admin de denominação
    if (user.email?.includes('denominacao.admin')) {
      return ROLE_PERMISSIONS.DENOMINATION_ADMIN;
    }
    
    // Verificar se é admin geral
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