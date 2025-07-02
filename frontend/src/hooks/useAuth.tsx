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
  completeProfile: (data: CompleteProfileData) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  getAvailableChurches: () => Promise<Church[]>;
  getAvailableDenominations: () => Promise<Denomination[]>;
  getUserChurch: () => Promise<void>;
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userChurch, setUserChurch] = useState<UserChurch | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Verificar autenticação ao carregar
  useEffect(() => {
    const loadUserData = async () => {
      console.log('🔄 AuthProvider useEffect - Verificando localStorage...');
      setIsInitializing(true);
      const token = authService.getToken();
      const savedUser = authService.getCurrentUserFromStorage();
      
      if (token && savedUser && authService.isAuthenticated()) {
        console.log('✅ Restaurando sessão do localStorage no AuthProvider');
        setUser(savedUser);
        
        // Carregar dados da igreja se o perfil estiver completo
        if (savedUser.is_profile_complete) {
          try {
            const churchData = await authService.getUserChurch();
            setUserChurch(churchData);
          } catch (error) {
            console.log('❌ Erro ao carregar dados da igreja');
          }
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
  }, []);

  const isAuthenticated = !!user;

  const clearError = useCallback(() => setError(null), []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await authService.login(credentials);
      setUser(response.user);
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
    } catch (err) {
      if (err instanceof AuthError) {
        setError(err.message);
      } else {
        setError('Erro ao atualizar dados da igreja.');
      }
      throw err;
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
    completeProfile,
    logout,
    clearError,
    getAvailableChurches,
    getAvailableDenominations,
    getUserChurch,
    updatePersonalData,
    updateChurchData,
  }), [user, userChurch, isAuthenticated, isInitializing, isLoading, error, login, register, completeProfile, logout, clearError, getAvailableChurches, getAvailableDenominations, getUserChurch, updatePersonalData, updateChurchData]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}; 