/**
 * Service para comunicação com a API de Pedidos de Oração
 */

import { api } from '@/config/api'
import {
  PrayerRequest,
  PrayerRequestListItem,
  PrayerRequestsResponse,
  PrayerRequestForm,
  PrayerFilters,
  PrayResponse,
  MarkAnsweredRequest,
  MarkAnsweredResponse,
  CreateMessageRequest,
  PrayerMessage,
  PrayerResponse as PrayerResponseType,
  PrayerStatistics,
} from '@/types/prayers'

// Base URL para as APIs de oração
const PRAYERS_BASE_URL = '/prayer-requests'

/**
 * Serviço para gerenciar pedidos de oração
 */
class PrayersService {
  /**
   * Lista pedidos de oração com filtros opcionais
   */
  async listPrayerRequests(filters?: PrayerFilters): Promise<PrayerRequestsResponse> {
    const params = new URLSearchParams()
    
    if (filters?.category) params.append('category', filters.category)
    if (filters?.status) params.append('status', filters.status)
    if (filters?.search) params.append('search', filters.search)
    if (filters?.ordering) params.append('ordering', filters.ordering)
    if (filters?.page) params.append('page', filters.page.toString())
    
    const response = await api.get(`${PRAYERS_BASE_URL}/`, {
      params: Object.fromEntries(params)
    })
    
    return response.data
  }

  /**
   * Busca um pedido de oração específico por ID
   */
  async getPrayerRequest(id: number): Promise<PrayerRequest> {
    const response = await api.get(`${PRAYERS_BASE_URL}/${id}/`)
    return response.data
  }

  /**
   * Cria um novo pedido de oração
   */
  async createPrayerRequest(data: PrayerRequestForm): Promise<PrayerRequest> {
    const response = await api.post(`${PRAYERS_BASE_URL}/`, {
      title: data.title,
      content: data.content,
      category: data.category,
      is_anonymous: data.is_anonymous,
      allow_visit: data.allow_visit,
      allow_contact: data.allow_contact,
      publish_on_wall: data.publish_on_wall
    })
    
    return response.data
  }

  /**
   * Atualiza um pedido de oração existente
   */
  async updatePrayerRequest(id: number, data: Partial<PrayerRequestForm>): Promise<PrayerRequest> {
    const updateData: any = {}
    
    if (data.title !== undefined) updateData.title = data.title
    if (data.content !== undefined) updateData.content = data.content
    if (data.category !== undefined) updateData.category = data.category
    if (data.is_anonymous !== undefined) updateData.is_anonymous = data.is_anonymous
    if (data.allow_visit !== undefined) updateData.allow_visit = data.allow_visit
    if (data.allow_contact !== undefined) updateData.allow_contact = data.allow_contact
    if (data.publish_on_wall !== undefined) updateData.publish_on_wall = data.publish_on_wall

    const response = await api.patch(`${PRAYERS_BASE_URL}/${id}/`, updateData)
    
    return response.data
  }

  /**
   * Remove um pedido de oração (soft delete)
   */
  async deletePrayerRequest(id: number): Promise<void> {
    await api.delete(`${PRAYERS_BASE_URL}/${id}/`)
  }

  /**
   * Marca/desmarca que está orando por um pedido
   */
  async togglePrayer(id: number, isPraying: boolean): Promise<PrayResponse> {
    const response = await api.post(`${PRAYERS_BASE_URL}/${id}/pray/`, {
      is_praying: isPraying
    })
    
    return response.data
  }

  /**
   * Marca um pedido como respondido
   */
  async markAsAnswered(id: number, data: MarkAnsweredRequest): Promise<MarkAnsweredResponse> {
    const response = await api.post(`${PRAYERS_BASE_URL}/${id}/mark_answered/`, data)
    return response.data
  }

  /**
   * Lista mensagens de apoio de um pedido específico
   */
  async getMessages(requestId: number): Promise<PrayerMessage[]> {
    try {
      const response = await api.get(`${PRAYERS_BASE_URL}/${requestId}/messages/`)
      return response.data.results || response.data
    } catch (error) {
      // Se for 404, retorna array vazio (sem mensagens)
      const axiosError = error as any
      if (axiosError?.response?.status === 404) {
        return []
      }
      throw error
    }
  }

  /**
   * Cria uma nova mensagem de apoio
   */
  async createMessage(requestId: number, data: CreateMessageRequest): Promise<PrayerMessage> {
    const response = await api.post(`${PRAYERS_BASE_URL}/${requestId}/messages/`, data)
    return response.data
  }

  /**
   * Atualiza uma mensagem de apoio
   */
  async updateMessage(requestId: number, messageId: number, content: string): Promise<PrayerMessage> {
    const response = await api.patch(`${PRAYERS_BASE_URL}/${requestId}/messages/${messageId}/`, {
      content
    })
    return response.data
  }

  /**
   * Remove uma mensagem de apoio
   */
  async deleteMessage(requestId: number, messageId: number): Promise<void> {
    await api.delete(`${PRAYERS_BASE_URL}/${requestId}/messages/${messageId}/`)
  }

  /**
   * Lista quem está orando por um pedido específico
   */
  async getPrayingUsers(requestId: number): Promise<PrayerResponseType[]> {
    const response = await api.get(`${PRAYERS_BASE_URL}/${requestId}/responses/`)
    return response.data.results || response.data
  }

  /**
   * Busca pedidos por termo de pesquisa
   */
  async searchPrayerRequests(query: string): Promise<PrayerRequestListItem[]> {
    const response = await this.listPrayerRequests({ search: query })
    return response.results
  }

  /**
   * Obtém estatísticas de pedidos de oração
   */
  async getStatistics(): Promise<PrayerStatistics> {
    const response = await api.get(`${PRAYERS_BASE_URL}/statistics/`)
    return response.data
  }

  /**
   * Lista pedidos de oração de um usuário específico
   */
  async getUserPrayerRequests(userId?: number): Promise<PrayerRequestListItem[]> {
    const params = userId ? { author_id: userId.toString() } : {}
    const response = await api.get(`${PRAYERS_BASE_URL}/`, { params })
    return response.data.results || response.data
  }

  /**
   * Lista pedidos que o usuário está orando
   */
  async getMyPrayers(): Promise<PrayerRequestListItem[]> {
    const response = await api.get(`${PRAYERS_BASE_URL}/`, {
      params: { is_praying: 'true' }
    })
    return response.data.results || response.data
  }
}

// Instância singleton do serviço
export const prayersService = new PrayersService()

// Exportação default para compatibilidade
export default prayersService