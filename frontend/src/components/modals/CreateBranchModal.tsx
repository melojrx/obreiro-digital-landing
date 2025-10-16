import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { isAxiosError } from 'axios';
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Settings,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';

import { branchService, CreateBranchRequest } from '@/services/branchService';
import type { BranchDetails } from '@/types/hierarchy';
import { churchService } from '@/services/churchService';

// Schema de validação
const createBranchSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  short_name: z
    .string()
    .min(2, 'Nome curto deve ter pelo menos 2 caracteres')
    .max(50, 'Nome curto deve ter no máximo 50 caracteres')
    .optional()
    .or(z.literal('')),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().min(5, 'Endereço deve ter pelo menos 5 caracteres'),
  neighborhood: z.string().min(2, 'Bairro é obrigatório'),
  city: z.string().min(2, 'Cidade deve ter pelo menos 2 caracteres'),
  state: z.string().min(2, 'Estado é obrigatório'),
  zipcode: z.string().min(8, 'CEP inválido'),
  capacity: z.string().optional(),
  description: z.string().optional(),
  allows_visitor_registration: z.boolean().default(true),
  requires_visitor_approval: z.boolean().default(false),
  qr_code_active: z.boolean().default(true),
});

type CreateBranchFormData = z.infer<typeof createBranchSchema>;

interface CreateBranchModalProps {
  isOpen: boolean;
  onClose: () => void;
  churchId: number;
  churchName: string;
  onSuccess?: (branch: BranchDetails) => void;
}

type BranchCreationAvailability = Awaited<
  ReturnType<typeof branchService.checkCreateAvailability>
>;

const CreateBranchModal: React.FC<CreateBranchModalProps> = ({
  isOpen,
  onClose,
  churchId,
  churchName,
  onSuccess
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [availability, setAvailability] = useState<BranchCreationAvailability | null>(null);
  const [availableStates, setAvailableStates] = useState<Array<{ code: string; name: string }>>([]);
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [isFetchingCep, setIsFetchingCep] = useState(false);
  const lastFetchedCep = useRef<string>('');

  const form = useForm<CreateBranchFormData>({
    resolver: zodResolver(createBranchSchema),
    defaultValues: {
      name: '',
      short_name: '',
      email: '',
      phone: '',
      address: '',
      neighborhood: '',
      city: '',
      state: '',
      zipcode: '',
      capacity: '',
      description: '',
      allows_visitor_registration: true,
      requires_visitor_approval: false,
      qr_code_active: true,
    },
  });

  const selectedState = form.watch('state');

  const checkAvailability = useCallback(async () => {
    try {
      const result = await branchService.checkCreateAvailability(churchId);
      setAvailability(result);
    } catch (error) {
      console.error('Erro ao verificar disponibilidade:', error);
      setAvailability(null);
    }
  }, [churchId]);

  const loadStates = useCallback(async () => {
    try {
      const states = await churchService.getAvailableStates();
      setAvailableStates(states);
    } catch (error) {
      console.error('Erro ao carregar estados:', error);
    }
  }, []);

  const loadCities = useCallback(async (state: string) => {
    if (!state) {
      setAvailableCities([]);
      return [];
    }
    try {
      const cities = await churchService.getCitiesByState(state);
      setAvailableCities(cities);
      return cities;
    } catch (error) {
      console.error('Erro ao carregar cidades:', error);
      setAvailableCities([]);
      return [];
    }
  }, []);

  // Verificar disponibilidade ao abrir o modal
  useEffect(() => {
    if (isOpen && churchId) {
      checkAvailability();
      loadStates();
    }
  }, [checkAvailability, isOpen, churchId, loadStates]);

  // Carregar cidades quando estado mudar
  useEffect(() => {
    loadCities(selectedState || '');
  }, [selectedState, loadCities]);

  const handleZipcodeChange = async (rawValue: string) => {
    const formatted = formatCEP(rawValue);
    form.setValue('zipcode', formatted, { shouldDirty: true, shouldValidate: true });

    const numericValue = formatted.replace(/\D/g, '');

    if (numericValue.length !== 8) {
      if (numericValue.length < 8) {
        lastFetchedCep.current = '';
      }
      return;
    }

    if (lastFetchedCep.current === numericValue) {
      return;
    }

    setIsFetchingCep(true);
    lastFetchedCep.current = numericValue;

    try {
      const response = await fetch(`https://viacep.com.br/ws/${numericValue}/json/`);
      const data = await response.json();

      if (data?.erro) {
        form.setError('zipcode', {
          type: 'manual',
          message: 'CEP não encontrado. Verifique e tente novamente.',
        });
        return;
      }

      form.clearErrors('zipcode');

      if (data.bairro) {
        const currentNeighborhood = form.getValues('neighborhood');
        if (!currentNeighborhood || currentNeighborhood.trim().length === 0) {
          form.setValue('neighborhood', String(data.bairro), { shouldDirty: true, shouldValidate: true });
        }
      }

      if (data.logradouro || data.bairro) {
        const currentAddress = form.getValues('address');
        if (!currentAddress || currentAddress.trim().length === 0) {
          const addressParts = [data.logradouro, data.bairro].filter(Boolean).join(', ');
          if (addressParts) {
            form.setValue('address', addressParts, { shouldDirty: true });
          }
        }
      }

      if (data.uf) {
        const uf = String(data.uf).toUpperCase();
        form.setValue('state', uf, { shouldDirty: true, shouldValidate: true });
        const cities = await loadCities(uf);

        if (data.localidade) {
          const cityName = String(data.localidade);
          if (!cities.includes(cityName)) {
            setAvailableCities((prev) => (prev.includes(cityName) ? prev : [cityName, ...prev]));
          }
          form.setValue('city', cityName, { shouldDirty: true, shouldValidate: true });
        }
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      toast({
        title: 'Não foi possível buscar o CEP',
        description: 'Verifique sua conexão ou informe os dados manualmente.',
        variant: 'destructive',
      });
      lastFetchedCep.current = '';
    } finally {
      setIsFetchingCep(false);
    }
  };

  const onSubmit = async (data: CreateBranchFormData) => {
    setIsLoading(true);

    try {
      const trimmedName = data.name.trim();
      const trimmedShortName = (data.short_name ?? '').trim();
      const trimmedEmail = data.email?.trim() ?? '';
      const trimmedPhone = data.phone?.trim() ?? '';
      const trimmedAddress = data.address.trim();
      const trimmedNeighborhood = data.neighborhood.trim();
      const trimmedCity = data.city.trim();
      const trimmedState = data.state.trim().toUpperCase();
      const formattedZipcode = formatCEP(data.zipcode.trim());

      const branchData: CreateBranchRequest = {
        church: churchId,
        name: trimmedName,
        short_name: trimmedShortName || trimmedName,
        email: trimmedEmail,
        phone: trimmedPhone ? formatPhone(trimmedPhone) : '',
        address: trimmedAddress,
        neighborhood: trimmedNeighborhood,
        city: trimmedCity,
        state: trimmedState,
        zipcode: formattedZipcode,
        allows_visitor_registration: data.allows_visitor_registration,
        requires_visitor_approval: data.requires_visitor_approval,
        qr_code_active: data.qr_code_active,
        capacity: data.capacity ? parseInt(data.capacity, 10) : undefined,
        description: data.description?.trim() || undefined,
      };

      const newBranch = await branchService.createBranch(branchData);

      toast({
        title: 'Filial criada com sucesso!',
        description: `A filial "${data.name}" foi criada e está pronta para uso.`,
      });

      form.reset();
      onSuccess?.(newBranch);
      onClose();

    } catch (error) {
      let description = 'Erro interno. Tente novamente.';
      if (isAxiosError(error)) {
        description = error.response?.data?.message ?? description;
      }
      toast({
        title: 'Erro ao criar filial',
        description,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatCEP = (value: string) => {
    const numericValue = value.replace(/\D/g, '');
    return numericValue.replace(/(\d{5})(\d{3})/, '$1-$2');
  };

  const formatPhone = (value: string) => {
    const numericValue = value.replace(/\D/g, '');
    if (numericValue.length <= 10) {
      return numericValue.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return numericValue.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  };

  // Não permitir criação se não há disponibilidade
  if (availability && !availability.can_create) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="w-[95vw] max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              Limite Atingido
            </DialogTitle>
            <DialogDescription>
              Não é possível criar uma nova filial
            </DialogDescription>
          </DialogHeader>
          
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {availability.message || `Você atingiu o limite de ${availability.max_allowed} filiais para o plano ${availability.subscription_plan}.`}
            </AlertDescription>
          </Alert>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
            <Button onClick={() => window.open('/denominacao/subscription', '_blank')}>
              Fazer Upgrade
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-2xl max-h-[95vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-600" />
            Nova Filial - {churchName}
          </DialogTitle>
          <DialogDescription>
            Crie uma nova filial para expandir o alcance da sua igreja
          </DialogDescription>
        </DialogHeader>

        {availability && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Você pode criar mais {availability.remaining_slots} filial(ais). 
              Total permitido: {availability.max_allowed} ({availability.subscription_plan})
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Informações Básicas */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                <h3 className="font-semibold">Informações Básicas</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da Filial *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Filial Zona Sul" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="short_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome Curto</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Filial ZS" {...field} />
                      </FormControl>
                      <FormDescription>
                        Usado em listagens e relatórios (até 50 caracteres).
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="capacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Capacidade</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Ex: 200" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>Número máximo de pessoas</FormDescription>
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
                        placeholder="Descreva a filial, sua missão e características especiais..."
                        className="min-h-[80px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Contato */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <h3 className="font-semibold">Contato</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input 
                          type="email" 
                          placeholder="filial@igreja.com.br" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="(11) 99999-9999"
                          value={field.value ? formatPhone(field.value) : ''}
                          onChange={(e) => field.onChange(e.target.value)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* Endereço */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <h3 className="font-semibold">Endereço</h3>
              </div>
              
              <FormField
                control={form.control}
                name="zipcode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CEP *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="00000-000"
                        value={field.value ?? ''}
                        onChange={(e) => handleZipcodeChange(e.target.value)}
                        onBlur={field.onBlur}
                        maxLength={9}
                        inputMode="numeric"
                      />
                    </FormControl>
                    <FormDescription>
                      Informe o CEP para preencher automaticamente o endereço.
                    </FormDescription>
                    {isFetchingCep && (
                      <p className="text-xs text-blue-600 flex items-center gap-1">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Buscando dados do CEP...
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Endereço Completo *</FormLabel>
                    <FormControl>
                      <Input placeholder="Rua, número, bairro..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="neighborhood"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bairro *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Centro" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableStates.map((state) => (
                            <SelectItem key={state.code} value={state.code}>
                              {state.name} ({state.code})
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
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cidade *</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value}
                        disabled={!selectedState || isFetchingCep}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableCities.map((city) => (
                            <SelectItem key={city} value={city}>
                              {city}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {!selectedState && (
                        <FormDescription>
                          Selecione primeiro o estado ou informe um CEP válido.
                        </FormDescription>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* Configurações */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <h3 className="font-semibold">Configurações</h3>
              </div>
              
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="allows_visitor_registration"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Permitir registro de visitantes</FormLabel>
                        <FormDescription>
                          Visitantes poderão se registrar via QR Code
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="requires_visitor_approval"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Requer aprovação de visitantes</FormLabel>
                        <FormDescription>
                          Visitantes precisarão ser aprovados antes de aparecerem nos relatórios
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="qr_code_active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>QR Code ativo</FormLabel>
                        <FormDescription>
                          Gerar QR Code para registro de visitantes
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={onClose} disabled={isLoading}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Criando...' : 'Criar Filial'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateBranchModal;
