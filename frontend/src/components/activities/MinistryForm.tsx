import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  ChurchIcon, 
  SaveIcon, 
  XIcon, 
  UserIcon,
  PaletteIcon,
  EyeIcon,
  EyeOffIcon
} from 'lucide-react';
import { Ministry, CreateMinistryData, MINISTRY_COLORS } from '@/services/activityService';
import { useAuth } from '@/hooks/useAuth';

// Schema de validação
const ministryFormSchema = z.object({
  name: z.string()
    .min(1, 'Nome do ministério é obrigatório')
    .max(100, 'Nome muito longo (máximo 100 caracteres)'),
  description: z.string().optional(),
  leader: z.number().optional(),
  color: z.string()
    .min(1, 'Selecione uma cor para o ministério')
    .regex(/^#[0-9A-F]{6}$/i, 'Formato de cor inválido'),
  is_public: z.boolean().default(true),
});

type MinistryFormData = z.infer<typeof ministryFormSchema>;

interface MinistryFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateMinistryData) => void;
  ministry?: Ministry;
  availableLeaders?: Array<{ id: number; name: string; role: string }>;
  isLoading?: boolean;
}

export const MinistryForm: React.FC<MinistryFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  ministry,
  availableLeaders = [],
  isLoading = false,
}) => {
  const { userChurch } = useAuth();
  const isEditing = !!ministry;
  
  const currentChurch = userChurch?.church;


  const form = useForm<MinistryFormData>({
    resolver: zodResolver(ministryFormSchema),
    defaultValues: {
      name: '',
      description: '',
      leader: undefined,
      color: MINISTRY_COLORS[0], // Primeira cor como padrão
      is_public: true,
    },
  });

  // Preencher formulário quando estiver editando
  useEffect(() => {
    if (ministry && isOpen) {
      form.reset({
        name: ministry.name,
        description: ministry.description || '',
        leader: ministry.leader || undefined,
        color: ministry.color,
        is_public: ministry.is_public,
      });
    } else if (isOpen && !isEditing) {
      // Reset para valores padrão quando criar novo ministério
      form.reset({
        name: '',
        description: '',
        leader: undefined,
        color: MINISTRY_COLORS[0],
        is_public: true,
      });
    }
  }, [ministry, isOpen, isEditing, form]);

  const handleSubmit = (data: MinistryFormData) => {
    console.log('🔍 MinistryForm handleSubmit - currentChurch:', currentChurch);
    console.log('🔍 MinistryForm handleSubmit - data:', data);
    
    if (!currentChurch) {
      console.error('❌ CurrentChurch não disponível');
      return;
    }

    const ministryData: CreateMinistryData = {
      church: currentChurch.id,
      name: data.name,
      description: data.description || '',
      leader: data.leader || undefined,
      color: data.color,
      is_public: data.is_public,
    };

    onSubmit(ministryData);
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };


  return (
    <Dialog open={isOpen} onOpenChange={handleClose} modal>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto z-[60]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ChurchIcon className="h-5 w-5" />
            {isEditing ? 'Editar Ministério' : 'Novo Ministério'}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? 'Edite as informações do ministério' : 'Crie um novo ministério para sua igreja'}
          </DialogDescription>
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
                    <FormLabel>Nome do Ministério *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ex: Louvor, Jovens, Crianças, Mulheres..."
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Nome que aparecerá nas atividades e calendários
                    </FormDescription>
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
                        placeholder="Descreva o propósito e atividades do ministério..."
                        className="min-h-24"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Descrição opcional que ajuda a identificar o ministério
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Líder do Ministério */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <UserIcon className="h-5 w-5" />
                Liderança
              </h3>

              <FormField
                control={form.control}
                name="leader"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Líder Responsável</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        if (value === 'no-leader') {
                          field.onChange(undefined);
                        } else {
                          field.onChange(parseInt(value));
                        }
                      }}
                      value={field.value?.toString() || 'no-leader'}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o líder do ministério" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="no-leader">Sem líder definido</SelectItem>
                        {availableLeaders.map((leader) => (
                          <SelectItem key={leader.id} value={leader.id.toString()}>
                            <div className="flex items-center gap-2">
                              <UserIcon className="h-4 w-4" />
                              <span>{leader.name}</span>
                              <Badge variant="outline" className="text-xs">
                                {leader.role}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Pessoa responsável por liderar e coordenar o ministério
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Aparência e Visibilidade */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <PaletteIcon className="h-5 w-5" />
                Aparência e Visibilidade
              </h3>

              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cor do Ministério *</FormLabel>
                    <FormControl>
                      <div className="space-y-4">
                        {/* Preview da cor selecionada */}
                        <Card className="p-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-8 h-8 rounded-full border-2 border-white shadow-md"
                              style={{ backgroundColor: field.value }}
                            />
                            <div>
                              <p className="font-medium">Preview do Ministério</p>
                              <div className="flex items-center gap-2 mt-1">
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: field.value }}
                                />
                                <span className="text-sm text-muted-foreground">
                                  {form.watch('name') || 'Nome do Ministério'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </Card>

                        {/* Paleta de cores */}
                        <div className="grid grid-cols-5 gap-3">
                          {MINISTRY_COLORS.map((color) => (
                            <button
                              key={color}
                              type="button"
                              className={`w-12 h-12 rounded-lg border-2 transition-all hover:scale-110 ${
                                field.value === color 
                                  ? 'border-gray-900 shadow-lg ring-2 ring-offset-2 ring-gray-300' 
                                  : 'border-gray-200 hover:border-gray-400'
                              }`}
                              style={{ backgroundColor: color }}
                              onClick={() => field.onChange(color)}
                              title={`Cor: ${color}`}
                            />
                          ))}
                        </div>

                        {/* Input manual da cor */}
                        <div className="flex items-center gap-2">
                          <Input
                            type="color"
                            value={field.value}
                            onChange={(e) => field.onChange(e.target.value)}
                            className="w-16 h-10 p-1 border-2"
                          />
                          <Input
                            type="text"
                            value={field.value}
                            onChange={(e) => field.onChange(e.target.value)}
                            placeholder="#3b82f6"
                            className="font-mono text-sm"
                          />
                        </div>
                      </div>
                    </FormControl>
                    <FormDescription>
                      Esta cor será usada para identificar o ministério nos calendários e atividades
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_public"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <FormLabel className="text-base font-medium">
                          Ministério Público
                        </FormLabel>
                        {field.value ? (
                          <EyeIcon className="h-4 w-4 text-green-600" />
                        ) : (
                          <EyeOffIcon className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                      <FormDescription>
                        {field.value 
                          ? 'Este ministério e suas atividades aparecerão no calendário público para visitantes'
                          : 'Este ministério será visível apenas para membros autenticados'
                        }
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

            {/* Informações adicionais para edição */}
            {isEditing && ministry && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Estatísticas</h3>
                <div className="grid grid-cols-2 gap-4">
                  <Card className="p-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">
                        {ministry.total_activities}
                      </p>
                      <p className="text-sm text-muted-foreground">Atividades</p>
                    </div>
                  </Card>
                  <Card className="p-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">
                        {ministry.total_members}
                      </p>
                      <p className="text-sm text-muted-foreground">Membros</p>
                    </div>
                  </Card>
                </div>
              </div>
            )}

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={handleClose}>
                <XIcon className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                <SaveIcon className="h-4 w-4 mr-2" />
                {isLoading 
                  ? 'Salvando...' 
                  : isEditing 
                    ? 'Atualizar Ministério' 
                    : 'Criar Ministério'
                }
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default MinistryForm;