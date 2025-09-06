/**
 * Componente de controles de paginação responsivo
 * Adaptado para mobile e desktop
 */

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface PaginationControlsProps {
  currentPage: number
  totalPages: number
  pageNumbers: number[]
  isMobile: boolean
  hasNext: boolean
  hasPrevious: boolean
  canGoFirst: boolean
  canGoLast: boolean
  onPageChange: (page: number) => void
  onNextPage: () => void
  onPreviousPage: () => void
  onFirstPage: () => void
  onLastPage: () => void
  totalItems: number
  pageSize: number
}

export function PaginationControls({
  currentPage,
  totalPages,
  pageNumbers,
  isMobile,
  hasNext,
  hasPrevious,
  canGoFirst,
  canGoLast,
  onPageChange,
  onNextPage,
  onPreviousPage,
  onFirstPage,
  onLastPage,
  totalItems,
  pageSize
}: PaginationControlsProps) {
  if (totalPages <= 1) return null

  const startItem = (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, totalItems)

  return (
    <div className="flex flex-col gap-4">
      {/* Informações da página */}
      <div className="text-center text-sm text-gray-600">
        {isMobile ? (
          <span>
            Página {currentPage} de {totalPages}
          </span>
        ) : (
          <span>
            Mostrando {startItem} a {endItem} de {totalItems} pedidos
          </span>
        )}
      </div>

      {/* Controles de navegação */}
      <div className="flex items-center justify-center gap-1">
        {/* Primeira página - apenas desktop */}
        {!isMobile && canGoFirst && (
          <Button
            variant="outline"
            size="sm"
            onClick={onFirstPage}
            className="hidden sm:flex"
          >
            <ChevronsLeft className="h-4 w-4" />
            <span className="sr-only">Primeira página</span>
          </Button>
        )}

        {/* Página anterior */}
        <Button
          variant="outline"
          size="sm"
          onClick={onPreviousPage}
          disabled={!hasPrevious}
          className="flex items-center gap-1"
        >
          <ChevronLeft className="h-4 w-4" />
          {!isMobile && <span>Anterior</span>}
        </Button>

        {/* Números das páginas */}
        <div className="flex items-center gap-1">
          {pageNumbers.map((page, index) => {
            const isCurrentPage = page === currentPage
            const isEllipsis = false // Para futuro uso com reticências

            return (
              <Button
                key={`${page}-${index}`}
                variant={isCurrentPage ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange(page)}
                className={cn(
                  "min-w-[32px] h-8",
                  isCurrentPage && "bg-gray-800 text-white hover:bg-gray-900",
                  isMobile && "min-w-[28px] h-7 text-xs"
                )}
                disabled={isCurrentPage}
              >
                {page}
              </Button>
            )
          })}
        </div>

        {/* Próxima página */}
        <Button
          variant="outline"
          size="sm"
          onClick={onNextPage}
          disabled={!hasNext}
          className="flex items-center gap-1"
        >
          {!isMobile && <span>Próxima</span>}
          <ChevronRight className="h-4 w-4" />
        </Button>

        {/* Última página - apenas desktop */}
        {!isMobile && canGoLast && (
          <Button
            variant="outline"
            size="sm"
            onClick={onLastPage}
            className="hidden sm:flex"
          >
            <ChevronsRight className="h-4 w-4" />
            <span className="sr-only">Última página</span>
          </Button>
        )}
      </div>

      {/* Informações adicionais - apenas mobile */}
      {isMobile && (
        <div className="text-center text-xs text-gray-500">
          {startItem}-{endItem} de {totalItems}
        </div>
      )}
    </div>
  )
}

export default PaginationControls