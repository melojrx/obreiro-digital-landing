import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save, User, Phone, Mail, MapPin, Heart, Users, Calendar, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { type Visitor } from '@/services/visitorsService';

const visitorSchema = z.object({
  full_name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  birth_date: z.string().optional(),
  gender: z.enum(['M', 'F']).optional(),
  cpf: z.string().optional(),
  marital_status: z.enum(['single', 'married', 'divorced', 'widowed', 'other']).default('single'),
  city: z.string().min(2, 'Cidade deve ter pelo menos 2 caracteres'),
  state: z.string().length(2, 'Estado deve ter 2 caracteres'),
  neighborhood: z.string().optional(),
  address: z.string().optional(),
  zipcode: z.string().optional(),
  first_visit: z.boolean().default(true),
  wants_prayer: z.boolean().default(false),
  wants_growth_group: z.boolean().default(false),
  ministry_interest: z.string().optional(),
  observations: z.string().optional(),
  follow_up_status: z.enum(['pending', 'contacted', 'interested', 'not_interested', 'converted']).default('pending'),
  branch: z.number().int().positive().optional(),
});

export type VisitorFormData = z.infer<typeof visitorSchema>;

interface VisitorFormProps {
  initialData?: Partial<Visitor>;
  onSubmit: (data: VisitorFormData) => Promise<void>;
  isSubmitting?: boolean;
  submitLabel?: string;
  title?: string;
  description?: string;
}

export const VisitorForm: React.FC<VisitorFormProps> = ({
  initialData,
  onSubmit,
  isSubmitting = false,
  submitLabel = 'Salvar Visitante',
  title = 'Dados do Visitante',
  description = 'Preencha as informações do visitante'
}) => {
  const [isFetchingCep, setIsFetchingCep] = useState(false);
  const [cepError, setCepError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    control
  } = useForm<VisitorFormData>({
    resolver: zodResolver(visitorSchema),
    defaultValues: {
      full_name: initialData?.full_name || '',
      email: initialData?.email || '',
      phone: initialData?.phone || '',
      birth_date: initialData?.birth_date || '',
      gender: initialData?.gender || undefined,
      cpf: initialData?.cpf || '',
      marital_status: initialData?.marital_status || 'single',
      city: initialData?.city || '',
      state: initialData?.state || '',
      neighborhood: initialData?.neighborhood || '',
      address: initialData?.address || '',
      zipcode: initialData?.zipcode || '',
      first_visit: initialData?.first_visit ?? true,
      wants_prayer: initialData?.wants_prayer ?? false,
      wants_growth_group: initialData?.wants_growth_group ?? false,
      ministry_interest: initialData?.ministry_interest || '',
      observations: initialData?.observations || '',
      follow_up_status: initialData?.follow_up_status || 'pending',
      branch: initialData?.branch,
    }
  });

  useEffect(() => {
    if (initialData?.branch) {
      setValue('branch', initialData.branch);
    }
  }, [initialData?.branch, setValue]);

  // Estados brasileiros
  const estados = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  ];

  // Função para buscar endereço pelo CEP
  const fetchAddressByCep = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '');
    
    if (cleanCep.length !== 8) {
      setCepError('CEP deve ter 8 dígitos');
      return;
    }

    setIsFetchingCep(true);
    setCepError(null);

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();

      if (data.erro) {
        setCepError('CEP não encontrado');
        return;
      }

      // Preencher os campos automaticamente
      setValue('address', data.logradouro || '');
      setValue('city', data.localidade || '');
      setValue('state', data.uf || '');
      setValue('neighborhood', data.bairro || '');
      
      setCepError(null);
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      setCepError('Erro ao consultar CEP. Tente novamente.');
    } finally {
      setIsFetchingCep(false);
    }
  };

  // Monitorar mudanças no CEP
  const zipcode = watch('zipcode');
  
  useEffect(() => {
    if (zipcode && zipcode.length >= 8) {
      const timeoutId = setTimeout(() => {
        fetchAddressByCep(zipcode);
      }, 1000); // Debounce de 1 segundo

      return () => clearTimeout(timeoutId);
    }
  }, [zipcode]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <User className="h-5 w-5" />
          <span>{title}</span>
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
          {/* Dados pessoais */}
          <div className="space-y-3 sm:space-y-4">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span>Dados Pessoais</span>
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="full_name" className="text-sm sm:text-base font-medium">Nome Completo *</Label>
                <Input
                  id="full_name"
                  {...register('full_name')}
                  placeholder="Nome completo do visitante"
                  className="h-11 text-base"
                />
                {errors.full_name && (
                  <p className="text-sm text-red-600">{errors.full_name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm sm:text-base font-medium">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  {...register('email')}
                  placeholder="email@exemplo.com"
                  className="h-11 text-base"
                />
                {errors.email && (
                  <p className="text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm sm:text-base font-medium">Telefone</Label>
                <Input
                  id="phone"
                  {...register('phone')}
                  placeholder="(11) 99999-9999"
                  maxLength={15}
                  className="h-11 text-base"
                  onInput={(e) => {
                    // Máscara de telefone
                    const target = e.target as HTMLInputElement;
                    let value = target.value.replace(/\D/g, '');
                    
                    if (value.length <= 11) {
                      if (value.length > 6) {
                        value = value.replace(/^(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
                      } else if (value.length > 2) {
                        value = value.replace(/^(\d{2})(\d{0,5})/, '($1) $2');
                      } else if (value.length > 0) {
                        value = value.replace(/^(\d{0,2})/, '($1');
                      }
                    }
                    
                    target.value = value;
                  }}
                />
                {errors.phone && (
                  <p className="text-sm text-red-600">{errors.phone.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="birth_date" className="text-sm sm:text-base font-medium">Data de Nascimento</Label>
                <Input
                  id="birth_date"
                  type="date"
                  {...register('birth_date')}
                  className="h-11 text-base"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender" className="text-sm sm:text-base font-medium">Gênero</Label>
                <Controller
                  name="gender"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="M">Masculino</SelectItem>
                        <SelectItem value="F">Feminino</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cpf" className="text-sm sm:text-base font-medium">CPF</Label>
                <Input
                  id="cpf"
                  {...register('cpf')}
                  placeholder="000.000.000-00"
                  maxLength={14}
                  className="h-11 text-base"
                  onInput={(e) => {
                    // Máscara de CPF
                    const target = e.target as HTMLInputElement;
                    let value = target.value.replace(/\D/g, '');
                    if (value.length <= 11) {
                      value = value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
                    }
                    target.value = value;
                  }}
                />
              </div>
            </div>
          </div>

          <Separator className="my-4 sm:my-6" />

          {/* Endereço */}
          <div className="space-y-3 sm:space-y-4">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <MapPin className="h-4 w-4" />
              <span>Endereço</span>
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label htmlFor="zipcode" className="text-sm sm:text-base font-medium">CEP</Label>
                <div className="relative">
                  <Input
                    id="zipcode"
                    {...register('zipcode')}
                    placeholder="00000-000"
                    maxLength={9}
                    className="h-11 text-base"
                    onInput={(e) => {
                      // Máscara de CEP
                      const target = e.target as HTMLInputElement;
                      let value = target.value.replace(/\D/g, '');
                      if (value.length > 5) {
                        value = value.replace(/^(\d{5})(\d)/, '$1-$2');
                      }
                      target.value = value;
                    }}
                  />
                  {isFetchingCep && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                    </div>
                  )}
                </div>
                {cepError && (
                  <p className="text-sm text-red-600">{cepError}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="neighborhood" className="text-sm sm:text-base font-medium">Bairro</Label>
                <Input
                  id="neighborhood"
                  {...register('neighborhood')}
                  placeholder="Bairro"
                  className={`h-11 text-base ${isFetchingCep ? 'bg-gray-50' : ''}`}
                  readOnly={isFetchingCep}
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="address" className="text-sm sm:text-base font-medium">Endereço</Label>
                <Input
                  id="address"
                  {...register('address')}
                  placeholder="Rua, número, complemento"
                  className={`h-11 text-base ${isFetchingCep ? 'bg-gray-50' : ''}`}
                  readOnly={isFetchingCep}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city" className="text-sm sm:text-base font-medium">Cidade *</Label>
                <Input
                  id="city"
                  {...register('city')}
                  placeholder="Cidade"
                  className={`h-11 text-base ${isFetchingCep ? 'bg-gray-50' : ''}`}
                  readOnly={isFetchingCep}
                />
                {errors.city && (
                  <p className="text-sm text-red-600">{errors.city.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="state" className="text-sm sm:text-base font-medium">Estado *</Label>
                <Controller
                  name="state"
                  control={control}
                  render={({ field }) => (
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                      disabled={isFetchingCep}
                    >
                      <SelectTrigger className={`h-11 ${isFetchingCep ? 'bg-gray-50' : ''}`}>
                        <SelectValue placeholder="UF" />
                      </SelectTrigger>
                      <SelectContent>
                        {estados.map((estado) => (
                          <SelectItem key={estado} value={estado}>
                            {estado}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.state && (
                  <p className="text-sm text-red-600">{errors.state.message}</p>
                )}
              </div>
            </div>
          </div>

          <Separator className="my-4 sm:my-6" />

          {/* Informações eclesiásticas */}
          <div className="space-y-3 sm:space-y-4">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Informações Eclesiásticas</span>
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label htmlFor="marital_status" className="text-sm sm:text-base font-medium">Estado Civil</Label>
                <Controller
                  name="marital_status"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="single">Solteiro(a)</SelectItem>
                        <SelectItem value="married">Casado(a)</SelectItem>
                        <SelectItem value="divorced">Divorciado(a)</SelectItem>
                        <SelectItem value="widowed">Viúvo(a)</SelectItem>
                        <SelectItem value="other">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="follow_up_status" className="text-sm sm:text-base font-medium">Status de Follow-up</Label>
                <Controller
                  name="follow_up_status"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pendente</SelectItem>
                        <SelectItem value="contacted">Contatado</SelectItem>
                        <SelectItem value="interested">Interessado</SelectItem>
                        <SelectItem value="not_interested">Não Interessado</SelectItem>
                        <SelectItem value="converted">Convertido</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            <div className="space-y-3 sm:space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ministry_interest" className="text-sm sm:text-base font-medium">Interesse em Ministérios</Label>
                <Textarea
                  id="ministry_interest"
                  {...register('ministry_interest')}
                  placeholder="Quais ministérios ou atividades despertam interesse?"
                  rows={3}
                  className="text-base resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="observations" className="text-sm sm:text-base font-medium">Observações</Label>
                <Textarea
                  id="observations"
                  {...register('observations')}
                  placeholder="Observações adicionais sobre o visitante"
                  rows={3}
                  className="text-base resize-none"
                />
              </div>
            </div>

            {/* Checkboxes */}
            <div className="space-y-4">
              <div className="flex items-start space-x-3 py-2">
                <Controller
                  name="first_visit"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      id="first_visit"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="mt-0.5"
                    />
                  )}
                />
                <Label htmlFor="first_visit" className="text-sm sm:text-base font-medium leading-relaxed cursor-pointer">
                  Primeira visita à igreja
                </Label>
              </div>

              <div className="flex items-start space-x-3 py-2">
                <Controller
                  name="wants_prayer"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      id="wants_prayer"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="mt-0.5"
                    />
                  )}
                />
                <Label htmlFor="wants_prayer" className="text-sm sm:text-base font-medium leading-relaxed cursor-pointer flex items-center space-x-2">
                  <Heart className="h-4 w-4 flex-shrink-0" />
                  <span>Quer receber oração</span>
                </Label>
              </div>

              <div className="flex items-start space-x-3 py-2">
                <Controller
                  name="wants_growth_group"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      id="wants_growth_group"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="mt-0.5"
                    />
                  )}
                />
                <Label htmlFor="wants_growth_group" className="text-sm sm:text-base font-medium leading-relaxed cursor-pointer flex items-center space-x-2">
                  <Users className="h-4 w-4 flex-shrink-0" />
                  <span>Interesse em grupo de crescimento</span>
                </Label>
              </div>
            </div>
          </div>

          {/* Botão de submissão */}
          <div className="pt-6">
            <Button
              type="submit"
              className="w-full h-12 text-base font-medium"
              size="lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {submitLabel}
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
