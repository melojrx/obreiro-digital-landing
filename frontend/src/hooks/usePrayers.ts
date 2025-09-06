/**
 * Hook customizado para gerenciar pedidos de oração
 */

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import {
  PrayerRequest,
  PrayerRequestListItem,
  PrayerRequestsResponse,
  PrayerFilters,
  PrayerStatistics,
} from '@/types/prayers'
import { prayersService } from '@/services/prayersService'

/**
 * Hook para gerenciar a listagem de pedidos de oração com paginação responsiva
 */
export function usePrayerRequests(initialFilters?: PrayerFilters) {
  const [requests, setRequests] = useState<PrayerRequestListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<PrayerFilters>(initialFilters || {})
  const [isMobile, setIsMobile] = useState(false)
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 0,
    totalItems: 0,
    pageSize: 21
  })

  // Detecta se é mobile
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      setPagination(prev => ({ ...prev, pageSize: mobile ? 10 : 21 }))
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Carrega pedidos de oração
  const loadRequests = useCallback(async (newFilters?: PrayerFilters, append = false) => {
    try {
      setLoading(true)
      setError(null)

      const currentFilters = newFilters || filters
      // Adiciona paginação aos filtros
      const filtersWithPagination = {
        ...currentFilters,
        page: currentFilters.page || pagination.currentPage,
        page_size: pagination.pageSize
      }
      
      const response: PrayerRequestsResponse = await prayersService.listPrayerRequests(filtersWithPagination)

      if (append) {
        setRequests(prev => [...prev, ...response.results])
      } else {
        setRequests(response.results)
      }

      // Atualiza informações de paginação
      setPagination(prev => ({
        ...prev,
        currentPage: filtersWithPagination.page || 1,
        totalPages: Math.ceil(response.count / prev.pageSize),
        totalItems: response.count
      }))

      if (newFilters) {
        setFilters(currentFilters)
      }
    } catch (err) {
      setError('Erro ao carregar pedidos de oração')
      console.error('Error loading prayer requests:', err)
    } finally {
      setLoading(false)
    }
  }, [filters, pagination.currentPage, pagination.pageSize])

  // Aplica novos filtros
  const applyFilters = useCallback((newFilters: PrayerFilters) => {
    // Reset para primeira página quando aplicar novos filtros
    setPagination(prev => ({ ...prev, currentPage: 1 }))
    const filtersWithPage = { ...newFilters, page: 1 }
    loadRequests(filtersWithPage)
  }, [loadRequests])

  // Navega para uma página específica
  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, currentPage: page }))
      // Carrega dados da nova página imediatamente
      loadRequests({ ...filters, page }, false)
    }
  }, [filters, loadRequests, pagination.totalPages])

  // Funções de navegação
  const nextPage = useCallback(() => {
    if (pagination.currentPage < pagination.totalPages) {
      goToPage(pagination.currentPage + 1)
    }
  }, [pagination.currentPage, pagination.totalPages, goToPage])

  const previousPage = useCallback(() => {
    if (pagination.currentPage > 1) {
      goToPage(pagination.currentPage - 1)
    }
  }, [pagination.currentPage, goToPage])

  const firstPage = useCallback(() => {
    goToPage(1)
  }, [goToPage])

  const lastPage = useCallback(() => {
    goToPage(pagination.totalPages)
  }, [goToPage, pagination.totalPages])

  // Gera números de página para mostrar
  const getPageNumbers = useCallback(() => {
    const pages: number[] = []
    const { currentPage, totalPages } = pagination
    const maxVisiblePages = isMobile ? 3 : 7

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
      let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)

      if (endPage === totalPages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1)
      }

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i)
      }
    }

    return pages
  }, [pagination, isMobile])

  // Carrega mais itens (mantido para compatibilidade)
  const loadMore = useCallback(() => {
    if (pagination.currentPage < pagination.totalPages && !loading) {
      nextPage()
    }
  }, [pagination.currentPage, pagination.totalPages, loading, nextPage])

  // Atualiza um pedido específico na lista
  const updateRequest = useCallback((updatedRequest: PrayerRequestListItem) => {
    setRequests(prev => 
      prev.map(req => req.id === updatedRequest.id ? updatedRequest : req)
    )
  }, [])

  // Remove um pedido da lista
  const removeRequest = useCallback((requestId: number) => {
    setRequests(prev => prev.filter(req => req.id !== requestId))
  }, [])

  // Recarrega a lista
  const refresh = useCallback(() => {
    loadRequests()
  }, [loadRequests])

  // Carregamento inicial
  useEffect(() => {
    loadRequests()
  }, [])

  // Objeto de paginação completo para compatibilidade
  const paginationObj = {
    ...pagination,
    isMobile,
    hasNext: pagination.currentPage < pagination.totalPages,
    hasPrevious: pagination.currentPage > 1,
    canGoFirst: pagination.currentPage > 1,
    canGoLast: pagination.currentPage < pagination.totalPages,
    nextPage,
    previousPage,
    firstPage,
    lastPage,
    getPageNumbers
  }

  return {
    requests,
    loading,
    error,
    pagination: paginationObj,
    filters,
    applyFilters,
    loadMore,
    updateRequest,
    removeRequest,
    refresh,
    goToPage,
    hasMore: pagination.currentPage < pagination.totalPages
  }
}

/**
 * Hook para gerenciar um pedido específico
 */
export function usePrayerRequest(id?: number) {
  const [request, setRequest] = useState<PrayerRequest | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Carrega um pedido específico
  const loadRequest = useCallback(async (requestId: number) => {
    try {
      setLoading(true)
      setError(null)
      const data = await prayersService.getPrayerRequest(requestId)
      setRequest(data)
    } catch (err) {
      setError('Erro ao carregar pedido de oração')
      console.error('Error loading prayer request:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Atualiza o pedido atual
  const updateRequest = useCallback((updatedRequest: PrayerRequest) => {
    setRequest(updatedRequest)
  }, [])

  // Carregamento inicial se ID for fornecido
  useEffect(() => {
    if (id) {
      loadRequest(id)
    }
  }, [id, loadRequest])

  return {
    request,
    loading,
    error,
    loadRequest,
    updateRequest
  }
}

/**
 * Hook para ações de oração (curtir/descurtir)
 */
export function usePrayerActions() {
  const [loading, setLoading] = useState<Record<number, boolean>>({})

  // Alterna estado de oração para um pedido
  const togglePrayer = useCallback(async (requestId: number, currentlyPraying: boolean) => {
    try {
      setLoading(prev => ({ ...prev, [requestId]: true }))
      
      const response = await prayersService.togglePrayer(requestId, !currentlyPraying)
      
      toast.success(response.message)
      
      return {
        is_praying: response.is_praying,
        prayers_count: response.prayers_count
      }
    } catch (error) {
      toast.error('Erro ao atualizar oração')
      console.error('Error toggling prayer:', error)
      throw error
    } finally {
      setLoading(prev => ({ ...prev, [requestId]: false }))
    }
  }, [])

  // Marca pedido como respondido
  const markAsAnswered = useCallback(async (requestId: number, testimony: string) => {
    try {
      setLoading(prev => ({ ...prev, [requestId]: true }))
      
      const response = await prayersService.markAsAnswered(requestId, { answer_testimony: testimony })
      
      toast.success(response.message)
      
      return response
    } catch (error) {
      toast.error('Erro ao marcar como respondido')
      console.error('Error marking as answered:', error)
      throw error
    } finally {
      setLoading(prev => ({ ...prev, [requestId]: false }))
    }
  }, [])

  return {
    loading,
    togglePrayer,
    markAsAnswered
  }
}

/**
 * Hook para gerenciar estatísticas de orações
 */
export function usePrayerStatistics() {
  const [statistics, setStatistics] = useState<PrayerStatistics | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Carrega estatísticas
  const loadStatistics = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await prayersService.getStatistics()
      setStatistics(data)
    } catch (err) {
      setError('Erro ao carregar estatísticas')
      console.error('Error loading statistics:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Carregamento inicial
  useEffect(() => {
    loadStatistics()
  }, [loadStatistics])

  return {
    statistics,
    loading,
    error,
    refresh: loadStatistics
  }
}

/**
 * Hook para busca de pedidos
 */
export function usePrayerSearch() {
  const [results, setResults] = useState<PrayerRequestListItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Realiza busca
  const search = useCallback(async (query: string) => {
    if (!query.trim()) {
      setResults([])
      return
    }

    try {
      setLoading(true)
      setError(null)
      const data = await prayersService.searchPrayerRequests(query.trim())
      setResults(data)
    } catch (err) {
      setError('Erro na busca')
      console.error('Error searching prayer requests:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Limpa resultados
  const clear = useCallback(() => {
    setResults([])
    setError(null)
  }, [])

  return {
    results,
    loading,
    error,
    search,
    clear
  }
}