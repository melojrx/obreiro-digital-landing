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
  canViewHierarchyMenu: boolean; // Nova permissão para exibir menu hierárquico
  
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
  // CHURCH_ADMIN: Administrador principal do SaaS (usuário pagante)
  // Escolhe UMA denominação e pode criar múltiplas igrejas dentro dela
  // Tem controle total sobre todas as igrejas, filiais, membros e atividades
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
    // Permissões hierárquicas - Church Admin é o papel PRINCIPAL
    canViewDenominations: true,
    canCreateDenominations: false, // Não cria denominações (escolhe uma existente)
    canEditDenominations: false,
    canDeleteDenominations: false,
    canManageDenominations: false,
    canManageDenomination: true, // Pode gerenciar SUA denominação escolhida
    canViewDenominationStats: true,
    canManageDenominationChurches: true, // Gerencia igrejas da sua denominação
    canViewChurches: true,
    canCreateChurches: true, // PODE criar múltiplas igrejas na denominação
    canEditChurches: true,
    canDeleteChurches: true,
    canManageChurches: true, // Gerencia todas as suas igrejas
    canViewChurchStats: true,
    canViewHierarchy: true,
    canManageHierarchy: true,
    canNavigateHierarchy: true,
    canViewHierarchyMenu: true, // Vê menu hierárquico completo
    // Outras permissões
    canViewReports: true,
    canViewDashboard: true,
    canManageChurch: true,
    canManageUsers: true,
    canManageSettings: true,
    isAdmin: true, // É o admin principal do sistema
    isChurchAdmin: true,
    isPastor: false,
    isSecretary: false,
    isLeader: false,
    isMember: false,
  },
  
  // BRANCH_MANAGER: Gerente de filiais específicas
  // Designado por Church Admin para gerenciar uma ou mais filiais
  BRANCH_MANAGER: {
    canViewMembers: true,
    canCreateMembers: true,
    canEditMembers: true,
    canDeleteMembers: false, // Não pode deletar
    canManageMembers: true,
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
    canCreateBranches: false, // Não cria novas filiais
    canEditBranches: true, // Pode editar suas filiais designadas
    canDeleteBranches: false,
    canManageBranches: false, // Gestão limitada
    // Permissões hierárquicas limitadas
    canViewDenominations: true,
    canCreateDenominations: false,
    canEditDenominations: false,
    canDeleteDenominations: false,
    canManageDenominations: false,
    canManageDenomination: false,
    canViewDenominationStats: false,
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
    canViewHierarchyMenu: true,
    // Outras permissões
    canViewReports: true,
    canViewDashboard: true,
    canManageChurch: false,
    canManageUsers: false,
    canManageSettings: false,
    isAdmin: false,
    isChurchAdmin: false,
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
    canViewHierarchyMenu: true,
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
    canViewHierarchyMenu: true,
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
    canManageDenomination: false,
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
    canViewHierarchyMenu: false,
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
    canViewHierarchyMenu: false,
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
  canViewHierarchyMenu: false,
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

    // Usar dados reais do backend via userChurch
    // IMPORTANTE: userChurch.user_role contém o código do papel (CHURCH_ADMIN, PASTOR, etc.)
    // enquanto userChurch.role contém o label legível (Admin de Igreja, Pastor, etc.)
    if (userChurch && userChurch.user_role) {
      const role = userChurch.user_role.toUpperCase();
      
      // Debug temporário
      console.log('🔍 usePermissions - userChurch.user_role:', userChurch.user_role);
      console.log('🔍 usePermissions - role (uppercase):', role);
      console.log('🔍 usePermissions - userChurch full object:', userChurch);
      
      // Mapear roles do backend para permissões do frontend
      switch (role) {
        case 'CHURCH_ADMIN':
          console.log('✅ usePermissions - Matched CHURCH_ADMIN (papel principal)');
          return ROLE_PERMISSIONS.CHURCH_ADMIN;
        case 'BRANCH_MANAGER':
          console.log('✅ usePermissions - Matched BRANCH_MANAGER');
          return ROLE_PERMISSIONS.BRANCH_MANAGER;
        case 'PASTOR':
          console.log('✅ usePermissions - Matched PASTOR');
          return ROLE_PERMISSIONS.PASTOR;
        case 'SECRETARY':
          console.log('✅ usePermissions - Matched SECRETARY');
          return ROLE_PERMISSIONS.SECRETARY;
        case 'LEADER':
          console.log('✅ usePermissions - Matched LEADER');
          return ROLE_PERMISSIONS.LEADER;
        case 'MEMBER':
          console.log('✅ usePermissions - Matched MEMBER');
          return ROLE_PERMISSIONS.MEMBER;
        default:
          console.log('⚠️ usePermissions - No match found, defaulting to MEMBER. Role was:', role);
          return ROLE_PERMISSIONS.MEMBER; // Default para member
      }
    }
    
    // Fallback: Lógica baseada no email para desenvolvimento/casos especiais
    // Verificar se é admin de igreja
    if (user.email?.includes('igreja.admin') || user.email?.includes('church.admin') || user.email?.includes('admin')) {
      console.log('🔍 usePermissions - Email contém admin, usando CHURCH_ADMIN');
      return ROLE_PERMISSIONS.CHURCH_ADMIN;
    }
    
    // Verificar se é gerente de filial
    if (user.email?.includes('filial.admin') || user.email?.includes('branch.manager')) {
      console.log('🔍 usePermissions - Email contém filial/branch, usando BRANCH_MANAGER');
      return ROLE_PERMISSIONS.BRANCH_MANAGER;
    }
    
    // Verificar se é pastor
    if (user.email?.includes('pastor')) {
      console.log('🔍 usePermissions - Email contém pastor, usando PASTOR');
      return ROLE_PERMISSIONS.PASTOR;
    }
    
    // Verificar se é secretário
    if (user.email?.includes('secretario') || user.email?.includes('secretary')) {
      console.log('🔍 usePermissions - Email contém secretario/secretary, usando SECRETARY');
      return ROLE_PERMISSIONS.SECRETARY;
    }
    
    // Verificar se é líder
    if (user.email?.includes('lider') || user.email?.includes('leader')) {
      console.log('🔍 usePermissions - Email contém lider/leader, usando LEADER');
      return ROLE_PERMISSIONS.LEADER;
    }

    // Para membros comuns (fallback final)
    console.log('🔍 usePermissions - Nenhuma correspondência, usando MEMBER');
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