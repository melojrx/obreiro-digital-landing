import axios from 'axios';

/**
 * Configuração da API do ObreiroVirtual
 * Centraliza URLs e configurações de comunicação com o backend Django
 */

// URL base da API Django
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

// URL base do servidor (sem /api/v1)
export const SERVER_BASE_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:8000';

// Criação da instância do Axios
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar o token de autenticação em cada requisição
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers['Authorization'] = `Token ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export { api };

// Helper para construir URLs completas
export const buildApiUrl = (endpoint: string): string => {
  return `${API_BASE_URL}${endpoint}`;
};

// Helper para construir URLs de arquivos de media
export const buildMediaUrl = (mediaPath: string): string => {
  if (!mediaPath) return '';
  if (mediaPath.startsWith('http')) return mediaPath; // URL já completa
  return `${SERVER_BASE_URL}${mediaPath}`;
};

// Endpoints da API
export const API_ENDPOINTS = {
  // Autenticação
  auth: {
    login: '/auth/login/',
    token: '/auth/token/',
    register: '/auth/register/register/',
    completeProfile: '/auth/register/complete_profile/',
    availableChurches: '/auth/register/available_churches/',
    availableDenominations: '/auth/register/available_denominations/',
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
  
  // Denominações e Hierarquia
  denominations: {
    list: '/denominations/',
    detail: (id: number) => `/denominations/${id}/`,
    create: '/denominations/',
    update: (id: number) => `/denominations/${id}/`,
    delete: (id: number) => `/denominations/${id}/`,
    stats: (id: number) => `/denominations/${id}/stats/`,
    churches: (id: number) => `/denominations/${id}/churches/`,
    dashboard: (id: number) => `/denominations/${id}/dashboard/`,
  },
  
  // Hierarquia
  hierarchy: {
    tree: '/hierarchy/tree/',
    denominationTree: (id: number) => `/hierarchy/denominations/${id}/tree/`,
    churchTree: (id: number) => `/hierarchy/churches/${id}/tree/`,
    navigation: '/hierarchy/navigation/',
  },
  
  // Membros
  members: {
    list: '/members/',
    detail: (id: number) => `/members/${id}/`,
    create: '/members/',
    update: (id: number) => `/members/${id}/`,
    delete: (id: number) => `/members/${id}/`,
    dashboard: '/members/dashboard/',
    statistics: '/members/statistics/',
    profile: (id: number) => `/members/${id}/profile/`,
    updateStatus: (id: number) => `/members/${id}/update_status/`,
    export: '/members/export/',
  },
  
  // Status de Membresia (Nova estrutura)
  membershipStatus: {
    list: '/membership-status/',
    detail: (id: number) => `/membership-status/${id}/`,
    create: '/membership-status/',
    update: (id: number) => `/membership-status/${id}/`,
    delete: (id: number) => `/membership-status/${id}/`,
    
    // Endpoints específicos para membros
    memberHistory: (memberId: number) => `/members/${memberId}/status-history/`,
    currentStatus: (memberId: number) => `/members/${memberId}/current-status/`,
    changeStatus: (memberId: number) => `/members/${memberId}/change-status/`,
  },
  
  // Branches (Filiais)
  branches: {
    list: '/branches/',
    detail: (id: number) => `/branches/${id}/`,
    create: '/branches/',
    update: (id: number) => `/branches/${id}/`,
    delete: (id: number) => `/branches/${id}/`,
    
    // QR Code endpoints
    qrCodes: '/branches/qr_codes/',
    regenerateQRCode: (id: number) => `/branches/${id}/regenerate_qr_code/`,
    toggleQRCode: (id: number) => `/branches/${id}/toggle_qr_code/`,
    visitorStats: (id: number) => `/branches/${id}/visitor_stats/`,
  },
  
  // Visitantes
  visitors: {
    // Endpoints públicos (sem autenticação)
    validateQR: (uuid: string) => `/visitors/public/qr/${uuid}/validate/`,
    registerPublic: (uuid: string) => `/visitors/public/qr/${uuid}/register/`,
    
    // Endpoints administrativos
    list: '/visitors/admin/visitors/',
    detail: (id: number) => `/visitors/admin/visitors/${id}/`,
    create: '/visitors/admin/visitors/',
    update: (id: number) => `/visitors/admin/visitors/${id}/`,
    delete: (id: number) => `/visitors/admin/visitors/${id}/`,
    
    // Estatísticas e relatórios
    stats: '/visitors/admin/visitors/stats/',
    byBranch: '/visitors/admin/visitors/by_branch/',
    pendingFollowUp: '/visitors/admin/visitors/pending_follow_up/',
    recent: '/visitors/admin/recent/',
    dashboardStats: '/visitors/admin/dashboard-stats/',
    
    // Ações específicas
    convertToMember: (id: number) => `/visitors/admin/visitors/${id}/convert_to_member/`,
    updateFollowUp: (id: number) => `/visitors/admin/visitors/${id}/update_follow_up/`,
    bulkAction: '/visitors/admin/visitors/bulk_action/',
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