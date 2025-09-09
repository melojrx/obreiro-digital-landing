import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Save, X, Calendar, FileText, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { MembershipStatus, CreateMembershipStatusData } from '@/services/membersService';

// Schema de validação
const membershipStatusSchema = z.object({
  status: z.string().min(1, 'Função ministerial é obrigatória'),
  effective_date: z.string().min(1, 'Data efetiva é obrigatória'),
  end_date: z.string().optional(),
  reason: z.string().optional(),
}).refine((data) => {
  if (data.end_date && data.effective_date) {
    return new Date(data.end_date) > new Date(data.effective_date);
  }
  return true;
}, {
  message: "Data final deve ser posterior à data efetiva",
  path: ["end_date"]
});

type MembershipStatusFormData = z.infer<typeof membershipStatusSchema>;

interface MembershipStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateMembershipStatusData) => Promise<void>;
  memberId: number;
  memberName: string;
  status?: MembershipStatus; // Para edição
  isLoading?: boolean;
  title?: string;
}

export const MembershipStatusModal: React.FC<MembershipStatusModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  memberId,
  memberName,
  status, // Se fornecido, é edição
  isLoading = false,
  title,
}) => {
  const isEditing = Boolean(status);
  const modalTitle = title || (isEditing ? 'Editar Status Ministerial' : 'Adicionar Status Ministerial');

  const form = useForm<MembershipStatusFormData>({
    resolver: zodResolver(membershipStatusSchema),
    defaultValues: {
      status: status?.status || '',
      effective_date: status?.effective_date || new Date().toISOString().split('T')[0],
      end_date: status?.end_date || '',
      reason: status?.reason || '',
    },
  });

  const handleSubmit = async (data: MembershipStatusFormData) => {
    try {
      const submitData: CreateMembershipStatusData = {
        member: memberId,
        status: data.status,
        effective_date: data.effective_date,
        end_date: data.end_date || undefined,
        reason: data.reason || undefined,
        // Campos de compatibilidade
        ordination_date: data.effective_date,
        termination_date: data.end_date || undefined,
        observation: data.reason || undefined,
      };

      await onSubmit(submitData);
      form.reset();
      onClose();
    } catch (error) {
      console.error('Erro ao salvar status:', error);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      form.reset();
      onClose();
    }
  };

  const formatDateForInput = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toISOString().split('T')[0];
  };

  // Função para obter as opções disponíveis (simplificada)
  const getAvailableStatusOptions = () => {
    return [
      { value: 'member', label: 'Membro' }
    ];
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {modalTitle}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? `Edite as informações do status ministerial de ${memberName}`
              : `Adicione um novo status ministerial para ${memberName}`
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="space-y-4">
              {/* Função Ministerial */}
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Função Ministerial *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a função ministerial" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {getAvailableStatusOptions().map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Escolha a função ministerial que será atribuída ao membro
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Data Efetiva */}
                <FormField
                  control={form.control}
                  name="effective_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data Efetiva *</FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          {...field} 
                          className="flex items-center gap-2"
                        />
                      </FormControl>
                      <FormDescription>
                        Data em que a função entra em vigor
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Data Final (opcional) */}
                <FormField
                  control={form.control}
                  name="end_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data Final</FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          {...field} 
                          className="flex items-center gap-2"
                        />
                      </FormControl>
                      <FormDescription>
                        Data final da função (deixe vazio se ainda ativa)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Observações */}
              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Adicione observações sobre esta mudança de status..."
                        className="min-h-[100px] resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Informações adicionais sobre o motivo da mudança ou outras observações relevantes
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Informações contextuais */}
            {isEditing && (
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <h4 className="font-medium text-gray-900">Informações do Status Atual</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <p><strong>Status:</strong> {status?.status_display}</p>
                  <p><strong>Data de criação:</strong> {status?.created_at ? new Date(status.created_at).toLocaleString('pt-BR') : 'N/A'}</p>
                  {status?.changed_by_name && (
                    <p><strong>Criado por:</strong> {status.changed_by_name}</p>
                  )}
                  {status?.migrated_from_member && (
                    <p className="text-blue-600 font-medium">⚡ Migrado do sistema anterior</p>
                  )}
                </div>
              </div>
            )}

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
              >
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
              >
                <Save className="h-4 w-4 mr-2" />
                {isLoading 
                  ? 'Salvando...' 
                  : isEditing 
                    ? 'Atualizar' 
                    : 'Adicionar'
                }
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};