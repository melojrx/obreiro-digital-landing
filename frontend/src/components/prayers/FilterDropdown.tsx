/**
 * Componente FilterDropdown - Filtros para pedidos de oração
 * Baseado na tela de filtros fornecida pelo usuário
 */

import { useState } from 'react'
import { Filter, ChevronDown, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import {
  PrayerCategory,
  PrayerStatus,
  PRAYER_CATEGORY_LABELS,
  PRAYER_STATUS_LABELS,
  PrayerFilters
} from '@/types/prayers'
import { cn } from '@/lib/utils'

interface FilterDropdownProps {
  filters: PrayerFilters
  onFiltersChange: (filters: PrayerFilters) => void
  className?: string
}

export function FilterDropdown({ 
  filters, 
  onFiltersChange, 
  className 
}: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)

  // Lista de todas as categorias
  const categories = Object.values(PrayerCategory)
  
  // Lista de status disponíveis
  const statuses = Object.values(PrayerStatus)

  // Manipula mudança de categoria
  const handleCategoryChange = (category: PrayerCategory, checked: boolean) => {
    const newFilters = { ...filters }
    
    if (checked) {
      newFilters.category = category
    } else {
      delete newFilters.category
    }
    
    onFiltersChange(newFilters)
  }

  // Manipula mudança de status
  const handleStatusChange = (status: PrayerStatus, checked: boolean) => {
    const newFilters = { ...filters }
    
    if (checked) {
      newFilters.status = status
    } else {
      delete newFilters.status
    }
    
    onFiltersChange(newFilters)
  }

  // Manipula mudança de ordenação
  const handleOrderingChange = (ordering: string) => {
    const newFilters = { ...filters, ordering }
    onFiltersChange(newFilters)
    setIsOpen(false)
  }

  // Limpa todos os filtros
  const clearFilters = () => {
    onFiltersChange({})
    setIsOpen(false)
  }

  // Conta filtros ativos
  const activeFiltersCount = [
    filters.category,
    filters.status,
    filters.search,
    filters.ordering
  ].filter(Boolean).length

  // Opções de ordenação
  const orderingOptions = [
    { value: '-created_at', label: 'Mais recentes primeiro' },
    { value: 'created_at', label: 'Mais antigos primeiro' },
    { value: 'title', label: 'Título A-Z' },
    { value: '-title', label: 'Título Z-A' },
    { value: '-prayers_count', label: 'Mais orações primeiro' },
    { value: 'prayers_count', label: 'Menos orações primeiro' },
  ]

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className={cn("text-xs sm:text-sm", className)}
          size="sm"
        >
          <Filter className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
          <span className="hidden sm:inline">Filtrar por motivo</span>
          <span className="sm:hidden">Filtros</span>
          {activeFiltersCount > 0 && (
            <Badge 
              variant="secondary" 
              className="ml-1 sm:ml-2 bg-blue-100 text-blue-800 text-xs px-1 sm:px-2"
            >
              {activeFiltersCount}
            </Badge>
          )}
          <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 ml-1 sm:ml-2" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent 
        align="start" 
        className="w-72 sm:w-80 max-h-96 overflow-y-auto"
      >
        {/* Cabeçalho com botão limpar */}
        <div className="flex items-center justify-between p-2">
          <DropdownMenuLabel className="p-0">Filtros</DropdownMenuLabel>
          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-6 px-2 text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              Limpar
            </Button>
          )}
        </div>

        <DropdownMenuSeparator />

        {/* Seção de Categorias */}
        <DropdownMenuLabel>Categoria</DropdownMenuLabel>
        <div className="max-h-48 overflow-y-auto">
          {categories.map(category => (
            <DropdownMenuCheckboxItem
              key={category}
              checked={filters.category === category}
              onCheckedChange={(checked) => handleCategoryChange(category, checked)}
            >
              {PRAYER_CATEGORY_LABELS[category]}
            </DropdownMenuCheckboxItem>
          ))}
        </div>

        <DropdownMenuSeparator />

        {/* Seção de Status */}
        <DropdownMenuLabel>Status</DropdownMenuLabel>
        {statuses.map(status => (
          <DropdownMenuCheckboxItem
            key={status}
            checked={filters.status === status}
            onCheckedChange={(checked) => handleStatusChange(status, checked)}
          >
            {PRAYER_STATUS_LABELS[status]}
          </DropdownMenuCheckboxItem>
        ))}

        <DropdownMenuSeparator />

        {/* Seção de Ordenação */}
        <DropdownMenuLabel>Ordenar por</DropdownMenuLabel>
        {orderingOptions.map(option => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => handleOrderingChange(option.value)}
            className={filters.ordering === option.value ? 'bg-blue-50' : ''}
          >
            <div className="flex items-center w-full">
              <span>{option.label}</span>
              {filters.ordering === option.value && (
                <div className="ml-auto w-2 h-2 bg-blue-600 rounded-full" />
              )}
            </div>
          </DropdownMenuItem>
        ))}

        {/* Rodapé com resumo */}
        {activeFiltersCount > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="p-2 text-xs text-gray-500 text-center">
              {activeFiltersCount} filtro{activeFiltersCount > 1 ? 's' : ''} ativo{activeFiltersCount > 1 ? 's' : ''}
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Componente de filtros ativos (badges) para mostrar filtros aplicados
interface ActiveFiltersProps {
  filters: PrayerFilters
  onRemoveFilter: (filterKey: keyof PrayerFilters) => void
  className?: string
}

export function ActiveFilters({ 
  filters, 
  onRemoveFilter, 
  className 
}: ActiveFiltersProps) {
  const activeFilters = []

  // Adiciona badge da categoria
  if (filters.category) {
    activeFilters.push({
      key: 'category' as const,
      label: PRAYER_CATEGORY_LABELS[filters.category],
      value: filters.category
    })
  }

  // Adiciona badge do status
  if (filters.status) {
    activeFilters.push({
      key: 'status' as const,
      label: PRAYER_STATUS_LABELS[filters.status],
      value: filters.status
    })
  }

  // Adiciona badge da busca
  if (filters.search) {
    activeFilters.push({
      key: 'search' as const,
      label: `"${filters.search}"`,
      value: filters.search
    })
  }

  if (activeFilters.length === 0) return null

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {activeFilters.map((filter) => (
        <Badge
          key={filter.key}
          variant="secondary"
          className="flex items-center gap-1 bg-blue-50 text-blue-700 hover:bg-blue-100"
        >
          <span>{filter.label}</span>
          <button
            onClick={() => onRemoveFilter(filter.key)}
            className="hover:bg-blue-200 rounded-full p-0.5"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
    </div>
  )
}

export default FilterDropdown