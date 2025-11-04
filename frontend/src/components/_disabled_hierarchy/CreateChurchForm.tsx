/**
 * Formulário para Criar Nova Igreja
 * Formulário multi-step integrado com validação e sistema existente
 */

import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { 
  Building2, 
  MapPin, 
  User, 
  Mail, 
  Phone, 
  Globe, 
  FileText, 
  Users,
  ArrowLeft,
  ArrowRight,
  Check,
  AlertCircle,
} from 'lucide-react';

// Hooks
import { useDenominations } from '@/hooks/useDenominations';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

// Tipos
import { CreateChurchFormData } from '@/types/hierarchy';

// Validação com Zod
const createChurchSchema = z.object({
  // Dados da Igreja
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  short_name: z.string().optional(),
  description: z.string().optional(),
  email: z.string().email('Email inválido'),
  phone: z.string().min(10, 'Telefone deve ter pelo menos 10 caracteres'),
  website: z.string().url('URL inválida').optional().or(z.literal('')),
  
  // Endereço
  address: z.string().min(10, 'Endereço deve ser mais detalhado'),
  city: z.string().min(2, 'Cidade é obrigatória'),
  state: z.string().min(2, 'Estado é obrigatório'),
  zipcode: z.string().min(8, 'CEP deve ter 8 caracteres'),
  
  // CNPJ (opcional)
  cnpj: z.string().optional(),
  
  // Dados do Pastor
  pastor_name: z.string().min(2, 'Nome do pastor é obrigatório'),
  pastor_email: z.string().email('Email do pastor inválido'),
  pastor_phone: z.string().min(10, 'Telefone do pastor obrigatório'),
  
  // Configurações
  max_members: z.number().min(1, 'Limite mínimo: 1 membro').optional(),
  max_branches: z.number().min(0, 'Limite não pode ser negativo').optional(),
  subscription_plan: z.enum(['basic', 'premium', 'enterprise']).optional(),
});

type CreateChurchFormValues = z.infer<typeof createChurchSchema>;

interface CreateChurchFormProps {
  denominationId: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (church: any) => void;
  className?: string;
}

// Estados brasileiros
const BRAZILIAN_STATES = [
  { value: 'AC', label: 'Acre' },
  { value: 'AL', label: 'Alagoas' },
  { value: 'AP', label: 'Amapá' },
  { value: 'AM', label: 'Amazonas' },
  { value: 'BA', label: 'Bahia' },
  { value: 'CE', label: 'Ceará' },
  { value: 'DF', label: 'Distrito Federal' },
  { value: 'ES', label: 'Espírito Santo' },
  { value: 'GO', label: 'Goiás' },
  { value: 'MA', label: 'Maranhão' },
  { value: 'MT', label: 'Mato Grosso' },
  { value: 'MS', label: 'Mato Grosso do Sul' },
  { value: 'MG', label: 'Minas Gerais' },
  { value: 'PA', label: 'Pará' },
  { value: 'PB', label: 'Paraíba' },
  { value: 'PR', label: 'Paraná' },
  { value: 'PE', label: 'Pernambuco' },
  { value: 'PI', label: 'Piauí' },
  { value: 'RJ', label: 'Rio de Janeiro' },
  { value: 'RN', label: 'Rio Grande do Norte' },
  { value: 'RS', label: 'Rio Grande do Sul' },
  { value: 'RO', label: 'Rondônia' },
  { value: 'RR', label: 'Roraima' },
  { value: 'SC', label: 'Santa Catarina' },
  { value: 'SP', label: 'São Paulo' },
  { value: 'SE', label: 'Sergipe' },
  { value: 'TO', label: 'Tocantins' },
];

// Planos de assinatura
const SUBSCRIPTION_PLANS = [
  { value: 'basic', label: 'Básico', description: 'Até 100 membros' },
  { value: 'premium', label: 'Premium', description: 'Até 500 membros' },
  { value: 'enterprise', label: 'Enterprise', description: 'Ilimitado' },
];

// Steps do formulário
const FORM_STEPS = [
  { id: 'church', title: 'Dados da Igreja', icon: Building2 },
  { id: 'location', title: 'Localização', icon: MapPin },
  { id: 'pastor', title: 'Pastor Responsável', icon: User },
  { id: 'settings', title: 'Configurações', icon: Users },
];

export const CreateChurchForm: React.FC<CreateChurchFormProps> = ({
  denominationId,
  isOpen,
  onClose,
  onSuccess,
  className,
}) => {
  const { createChurch, isCreatingChurch } = useDenominations();
  const { user } = useAuth();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const form = useForm<CreateChurchFormValues>({
    resolver: zodResolver(createChurchSchema),
    defaultValues: {
      name: '',
      short_name: '',
      description: '',
      email: '',
      phone: '',
      website: '',
      address: '',
      city: '',
      state: '',
      zipcode: '',
      cnpj: '',
      pastor_name: '',
      pastor_email: user?.email || '',
      pastor_phone: user?.phone || '',
      max_members: 100,
      max_branches: 5,
      subscription_plan: 'basic',
    },
  });

  const { handleSubmit, formState: { errors, isValid }, watch, trigger, reset } = form;

  // Validar step atual
  const validateCurrentStep = async () => {
    const stepFields = getStepFields(currentStep);
    const isStepValid = await trigger(stepFields);
    return isStepValid;
  };

  // Campos por step
  const getStepFields = (step: number): (keyof CreateChurchFormValues)[] => {
    switch (step) {
      case 0: // Dados da Igreja
        return ['name', 'short_name', 'description', 'email', 'phone', 'website'];
      case 1: // Localização
        return ['address', 'city', 'state', 'zipcode', 'cnpj'];
      case 2: // Pastor
        return ['pastor_name', 'pastor_email', 'pastor_phone'];
      case 3: // Configurações
        return ['max_members', 'max_branches', 'subscription_plan'];
      default:
        return [];
    }
  };

  // Navegação entre steps
  const nextStep = async () => {
    if (await validateCurrentStep()) {
      setCurrentStep(Math.min(currentStep + 1, FORM_STEPS.length - 1));
    }
  };

  const prevStep = () => {
    setCurrentStep(Math.max(currentStep - 1, 0));
  };

  const goToStep = async (step: number) => {
    if (step <= currentStep) {
      setCurrentStep(step);
    } else {
      // Validar todos os steps até o desejado
      for (let i = currentStep; i < step; i++) {
        const stepFields = getStepFields(i);
        const isStepValid = await trigger(stepFields);
        if (!isStepValid) return;
      }
      setCurrentStep(step);
    }
  };

  // Submissão do formulário
  const onSubmit = async (data: CreateChurchFormValues) => {
    try {
      const churchData: CreateChurchFormData = {
        name: data.name,
        short_name: data.short_name || undefined,
        description: data.description || undefined,
        email: data.email,
        phone: data.phone,
        website: data.website || undefined,
        address: data.address,
        city: data.city,
        state: data.state,
        zipcode: data.zipcode,
        cnpj: data.cnpj || undefined,
        pastor_name: data.pastor_name,
        pastor_email: data.pastor_email,
        pastor_phone: data.pastor_phone || undefined,
        max_members: data.max_members,
        max_branches: data.max_branches,
        subscription_plan: data.subscription_plan,
      };

      const newChurch = await createChurch(denominationId, churchData);
      
      if (newChurch) {
        onSuccess?.(newChurch);
        handleClose();
        toast({
          title: "Sucesso!",
          description: `Igreja "${newChurch.name}" criada com sucesso.`,
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao criar igreja. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleClose = () => {
    reset();
    setCurrentStep(0);
    setShowConfirmDialog(false);
    onClose();
  };

  // Progresso do formulário
  const progress = ((currentStep + 1) / FORM_STEPS.length) * 100;

  // Renderização dos steps
  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return renderChurchDataStep();
      case 1:
        return renderLocationStep();
      case 2:
        return renderPastorStep();
      case 3:
        return renderSettingsStep();
      default:
        return null;
    }
  };

  // Step 1: Dados da Igreja
  const renderChurchDataStep = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Nome da Igreja *</Label>
          <Controller
            name="name"
            control={form.control}
            render={({ field }) => (
              <Input
                id="name"
                placeholder="Igreja Batista Central"
                {...field}
                className={errors.name ? 'border-red-500' : ''}
              />
            )}
          />
          {errors.name && (
            <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="short_name">Nome Abreviado</Label>
          <Controller
            name="short_name"
            control={form.control}
            render={({ field }) => (
              <Input
                id="short_name"
                placeholder="IBC"
                {...field}
              />
            )}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="description">Descrição</Label>
        <Controller
          name="description"
          control={form.control}
          render={({ field }) => (
            <Textarea
              id="description"
              placeholder="Breve descrição sobre a igreja..."
              rows={3}
              {...field}
            />
          )}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="email">Email *</Label>
          <Controller
            name="email"
            control={form.control}
            render={({ field }) => (
              <Input
                id="email"
                type="email"
                placeholder="contato@igreja.com"
                {...field}
                className={errors.email ? 'border-red-500' : ''}
              />
            )}
          />
          {errors.email && (
            <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="phone">Telefone *</Label>
          <Controller
            name="phone"
            control={form.control}
            render={({ field }) => (
              <Input
                id="phone"
                placeholder="(11) 99999-9999"
                {...field}
                className={errors.phone ? 'border-red-500' : ''}
              />
            )}
          />
          {errors.phone && (
            <p className="text-sm text-red-600 mt-1">{errors.phone.message}</p>
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="website">Website</Label>
        <Controller
          name="website"
          control={form.control}
          render={({ field }) => (
            <Input
              id="website"
              placeholder="https://www.igreja.com"
              {...field}
              className={errors.website ? 'border-red-500' : ''}
            />
          )}
        />
        {errors.website && (
          <p className="text-sm text-red-600 mt-1">{errors.website.message}</p>
        )}
      </div>
    </div>
  );

  // Step 2: Localização
  const renderLocationStep = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="address">Endereço Completo *</Label>
        <Controller
          name="address"
          control={form.control}
          render={({ field }) => (
            <Textarea
              id="address"
              placeholder="Rua das Flores, 123 - Centro"
              rows={2}
              {...field}
              className={errors.address ? 'border-red-500' : ''}
            />
          )}
        />
        {errors.address && (
          <p className="text-sm text-red-600 mt-1">{errors.address.message}</p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="city">Cidade *</Label>
          <Controller
            name="city"
            control={form.control}
            render={({ field }) => (
              <Input
                id="city"
                placeholder="São Paulo"
                {...field}
                className={errors.city ? 'border-red-500' : ''}
              />
            )}
          />
          {errors.city && (
            <p className="text-sm text-red-600 mt-1">{errors.city.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="state">Estado *</Label>
          <Controller
            name="state"
            control={form.control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className={errors.state ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Selecionar" />
                </SelectTrigger>
                <SelectContent>
                  {BRAZILIAN_STATES.map((state) => (
                    <SelectItem key={state.value} value={state.value}>
                      {state.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.state && (
            <p className="text-sm text-red-600 mt-1">{errors.state.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="zipcode">CEP *</Label>
          <Controller
            name="zipcode"
            control={form.control}
            render={({ field }) => (
              <Input
                id="zipcode"
                placeholder="01234-567"
                {...field}
                className={errors.zipcode ? 'border-red-500' : ''}
              />
            )}
          />
          {errors.zipcode && (
            <p className="text-sm text-red-600 mt-1">{errors.zipcode.message}</p>
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="cnpj">CNPJ (opcional)</Label>
        <Controller
          name="cnpj"
          control={form.control}
          render={({ field }) => (
            <Input
              id="cnpj"
              placeholder="00.000.000/0001-00"
              {...field}
            />
          )}
        />
      </div>
    </div>
  );

  // Step 3: Pastor Responsável
  const renderPastorStep = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
        <AlertCircle className="h-4 w-4" />
        <span>O pastor responsável será o administrador principal da igreja</span>
      </div>

      <div>
        <Label htmlFor="pastor_name">Nome Completo *</Label>
        <Controller
          name="pastor_name"
          control={form.control}
          render={({ field }) => (
            <Input
              id="pastor_name"
              placeholder="Pastor João Silva"
              {...field}
              className={errors.pastor_name ? 'border-red-500' : ''}
            />
          )}
        />
        {errors.pastor_name && (
          <p className="text-sm text-red-600 mt-1">{errors.pastor_name.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="pastor_email">Email *</Label>
          <Controller
            name="pastor_email"
            control={form.control}
            render={({ field }) => (
              <Input
                id="pastor_email"
                type="email"
                placeholder="pastor@igreja.com"
                {...field}
                className={errors.pastor_email ? 'border-red-500' : ''}
              />
            )}
          />
          {errors.pastor_email && (
            <p className="text-sm text-red-600 mt-1">{errors.pastor_email.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="pastor_phone">Telefone *</Label>
          <Controller
            name="pastor_phone"
            control={form.control}
            render={({ field }) => (
              <Input
                id="pastor_phone"
                placeholder="(11) 99999-9999"
                {...field}
                className={errors.pastor_phone ? 'border-red-500' : ''}
              />
            )}
          />
          {errors.pastor_phone && (
            <p className="text-sm text-red-600 mt-1">{errors.pastor_phone.message}</p>
          )}
        </div>
      </div>
    </div>
  );

  // Step 4: Configurações
  const renderSettingsStep = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="subscription_plan">Plano de Assinatura</Label>
        <Controller
          name="subscription_plan"
          control={form.control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SUBSCRIPTION_PLANS.map((plan) => (
                  <SelectItem key={plan.value} value={plan.value}>
                    <div>
                      <div className="font-medium">{plan.label}</div>
                      <div className="text-xs text-muted-foreground">{plan.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="max_members">Limite de Membros</Label>
          <Controller
            name="max_members"
            control={form.control}
            render={({ field }) => (
              <Input
                id="max_members"
                type="number"
                min="1"
                {...field}
                onChange={(e) => field.onChange(Number(e.target.value))}
                className={errors.max_members ? 'border-red-500' : ''}
              />
            )}
          />
          {errors.max_members && (
            <p className="text-sm text-red-600 mt-1">{errors.max_members.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="max_branches">Limite de Congregações</Label>
          <Controller
            name="max_branches"
            control={form.control}
            render={({ field }) => (
              <Input
                id="max_branches"
                type="number"
                min="0"
                {...field}
                onChange={(e) => field.onChange(Number(e.target.value))}
                className={errors.max_branches ? 'border-red-500' : ''}
              />
            )}
          />
          {errors.max_branches && (
            <p className="text-sm text-red-600 mt-1">{errors.max_branches.message}</p>
          )}
        </div>
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
        <Card className={cn('w-full max-w-2xl max-h-[90vh] overflow-hidden', className)}>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Nova Igreja
              </CardTitle>
              <Button variant="ghost" onClick={() => setShowConfirmDialog(true)}>
                ✕
              </Button>
            </div>
            
            {/* Progress bar */}
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                {FORM_STEPS.map((step, index) => (
                  <span
                    key={step.id}
                    className={cn(
                      'cursor-pointer transition-colors',
                      index <= currentStep ? 'text-blue-600 font-medium' : ''
                    )}
                    onClick={() => goToStep(index)}
                  >
                    {step.title}
                  </span>
                ))}
              </div>
            </div>
          </CardHeader>

          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="max-h-96 overflow-y-auto">
              <div className="flex items-center gap-3 mb-6">
                {React.createElement(FORM_STEPS[currentStep].icon, { className: 'h-6 w-6 text-blue-600' })}
                <h3 className="text-lg font-semibold">{FORM_STEPS[currentStep].title}</h3>
              </div>
              
              {renderStep()}
            </CardContent>

            <div className="p-6 border-t bg-gray-50">
              <div className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  disabled={currentStep === 0}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Anterior
                </Button>

                {currentStep === FORM_STEPS.length - 1 ? (
                  <Button
                    type="submit"
                    disabled={!isValid || isCreatingChurch}
                  >
                    {isCreatingChurch ? (
                      'Criando...'
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Criar Igreja
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={nextStep}
                  >
                    Próximo
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                )}
              </div>
            </div>
          </form>
        </Card>
      </div>

      {/* Dialog de confirmação para sair */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar criação da igreja?</AlertDialogTitle>
            <AlertDialogDescription>
              Os dados preenchidos serão perdidos. Tem certeza que deseja cancelar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowConfirmDialog(false)}>
              Continuar editando
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleClose}>
              Sim, cancelar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};