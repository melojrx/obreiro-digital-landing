import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { CalendarIcon, ClockIcon, MapPinIcon, UsersIcon, SaveIcon, XIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { 
  Activity, 
  CreateActivityData, 
  ACTIVITY_TYPES,
  Ministry 
} from '@/services/activityService';
import { useAuth } from '@/hooks/useAuth';

// Schema de validação
const activityFormSchema = z.object({
  name: z.string().min(1, 'Nome da atividade é obrigatório').max(200, 'Nome muito longo'),
  description: z.string().optional(),
  ministry_id: z.number().min(1, 'Selecione um ministério'),
  branch_id: z.number().min(1, 'Selecione uma filial'),
  activity_type: z.string().min(1, 'Selecione o tipo de atividade'),
  start_date: z.date({ required_error: 'Data de início é obrigatória' }),
  start_time: z.string().min(1, 'Horário de início é obrigatório'),
  end_date: z.date({ required_error: 'Data de término é obrigatória' }),
  end_time: z.string().min(1, 'Horário de término é obrigatório'),
  location: z.string().optional(),
  max_participants: z.number().optional(),
  requires_registration: z.boolean().default(false),
  is_public: z.boolean().default(false),
  is_recurring: z.boolean().default(false),
  recurrence_pattern: z.string().optional(),
  recurrence_end_date: z.date().optional(),
  notes: z.string().optional(),
}).refine((data) => {
  // Validar se data/hora de término é posterior ao início
  const startDateTime = new Date(`${format(data.start_date, 'yyyy-MM-dd')}T${data.start_time}`);
  const endDateTime = new Date(`${format(data.end_date, 'yyyy-MM-dd')}T${data.end_time}`);
  return endDateTime > startDateTime;
}, {
  message: 'Data/hora de término deve ser posterior ao início',
  path: ['end_time'],
});

type ActivityFormData = z.infer<typeof activityFormSchema>;

interface ActivityFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateActivityData) => void;
  activity?: Activity; // Para edição
  ministries: Ministry[];
  branches: Array<{ id: number; name: string }>;
  isLoading?: boolean;
}

export const ActivityForm: React.FC<ActivityFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  activity,
  ministries = [],
  branches = [],
  isLoading = false,
}) => {
  const { userChurch } = useAuth();
  const currentChurch = userChurch?.church;
  const isEditing = !!activity;

  const form = useForm<ActivityFormData>({
    resolver: zodResolver(activityFormSchema),
    defaultValues: {
      name: '',
      description: '',
      ministry_id: 0,
      branch_id: 0,
      activity_type: 'worship',
      start_date: new Date(),
      start_time: '19:00',
      end_date: new Date(),
      end_time: '21:00',
      location: '',
      max_participants: undefined,
      requires_registration: false,
      is_public: false,
      is_recurring: false,
      recurrence_pattern: '',
      notes: '',
    },
  });

  // Preencher formulário quando estiver editando
  useEffect(() => {
    if (activity && isOpen) {
      const startDateTime = new Date(activity.start_datetime);
      const endDateTime = new Date(activity.end_datetime);

      form.reset({
        name: activity.name,
        description: activity.description || '',
        ministry_id: activity.ministry,
        branch_id: activity.branch,
        activity_type: activity.activity_type,
        start_date: startDateTime,
        start_time: format(startDateTime, 'HH:mm'),
        end_date: endDateTime,
        end_time: format(endDateTime, 'HH:mm'),
        location: activity.location || '',
        max_participants: activity.max_participants || undefined,
        requires_registration: activity.requires_registration,
        is_public: activity.is_public,
        is_recurring: activity.is_recurring,
        recurrence_pattern: activity.recurrence_pattern || '',
        recurrence_end_date: activity.recurrence_end_date ? new Date(activity.recurrence_end_date) : undefined,
        notes: activity.notes || '',
      });
    } else if (isOpen && !isEditing) {
      // Reset para valores padrão quando criar nova atividade
      form.reset();
    }
  }, [activity, isOpen, isEditing, form]);

  const handleSubmit = (data: ActivityFormData) => {
    if (!currentChurch) return;

    // Combinar data e hora
    const startDateTime = new Date(`${format(data.start_date, 'yyyy-MM-dd')}T${data.start_time}`);
    const endDateTime = new Date(`${format(data.end_date, 'yyyy-MM-dd')}T${data.end_time}`);

    const activityData: CreateActivityData = {
      church: currentChurch.id,
      branch: data.branch_id,
      ministry: data.ministry_id,
      name: data.name,
      description: data.description || '',
      activity_type: data.activity_type,
      start_datetime: startDateTime.toISOString(),
      end_datetime: endDateTime.toISOString(),
      location: data.location || '',
      max_participants: data.max_participants || undefined,
      requires_registration: data.requires_registration,
      is_public: data.is_public,
      is_recurring: data.is_recurring,
      recurrence_pattern: data.is_recurring ? data.recurrence_pattern : '',
      recurrence_end_date: data.recurrence_end_date ? data.recurrence_end_date.toISOString().split('T')[0] : undefined,
      notes: data.notes || '',
    };

    onSubmit(activityData);
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            {isEditing ? 'Editar Atividade' : 'Nova Atividade'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Informações Básicas */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Informações Básicas</h3>
              
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da Atividade *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Culto de Domingo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Descreva a atividade..."
                        className="min-h-20"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="ministry_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ministério *</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o ministério" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {ministries.map((ministry) => (
                            <SelectItem key={ministry.id} value={ministry.id.toString()}>
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: ministry.color }}
                                />
                                {ministry.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="branch_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Filial *</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a filial" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {branches.map((branch) => (
                            <SelectItem key={branch.id} value={branch.id.toString()}>
                              {branch.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="activity_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Atividade *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(ACTIVITY_TYPES).map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Data e Hora */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <ClockIcon className="h-5 w-5" />
                Data e Hora
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="start_date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Data de Início *</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                              ) : (
                                <span>Selecionar data</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date < new Date(new Date().setHours(0, 0, 0, 0))
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="start_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Horário de Início *</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="end_date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Data de Término *</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                              ) : (
                                <span>Selecionar data</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date < new Date(new Date().setHours(0, 0, 0, 0))
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="end_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Horário de Término *</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Local e Participantes */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <MapPinIcon className="h-5 w-5" />
                Local e Participantes
              </h3>

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Local Específico</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Santuário, Salão de Eventos..." {...field} />
                    </FormControl>
                    <FormDescription>
                      Deixe vazio para usar o endereço da filial
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="max_participants"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Limite de Participantes</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Ilimitado"
                          min="1"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormDescription>
                        Deixe vazio para permitir participação ilimitada
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="requires_registration"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Requer Inscrição
                          </FormLabel>
                          <FormDescription>
                            Participantes precisam se inscrever previamente
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="is_public"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Atividade Pública
                          </FormLabel>
                          <FormDescription>
                            Aparece no calendário público para visitantes
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>

            {/* Recorrência */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="is_recurring"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Atividade Recorrente
                      </FormLabel>
                      <FormDescription>
                        Esta atividade se repete regularmente
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {form.watch('is_recurring') && (
                <div className="space-y-4 pl-4 border-l-2 border-muted">
                  <FormField
                    control={form.control}
                    name="recurrence_pattern"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Padrão de Recorrência</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a frequência" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="weekly">Semanal</SelectItem>
                            <SelectItem value="biweekly">Quinzenal</SelectItem>
                            <SelectItem value="monthly">Mensal</SelectItem>
                            <SelectItem value="custom">Personalizado</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="recurrence_end_date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Data Final da Recorrência</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                                ) : (
                                  <span>Selecionar data limite</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date < new Date(new Date().setHours(0, 0, 0, 0))
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormDescription>
                          Deixe vazio para recorrência sem fim
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </div>

            {/* Observações */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações Internas</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Anotações para a organização..."
                      className="min-h-20"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Estas observações são apenas para uso interno
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={handleClose}>
                <XIcon className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                <SaveIcon className="h-4 w-4 mr-2" />
                {isLoading ? 'Salvando...' : isEditing ? 'Atualizar' : 'Criar Atividade'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ActivityForm;