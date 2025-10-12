/**
 * Utilitário para traduzir roles do sistema para português
 * Mantém consistência na exibição de papéis em toda a aplicação
 */

export const translateRole = (role: string | undefined): string => {
  if (!role) return 'Usuário';
  
  const roleTranslations: Record<string, string> = {
    // Formato snake_case (backend)
    'church_admin': 'Administrador da Igreja',
    'super_admin': 'Super Administrador',
    'pastor': 'Pastor',
    'secretary': 'Secretário(a)',
    'leader': 'Líder',
    'member': 'Membro',
    'read_only': 'Somente Leitura',
    
    // Formato UPPER_CASE (alternativo)
    'CHURCH_ADMIN': 'Administrador da Igreja',
    'SUPER_ADMIN': 'Super Administrador',
    'PASTOR': 'Pastor',
    'SECRETARY': 'Secretário(a)',
    'LEADER': 'Líder',
    'MEMBER': 'Membro',
    'READ_ONLY': 'Somente Leitura',
  };
  
  return roleTranslations[role] || role;
};

/**
 * Traduz o status de membresia para português
 */
export const translateMembershipStatus = (status: string | undefined): string => {
  if (!status) return 'Desconhecido';
  
  const statusTranslations: Record<string, string> = {
    'active': 'Ativo',
    'inactive': 'Inativo',
    'transferred': 'Transferido',
    'disciplined': 'Disciplinado',
    'deceased': 'Falecido',
    
    'ACTIVE': 'Ativo',
    'INACTIVE': 'Inativo',
    'TRANSFERRED': 'Transferido',
    'DISCIPLINED': 'Disciplinado',
    'DECEASED': 'Falecido',
  };
  
  return statusTranslations[status] || status;
};

/**
 * Traduz função ministerial para português
 */
export const translateMinisterialFunction = (func: string | undefined): string => {
  if (!func) return 'Não informado';
  
  const functionTranslations: Record<string, string> = {
    'member': 'Membro',
    'deacon': 'Diácono',
    'deaconess': 'Diaconisa',
    'elder': 'Presbítero',
    'evangelist': 'Evangelista',
    'pastor': 'Pastor',
    'missionary': 'Missionário',
    'leader': 'Líder',
    'cooperator': 'Cooperador',
    'auxiliary': 'Auxiliar',
    
    'MEMBER': 'Membro',
    'DEACON': 'Diácono',
    'DEACONESS': 'Diaconisa',
    'ELDER': 'Presbítero',
    'EVANGELIST': 'Evangelista',
    'PASTOR': 'Pastor',
    'MISSIONARY': 'Missionário',
    'LEADER': 'Líder',
    'COOPERATOR': 'Cooperador',
    'AUXILIARY': 'Auxiliar',
  };
  
  return functionTranslations[func] || func;
};

/**
 * Traduz gênero para português
 */
export const translateGender = (gender: string | undefined): string => {
  if (!gender) return 'Não informado';
  
  const genderTranslations: Record<string, string> = {
    'M': 'Masculino',
    'F': 'Feminino',
    'O': 'Outro',
    'N': 'Não informar',
  };
  
  return genderTranslations[gender] || gender;
};
