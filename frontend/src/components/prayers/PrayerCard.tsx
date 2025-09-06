/**
 * Componente PrayerCard - Card de pedido de oração
 * Design limpo baseado na imagem fornecida pelo usuário
 */

import { useState } from 'react'
import { Heart, MessageCircle, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  PrayerRequestListItem,
  PRAYER_CATEGORY_LABELS
} from '@/types/prayers'
import { usePrayerActions } from '@/hooks/usePrayers'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'

interface PrayerCardProps {
  prayer: PrayerRequestListItem
  onPrayToggle?: (prayer: PrayerRequestListItem, newState: { is_praying: boolean; prayers_count: number }) => void
  onMessageClick?: (prayer: PrayerRequestListItem) => void
  onCardClick?: (prayer: PrayerRequestListItem) => void
  showFullContent?: boolean
  className?: string
}

export function PrayerCard({
  prayer,
  onPrayToggle,
  onMessageClick,
  onCardClick,
  showFullContent = false,
  className
}: PrayerCardProps) {
  const { togglePrayer, loading } = usePrayerActions()
  const [localPrayerState, setLocalPrayerState] = useState({
    is_praying: prayer.is_praying,
    prayers_count: prayer.prayers_count
  })

  // Manipula clique no botão de oração
  const handlePrayToggle = async (e: React.MouseEvent) => {
    e.stopPropagation()
    
    try {
      const result = await togglePrayer(prayer.id, localPrayerState.is_praying)
      
      const newState = {
        is_praying: result.is_praying,
        prayers_count: result.prayers_count
      }
      
      setLocalPrayerState(newState)
      onPrayToggle?.(prayer, newState)
    } catch (error) {
      // Error handling is done in the hook
    }
  }

  // Manipula clique na mensagem
  const handleMessageClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onMessageClick?.(prayer)
  }

  // Manipula clique no card
  const handleCardClick = () => {
    onCardClick?.(prayer)
  }

  // Trunca texto se necessário
  const truncateText = (text: string, maxLength: number) => {
    if (showFullContent || text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

  // Formata data relativa
  const formatRelativeDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: ptBR
      })
    } catch {
      return 'há alguns dias'
    }
  }

  return (
    <Card 
      className={cn(
        'cursor-pointer transition-all duration-200 hover:shadow-sm border border-gray-200 h-full overflow-hidden',
        className
      )}
      onClick={handleCardClick}
    >
      <CardContent className="p-4 flex flex-col h-full overflow-hidden">
        {/* Header com nome e tempo */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0 pr-2">
            <h3 className="font-medium text-gray-900 text-sm leading-tight mb-1 break-words">
              {prayer.is_anonymous ? 'Anônimo' : prayer.author_name}
            </h3>
            <div className="flex items-center text-xs text-gray-500">
              <Clock className="h-3 w-3 mr-1 shrink-0" />
              <span className="break-words">{formatRelativeDate(prayer.created_at)}</span>
            </div>
          </div>
          <span className="text-xs text-gray-500 ml-2 shrink-0">
            {PRAYER_CATEGORY_LABELS[prayer.category as keyof typeof PRAYER_CATEGORY_LABELS]}
          </span>
        </div>

        {/* Título do pedido */}
        <h4 className="font-semibold text-gray-900 text-sm mb-2 break-words line-clamp-2">
          {prayer.title}
        </h4>

        {/* Conteúdo */}
        <p className="text-gray-700 text-sm leading-relaxed mb-4 flex-1 break-words">
          {truncateText(prayer.content, showFullContent ? 1000 : 150)}
        </p>

        {/* Status se respondido */}
        {prayer.status === 'answered' && (
          <div className="mb-3">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
              Respondido
            </span>
          </div>
        )}

        {/* Botões de ação - layout horizontal minimalista */}
        <div className="flex items-center gap-4 pt-2 border-t border-gray-100">
          {/* Botão de Oração */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePrayToggle}
            disabled={loading[prayer.id]}
            className={cn(
              "flex items-center space-x-1 text-xs h-7 px-2",
              localPrayerState.is_praying 
                ? "text-red-600 hover:text-red-700" 
                : "text-gray-600 hover:text-red-600"
            )}
          >
            <Heart
              className={cn(
                "h-3 w-3",
                localPrayerState.is_praying && "fill-current"
              )}
            />
            <span>{localPrayerState.prayers_count}</span>
          </Button>

          {/* Botão de Mensagem */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMessageClick}
            className="flex items-center space-x-1 text-xs text-gray-600 hover:text-blue-600 h-7 px-2"
          >
            <MessageCircle className="h-3 w-3" />
            <span>{prayer.messages_count}</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default PrayerCard