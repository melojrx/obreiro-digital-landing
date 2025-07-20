import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Save, User, Phone, Mail, MapPin, Heart, Users, Calendar } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { createVisitor } from '@/services/visitorsService';

const newVisitorSchema = z.object({
  full_name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string()
    .optional()
    .or(z.literal(''))
    .refine((val) => {
      if (!val) return true; // Campo opcional
      // Aceitar formato (11) 99999-9999 ou (11) 9999-9999
      const phoneRegex = /^\(\d{2}\)\s\d{4,5}-\d{4}$/;
      return phoneRegex.test(val);
    }, 'Telefone deve estar no formato: (11) 99999-9999'),
  birth_date: z.string().optional(),
  gender: z.enum(['M', 'F']).optional(),
  marital_status: z.enum(['single', 'married', 'divorced', 'widowed', 'other']).optional(),
  city: z.string().min(2, 'Cidade deve ter pelo menos 2 caracteres'),
  state: z.string().length(2, 'Estado deve ter 2 caracteres'),
  address: z.string().optional(),
  neighborhood: z.string().optional(),
  first_visit: z.boolean().default(true),
  how_found_us: z.string().optional(),
  wants_prayer: z.boolean().default(false),
  prayer_requests: z.string().optional(),
  wants_growth_group: z.boolean().default(false),
  ministry_interest: z.string().optional(),
  follow_up_status: z.enum(['pending', 'contacted', 'interested', 'not_interested']).default('pending'),
  follow_up_notes: z.string().optional(),
});

type NewVisitorFormData = z.infer<typeof newVisitorSchema>;

const NovoVisitante: React.FC = () => {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid }
  } = useForm<NewVisitorFormData>({
    resolver: zodResolver(newVisitorSchema),
    defaultValues: {
      first_visit: true,
      wants_prayer: false,
      wants_growth_group: false,
      follow_up_status: 'pending',
    },
    mode: 'onChange'
  });

  const wantsPrayer = watch('wants_prayer');
  const wantsGrowthGroup = watch('wants_growth_group');

  // Função para formatar telefone automaticamente
  const formatPhone = (value: string) => {
    // Remove tudo que não é dígito
    const cleaned = value.replace(/\D/g, '');
    
    // Aplica máscara baseada no tamanho
    if (cleaned.length <= 2) {
      return cleaned;
    } else if (cleaned.length <= 6) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
    } else if (cleaned.length <= 10) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
    } else {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7, 11)}`;
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setValue('phone', formatted);
  };

  const onSubmit = async (data: NewVisitorFormData) => {
    try {
      setSaving(true);
      
      // Formatear dados para o backend
      const formattedData = {
        ...data,
      };

      // Remover campos undefined/empty para não causar erro
      Object.keys(formattedData).forEach(key => {
        if (formattedData[key as keyof typeof formattedData] === undefined || 
            formattedData[key as keyof typeof formattedData] === '') {
          delete formattedData[key as keyof typeof formattedData];
        }
      });

      await createVisitor(formattedData);
      toast.success('Visitante cadastrado com sucesso!');
      navigate('/visitantes');
    } catch (error) {
      console.error('Erro ao cadastrar visitante:', error);
      toast.error('Erro ao cadastrar visitante. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate('/visitantes')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Visitantes
          </Button>
        </div>

        <div>
          <h1 className="text-3xl font-bold text-gray-900">Novo Visitante</h1>
          <p className="text-gray-600 mt-1">
            Cadastre um novo visitante manualmente no sistema
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Informações Pessoais */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informações Pessoais
              </CardTitle>
              <CardDescription>
                Dados básicos do visitante
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="full_name">Nome Completo *</Label>
                  <Input
                    id="full_name"
                    {...register('full_name')}
                    placeholder="Digite o nome completo"
                    className={errors.full_name ? 'border-red-500' : ''}
                  />
                  {errors.full_name && (
                    <p className="text-sm text-red-500 mt-1">{errors.full_name.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="birth_date">Data de Nascimento</Label>
                  <Input
                    id="birth_date"
                    type="date"
                    {...register('birth_date')}
                    max={new Date().toISOString().split('T')[0]} // Não pode ser data futura
                  />
                  {errors.birth_date && (
                    <p className="text-sm text-red-500 mt-1">{errors.birth_date.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="gender">Gênero</Label>
                  <Select onValueChange={(value) => setValue('gender', value as 'M' | 'F')}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o gênero" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="M">Masculino</SelectItem>
                      <SelectItem value="F">Feminino</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="marital_status">Estado Civil</Label>
                  <Select onValueChange={(value) => setValue('marital_status', value as any)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o estado civil" />
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
              </div>
            </CardContent>
          </Card>

          {/* Contato */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Informações de Contato
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    {...register('email')}
                    placeholder="exemplo@email.com"
                    className={errors.email ? 'border-red-500' : ''}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={watch('phone') || ''}
                    onChange={handlePhoneChange}
                    placeholder="(11) 99999-9999"
                    maxLength={15}
                    className={errors.phone ? 'border-red-500' : ''}
                  />
                  {errors.phone && (
                    <p className="text-sm text-red-500 mt-1">{errors.phone.message}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Localização */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Localização
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">Cidade *</Label>
                  <Input
                    id="city"
                    {...register('city')}
                    placeholder="Digite a cidade"
                    className={errors.city ? 'border-red-500' : ''}
                  />
                  {errors.city && (
                    <p className="text-sm text-red-500 mt-1">{errors.city.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="state">Estado *</Label>
                  <Input
                    id="state"
                    {...register('state')}
                    placeholder="SP"
                    maxLength={2}
                    className={errors.state ? 'border-red-500' : ''}
                  />
                  {errors.state && (
                    <p className="text-sm text-red-500 mt-1">{errors.state.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="neighborhood">Bairro</Label>
                  <Input
                    id="neighborhood"
                    {...register('neighborhood')}
                    placeholder="Digite o bairro"
                  />
                </div>

                <div>
                  <Label htmlFor="address">Endereço</Label>
                  <Input
                    id="address"
                    {...register('address')}
                    placeholder="Rua, número, complemento"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Informações da Visita */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Informações da Visita
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="first_visit">É a primeira visita?</Label>
                  <p className="text-sm text-gray-500">Marque se esta é a primeira vez que a pessoa visita a igreja</p>
                </div>
                <Switch
                  id="first_visit"
                  checked={watch('first_visit')}
                  onCheckedChange={(checked) => setValue('first_visit', checked)}
                />
              </div>

              <div>
                <Label htmlFor="how_found_us">Como nos conheceu?</Label>
                <Input
                  id="how_found_us"
                  {...register('how_found_us')}
                  placeholder="Ex: Amigo, internet, passando na rua..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Interesses */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5" />
                Interesses e Necessidades
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="wants_prayer">Pedido de Oração</Label>
                    <p className="text-sm text-gray-500">A pessoa tem algum pedido de oração?</p>
                  </div>
                  <Switch
                    id="wants_prayer"
                    checked={wantsPrayer}
                    onCheckedChange={(checked) => setValue('wants_prayer', checked)}
                  />
                </div>

                {wantsPrayer && (
                  <div>
                    <Label htmlFor="prayer_requests">Pedidos de Oração</Label>
                    <Textarea
                      id="prayer_requests"
                      {...register('prayer_requests')}
                      placeholder="Descreva os pedidos de oração..."
                      rows={3}
                    />
                  </div>
                )}

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="wants_growth_group">Interesse em Grupo de Crescimento</Label>
                    <p className="text-sm text-gray-500">A pessoa tem interesse em participar de grupos?</p>
                  </div>
                  <Switch
                    id="wants_growth_group"
                    checked={wantsGrowthGroup}
                    onCheckedChange={(checked) => setValue('wants_growth_group', checked)}
                  />
                </div>

                <div>
                  <Label htmlFor="ministry_interest">Interesse em Ministérios</Label>
                  <Input
                    id="ministry_interest"
                    {...register('ministry_interest')}
                    placeholder="Ex: Louvor, ensino, crianças, jovens..."
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Acompanhamento */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Status de Acompanhamento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="follow_up_status">Status Inicial</Label>
                <Select 
                  defaultValue="pending"
                  onValueChange={(value) => setValue('follow_up_status', value as any)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="contacted">Contatado</SelectItem>
                    <SelectItem value="interested">Interessado</SelectItem>
                    <SelectItem value="not_interested">Não Interessado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="follow_up_notes">Observações</Label>
                <Textarea
                  id="follow_up_notes"
                  {...register('follow_up_notes')}
                  placeholder="Observações sobre o visitante ou acompanhamento..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Botões de Ação */}
          <div className="flex gap-3 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/visitantes')}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!isValid || saving}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Cadastrar Visitante
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
};

export default NovoVisitante;