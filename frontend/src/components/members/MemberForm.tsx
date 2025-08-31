import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import InputMask from 'react-input-mask';
import { 
  User, 
  Phone, 
  Heart, 
  Briefcase, 
  Save, 
  X, 
  MapPin,
  Shield,
  Users
} from 'lucide-react';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { 
  CreateMemberData, 
  Member, 
  MINISTERIAL_FUNCTION_CHOICES,
  MEMBERSHIP_STATUS_CHOICES
} from '@/services/membersService';
import { useAuth } from '@/hooks/useAuth';

// Schema de validação
const phoneRegex = /^\(\d{2}\) \d{4,5}-\d{4}$/;

const memberSchema = z.object({
  full_name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  cpf: z.string().optional(),
  rg: z.string().optional(),
  birth_date: z.string().min(1, 'Data de nascimento é obrigatória'),
  gender: z.enum(['M', 'F'], { required_error: 'Selecione o gênero' }),
  marital_status: z.string().optional(),
  
  // Campos do cônjuge
  spouse_name: z.string().optional(),
  spouse_is_member: z.boolean().optional(),
  spouse_member: z.number().optional(),
  
  // Dados familiares
  children_count: z.number().min(0, 'Quantidade de filhos deve ser 0 ou maior').optional(),
  
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  phone: z.string().optional().refine(
    (val) => !val || val === '' || phoneRegex.test(val),
    { message: 'Telefone deve estar no formato (XX) XXXXX-XXXX ou (XX) XXXX-XXXX' }
  ),
  phone_secondary: z.string().optional().refine(
    (val) => !val || val === '' || phoneRegex.test(val),
    { message: 'Telefone deve estar no formato (XX) XXXXX-XXXX ou (XX) XXXX-XXXX' }
  ),
  address: z.string().optional(),
  number: z.string().optional(),
  complement: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipcode: z.string().optional().refine(
    (val) => !val || val === '' || /^\d{5}-?\d{3}$/.test(val),
    { message: 'CEP deve estar no formato XXXXX-XXX' }
  ),
  membership_status: z.string().optional(),
  baptism_date: z.string().optional(),
  conversion_date: z.string().optional(),
  previous_church: z.string().optional(),
  transfer_letter: z.boolean().optional(),
  ministerial_function: z.string().optional(),
  ordination_date: z.string().optional(),
  profession: z.string().optional(),
  education_level: z.string().optional(),
  notes: z.string().optional(),
  accept_sms: z.boolean().optional(),
  accept_email: z.boolean().optional(),
  accept_whatsapp: z.boolean().optional(),
  // Campos de papel do sistema
  create_system_user: z.boolean().optional(),
  system_role: z.string().optional(),
  user_email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  user_password: z.string().optional(),
  
  // Novo campo para status ministerial inicial
  initial_ministerial_status: z.string().optional(),
  initial_status_reason: z.string().optional(),
});

type MemberFormData = z.infer<typeof memberSchema>;

interface MemberFormProps {
  member?: Member; // Para edição
  onSubmit: (data: CreateMemberData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  title?: string;
}

export const MemberForm: React.FC<MemberFormProps> = ({
  member,
  onSubmit,
  onCancel,
  isLoading = false,
  title = 'Novo Membro',
}) => {
  const { userChurch } = useAuth();
  // Simplificação temporária - remover hierarchy
  const availableRoles = [] as any[];
  const canAssignRoles = false;
  const rolesLoading = false;
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState('personal');

  const form = useForm<MemberFormData>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      full_name: member?.full_name || '',
      cpf: member?.cpf || '',
      rg: member?.rg || '',
      birth_date: member?.birth_date || '',
      gender: (member?.gender === 'M' || member?.gender === 'F' ? member?.gender : 'M') as 'M' | 'F',
      marital_status: member?.marital_status || 'single',
      
      // Campos do cônjuge
      spouse_name: member?.spouse_name || '',
      spouse_is_member: member?.spouse_is_member || false,
      spouse_member: member?.spouse_member || undefined,
      
      // Dados familiares
      children_count: member?.children_count || undefined,
      
      email: member?.email || '',
      phone: member?.phone || '',
      phone_secondary: member?.phone_secondary || '',
      address: member?.address || '',
      number: member?.number || '',
      complement: member?.complement || '',
      neighborhood: member?.neighborhood || '',
      city: member?.city || '',
      state: member?.state || '',
      zipcode: member?.zipcode || '',
      membership_status: member?.membership_status || 'active',
      baptism_date: member?.baptism_date || '',
      conversion_date: member?.conversion_date || '',
      previous_church: member?.previous_church || '',
      transfer_letter: member?.transfer_letter || false,
      ministerial_function: member?.ministerial_function || 'member',
      ordination_date: member?.ordination_date || '',
      profession: member?.profession || '',
      education_level: member?.education_level || '',
      notes: member?.notes || '',
      accept_sms: member?.accept_sms ?? true,
      accept_email: member?.accept_email ?? true,
      accept_whatsapp: member?.accept_whatsapp ?? true,
      // Campos de papel do sistema
      create_system_user: false,
      system_role: '',
      user_email: '',
      user_password: '',
      
      // Status ministerial inicial
      initial_ministerial_status: '',
      initial_status_reason: '',
    },
  });

  useEffect(() => {
    if (member?.photo) {
      setPhotoPreview(member.photo);
    }
  }, [member]);

  const handleSubmit = async (data: MemberFormData) => {
    try {
      console.log('🔍 MemberForm handleSubmit - userChurch:', userChurch);
      console.log('🔍 MemberForm handleSubmit - data recebida:', data);
      
      const formData: CreateMemberData = {
        church: userChurch?.id || 1, // Usar 1 como fallback para desenvolvimento
        full_name: data.full_name,
        birth_date: data.birth_date,
        gender: data.gender,
        cpf: data.cpf || undefined,
        rg: data.rg || undefined,
        marital_status: data.marital_status || undefined,
        
        // Campos do cônjuge
        spouse_name: data.spouse_name || undefined,
        spouse_is_member: data.spouse_is_member,
        spouse_member: data.spouse_member || undefined,
        
        // Dados familiares
        children_count: data.children_count || undefined,
        
        email: data.email || undefined,
        phone: data.phone || undefined,
        phone_secondary: data.phone_secondary || undefined,
        address: data.address || undefined,
        number: data.number || undefined,
        complement: data.complement || undefined,
        neighborhood: data.neighborhood || undefined,
        city: data.city || undefined,
        state: data.state || undefined,
        zipcode: data.zipcode || undefined,
        membership_status: data.membership_status || undefined,
        baptism_date: data.baptism_date || undefined,
        conversion_date: data.conversion_date || undefined,
        previous_church: data.previous_church || undefined,
        transfer_letter: data.transfer_letter || undefined,
        ministerial_function: data.ministerial_function || undefined,
        ordination_date: data.ordination_date || undefined,
        profession: data.profession || undefined,
        education_level: data.education_level || undefined,
        notes: data.notes || undefined,
        accept_sms: data.accept_sms,
        accept_email: data.accept_email,
        accept_whatsapp: data.accept_whatsapp,
        // Campos de papel do sistema
        create_system_user: data.create_system_user,
        system_role: data.system_role,
        user_email: data.user_email,
        user_password: data.user_password,
        
        // Status ministerial inicial
        initial_ministerial_status: data.initial_ministerial_status,
        initial_status_reason: data.initial_status_reason,
        
        // Foto
        photo: selectedPhoto || undefined,
      };
      
      console.log('📤 MemberForm - Dados finais enviados:', formData);
      
      await onSubmit(formData);
    } catch (error) {
      console.error('Erro ao salvar membro:', error);
    }
  };

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedPhoto(file); // Armazenar o arquivo
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Função para formatar telefone
  const formatPhone = (value: string): string => {
    // Remove tudo que não é dígito
    const numbers = value.replace(/\D/g, '');
    
    // Limita a 11 dígitos
    const limitedNumbers = numbers.slice(0, 11);
    
    // Aplica a máscara baseada no tamanho
    if (limitedNumbers.length <= 2) {
      return limitedNumbers;
    } else if (limitedNumbers.length <= 6) {
      return limitedNumbers.replace(/(\d{2})(\d{0,4})/, '($1) $2');
    } else if (limitedNumbers.length <= 10) {
      return limitedNumbers.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
    } else {
      return limitedNumbers.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
    }
  };

  // Handler para campos de telefone
  const handlePhoneChange = (field: 'phone' | 'phone_secondary') => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = event.target.value;
    const formattedValue = formatPhone(value);
    form.setValue(field, formattedValue);
  };

  // Função para formatar CPF
  const formatCPF = (value: string): string => {
    // Remove tudo que não é dígito
    const numbers = value.replace(/\D/g, '');
    
    // Limita a 11 dígitos
    const limitedNumbers = numbers.slice(0, 11);
    
    // Aplica a máscara
    if (limitedNumbers.length <= 3) {
      return limitedNumbers;
    } else if (limitedNumbers.length <= 6) {
      return limitedNumbers.replace(/(\d{3})(\d{0,3})/, '$1.$2');
    } else if (limitedNumbers.length <= 9) {
      return limitedNumbers.replace(/(\d{3})(\d{3})(\d{0,3})/, '$1.$2.$3');
    } else {
      return limitedNumbers.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, '$1.$2.$3-$4');
    }
  };

  // Handler para CPF
  const handleCPFChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    const formattedValue = formatCPF(value);
    form.setValue('cpf', formattedValue);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          <p className="text-gray-600 mt-1">
            {member ? 'Edite as informações do membro' : 'Preencha os dados do novo membro'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button 
            onClick={form.handleSubmit(handleSubmit)}
            disabled={isLoading}
          >
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="personal" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Dados Pessoais
              </TabsTrigger>
              <TabsTrigger value="contact" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Contato
              </TabsTrigger>
              <TabsTrigger value="church" className="flex items-center gap-2">
                <Heart className="h-4 w-4" />
                Dados Eclesiásticos
              </TabsTrigger>
              <TabsTrigger value="ministerial" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Status Ministerial
              </TabsTrigger>
              <TabsTrigger value="additional" className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Informações Adicionais
              </TabsTrigger>
            </TabsList>

            {/* Dados Pessoais */}
            <TabsContent value="personal" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Informações Pessoais
                  </CardTitle>
                  <CardDescription>
                    Dados básicos de identificação do membro
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Foto */}
                  <div className="flex items-center gap-4">
                    <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-hidden">
                      {photoPreview ? (
                        <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <User className="h-8 w-8 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <Label htmlFor="photo">Foto do Membro</Label>
                      <Input
                        id="photo"
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoChange}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="full_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome Completo *</FormLabel>
                          <FormControl>
                            <Input placeholder="Nome completo do membro" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="birth_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data de Nascimento *</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="cpf"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CPF</FormLabel>
                          <FormControl>
                            <Input placeholder="000.000.000-00" {...field} onChange={handleCPFChange} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="rg"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>RG</FormLabel>
                          <FormControl>
                            <Input placeholder="00.000.000-0" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="gender"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Gênero *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o gênero" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="M">Masculino</SelectItem>
                              <SelectItem value="F">Feminino</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="marital_status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Estado Civil</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o estado civil" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="single">Solteiro(a)</SelectItem>
                              <SelectItem value="married">Casado(a)</SelectItem>
                              <SelectItem value="divorced">Divorciado(a)</SelectItem>
                              <SelectItem value="widowed">Viúvo(a)</SelectItem>
                              <SelectItem value="other">Outro</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Campos do cônjuge - só aparece se estado civil for casado */}
                  {form.watch('marital_status') === 'married' && (
                    <div className="mt-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
                      <h4 className="text-lg font-medium mb-4 flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Informações do Cônjuge
                      </h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="spouse_name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nome do Cônjuge</FormLabel>
                              <FormControl>
                                <Input placeholder="Nome completo do cônjuge" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="spouse_is_member"
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
                                  Cônjuge é membro da igreja?
                                </FormLabel>
                                <FormDescription>
                                  Marque se o cônjuge também é membro desta igreja
                                </FormDescription>
                              </div>
                            </FormItem>
                          )}
                        />

                        {/* Campo para selecionar o cônjuge se for membro */}
                        {form.watch('spouse_is_member') && (
                          <FormField
                            control={form.control}
                            name="spouse_member"
                            render={({ field }) => (
                              <FormItem className="md:col-span-2">
                                <FormLabel>Selecionar Cônjuge Membro</FormLabel>
                                <Select onValueChange={(value) => field.onChange(Number(value))} defaultValue={field.value?.toString()}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Selecione o cônjuge da lista de membros" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {/* TODO: Implementar lista de membros disponíveis */}
                                    <SelectItem value="0">Selecione um membro...</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormDescription>
                                  Selecione o cônjuge da lista de membros cadastrados
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Campo Quantidade de Filhos */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900 flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Informações Familiares
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="children_count"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Quantidade de Filhos</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                placeholder="0"
                                {...field}
                                onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                                value={field.value || ''}
                              />
                            </FormControl>
                            <FormDescription>
                              Número de filhos (opcional)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Contato */}
            <TabsContent value="contact" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="h-5 w-5" />
                    Informações de Contato
                  </CardTitle>
                  <CardDescription>
                    Dados para comunicação com o membro
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>E-mail</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="email@exemplo.com" {...field} />
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
                          <FormLabel>Telefone Principal</FormLabel>
                          <FormControl>
                            <Input placeholder="(11) 99999-9999" {...field} onChange={handlePhoneChange('phone')} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phone_secondary"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telefone Secundário</FormLabel>
                          <FormControl>
                            <Input placeholder="(11) 99999-9999" {...field} onChange={handlePhoneChange('phone_secondary')} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Endereço */}
                  <div className="space-y-4">
                    <h4 className="font-medium flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Endereço
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <FormField
                        control={form.control}
                        name="zipcode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>CEP</FormLabel>
                            <FormControl>
                              <InputMask
                                mask="99999-999"
                                value={field.value || ''}
                                onChange={field.onChange}
                                onBlur={field.onBlur}
                              >
                                {(inputProps: any) => (
                                  <Input placeholder="00000-000" {...inputProps} />
                                )}
                              </InputMask>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>Endereço</FormLabel>
                            <FormControl>
                              <Input placeholder="Rua, Avenida..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="number"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Número</FormLabel>
                            <FormControl>
                              <Input placeholder="123" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="complement"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Complemento</FormLabel>
                            <FormControl>
                              <Input placeholder="Apto 101, Bloco A..." {...field} />
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
                            <FormLabel>Bairro</FormLabel>
                            <FormControl>
                              <Input placeholder="Bairro" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cidade</FormLabel>
                            <FormControl>
                              <Input placeholder="Cidade" {...field} />
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
                            <FormLabel>Estado</FormLabel>
                            <FormControl>
                              <Input placeholder="SP" maxLength={2} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Preferências de Contato */}
                  <div className="space-y-4">
                    <h4 className="font-medium">Preferências de Contato</h4>
                    <div className="flex flex-wrap gap-4">
                      <FormField
                        control={form.control}
                        name="accept_email"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Aceita E-mail</FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="accept_sms"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Aceita SMS</FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="accept_whatsapp"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Aceita WhatsApp</FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Dados Eclesiásticos */}
            <TabsContent value="church" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5" />
                    Dados Eclesiásticos
                  </CardTitle>
                  <CardDescription>
                    Informações sobre a vida espiritual do membro
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="membership_status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status de Membresia</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Status da membresia" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="active">Ativo</SelectItem>
                              <SelectItem value="inactive">Inativo</SelectItem>
                              <SelectItem value="transferred">Transferido</SelectItem>
                              <SelectItem value="deceased">Falecido</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="ministerial_function"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Função Ministerial</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Função na igreja" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="member">Membro</SelectItem>
                              <SelectItem value="deacon">Diácono</SelectItem>
                              <SelectItem value="deaconess">Diaconisa</SelectItem>
                              <SelectItem value="elder">Presbítero</SelectItem>
                              <SelectItem value="evangelist">Evangelista</SelectItem>
                              <SelectItem value="pastor">Pastor</SelectItem>
                              <SelectItem value="missionary">Missionário</SelectItem>
                              <SelectItem value="leader">Líder</SelectItem>
                              <SelectItem value="cooperator">Cooperador</SelectItem>
                              <SelectItem value="auxiliary">Auxiliar</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="conversion_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data de Conversão</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="baptism_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data do Batismo</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="ordination_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data de Ordenação</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormDescription>
                            Apenas para funções ministeriais
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="previous_church"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Igreja Anterior</FormLabel>
                          <FormControl>
                            <Input placeholder="Nome da igreja anterior" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="transfer_letter"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Possui Carta de Transferência</FormLabel>
                          <FormDescription>
                            Marque se o membro veio com carta de transferência
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Acesso ao Sistema */}
              {canAssignRoles && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Acesso ao Sistema
                    </CardTitle>
                    <CardDescription>
                      Configure o acesso deste membro ao sistema de gestão
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="create_system_user"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Criar usuário do sistema</FormLabel>
                            <FormDescription>
                              Permite que este membro acesse o sistema de gestão
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />

                    {form.watch('create_system_user') && (
                      <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                        <h4 className="font-medium flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Configurações de Acesso
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="system_role"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Papel no Sistema</FormLabel>
                                <Select 
                                  onValueChange={field.onChange} 
                                  defaultValue={field.value}
                                  disabled={rolesLoading}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder={
                                        rolesLoading 
                                          ? "Carregando papéis..." 
                                          : "Selecione o papel"
                                      } />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {availableRoles.map((role) => (
                                      <SelectItem key={role.value} value={role.value}>
                                        <div className="flex flex-col">
                                          <span className="font-medium">{role.label}</span>
                                          <span className="text-xs text-gray-500">{role.description}</span>
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormDescription>
                                  Define as permissões do usuário no sistema
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="user_email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>E-mail para Login</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="email" 
                                    placeholder="email@exemplo.com" 
                                    {...field} 
                                  />
                                </FormControl>
                                <FormDescription>
                                  E-mail que será usado para fazer login no sistema
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name="user_password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Senha Inicial</FormLabel>
                              <FormControl>
                                <Input 
                                  type="password" 
                                  placeholder="Digite uma senha inicial" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormDescription>
                                Senha inicial para acesso. O usuário poderá alterá-la posteriormente.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {form.watch('system_role') && (
                          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <h5 className="font-medium text-blue-900 mb-2">
                              Papel Selecionado: {availableRoles.find(r => r.value === form.watch('system_role'))?.label}
                            </h5>
                            <p className="text-sm text-blue-700">
                              {availableRoles.find(r => r.value === form.watch('system_role'))?.description}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            
            {/* Status Ministerial */}
            <TabsContent value="ministerial" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Status Ministerial Inicial
                  </CardTitle>
                  <CardDescription>
                    Define a função ministerial inicial do membro (pode ser alterada posteriormente)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="initial_ministerial_status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Função Ministerial Inicial</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione a função" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {MINISTERIAL_FUNCTION_CHOICES.map((choice) => (
                                <SelectItem key={choice.value} value={choice.value}>
                                  {choice.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Se não selecionado, será definido como "Membro"
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="initial_status_reason"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Observações sobre o Status Inicial</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Adicione observações sobre a função ministerial inicial..."
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Informações sobre o motivo da atribuição desta função ministerial
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">ℹ️ Sobre o Status Ministerial</h4>
                    <div className="text-sm text-blue-700 space-y-1">
                      <p>• O status ministerial pode ser alterado posteriormente através do histórico</p>
                      <p>• Cada mudança será registrada com data e motivo</p>
                      <p>• Apenas usuários com permissão podem alterar status ministeriais</p>
                      <p>• Funções como Pastor e Presbítero podem requerer ordenação</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Informações Adicionais */}
            <TabsContent value="additional" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5" />
                    Informações Adicionais
                  </CardTitle>
                  <CardDescription>
                    Dados complementares sobre o membro
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="profession"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Profissão</FormLabel>
                          <FormControl>
                            <Input placeholder="Profissão do membro" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="education_level"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Escolaridade</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Nível de escolaridade" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="elementary_incomplete">Fundamental Incompleto</SelectItem>
                              <SelectItem value="elementary_complete">Fundamental Completo</SelectItem>
                              <SelectItem value="high_school_incomplete">Médio Incompleto</SelectItem>
                              <SelectItem value="high_school_complete">Médio Completo</SelectItem>
                              <SelectItem value="higher_incomplete">Superior Incompleto</SelectItem>
                              <SelectItem value="higher_complete">Superior Completo</SelectItem>
                              <SelectItem value="postgraduate">Pós-graduação</SelectItem>
                              <SelectItem value="masters">Mestrado</SelectItem>
                              <SelectItem value="doctorate">Doutorado</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Observações</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Observações gerais sobre o membro..."
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Informações adicionais relevantes sobre o membro
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </form>
      </Form>
    </div>
  );
}; 