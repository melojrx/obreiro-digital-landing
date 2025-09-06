/**
 * Modal para criar/editar pedidos de oração
 * Baseado na tela "Fazer Pedido" fornecida pelo usuário
 */

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  PrayerCategory,
  PRAYER_CATEGORY_LABELS,
  PrayerRequestForm,
  PrayerRequest
} from '@/types/prayers'
import { prayersService } from '@/services/prayersService'
import { toast } from 'sonner'

// Schema de validação
const prayerRequestSchema = z.object({
  title: z.string()
    .min(5, 'O título deve ter pelo menos 5 caracteres')
    .max(100, 'O título deve ter no máximo 100 caracteres'),
  
  content: z.string()
    .min(10, 'A descrição deve ter pelo menos 10 caracteres')
    .max(1000, 'A descrição deve ter no máximo 1000 caracteres'),
  
  category: z.nativeEnum(PrayerCategory, {
    required_error: 'Selecione uma categoria'
  }),
  
  is_anonymous: z.boolean().default(false),
  allow_visit: z.boolean().default(false),
  allow_contact: z.boolean().default(false),
  publish_on_wall: z.boolean().default(true),
})

type PrayerRequestFormData = z.infer<typeof prayerRequestSchema>

interface CreatePrayerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingPrayer?: PrayerRequest | null
  onSuccess?: (prayer: PrayerRequest) => void
}

export function CreatePrayerModal({
  open,
  onOpenChange,
  editingPrayer,
  onSuccess
}: CreatePrayerModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<PrayerRequestFormData>({
    resolver: zodResolver(prayerRequestSchema),
    defaultValues: {
      title: '',
      content: '',
      category: PrayerCategory.PERSONAL,
      is_anonymous: false,
      allow_visit: false,
      allow_contact: false,
      publish_on_wall: true,
    }
  })

  // Carrega dados para edição
  useEffect(() => {
    if (editingPrayer && open) {
      form.reset({
        title: editingPrayer.title,
        content: editingPrayer.content,
        category: editingPrayer.category,
        is_anonymous: editingPrayer.is_anonymous,
        allow_visit: editingPrayer.allow_visit,
        allow_contact: editingPrayer.allow_contact,
        publish_on_wall: editingPrayer.publish_on_wall,
      })
    } else if (open) {
      // Reset para novo pedido
      form.reset()
    }
  }, [editingPrayer, open, form])


  // Submete o formulário
  const onSubmit = async (data: PrayerRequestFormData) => {
    try {
      setIsSubmitting(true)

      const formData: PrayerRequestForm = {
        ...data
      }

      let result: PrayerRequest

      if (editingPrayer) {
        // Atualiza pedido existente
        result = await prayersService.updatePrayerRequest(editingPrayer.id, formData)
        toast.success('Pedido atualizado com sucesso!')
      } else {
        // Cria novo pedido
        result = await prayersService.createPrayerRequest(formData)
        toast.success('Pedido criado com sucesso!')
      }

      onSuccess?.(result)
      onOpenChange(false)
      
    } catch (error) {
      toast.error(editingPrayer ? 'Erro ao atualizar pedido' : 'Erro ao criar pedido')
      console.error('Error submitting prayer request:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Categorias como array para o Select
  const categoryOptions = Object.entries(PRAYER_CATEGORY_LABELS).map(([value, label]) => ({
    value,
    label
  }))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-[95vw] sm:w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader className="pb-2 sm:pb-4">
          <DialogTitle className="text-lg sm:text-xl">
            {editingPrayer ? 'Editar Pedido de Oração' : 'Fazer Pedido'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
            
            {/* Categoria */}
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Qual o motivo do seu pedido?</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Escolha o motivo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categoryOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Nome (título) */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Qual o seu nome?</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Insira seu nome" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Este será o título do seu pedido
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Conteúdo */}
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>O que gostaria de pedir?</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Insira aqui a mensagem"
                      rows={6}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {field.value?.length || 0}/1000 caracteres
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />


            {/* Opções de Privacidade */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="allow_visit"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Deseja receber a visita de algum membro?
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="allow_contact"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Deseja receber uma ligação de algum membro?
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="publish_on_wall"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Gostaria de deixar o seu pedido publicado no mural?
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_anonymous"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Pedido anônimo
                      </FormLabel>
                      <FormDescription>
                        Seu nome não será exibido no pedido
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            {/* Botões */}
            <div className="flex flex-col sm:flex-row justify-end gap-2 sm:space-x-2 pt-4 sm:pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
                className="w-full sm:w-auto order-2 sm:order-1"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full sm:w-auto order-1 sm:order-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    <span className="hidden sm:inline">{editingPrayer ? 'Atualizando...' : 'Criando...'}</span>
                    <span className="sm:hidden">Salvando...</span>
                  </>
                ) : (
                  'Confirmar'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default CreatePrayerModal