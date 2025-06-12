/**
 * Configuração da API do ObreiroVirtual
 * Centraliza URLs e configurações de comunicação com o backend Django
 */

// URL base da API Django
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1';

// Endpoints da API
export const API_ENDPOINTS = {
  // Autenticação
  auth: {
    login: '/auth/login/',
    token: '/auth/token/',
    register: '/auth/register/register/',
    completeProfile: '/auth/register/complete_profile/',
    availableChurches: '/auth/register/available_churches/',
  },
  
  // Usuários
  users: {
    me: '/users/me/',
    updateProfile: '/users/update_profile/',
    list: '/users/',
  },
  
  // Igrejas
  churches: {
    list: '/churches/',
    detail: (id: number) => `/churches/${id}/`,
  },
  
  // Denominações
  denominations: {
    list: '/denominations/',
    detail: (id: number) => `/denominations/${id}/`,
  },
  
  // Membros
  members: {
    list: '/members/',
    detail: (id: number) => `/members/${id}/`,
  },
  
  // Visitantes
  visitors: {
    list: '/visitors/',
    detail: (id: number) => `/visitors/${id}/`,
  },
  
  // Atividades
  activities: {
    list: '/activities/',
    detail: (id: number) => `/activities/${id}/`,
  },
  
  // Ministérios
  ministries: {
    list: '/ministries/',
    detail: (id: number) => `/ministries/${id}/`,
  },
} as const;

// Configuração padrão do Axios/Fetch
export const API_CONFIG = {
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
};

// Helper para construir URLs completas
export const buildApiUrl = (endpoint: string): string => {
  return `${API_BASE_URL}${endpoint}`;
};

// Helper para headers com autenticação
export const getAuthHeaders = (token?: string) => {
  const authToken = token || localStorage.getItem('auth_token');
  return {
    ...API_CONFIG.headers,
    ...(authToken && { Authorization: `Token ${authToken}` }),
  };
}; 