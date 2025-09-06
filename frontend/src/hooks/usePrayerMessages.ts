/**
 * Hook customizado para gerenciar mensagens de apoio nos pedidos de oração
 */

import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { PrayerMessage, CreateMessageRequest } from '@/types/prayers'
import { prayersService } from '@/services/prayersService'

/**
 * Hook para gerenciar mensagens de apoio de um pedido específico
 */
export function usePrayerMessages(requestId: number) {
  const [messages, setMessages] = useState<PrayerMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Carrega mensagens do pedido
  const loadMessages = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await prayersService.getMessages(requestId)
      setMessages(data)
    } catch (err) {
      setError('Erro ao carregar mensagens')
      console.error('Error loading messages:', err)
    } finally {
      setLoading(false)
    }
  }, [requestId])

  // Cria nova mensagem
  const createMessage = useCallback(async (data: CreateMessageRequest) => {
    try {
      setSubmitting(true)
      const newMessage = await prayersService.createMessage(requestId, data)
      
      // Adiciona a nova mensagem ao estado
      setMessages(prev => [...prev, newMessage])
      
      toast.success('Mensagem enviada com sucesso!')
      
      return newMessage
    } catch (error) {
      toast.error('Erro ao enviar mensagem')
      console.error('Error creating message:', error)
      throw error
    } finally {
      setSubmitting(false)
    }
  }, [requestId])

  // Atualiza uma mensagem existente
  const updateMessage = useCallback(async (messageId: number, content: string) => {
    try {
      const updatedMessage = await prayersService.updateMessage(requestId, messageId, content)
      
      // Atualiza a mensagem no estado
      setMessages(prev => 
        prev.map(msg => msg.id === messageId ? updatedMessage : msg)
      )
      
      toast.success('Mensagem atualizada!')
      
      return updatedMessage
    } catch (error) {
      toast.error('Erro ao atualizar mensagem')
      console.error('Error updating message:', error)
      throw error
    }
  }, [requestId])

  // Remove uma mensagem
  const deleteMessage = useCallback(async (messageId: number) => {
    try {
      await prayersService.deleteMessage(requestId, messageId)
      
      // Remove a mensagem do estado
      setMessages(prev => prev.filter(msg => msg.id !== messageId))
      
      toast.success('Mensagem removida!')
    } catch (error) {
      toast.error('Erro ao remover mensagem')
      console.error('Error deleting message:', error)
      throw error
    }
  }, [requestId])

  // Adiciona mensagem ao estado (para uso externo)
  const addMessage = useCallback((message: PrayerMessage) => {
    setMessages(prev => [...prev, message])
  }, [])

  // Atualiza mensagem no estado (para uso externo)
  const updateMessageInState = useCallback((updatedMessage: PrayerMessage) => {
    setMessages(prev => 
      prev.map(msg => msg.id === updatedMessage.id ? updatedMessage : msg)
    )
  }, [])

  // Remove mensagem do estado (para uso externo)
  const removeMessageFromState = useCallback((messageId: number) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId))
  }, [])

  return {
    messages,
    loading,
    error,
    submitting,
    loadMessages,
    createMessage,
    updateMessage,
    deleteMessage,
    addMessage,
    updateMessageInState,
    removeMessageFromState
  }
}

/**
 * Hook para formulário de nova mensagem
 */
export function useMessageForm() {
  const [content, setContent] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Reseta o formulário
  const resetForm = useCallback(() => {
    setContent('')
    setIsAnonymous(false)
  }, [])

  // Valida o formulário
  const validateForm = useCallback(() => {
    if (!content.trim()) {
      toast.error('Digite uma mensagem')
      return false
    }

    if (content.trim().length < 5) {
      toast.error('A mensagem deve ter pelo menos 5 caracteres')
      return false
    }

    if (content.trim().length > 500) {
      toast.error('A mensagem deve ter no máximo 500 caracteres')
      return false
    }

    return true
  }, [content])

  // Submete o formulário
  const submitMessage = useCallback(async (
    requestId: number,
    onSuccess?: (message: PrayerMessage) => void
  ) => {
    if (!validateForm()) return

    try {
      setSubmitting(true)
      
      const messageData: CreateMessageRequest = {
        content: content.trim(),
        is_anonymous: isAnonymous
      }

      const newMessage = await prayersService.createMessage(requestId, messageData)
      
      toast.success('Mensagem enviada!')
      resetForm()
      
      if (onSuccess) {
        onSuccess(newMessage)
      }

      return newMessage
    } catch (error) {
      toast.error('Erro ao enviar mensagem')
      console.error('Error submitting message:', error)
      throw error
    } finally {
      setSubmitting(false)
    }
  }, [content, isAnonymous, validateForm, resetForm])

  return {
    content,
    setContent,
    isAnonymous,
    setIsAnonymous,
    submitting,
    resetForm,
    validateForm,
    submitMessage,
    isValid: content.trim().length >= 5 && content.trim().length <= 500
  }
}