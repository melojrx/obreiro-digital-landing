/**
 * Página de Registro de Visitante via QR Code
 * Página pública para registro de visitantes
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, QrCode, MapPin, Users, Heart, BookOpen } from 'lucide-react';

import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Checkbox } from '../components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';

import { 
  validateQRCode, 
  registerVisitorPublic, 
  type QRCodeValidation,
  type VisitorPublicRegistration 
} from '../services/visitorsService';

// Schema de validação com Zod
const visitorSchema = z.object({
  full_name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('E-mail inválido'),
  phone: z.string().optional(),
  birth_date: z.string().optional(),
  gender: z.enum(['M', 'F']).optional(),
  cpf: z.string().optional(),
  zipcode: z.string().optional(),
  address: z.string().optional(),
  city: z.string().min(2, 'Cidade é obrigatória'),
  state: z.string().length(2, 'Estado deve ter 2 caracteres'),
  neighborhood: z.string().optional(),
  marital_status: z.enum(['single', 'married', 'divorced', 'widowed', 'other']),
  ministry_interest: z.string().optional(),
  first_visit: z.boolean(),
  wants_prayer: z.boolean(),
  wants_growth_group: z.boolean(),
  observations: z.string().optional(),
});

type VisitorFormData = z.infer<typeof visitorSchema>;

const RegistroVisitante: React.FC = () => {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  
  const [qrValidation, setQrValidation] = useState<QRCodeValidation | null>(null);
  const [isValidating, setIsValidating] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isFetchingCep, setIsFetchingCep] = useState(false);
  const [cepError, setCepError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm<VisitorFormData>({
    resolver: zodResolver(visitorSchema),
    defaultValues: {
      first_visit: true,
      wants_prayer: false,
      wants_growth_group: false,
      marital_status: 'single'
    }
  });

  // Validar QR Code ao carregar a página
  useEffect(() => {
    if (!uuid) {
      navigate('/404');
      return;
    }

    const validateQR = async () => {
      setIsValidating(true);
      try {
        const validation = await validateQRCode(uuid);
        setQrValidation(validation);
        
        if (!validation.valid) {
          // QR Code inválido, redirecionar após 3 segundos
          setTimeout(() => {
            navigate('/404');
          }, 3000);
        }
      } catch (error) {
        console.error('Erro ao validar QR Code:', error);
        setQrValidation({
          valid: false,
          error: 'Erro ao validar QR Code'
        });
      } finally {
        setIsValidating(false);
      }
    };

    validateQR();
  }, [uuid, navigate]);

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
      
      // Forçar update do Select de estado
      const stateSelect = document.querySelector('[data-state-select]') as any;
      if (stateSelect && data.uf) {
        stateSelect.value = data.uf;
        stateSelect.dispatchEvent(new Event('change', { bubbles: true }));
      }
      
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
  
  React.useEffect(() => {
    if (zipcode && zipcode.length >= 8) {
      const timeoutId = setTimeout(() => {
        fetchAddressByCep(zipcode);
      }, 1000); // Debounce de 1 segundo

      return () => clearTimeout(timeoutId);
    }
  }, [zipcode]);

  const onSubmit = async (data: VisitorFormData) => {
    if (!uuid || !qrValidation?.valid) return;

    setIsSubmitting(true);
    setSubmitError(null);

    // Limpar campos vazios antes de enviar
    const cleanedData = Object.entries(data).reduce((acc, [key, value]) => {
      if (value !== '' && value !== null && value !== undefined) {
        acc[key as keyof VisitorFormData] = value;
      }
      return acc;
    }, {} as any);

    console.log('[DEBUG] Original form data:', data);
    console.log('[DEBUG] Cleaned form data being sent:', cleanedData);

    try {
      const response = await registerVisitorPublic(uuid, cleanedData);
      
      if (response.success) {
        // Redirecionar para página de sucesso
        navigate(`/registro-sucesso?visitor=${response.visitor?.id}&branch=${response.visitor?.branch_name}`);
      } else {
        setSubmitError(response.error || 'Erro ao registrar visitante');
      }
    } catch (error) {
      console.error('Erro ao registrar visitante:', error);
      setSubmitError('Erro de conexão. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Estados brasileiros
  const estados = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  ];

  // Loading durante validação
  if (isValidating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <p className="text-lg font-medium">Validando QR Code...</p>
              <p className="text-sm text-gray-600 text-center">
                Aguarde enquanto verificamos se o código é válido
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // QR Code inválido
  if (!qrValidation?.valid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-rose-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4">
              <QrCode className="h-12 w-12 text-red-500" />
              <h1 className="text-xl font-bold text-red-700">QR Code Inválido</h1>
              <p className="text-sm text-gray-600 text-center">
                {qrValidation?.error || 'Este QR Code não é válido ou está inativo.'}
              </p>
              <p className="text-xs text-gray-500 text-center">
                Você será redirecionado em alguns segundos...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header com informações da igreja */}
        <Card className="mb-6">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <QrCode className="h-12 w-12 text-blue-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Bem-vindo à {qrValidation?.branch?.church_name}
            </CardTitle>
            <CardDescription className="text-lg">
              <div className="flex items-center justify-center space-x-2">
                <MapPin className="h-4 w-4" />
                <span>{qrValidation?.branch?.name}</span>
              </div>
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Formulário de registro */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Registre-se como Visitante</span>
            </CardTitle>
            <CardDescription>
              Preencha os dados abaixo para se registrar em nossa igreja. 
              Seus dados serão utilizados apenas para acompanhamento pastoral.
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Erro de submissão */}
              {submitError && (
                <Alert variant="destructive">
                  <AlertDescription>{submitError}</AlertDescription>
                </Alert>
              )}

              {/* Dados pessoais */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Dados Pessoais</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Nome Completo *</Label>
                    <Input
                      id="full_name"
                      {...register('full_name')}
                      placeholder="Seu nome completo"
                    />
                    {errors.full_name && (
                      <p className="text-sm text-red-600">{errors.full_name.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail *</Label>
                    <Input
                      id="email"
                      type="email"
                      {...register('email')}
                      placeholder="seu@email.com"
                    />
                    {errors.email && (
                      <p className="text-sm text-red-600">{errors.email.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      {...register('phone')}
                      placeholder="(11) 99999-9999"
                      maxLength={15}
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
                    <Label htmlFor="birth_date">Data de Nascimento</Label>
                    <Input
                      id="birth_date"
                      type="date"
                      {...register('birth_date')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gender">Gênero</Label>
                    <Select onValueChange={(value) => setValue('gender', value as 'M' | 'F')}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="M">Masculino</SelectItem>
                        <SelectItem value="F">Feminino</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cpf">CPF</Label>
                    <Input
                      id="cpf"
                      {...register('cpf')}
                      placeholder="000.000.000-00"
                    />
                  </div>
                </div>
              </div>

              {/* Endereço */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Endereço</h3>
                
                {/* CEP e Bairro na mesma linha */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="zipcode">CEP</Label>
                    <div className="relative">
                      <Input
                        id="zipcode"
                        {...register('zipcode')}
                        placeholder="00000-000"
                        maxLength={9}
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
                    {errors.zipcode && (
                      <p className="text-sm text-red-600">{errors.zipcode.message}</p>
                    )}
                    {cepError && (
                      <p className="text-sm text-red-600">{cepError}</p>
                    )}
                    <div className="text-xs text-gray-600">
                      Digite o CEP para preencher automaticamente o endereço, cidade, estado e bairro
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="neighborhood">Bairro</Label>
                    <Input
                      id="neighborhood"
                      {...register('neighborhood')}
                      placeholder="Seu bairro"
                      className={isFetchingCep ? 'bg-gray-50' : ''}
                      readOnly={isFetchingCep}
                    />
                    {errors.neighborhood && (
                      <p className="text-sm text-red-600">{errors.neighborhood.message}</p>
                    )}
                  </div>
                </div>
                
                {/* Campo de endereço */}
                <div className="space-y-2">
                  <Label htmlFor="address">Endereço</Label>
                  <Input
                    id="address"
                    {...register('address')}
                    placeholder="Rua, número, complemento"
                  />
                  {errors.address && (
                    <p className="text-sm text-red-600">{errors.address.message}</p>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="city">Cidade *</Label>
                    <Input
                      id="city"
                      {...register('city')}
                      placeholder="Sua cidade"
                      className={isFetchingCep ? 'bg-gray-50' : ''}
                      readOnly={isFetchingCep}
                    />
                    {errors.city && (
                      <p className="text-sm text-red-600">{errors.city.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="state">Estado *</Label>
                    <Select 
                      onValueChange={(value) => setValue('state', value)}
                      disabled={isFetchingCep}
                      value={watch('state')}
                    >
                      <SelectTrigger className={isFetchingCep ? 'bg-gray-50' : ''}>
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
                    {errors.state && (
                      <p className="text-sm text-red-600">{errors.state.message}</p>
                    )}
                  </div>

                </div>
              </div>

              {/* Informações eclesiásticas */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Informações Eclesiásticas</h3>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="marital_status">Estado Civil</Label>
                    <Select onValueChange={(value) => setValue('marital_status', value as any)}>
                      <SelectTrigger>
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
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ministry_interest">Interesse em Ministérios</Label>
                    <Textarea
                      id="ministry_interest"
                      {...register('ministry_interest')}
                      placeholder="Quais ministérios ou atividades despertam seu interesse?"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="observations">Observações</Label>
                    <Textarea
                      id="observations"
                      {...register('observations')}
                      placeholder="Algo mais que gostaria de compartilhar conosco?"
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              {/* Checkboxes */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Preferências</h3>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="first_visit"
                      {...register('first_visit')}
                      defaultChecked={true}
                    />
                    <Label htmlFor="first_visit" className="text-sm font-medium">
                      Esta é minha primeira visita a esta igreja
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="wants_prayer"
                      {...register('wants_prayer')}
                    />
                    <Label htmlFor="wants_prayer" className="text-sm font-medium flex items-center space-x-1">
                      <Heart className="h-4 w-4" />
                      <span>Gostaria de receber oração</span>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="wants_growth_group"
                      {...register('wants_growth_group')}
                    />
                    <Label htmlFor="wants_growth_group" className="text-sm font-medium flex items-center space-x-1">
                      <BookOpen className="h-4 w-4" />
                      <span>Tenho interesse em participar de um grupo de crescimento</span>
                    </Label>
                  </div>
                </div>
              </div>

              {/* Botão de submissão */}
              <div className="pt-4">
                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Registrando...
                    </>
                  ) : (
                    'Registrar como Visitante'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RegistroVisitante;