/**
 * Serviço de Autenticação
 * Gerencia login, registro e autenticação com a API Django
 */

import { API_BASE_URL, API_ENDPOINTS, getAuthHeaders } from '../config/api';

// Tipos TypeScript
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  full_name: string;
  password: string;
  password_confirm: string;
  phone?: string;
}

export interface CompleteProfileData {
  cpf?: string;
  birth_date?: string;
  bio?: string;
  church_id: number;
  role: string;
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
  is_active: boolean;
  date_joined: string;
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

// Helper para fazer requests
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  console.log('🔄 API Request:', {
    url,
    method: options.method || 'GET',
    headers: options.headers,
    body: options.body
  });
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    console.log('🚀 Fazendo requisição para:', url);
    const response = await fetch(url, config);
    
    console.log('📡 Response Status:', response.status);
    console.log('📡 Response Headers:', Object.fromEntries(response.headers.entries()));
    
    const data = await response.json();
    
    console.log('📡 Response Data:', data);

    if (!response.ok) {
      console.error('❌ Erro na API:', {
        status: response.status,
        data
      });
      
      throw new AuthError(
        data.detail || data.message || 'Erro na requisição',
        response.status,
        data.errors || data
      );
    }

    console.log('✅ Sucesso na API:', data);
    return data;
  } catch (error) {
    console.error('💥 Erro na requisição:', error);
    
    if (error instanceof AuthError) {
      throw error;
    }
    
    throw new AuthError(
      'Erro de conexão. Verifique sua internet.',
      0
    );
  }
}

// Serviços de autenticação
export const authService = {
  /**
   * Fazer login do usuário
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiRequest<AuthResponse>(
      API_ENDPOINTS.auth.login,
      {
        method: 'POST',
        body: JSON.stringify(credentials),
      }
    );

    // Salvar token no localStorage
    if (response.token) {
      localStorage.setItem('auth_token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
    }

    return response;
  },

  /**
   * Registrar novo usuário (Etapa 1)
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await apiRequest<AuthResponse>(
      API_ENDPOINTS.auth.register,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );

    // Salvar token temporário para etapa 2
    if (response.token) {
      localStorage.setItem('auth_token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
    }

    return response;
  },

  /**
   * Completar perfil do usuário (Etapa 2)
   */
  async completeProfile(data: CompleteProfileData): Promise<User> {
    const token = localStorage.getItem('auth_token');
    
    const response = await apiRequest<User>(
      API_ENDPOINTS.auth.completeProfile,
      {
        method: 'POST',
        headers: getAuthHeaders(token),
        body: JSON.stringify(data),
      }
    );

    // Atualizar dados do usuário
    localStorage.setItem('user', JSON.stringify(response));

    return response;
  },

  /**
   * Buscar igrejas disponíveis para cadastro
   */
  async getAvailableChurches(): Promise<Church[]> {
    return await apiRequest<Church[]>(API_ENDPOINTS.auth.availableChurches);
  },

  /**
   * Buscar dados do usuário atual
   */
  async getCurrentUser(): Promise<User> {
    const token = localStorage.getItem('auth_token');
    
    return await apiRequest<User>(
      API_ENDPOINTS.users.me,
      {
        headers: getAuthHeaders(token),
      }
    );
  },

  /**
   * Fazer logout
   */
  logout(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
  },

  /**
   * Verificar se usuário está logado
   */
  isAuthenticated(): boolean {
    return !!localStorage.getItem('auth_token');
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
}; 