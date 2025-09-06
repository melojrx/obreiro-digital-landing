/**
 * Página principal de Pedidos de Oração
 * Baseada nas telas fornecidas pelo usuário
 */

import React, { useState, useCallback } from 'react'
import { Plus, Loader2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import AppLayout from '@/components/layout/AppLayout'
import { PrayerCard } from '@/components/prayers/PrayerCard'
import { FilterDropdown, ActiveFilters } from '@/components/prayers/FilterDropdown'
import { SearchBar } from '@/components/prayers/SearchBar'
import { CreatePrayerModal } from '@/components/prayers/CreatePrayerModal'
import { PrayerDetailModal } from '@/components/prayers/PrayerDetailModal'
import { PaginationControls } from '@/components/prayers/PaginationControls'
import { usePrayerRequests } from '@/hooks/usePrayers'
import { 
  PrayerRequestListItem, 
  PrayerFilters, 
  PrayerRequest 
} from '@/types/prayers'

export function PrayerRequestsPage() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingPrayer, setEditingPrayer] = useState<PrayerRequest | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedPrayerId, setSelectedPrayerId] = useState<number | undefined>()

  const prayerHook = usePrayerRequests()
  
  const {
    requests = [],
    loading = true,
    error,
    filters = {},
    pagination,
    applyFilters,
    loadMore,
    updateRequest,
    refresh,
    goToPage,
    hasMore = false
  } = prayerHook || {}

  // Dados de paginação seguros
  const paginationSafe = React.useMemo(() => {
    if (!pagination) {
      return {
        currentPage: 1,
        totalPages: 0,
        totalItems: 0,
        pageSize: 21,
        isMobile: false,
        getPageNumbers: () => [],
        hasNext: false,
        hasPrevious: false,
        canGoFirst: false,
        canGoLast: false,
        nextPage: () => {},
        previousPage: () => {},
        firstPage: () => {},
        lastPage: () => {}
      }
    }
    
    return {
      currentPage: pagination.currentPage || 1,
      totalPages: pagination.totalPages || 0,
      totalItems: pagination.totalItems || 0,
      pageSize: pagination.pageSize || 21,
      isMobile: pagination.isMobile || false,
      getPageNumbers: typeof pagination.getPageNumbers === 'function' ? pagination.getPageNumbers : () => [],
      hasNext: pagination.hasNext || false,
      hasPrevious: pagination.hasPrevious || false,
      canGoFirst: pagination.canGoFirst || false,
      canGoLast: pagination.canGoLast || false,
      nextPage: typeof pagination.nextPage === 'function' ? pagination.nextPage : () => {},
      previousPage: typeof pagination.previousPage === 'function' ? pagination.previousPage : () => {},
      firstPage: typeof pagination.firstPage === 'function' ? pagination.firstPage : () => {},
      lastPage: typeof pagination.lastPage === 'function' ? pagination.lastPage : () => {}
    }
  }, [pagination])

  // Manipula mudança de filtros
  const handleFiltersChange = useCallback((newFilters: PrayerFilters) => {
    if (applyFilters) {
      applyFilters(newFilters)
    }
  }, [applyFilters])

  // Remove um filtro específico
  const handleRemoveFilter = useCallback((filterKey: keyof PrayerFilters) => {
    const newFilters = { ...filters }
    delete newFilters[filterKey]
    if (applyFilters) {
      applyFilters(newFilters)
    }
  }, [filters, applyFilters])

  // Manipula busca
  const handleSearch = useCallback((query: string) => {
    handleFiltersChange({ ...filters, search: query })
  }, [filters, handleFiltersChange])

  // Manipula ação de oração
  const handlePrayToggle = useCallback((
    prayer: PrayerRequestListItem,
    newState: { is_praying: boolean; prayers_count: number }
  ) => {
    const updatedPrayer: PrayerRequestListItem = {
      ...prayer,
      ...newState
    }
    if (updateRequest) {
      updateRequest(updatedPrayer)
    }
  }, [updateRequest])

  // Manipula sucesso na criação/edição
  const handlePrayerSuccess = useCallback((prayer: PrayerRequest) => {
    if (editingPrayer) {
      // Atualiza pedido existente
      const updatedRequest: PrayerRequestListItem = {
        id: prayer.id,
        uuid: prayer.uuid,
        title: prayer.title,
        content: prayer.content,
        category: prayer.category,
        status: prayer.status,
        is_anonymous: prayer.is_anonymous,
        allow_visit: prayer.allow_visit,
        allow_contact: prayer.allow_contact,
        publish_on_wall: prayer.publish_on_wall,
        image: prayer.image,
        answered_at: prayer.answered_at,
        created_at: prayer.created_at,
        updated_at: prayer.updated_at,
        author: prayer.author,
        church: prayer.church,
        author_name: prayer.author_name,
        messages_count: prayer.messages_count,
        prayers_count: prayer.prayers_count,
        is_praying: prayer.is_praying,
        can_edit: prayer.can_edit
      }
      if (updateRequest) {
        updateRequest(updatedRequest)
      }
    } else {
      // Recarrega a lista para mostrar o novo pedido
      if (refresh) {
        refresh()
      }
    }
    setEditingPrayer(null)
  }, [editingPrayer, updateRequest, refresh])

  // Manipula clique no card para abrir detalhes
  const handleCardClick = useCallback((prayer: PrayerRequestListItem) => {
    setSelectedPrayerId(prayer.id)
    setShowDetailModal(true)
  }, [])

  // Manipula clique no botão de mensagem
  const handleMessageClick = useCallback((prayer: PrayerRequestListItem) => {
    setSelectedPrayerId(prayer.id)
    setShowDetailModal(true)
  }, [])

  return (
    <AppLayout>
      {/* Header */}
      <div className="bg-white shadow-sm border-b mb-4 sm:mb-6 -mx-4 sm:-mx-6 -mt-4 sm:-mt-6 px-4 sm:px-6 pt-4 sm:pt-6">
        <div className="max-w-7xl mx-auto py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
                Pedidos de Oração
              </h1>
              <p className="text-gray-600 text-xs sm:text-sm mt-1 line-clamp-2 sm:line-clamp-1">
                Compartilhe suas necessidades de oração com a comunidade
              </p>
            </div>
            
            <Button 
              onClick={() => setShowCreateModal(true)}
              className="bg-gray-800 hover:bg-gray-900 text-white text-sm sm:text-base w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden xs:inline">Fazer um pedido</span>
              <span className="xs:hidden">Novo pedido</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Filtros e Busca */}
      <div className="max-w-7xl mx-auto px-0 py-0">
        <div className="flex flex-col gap-3 sm:gap-4 mb-4 sm:mb-6">
          {/* Barra de busca - full width em mobile */}
          <div className="w-full">
            <SearchBar
              value={filters.search || ''}
              onSearch={handleSearch}
              loading={loading}
              placeholder="Buscar por autor ou mensagem..."
              className="w-full"
            />
          </div>
          
          {/* Filtros e botão refresh */}
          <div className="flex flex-col xs:flex-row gap-2 xs:gap-3">
            <div className="flex-1">
              <FilterDropdown
                filters={filters}
                onFiltersChange={handleFiltersChange}
                className="w-full xs:w-auto"
              />
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => refresh && refresh()}
              disabled={loading}
              className="w-full xs:w-auto"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''} mr-2 xs:mr-0`} />
              <span className="xs:hidden">Atualizar</span>
            </Button>
          </div>
        </div>

        {/* Filtros Ativos */}
        <ActiveFilters
          filters={filters}
          onRemoveFilter={handleRemoveFilter}
          className="mb-4 sm:mb-6"
        />

        {/* Conteúdo Principal */}
        <div className="max-w-7xl mx-auto">
          {error ? (
            <Card className="p-4 sm:p-8 text-center">
              <CardContent>
                <p className="text-red-600 mb-4 text-sm sm:text-base">{error}</p>
                <Button 
                  onClick={() => refresh && refresh()} 
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  Tentar novamente
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
            {/* Lista de Pedidos */}
            {(!requests || requests.length === 0) && !loading ? (
              <Card className="p-4 sm:p-8 text-center">
                <CardContent>
                  <div className="text-gray-500">
                    {filters.search || filters.category || filters.status ? (
                      <>
                        <p className="text-base sm:text-lg mb-2">Nenhum pedido encontrado</p>
                        <p className="text-sm">
                          Tente ajustar os filtros ou faça uma nova busca
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-base sm:text-lg mb-2">Nenhum pedido de oração ainda</p>
                        <p className="text-sm mb-4">
                          Seja o primeiro a compartilhar um pedido com a comunidade
                        </p>
                        <Button 
                          onClick={() => setShowCreateModal(true)}
                          variant="outline"
                          className="w-full sm:w-auto"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Fazer um pedido
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Grid de Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                  {requests?.map((prayer) => (
                    <PrayerCard
                      key={prayer.id}
                      prayer={prayer}
                      onPrayToggle={handlePrayToggle}
                      onMessageClick={handleMessageClick}
                      onCardClick={handleCardClick}
                    />
                  ))}
                </div>

                {/* Controles de Paginação */}
                {requests && requests.length > 0 && paginationSafe.totalPages > 1 && (
                  <div className="flex justify-center py-6 sm:py-8">
                    <PaginationControls
                      currentPage={paginationSafe.currentPage}
                      totalPages={paginationSafe.totalPages}
                      pageNumbers={paginationSafe.getPageNumbers()}
                      isMobile={paginationSafe.isMobile}
                      hasNext={paginationSafe.hasNext}
                      hasPrevious={paginationSafe.hasPrevious}
                      canGoFirst={paginationSafe.canGoFirst}
                      canGoLast={paginationSafe.canGoLast}
                      onPageChange={goToPage || (() => {})}
                      onNextPage={paginationSafe.nextPage}
                      onPreviousPage={paginationSafe.previousPage}
                      onFirstPage={paginationSafe.firstPage}
                      onLastPage={paginationSafe.lastPage}
                      totalItems={paginationSafe.totalItems}
                      pageSize={paginationSafe.pageSize}
                    />
                  </div>
                )}
              </>
            )}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Criação/Edição */}
      <CreatePrayerModal
        open={showCreateModal || !!editingPrayer}
        onOpenChange={(open) => {
          if (!open) {
            setShowCreateModal(false)
            setEditingPrayer(null)
          }
        }}
        editingPrayer={editingPrayer}
        onSuccess={handlePrayerSuccess}
      />

      {/* Modal de Detalhes */}
      <PrayerDetailModal
        open={showDetailModal}
        onOpenChange={setShowDetailModal}
        prayerId={selectedPrayerId}
        onPrayToggle={(newState) => {
          // Atualiza o estado local da lista
          if (selectedPrayerId && updateRequest) {
            const prayer = requests?.find(p => p.id === selectedPrayerId)
            if (prayer) {
              handlePrayToggle(prayer, newState)
            }
          }
        }}
      />
    </AppLayout>
  )
}

export default PrayerRequestsPage