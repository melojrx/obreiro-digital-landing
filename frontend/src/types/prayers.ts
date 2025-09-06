/**
 * Types para o módulo de Pedidos de Oração
 */

// Enum para categorias de pedidos
export enum PrayerCategory {
  PERSONAL = 'personal',
  FAMILY = 'family',
  HEALTH = 'health',
  FINANCE = 'finance',
  WORK = 'work',
  STUDIES = 'studies',
  MARRIAGE = 'marriage',
  CONVERSION = 'conversion',
  MISSIONS = 'missions',
  TRAVEL = 'travel',
  CHURCH = 'church',
  THANKSGIVING = 'thanksgiving',
  NATION = 'nation',
  GROWTH = 'growth',
}

// Labels em português para as categorias
export const PRAYER_CATEGORY_LABELS: Record<PrayerCategory, string> = {
  [PrayerCategory.PERSONAL]: 'Pessoal',
  [PrayerCategory.FAMILY]: 'Família',
  [PrayerCategory.HEALTH]: 'Saúde',
  [PrayerCategory.FINANCE]: 'Finanças',
  [PrayerCategory.WORK]: 'Trabalho',
  [PrayerCategory.STUDIES]: 'Estudos',
  [PrayerCategory.MARRIAGE]: 'Matrimonial',
  [PrayerCategory.CONVERSION]: 'Conversão',
  [PrayerCategory.MISSIONS]: 'Missões',
  [PrayerCategory.TRAVEL]: 'Viagem',
  [PrayerCategory.CHURCH]: 'Igreja',
  [PrayerCategory.THANKSGIVING]: 'Ação de Graças',
  [PrayerCategory.NATION]: 'Nação',
  [PrayerCategory.GROWTH]: 'Crescimento',
}

// Enum para status do pedido
export enum PrayerStatus {
  ACTIVE = 'active',
  ANSWERED = 'answered',
  CLOSED = 'closed',
  PRIVATE = 'private',
}

// Labels em português para os status
export const PRAYER_STATUS_LABELS: Record<PrayerStatus, string> = {
  [PrayerStatus.ACTIVE]: 'Ativo',
  [PrayerStatus.ANSWERED]: 'Respondido',
  [PrayerStatus.CLOSED]: 'Fechado',
  [PrayerStatus.PRIVATE]: 'Privado',
}

// Interface para autor básico
export interface Author {
  id: number
  first_name: string
  last_name: string
  full_name: string
  email: string
}

// Interface para igreja básica
export interface Church {
  id: number
  name: string
  address: string
  phone: string
}

// Interface para mensagem de apoio
export interface PrayerMessage {
  id: number
  uuid: string
  content: string
  is_anonymous: boolean
  created_at: string
  updated_at: string
  author: Author
  author_name: string
}

// Interface para resposta de oração (estou orando)
export interface PrayerResponse {
  id: number
  uuid: string
  is_praying: boolean
  created_at: string
  updated_at: string
  user: Author
}

// Interface principal para pedido de oração
export interface PrayerRequest {
  id: number
  uuid: string
  title: string
  content: string
  category: PrayerCategory
  status: PrayerStatus
  is_anonymous: boolean
  allow_visit: boolean
  allow_contact: boolean
  publish_on_wall: boolean
  image?: string
  answered_at?: string
  answer_testimony?: string
  created_at: string
  updated_at: string
  author: Author
  church: Church
  author_name: string
  messages?: PrayerMessage[]
  responses?: PrayerResponse[]
  messages_count: number
  prayers_count: number
  is_praying: boolean
  can_edit: boolean
}

// Interface para criação/edição de pedido
export interface PrayerRequestForm {
  title: string
  content: string
  category: PrayerCategory
  is_anonymous?: boolean
  allow_visit?: boolean
  allow_contact?: boolean
  publish_on_wall?: boolean
}

// Interface para dados de listagem (otimizada)
export interface PrayerRequestListItem {
  id: number
  uuid: string
  title: string
  content: string
  category: PrayerCategory
  status: PrayerStatus
  is_anonymous: boolean
  allow_visit: boolean
  allow_contact: boolean
  publish_on_wall: boolean
  image?: string
  answered_at?: string
  created_at: string
  updated_at: string
  author: Author
  church: Church
  author_name: string
  messages_count: number
  prayers_count: number
  is_praying: boolean
  can_edit: boolean
}

// Interface para resposta da API de listagem
export interface PrayerRequestsResponse {
  count: number
  next: string | null
  previous: string | null
  results: PrayerRequestListItem[]
}

// Interface para filtros
export interface PrayerFilters {
  category?: PrayerCategory
  status?: PrayerStatus
  search?: string
  ordering?: string
  page?: number
  page_size?: number
}

// Interface para estatísticas
export interface PrayerStatistics {
  total_requests: number
  active_requests: number
  answered_requests: number
  my_requests: number
  my_prayers: number
}

// Interface para resposta da ação de orar
export interface PrayResponse {
  is_praying: boolean
  prayers_count: number
  message: string
}

// Interface para marcar como respondido
export interface MarkAnsweredRequest {
  answer_testimony: string
}

// Interface para resposta de marcar como respondido
export interface MarkAnsweredResponse {
  message: string
  answered_at: string
  answer_testimony: string
}

// Interface para criar mensagem de apoio
export interface CreateMessageRequest {
  content: string
  is_anonymous?: boolean
}