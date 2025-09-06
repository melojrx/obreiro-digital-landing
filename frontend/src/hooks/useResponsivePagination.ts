/**
 * Hook para gerenciar paginação responsiva
 * Desktop: 21 cards por página
 * Mobile: 10 cards por página
 */

import { useState, useEffect, useCallback } from 'react'
import { PrayerFilters } from '@/types/prayers'

export interface ResponsivePaginationState {
  currentPage: number
  pageSize: number
  totalPages: number
  totalItems: number
  isMobile: boolean
}

export function useResponsivePagination(initialFilters?: PrayerFilters) {
  const [isMobile, setIsMobile] = useState(false)
  const [paginationState, setPaginationState] = useState<ResponsivePaginationState>({
    currentPage: 1,
    pageSize: 21, // padrão desktop
    totalPages: 0,
    totalItems: 0,
    isMobile: false
  })

  // Detecta se é mobile
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768 // Breakpoint md do Tailwind
      setIsMobile(mobile)
      setPaginationState(prev => ({
        ...prev,
        pageSize: mobile ? 10 : 21,
        isMobile: mobile
      }))
    }

    // Check inicial
    checkMobile()

    // Listener para mudanças de tamanho
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Atualiza informações de paginação baseado na resposta da API
  const updatePagination = useCallback((count: number, currentPage?: number) => {
    setPaginationState(prev => {
      const page = currentPage || prev.currentPage
      const totalPages = Math.ceil(count / prev.pageSize)
      
      return {
        ...prev,
        currentPage: page,
        totalPages,
        totalItems: count
      }
    })
  }, [])

  // Vai para uma página específica
  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= paginationState.totalPages) {
      setPaginationState(prev => ({
        ...prev,
        currentPage: page
      }))
    }
  }, [paginationState.totalPages])

  // Próxima página
  const nextPage = useCallback(() => {
    if (paginationState.currentPage < paginationState.totalPages) {
      goToPage(paginationState.currentPage + 1)
    }
  }, [paginationState.currentPage, paginationState.totalPages, goToPage])

  // Página anterior
  const previousPage = useCallback(() => {
    if (paginationState.currentPage > 1) {
      goToPage(paginationState.currentPage - 1)
    }
  }, [paginationState.currentPage, goToPage])

  // Primeira página
  const firstPage = useCallback(() => {
    goToPage(1)
  }, [goToPage])

  // Última página
  const lastPage = useCallback(() => {
    goToPage(paginationState.totalPages)
  }, [paginationState.totalPages, goToPage])

  // Gera filtros com paginação
  const getFiltersWithPagination = useCallback((filters: PrayerFilters) => {
    return {
      ...filters,
      page: paginationState.currentPage,
      page_size: paginationState.pageSize
    }
  }, [paginationState.currentPage, paginationState.pageSize])

  // Gera array de páginas para mostrar na UI
  const getPageNumbers = useCallback(() => {
    const pages: number[] = []
    const { currentPage, totalPages } = paginationState
    const maxVisiblePages = isMobile ? 3 : 7

    if (totalPages <= maxVisiblePages) {
      // Mostra todas as páginas se forem poucas
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Lógica para mostrar páginas relevantes
      let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
      let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)

      // Ajusta se estiver próximo do fim
      if (endPage === totalPages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1)
      }

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i)
      }
    }

    return pages
  }, [paginationState, isMobile])

  return {
    ...paginationState,
    updatePagination,
    goToPage,
    nextPage,
    previousPage,
    firstPage,
    lastPage,
    getFiltersWithPagination,
    getPageNumbers,
    hasNext: paginationState.currentPage < paginationState.totalPages,
    hasPrevious: paginationState.currentPage > 1,
    canGoFirst: paginationState.currentPage > 1,
    canGoLast: paginationState.currentPage < paginationState.totalPages
  }
}