import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  Loader2,
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
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';

import { branchService } from '@/services/branchService';
import { churchService } from '@/services/churchService';
import type { BranchDetails } from '@/types/hierarchy';

const editBranchSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  short_name: z.string().optional().or(z.literal('')),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  address: z.string().min(3, 'Endereço muito curto'),
  neighborhood: z.string().optional().or(z.literal('')),
  city: z.string().min(2, 'Cidade deve ter pelo menos 2 caracteres'),
  state: z.string().min(2, 'Estado é obrigatório'),
  zipcode: z.string().min(8, 'CEP inválido'),
  description: z.string().optional().or(z.literal('')),
  allows_visitor_registration: z.boolean().default(true),
  requires_visitor_approval: z.boolean().default(false),
});

type EditBranchFormData = z.infer<typeof editBranchSchema>;

interface EditBranchModalProps {
  isOpen: boolean;
  branch: BranchDetails | null;
  onClose: () => void;
  onSuccess?: (branch: BranchDetails) => void;
}

const EditBranchModal: React.FC<EditBranchModalProps> = ({ isOpen, branch, onClose, onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [availableStates, setAvailableStates] = useState<Array<{ code: string; name: string }>>([]);
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [isFetchingCep, setIsFetchingCep] = useState(false);
  const lastFetchedCep = useRef<string>('');

  const form = useForm<EditBranchFormData>({
    resolver: zodResolver(editBranchSchema),
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
      description: '',
      allows_visitor_registration: true,
      requires_visitor_approval: false,
    },
  });

  const selectedState = form.watch('state');

  const loadStates = useCallback(async () => {
    try {
      const states = await churchService.getAvailableStates();
      setAvailableStates(states);
    } catch (error) {
      console.error('Erro ao carregar estados:', error);
    }
  }, []);

  const loadCities = useCallback(async (state: string, ensureCity?: string) => {
    if (!state) {
      setAvailableCities([]);
      return [];
    }
    try {
      const cities = await churchService.getCitiesByState(state);
      // Garantir que a cidade atual apareça nas opções mesmo que a API não retorne
      if (ensureCity && ensureCity.trim() && !cities.includes(ensureCity)) {
        const enriched = [ensureCity, ...cities];
        setAvailableCities(enriched);
        return enriched;
      }
      setAvailableCities(cities);
      return cities;
    } catch (error) {
      console.error('Erro ao carregar cidades:', error);
      // Ainda assim garantir que a cidade atual apareça como fallback
      if (ensureCity && ensureCity.trim()) {
        setAvailableCities([ensureCity]);
        return [ensureCity];
      }
      setAvailableCities([]);
      return [];
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadStates();
    }
  }, [isOpen, loadStates]);

  // Preencher o formulário quando a branch mudar/abrir modal
  useEffect(() => {
    if (branch && isOpen) {
      form.reset({
        name: branch.name || '',
        short_name: branch.short_name || '',
        email: branch.email || '',
        phone: branch.phone || '',
        address: branch.address || '',
        neighborhood: branch.neighborhood || '',
        city: branch.city || '',
        state: branch.state || '',
        zipcode: branch.zipcode || '',
        description: branch.description || '',
        allows_visitor_registration: branch.allows_visitor_registration,
        requires_visitor_approval: branch.requires_visitor_approval,
      });

      // Carregar cidades compatíveis e forçar inclusão da cidade atual se necessário
      loadCities(branch.state || '', branch.city || undefined);
    }
  }, [branch, isOpen, form, loadCities]);

  useEffect(() => {
    // Quando o estado mudar, recarregar cidades preservando o valor atual do form
    const currentCity = form.getValues('city');
    loadCities(selectedState || '', currentCity);
  }, [selectedState, loadCities, form]);

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

  const onSubmit = async (data: EditBranchFormData) => {
    if (!branch) return;
    setIsLoading(true);
    try {
      const payload: Partial<BranchDetails> = {
        name: data.name.trim(),
        short_name: (data.short_name || '').trim() || data.name.trim(),
        email: data.email?.trim() || '',
        phone: data.phone ? formatPhone(data.phone) : '',
        address: data.address.trim(),
        neighborhood: (data.neighborhood || '').trim(),
        city: data.city.trim(),
        state: data.state.trim().toUpperCase(),
        zipcode: formatCEP(data.zipcode.trim()),
        description: data.description?.trim() || '',
        allows_visitor_registration: data.allows_visitor_registration,
        requires_visitor_approval: data.requires_visitor_approval,
      } as Partial<BranchDetails>;

      const updated = await branchService.patchBranch(branch.id, payload);
      toast({ title: 'Filial atualizada com sucesso!' });
      onSuccess?.(updated);
      onClose();
    } catch (error) {
      let description = 'Erro interno. Tente novamente.';
      if (isAxiosError(error)) {
        description = error.response?.data?.message ?? description;
      }
      toast({ title: 'Erro ao atualizar congregação', description, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  // formatCEP já definido acima (const formatCEP)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-2xl max-h-[95vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-600" />
            Editar Filial
          </DialogTitle>
          <DialogDescription>
            Atualize as informações da congregação
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="contato@igreja.com" {...field} />
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
                        <Input placeholder="(00) 00000-0000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Ordem solicitada: CEP, Endereço, Bairro, Estado, Cidade */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="zipcode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CEP *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="00000-000"
                          value={field.value || ''}
                          onChange={(e) => handleZipcodeChange(e.target.value)}
                          onBlur={(e) => handleZipcodeChange(e.target.value)}
                        />
                      </FormControl>
                      {isFetchingCep && (
                        <p className="text-xs text-blue-600 flex items-center gap-1">
                          <Loader2 className="h-3 w-3 animate-spin" /> Buscando dados do CEP...
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
                      <FormLabel>Endereço *</FormLabel>
                      <FormControl>
                        <Input placeholder="Rua, número, complemento..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="neighborhood"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bairro</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Centro" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
              </div>

              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cidade *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableCities.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
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
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Descrição da congregação" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <h3 className="font-semibold">Configurações</h3>
              </div>
              <FormField
                control={form.control}
                name="allows_visitor_registration"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Permitir registro de visitantes</FormLabel>
                      <FormDescription>Visitantes poderão se registrar via QR Code</FormDescription>
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
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Requer aprovação de visitantes</FormLabel>
                      <FormDescription>Visitantes precisam ser aprovados antes dos relatórios</FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EditBranchModal;
