/**
 * Serviço de Autenticação
 * Gerencia login, registro e autenticação com a API Django
 */

import { api, API_ENDPOINTS } from '@/config/api';
import { AxiosError } from 'axios';

// Tipos TypeScript
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  full_name: string;
  phone: string;
  birth_date: string;
  gender: string;
  password: string;
  password_confirm: string;
  accept_terms: boolean;
}

export interface CompleteProfileData {
  denomination_id?: number;
  church_name: string;
  church_cnpj?: string;
  church_email: string;
  church_phone: string;
  branch_name?: string;
  church_address: string;
  pastor_name: string;
  cpf?: string;
  bio?: string;
  role?: string;
  email_notifications?: boolean;
  sms_notifications?: boolean;
}

export interface User {
  id: number;
  email: string;
  full_name: string;
  first_name: string;
  last_name: string;
  phone?: string;
  profile?: {
    bio?: string;
    birth_date?: string;
    gender?: string;
    avatar?: string;
  };
  is_active: boolean;
  date_joined: string;
  is_profile_complete: boolean;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Church {
  id: number;
  name: string;
  denomination?: string;
  city?: string;
  state?: string;
}

export interface UserChurch {
  id: number;
  name: string;
  short_name: string;
  cnpj: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipcode: string;
  subscription_plan: string;
  role: string;
  role_label: string;
  user_role: string; // backward compatibility
}

export interface Denomination {
  id: number;
  name: string;
  short_name?: string;
  display_name: string;
  headquarters_city?: string;
  headquarters_state?: string;
  churches_count: number;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
  status: number;
}

// Classe de erro customizada
export class AuthError extends Error {
  status: number;
  errors?: Record<string, string[]>;

  constructor(message: string, status: number, errors?: Record<string, string[]>) {
    super(message);
    this.name = 'AuthError';
    this.status = status;
    this.errors = errors;
  }
}

// Helper para tratar erros do Axios
function handleApiError(error: unknown): AuthError {
  const axiosError = error as AxiosError<Record<string, string[] | string>>;

  if (axiosError.response) {
    const data = axiosError.response.data;
    let errorMessage = 'Ocorreu um erro.';

    if (data) {
      if (typeof data.detail === 'string') {
        errorMessage = data.detail;
      } else {
        const firstErrorKey = Object.keys(data)[0];
        if (firstErrorKey && Array.isArray(data[firstErrorKey]) && data[firstErrorKey].length > 0) {
          errorMessage = data[firstErrorKey][0];
        }
      }
    }
    
    return new AuthError(errorMessage, axiosError.response.status, data as Record<string, string[]>);
  } else if (axiosError.request) {
    return new AuthError('Sem resposta do servidor. Verifique sua conexão.', 0);
  } else {
    const genericError = error as Error;
    return new AuthError(genericError.message || 'Erro desconhecido', 0);
  }
}

// Serviços de autenticação refatorados
export const authService = {
  /**
   * Fazer login do usuário
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await api.post<AuthResponse>(API_ENDPOINTS.auth.login, credentials);
      if (response.data.token) {
        localStorage.setItem('auth_token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        this.updateActivity();
      }
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Registrar novo usuário (Etapa 1)
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      const response = await api.post<AuthResponse>('/users/register/', data);
      if (response.data.token) {
        localStorage.setItem('auth_token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Salvar dados parciais da igreja (Etapa 2)
   */
  async savePartialProfile(data: Partial<CompleteProfileData>): Promise<User> {
    try {
      // Salvar dados intermediários para permitir navegação segura
      const response = await api.patch<User>('/users/save_partial_profile/', data);
      localStorage.setItem('user', JSON.stringify(response.data));
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Completar perfil do usuário (Etapa 3 - Final)
   */
  async completeProfile(data: CompleteProfileData): Promise<User> {
    try {
      // O interceptor do Axios já adiciona o token
      const response = await api.post<User>('/users/complete_profile/', data);
      localStorage.setItem('user', JSON.stringify(response.data));
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Buscar igrejas disponíveis para cadastro
   */
  async getAvailableChurches(): Promise<Church[]> {
    try {
      const response = await api.get<Church[]>('/churches/available_for_registration/');
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Buscar denominações disponíveis para cadastro
   */
  async getAvailableDenominations(): Promise<Denomination[]> {
    try {
      const response = await api.get<Denomination[]>('/denominations/available_for_registration/');
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Buscar dados do usuário atual
   */
  async getCurrentUser(): Promise<User> {
    const token = localStorage.getItem('auth_token');
    
    // O interceptor já adiciona o token, mas para o primeiro carregamento
    // pode ser necessário garantir que ele esteja no header.
    const response = await api.get<User>('/users/me/');
    return response.data;
  },

  /**
   * Fazer logout
   */
  logout(): void {
    console.log('🧹 authService.logout - Limpando localStorage...');
    console.log('🧹 Antes - token:', !!localStorage.getItem('auth_token'));
    console.log('🧹 Antes - user:', !!localStorage.getItem('user'));
    console.log('🧹 Antes - activity:', !!localStorage.getItem('last_activity'));
    
    // Remover itens específicos
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    localStorage.removeItem('last_activity');
    
    // Limpeza adicional - remover qualquer chave relacionada à auth
    Object.keys(localStorage).forEach(key => {
      if (key.includes('auth') || key.includes('user') || key.includes('token')) {
        localStorage.removeItem(key);
      }
    });
    
    console.log('🧹 Depois - token:', !!localStorage.getItem('auth_token'));
    console.log('🧹 Depois - user:', !!localStorage.getItem('user'));
    console.log('🧹 Depois - activity:', !!localStorage.getItem('last_activity'));
    console.log('✅ authService.logout concluído');
  },

  /**
   * Verificar se usuário está logado e token não expirou
   */
  isAuthenticated(): boolean {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      console.log('🔍 isAuthenticated: false - sem token');
      return false;
    }
    
    // Verificar inatividade (30 minutos)
    const lastActivity = localStorage.getItem('last_activity');
    if (lastActivity) {
      const timeDiff = Date.now() - parseInt(lastActivity);
      const thirtyMinutes = 30 * 60 * 1000; // 30 minutos em ms
      
      if (timeDiff > thirtyMinutes) {
        console.log('🕒 Sessão expirada por inatividade');
        this.logout();
        return false;
      }
    }
    
    // Atualizar atividade (somente se não estiver no processo de logout)
    if (token) {
      this.updateActivity();
    }
    
    console.log('🔍 isAuthenticated: true - token válido');
    return true;
  },

  /**
   * Atualizar timestamp de última atividade
   */
  updateActivity(): void {
    localStorage.setItem('last_activity', Date.now().toString());
  },

  /**
   * Obter token atual
   */
  getToken(): string | null {
    return localStorage.getItem('auth_token');
  },

  /**
   * Obter usuário atual do localStorage
   */
  getCurrentUserFromStorage(): User | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  /**
   * Obter dados da igreja do usuário atual
   */
  async getUserChurch(): Promise<UserChurch> {
    try {
      const response = await api.get<UserChurch>('/users/my_church/');
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Atualizar dados pessoais do usuário
   */
  async updatePersonalData(data: {
    full_name?: string;
    email?: string;
    phone?: string;
    bio?: string;
    email_notifications?: boolean;
    sms_notifications?: boolean;
  }): Promise<User> {
    try {
      const response = await api.patch<{user: User; message: string}>('/users/update_personal_data/', data);
      // Atualizar localStorage com os novos dados
      localStorage.setItem('user', JSON.stringify(response.data.user));
      return response.data.user;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Atualizar dados da igreja
   */
  async updateChurchData(data: {
    name?: string;
    cnpj?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    zipcode?: string;
  }): Promise<UserChurch> {
    try {
      const response = await api.patch<{church: UserChurch; message: string}>('/users/update_church_data/', data);
      return response.data.church;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Upload de avatar do usuário
   */
  async uploadAvatar(file: File): Promise<{user: User; avatar_url: string; message: string}> {
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      
      const response = await api.post<{user: User; avatar_url: string; message: string}>('/users/upload-avatar/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      // Atualizar localStorage com os novos dados do usuário
      console.log('📸 Avatar response:', response.data);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      this.updateActivity();
      
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Deletar conta do usuário permanentemente
   */
  async deleteAccount(password: string): Promise<{message: string; deleted_at: string}> {
    try {
      const response = await api.delete<{message: string; deleted_at: string}>('/users/delete-account/', {
        data: {
          password,
          confirm_deletion: true
        }
      });
      
      // Limpar dados locais após deletar conta
      this.logout();
      
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
}; 