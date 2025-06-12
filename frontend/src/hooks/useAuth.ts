/**
 * Hook customizado para gerenciar autenticação
 * Centraliza estado e lógica de autenticação
 */

import { useState, useEffect } from 'react';
import { 
  authService, 
  LoginCredentials, 
  RegisterData, 
  CompleteProfileData,
  User, 
  AuthError,
  Church
} from '../services/auth';

interface UseAuthReturn {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  completeProfile: (data: CompleteProfileData) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  getAvailableChurches: () => Promise<Church[]>;
}

export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Verificar autenticação ao carregar
  useEffect(() => {
    const token = authService.getToken();
    const savedUser = authService.getCurrentUserFromStorage();
    
    if (token && savedUser) {
      setUser(savedUser);
    }
  }, []);

  const isAuthenticated = !!user && authService.isAuthenticated();

  const clearError = () => setError(null);

  const login = async (credentials: LoginCredentials) => {
    try {
      console.log('🔐 Iniciando login com credentials:', { email: credentials.email });
      setIsLoading(true);
      setError(null);
      
      const response = await authService.login(credentials);
      console.log('✅ Login bem-sucedido:', response);
      setUser(response.user);
    } catch (err) {
      console.error('❌ Erro no login:', err);
      if (err instanceof AuthError) {
        setError(err.message);
      } else {
        setError('Erro inesperado. Tente novamente.');
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await authService.register(data);
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
  };

  const completeProfile = async (data: CompleteProfileData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const updatedUser = await authService.completeProfile(data);
      setUser(updatedUser);
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
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setError(null);
  };

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

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    completeProfile,
    logout,
    clearError,
    getAvailableChurches,
  };
}; 