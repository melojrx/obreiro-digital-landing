/**
 * Modal de detalhes do pedido de oração com mensagens de apoio
 * Baseado na tela fornecida pelo usuário
 */

import { useState, useEffect } from 'react'
import { Heart, MessageCircle, Clock, User, Send, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  PrayerRequest,
  PrayerMessage,
  PRAYER_CATEGORY_LABELS
} from '@/types/prayers'
import { prayersService } from '@/services/prayersService'
import { usePrayerActions } from '@/hooks/usePrayers'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface PrayerDetailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  prayerId?: number
  onPrayToggle?: (newState: { is_praying: boolean; prayers_count: number }) => void
}

export function PrayerDetailModal({
  open,
  onOpenChange,
  prayerId,
  onPrayToggle
}: PrayerDetailModalProps) {
  const [prayer, setPrayer] = useState<PrayerRequest | null>(null)
  const [messages, setMessages] = useState<PrayerMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [newMessage, setNewMessage] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [sendingMessage, setSendingMessage] = useState(false)
  
  const { togglePrayer, loading: prayerLoading } = usePrayerActions()
  const [localPrayerState, setLocalPrayerState] = useState({
    is_praying: false,
    prayers_count: 0
  })

  // Carrega dados do pedido de oração
  useEffect(() => {
    if (open && prayerId) {
      loadPrayerDetails()
      loadMessages()
    }
  }, [open, prayerId])

  const loadPrayerDetails = async () => {
    if (!prayerId) return
    
    try {
      setLoading(true)
      const prayerData = await prayersService.getPrayerRequest(prayerId)
      setPrayer(prayerData)
      setLocalPrayerState({
        is_praying: prayerData.is_praying,
        prayers_count: prayerData.prayers_count
      })
    } catch (error) {
      toast.error('Erro ao carregar pedido de oração')
      console.error('Error loading prayer:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadMessages = async () => {
    if (!prayerId) return
    
    try {
      setMessagesLoading(true)
      const messagesData = await prayersService.getMessages(prayerId)
      setMessages(messagesData)
    } catch (error) {
      // Se for 404, significa que não há mensagens - não é um erro
      const axiosError = error as any
      if (axiosError?.response?.status === 404) {
        setMessages([])
      } else {
        toast.error('Erro ao carregar mensagens')
        console.error('Error loading messages:', error)
      }
    } finally {
      setMessagesLoading(false)
    }
  }

  // Manipula clique no botão de oração
  const handlePrayToggle = async () => {
    if (!prayer) return
    
    try {
      const result = await togglePrayer(prayer.id, localPrayerState.is_praying)
      
      const newState = {
        is_praying: result.is_praying,
        prayers_count: result.prayers_count
      }
      
      setLocalPrayerState(newState)
      onPrayToggle?.(newState)
    } catch (error) {
      // Error handling is done in the hook
    }
  }

  // Envia nova mensagem
  const handleSendMessage = async () => {
    if (!prayer || !newMessage.trim()) return

    try {
      setSendingMessage(true)
      const messageData = await prayersService.createMessage(prayer.id, {
        content: newMessage.trim(),
        is_anonymous: isAnonymous
      })
      
      setMessages(prev => [...prev, messageData])
      setNewMessage('')
      setIsAnonymous(false)
      toast.success('Mensagem enviada com sucesso!')
    } catch (error) {
      toast.error('Erro ao enviar mensagem')
      console.error('Error sending message:', error)
    } finally {
      setSendingMessage(false)
    }
  }

  // Formata data relativa
  const formatRelativeDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: false,
        locale: ptBR
      })
    } catch {
      return 'há alguns dias'
    }
  }

  if (loading || !prayer) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl w-[95vw] sm:w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
              <p className="text-gray-600">Carregando pedido...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-[95vw] sm:w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-center">
            Pedidos de Oração
          </DialogTitle>
          <DialogDescription className="sr-only">
            Detalhes do pedido de oração com mensagens de apoio
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Categoria */}
          <div className="text-center">
            <span className="text-lg font-medium text-gray-900">
              {PRAYER_CATEGORY_LABELS[prayer.category as keyof typeof PRAYER_CATEGORY_LABELS]}
            </span>
          </div>

          {/* Autor e Data */}
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center">
              <User className="h-4 w-4 mr-2" />
              <span>{prayer.is_anonymous ? 'Anônimo' : prayer.author_name}</span>
            </div>
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-2" />
              <span>{formatRelativeDate(prayer.created_at)}</span>
            </div>
          </div>

          {/* Título */}
          <div>
            <h3 className="font-semibold text-gray-900 text-lg mb-2">
              {prayer.title}
            </h3>
          </div>

          {/* Conteúdo */}
          <div>
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {prayer.content}
            </p>
          </div>

          {/* Botões de Ação */}
          <div className="flex gap-4">
            {/* Botão de Oração */}
            <Button
              onClick={handlePrayToggle}
              disabled={prayerLoading[prayer.id]}
              className={cn(
                "flex-1 flex items-center justify-center space-x-2",
                localPrayerState.is_praying 
                  ? "bg-red-50 text-red-600 border-red-200 hover:bg-red-100" 
                  : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
              )}
              variant="outline"
            >
              <Heart
                className={cn(
                  "h-4 w-4",
                  localPrayerState.is_praying && "fill-current"
                )}
              />
              <span>Orando</span>
              <span className="bg-white px-2 py-1 rounded-full text-sm">
                {localPrayerState.prayers_count}
              </span>
            </Button>

            {/* Botão de Mensagem */}
            <Button
              variant="outline"
              className="flex-1 flex items-center justify-center space-x-2 bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100"
            >
              <MessageCircle className="h-4 w-4" />
              <span>Enviar mensagem</span>
            </Button>
          </div>

          {/* Formulário de Nova Mensagem */}
          <div className="border-t pt-6">
            <div className="space-y-4">
              <Textarea
                placeholder="Escreva uma mensagem de apoio..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                rows={3}
                className="resize-none"
              />
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="anonymous"
                    checked={isAnonymous}
                    onCheckedChange={(checked) => setIsAnonymous(checked as boolean)}
                  />
                  <label 
                    htmlFor="anonymous" 
                    className="text-sm text-gray-600 cursor-pointer"
                  >
                    Enviar como anônimo
                  </label>
                </div>
                
                <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sendingMessage}
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  <Send className="h-4 w-4" />
                  <span>{sendingMessage ? 'Enviando...' : 'Enviar'}</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Lista de Mensagens */}
          <div className="border-t pt-6">
            <h4 className="font-medium text-gray-900 mb-4">
              Mensagens de apoio ({messages.length})
            </h4>
            
            {messagesLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">Carregando mensagens...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Ainda não há mensagens.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div key={message.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-900">
                          {message.is_anonymous ? 'Anônimo' : message.author_name}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {formatRelativeDate(message.created_at)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {message.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default PrayerDetailModal