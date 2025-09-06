/**
 * Componente SearchBar - Barra de busca para pedidos de oração
 */

import { useState, useEffect, useRef } from 'react'
import { Search, X, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useDebounce } from '@/hooks/useDebounce'

interface SearchBarProps {
  value?: string
  placeholder?: string
  onSearch: (query: string) => void
  onClear?: () => void
  loading?: boolean
  autoFocus?: boolean
  className?: string
  debounceMs?: number
}

export function SearchBar({
  value = '',
  placeholder = 'Buscar por nome do autor ou mensagem',
  onSearch,
  onClear,
  loading = false,
  autoFocus = false,
  className,
  debounceMs = 300
}: SearchBarProps) {
  const [localValue, setLocalValue] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)
  
  // Debounce da busca
  const debouncedValue = useDebounce(localValue, debounceMs)

  // Executa busca quando o valor debounced muda
  useEffect(() => {
    if (debouncedValue !== value) {
      onSearch(debouncedValue)
    }
  }, [debouncedValue, onSearch, value])

  // Atualiza valor local quando prop value muda
  useEffect(() => {
    setLocalValue(value)
  }, [value])

  // Manipula mudança no input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value)
  }

  // Manipula limpeza
  const handleClear = () => {
    setLocalValue('')
    onClear?.()
    inputRef.current?.focus()
  }

  // Manipula Enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      onSearch(localValue)
    }
    
    if (e.key === 'Escape') {
      if (localValue) {
        handleClear()
      } else {
        inputRef.current?.blur()
      }
    }
  }

  return (
    <div className={cn('relative', className)}>
      {/* Ícone de busca */}
      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Search className="h-4 w-4" />
        )}
      </div>

      {/* Input de busca */}
      <Input
        ref={inputRef}
        type="text"
        value={localValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className={cn(
          'pl-10 pr-10',
          localValue && 'pr-20' // Mais espaço quando tem valor (para o botão de limpar)
        )}
      />

      {/* Botão de limpar */}
      {localValue && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleClear}
          className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-100"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Limpar busca</span>
        </Button>
      )}
    </div>
  )
}

export default SearchBar