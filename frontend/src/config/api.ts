import axios from 'axios';

/**
 * Configuração da API do ObreiroVirtual
 * Centraliza URLs e configurações de comunicação com o backend Django
 */

// URL base da API Django
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

// URL base do servidor (sem /api/v1)
export const SERVER_BASE_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:8000';

// Configurações de notificações em tempo real
export const NOTIFICATIONS_CONFIG = {
  // SSE (Server-Sent Events) - Desabilitado em produção por padrão
  // Requer Gunicorn+Gevent ou servidor ASGI para funcionar corretamente
  enableSSE: import.meta.env.VITE_ENABLE_SSE === 'true' || import.meta.env.MODE === 'development',
  
  // Polling - Estratégia principal/fallback
  pollingInterval: parseInt(import.meta.env.VITE_NOTIFICATION_POLLING_INTERVAL || '60000', 10), // 60s
  
  // Endpoints
  sseStreamUrl: '/api/v1/notifications/stream/',
  unreadCountUrl: '/api/v1/notifications/unread_count/',
} as const;

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
    
    // Adicionar cabeçalhos de contexto multi-tenant
    const activeChurch = localStorage.getItem('active_church');
    const activeBranch = localStorage.getItem('active_branch');
    
    console.log('📦 localStorage values:', { activeChurch, activeBranch });
    
    if (activeChurch) {
      config.headers['X-Church'] = activeChurch;
      console.log('✅ X-Church header definido:', activeChurch);
    }
    
    if (activeBranch) {
      config.headers['X-Branch'] = activeBranch;
      console.log('✅ X-Branch header definido:', activeBranch);
    }
    
    // Log da requisição para debug
    console.log('🚀 API Request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      fullURL: `${config.baseURL}${config.url}`,
      headers: {
        'Content-Type': config.headers['Content-Type'],
        'Authorization': config.headers['Authorization'] ? '***' : 'none',
        'X-Church': config.headers['X-Church'] || 'none',
        'X-Branch': config.headers['X-Branch'] || 'none',
      },
      data: config.data,
      dataType: typeof config.data,
      dataKeys: config.data ? Object.keys(config.data) : 'none',
      rawData: config.url?.includes('login') ? JSON.stringify(config.data) : 'hidden'
    });
    
    return config;
  },
  (error) => {
    console.error('❌ API Request Error:', error);
    return Promise.reject(error);
  }
);

// Interceptor para respostas
api.interceptors.response.use(
  (response) => {
    // Log detalhado da resposta (esconde senha no login)
    const logData = response.config.url?.includes('login') 
      ? 'LOGIN_DATA_HIDDEN' 
      : response.data;
    
    console.log('✅ API Response:', {
      status: response.status,
      url: response.config.url,
      data: logData
    });
    return response;
  },
  (error) => {
    console.error('❌ API Response Error:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      method: error.config?.method?.toUpperCase(),
      message: error.message,
      responseData: error.response?.data,
      responseHeaders: error.response?.headers,
      requestData: error.config?.data,
      fullError: error
    });
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
  console.log('🔧 [buildMediaUrl] INPUT:', mediaPath);
  console.log('🔧 [buildMediaUrl] SERVER_BASE_URL:', SERVER_BASE_URL);
  
  if (!mediaPath) {
    console.log('🔧 [buildMediaUrl] mediaPath vazio, retornando ""');
    return '';
  }
  
  if (mediaPath.startsWith('http')) {
    console.log('🔧 [buildMediaUrl] URL já completa, retornando:', mediaPath);
    return mediaPath; // URL já completa
  }
  
  // Remover barra inicial do mediaPath se existir para evitar //
  const cleanPath = mediaPath.startsWith('/') ? mediaPath.substring(1) : mediaPath;
  const finalUrl = `${SERVER_BASE_URL}/${cleanPath}`;
  
  console.log('🔧 [buildMediaUrl] cleanPath:', cleanPath);
  console.log('🔧 [buildMediaUrl] OUTPUT:', finalUrl);
  
  return finalUrl;
};

// Endpoints da API
export const API_ENDPOINTS = {
  // Autenticação
  auth: {
    login: '/auth/login/',
    token: '/auth/token/',
    register: '/users/register/',
    completeProfile: '/users/complete_profile/',
    availableChurches: '/auth/available-churches/',
    availableDenominations: '/auth/available-denominations/',
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

  // Dashboard Super Admin
  platform: {
    overview: '/platform/overview/',
    planDistribution: '/platform/distributions/plans/',
    topChurches: '/platform/rankings/top-churches/',
    topChurchesVisitors: '/platform/rankings/top-churches-visitors/',
    activitySummary: '/platform/activity/summary/',
    activityLogins: '/platform/activity/logins/',
    newMembers: '/platform/members/new-this-month/',
    subscriptions: '/platform/subscriptions/expiring/',
    geoMap: '/platform/geography/map-data/',
  },
  
  // Membros
  members: {
    list: '/members/',
    detail: (id: number) => `/members/${id}/`,
    create: '/members/',
    update: (id: number) => `/members/${id}/`,
    delete: (id: number) => `/members/${id}/`,
    // Transferência assistida (admin) entre congregações da mesma igreja
    transferBranch: (id: number) => `/members/${id}/transfer-branch/`,
    dashboard: '/members/dashboard/',
    statistics: '/members/statistics/',
    profile: (id: number) => `/members/${id}/profile/`,
    updateStatus: (id: number) => `/members/${id}/update_status/`,
    // Histórico de status de membresia (auditoria simples)
    statusHistory: (id: number) => `/members/${id}/status_history/`,
    export: '/members/export/',
    exportCsv: '/members/export_csv/',
    availableForSpouse: '/members/available_for_spouse/',
    bulkUpload: '/members/bulk_upload/',
    // Rotas do próprio usuário (sem filtrar por congregação)
    me: {
      status: '/members/me/status/',
      transferBranch: '/members/me/transfer-branch/',
    },
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
  
  // Branches (Congregações)
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
    list: '/activities/activities/',
    detail: (id: number) => `/activities/activities/${id}/`,
    create: '/activities/activities/',
    update: (id: number) => `/activities/activities/${id}/`,
    delete: (id: number) => `/activities/activities/${id}/`,
    upcoming: '/activities/activities/upcoming/',
    publicCalendar: '/activities/activities/public_calendar/',
    registerParticipant: (id: number) => `/activities/activities/${id}/register_participant/`,
    participants: (id: number) => `/activities/activities/${id}/participants/`,
  },
  
  // Ministérios
  ministries: {
    list: '/activities/ministries/',
    detail: (id: number) => `/activities/ministries/${id}/`,
    create: '/activities/ministries/',
    update: (id: number) => `/activities/ministries/${id}/`,
    delete: (id: number) => `/activities/ministries/${id}/`,
    stats: (id: number) => `/activities/ministries/${id}/stats/`,
    activities: (id: number) => `/activities/ministries/${id}/activities/`,
    public: '/activities/ministries/public/',
  },

  // Histórico de Função Ministerial
  ministerialFunctionHistory: {
    list: '/ministerial-function-history/',
    detail: (id: number) => `/ministerial-function-history/${id}/`,
    endPeriod: (id: number) => `/ministerial-function-history/${id}/end_period/`,
  },
} as const; 
