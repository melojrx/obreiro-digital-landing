/**
 * Hook e Provedor de Contexto para gerenciar autenticação
 * Centraliza estado e lógica de autenticação em um único lugar.
 */

import React, { useState, useEffect, useContext, createContext, ReactNode, useCallback, useMemo } from 'react';
import { 
  authService, 
  LoginCredentials, 
  RegisterData, 
  CompleteProfileData,
  FinalizeRegistrationData,
  User, 
  AuthError,
  Church,
  Denomination,
  UserChurch
} from '../services/auth';

interface AuthContextType {
  user: User | null;
  userChurch: UserChurch | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  savePartialProfile: (data: Partial<CompleteProfileData>) => Promise<void>;
  completeProfile: (data: CompleteProfileData) => Promise<void>;
  finalizeRegistration: (data: FinalizeRegistrationData) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  getAvailableChurches: () => Promise<Church[]>;
  getAvailableDenominations: () => Promise<Denomination[]>;
  getUserChurch: () => Promise<void>;
  refreshUserData: () => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
  updatePersonalData: (data: {
    full_name?: string;
    email?: string;
    phone?: string;
    bio?: string;
    email_notifications?: boolean;
    sms_notifications?: boolean;
  }) => Promise<void>;
  updateChurchData: (data: {
    name?: string;
    cnpj?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    zipcode?: string;
  }) => Promise<void>;
  uploadAvatar: (file: File) => Promise<void>;
  deleteAccount: (password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userChurch, setUserChurch] = useState<UserChurch | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadChurchData = useCallback(async () => {
    try {
      const churchData = await authService.getUserChurch();
      setUserChurch(churchData);
      return churchData;
    } catch (err) {
      console.error('❌ Erro ao carregar dados da igreja:', err);
      setUserChurch(null);
      return null;
    }
  }, []);

  // Verificar autenticação ao carregar
  useEffect(() => {
    const loadUserData = async () => {
      console.log('🔄 AuthProvider useEffect - Verificando localStorage...');
      setIsInitializing(true);
      const token = authService.getToken();
      
      if (token && authService.isAuthenticated()) {
        console.log('✅ Token válido encontrado, buscando dados atualizados do backend...');
        
        try {
          const currentUser = await authService.getCurrentUser();
          setUser(currentUser);
          localStorage.setItem('user', JSON.stringify(currentUser));
          console.log('✅ Dados do usuário carregados do backend:', currentUser);
          
          await loadChurchData();
        } catch (error) {
          console.log('❌ Erro ao carregar dados do backend, limpando sessão');
          authService.logout();
          setUser(null);
          setUserChurch(null);
        }
      } else {
        console.log('❌ Sessão inválida no AuthProvider, limpando localStorage');
        authService.logout();
        setUser(null);
        setUserChurch(null);
      }
      
      setIsInitializing(false);
      console.log('✅ AuthProvider inicialização concluída');
    };

    loadUserData();
  }, [loadChurchData]);

  const isAuthenticated = !!user;

  const clearError = useCallback(() => setError(null), []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await authService.login(credentials);
      
      // Após login bem-sucedido, buscar dados completos do usuário
      try {
        const fullUserData = await authService.getCurrentUser();
        setUser(fullUserData);
        localStorage.setItem('user', JSON.stringify(fullUserData));
        console.log('✅ Dados completos do usuário carregados após login:', fullUserData);
        
        await loadChurchData();
      } catch (error) {
        // Se falhar ao buscar dados completos, usar dados básicos do login
        console.log('⚠️ Falha ao carregar dados completos, usando dados básicos');
        setUser(response.user);
      }
    } catch (err) {
      if (err instanceof AuthError) {
        setError(err.message);
      } else {
        setError('Erro inesperado. Tente novamente.');
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [loadChurchData]);

  const register = useCallback(async (data: RegisterData) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await authService.register(data);
      setUser(response.user);
      console.log('✅ User definido no estado GLOBAL do AuthProvider:', response.user);
    } catch (err) {
      if (err instanceof AuthError) {
        setError(err.message);
      } else {
        setError('Erro inesperado. Tente novamente.');
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const savePartialProfile = useCallback(async (data: Partial<CompleteProfileData>) => {
    try {
      setIsLoading(true);
      setError(null);
      const updatedUser = await authService.savePartialProfile(data);
      setUser(updatedUser);
      // Atualizar localStorage para persistir dados parciais
      localStorage.setItem('user', JSON.stringify(updatedUser));
    } catch (err) {
      if (err instanceof AuthError) {
        setError(err.message);
      } else {
        setError('Erro inesperado. Tente novamente.');
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const completeProfile = useCallback(async (data: CompleteProfileData) => {
    try {
      setIsLoading(true);
      setError(null);
      const updatedUser = await authService.completeProfile(data);
      // Atualizar usuário com perfil completo
      const userWithCompleteProfile = { ...updatedUser, is_profile_complete: true };
      setUser(userWithCompleteProfile);
      // Atualizar também o localStorage para persistir o estado
      localStorage.setItem('user', JSON.stringify(userWithCompleteProfile));
      
      // Tentar carregar dados da igreja se o perfil foi completado
      if (userWithCompleteProfile.is_profile_complete) {
        console.log('✅ Perfil completado, tentando carregar dados da igreja...');
        try {
          const churchData = await authService.getUserChurch();
          console.log('✅ Dados da igreja carregados após completar perfil:', churchData);
          setUserChurch(churchData);
        } catch (churchError) {
          console.log('⚠️ Não foi possível carregar dados da igreja após completar perfil:', churchError);
          // Não falhar a conclusão do perfil se não conseguir carregar a igreja
        }
      }
    } catch (err) {
      if (err instanceof AuthError) {
        setError(err.message);
      } else {
        setError('Erro inesperado. Tente novamente.');
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const finalizeRegistration = useCallback(async (data: FinalizeRegistrationData) => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await authService.finalizeRegistration(data);
      
      // Configurar usuário autenticado
      setUser(result.user);
      localStorage.setItem('user', JSON.stringify(result.user));
      localStorage.setItem('auth_token', result.token);
      
      // Carregar dados da igreja após finalizar registro
      if (result.user.is_profile_complete) {
        console.log('✅ Registro finalizado, carregando dados da igreja...');
        try {
          const churchData = await authService.getUserChurch();
          console.log('✅ Dados da igreja carregados após finalizar registro:', churchData);
          setUserChurch(churchData);
        } catch (churchError) {
          console.error('❌ Erro ao carregar dados da igreja após finalizar registro:', churchError);
          // Não falhar o registro se não conseguir carregar a igreja
        }
      }
      
    } catch (err) {
      if (err instanceof AuthError) {
        setError(err.message);
      } else {
        setError('Erro inesperado. Tente novamente.');
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    authService.logout();
    setUser(null);
    setUserChurch(null);
    setError(null);
  }, []);

  const getAvailableChurches = async (): Promise<Church[]> => {
    try {
      setError(null);
      return await authService.getAvailableChurches();
    } catch (err) {
      if (err instanceof AuthError) {
        setError(err.message);
      } else {
        setError('Erro ao carregar igrejas.');
      }
      return [];
    }
  };

  const getAvailableDenominations = useCallback(async (): Promise<Denomination[]> => {
    try {
      setError(null);
      const data = await authService.getAvailableDenominations();
      return data;
    } catch (err) {
      if (err instanceof AuthError) {
        setError(err.message);
      } else {
        setError('Erro ao carregar denominações.');
      }
      return [];
    }
  }, []);

  const getUserChurch = useCallback(async (): Promise<void> => {
    try {
      setError(null);
      const churchData = await authService.getUserChurch();
      setUserChurch(churchData);
    } catch (err) {
      if (err instanceof AuthError) {
        setError(err.message);
      } else {
        setError('Erro ao carregar dados da igreja.');
      }
    }
  }, []);

  const refreshUserData = useCallback(async (): Promise<void> => {
    try {
      console.log('🔄 Atualizando dados do usuário e igreja...');
      setError(null);
      
      // Recarregar dados do usuário
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
      localStorage.setItem('user', JSON.stringify(currentUser));
      console.log('✅ Dados do usuário atualizados');
      
      await loadChurchData();
    } catch (err) {
      console.error('❌ Erro ao atualizar dados:', err);
      if (err instanceof AuthError) {
        setError(err.message);
      } else {
        setError('Erro ao atualizar dados.');
      }
    }
  }, [loadChurchData]);

  const updateUser = useCallback(async (data: Partial<User>) => {
    try {
      setIsLoading(true);
      setError(null);
      const updatedUserData = await authService.updatePersonalData(data);
      setUser(updatedUserData);
    } catch (err) {
      if (err instanceof AuthError) {
        setError(err.message);
      } else {
        setError('Erro inesperado ao atualizar dados.');
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updatePersonalData = useCallback(async (data: {
    full_name?: string;
    email?: string;
    phone?: string;
    bio?: string;
    email_notifications?: boolean;
    sms_notifications?: boolean;
  }): Promise<void> => {
    try {
      setError(null);
      const updatedUser = await authService.updatePersonalData(data);
      setUser(updatedUser);
    } catch (err) {
      if (err instanceof AuthError) {
        setError(err.message);
      } else {
        setError('Erro ao atualizar dados pessoais.');
      }
      throw err;
    }
  }, []);

  const updateChurchData = useCallback(async (data: {
    name?: string;
    cnpj?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    zipcode?: string;
  }): Promise<void> => {
    try {
      setError(null);
      const updatedChurch = await authService.updateChurchData(data);
      setUserChurch(updatedChurch);
      
      // Forçar re-renderização se necessário
      console.log('✅ Dados da igreja atualizados no contexto:', updatedChurch);
    } catch (err) {
      if (err instanceof AuthError) {
        setError(err.message);
      } else {
        setError('Erro ao atualizar dados da igreja.');
      }
      throw err;
    }
  }, []);

  const uploadAvatar = useCallback(async (file: File): Promise<void> => {
    try {
      setError(null);
      setIsLoading(true);
      const response = await authService.uploadAvatar(file);
      
      // Atualizar o estado do usuário com a nova URL do avatar
      setUser(prevUser => {
        const updatedUser = {
          ...response.user,
          profile: {
            ...response.user.profile,
            avatar: response.avatar_url
          }
        };
        
        // Também atualizar o localStorage
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        console.log('✅ Avatar atualizado no contexto:', response.avatar_url);
        console.log('✅ Usuário atualizado:', updatedUser);
        
        return updatedUser;
      });
      
    } catch (err) {
      if (err instanceof AuthError) {
        setError(err.message);
      } else {
        setError('Erro ao fazer upload do avatar.');
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteAccount = useCallback(async (password: string): Promise<void> => {
    try {
      setError(null);
      setIsLoading(true);
      await authService.deleteAccount(password);
      
      // Limpar estado local após deletar conta
      setUser(null);
      setUserChurch(null);
      
    } catch (err) {
      if (err instanceof AuthError) {
        setError(err.message);
      } else {
        setError('Erro ao deletar conta.');
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const value = useMemo(() => ({
    user,
    userChurch,
    isAuthenticated,
    isInitializing,
    isLoading,
    error,
    login,
    register,
    savePartialProfile,
    completeProfile,
    finalizeRegistration,
    logout,
    clearError,
    getAvailableChurches,
    getAvailableDenominations,
    getUserChurch,
    refreshUserData,
    updateUser,
    updatePersonalData,
    updateChurchData,
    uploadAvatar,
    deleteAccount,
  }), [user, userChurch, isAuthenticated, isInitializing, isLoading, error, login, register, savePartialProfile, completeProfile, finalizeRegistration, logout, clearError, getAvailableChurches, getAvailableDenominations, getUserChurch, refreshUserData, updateUser, updatePersonalData, updateChurchData, uploadAvatar, deleteAccount]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}; 
